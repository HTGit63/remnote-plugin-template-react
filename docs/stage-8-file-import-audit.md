# Stage 8 File Import Audit

Date: 2026-07-10

## Official ChatGPT Contract

OpenAI's current Apps SDK documentation supports file inputs through top-level tool fields declared in `_meta["openai/fileParams"]`. Each declared field receives a file reference containing required `download_url` and `file_id` fields plus optional `mime_type` and `file_name` fields. The download URL is temporary and should be consumed only during the current tool call.

Sources:

- [Apps SDK MCP server file handling](https://developers.openai.com/apps-sdk/build/mcp-server#file-handling)
- [Apps SDK file APIs reference](https://developers.openai.com/apps-sdk/reference#file-apis)

The RemNote tools declare `sourceFile` as that top-level file field. They do not claim nested file fields, connector-mounted paths, or arbitrary hosted local paths as ChatGPT file uploads.

## Implemented Boundaries

| Input | Required auth lane | Boundary |
| --- | --- | --- |
| Local path and path aliases | `local_bridge_token` | Canonical existing allowed root |
| ChatGPT `sourceFile` object | `hosted_oauth` | HTTPS port 443, public pinned DNS address, max three redirects |
| Connector-compatible no-auth | Denied | `SOURCE_FILE_AUTH_REQUIRED` |
| Hosted OAuth with local server path | Denied | `SOURCE_FILE_LOCAL_AUTH_REQUIRED` |
| Local bridge with hosted file object | Denied | `SOURCE_FILE_CHATGPT_AUTH_REQUIRED` |
| Authenticated principal without `bridge:read` | Denied | `SOURCE_FILE_READ_SCOPE_REQUIRED` |

Local roots come from absolute paths in `REMNOTE_MCP_SOURCE_FILE_ALLOW_ROOTS` plus `/mnt/data` and `~/Downloads/Remnote`. Canonical target checks block traversal and directory-symlink escape. Final file symlinks are rejected. Reads are bounded to `maxSourceFileBytes + 1`, validate UTF-8, and never return partial source.

Remote file fetches reject credentials, non-HTTPS schemes, non-default ports, loopback/private/link-local/reserved DNS results, unbounded redirects, invalid UTF-8, and bodies above the configured source cap. The signed URL is neither returned nor stored.

## Size Alignment

- MCP HTTP body: `REMNOTE_BRIDGE_MAX_BODY_BYTES`, default 128 KiB.
- Plugin WebSocket message: `REMNOTE_BRIDGE_MAX_WS_MESSAGE_BYTES`, default 2 MiB.
- Source file: `REMNOTE_MCP_SOURCE_FILE_MAX_BYTES`, default 2 MiB and capped by the WebSocket message limit.

## Proof Boundary

Automated local proof covers aliases, root allow/deny, traversal, symlink escape, local/hosted/no-auth separation, official descriptor metadata, private-address SSRF denial, source-size rejection, and HTTP body rejection.

Not proven here: a real ChatGPT Developer Mode upload and temporary URL download, live Codex use of the shared plugin installation, or a resulting live RemNote write/readback. Those remain runtime checks and must not be inferred from unit tests or descriptor metadata.
