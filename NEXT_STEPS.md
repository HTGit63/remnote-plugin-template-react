# Next Steps

## Completed Milestones

1. Documentation and product direction updated.
2. OpenAI runtime dependency removed from the active plugin path.
3. RemNote SDK logic refactored into service files.
4. AI sidebar replaced with bridge-status widget.
5. Typed bridge protocol added.
6. WebSocket bridge client added inside the plugin.
7. Local companion server skeleton added.
8. Read-only tool flow implemented through MCP and the bridge.
9. Safe create/append write flow implemented with RemNote-side approval.
10. MCP/ChatGPT tool layer added.
11. Phase 1 safety freeze complete: public MCP descriptors do not expose `delete_rem` unless `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` is set for local development.
12. Phase 2 ordering complete: create, append, and tree root creation append at the end by default, with explicit insert indexes returned for verification.
13. Phase 3 structure awareness complete: MCP exposes bounded selection, children, breadcrumbs, search, rich Rem, and document/folder tree tools.
14. Phase 4 safe create complete: create Rem/document/tree paths are bounded and folder creation returns `SDK_UNSUPPORTED` because the installed RemNote SDK typings do not expose folders.
15. Phase 5 scope control complete: plugin settings now enforce focused, focused-descendant, selected, selected-descendant, approved-root, or workspace scopes inside the plugin handler.
16. Phase 6 edit/reorder complete: `replace_rem` and `reorder_children` are exposed with approval and deterministic full-list validation.
17. Phase 7 secure delete complete: public delete is limited to focused/selected Rems with preview, typed `DELETE`, and approval; arbitrary-ID `delete_rem` remains gated by env flag.
18. Phase 8 reliability complete: request timeout, plugin disconnect, approval timeout, rejection, and duplicate approval paths return structured errors instead of hanging.
19. Phase 9 secure readiness complete: local auth/session/audit interfaces exist, local token auth still protects `/mcp`, and hosted mode is documented but hard-blocked until real OAuth/pairing is implemented.
20. Phase 10 release-readiness docs complete: README, architecture, safety, manual QA, and test matrix now match implemented code.
21. Follow-up reliability complete: live diagnostics, tool registry stamp, 24-tool default registry, client-disconnect cancellation, request outcome ledger, and task-focused plugin UI are implemented and smoke-tested.
22. 2026-05-09 closeout complete: MCP `tools/list` is asserted against the shared public registry, unknown MCP tool calls return structured `UNKNOWN_TOOL`, alias inputs match manual-test prompts, focused-descendant scope is wired, and the styled-tool SDK surface was audited without exposing fake tools.
23. 2026-05-10 rich-note closeout complete: MCP discovery now exposes 40 public tools, no-auth `initialize`/`tools/list` works for ChatGPT refresh, Simple/Advanced plugin UI landed, and SDK-backed rich text, heading, color, styled tree, math, and flashcard tools are public and smoke-tested.
24. 2026-05-14 milestone 1 complete and verified: diagnostics now distinguish listed tools from real plugin-verified tools, runtime-unverified tools, and SDK-unsupported tools.
25. 2026-05-14 milestone 2 complete and verified: bridge responses and diagnostics include lifecycle evidence, request IDs are visible in approval UI, timeout cleanup is fixed, and cancellation is recorded.
26. 2026-05-14 milestone 3 complete and verified: focused-descendant and approved-root scope enforcement remains active, while created Rem IDs and partial execution details are reported for same-operation write failures.
27. 2026-05-14 milestone 4 complete and verified: SDK formatting calls use supported color names and return `SDK_UNSUPPORTED` for unsupported whole-Rem highlight clearing or normal type reset paths.
28. 2026-05-14 milestone 5 complete and verified: rich text paths parse inline and display LaTeX delimiters into RemNote math nodes, with MCP smoke coverage.
29. 2026-05-14 milestone 6 complete and verified: `apply_structured_note_batch` is public and supports dry run, idempotency keys, rollback-on-failure details, verification, styles, nested children, flashcards, and math.
30. 2026-05-14 milestone 7 complete and verified: `create_rem_tree` now routes through the styled structured write engine, while `create_styled_rem_tree` remains the shared engine used by `apply_structured_note_batch`.
31. 2026-05-14 milestone 8 complete and verified: `run_bridge_health_check` records pass/fail/skipped results and `get_bridge_diagnostics` surfaces the last health check.
32. 2026-05-14 milestone 9 repo QA complete: safe/read smoke checks, structured note dry-run/apply checks, failure survival, timeout, disconnect, and cancellation checks pass in `server:smoke`.
33. 2026-05-14 RemNote knowledge pool complete: `get_remnote_capability_guide` exposes Rems, documents/folders/top-level Rems, formatting, flashcards, references/tags/portals, and bridge workflow guidance from RemNote help/forum sources.

## Current Phase

Milestones 1-9 are complete at repo validation level. The public registry now exposes 43 MCP tools. A real RemNote sandbox health check is still required before public hosted submission wording can claim live production readiness.

## Next Phase

Live sandbox closeout:

- run `run_bridge_health_check` against a disposable RemNote sandbox parent with `includeWrites=true`;
- record the health-check result from `get_bridge_diagnostics.lastHealthCheck`;
- verify ChatGPT refreshes the 43-tool registry after companion server restart.

