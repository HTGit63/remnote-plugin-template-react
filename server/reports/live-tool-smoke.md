# RemnoteMCP Live Tool Smoke Report

- MCP URL: http://127.0.0.1:47392/mcp?tool_tier=developer
- Generated: 2026-07-12T09:31:21.548Z
- Passed: 0
- Failed: 1
- Skipped: 0

## Tool Results

| Tool | Category | Status | ms | Code | Layer | Reached Plugin | Changed | Fix |
|---|---|---:|---:|---|---|---:|---:|---|
| mcp_initialize | system/read | failed | 31 | MCP_ENDPOINT_UNREACHABLE | mcp_transport | no | no | Start the MCP server and reconnect the RemNote plugin, then rerun live regression. |

## Static Execution Matrix

| Tool | MCP | Schema | Bridge | Normalize | Handler | Function | Live |
|---|---:|---:|---|---:|---:|---:|---|
