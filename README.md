# RemNote MCP v0.1.0 Archive

This branch preserves the public RemNote MCP `0.1.0` plugin archive. RemNote
MCP connects ChatGPT and Codex to RemNote through a secure Model Context
Protocol bridge for bounded reads, structured writes, verification, resumable
imports, cards, formulas, formatting, and URL-based media insertion.

For the current upload version and full user documentation, use
[main](https://github.com/HTGit63/remnote-plugin-template-react#readme).

## Install this archived version

1. Download
   [PluginZip.zip](https://github.com/HTGit63/remnote-plugin-template-react/raw/refs/heads/release-artifacts/v0.1.0/PluginZip.zip).
2. In RemNote desktop, open **Settings → Plugins → Upload plugin**.
3. Select the ZIP, enable **RemNote MCP**, and open its sidebar.
4. Configure a hosted or local companion-server connection.

Archive SHA-256:

```text
bc43addc88e6c32c01ea1cf9e4a5c080ff29eefbcd4f189121363454f49474c2
```

The immutable `v0.1.0` tag resolves to
`c0a6ff9187debcad04d1f30f2b509bedd862e508`. This cleanup commit changes
release-branch documentation and removes generated Graphify output; it does not
move that tag or change the archived ZIP.

## Connect

Hosted plugin WebSocket:

```text
wss://remnote-plugin-template-react.onrender.com/remnote
```

Hosted MCP endpoint:

```text
https://remnote-plugin-template-react.onrender.com/mcp
```

Complete pairing in the RemNote sidebar, choose the smallest useful scope, and
keep **Ask for every write** enabled for initial use. Start with `basic` for
reads or `mass_note_writer` for structured notes and resumable imports.

## Security

- Never place tokens, pairing codes, OAuth credentials, session secrets, or
  database credentials in prompts or committed files.
- Keep deletion disabled for normal work.
- Use a disposable Rem tree for write and media testing.
- Reuse the same idempotency key after an uncertain write.
- Remember that stored media readback is separate from visible playback proof.

See the current [TOOL_REFERENCE.md](TOOL_REFERENCE.md) for schemas, permissions,
timeouts, and failure behavior.
