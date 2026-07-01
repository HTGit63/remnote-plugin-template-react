# Codex MCP Setup

Codex uses the same hosted MCP endpoint as ChatGPT:

```text
https://remnote-plugin-template-react.onrender.com/mcp?tool_tier=mass_note_writer
```

Auth lanes:

```text
ChatGPT -> hosted OAuth/pairing -> /connect?pairing_id=...
Codex   -> Authorization: Bearer <REMNOTE_CODEX_TOKEN> -> explicit RemNote plugin routing/link
```

The Codex bearer token only authenticates Codex to the hosted MCP server. Codex still needs a live or explicitly linked RemNote plugin session. RemNote access scope, write approval, focused-Rem limits, and destructive-tool guards still come from the connected RemNote plugin and server tool policy.

## Render Env

Set this in Render:

```bash
REMNOTE_CODEX_TOKEN=<strong random secret>
```

Keep existing hosted pairing env:

```bash
REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://remnote-plugin-template-react.onrender.com
MCP_SERVER_URL=https://remnote-plugin-template-react.onrender.com/mcp
```

Do not commit the token. Do not reuse the RemNote plugin Local Bridge Token.

## Local Shell

Use the same value set in Render:

```bash
export REMNOTE_CODEX_TOKEN="<same value>"
codex
```

Inside Codex:

```text
/mcp
```

Codex does not need:

```bash
codex mcp login remnotemcp
```

Do not run `codex mcp login remnotemcp` for bearer-token mode. `bearer_token_env_var` must be the variable name, not the token value. Load the actual token from `~/.config/codex/remnote-mcp.env` or the shell before launching Codex.

## Codex Config

```toml
[mcp_servers.remnotemcp]
url = "https://remnote-plugin-template-react.onrender.com/mcp?tool_tier=mass_note_writer"
bearer_token_env_var = "REMNOTE_CODEX_TOKEN"
tool_timeout_sec = 180
startup_timeout_sec = 90
default_tools_approval_mode = "prompt"
```

Use `mass_note_writer` first to keep `tools/list` small and avoid exposing higher-risk tools.

## Token Distinction

```text
REMNOTE_CODEX_TOKEN
  Used by Codex HTTP requests to hosted /mcp.

RemNote plugin Local Bridge Token / REMNOTE_BRIDGE_TOKEN
  Used only for local bridge mode.
  Not the same secret.
  Not used for hosted ChatGPT OAuth/pairing.
```

## Manual Verification

Set:

```bash
export BASE_URL="https://remnote-plugin-template-react.onrender.com"
export MCP_URL="https://remnote-plugin-template-react.onrender.com/mcp?tool_tier=mass_note_writer"
source ~/.config/codex/remnote-mcp.env
```

Health:

```bash
curl -sS "$BASE_URL/health" | jq '{
  deploymentMode,
  hostedPairingEnabled,
  codexBearerAuthAvailable,
  codexBearerAuthConfigured,
  activePluginConnectionCount,
  pluginConnectionStatus,
  codexBearerRoutingAvailable,
  codexBearerRoutingMode,
  codexPairingSupported
}'
```

MCP endpoint liveness/discovery facts:

```bash
curl -sS "$MCP_URL" | jq '{mcpPath, bridgePath, discoveryAuth, toolCallAuth, activeToolTier, publicToolCount, codexBearerRoutingAvailable, codexBearerRoutingMode, codexPairingSupported}'
```

Tool discovery stays no-auth:

```bash
curl -sS "$MCP_URL" \
  -H 'accept: application/json, text/event-stream' \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | jq '.result.tools[].name'
```

Protected tool call without token must fail:

```bash
curl -sS -i "$MCP_URL" \
  -H 'accept: application/json, text/event-stream' \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"get_focused_rem","arguments":{}}}'
```

Protected tool call with token reaches MCP/plugin routing:

```bash
curl -sS -i "$MCP_URL" \
  -H "Authorization: Bearer $REMNOTE_CODEX_TOKEN" \
  -H 'accept: application/json, text/event-stream' \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_focused_rem","arguments":{}}}'
```

Expected result:

```text
200 with focused Rem data when exactly one plugin connection exists or Codex is explicitly linked.
200 with PLUGIN_NOT_CONNECTED when no RemNote plugin is connected.
200 with CODEX_PAIRING_REQUIRED or DEVICE_CONFLICT when multiple plugin connections exist and Codex is not linked.
401 when the bearer token is missing or wrong.
```

Start explicit Codex pairing:

```bash
curl -sS "$BASE_URL/codex/pair/start" \
  -H "Authorization: Bearer $REMNOTE_CODEX_TOKEN" \
  -H 'accept: application/json' \
  -H 'content-type: application/json' \
  --data '{}' | jq
```

Open the returned `browserUrl`, approve the code in the RemNote plugin, then retry the tool call.

Server-local diagnostics with token:

```bash
curl -sS "$MCP_URL" \
  -H "Authorization: Bearer $REMNOTE_CODEX_TOKEN" \
  -H 'accept: application/json, text/event-stream' \
  -H 'content-type: application/json' \
  --data '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_bridge_status","arguments":{}}}' | jq
```

`PLUGIN_NOT_CONNECTED` after valid bearer auth means routing/plugin connection, not token auth. `CODEX_PAIRING_REQUIRED` means open the browser URL, approve in RemNote, then retry. `DEVICE_CONFLICT` means multiple active plugin sessions exist, so explicit pairing is required.
