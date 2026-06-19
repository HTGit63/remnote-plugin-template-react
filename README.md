# RemnoteMCP

Local/hosted MCP bridge for controlled RemNote note reading and writing.

## Current Architecture

```text
ChatGPT MCP client
  -> server/src app/auth/MCP routing
  -> server/src/bridge-hub.ts
  -> RemNote plugin WebSocket
  -> src/bridge/handlers.ts
  -> src/remnote read/write SDK layer
```

Shared SDK-free protocol and Markdown parser code lives in `shared/bridge/**`.

Server code must not import RemNote SDK, React, widgets, plugin handlers, or RemNote write/read modules. Run:

```bash
npm run server:test:boundaries
```

## RemNote SDK Foundation

Pinned RemNote plugin SDK:

```text
@remnote/plugin-sdk 0.0.46
```

Goal 1 SDK notes live in `docs/REMNOTE_SDK_NOTES.md`. Runtime status and diagnostics expose `sdkVersion`, `supportedSdkCapabilities`, `unsupportedSdkCapabilities`, `initialSyncComplete`, `initialSyncTimedOut`, and any `initialSyncWarning`.

## Local Mode

Default mode is local.

```bash
npm install
npm run server:install
npm run server:build
npm run server:dev
```

Local defaults:

```text
WebSocket: ws://127.0.0.1:47391/remnote-bridge
MCP:       http://127.0.0.1:47392/mcp
```

Use `REMNOTE_BRIDGE_TOKEN` unless isolated local development explicitly sets `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1`.

`PLUGIN_NOT_PAIRED` means ChatGPT is hitting a hosted or stale connector path. Local disconnected calls should report `PLUGIN_NOT_CONNECTED`.

## RemNote Plugin UI

The RemNote sidebar widget is `RemnoteMCP`. Default view shows setup status, writing access, design template selection, pending approval, last result, and a quick health check. Developer diagnostics, tool health, raw registry details, and copy-debug actions are behind Advanced.

Registered RemNote commands:

```text
Open RemnoteMCP
Run RemnoteMCP Health Check
Save Focused Note as Design Template
Use Focused Rem as Approved Root
Copy MCP URL
Copy Diagnostics
Open RemnoteMCP Settings
```

## Hosted Mode

Hosted mode requires:

```text
REMNOTE_BRIDGE_DEPLOYMENT_MODE=hosted
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
SESSION_SECRET
PUBLIC_BASE_URL
DATABASE_URL for postgres storage
ADMIN_DEBUG_SECRET for protected diagnostics
```

Render config is documented in `docs/deployment/render.md`.

## Tool Access Tiers

Canonical setting: `toolProfile`.

Allowed values:

```text
basic
mass_note_writer
note_writer
power_user
developer
danger
```

Legacy aliases still normalize for compatibility:

```text
core -> basic
advanced_notes -> mass_note_writer
mass_notes -> mass_note_writer
safe_note_writer -> mass_note_writer
developer_diagnostics -> developer
full -> danger
```

`toolTier` can appear as a compatibility alias in responses only. The default is `mass_note_writer`, so ChatGPT sees read tools plus `create_or_replace_note_from_markdown` for bulk Markdown notes. Broader note, design, card, formatting, repair, debug, and delete tools require an explicit higher profile.

Tool counts are generated from the registry at runtime. Check:

```bash
npm run server:test:tool-profile
```

`delete_rem_by_id` is gated by `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` and the `danger` access tier. It defaults to `dryRun=true`; real delete requires `dryRun=false`, `confirmTitle`, and `expectedParentId` or `expectedAncestorId`. Disposable cleanup can additionally require `requireCreatedInCurrentSession=true`, `requirePriorDryRun=true`, and the same `idempotencyKey` used for the dry run.

`create_folder` is not public/callable in this pass. Modern SDK typings expose folder APIs, but this bridge keeps the tool hidden until the Goal 2 refactor live-verifies the safe path.

## Markdown Importer

Preferred long-note tool:

```text
create_or_replace_note_from_markdown
```

It parses Markdown locally, sends one bridge request, and verifies source fidelity. It preserves headings, paragraphs, blank lines/spacers, bullets, numbered lists, inline/block math, code blocks, tables as text, and source order. It reports counts, missing snippets, structure mismatches, and pollution Rems such as `Size`, `H1`, `H2`, `H3`, or `normal`.

Dry-run/parser tests do not require live RemNote:

```bash
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run server:test:performance
```

## Security

Hosted MCP calls validate token expiry, issuer/audience, OAuth scopes, RemNote access scope, trusted write mode, and destructive delete scope. Public hosted health/root routes expose only minimal status. `/diagnostics` requires dashboard session or `ADMIN_DEBUG_SECRET` in hosted mode.

See `docs/security/permissions.md`.

Public auth and release readiness:

```text
docs/public-auth-plan.md
docs/public-release-checklist.md
```

## Required Quality Gates

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run server:test:tool-profile
npm run server:test:health-check-routing
npm run server:test:structured-depth
npm run server:test:style-schema
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run server:test:performance
npm run server:test:security
npm run server:test:boundaries
```

Server-only build:

```bash
cd server
npm install
npm run build
```

Manual golden RemNote import still requires live plugin access and must not be faked.
