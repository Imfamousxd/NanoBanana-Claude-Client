#!/usr/bin/env node
// Content-engine MCP server (stdio). Registered for this checkout in .mcp.json (Claude Code) and
// .cursor/mcp.json (Cursor); run by hand with `npm run mcp`. Stdout is the protocol channel, so every
// console.log inside the engine is redirected to stderr before anything else loads.
console.log = (...args) => console.error(...args);

import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadEnv } from "../core/env.mjs";
import { loadGraph } from "../knowledge/graph.mjs";
import { listLearningStores, loadLearnings } from "../learning/store.mjs";
import { createTools, toolError, toolResult } from "./tools.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

export const INSTRUCTIONS = `Content engine for Muha Meds, NuLumin, Noble Harbor, Dialed Health, Dialed Labs, Dialed Moods (and Stanton).
Workflow for any content task:
1. brand_list / brand_get to resolve the brand and read its invariants, locked rules and gaps.
2. context_pack(brand, brief) BEFORE writing a prompt — it returns the exact reference files to pass, banned files, learned laws, approved exemplars with their prompts, recent rejections, compliance and routing.
3. assets_search for any further reference; never substitute a file found by browsing folders.
4. Generate (job_plan → job_run for engine jobs, or your own provider call). Log every prompt with prompt_log if it did not go through job_run.
5. Show candidates to the human. Record their call with feedback_record — approved outputs become exemplars in the graph, rejections become laws. A generation is not done until it has a verdict.
Rules: billable calls need execution.approved: true set by a human; never invent product facts or claims; exact copy is composed deterministically, never generated; a polished render can still fail for label drift, fake text or wrong geometry.`;

export function buildServer(rootDir = root) {
  loadEnv(rootDir);
  const packageJson = JSON.parse(readFileSync(path.join(rootDir, "package.json"), "utf8"));
  const server = new McpServer({ name: "content-engine", version: packageJson.version || "0.0.0" }, { instructions: INSTRUCTIONS });
  const tools = createTools(rootDir);
  for (const tool of tools) {
    server.registerTool(tool.name, { title: tool.title, description: tool.description, inputSchema: tool.inputSchema }, async (args) => {
      try {
        return toolResult(await tool.handler(args || {}));
      } catch (error) {
        console.error(`[content-engine] ${tool.name} failed: ${error?.message || error}`);
        return toolError(error);
      }
    });
  }

  server.registerResource("brands", "content://brands", { title: "Brands", description: "Brand ids, aliases and learning-store sizes", mimeType: "application/json" }, async (uri) => ({
    contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(listLearningStores(rootDir, loadGraph(rootDir)), null, 2) }],
  }));
  server.registerResource("learnings", new ResourceTemplate("content://learnings/{brand}", { list: undefined }), { title: "Brand learnings", description: "Laws, exemplars and events for one brand", mimeType: "application/json" }, async (uri, { brand }) => {
    const { store } = loadLearnings(rootDir, loadGraph(rootDir), String(brand));
    return { contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(store, null, 2) }] };
  });

  server.registerPrompt("content-task", { title: "Start a content task", description: "The operating contract plus the context pack for a brand and brief", argsSchema: { brand: z.string(), brief: z.string() } }, ({ brand, brief }) => ({
    messages: [{ role: "user", content: { type: "text", text: `${INSTRUCTIONS}\n\nBrand: ${brand}\nBrief: ${brief}\n\nStart by calling context_pack with this brand and brief, then assets_search for anything it lacks. Generate 2–3 candidates varying one hypothesis at a time. End by asking for a verdict and recording it with feedback_record.` } }],
  }));
  return { server, tools };
}

export async function startServer(rootDir = root) {
  const { server } = buildServer(rootDir);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[content-engine] MCP server ready (${rootDir})`);
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().catch((error) => {
    console.error(`[content-engine] fatal: ${error?.stack || error}`);
    process.exit(1);
  });
}
