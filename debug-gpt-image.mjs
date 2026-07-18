#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, ".env");
for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
  const m = line.match(/^\s*([\w]+)\s*=\s*(.+)\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const API_KEY = process.env.OPENAI_API_KEY;
const ref = path.join(__dirname, "Muha Giveaway Assets", "1 day.png");
const buf = fs.readFileSync(ref);
console.log("Image size:", buf.length, "bytes");

const form = new FormData();
form.append("model", "gpt-image-2");
form.append("prompt", "Edit this image: change the car to solid red.");
form.append("size", "2160x2880");
form.append("quality", "high");
form.append("n", "1");
const blob = new Blob([buf], { type: "image/png" });
form.append("image[]", blob, "1day.png");

console.log("Calling OpenAI...");
const t0 = Date.now();
try {
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body: form,
  });
  console.log(`Status: ${res.status} after ${(Date.now() - t0) / 1000}s`);
  const text = await res.text();
  console.log("Response (first 500 chars):", text.slice(0, 500));
} catch (err) {
  console.log(`Error after ${(Date.now() - t0) / 1000}s:`, err);
  console.log("Cause:", err.cause);
}
