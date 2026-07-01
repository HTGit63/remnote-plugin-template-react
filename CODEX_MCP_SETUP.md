# Codex MCP Setup

Codex uses the same hosted MCP endpoint as ChatGPT:

```text
https://remnote-plugin-template-react.onrender.com/mcp
```

Auth lanes:

```text
ChatGPT -> hosted OAuth/pairing -> /connect?pairing_id=...
Codex   -> Authorization: Bearer <REMNOTE_CODEX_TOKEN>
```

The Codex bearer token only authenticates Codex to the hosted MCP server. RemNote access scope, write approval, and destructive-tool guards still come from the connected RemNote plugin and server tool policy.

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

## Codex Config

```toml
[mcp_servers.remnotemcp]
url = "https://remnote-plugin-template-react.onrender.com/mcp"
bearer_token_env_var = "REMNOTE_CODEX_TOKEN"
tool_timeout_sec = 180
startup_timeout_sec = 30
default_tools_approval_mode = "prompt"
```

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
export MCP_URL="https://remnote-plugin-template-react.onrender.com/mcp"
export BASE_URL="https://remnote-plugin-template-react.onrender.com"
export REMNOTE_CODEX_TOKEN="<same value set on Render>"
```

Health:

```bash
curl -sS "$BASE_URL/health" | jq '{deploymentMode, hostedPairingEnabled, codexBearerAuthAvailable, codexBearerAuthConfigured, authModesSupported}'
```

MCP endpoint liveness/discovery facts:

```bash
curl -sS "$MCP_URL" | jq '{mcpPath, discoveryAuth, toolCallAuth, codexBearerAuthAvailable, authModesSupported}'
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
200 with focused Rem data when the RemNote plugin is connected.
200 with PLUGIN_NOT_CONNECTED when the hosted server is reachable but no plugin is connected.
401 when the bearer token is missing or wrong.
```
