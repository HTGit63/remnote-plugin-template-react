# RemNote ChatGPT Bridge

This repository is a RemNote plugin moving toward a local bridge architecture.

The plugin is not an AI chatbot inside RemNote. It does not call OpenAI directly, does not store an OpenAI API key, and does not choose models. ChatGPT or Vivy remains the reasoning layer. This plugin is the RemNote SDK access layer.

## Product Direction

Target flow:

```text
ChatGPT / Vivy
-> MCP-compatible tool layer
-> local companion server
-> WebSocket bridge
-> running RemNote plugin
-> RemNote SDK
-> user's RemNote knowledge base
```

The plugin exposes controlled RemNote operations:

- read the focused Rem;
- read a specific Rem by ID;
- read a bounded Rem tree;
- read direct children in RemNote order;
- read breadcrumbs and current selection;
- search Rems with bounded result limits;
- create a Rem from markdown;
- create document Rems from markdown;
- append markdown under an existing Rem;
- update, replace, move, and reorder existing Rems under local policy;
- require approval for writes by default;
- keep delete operations behind `delete_rem_by_id` dry-run previews, parent/ancestor guards, and user approval.

## Current Milestone State

Implemented now:

- docs and product direction updated for the bridge;
- active OpenAI API-key and runtime request path removed;
- RemNote SDK reads, writes, serialization, and permissions moved into service files;
- right sidebar replaced with a bridge-status widget;
- WebSocket bridge client inside the plugin;
- local companion server under `server/`;
- read-only MCP tools for focused Rem, Rem by ID, and bounded Rem trees;
- structure-aware MCP tools for children, breadcrumbs, selection, rich content, bounded search, and document/folder trees;
- safe create/append/document/update/move/reorder/tree write tools with RemNote-side approval by default;
- app-level permission scopes for focused Rem, selected Rem, selected descendants, approved root, or workspace access;
- guarded `delete_rem_by_id` with dry-run preview, parent/ancestor guards, and deletion verification;
- arbitrary-ID MCP `delete_rem` exposure disabled by default unless `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` is set for local development;
- SDK-backed formatting tools that return `SDK_UNSUPPORTED` for unsupported color/type reset cases instead of raw SDK errors;
- LaTeX parsing for `$...$`, `\(...\)`, `$$...$$`, and `\[...\]` in rich text paths;
- `apply_remnote_command` for safe shortcut-like heading, highlight, bullet, type, and math commands without keyboard simulation;
- `apply_structured_note_batch` for dry-run, idempotent, rollback-aware, verified structured note creation;
- `run_bridge_health_check` for pass/fail/skipped/unsupported tool health results;
- `get_remnote_capability_guide` for RemNote concepts, hierarchy, formatting, flashcards, and safe bridge workflow guidance;
- bridge diagnostics, tool-registry stamp, recent request lifecycle, timeout, disconnect, client-cancel, partial execution reporting, and duplicate approval handling;
- local auth/session/audit interfaces for future hosted mode without fake OAuth;
- MCP/ChatGPT-compatible tool layer at `http://127.0.0.1:47392/mcp`.

Current truth: the server lists 46 public MCP tools, but a listed tool is not automatically proven live against the real RemNote plugin and SDK. `get_bridge_diagnostics` is the source for `callabilitySource`, `realPluginVerifiedTools`, `runtimeUnverifiedTools`, `sdkUnsupportedTools`, and the last health-check result.

## Local Setup

1. Terminal A: run `npm install` once, then run `npm run dev` and keep that process open.
2. Wait for the first webpack compile to finish.
3. Terminal B: start the companion server with `npm run server:dev`.
4. In RemNote open `Settings -> Plugins -> Build`.
5. Use `Develop from localhost`.
6. Enter `http://localhost:8080`.
7. Enable the plugin.

Do not enter `/manifest.json` in RemNote. Use `http://localhost:8080` only.
If RemNote says `Failed to load manifest`, Terminal A is not reachable or was stopped. Open `http://localhost:8080/manifest.json` in a browser to confirm the plugin dev server is alive.

## Companion Server Setup

Install and run the local server separately:

```bash
npm run server:install
export REMNOTE_BRIDGE_TOKEN="$(openssl rand -hex 32)"
npm run server:dev
```

Then enter the same token in the plugin's `Bridge Token` setting. The server listens on:

- WebSocket bridge: `ws://127.0.0.1:47391/remnote-bridge`
- MCP endpoint: `http://127.0.0.1:47392/mcp`
- Health: `http://127.0.0.1:47392/health`
- Authenticated diagnostics: `http://127.0.0.1:47392/diagnostics`

The server binds to `127.0.0.1` by default. Remote bind or CORS requires a token, and CORS also requires `REMNOTE_BRIDGE_ALLOWED_ORIGINS`.

`REMNOTE_BRIDGE_TOKEN` is required by default. Use `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1` only for isolated local development.
`REMNOTE_BRIDGE_AUDIT_LOG=1` logs auth/request metadata without note bodies or markdown.
`REMNOTE_BRIDGE_HOSTED_MODE=1` intentionally fails startup today. Hosted OAuth/pairing interfaces exist, but no fake production auth path is enabled.

