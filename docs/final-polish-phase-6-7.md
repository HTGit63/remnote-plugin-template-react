# Final Polish Phase 6-7

Date: 2026-05-17

## Phase 6 Status

Phase 6 is complete at repo and mock-runtime level.

Done:

- `server/src/mcp-server.ts` was reduced to the MCP composition layer.
- MCP schemas and shared tool context now live under `server/src/tools/`.
- Status, diagnostics, read, write, formatting, card, and delete MCP registrations now live in separate register modules.
- `src/remnote/write.ts` is now a compatibility barrel that exposes category files under `src/remnote/write/`.
- Existing imports from `../remnote/write` still work.
- Public registry order is preserved.
- Full profile and simple profile behavior are preserved.
- Hidden legacy delete tools remain hidden by default.

The protocol file was not split in this phase because it is still acting as the single shared contract between plugin, server, and widget code. Splitting it is lower value than the MCP server split and would increase contract drift risk without changing runtime behavior.

## Phase 7 Status

Phase 7 is complete for local automated QA and documentation. It is not complete for live RemNote, ChatGPT Developer Mode, or Render proof because those require external runtime sessions not available in this local pass.

Automated checks:

```text
npm run check-types: passed
npm run validate: passed
npm run build: passed with existing webpack asset-size warnings
npm run server:build: passed
npm run server:smoke: passed
npm audit: passed, 0 vulnerabilities
npm audit --omit=dev: passed, 0 vulnerabilities
git diff --check: passed
```

Live-test result:

```text
npm run bridge:live-test: reached local MCP when the companion server was started
passed: tools/list, get_bridge_status, get_bridge_diagnostics
failed as expected without a connected RemNote plugin: ping_remnote_plugin, get_plugin_status, get_focused_rem, search_rems
skipped sandbox writes because no MCP Regression Test Root / REMNOTE_LIVE_TEST_PARENT_ID was available
```

External checks still required before public production wording:

- Connect a real RemNote plugin session.
- Run `run_bridge_health_check` in `read_only`, `safe_write`, and `mutation_on_disposable_rem` modes against a disposable sandbox Rem.
- Run `npm run bridge:live-test` with `REMNOTE_LIVE_TEST_PARENT_ID` set.
- Refresh the connector in ChatGPT Developer Mode and run the golden prompts.
- Deploy Render, verify `/health`, `/diagnostics`, `/mcp`, hosted WSS plugin connection, and hosted ChatGPT MCP connection.

## Documentation Sources Checked

RemNote docs checked:

- `https://plugins.remnote.com/`
- `https://plugins.remnote.com/advanced/rem_api`
- `https://plugins.remnote.com/advanced/rich_text`
- `https://plugins.remnote.com/advanced/permissions`
- `https://plugins.remnote.com/advanced/widgets`

OpenAI Apps SDK docs checked:

- `https://developers.openai.com/apps-sdk/reference`
- `https://developers.openai.com/apps-sdk/deploy/connect-chatgpt`
- `https://developers.openai.com/apps-sdk/deploy/testing`
- `https://developers.openai.com/apps-sdk/deploy/submission`
- `https://developers.openai.com/apps-sdk/app-submission-guidelines`
- `https://developers.openai.com/apps-sdk/guides/security-privacy`