Public hosted launch work remains later:

- implement real OAuth provider integration;
- implement pairing UI and persistent session store;
- deploy stable HTTPS `/mcp`;
- run ChatGPT Developer Mode through the hosted endpoint;
- collect app submission assets.

## Blocked Items

- `create_folder` remains blocked by installed `@remnote/plugin-sdk` folder API support.
- `create_styled_rem_tree` and `apply_structured_note_batch` are now public and smoke-tested. They use SDK rich text, font size, highlight, LaTeX, Rem type, card, and child creation helpers. Folder creation remains blocked by installed SDK support.
- Hosted mode remains blocked by real OAuth, persistent sessions, and revocation UI.
- Public submission remains blocked by privacy policy URL, support contact, screenshots, hosted HTTPS MCP URL, and one recorded live RemNote sandbox health-check pass.

## Shipping Verification

Run these before release:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
```

## Manual RemNote QA

Use a sandbox document first:

```text
Test KB Space / ChatGPT Bridge Sandbox
```

Manual checks:

- start plugin dev server with `npm run dev`;
- start companion server with a generated `REMNOTE_BRIDGE_TOKEN`;
- enter the same token in the plugin setting;
- confirm the bridge-status widget shows connected;
- confirm the widget shows the live tool count and registry stamp;
- if ChatGPT shows stale tools, restart the companion server and refresh the ChatGPT app/connector;
- call MCP `tools/list` and verify it matches `get_bridge_status.publicTools`;
- focus a test Rem and call `get_focused_rem`;
- call `get_bridge_diagnostics` and verify it reports 43 public tools, zero pending requests, no-auth discovery mode, the recent request ledger, and `lastHealthCheck`;
- call `get_remnote_capability_guide` and verify it returns Rems, documents/folders, formatting, flashcards, and bridge workflow guidance;
- call `run_bridge_health_check` with a sandbox `parentId`, first with `includeWrites=false`, then with `includeWrites=true`, and record pass/fail/skipped results;
- call `get_children` and verify direct child order;
- call `get_rem_breadcrumbs` and verify parent chain IDs/titles;
- call `search_rems` with a narrow query and verify bounded results;
- set `Bridge Permission Scope` to `focused_rem_only` and verify out-of-scope Rem IDs are rejected;
- set `Bridge Permission Scope` to `focused_rem_and_descendants` and verify a child created under the focused Rem can be read back while outside Rem IDs remain rejected;
- set `Approved Document or Folder` scope with a sandbox root Rem ID and verify writes outside that root are rejected;
- call `append_to_rem`, approve in RemNote, and verify child creation;
- call `append_to_rem`, reject in RemNote, and verify no child is created.
- call `create_document` inside the sandbox and verify the created Rem opens as a document;
- call `create_folder` and verify it returns `SDK_UNSUPPORTED`;
- call `reorder_children` with a full ordered direct-child ID list and verify order changes exactly;
- call `delete_focused_rem` on a disposable sandbox Rem, type `DELETE`, approve, and verify deletion;
- call `delete_selected_rem`, reject in RemNote, and verify no Rem is deleted.
- leave an approval pending until timeout and verify `APPROVAL_TIMEOUT`;
- open two write requests while one approval is pending and verify the second returns `APPROVAL_PENDING`;
- stop the plugin while a request is pending and verify `PLUGIN_NOT_CONNECTED`.
- interrupt/disconnect an MCP caller while approval is pending and verify the server records `CLIENT_DISCONNECTED` and the plugin approval is cancelled.

## Test Matrix

| Area | Test | Expected |
|---|---|---|
| Connection | plugin connects to server | connected status |
| Read | get focused Rem | returns selected content |
| Order | append child | appears after existing children |
| Tree | create ordered tree | order preserved and bounded |
| Approval | reject write | no write, `APPROVAL_REJECTED` |
| Timeout | ignore approval | `APPROVAL_TIMEOUT` |
| Duplicate approval | send second write while first is pending | `APPROVAL_PENDING` |
| Scope | write outside scope | `OUT_OF_SCOPE` |
| Delete | missing `DELETE` | blocked before approval |
| Disconnect | plugin disconnect during request | `PLUGIN_NOT_CONNECTED` |
| Client disconnect | MCP caller disconnects during approval | `CLIENT_DISCONNECTED` recorded and plugin approval cancelled |
| Server timeout | plugin does not respond | `TIMEOUT` |
| Diagnostics | call `get_bridge_diagnostics` | reports registry version, 43 tools, pending count, recent outcomes, and last health check |
| Health check | call `run_bridge_health_check` | records pass/fail/skipped tools without executing destructive deletes |
| Knowledge pool | call `get_remnote_capability_guide` | returns RemNote hierarchy/design/flashcard guidance |
| Invalid input | malformed bridge request | `INVALID_ARGS` |
| Auth | missing MCP bearer token | `401` |
| Hosted mode | `REMNOTE_BRIDGE_HOSTED_MODE=1` | startup fails intentionally |

## Release Notes

The MCP layer intentionally exposes bounded read tools, scoped safe writes, destructive-hinted replace, and focused/selected delete. Arbitrary-ID `delete_rem` remains blocked by default and can be exposed only with `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1` for local development.