The plugin dev server and the companion server are separate processes. The manifest comes from Terminal A on port 8080; the bridge comes from Terminal B on ports 47391 and 47392.

## MCP Tools

The companion server exposes 46 public MCP tools by default:

- `get_bridge_status`
- `get_bridge_diagnostics`
- `run_bridge_health_check`
- `get_remnote_capability_guide`
- `ping_remnote_plugin`
- `get_plugin_status`
- `get_focused_rem`
- `get_rem`
- `get_rem_tree`
- `get_rem_rich`
- `get_current_selection`
- `get_children`
- `get_rem_breadcrumbs`
- `search_rems`
- `get_document_or_folder_tree`
- `create_rem`
- `create_document`
- `create_folder`
- `append_to_rem`
- `update_rem`
- `replace_rem`
- `move_rem`
- `reorder_children`
- `delete_rem_by_id`
- `create_rem_tree`
- `update_rem_rich`
- `set_rem_heading_level`
- `set_rem_text_color`
- `set_rem_highlight_color`
- `set_text_span_color`
- `set_text_span_highlight`
- `set_rem_type`
- `set_hide_bullet`
- `clear_rem_formatting`
- `create_styled_rem_tree`
- `apply_remnote_command`
- `apply_structured_note_batch`
- `create_polished_note_tree`
- `apply_style_plan`
- `verify_note_design`
- `create_basic_flashcard`
- `create_concept_card`
- `create_descriptor_card`
- `create_cloze_card`
- `create_multiple_choice_card`
- `create_list_answer_card`

`create_folder` returns `SDK_UNSUPPORTED` with the installed RemNote SDK because folder creation is not exposed in the SDK typings. `delete_focused_rem`, `delete_selected_rem`, and arbitrary-ID legacy `delete_rem` remain hidden by default. Use `delete_rem_by_id` for deletion.

MCP `initialize` and `tools/list` allow unauthenticated discovery so ChatGPT can refresh the full tool list. Tool calls still require the configured local token unless `REMNOTE_BRIDGE_ALLOW_NO_TOKEN=1` is set for isolated local development. If ChatGPT shows fewer tools than this list, restart the companion server and refresh the ChatGPT app/connector so it reloads MCP tool metadata.

`tools/list` means discoverable. It does not mean every tool already succeeded in a real RemNote session. Use `get_bridge_diagnostics` to inspect recently verified tools, unsupported SDK tools, and runtime-unverified tools.

## Settings

- `Bridge Server URL`: defaults to `ws://localhost:47391/remnote-bridge`
- `Bridge Permission Mode`: defaults to `Confirm Writes`
- `Bridge Permission Scope`: defaults to `Focused Rem Only`
- `Approved Root Rem ID`: required only for `Approved Document or Folder` scope
- `Bridge Token`: must match `REMNOTE_BRIDGE_TOKEN`

No OpenAI API key setting is required.

## Permission Modes and Scopes

Modes:

- `read_only`: reads only, no writes.
- `confirm_writes`: safe top-level create and dry-run checks can run; creating inside an existing Rem, updating existing Rems, moving/reordering existing Rems, replacing, or deleting requires RemNote approval.
- `trusted_writes`: safe write, rich text, styling, structured batch, document, and supported flashcard tools run without repeated RemNote approval prompts when scope allows; replace/delete still require approval.
- `danger_zone`: broad write mode for local testing; destructive tools still require approval.

Scopes:

- `focused_rem_only`
- `focused_rem_and_descendants`
- `selected_rem_only`
- `selected_rem_and_descendants`
- `approved_document_or_folder`
- `workspace_allowed`

Scope checks run inside the RemNote plugin before approval or SDK mutation. The companion server cannot widen scope by itself.

## Safe Now

- Local loopback MCP endpoint with token by default.
- Bounded reads and bounded tree creation.
- Total-node and message-size caps for large Rem trees.
- Writes gated by permission mode and scope.
- Delete limited to guarded `delete_rem_by_id` by default; focus/selection delete stays hidden/private.
- Approval rejection, approval timeout, plugin disconnect, server timeout, and MCP client disconnect return structured outcomes or cancel the plugin-side approval instead of hanging.
- `get_bridge_diagnostics` and `/diagnostics` report the live registry, pending requests, lifecycle events, partial execution evidence, and recent outcomes without note bodies or markdown.

## Not Ready Yet

- All 46 public tools are discoverable and smoke-verified against the mock bridge; full real RemNote sandbox verification must be recorded through `run_bridge_health_check` or `npm run bridge:live-test`.
- Formatting, math, and structured batch writing are repo-verified and covered by smoke tests, but still need a live RemNote sandbox run before public hosted submission.
- Public hosted mode.
- OAuth sign-in and account management.
- Pairing UI for multiple devices.
- Persistent hosted session storage and revocation UI.
- Public ChatGPT app submission until a stable HTTPS MCP endpoint, privacy policy, support contact, screenshots, and live RemNote sandbox QA are complete.

## Validation Commands

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
npm audit
npm audit --omit=dev
git diff --check
```

## Project Docs

- `Agents.md`
- `ARCHITECTURE.md`
- `SAFETY.md`
- `NEXT_STEPS.md`
