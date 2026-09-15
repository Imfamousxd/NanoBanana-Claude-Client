// Sources — where files come from. Two kinds share one discovery contract so the pipeline never
// cares: `dropbox` (cursor + longpoll, the hosted worker's mode) and `local` (a folder on disk — the
// Dropbox desktop sync folder, an external drive, or this repo's asset folders — for backfills and
// for running the whole pipeline on a laptop with no cloud credentials).
import fs from "node:fs";
import path from "node:path";
import { isExcludedPath } from "./config.mjs";
import { mediaKindForName } from "./taxonomy.mjs";

const HIDDEN = /(^|\/)(\.|~\$|__MACOSX|Thumbs\.db|desktop\.ini)/;

/** Walk a local folder. Yields {type:'file', path (relative, posix), name, bytes, modifiedAt, absolutePath}. */
export function* walkLocal(rootDir) {
  const stack = [rootDir];
  while (stack.length) {
    const directory = stack.pop();
    let entries;
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      const relative = path.relative(rootDir, absolute).split(path.sep).join("/");
      if (HIDDEN.test(relative) || isExcludedPath(relative)) continue;
      if (entry.isDirectory()) { stack.push(absolute); continue; }
      if (!entry.isFile()) continue;
      const kind = mediaKindForName(entry.name);
      if (kind === "other") continue;
      let stat;
      try { stat = fs.statSync(absolute); } catch { continue; }
      yield { type: "file", path: relative, name: entry.name, bytes: stat.size, modifiedAt: stat.mtime.toISOString(), absolutePath: absolute, kind };
    }
  }
}

/** Dropbox entries relative to the source root, filtered to media we index. */
export function dropboxEntryToDiscovery(entry, sourceRoot) {
  const relative = entry.path.startsWith(sourceRoot) ? entry.path.slice(sourceRoot.length).replace(/^\//, "") : entry.path.replace(/^\//, "");
  if (entry.type === "deleted") return { type: "deleted", path: relative };
  if (entry.type !== "file") return null;
  if (HIDDEN.test(relative) || isExcludedPath(relative)) return null;
  const kind = mediaKindForName(entry.name);
  if (kind === "other") return null;
  return { type: "file", path: relative, name: entry.name, bytes: entry.bytes, modifiedAt: entry.modifiedAt, externalId: entry.id, contentHashHint: entry.contentHash, dropboxPath: entry.path, kind, media: entry.media || null };
}

/** Fetch a file to the work dir. Local sources are used in place; Dropbox is streamed to disk. */
export async function materialize({ source, asset, dropbox, workDir, maxBytes }) {
  if (source.kind === "local") {
    const absolute = path.join(source.root, asset.path);
    if (!fs.existsSync(absolute)) throw new Error(`local file missing: ${absolute}`);
    return { localPath: absolute, cleanup: () => {} };
  }
  const destination = path.join(workDir, "fetch", `${asset.id}${path.extname(asset.name).toLowerCase()}`);
  await dropbox.downloadToFile(`${source.root}/${asset.path}`, destination, { maxBytes });
  return { localPath: destination, cleanup: () => { try { fs.unlinkSync(destination); } catch { /* already gone */ } } };
}
