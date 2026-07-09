# RemnoteMCP Live Tool Regression

Generated: 2026-07-09T19:41:46.116Z
Overall: fail
Smoke exit code: 1

## Acceptance Gate

- Failed tools: 1
- Gateway failures: 1
- Structured/markdown failures: 0
- Bulk import failures: 0
- Tiny bulk blocked: yes
- Block reason: Stage 6 tiny bulk live retest requires REMNOTE_LIVE_TOOL_PARENT_ID or REMNOTE_LIVE_TEST_PARENT_ID and a connected plugin.
- System/read passed: 0
- Simple write passed: 0
- Dangerous real delete ran: no

## Underlying Smoke Report

# RemnoteMCP Live Tool Smoke Report

- MCP URL: http://127.0.0.1:47392/mcp?tool_tier=developer
- Generated: 2026-07-09T19:41:46.091Z
- Passed: 0
- Failed: 1
- Skipped: 0

## Tool Results

| Tool | Category | Status | ms | Code | Layer | Reached Plugin | Changed | Fix |
|---|---|---:|---:|---|---|---:|---:|---|
| mcp_initialize | system/read | failed | 30 | MCP_ENDPOINT_UNREACHABLE | mcp_transport | no | no | Start the MCP server and reconnect the RemNote plugin, then rerun live regression. |

## Static Execution Matrix

| Tool | MCP | Schema | Bridge | Normalize | Handler | Function | Live |
|---|---:|---:|---|---:|---:|---:|---|
