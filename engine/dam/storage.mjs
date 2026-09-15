// Proxy storage — thumbnails, contact sheets and previews go to a Supabase Storage bucket so the
// gallery, the MCP and teammates can view an asset without touching Dropbox. Falls back to local
// files under the work dir when no bucket is configured (laptop mode).
import fs from "node:fs";
import path from "node:path";
import { fetchWithRetry } from "../core/http.mjs";

export class ProxyStore {
  constructor({ url, key, bucket, localRoot }) {
    this.url = url ? url.replace(/\/+$/, "") : null;
    this.key = key || null;
    this.bucket = bucket;
    this.localRoot = localRoot;
    this.mode = this.url && this.key ? "supabase" : "local";
  }

  async ensureBucket() {
    if (this.mode !== "supabase") return { ok: true, mode: "local" };
    const headers = { Authorization: `Bearer ${this.key}`, apikey: this.key, "Content-Type": "application/json" };
    const existing = await fetch(`${this.url}/storage/v1/bucket/${this.bucket}`, { headers });
    if (existing.ok) return { ok: true, mode: "supabase", created: false };
    const created = await fetch(`${this.url}/storage/v1/bucket`, { method: "POST", headers, body: JSON.stringify({ id: this.bucket, name: this.bucket, public: true, file_size_limit: 104857600 }) });
    if (!created.ok) throw new Error(`could not create bucket ${this.bucket}: HTTP ${created.status} ${(await created.text()).slice(0, 200)}`);
    return { ok: true, mode: "supabase", created: true };
  }

  async ready() {
    if (this.mode !== "supabase" || this.checked) return;
    this.checked = true;
    try {
      const result = await this.ensureBucket();
      if (result.created) console.error(`[dam] created storage bucket ${this.bucket}`);
    } catch (error) {
      console.error(`[dam] storage bucket unavailable (${error.message}); proxies will be kept locally under ${this.localRoot}`);
      this.mode = "local";
    }
  }

  /** Upload a local file under `objectPath`; returns a URL (public) or a local path. */
  async put(localPath, objectPath, contentType = "image/jpeg") {
    await this.ready();
    if (this.mode === "local") {
      const destination = path.join(this.localRoot, "proxies", objectPath);
      fs.mkdirSync(path.dirname(destination), { recursive: true });
      if (path.resolve(localPath) !== path.resolve(destination)) fs.copyFileSync(localPath, destination);
      return destination;
    }
    try {
      await fetchWithRetry(`${this.url}/storage/v1/object/${this.bucket}/${objectPath}`, () => ({
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, apikey: this.key, "Content-Type": contentType, "x-upsert": "true" },
        body: fs.readFileSync(localPath),
      }), { timeoutMs: 120_000, attempts: 2, retryableStatuses: new Set([408, 429, 500, 502, 503, 504]) });
      return `${this.url}/storage/v1/object/public/${this.bucket}/${objectPath}`;
    } catch (error) {
      console.error(`[dam] proxy upload failed for ${objectPath} (${error.message}); keeping a local copy`);
      this.mode = "local";
      return this.put(localPath, objectPath, contentType);
    }
  }
}
