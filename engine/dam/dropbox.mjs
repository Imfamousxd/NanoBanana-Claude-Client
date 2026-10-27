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
  constructor({ appKey, appSecret, refreshToken, accessToken, pathRootNamespaceId, selectUser, fetchImpl = fetch, timeouts = {}, sleepImpl = sleep } = {}) {
    this.appKey = appKey;
    this.appSecret = appSecret;
    this.refreshToken = refreshToken;
    this.accessToken = accessToken || null;
    this.expiresAt = accessToken ? Date.now() + 3_600_000 : 0;
    this.pathRootNamespaceId = pathRootNamespaceId || null;
    this.selectUser = selectUser || null;
    this.fetch = fetchImpl;
    this.sleep = sleepImpl;
    // Deadlines (ms unless noted). Every request has one; DAM_DROPBOX_*_TIMEOUT_S override them.
    this.timeouts = { rpcMs: 60_000, contentMs: 90_000, downloadMs: 30 * 60_000, longpollMarginS: 120, ...timeouts };
  }

  static fromEnv(env = process.env) {
    if (!env.DROPBOX_REFRESH_TOKEN && !env.DROPBOX_ACCESS_TOKEN) {
      throw new EngineError("MISSING_CREDENTIAL", "Set DROPBOX_REFRESH_TOKEN + DROPBOX_APP_KEY + DROPBOX_APP_SECRET (recommended) or DROPBOX_ACCESS_TOKEN.");
    }
    // A refresh token always wins: a copied access token is usually already expired, and only rpc() knows how to recover from a 401.
    const refreshToken = env.DROPBOX_REFRESH_TOKEN || null;
    const seconds = (key) => (env[key] ? Number(env[key]) * 1000 : undefined);
    const timeouts = Object.fromEntries(Object.entries({ rpcMs: seconds("DAM_DROPBOX_RPC_TIMEOUT_S"), contentMs: seconds("DAM_DROPBOX_CONTENT_TIMEOUT_S"), downloadMs: seconds("DAM_DROPBOX_DOWNLOAD_TIMEOUT_S") }).filter(([, value]) => value));
    return new DropboxClient({ appKey: env.DROPBOX_APP_KEY, appSecret: env.DROPBOX_APP_SECRET, refreshToken, accessToken: refreshToken ? null : env.DROPBOX_ACCESS_TOKEN, pathRootNamespaceId: env.DROPBOX_PATH_ROOT_NAMESPACE_ID || null, selectUser: env.DROPBOX_SELECT_USER || null, timeouts });
  }

  async token() {
    if (this.accessToken && Date.now() < this.expiresAt - 60_000) return this.accessToken;
    if (!this.refreshToken) {
      if (this.accessToken) return this.accessToken;
      throw new EngineError("DROPBOX_AUTH", "No Dropbox access token and no refresh token.");
    }
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: this.refreshToken, client_id: this.appKey, client_secret: this.appSecret });
    const response = await this.request("https://api.dropboxapi.com/oauth2/token", { method: "POST", body }, this.timeouts.rpcMs, "token refresh");
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

  /**
   * Every Dropbox HTTP call goes through here: one AbortController deadline that covers the headers AND the
   * body (the signal stays armed until the caller has consumed the response). A call that hangs becomes a
   * DROPBOX_TIMEOUT error instead of a worker that stops forever (2026-09-27: the hosted worker hung on a
   * call with no deadline and indexed nothing for a month).
   */
  async request(url, init, timeoutMs, label = url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DropboxTimeout(`Dropbox ${label} exceeded its ${Math.round(timeoutMs / 1000)}s deadline`)), timeoutMs);
    try {
      const response = await this.fetch(url, { ...init, signal: controller.signal });
      // Keep the deadline armed while the body is read; release it once it has been consumed (or on error).
      return wrapBody(response, () => clearTimeout(timer), controller);
    } catch (error) {
      clearTimeout(timer);
      if (controller.signal.aborted) throw controller.signal.reason instanceof Error ? controller.signal.reason : new DropboxTimeout(`Dropbox ${label} timed out`);
      throw new EngineError("DROPBOX_NETWORK", `Dropbox ${label}: ${error?.cause?.code || error?.message || error}`);
    }
  }

  async rpc(endpoint, body, { base = API, attempts = 4, timeoutMs = this.timeouts.rpcMs } = {}) {
    let last;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      let response;
      try {
        const token = await this.token();
        response = await this.request(`${base}${endpoint}`, { method: "POST", headers: this.headers({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }), body: JSON.stringify(body ?? null) }, timeoutMs, endpoint);
      } catch (error) {
        // Network failures and deadlines are transient: retry with backoff like a 5xx.
        if (!(error instanceof DropboxTimeout) && error?.code !== "DROPBOX_NETWORK") throw error;
        last = error;
        await this.sleep(Math.min(2 ** attempt * 1000, 30_000));
        continue;
      }
      if (response.ok) return response.json();
      const text = await response.text();
      if (response.status === 401) { this.accessToken = null; this.expiresAt = 0; }
      if (response.status === 429 || response.status >= 500 || response.status === 401) {
        const retryAfter = Number(response.headers.get("retry-after")) || 2 ** attempt;
        last = new DropboxApiError(endpoint, response.status, text);
        await this.sleep(Math.min(retryAfter * 1000, 60_000));
        continue;
      }
      throw new DropboxApiError(endpoint, response.status, text);
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
      yield { type: "cursor", cursor: next, hasMore: page.hasMore };
      if (!page.hasMore) break;
    } while (true);
  }

  /** Metadata for one path, or null when it does not exist. */
  async getMetadata(dropboxPath) {
    try { return await this.rpc("/files/get_metadata", { path: dropboxPath }, { attempts: 3 }); }
    catch (error) { if (error instanceof DropboxApiError && error.notFound) return null; throw error; }
  }

  /** The direct children of a folder (one level, every page). Folders only when foldersOnly. */
  async children(dropboxPath, { foldersOnly = true } = {}) {
    const out = [];
    let data = await this.rpc("/files/list_folder", { path: dropboxPath === "/" ? "" : dropboxPath, recursive: false, limit: 2000 });
    for (;;) {
      for (const entry of data.entries || []) if (!foldersOnly || entry[".tag"] === "folder") out.push({ name: entry.name, path: entry.path_display || entry.path_lower, tag: entry[".tag"] });
      if (!data.has_more) break;
      data = await this.rpc("/files/list_folder/continue", { cursor: data.cursor });
    }
    return out;
  }

  /** Folders anywhere in the Dropbox whose name matches `name` (Dropbox search; file names only). */
  async searchFolders(name, { max = 50 } = {}) {
    const data = await this.rpc("/files/search_v2", { query: name, options: { filename_only: true, max_results: max, file_categories: [{ ".tag": "folder" }] } });
    return (data.matches || []).map((match) => match.metadata?.metadata).filter((meta) => meta && meta[".tag"] === "folder").map((meta) => ({ name: meta.name, path: meta.path_display || meta.path_lower }));
  }

  /**
   * Blocks up to `timeout` seconds until the cursor has changes. Returns {changes, backoff}. Dropbox adds up
   * to 90 s of jitter to the requested timeout, so the deadline is the timeout plus a margin. A 409 means the
   * cursor is no longer valid (`reset`): it surfaces as a DropboxApiError with reset=true.
   */
  async longpoll(cursor, timeout = 300) {
    const seconds = Math.max(30, Math.min(480, timeout));
    const response = await this.request(`${NOTIFY}/files/list_folder/longpoll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cursor, timeout: seconds }) }, (seconds + this.timeouts.longpollMarginS) * 1000, "longpoll");
    if (!response.ok) throw new DropboxApiError("/files/list_folder/longpoll", response.status, await response.text());
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
    const response = await this.request(`${CONTENT}/files/download`, { method: "POST", headers: this.headers({ Authorization: `Bearer ${token}`, "Dropbox-API-Arg": headerJson({ path: dropboxPath }) }) }, this.timeouts.downloadMs, "download");
    if (!response.ok) throw new DropboxApiError("/files/download", response.status, await response.text());
    const length = Number(response.headers.get("content-length")) || 0;
    if (length > maxBytes) { response.release?.(); try { await response.body?.cancel(); } catch { /* already closed */ } throw new EngineError("DROPBOX_TOO_LARGE", `${dropboxPath} is ${length} bytes, over the ${maxBytes} cap.`); }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    try { await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(destination)); }
    finally { response.release?.(); }
    return fs.statSync(destination).size;
  }

  /** Dropbox-side thumbnail (cheap; no full download). Returns a Buffer (JPEG). */
  async thumbnail(dropboxPath, size = "w640h480") {
    const token = await this.token();
    const response = await this.request(`${CONTENT}/files/get_thumbnail_v2`, { method: "POST", headers: this.headers({ Authorization: `Bearer ${token}`, "Dropbox-API-Arg": headerJson({ resource: { ".tag": "path", path: dropboxPath }, format: "jpeg", size, mode: "bestfit" }) }) }, this.timeouts.contentMs, "thumbnail");
    if (!response.ok) { const text = await response.text(); throw new DropboxApiError("/files/get_thumbnail_v2", response.status, text); }
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

/** A deadline passed: the request was aborted. Transient; rpc() retries it. */
export class DropboxTimeout extends EngineError {
  constructor(message) { super("DROPBOX_TIMEOUT", message); this.name = "DropboxTimeout"; }
}

/**
 * A Dropbox API error with its parsed error summary. 409s carry the reason as a tag path, e.g.
 * `path/not_found/` or `reset/`: `reset` means the cursor is invalid and the folder must be listed again from
 * scratch; `notFound` means the path (for a cursor: the listed root) no longer exists.
 */
export class DropboxApiError extends EngineError {
  constructor(endpoint, status, text = "") {
    super("DROPBOX_HTTP", `Dropbox ${endpoint} HTTP ${status}: ${String(text).slice(0, 300)}`);
    this.name = "DropboxApiError";
    this.endpoint = endpoint;
    this.status = status;
    let summary = "";
    try { summary = JSON.parse(text).error_summary || ""; } catch { summary = /reset|not_found/.test(String(text)) ? String(text) : ""; }
    this.summary = summary;
    this.reset = status === 409 && /(^|\/)reset(\/|$|\.)/.test(summary);
    this.notFound = status === 409 && /not_found/.test(summary);
  }
}

/** Disarm the request deadline once the body has been consumed (json/text/arrayBuffer) or explicitly released. */
function wrapBody(response, release, controller) {
  let released = false;
  const done = () => { if (!released) { released = true; release(); } };
  const wrap = (name) => {
    const original = response[name]?.bind(response);
    if (!original) return;
    response[name] = async (...args) => {
      try { return await original(...args); }
      catch (error) { if (controller.signal.aborted && controller.signal.reason instanceof Error) throw controller.signal.reason; throw error; }
      finally { done(); }
    };
  };
  for (const name of ["json", "text", "arrayBuffer"]) wrap(name);
  response.release = done;
  return response;
}
