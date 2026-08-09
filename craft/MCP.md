# MCP — the engine as tools (`mcp-server.mjs`)

The whole workflow, exposed to any MCP client (Claude Code / Desktop) as native tools instead of
`node …` commands. It's a **dependency-free stdio JSON-RPC 2.0 server** that SPAWNS the validated
engine scripts — it never reimplements a rule, so every measured gate (claims, house bands,
refusals, prompt-craft, casting, proof) fires exactly once, in the engine, not twice.

## Register it

Add to the client's MCP config (Claude Code: `.mcp.json` or `claude mcp add`; Desktop:
`claude_desktop_config.json`). Use the absolute repo path:

```json
{
  "mcpServers": {
    "nanobanana": {
      "command": "node",
      "args": ["/ABS/PATH/NanoBanana-Client/mcp-server.mjs"]
    }
  }
}
```

The server reads keys from the repo-root `.env` exactly like the CLI, so no keys go in the config.

## The tools (safest first)

| Tool | Spends? | What it does |
|---|---|---|
| `engine_plan` | no | Dry-run a brief: validate claims/bands, route the model, quote cost, score prompt-craft detail (N/6). Always run this first. |
| `engine_brands` | no | Registered brands + campaign counts. A claim not in a brand's registry can't be spoken. |
| `engine_avatars` | no | Avatars and APPROVED/CASTING status (casting is refused for paid use). |
| `engine_cost` | no | `spent` audits the ledger; `drain` recovers paid-but-not-downloaded clips. |
| `scene_frame` | ~cents | Compose an avatar + product/card into one first frame (image), which the avatar lane animates. Review before generating. |
| `engine_generate` | **yes** | The paid run. **GATED**: requires `confirm=true`, and `claims_initialed` when the script speaks a registered claim. Proof-gated prop shots and casting avatars still refuse. |

## The workflow, as a tool sequence

```
engine_brands / engine_avatars   → see what's available
→ (write a brief per ENGINE-INTAKE.md)
→ engine_plan(brief)             → routing + cost + prompt-craft score, FREE
→ scene_frame(...)               → if an avatar + product share the shot (review the frame)
→ engine_generate(brief, confirm:true, claims_initialed:"<name>")   → survivors, gated
→ engine_cost(action:"drain")    → before ending
```

## Test it without a client

```bash
printf '%s\n' \
 '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{}}}' \
 '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
 '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"engine_brands","arguments":{}}}' \
 | node mcp-server.mjs
```
stdout is the JSON-RPC channel; all logs go to stderr.

## Not yet exposed (next)
`brand_asks` (registry gaps → ask sheet), `gen_verdict` (record the operator's call),
`avatar_verify` (likeness gate), and a higher-level `create_from_request` that walks the 16
intake questions. Add them the same way — one entry in the `TOOLS` map that spawns the tool.
