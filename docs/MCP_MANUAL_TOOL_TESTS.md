# RemnoteMCP Manual MCP Tool Tests

Browser `GET /mcp` is endpoint liveness only. It is not a tool execution test. Real connector checks use JSON-RPC `POST /mcp`.

Set:

```bash
export MCP_URL="https://remnote-plugin-template-react.onrender.com/mcp"
export MCP_LOCAL_URL="http://127.0.0.1:47392/mcp"
export REMNOTE_BRIDGE_TOKEN="replace-with-local-token"
export DISPOSABLE_PARENT_REM_ID="replace-with-disposable-test-root-rem-id"
```

## Hosted / Connector Discovery

```bash
curl -i "$MCP_URL"
```

```bash
curl -i "$MCP_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"manual-test","version":"1.0.0"}}}'
```

```bash
curl -i "$MCP_URL" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
```

## Local Tool Calls

```bash
curl -i "$MCP_LOCAL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REMNOTE_BRIDGE_TOKEN" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_bridge_status","arguments":{}}}'
```

```bash
curl -i "$MCP_LOCAL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REMNOTE_BRIDGE_TOKEN" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"ping_remnote_plugin","arguments":{"message":"manual ping"}}}'
```

```bash
curl -i "$MCP_LOCAL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REMNOTE_BRIDGE_TOKEN" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_plugin_status","arguments":{}}}'
```

```bash
curl -i "$MCP_LOCAL_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REMNOTE_BRIDGE_TOKEN" \
  -d '{"jsonrpc":"2.0","id":6,"method":"tools/call","params":{"name":"get_focused_rem","arguments":{}}}'
```

## Markdown Write Smoke

Use only a disposable parent Rem.

```bash
curl -i "$MCP_LOCAL_URL?tool_tier=developer" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $REMNOTE_BRIDGE_TOKEN" \
  -d '{"jsonrpc":"2.0","id":7,"method":"tools/call","params":{"name":"create_note_from_markdown_tree","arguments":{"parentRemId":"'"$DISPOSABLE_PARENT_REM_ID"'","markdownText":"# Manual Smoke Note\n\n## Section\n- Bullet\n- Inline math $E=mc^2$\n\n$$\nF=ma\n$$","duplicatePolicy":"create_new","verifyAfterWrite":true,"idempotencyKey":"manual-smoke-markdown-1"}}}'
```

## Full Live Smoke Harness

```bash
REMNOTE_BRIDGE_TOKEN="$REMNOTE_BRIDGE_TOKEN" \
REMNOTE_MCP_URL="$MCP_LOCAL_URL" \
REMNOTE_LIVE_TOOL_PARENT_ID="$DISPOSABLE_PARENT_REM_ID" \
npm run bridge:live-tool-smoke
```

## Full Live Regression Harness

This calls through MCP `tools/call`, then writes a separate acceptance report.

```bash
REMNOTE_BRIDGE_TOKEN="$REMNOTE_BRIDGE_TOKEN" \
REMNOTE_MCP_URL="$MCP_LOCAL_URL" \
REMNOTE_LIVE_TOOL_PARENT_ID="$DISPOSABLE_PARENT_REM_ID" \
npm run bridge:live-tool-regression
```

Reports are written to:

```text
server/reports/live-tool-smoke.json
server/reports/live-tool-smoke.md
server/reports/live-tool-regression.json
server/reports/live-tool-regression.md
```

Disposable Rem cleanup: keep all live writes under `$DISPOSABLE_PARENT_REM_ID`, inspect that root in RemNote, then delete it manually or run `delete_rem_by_id` dry-run with title/ancestor guard before any real delete.
