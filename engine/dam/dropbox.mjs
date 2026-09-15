// Dropbox connector — REST only, no SDK. Refresh-token auth (the only kind that survives a worker
// running for weeks), cursor listing, longpoll, temporary links and streamed downloads to disk (a
// video is never held in memory: the legacy DAM's OOM loop came from exactly that).
import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { EngineError } from "../core/errors.mjs";
import { sleep } from "../core/http.mjs";

const API = "https://api.dropboxapi.com/2";
const CONTENT = "https://content.dropboxapi.com/2";
const NOTIFY = "https://notify.dropboxapi.com/2";

/** JSON for the Dropbox-API-Arg header: HTTP headers are Latin-1, so non-ASCII becomes \uXXXX escapes. */
export function headerJson(value) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`);
}

export class DropboxClient {
  constructor({ appKey, appSecret, refreshToken, accessToken, pathRootNamespaceId, selectUser, fetchImpl = fetch } = {}) {
    this.appKey = appKey;
    this.appSecret = appSecret;
    this.refreshToken = refreshToken;
    this.accessToken = accessToken || null;
    this.expiresAt = accessToken ? Date.now() + 3_600_000 : 0;
    this.pathRootNamespaceId = pathRootNamespaceId || null;
    this.selectUser = selectUser || null;
    this.fetch = fetchImpl;
  }

  static fromEnv(env = process.env) {
    if (!env.DROPBOX_REFRESH_TOKEN && !env.DROPBOX_ACCESS_TOKEN) {
      throw new EngineError("MISSING_CREDENTIAL", "Set DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET (recommended) or DROPBOX_ACCESS_TOKEN.");
    }
    // A refresh token always wins: a copied access token is usually already expired, and only rpc() knows how to recover from a 401.
    const refreshToken = env.DROPBOX_REFRESH_TOKEN || null;
    return new DropboxClient({ appKey: env.DROPBOX_APP_KEY, appSecret: env.DROPBOX_APP_SECRET, refreshToken, accessToken: refreshToken ? null : env.DROPBOX_ACCESS_TOKEN, pathRootNamespaceId: env.DROPBOX_PATH_ROOT_NAMESPACE_ID || null, selectUser: env.DROPBOX_SELECT_USER || null });
  }

  async token() {
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) return this.accessToken;
    if (!this.refreshToken) {
      if (this.accessToken) return this.accessToken;
      throw new EngineError("DROPBOX_AUTH", "No Dropbox access token and no refresh token.");
    }
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: this.refreshToken, client_id: this.appKey, client_secret: this.appSecret });
    const response = await this.fetch("https://api.dropboxapi.com/oauth2/token", { method: "POST", body });
    if (!response.ok) throw new EngineError("DROPBOX_AUTH", `Dropbox token refresh failed: HTTP ${response.status}`);
    const data = await response.json();
    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in || 14_400) * 1000;
    return this.accessToken;
  }

  headers(extra = {}) {
    const headers = { ...extra };
    if (this.pathRootNamespaceId) headers["Dropbox-API-Path-Root"] = JSON.stringify({ ".tag": "namespace_id", namespace_id: this.pathRootNamespaceId });
    if (this.selectUser) headers["Dropbox-API-Select-User"] = this.selectUser;
    return headers;
  }

  async rpc(endpoint, body, { base = API, attempts = 4 } = {}) {
    let last;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const token = await this.token();
      const response = await this.fetch(`${base}${endpoint}`, { method: "POST", headers: this.headers({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), body: JSON.stringify(body ?? null) });
      if (response.ok) return response.json();
      const text = await response.text();
      if (response.status === 401) { this.accessToken = null; this.expiresAt = 0; }
      if (response.status === 429 || response.status >= 500 || response.status === 401) {
        const retryAfter = Number(response.headers.get("retry-after")) || 2 ** attempt;
        last = new EngineError("DROPBOX_HTTP", `Dropbox ${endpoint} HTTP ${response.status}: ${text.slice(0, 300)}`);
        await sleep(Math.min(retryAfter * 1000, 60_000));
        continue;
      }
      throw new EngineError("DROPBOX_HTTP", `Dropbox ${endpoint} HTTP ${response.status}: ${text.slice(0, 300)}`);
    }
    throw last;
  }

  /** One page of entries. `cursor` continues a previous listing (incremental sync). */
  async listFolder({ path: folder, cursor = undefined, recursive = true }) {
    const data = cursor
      ? await this.rpc("/files/list_folder/continue", { cursor })
      : await this.rpc("/files/list_folder", { path: folder === "/" ? "" : folder, recursive, include_deleted: true, include_non_downloadable_files: false, include_media_info: true, limit: 2000 });
    return { entries: data.entries || [], cursor: data.cursor, hasMore: Boolean(data.has_more) };
  }

  /** Walk every page for a root (or continue from a cursor). Yields normalised entries. */
  async *walk({ path: folder, cursor = undefined }) {
    let next = cursor;
    let first = !cursor;
    do {
      const page = first ? await this.listFolder({ path: folder }) : await this.listFolder({ cursor: next });
      first = false;
      next = page.cursor;
      for (const entry of page.entries) yield normalizeEntry(entry);
      yield { type: "cursor", cursor: next };
      if (!page.hasMore) break;
    } while (true);
  }

  /** Blocks up to `timeout` seconds until the cursor has changes. Returns {changes, backoff}. */
  async longpoll(cursor, timeout = 300) {
    const response = await this.fetch(`${NOTIFY}/files/list_folder/longpoll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cursor, timeout: Math.max(30, Math.min(480, timeout)) }) });
    if (!response.ok) throw new EngineError("DROPBOX_HTTP", `longpoll HTTP ${response.status}`);
    const data = await response.json();
    return { changes: Boolean(data.changes), backoff: data.backoff || 0 };
  }

  async temporaryLink(dropboxPath) {
    const data = await this.rpc("/files/get_temporary_link", { path: dropboxPath });
    return data.link;
  }

  /** Stream a file to disk. Never buffers the body. Returns bytes written. */
  async downloadToFile(dropboxPath, destination, { maxBytes = Infinity } = {}) {
    const token = await this.token();
    const response = await this.fetch(`${CONTENT}/files/download`, { method: "POST", headers: this.headers({ Authorization: `Bearer ${token}`, "Dropbox-API-Arg": headerJson({ path: dropboxPath }) }) });
    if (!response.ok) throw new EngineError("DROPBOX_HTTP", `download HTTP ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const length = Number(response.headers.get("content-length")) || 0;
    if (length > maxBytes) throw new EngineError("DROPBOX_TOO_LARGE", `${dropboxPath} is ${length} bytes, over the ${maxBytes} cap.`);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination));
    return fs.statSync(destination).size;
  }

  /** Dropbox-side thumbnail (cheap; no full download). Returns a Buffer (JPEG). */
  async thumbnail(dropboxPath, size = "w640h480") {
    const token = await this.token();
    const response = await this.fetch(`${CONTENT}/files/get_thumbnail_v2`, { method: "POST", headers: this.headers({ Authorization: `Bearer ${token}`, "Dropbox-API-Arg": headerJson({ resource: { ".tag": "path", path: dropboxPath }, format: "jpeg", size, mode: "bestfit" }) }) });
    if (!response.ok) throw new EngineError("DROPBOX_HTTP", `thumbnail HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
}

/** Dimensions/duration Dropbox already knows for photos and videos (no download needed). */
export function mediaInfo(entry) {
  const meta = entry.media_info?.metadata;
  if (!meta) return null;
  return { kind: meta[".tag"] || null, width: meta.dimensions?.width || null, height: meta.dimensions?.height || null, durationS: meta.duration ? meta.duration / 1000 : null, timeTaken: meta.time_taken || null };
}

export function normalizeEntry(entry) {
  const tag = entry[".tag"];
  if (tag === "deleted") return { type: "deleted", path: entry.path_display || entry.path_lower, name: entry.name };
  if (tag === "folder") return { type: "folder", path: entry.path_display || entry.path_lower, name: entry.name, id: entry.id };
  return {
    type: "file",
    id: entry.id,
    path: entry.path_display || entry.path_lower,
    pathLower: entry.path_lower,
    name: entry.name,
    bytes: entry.size,
    modifiedAt: entry.server_modified || entry.client_modified,
    contentHash: entry.content_hash || null,   // Dropbox's own block hash — enough to skip unchanged files
    rev: entry.rev,
    media: mediaInfo(entry),
  };
}
