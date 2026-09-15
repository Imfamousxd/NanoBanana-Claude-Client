import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { buildServer } from "../engine/mcp/server.mjs";
import { createTools } from "../engine/mcp/tools.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("every MCP tool has a unique name, a description and a schema", () => {
  const tools = createTools(root);
  const names = tools.map((tool) => tool.name);
  assert.equal(new Set(names).size, names.length);
  for (const tool of tools) {
    assert.ok(tool.description.length > 20, `${tool.name} needs a description`);
    assert.equal(typeof tool.inputSchema, "object");
    assert.equal(typeof tool.handler, "function");
  }
  for (const required of ["brand_list", "brand_get", "assets_search", "context_pack", "prompt_log", "feedback_record", "laws_search", "learning_stats", "job_plan", "job_run"]) {
    assert.ok(names.includes(required), `missing ${required}`);
  }
});

test("the server lists tools and answers brand_list over an in-memory transport", async () => {
  const { server } = buildServer(root);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test", version: "0" });
  await client.connect(clientTransport);
  const listed = await client.listTools();
  assert.ok(listed.tools.some((tool) => tool.name === "context_pack"));
  const result = await client.callTool({ name: "brand_list", arguments: {} });
  assert.equal(result.isError, undefined);
  const parsed = JSON.parse(result.content[0].text);
  const ids = parsed.brands.map((brand) => brand.id);
  for (const brand of ["brand.muha", "brand.nulumin", "brand.noble-harbor", "brand.dialed-health", "brand.dialed-labs", "brand.dialed-moods"]) assert.ok(ids.includes(brand), `missing ${brand}`);
  const failure = await client.callTool({ name: "brand_get", arguments: { brand: "not-a-brand" } });
  assert.equal(failure.isError, true);
  assert.match(failure.content[0].text, /UNKNOWN_BRAND/);
  await client.close();
  await server.close();
});
