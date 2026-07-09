# RemNote MCP Agent Operating Guide

This file is the binding operating guide for future Codex sessions working on this repository.

The repository is:

```text
/mnt/01DBAB8A7D80C830/Users/hunde/Documents/WebDEV/web.dev.projects/Remnote/remnote-plugin-template-react
```

The project is a RemNote plugin plus companion MCP server for ChatGPT, Codex, and other MCP clients.

The project is useful, but it is not finished.

Do not treat this repository as production-ready for mass use, large imports, long-running workflows, or reliable ChatGPT/Codex operation until the stages and final audits in this file are complete with evidence.

The current state is best described as:

```text
PARTIAL_LIVE_PROOF_ONLY
```
This means some core read/write/auth paths have worked in a focused live test, but bulk import, file-backed import, resume behavior, formula/card fidelity, large-scale workflows, and final ChatGPT/Codex production reliability remain unproven or broken.

## 1. How To Use This File

Read this file before making changes.

Treat it as a contract, not a suggestion.

When a user gives a narrower prompt, still preserve the safety and proof rules here unless the user explicitly overrides them.

When this file conflicts with current code, inspect the code and update this file only if the code proves the project state changed.

When this file conflicts with old reports or old docs, prefer current code plus fresh validation.

When this file says "live proof", it means a real RemNote plugin instance was connected and the tool actually affected or read RemNote runtime state.

When this file says "simulated proof", it means local tests, fakes, or server-local checks passed without a real RemNote runtime.

Never collapse those two categories.

## 2. Evidence Order

Use this evidence order when deciding what is true.

1. Current source code in this repo.
2. Fresh commands run in the current session.
3. Fresh live RemNote tests run in the current session.
4. Existing reports under `Remnote MCP test by Chagpt result with report/`.
5. Current docs under `docs/`.
6. `TOOL_REFERENCE.md`, if regenerated or verified against the current registry.
7. `log.md`, for history and old decisions.
8. Prior conversation memory, only as context.

Do not use old memory or old reports to claim current readiness.

Do use old memory and old reports to avoid repeating known mistakes.

## 3. Required First Steps For Any Substantial Session

For any non-trivial RemNote MCP task:

1. Run `pwd` and confirm the repo root.
2. Run `git status --short`.
3. Read this `Agents.md`.
4. Inspect the files named by the relevant stage in this file.
5. Use `rg` for search.
6. Preserve unrelated user changes.
7. Do not use destructive git commands.
8. Do not declare readiness without evidence.

For architecture, codebase, or broad planning work, use graphify first.

The graphify run from July 9, 2026 produced:

```text
graphify-out/graph.json
graphify-out/GRAPH_REPORT.md
graphify-out/.graphify_extract.json
```

Graphify mapped roughly:

```text
183 files
175,895 words
2,559 graph nodes
8,059 graph edges
132 communities
```

The most connected implementation areas in that graph were:

```text
src/remnote/write/structuredBatch.ts
shared/bridge/protocol-messages.ts
src/remnote/write/remnoteSdkHelpers.ts
src/remnote/write/formattingWrites.ts
src/remnote/write/treeWrites.ts
src/remnote/write/basicWrites.ts
src/remnote/write/markdownImportExecutor.ts
src/bridge/handlers.ts
src/remnote/write/cardWrites.ts
shared/bridge/protocol-write-args.ts
src/remnote/write/writeCaches.ts
shared/bridge/markdown-importer.ts
src/remnote/write/deleteWrites.ts
src/remnote/write/designedNoteTools.ts
src/remnote/write/verification.ts
src/remnote/write/writeValidation.ts
server/src/server/create-http-server.ts
shared/bridge/protocol-write-results.ts
```

If code changes after that graph was built, rerun:

```bash
graphify update .
```

or rebuild graphify if update cannot explain the changed area.

## 4. Skills Future Sessions Should Use

Use skills with judgment.

Do not invoke a skill name as theater.

Read the skill file before applying it.

For this project, the most relevant skills are:

```text
graphify
remnote-mcp-workflow-auditor
mcp-builder
superpowers:writing-plans
superpowers:test-driven-development
security-threat-model
codex-security:deep-security-scan
openai-docs
openai-developers:build-chatgpt-app
figma-create-design-system-rules
task-observer
nodejs-backend-patterns
improve-codebase-architecture
grill-me
caveman
```

Use `graphify` first for broad codebase understanding, dependency tracing, or architecture work.

Use `remnote-mcp-workflow-auditor` when validating tool workflows, cross-tool sequences, live-proof boundaries, and mass-note readiness.

Use `mcp-builder` when touching MCP server behavior, tool descriptors, transport, structured content, client compatibility, or tool-call semantics.

Use `superpowers:writing-plans` when a stage spans many files or must be executed over multiple sessions.

Use `superpowers:test-driven-development` when fixing tool behavior, idempotency, parsing, auth, or retry semantics.

Use `security-threat-model` before changing auth, pairing, token handling, scopes, deletion, logging, or deployment.

Use `codex-security:deep-security-scan` as a dedicated audit stage after major auth/tool changes. Do not pretend a doc-level security checklist is a full scan.

Use `openai-docs` before changing ChatGPT Apps SDK, MCP metadata, OAuth, or published app assumptions.

Use `openai-developers:build-chatgpt-app` for ChatGPT connector/app submission readiness, tool metadata, UX text, and production submission checks.

Use `figma-create-design-system-rules` only when extracting or formalizing UI rules. The current UI is React/CSS, not Figma-first.

Use `task-observer` during long multi-stage sessions to watch for plan drift and missing acceptance criteria.

Use `nodejs-backend-patterns` for server structure, auth middleware, routing, storage, and operational Node practices.

Use `improve-codebase-architecture` only when a real cross-module simplification is needed. Do not refactor for style alone.

Use `grill-me` for a hard pre-final critique of assumptions and missing proof.

Use `caveman` only when the user asks for terse communication. It does not reduce technical obligations.

## 5. Repository Map

The repo has five main runtime areas.

### 5.1 Plugin Runtime

Important files:

```text
src/index.tsx
src/widgets/index.tsx
src/widgets/bridge-status.tsx
src/widgets/components/BridgeWidgetPieces.tsx
src/widgets/bridge-panel/command-intents.ts
src/widgets/bridge-panel/options.ts
src/style.css
src/bridge/handlers.ts
src/bridge/handlers/approval.ts
src/bridge/handlers/scope.ts
src/bridge/client.ts
src/bridge/status.ts
```

The plugin UI configures bridge URL, local token, operation tier, scope tier, tool access tier, and approved root.

The plugin runtime mediates write approvals and executes RemNote SDK operations.

Do not bypass plugin-side permissions from the server.

### 5.2 RemNote Read/Write Engine

Important files:

```text
src/remnote/read.ts
src/remnote/permissions.ts
src/remnote/richTextFormatting.ts
src/remnote/write.ts
src/remnote/write/basicWrites.ts
src/remnote/write/treeWrites.ts
src/remnote/write/structuredBatch.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/verification.ts
src/remnote/write/writeValidation.ts
src/remnote/write/writeCaches.ts
src/remnote/write/cardWrites.ts
src/remnote/write/formattingWrites.ts
src/remnote/write/designedNoteTools.ts
src/remnote/write/deleteWrites.ts
src/remnote/write/tableWrites.ts
src/remnote/write-engine/
src/remnote/cards/
src/remnote/style/
src/remnote/tables/
src/remnote/templates/
```

This area is where most data correctness failures must be fixed.

It owns Rem hierarchy, write idempotency, Markdown import execution, readback verification, cards, formulas, styles, and destructive operation safety.

### 5.3 Shared Bridge Protocol

Important files:

```text
shared/bridge/protocol.ts
shared/bridge/protocol-core.ts
shared/bridge/protocol-messages.ts
shared/bridge/protocol-read.ts
shared/bridge/protocol-write-args.ts
shared/bridge/protocol-write-results.ts
shared/bridge/protocol-registry.ts
shared/bridge/markdown-importer.ts
shared/bridge/bulk-import.ts
shared/bridge/dry-run.ts
shared/bridge/performance.ts
shared/bridge/style-presets.ts
```

Shared bridge files must stay SDK-free.

They define protocol shape, import planning, bulk job state, message contracts, and shared result enums.

Do not import RemNote SDK or server-only dependencies here.

### 5.4 Companion MCP Server

Important files:

```text
server/src/index.ts
server/src/app.ts
server/src/config.ts
server/src/http.ts
server/src/mcp-server.ts
server/src/server/create-http-server.ts
server/src/bridge-hub.ts
server/src/bridge/session-router.ts
server/src/bridge/plugin-connection.ts
server/src/bridge/request-ledger.ts
server/src/tool-policy.ts
server/src/tool-registry.ts
server/src/tool-permissions.ts
server/src/tools/
server/src/auth/
server/src/storage/
server/src/sessions/
server/src/bulk-import/job-store.ts
server/src/health-check.ts
server/src/verification-status.ts
server/src/diagnostics-redaction.ts
```

The server owns MCP transport, OAuth, Codex bearer authentication, pairing, session routing, tool exposure, diagnostics, storage, and job orchestration.

MCP tool exposure is not the same as plugin capability.

Server-local tool registration is not live proof.

### 5.5 Tests And Smoke Suites

Important files:

```text
tests/
server/src/*smoke.ts
server/src/area1-smoke.ts
server/src/area2-smoke.ts
server/src/area3-certification.ts
server/src/live-test.ts
server/src/live-tool-smoke.ts
server/src/live-tool-regression.ts
server/src/mass-note-audit-report.ts
server/src/performance-benchmark.ts
server/src/markdown-pipeline-benchmark.ts
```

Local tests are necessary.

Live tests are also necessary.

Neither replaces the other.

## 6. Current Evidence Snapshot

This snapshot is from repository inspection on July 9, 2026.

Refresh it before using it as current evidence.

### 6.1 Files Reviewed For This Guide

The guide was based on:

```text
Agents.md
log.md
TOOL_REFERENCE.md
docs/engineering-guide.md
docs/remnote-mcp-repair-and-testing.md
Remnote MCP test by Chagpt result with report/old-report.md
Remnote MCP test by Chagpt result with report/new-report.md
package.json
server/package.json
render.yaml
server/src/config.ts
server/src/tool-policy.ts
server/src/tool-registry.ts
server/src/tool-permissions.ts
server/src/mcp-server.ts
server/src/server/create-http-server.ts
server/src/auth/oauth-routes.ts
server/src/auth/codex-token.ts
server/src/bridge-hub.ts
server/src/bridge/session-router.ts
server/src/bridge/plugin-connection.ts
server/src/tools/register-bulk-import-tools.ts
shared/bridge/bulk-import.ts
shared/bridge/markdown-importer.ts
src/remnote/write/markdownImportExecutor.ts
src/widgets/index.tsx
src/widgets/bridge-status.tsx
src/style.css
graphify-out/GRAPH_REPORT.md
```

### 6.2 What Improved Since The Older Report

The newer report shows real improvement over the older cycle.

Known improvements:

```text
Basic bridge status can work.
Plugin ping can work.
Focused Rem read can work.
Selection/root context can work.
Simple parent-scoped creation can work.
Same-key idempotency replay can avoid duplicates in a narrow live case.
Child and breadcrumb reads can work.
No-write preview can work.
Basic flashcard creation/readback can work in a narrow live case.
Simple color/highlight mutation can work in a narrow live case.
One inline formula readback can work in a narrow live case.
Short latency spot checks can pass.
```

The July 2, 2026 live addendum reported a disposable root:

```text
Focused Rem: Plugin Test
Focused Rem ID: OjLcSppWfIH0cpPoh
Disposable root ID: HZDcF0Y62bF9ptbfd
```

That proof is useful.

It is not enough for production readiness.

### 6.3 What Remains Broken Or Unproven

Known failures or unproven areas:

```text
Tiny bulk import job returned PARTIAL.
verify_note_import_job reported source_fidelity_failed.
Source sentence "Alpha source sentence." was missing in the live import result.
Bullet B/formula hierarchy was nested under Bullet A incorrectly.
Flashcard parser marker "both" emitted malformed extra basic card from a cloze line.
Full file-backed import was not live-run.
Full chapter import was not live-run.
apply_style_plan was not live-run in the latest report.
Cloze, multiple-choice, and list-answer live write paths were not fully proven.
Destructive cleanup was not live-run.
Long-running resume/retry behavior is not proven.
Mass note updates are not proven.
Large Markdown imports are not proven.
ChatGPT workflow is only partially proven.
Codex workflow needs more work and proof.
Connection persistence after RemNote closes/reopens needs proof.
Security needs a dedicated final audit.
Performance under large workloads needs proof.
UI quality still needs polish and real layout inspection.
```

### 6.4 Current Tool Registry Facts

The source registry defines many tools, but active exposure depends on profile and config.

Current source facts:

```text
server/src/tool-policy.ts defines DEFAULT_TOOL_PROFILE = mass_note_writer.
server/src/tool-policy.ts defines TOOL_SCHEMA_VERSION = 2026-06-25.problem-tool-status-matrix.
server/src/tool-registry.ts uses that registry version.
replace_rem is hidden until replacement guards and readback verification are live-proven safe.
create_folder is hidden because no modern RemNote SDK folder creation path is live-verified.
delete_rem_by_id is in the danger tier and must remain gated.
```

A local dist registry query on July 9, 2026 reported:

```text
declaredToolCount: 75
allPublicToolCount: 73
publicToolCount for mass_note_writer: 19
listedToolCount for mass_note_writer: 19
defaultToolProfile: mass_note_writer
activeToolProfile: mass_note_writer
toolRegistryVersion: 2026-06-25.problem-tool-status-matrix
```

Do not hardcode those counts in code or final reports.

Always re-query the registry after tool changes:

```bash
node - <<'NODE'
import('./server/dist/server/src/tool-registry.js').then((m) => {
  const summary = m.getToolRegistrySummary({ profile: 'mass_note_writer' });
  console.log(JSON.stringify({
    defaultToolProfile: summary.defaultToolProfile,
    activeToolProfile: summary.activeToolProfile,
    declaredToolCount: summary.declaredToolCount,
    allPublicToolCount: summary.allPublicToolCount,
    publicToolCount: summary.publicToolCount,
    listedToolCount: summary.listedToolCount,
    hiddenTools: summary.hiddenTools,
    toolRegistryVersion: summary.toolRegistryVersion,
  }, null, 2));
});
NODE
```

Build first if `server/dist` is stale:

```bash
npm run server:build
```

## 7. Non-Negotiable Safety Rules

Do not fake RemNote runtime success.

Do not treat MCP discovery as tool success.

Do not treat `get_bridge_status` as proof that a plugin is correctly routed.

Do not bypass plugin write approvals.

Do not bypass RemNote permission scopes.

Do not create a fake hosted user to make tests pass.

Do not use IP address alone as authentication.

Do not let Codex bearer auth bypass session routing or plugin approval.

Do not leak bearer tokens, OAuth tokens, refresh tokens, pairing codes, admin secrets, or local bridge tokens in logs or tool responses.

Do not expose destructive tools in normal profiles.

Do not run destructive live tests against user notes.

Do not clean up live test notes with delete tools unless the stage explicitly requires destructive proof and the user approved the scope.

Do not silently widen scope from focused Rem or approved root to workspace.

Do not write outside the requested parent scope.

Do not report `LIVE_PROVEN_READY` unless a real RemNote runtime was used and the evidence proves it.

Do not report `PRODUCTION_READY` until the final audit stage passes.

## 8. Proof Classes

Use these proof classes in reports.

```text
CODE_PRESENT
```

The code exists but was not validated.

```text
LOCAL_TESTED
```

Unit, integration, fake RemNote, or server-local tests passed.

```text
SERVER_LOCAL_PROVEN
```

Server-only MCP behavior, schema behavior, registry behavior, or bulk manifest behavior worked without a live RemNote plugin.

```text
SIMULATED_LIVE
```

A simulation intended to mimic live RemNote behavior passed.

```text
LIVE_PROVEN
```

A real RemNote plugin instance was connected and the operation was read or written through RemNote runtime.

```text
PARTIAL_LIVE_PROOF
```

Some live steps passed, but the workflow was incomplete, narrow, or had unresolved failures.

```text
FAILED_LIVE
```

The live RemNote workflow failed.

```text
BLOCKED
```

The test could not be executed because of missing credentials, missing plugin connection, unavailable RemNote runtime, missing server, or other external blocker.

Use exact commands, dates, Rem IDs, job IDs, and output summaries when reporting proof.

## 9. Auth And Connection Model

The current code supports two canonical deployment modes:

```text
local
hosted
```

`server/src/config.ts` still accepts older env strings:

```text
local_dev -> local
personal_hosted_token -> hosted
public_hosted_oauth -> hosted
```

`render.yaml` currently uses:

```text
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
```

This is accepted by `config.ts`, but future deployment cleanup should consider moving deployment config to the canonical `hosted` value after verifying no Render or docs dependency expects the legacy string.

### 9.1 Local Mode

Local mode is for local development.

Expected properties:

```text
MCP discovery is no-auth.
Tool calls require local bearer auth when a bridge token is configured.
No-auth local tool calls are only for isolated local development.
Remote bind requires an explicit token.
CORS with local remote access requires allowed origins.
ChatGPT pairing is disabled.
```

Local mode must never become an unauthenticated remote write server.

### 9.2 Hosted Mode

Hosted mode is for ChatGPT OAuth/pairing and hosted MCP use.

Expected properties:

```text
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1 is required.
SESSION_SECRET is required.
Allowed origins are required.
Public base URL must be valid.
OAuth and pairing control ChatGPT access.
Codex bearer auth may be available if REMNOTE_CODEX_TOKEN is configured.
The same /mcp endpoint can serve ChatGPT OAuth and Codex bearer lanes.
```

Hosted mode must not fall back to local bridge token semantics for MCP tool calls.

### 9.3 ChatGPT Lane

ChatGPT should use OAuth/pairing.

Future sessions must inspect:

```text
server/src/auth/oauth-routes.ts
server/src/auth/chatgpt-pairing-routes.ts
server/src/auth/pairing-routes.ts
server/src/bridge/session-router.ts
server/src/server/create-http-server.ts
chatgpt-app-submission.json
```

Verify:

```text
OAuth metadata is current.
Dynamic client registration redirect URI validation is safe.
PKCE S256 is required where expected.
Access token audience/resource validation works.
Pairing codes expire.
Pairing codes are single-use where intended.
Refresh tokens are stored safely.
ChatGPT scopes map to actual tool permissions.
The user sees a clear pairing-required response when needed.
The plugin status does not claim connected when the paired plugin is absent.
Reconnect is clear after RemNote closes and reopens.
```

Use official OpenAI docs before changing Apps SDK or ChatGPT app assumptions.

Relevant current OpenAI docs areas to verify:

```text
Apps SDK MCP server tool descriptor requirements.
Tool metadata and annotations.
OAuth/security scheme metadata.
Structured tool output expectations.
Published app version behavior.
Connector/app submission readiness.
```

### 9.4 Codex Lane

Codex bearer auth is separate from ChatGPT OAuth.

Future sessions must inspect:

```text
server/src/auth/codex-token.ts
server/src/auth/codex-pairing-routes.ts
server/src/codex-bearer-smoke.ts
server/src/codex-routing-smoke.ts
server/src/codex-pairing-smoke.ts
server/src/server/create-http-server.ts
server/src/bridge/session-router.ts
```

Verify:

```text
Bearer token comparison is timing-safe.
Token hashes are only diagnostic hashes.
Codex bearer can authenticate MCP requests.
Codex bearer cannot bypass plugin pairing/session routing.
Codex bearer cannot bypass write approvals.
Codex bearer cannot widen RemNote scope.
Codex gets clear errors for PLUGIN_NOT_PAIRED, PLUGIN_NOT_CONNECTED, and missing auth.
Codex retry behavior does not create duplicates.
Codex can run the intended tool workflow end to end against a real paired plugin.
```

Do not use IP address as a substitute for Codex auth.

Do not make Codex a privileged backdoor.

### 9.5 Plugin Connection Persistence

Future sessions must verify:

```text
Plugin connects after RemNote opens.
Plugin reconnects after RemNote closes and reopens.
Hosted session routes to the correct plugin instance.
Stale sessions do not receive writes.
Device conflict handling is clear.
Session IDs are not confused between ChatGPT and Codex clients.
Heartbeat timeout changes status from connected to stale/disconnected.
Late responses are diagnosed without corrupting future requests.
```

Inspect:

```text
server/src/bridge-hub.ts
server/src/bridge/plugin-connection.ts
server/src/bridge/request-ledger.ts
server/src/bridge/session-router.ts
src/bridge/client.ts
src/bridge/status.ts
src/widgets/bridge-status.tsx
```

## 10. Tool Correctness Contract

Every public MCP tool needs more than a registry check.

For every tool, future sessions must verify:

```text
The tool is listed only in the intended profiles.
The tool descriptor has clear title, description, arguments, and schema.
The tool validates input safely.
The tool returns useful errors.
The tool has the correct read/write/destructive risk metadata.
The tool respects auth.
The tool respects RemNote scope.
The tool respects write approval.
The tool works from ChatGPT where intended.
The tool works from Codex where intended.
The tool returns enough evidence for verification.
The tool can be repeated safely.
The tool is idempotent where promised.
Retries do not create duplicates.
Failures do not corrupt notes.
Parent scope is preserved.
Rem hierarchy is preserved.
Formula and rich text are preserved where promised.
Readback verification catches missing or misplaced content.
```

The following checks are not sufficient:

```text
Tool appears in a list.
Tool descriptor compiles.
Tool returns JSON from a local fake.
Tool returns "ok" without readback.
Tool works once on a trivial input.
Tool works in a server-local preview.
```

### 10.1 Tool Profile Intent

Current profile intent:

```text
basic: read/status tools only.
mass_note_writer: basic plus high-level Markdown and bulk import job tools.
note_writer: note creation, cards, design previews, and normal write tools.
power_user: mutation, repair, style, movement, and update tools.
developer: diagnostics and debug tools.
danger: destructive tools.
```

Normal ChatGPT/Codex mass-note operation should prefer `mass_note_writer`.

Do not expose `danger` in normal usage.

Do not expose debug-only tools to casual users unless explicitly configured.

### 10.2 Preferred Tool Workflows

For normal Markdown note work:

```text
preview_markdown_note_tree when no write is needed.
create_or_replace_note_from_markdown for high-level note write/update.
plan_note_import for large inline Markdown planning.
plan_note_import_from_file for file-backed planning.
start_note_import_job for resumable manifest creation.
run_note_import_job_step for bounded chunk writes.
get_note_import_job_status for progress.
resume_note_import_job for continuation.
verify_note_import_job for source fidelity.
cancel_note_import_job for stopping future chunks.
```

For ordinary reads:

```text
get_bridge_status
get_plugin_status
get_focused_rem
get_rem
get_children
get_rem_tree
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
```

For cards:

```text
create_card_set_from_note
create_flashcards_from_markdown
create_cloze_cards_from_note
verify_card_set
repair_card_set
```

For style/design:

```text
preview_note_design_plan
apply_style_plan
verify_note_design
verify_note_against_design
repair_note_design
```

For destructive work:

```text
delete_rem_by_id
```

Only use destructive work in dedicated audited stages with explicit approval.

## 11. Workflow Compatibility Contract

Tools must work together.

Future sessions must test realistic sequences.

### 11.1 Read Before Write

Workflow:

```text
get_bridge_status
get_plugin_status
get_focused_rem
get_rem_tree or get_document_or_folder_tree
preview or plan
write
read back
verify
repeat with same idempotency key
```

Acceptance:

```text
Correct parent.
Correct child order.
No duplicate root.
No duplicate children.
Clear readback proof.
```

### 11.2 Retry After Failure

Workflow:

```text
Start a bulk job.
Run one or more steps.
Force or simulate a failure.
Check status.
Resume.
Verify.
Repeat resume.
```

Acceptance:

```text
Already completed chunks are not rewritten.
Pending chunks resume.
Failed chunks have clear status.
Partial writes are not silently treated as verified.
Duplicate prevention is effective.
Source fidelity is checked after resume.
```

### 11.3 Style After Write

Workflow:

```text
Create or import a note.
Apply style plan.
Read rich text.
Verify style.
Verify plain text is not polluted.
Verify formula spans survived.
```

Acceptance:

```text
No visible style marker pollution.
No formula corruption.
No text loss.
No accidental style applied outside scope.
```

### 11.4 Cards After Note Creation

Workflow:

```text
Create a note with marked flashcard/cloze content.
Create cards from note or Markdown.
Read back cards.
Verify card set.
Retry card creation.
Repair if needed.
```

Acceptance:

```text
No extra malformed cards.
No duplicate cards on retry.
Card type matches source marker.
Cloze markers are preserved or transformed correctly.
Basic, cloze, multiple-choice, list-answer, concept, and descriptor paths are tested.
```

### 11.5 ChatGPT And Codex Against Same Plugin

Workflow:

```text
Pair ChatGPT.
Verify ChatGPT read/write.
Authenticate Codex bearer.
Verify Codex read/write to the same intended plugin session.
Disconnect plugin.
Verify both clients see correct disconnected state.
Reconnect plugin.
Verify no stale session confusion.
```

Acceptance:

```text
Correct client identity.
Correct plugin identity.
No cross-client routing.
No stale write.
Clear reconnect behavior.
```

## 12. Mass Note And Bulk Import Contract

The project must support large-scale RemNote work before it is finished.

Large-scale means:

```text
Large Markdown imports.
Long notes.
Many Rems.
Long-running jobs.
Retries.
Resume after failure.
Duplicate prevention.
Parent-scope safety.
Readback verification.
Source fidelity verification.
Clear progress.
Clear errors.
```

Current code areas:

```text
server/src/tools/register-bulk-import-tools.ts
server/src/bulk-import/job-store.ts
shared/bridge/bulk-import.ts
shared/bridge/markdown-importer.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/structuredBatch.ts
src/remnote/write/verification.ts
src/remnote/write/writeCaches.ts
tests/bulk-import.test.ts
tests/bulk-import-tools.test.ts
server/src/mass-note-audit-report.ts
server/src/markdown-pipeline-benchmark.ts
server/src/performance-benchmark.ts
```

Current limits and semantics to verify before changing:

```text
sourceText max in bulk tools is currently bounded.
file-backed import paths are restricted to allowed roots.
source files have size limits.
bulk job status includes partial, source_fidelity_failed, written_not_verified, verified, and related states.
job durability may be memory_only or persistent.
default chunk/options constrain max chars, Rem count, depth, and children.
```

Do not loosen file or size limits casually.

If limits are changed, update tests, docs, and threat model.

### 12.1 Source Fidelity

The latest live report shows source fidelity failure.

This is a P0/P1 class issue for mass use.

Future fixes must prove:

```text
Every source sentence intended for import appears in the resulting Rem tree.
Normalized text comparison handles Markdown syntax without masking lost content.
Formulas are preserved or faithfully transformed.
Hierarchy is correct.
Readback covers all chunks.
Verification failures point to missing source spans and destination Rem IDs where possible.
Partial verification is reported honestly.
```

Do not make verification weaker to pass tests.

### 12.2 Resume And Idempotency

Bulk jobs must be safely resumable.

Future fixes must prove:

```text
Job IDs are stable.
Chunk IDs are stable.
Idempotency keys are bounded and deterministic where needed.
Completed chunks are recognized.
Already-applied writes are reported as already_applied or equivalent.
Retrying the same chunk does not duplicate Rems.
Retrying after partial failure does not skip missing content.
Cancel stops future writes without deleting existing content.
Persistent storage works when configured.
Memory-only jobs are clearly labeled as not durable.
```

### 12.3 File-Backed Import

File-backed import is not production-proven.

Future sessions must verify:

```text
Allowed-root resolution is safe.
Path aliases behave predictably.
file:// paths do not escape allowed roots.
Connector-like URIs fail clearly or are supported explicitly.
Large files are rejected with clear errors.
Missing files are rejected with clear errors.
ChatGPT and Codex have a realistic file handoff path.
File-backed import does not require pasting huge Markdown into a tool call.
```

Do not fake connector file support with local-only paths.

## 13. Markdown, Formula, Card, And Style Fidelity

These features are central to RemNote quality.

They are not cosmetic.

### 13.1 Markdown

Verify:

```text
Headings map to intended Rem hierarchy.
Bullets map to intended Rem hierarchy.
Nested bullets do not swallow siblings.
Tables do not lose cells.
Code blocks are preserved or clearly unsupported.
Markdown anchors and headings are stable across retry.
Empty lines do not create useless Rems.
Long paragraphs are not split incorrectly.
```

### 13.2 Formulas

Verify:

```text
Inline formulas survive write/readback.
Block formulas survive write/readback if supported.
Latex delimiters are not duplicated.
Formula text does not become plain polluted text unless explicitly unsupported.
Formula spans inside bullets keep hierarchy.
Verification catches formula loss.
```

### 13.3 Cards

Known issue:

```text
The latest live report says marker "both" emitted a malformed extra basic card from a cloze line.
```

Future fixes must inspect:

```text
src/remnote/write/cardWrites.ts
src/remnote/cards/
server/src/tools/register-card-tools.ts
tests/card-verifier.test.ts
TOOL_REFERENCE.md
```

Verify:

```text
Basic cards.
Cloze cards.
Multiple-choice cards.
List-answer cards.
Concept cards.
Descriptor cards.
Markdown-derived cards.
Cards derived from an existing note.
Retry/idempotency for card creation.
verify_card_set catches malformed cards.
repair_card_set does not over-delete or duplicate.
```

### 13.4 Style And Design

Known older issue:

```text
Visible style pollution occurred in older testing.
```

The newer report did not fully live-run `apply_style_plan`.

Future fixes must inspect:

```text
src/remnote/write/formattingWrites.ts
src/remnote/write/designedNoteTools.ts
src/remnote/style/
src/remnote/templates/designTemplates.ts
server/src/tools/register-design-tools.ts
server/src/tools/register-formatting-tools.ts
tests/style-presets.test.ts
tests/design-template-preview.test.ts
src/remnote/write/style-correctness-regression.ts
```

Verify:

```text
Style writes do not insert visible marker text.
Style writes do not corrupt rich text.
Style writes do not erase formulas.
Style writes respect selected spans.
Design previews do not write.
Design repairs are scoped.
Design template import/export does not allow unsafe payloads.
```

## 14. UI And Design Contract

The plugin UI is mostly clean but not final.

Future UI work must inspect:

```text
src/widgets/index.tsx
src/widgets/bridge-status.tsx
src/widgets/components/BridgeWidgetPieces.tsx
src/widgets/bridge-panel/command-intents.ts
src/widgets/bridge-panel/options.ts
src/style.css
public/logo.svg
```

Required UI outcomes:

```text
Connection state is obvious.
Pairing state is obvious.
Tool tier is obvious.
Permission scope is obvious.
Approved root is obvious.
Pending write approval is obvious.
Errors are readable.
Loading/progress states are readable.
Reconnect instructions are clear.
Box overlap is fixed.
Spacing problems are fixed.
Status panels are not confusing.
The UI works in narrow RemNote panes.
The UI works in wider panes.
Long URLs and tokens do not break layout.
Advanced details do not dominate the first view.
Danger actions are visually separated.
```

Do not add marketing copy.

This is an operational tool.

Keep it dense, clear, and restrained.

Use 8px or smaller card radius unless the existing design system proves otherwise.

Do not nest decorative cards.

Use existing CSS variables where possible.

After UI changes, run:

```bash
npm run build
```

If practical, inspect the built plugin UI in RemNote or with a browser preview.

If no live UI preview is possible, report that limitation.

## 15. Security Contract

Security is a major unfinished area.

Do not treat it as a checkbox.

### 15.1 Security-Sensitive Files

Inspect these before changing auth or tool permissions:

```text
server/src/config.ts
server/src/server/create-http-server.ts
server/src/auth/oauth-routes.ts
server/src/auth/codex-token.ts
server/src/auth/local-token.ts
server/src/auth/token-verifier.ts
server/src/auth/pairing-routes.ts
server/src/auth/chatgpt-pairing-routes.ts
server/src/auth/codex-pairing-routes.ts
server/src/auth/dashboard-routes.ts
server/src/auth/dashboard-session.ts
server/src/auth/rate-limit.ts
server/src/bridge/session-router.ts
server/src/bridge-hub.ts
server/src/tool-permissions.ts
server/src/tool-policy.ts
server/src/tools/register-delete-tools.ts
server/src/audit-payload-safety.ts
server/src/diagnostics-redaction.ts
server/src/security/redaction.ts
server/src/storage/
server/src/sessions/audit-log.ts
src/remnote/permissions.ts
src/bridge/handlers/approval.ts
src/bridge/handlers/scope.ts
```

### 15.2 Threat Model Areas

Audit:

```text
Local bridge token handling.
Hosted OAuth access tokens.
Hosted OAuth refresh tokens.
Codex bearer token handling.
Pairing code generation and expiry.
Pairing replay.
Session fixation.
Stale session routing.
Cross-client routing.
Plugin instance confusion.
Permission scope widening.
Write approval bypass.
Destructive tool exposure.
Delete target validation.
Dry-run bypass.
CSRF on dashboard and pairing routes.
CORS allowed origins.
Rate limiting.
Body size limits.
Bridge message size limits.
File-backed import path traversal.
Log redaction.
Diagnostics redaction.
Audit log secret leakage.
Production env var defaults.
Connector compatibility no-auth mode.
```

### 15.3 Security Acceptance Rules

Security fixes are not done until:

```text
Relevant auth smoke tests pass.
Relevant boundary tests pass.
Relevant pairing/routing tests pass.
Manual threat model notes are updated.
No token or secret appears in logs/tool responses.
Danger tools remain hidden from normal profiles.
Codex bearer does not bypass RemNote scopes.
ChatGPT OAuth does not bypass RemNote scopes.
Connector compatibility mode cannot write without intended auth/permissions.
```

Suggested commands:

```bash
npm run server:test:auth
npm run server:test:codex-bearer
npm run server:test:codex-routing
npm run server:test:codex-pairing
npm run server:test:pairing
npm run server:test:routing
npm run server:test:connector-compat-routing
npm run server:test:security
npm run server:test:boundaries
npm run server:test:e2e-hosted-smoke
```

Run a dedicated deep security scan after major auth changes.

## 16. Performance And Reliability Contract

The project must be fast enough for large note workflows.

Current code areas:

```text
server/src/performance/tool-budgets.ts
server/src/performance-benchmark.ts
server/src/markdown-pipeline-benchmark.ts
server/src/mass-note-audit-report.ts
server/src/area3-certification.ts
shared/bridge/performance.ts
src/remnote/write/structuredBatch.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/verification.ts
```

Current timeout budget defaults in `server/src/config.ts` include:

```text
default request: 120s
high-level write: 180s
bulk step: 240s
read: 30s
mutation: 60s
write approval: 30s
reconnect retry window: 30s
```

Future sessions must verify:

```text
Small reads are fast.
Small writes are fast.
Large plan operations do not time out.
Bulk step size is bounded.
Large imports can progress chunk by chunk.
Timeouts return useful errors.
Long-running jobs can resume.
Request ledger does not leak promises.
Bridge heartbeat detects stale plugin state.
Diagnostics expose safe performance evidence.
```

Suggested commands:

```bash
npm run server:test:performance
npm run server:test:markdown-pipeline-benchmark
npm run server:test:performance-benchmark
npm run server:mass-note-audit
```

Live performance proof still requires real RemNote.

## 17. Code Quality Contract

Keep module boundaries clear.

Rules:

```text
Shared bridge code stays SDK-free and server-free.
Server code does not import plugin runtime code directly.
Plugin runtime code does not import server code.
Tool schemas should be structured and validated with Zod where used.
Avoid ad hoc string parsing when a structured parser exists.
Keep auth decisions in auth/permission modules.
Keep tool exposure decisions in tool-policy/tool-registry.
Keep write verification close to write execution.
Keep docs aligned with current code.
Do not add unrelated refactors.
Do not delete stale docs without checking whether they are referenced.
```

Run type/build validation after code changes:

```bash
npm run check-types
npm run build
npm run server:build
```

There is no root `lint` script in the current `package.json`.

Do not claim `npm run lint` passed unless a lint script is added and run.

## 18. Documentation Contract

Docs are part of production readiness.

Important docs:

```text
Agents.md
TOOL_REFERENCE.md
log.md
docs/engineering-guide.md
docs/remnote-mcp-repair-and-testing.md
Remnote MCP test by Chagpt result with report/old-report.md
Remnote MCP test by Chagpt result with report/new-report.md
```

After tool registry changes, regenerate:

```bash
npm run server:generate-tool-reference
```

Then inspect `TOOL_REFERENCE.md`.

Update docs when:

```text
Tool profiles change.
Auth behavior changes.
Pairing behavior changes.
Scope behavior changes.
Bulk import status semantics change.
Live proof changes.
Readiness verdict changes.
Test commands change.
Deployment env values change.
```

Do not edit old test reports to make them look better.

Add a new report or update current docs with new evidence.

## 19. Stage Plan

The remaining project should be finished in stages.

Each stage should fit one focused Codex session when possible.

Do not skip stages because a later stage looks more interesting.

Do not claim the project is done because one stage passed.

The expanded goal matrix below is authoritative.

The compact stage summaries after it are quick references only.

If a compact summary and expanded goal conflict, follow the expanded goal.

Every future stage session must execute one stage at a time.

Every goal must stay narrow.

Every goal must end in evidence or a clear blocker.

### 19.1 Skill Paths And Duplicate Resolution

Future sessions must check these skill roots before starting a stage:

```text
/home/hunde-tefera/.agents/skills
/home/hunde-tefera/.codex/skills
/home/hunde-tefera/.codex/plugins
```

If duplicate skill names exist, prefer the non-backup skill under:

```text
/home/hunde-tefera/.agents/skills
```

Use `/home/hunde-tefera/.codex/skills` when the skill only exists there or when the exact requested skill path points there.

Use `/home/hunde-tefera/.codex/plugins` for plugin-namespaced skills such as `superpowers:*`, `openai-developers:*`, and `codex-security:*`.

Common required skills for every stage:

```text
graphify
path: /home/hunde-tefera/.codex/skills/graphify/SKILL.md
use: query graph first, then inspect source files named by the graph.

caveman
path: /home/hunde-tefera/.agents/skills/caveman/SKILL.md
use: status/final updates in terse mode. Do not compress proof boundaries.

caveman-commit
path: /home/hunde-tefera/.agents/skills/caveman-commit/SKILL.md
use: commit-message generation only. Do not auto-commit unless user asks.
```

Primary RemNote skills:

```text
remnote-mcp-workflow-auditor
path: /home/hunde-tefera/.agents/skills/remnote-mcp-workflow-auditor/SKILL.md
use: RemNote workflow safety, live-proof boundaries, source fidelity, idempotency.

mcp-builder
path: /home/hunde-tefera/.agents/skills/mcp-builder/SKILL.md
use: MCP tools, descriptors, transport, schemas, tool-call semantics.

task-observer
path: /home/hunde-tefera/.agents/skills/task-observer/SKILL.md
use: long multi-step session drift checks.

nodejs-backend-patterns
path: /home/hunde-tefera/.agents/skills/nodejs-backend-patterns/SKILL.md
use: Node server, middleware, auth, storage, routing, errors.

improve-codebase-architecture
path: /home/hunde-tefera/.agents/skills/improve-codebase-architecture/SKILL.md
use: architecture cleanup only after behavior is stable.

grill-me
path: /home/hunde-tefera/.agents/skills/grill-me/SKILL.md
use: pre-final critique before claiming stage complete.
```

Primary plugin/codex skills:

```text
superpowers:writing-plans
path: /home/hunde-tefera/.codex/plugins/cache/openai-curated/superpowers/d6169bef/skills/writing-plans/SKILL.md
use: turn a stage into a bite-sized implementation plan before coding.

superpowers:test-driven-development
path: /home/hunde-tefera/.codex/plugins/cache/openai-curated/superpowers/d6169bef/skills/test-driven-development/SKILL.md
use: any bug fix, behavior change, refactor, or new test.

security-threat-model
path: /home/hunde-tefera/.codex/skills/security-threat-model/SKILL.md
use: auth, token, pairing, scope, file import, delete, logging.

codex-security:deep-security-scan
path: /home/hunde-tefera/.codex/plugins/cache/openai-curated-remote/codex-security/0.1.10/skills/deep-security-scan/SKILL.md
use: dedicated deep scan stage, not routine coding.

openai-docs
path: /home/hunde-tefera/.codex/skills/openai-docs/SKILL.md
use: current ChatGPT Apps SDK, MCP, OAuth, Codex docs.

openai-developers:build-chatgpt-app
path: /home/hunde-tefera/.codex/plugins/cache/openai-curated/openai-developers/d6169bef/skills/build-chatgpt-app/SKILL.md
use: ChatGPT app/connector readiness and metadata.

figma-create-design-system-rules
path: /home/hunde-tefera/.codex/skills/figma-create-design-system-rules/SKILL.md
use: UI rule extraction or design-system guidance only.
```

### 19.2 Stage Execution Rules

Each stage session must start with:

```bash
pwd
git status --short
test -f graphify-out/graph.json && graphify query "<stage question>" --budget 2000
```

Each stage session must then read:

```text
Agents.md
the stage goal cards
the target files named by the graph query
the tests named by the stage
```

Each stage goal must have:

```text
one objective
target files
likely change
dependent files to re-check
required skills
evidence command
done rule
```

Do not merge goals.

Do not fix future-stage issues unless current-stage tests prove they block current-stage completion.

Do not call a stage done with only static inspection.

Use this commit message style when user asks for a commit:

```text
docs(agents): expand RemNote MCP stage goals
```

or for code stages:

```text
fix(<scope>): <imperative narrow fix>
```

### 19.3 Authoritative Stage Goal Matrix

#### Stage 0: Evidence Refresh And Graph Map

Stage objective:

```text
Create current truth before any repair.
```

Goal 0.1: confirm workspace state.

```text
Objective: prove current repo path and dirty state.
Target files: none.
Likely change: none.
Dependent files to re-check: none.
Required skills: graphify, caveman, task-observer.
Evidence: `pwd`, `git status --short`, `git rev-parse --show-toplevel`.
Done rule: final stage note lists dirty files and says which are yours vs pre-existing.
```

Goal 0.2: query graph for the selected stage.

```text
Objective: identify files that graph says are central to the stage.
Target files: `graphify-out/graph.json`, `graphify-out/GRAPH_REPORT.md`.
Likely change: none unless graph is stale.
Dependent files to re-check: any file graph names as god node or adjacent dependency.
Required skills: graphify.
Evidence: `graphify query "<stage-specific question>" --budget 2000`.
Done rule: stage notes include graph query summary and file list.
```

Goal 0.3: refresh registry truth.

```text
Objective: know current declared/listed/callable tool counts.
Target files: `server/src/tool-registry.ts`, `server/src/tool-policy.ts`.
Likely change: none unless registry drift is discovered.
Dependent files to re-check: `TOOL_REFERENCE.md`, `server/src/mcp-server.ts`, `server/src/tools/tool-context.ts`.
Required skills: mcp-builder, remnote-mcp-workflow-auditor.
Evidence: `npm run server:build`, then registry summary node command.
Done rule: report exact profile, counts, hidden tools, registry version.
```

Goal 0.4: compare reports.

```text
Objective: isolate fixed, failed, partial, worse, and not-run items.
Target files: `Remnote MCP test by Chagpt result with report/old-report.md`, `Remnote MCP test by Chagpt result with report/new-report.md`.
Likely change: none.
Dependent files to re-check: `docs/remnote-mcp-repair-and-testing.md`, `docs/engineering-guide.md`.
Required skills: remnote-mcp-workflow-auditor, grill-me.
Evidence: written comparison in session notes or new report artifact if requested.
Done rule: stage notes name the top current blocker with evidence.
```

Goal 0.5: select exactly one next stage.

```text
Objective: prevent broad unfocused repair.
Target files: `Agents.md`.
Likely change: update recommended next stage only if evidence changes.
Dependent files to re-check: current stage section and final verdict section.
Required skills: writing-plans, caveman.
Evidence: one-sentence next-stage recommendation.
Done rule: next session can start without asking what to do.
```

#### Stage 1: Tool Registry And Descriptor Truth

Stage objective:

```text
Make MCP tool list honest, profile-aware, and client-safe.
```

Goal 1.1: prove source registry completeness.

```text
Objective: compare declared tools, public tools, hidden tools, and profile tools.
Target files: `server/src/tool-policy.ts`, `server/src/tool-registry.ts`.
Likely change: adjust metadata only when evidence shows wrong tier/risk/profile.
Dependent files to re-check: `server/src/mcp-server.ts`, `TOOL_REFERENCE.md`, `tests/tool-status-matrix.test.ts`.
Required skills: graphify, mcp-builder, remnote-mcp-workflow-auditor.
Evidence: `npm run server:test:tool-profile`.
Done rule: every exposed profile has expected listed tools and hidden reasons.
```

Goal 1.2: verify descriptor annotations.

```text
Objective: ensure read/write/destructive annotations match real behavior.
Target files: `server/src/tools/tool-context.ts`, `server/src/tools/*.ts`, `server/src/mcp-server.ts`.
Likely change: fix `readOnlyHint`, `destructiveHint`, `openWorldHint`, titles, descriptions, and scopes.
Dependent files to re-check: `chatgpt-app-submission.json`, OpenAI Apps metadata docs.
Required skills: mcp-builder, openai-docs, openai-developers:build-chatgpt-app.
Evidence: `npm run server:test:tool-schemas`.
Done rule: no write/destructive tool is mislabeled as read-only.
```

Goal 1.3: verify schema-input compatibility.

```text
Objective: confirm each tool schema accepts documented args and rejects unsafe args.
Target files: `server/src/tools/schemas.ts`, `server/src/tools/register-*.ts`.
Likely change: narrow/rename schema fields or add aliases only when compatibility requires.
Dependent files to re-check: `shared/bridge/protocol-write-args.ts`, `shared/bridge/protocol-read.ts`, `server/src/mcp-tool-map.ts`.
Required skills: superpowers:test-driven-development, mcp-builder.
Evidence: failing schema test first, then `npm run server:test:tool-schemas`.
Done rule: schema behavior is covered by tests, not just TypeScript types.
```

Goal 1.4: regenerate tool reference.

```text
Objective: make docs match actual registry.
Target files: `TOOL_REFERENCE.md`.
Likely change: run generator; do not hand-edit generated rows except generator bugs.
Dependent files to re-check: `server/src/diagnostics/tool-reference-generator.ts`.
Required skills: mcp-builder, caveman-commit.
Evidence: `npm run server:generate-tool-reference`, then diff review.
Done rule: generated doc reflects current registry version and counts.
```

Goal 1.5: protect dangerous and unsupported tools.

```text
Objective: keep `delete_rem_by_id`, `replace_rem`, and `create_folder` safely classified.
Target files: `server/src/tool-policy.ts`, `server/src/tool-registry.ts`, `server/src/tools/register-delete-tools.ts`.
Likely change: tighten profile gating or hidden reasons if a test exposes drift.
Dependent files to re-check: `server/src/tool-permissions.ts`, `tests/tool-status-matrix.test.ts`.
Required skills: security-threat-model, remnote-mcp-workflow-auditor.
Evidence: `npm run server:test:tool-profile`, `npm run server:test:boundaries`.
Done rule: normal profiles cannot expose danger/unsupported tools.
```

Goal 1.6: verify client-facing discovery.

```text
Objective: prove tool list seen by MCP clients matches active profile.
Target files: `server/src/mcp-server.ts`, `server/src/server/create-http-server.ts`.
Likely change: fix active profile selection, request profile override, or discovery cache if mismatched.
Dependent files to re-check: `server/src/tools/tool-context.ts`, `server/src/tool-registry.ts`.
Required skills: mcp-builder, nodejs-backend-patterns.
Evidence: MCP client smoke or `server:test:tool-profile`.
Done rule: discovery output and registry summary agree.
```

#### Stage 2: Auth, Pairing, And Session Routing

Stage objective:

```text
Make ChatGPT OAuth, Codex bearer, and plugin routing separate but compatible.
```

Goal 2.1: verify deployment-mode truth.

```text
Objective: make local/hosted mode behavior explicit.
Target files: `server/src/config.ts`, `render.yaml`, `docs/engineering-guide.md`.
Likely change: canonicalize docs/env examples; do not remove legacy env aliases until tests prove safe.
Dependent files to re-check: `server/src/app.ts`, `server/src/health-check.ts`.
Required skills: nodejs-backend-patterns, security-threat-model.
Evidence: `npm run server:test:auth`, `npm run server:test:hosted-diagnostics`.
Done rule: diagnostics expose mode, auth mode, endpoints, pairing behavior.
```

Goal 2.2: verify MCP auth order.

```text
Objective: authenticate tool calls before permission validation.
Target files: `server/src/server/create-http-server.ts`, `server/src/auth/types.ts`, `server/src/tool-permissions.ts`.
Likely change: fix auth branch ordering or error mapping only if tests show wrong lane.
Dependent files to re-check: `server/src/mcp-server.ts`, `server/src/tools/tool-context.ts`.
Required skills: mcp-builder, security-threat-model.
Evidence: `npm run server:test:auth`, `npm run server:test:security`.
Done rule: missing/invalid token and missing OAuth cannot reach write handlers.
```

Goal 2.3: verify ChatGPT OAuth/pairing.

```text
Objective: prove ChatGPT lane creates valid paired principal and no fake user.
Target files: `server/src/auth/oauth-routes.ts`, `server/src/auth/chatgpt-pairing-routes.ts`, `server/src/auth/pairing-routes.ts`.
Likely change: fix redirect validation, PKCE, resource/audience, pairing status, or token storage.
Dependent files to re-check: `server/src/storage/types.ts`, `server/src/storage/postgres-store.ts`, `server/src/storage/memory-store.ts`.
Required skills: openai-docs, openai-developers:build-chatgpt-app, security-threat-model.
Evidence: `npm run server:test:pairing`, `npm run server:test:e2e-hosted-smoke`.
Done rule: paired ChatGPT principal maps to intended plugin session only.
```

Goal 2.4: verify Codex bearer lane.

```text
Objective: prove Codex bearer authenticates Codex to MCP, not to RemNote directly.
Target files: `server/src/auth/codex-token.ts`, `server/src/auth/codex-pairing-routes.ts`, `server/src/codex-bearer-smoke.ts`.
Likely change: fix token parsing, timing-safe comparison, diagnostics, or setup route behavior.
Dependent files to re-check: `server/src/server/create-http-server.ts`, `server/src/tool-permissions.ts`.
Required skills: security-threat-model, mcp-builder.
Evidence: `npm run server:test:codex-bearer`, `npm run server:test:codex-pairing`.
Done rule: bearer auth cannot bypass pairing, scope, or write approval.
```

Goal 2.5: verify session router isolation.

```text
Objective: prevent cross-client and stale-plugin routing.
Target files: `server/src/bridge/session-router.ts`, `server/src/bridge-hub.ts`, `server/src/bridge/plugin-connection.ts`.
Likely change: fix session lookup, plugin instance checks, device conflict behavior, or stale handling.
Dependent files to re-check: `server/src/routing-smoke.ts`, `server/src/codex-routing-smoke.ts`.
Required skills: remnote-mcp-workflow-auditor, nodejs-backend-patterns.
Evidence: `npm run server:test:routing`, `npm run server:test:codex-routing`.
Done rule: each request routes to one intended plugin or fails clearly.
```

Goal 2.6: verify auth error language.

```text
Objective: separate auth failure, pairing missing, plugin disconnected, and scope denied.
Target files: `server/src/server/create-http-server.ts`, `server/src/bridge-hub.ts`, `shared/bridge/protocol-core.ts`.
Likely change: refine error codes/messages only where current output confuses state.
Dependent files to re-check: `src/widgets/bridge-status.tsx`, `server/src/health-check.ts`.
Required skills: remnote-mcp-workflow-auditor, caveman.
Evidence: auth/routing smoke snapshots or exact curl/tool output.
Done rule: no false connected or fake success status.
```

Goal 2.7: update UI auth state if backend semantics change.

```text
Objective: keep plugin UI labels aligned with server state.
Target files: `src/widgets/bridge-status.tsx`, `src/widgets/index.tsx`, `src/bridge/status.ts`.
Likely change: adjust labels, pairing state, stale state, and reconnect copy.
Dependent files to re-check: `src/style.css`, `src/widgets/components/BridgeWidgetPieces.tsx`.
Required skills: figma-create-design-system-rules, remnote-mcp-workflow-auditor.
Evidence: `npm run build`, manual UI inspection if possible.
Done rule: UI does not claim paired/connected unless backend state proves it.
```

#### Stage 3: Scope, Write Approval, And Destructive Safety

Stage objective:

```text
Block unsafe writes before they reach RemNote.
```

Goal 3.1: map principal scope to tool permission.

```text
Objective: prove request principal scope is read by permission checks.
Target files: `server/src/tool-permissions.ts`, `server/src/auth/types.ts`.
Likely change: fix scope mapping or fallback logic.
Dependent files to re-check: `server/src/server/create-http-server.ts`, `server/src/tools/tool-context.ts`.
Required skills: security-threat-model, remnote-mcp-workflow-auditor.
Evidence: `npm run server:test:boundaries`.
Done rule: out-of-scope tool calls fail before plugin write.
```

Goal 3.2: preserve plugin-side scope enforcement.

```text
Objective: ensure server permission never replaces RemNote plugin checks.
Target files: `src/remnote/permissions.ts`, `src/bridge/handlers/scope.ts`.
Likely change: tighten handler checks or error propagation.
Dependent files to re-check: `src/bridge/handlers.ts`, `src/bridge/handlers/approval.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: Vitest boundary/unified-stage tests.
Done rule: fake server approval cannot write outside plugin-approved scope.
```

Goal 3.3: enforce trusted-write requirement.

```text
Objective: require explicit trusted write where high-risk writes need it.
Target files: `server/src/tool-permissions.ts`, `src/bridge/handlers/approval.ts`.
Likely change: fix `TRUSTED_WRITE_REQUIRED` handling or approval prompts.
Dependent files to re-check: `server/src/tool-policy.ts`, `src/widgets/bridge-status.tsx`.
Required skills: security-threat-model, remnote-mcp-workflow-auditor.
Evidence: `npm run server:test:boundaries`, targeted approval tests.
Done rule: trusted-write missing cannot silently downgrade into normal write.
```

Goal 3.4: harden destructive operations.

```text
Objective: keep delete/replace impossible without exact guards.
Target files: `server/src/tools/register-delete-tools.ts`, `src/remnote/write/deleteWrites.ts`, `server/src/tool-policy.ts`.
Likely change: require dry-run, expected parent, expected title, ancestor, and danger profile.
Dependent files to re-check: `server/src/tool-registry.ts`, `TOOL_REFERENCE.md`.
Required skills: security-threat-model, codex-security:deep-security-scan if broad changes.
Evidence: `npm run server:test:boundaries`, targeted delete tests.
Done rule: normal ChatGPT/Codex cannot delete by accident.
```

Goal 3.5: make scope errors actionable.

```text
Objective: error tells user which scope is required and what was provided.
Target files: `server/src/tool-permissions.ts`, `server/src/tools/tool-context.ts`, `shared/bridge/protocol-core.ts`.
Likely change: improve error payload and user-facing message.
Dependent files to re-check: `src/widgets/bridge-status.tsx`, docs.
Required skills: remnote-mcp-workflow-auditor, caveman.
Evidence: failing/passing tests for error shape.
Done rule: no generic "failed" for scope/approval denial.
```

Goal 3.6: verify no auth lane bypasses scope.

```text
Objective: test local bearer, hosted OAuth, and Codex bearer against same scope boundary.
Target files: `server/src/boundary-smoke.ts`, `server/src/auth-smoke.ts`, `server/src/codex-bearer-smoke.ts`.
Likely change: add regression cases, not production shortcuts.
Dependent files to re-check: `server/src/server/create-http-server.ts`.
Required skills: superpowers:test-driven-development, security-threat-model.
Evidence: `npm run server:test:auth`, `npm run server:test:codex-bearer`, `npm run server:test:boundaries`.
Done rule: all auth lanes produce same safety result for same requested scope.
```

#### Stage 4: Tool-By-Tool Correctness Matrix

Stage objective:

```text
Give every public tool an honest current status.
```

Goal 4.1: rebuild tool inventory.

```text
Objective: enumerate declared, public, profile-listed, callable, hidden, unsupported tools.
Target files: `server/src/tool-registry.ts`, `TOOL_REFERENCE.md`.
Likely change: update generator or registry metadata if counts drift.
Dependent files to re-check: `server/src/tool-policy.ts`, `tests/tool-status-matrix.test.ts`.
Required skills: mcp-builder, graphify.
Evidence: registry summary node command.
Done rule: matrix uses current counts, not old report counts.
```

Goal 4.2: audit read/status tools.

```text
Objective: prove read tools return safe evidence without writes.
Target files: `server/src/tools/register-read-tools.ts`, `server/src/tools/register-status-tools.ts`, `src/remnote/read.ts`.
Likely change: fix argument validation or diagnostics redaction.
Dependent files to re-check: `shared/bridge/protocol-read.ts`, `tests/read-tools.test.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run test -- tests/read-tools.test.ts`, `npm run server:test:tools-core`.
Done rule: read tools cannot mutate or leak secrets.
```

Goal 4.3: audit write tools.

```text
Objective: prove each write tool has scope, approval, idempotency, and readback status.
Target files: `server/src/tools/register-write-tools.ts`, `src/remnote/write/*.ts`.
Likely change: fix wrappers, result envelopes, or verification fields.
Dependent files to re-check: `shared/bridge/protocol-write-results.ts`, `tests/write-idempotency-duplicates.test.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run server:test:tools-advanced`, targeted Vitest.
Done rule: no write tool reports success without enough verification context.
```

Goal 4.4: audit diagnostic tools.

```text
Objective: ensure diagnostics help agents without leaking secrets.
Target files: `server/src/tools/register-diagnostic-tools.ts`, `server/src/diagnostics-redaction.ts`, `server/src/health-check.ts`.
Likely change: redact fields, separate local/hosted state, add version/profile fields.
Dependent files to re-check: `server/src/security/redaction.ts`, `server/src/verification-status.ts`.
Required skills: security-threat-model, mcp-builder.
Evidence: `npm run server:test:tools-diagnostics`, `npm run server:test:hosted-diagnostics`.
Done rule: diagnostics expose truth and hide secrets.
```

Goal 4.5: update matrix test.

```text
Objective: make `tests/tool-status-matrix.test.ts` enforce current expected truth.
Target files: `tests/tool-status-matrix.test.ts`.
Likely change: add rows for status, profile, hidden reason, live-proof requirement.
Dependent files to re-check: `docs/remnote-mcp-repair-and-testing.md`.
Required skills: superpowers:test-driven-development.
Evidence: watch test fail on old mismatch, then pass.
Done rule: future tool drift fails a test.
```

Goal 4.6: label unproven tools honestly.

```text
Objective: mark tools that compile but lack live proof.
Target files: `server/src/tool-registry.ts`, `TOOL_REFERENCE.md`, `docs/remnote-mcp-repair-and-testing.md`.
Likely change: update metadata fields or docs, not fake runtime verification.
Dependent files to re-check: `server/src/verification-status.ts`.
Required skills: remnote-mcp-workflow-auditor, grill-me.
Evidence: generated reference plus audit note.
Done rule: no registry-only tool is called live-verified.
```

#### Stage 5: Workflow Compatibility And Retry Safety

Stage objective:

```text
Prove tools compose safely across realistic sequences.
```

Goal 5.1: build read-preview-write-readback flow.

```text
Objective: verify normal note flow creates one correct tree.
Target files: `tests/agents-staged-repair-simulation.test.ts`, `server/src/area3-certification.ts`.
Likely change: add sequence case with preview, write, readback, same-key retry.
Dependent files to re-check: `src/remnote/write/markdownImportExecutor.ts`, `src/remnote/write/writeCaches.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run test:agents-simulated-live`, `npm run server:test:area3`.
Done rule: retry creates zero duplicate Rems in simulation/local gate.
```

Goal 5.2: verify retry classification.

```text
Objective: distinguish `already_applied`, retryable unknown, partial, and failed.
Target files: `server/src/tools/tool-context.ts`, `shared/bridge/protocol-write-results.ts`, `src/remnote/write/writeCaches.ts`.
Likely change: fix status mapping and result envelope.
Dependent files to re-check: `tests/agents-staged-repair-simulation.test.ts`, `server/src/area3-certification.ts`.
Required skills: superpowers:test-driven-development, remnote-mcp-workflow-auditor.
Evidence: targeted test for each status.
Done rule: no unknown retry is promoted to verified.
```

Goal 5.3: verify style-after-write flow.

```text
Objective: ensure style tools do not corrupt created content.
Target files: `src/remnote/write/formattingWrites.ts`, `src/remnote/write/verification.ts`, `tests/style-presets.test.ts`.
Likely change: fix style result/readback only if tests reproduce corruption.
Dependent files to re-check: `src/remnote/richTextFormatting.ts`, `src/remnote/write/styleMutationInvariant.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run test:style-correctness`.
Done rule: text/formula unchanged except intended style spans.
```

Goal 5.4: verify cards-after-note flow.

```text
Objective: ensure card generation from note content does not duplicate/misclassify.
Target files: `src/remnote/write/cardWrites.ts`, `tests/card-verifier.test.ts`.
Likely change: fix parser or card idempotency.
Dependent files to re-check: `server/src/tools/register-card-tools.ts`, `src/remnote/cards/`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run test -- tests/card-verifier.test.ts`.
Done rule: repeated card workflow has stable card count.
```

Goal 5.5: verify cross-client state isolation in workflow tests.

```text
Objective: ChatGPT and Codex sequences cannot confuse plugin session state.
Target files: `server/src/area3-certification.ts`, `server/src/codex-routing-smoke.ts`, `server/src/routing-smoke.ts`.
Likely change: add sequence assertion; fix routing only in Stage 2 if root cause is auth.
Dependent files to re-check: `server/src/bridge/session-router.ts`.
Required skills: mcp-builder, security-threat-model.
Evidence: `npm run server:test:routing`, `npm run server:test:codex-routing`.
Done rule: sequence fails safely when plugin disconnects.
```

#### Stage 6: Bulk Import Source Fidelity

Stage objective:

```text
Fix the current highest-value failure: bulk import partial/source fidelity.
```

Goal 6.1: reproduce July 2 failure locally.

```text
Objective: create a local test for missing sentence and bad Bullet B hierarchy.
Target files: `tests/bulk-import.test.ts`, `tests/bulk-import-tools.test.ts`, `Remnote MCP test by Chagpt result with report/new-report.md`.
Likely change: add fixture matching tiny live import case.
Dependent files to re-check: `shared/bridge/markdown-importer.ts`, `src/remnote/write/markdownImportExecutor.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: new test fails before implementation.
Done rule: failure reproduces without weakening assertions.
```

Goal 6.2: fix Markdown hierarchy parser.

```text
Objective: ensure sibling bullets remain siblings and formulas attach to correct node.
Target files: `shared/bridge/markdown-importer.ts`.
Likely change: adjust bullet stack, heading collapse, formula-node handling, or source span mapping.
Dependent files to re-check: `shared/bridge/bulk-import.ts`, `src/remnote/write/markdownImportExecutor.ts`.
Required skills: superpowers:test-driven-development, graphify.
Evidence: parser fixture passes and no existing markdown tests regress.
Done rule: Bullet B no longer nests under Bullet A unless source does.
```

Goal 6.3: fix source fidelity comparison.

```text
Objective: report exact missing normalized source spans.
Target files: `shared/bridge/markdown-importer.ts`, `src/remnote/write/verification.ts`.
Likely change: improve `verifyMarkdownSourceFidelity` inputs/normalization/report fields.
Dependent files to re-check: `shared/bridge/protocol-write-results.ts`, `server/src/tools/register-bulk-import-tools.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run server:test:source-fidelity`.
Done rule: missing "Alpha source sentence." fails with exact missing span.
```

Goal 6.4: block false verified status.

```text
Objective: prevent chunk write success from becoming verified without readback fidelity.
Target files: `shared/bridge/bulk-import.ts`, `server/src/tools/register-bulk-import-tools.ts`, `src/remnote/write/markdownImportExecutor.ts`.
Likely change: keep `written_not_verified`, `partial`, or `source_fidelity_failed` until readback passes.
Dependent files to re-check: `server/src/bulk-import/job-store.ts`, `server/src/area3-certification.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: status tests covering write success + failed verification.
Done rule: no status promotion without `verification.passed === true`.
```

Goal 6.5: preserve idempotency during bulk retry.

```text
Objective: same bulk chunk/idempotency key cannot duplicate root or children.
Target files: `src/remnote/write/writeCaches.ts`, `src/remnote/write/markdownImportExecutor.ts`, `shared/bridge/bulk-import.ts`.
Likely change: adjust stable hash, root matching, or already-applied detection.
Dependent files to re-check: `tests/write-idempotency-duplicates.test.ts`, `tests/bulk-import-tools.test.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: retry test proves zero duplicate creation.
Done rule: duplicate prevention holds even after partial failure.
```

Goal 6.6: align MCP tool envelopes.

```text
Objective: bulk tools return clear job/chunk/verification evidence to clients.
Target files: `server/src/tools/register-bulk-import-tools.ts`, `server/src/tools/tool-context.ts`, `shared/bridge/bulk-import.ts`.
Likely change: add or normalize fields for job ID, chunk ID, status, missing spans, created Rem IDs.
Dependent files to re-check: `TOOL_REFERENCE.md`, `server/src/diagnostics/tool-reference-generator.ts`.
Required skills: mcp-builder, remnote-mcp-workflow-auditor.
Evidence: `npm run server:test:markdown-importer`, schema/tool tests.
Done rule: ChatGPT/Codex can tell whether import is verified, partial, or failed.
```

Goal 6.7: update mass-note audit expectations.

```text
Objective: make audit generator reflect fixed bulk fidelity status.
Target files: `server/src/mass-note-audit-report.ts`, `docs/remnote-mcp-repair-and-testing.md`.
Likely change: update expected statuses and failure taxonomy only after code passes.
Dependent files to re-check: `reports/` if generated, `TOOL_REFERENCE.md`.
Required skills: remnote-mcp-workflow-auditor, caveman-commit.
Evidence: `npm run server:mass-note-audit`.
Done rule: audit does not overclaim live proof.
```

Goal 6.8: define live re-test script.

```text
Objective: specify exact disposable-root live test for the fixed tiny bulk job.
Target files: `server/src/live-tool-regression.ts`, `server/src/live-tool-smoke.ts`, docs if needed.
Likely change: add or update live regression case behind existing live env gates.
Dependent files to re-check: `server/src/live-test.ts`, `docs/engineering-guide.md`.
Required skills: remnote-mcp-workflow-auditor, task-observer.
Evidence: live command run only when real plugin/root available; otherwise BLOCKED with reason.
Done rule: local fix has a clear live proof path.
```

#### Stage 7: Bulk Resume And Persistent Job Durability

Stage objective:

```text
Make long-running imports restartable without duplicate or lost chunks.
```

Goal 7.1: map job state machine.

```text
Objective: define valid chunk/job transitions.
Target files: `shared/bridge/bulk-import.ts`, `server/src/bulk-import/job-store.ts`.
Likely change: make transition rules explicit or add helper for status changes.
Dependent files to re-check: `server/src/tools/register-bulk-import-tools.ts`.
Required skills: superpowers:writing-plans, nodejs-backend-patterns.
Evidence: unit tests for allowed/disallowed transitions.
Done rule: no ambiguous transition from failed/partial to verified.
```

Goal 7.2: verify memory job durability language.

```text
Objective: label memory-only jobs as not durable.
Target files: `shared/bridge/bulk-import.ts`, `server/src/tools/register-bulk-import-tools.ts`.
Likely change: expose `storageDurability` consistently in status responses.
Dependent files to re-check: `TOOL_REFERENCE.md`, `docs/engineering-guide.md`.
Required skills: remnote-mcp-workflow-auditor, mcp-builder.
Evidence: status tool test.
Done rule: clients know whether restart will lose job state.
```

Goal 7.3: verify persistent storage path.

```text
Objective: prove Postgres store can persist bulk job/session data where intended.
Target files: `server/src/storage/postgres-store.ts`, `server/src/storage/types.ts`, `server/src/bulk-import/job-store.ts`.
Likely change: add storage adapter methods or fix serialization.
Dependent files to re-check: `server/src/config.ts`, `server/src/storage/memory-store.ts`.
Required skills: nodejs-backend-patterns, security-threat-model.
Evidence: storage tests or smoke with configured `DATABASE_URL`; BLOCKED if DB absent.
Done rule: persistence proof is separated from memory-only proof.
```

Goal 7.4: verify resume operation.

```text
Objective: resume only pending/failed-safe chunks.
Target files: `server/src/tools/register-bulk-import-tools.ts`, `server/src/bulk-import/job-store.ts`.
Likely change: fix resume selection and chunk ordering.
Dependent files to re-check: `shared/bridge/bulk-import.ts`, `src/remnote/write/markdownImportExecutor.ts`.
Required skills: superpowers:test-driven-development, remnote-mcp-workflow-auditor.
Evidence: interrupted job test then resume test.
Done rule: completed chunks are not rewritten.
```

Goal 7.5: verify cancel operation.

```text
Objective: cancel future work without deleting already written content.
Target files: `server/src/tools/register-bulk-import-tools.ts`, `shared/bridge/bulk-import.ts`.
Likely change: clarify cancel status and prevent later steps unless resumed explicitly if supported.
Dependent files to re-check: `server/src/bulk-import/job-store.ts`.
Required skills: mcp-builder, remnote-mcp-workflow-auditor.
Evidence: cancel/status/step tests.
Done rule: cancel cannot be misread as cleanup/delete.
```

Goal 7.6: include resume in mass-note audit.

```text
Objective: audit long-running behavior, not only one-shot import.
Target files: `server/src/mass-note-audit-report.ts`, `server/src/area3-certification.ts`.
Likely change: add resume scenarios and clear evidence labels.
Dependent files to re-check: docs and generated reports.
Required skills: remnote-mcp-workflow-auditor, task-observer.
Evidence: `npm run server:mass-note-audit`, `npm run server:test:area3`.
Done rule: audit states resume tested or blocked.
```

#### Stage 8: File-Backed And Connector-Scale Imports

Stage objective:

```text
Make huge source handoff safe without pasting giant Markdown into tool args.
```

Goal 8.1: verify file path normalization.

```text
Objective: accept intended aliases and reject unsafe paths.
Target files: `server/src/tools/register-bulk-import-tools.ts`.
Likely change: adjust `path`, `filePath`, `sourceFilePath`, `sourceFileUri`, object-file handling.
Dependent files to re-check: `tests/bulk-import-tools.test.ts`, `server/src/audit-payload-safety.ts`.
Required skills: security-threat-model, superpowers:test-driven-development.
Evidence: path alias and traversal tests.
Done rule: safe aliases work; traversal fails.
```

Goal 8.2: verify allowed roots.

```text
Objective: keep file reads inside explicit safe roots.
Target files: `server/src/tools/register-bulk-import-tools.ts`, `server/src/config.ts`.
Likely change: tune allowed-root list or env override validation.
Dependent files to re-check: docs and security audit.
Required skills: security-threat-model, nodejs-backend-patterns.
Evidence: tests for allowed and denied roots.
Done rule: no root escape through symlink, `file://`, relative path, or URI alias.
```

Goal 8.3: verify source-size behavior.

```text
Objective: reject huge files/messages with clear errors.
Target files: `server/src/config.ts`, `server/src/tools/register-bulk-import-tools.ts`, `server/src/server/create-http-server.ts`.
Likely change: align tool file limits with body/bridge message limits.
Dependent files to re-check: `shared/bridge/bulk-import.ts`, docs.
Required skills: nodejs-backend-patterns, security-threat-model.
Evidence: oversized file/body tests.
Done rule: failure is clear and safe; no partial file read.
```

Goal 8.4: verify ChatGPT file handoff truth.

```text
Objective: document whether ChatGPT can pass files into current server flow.
Target files: `chatgpt-app-submission.json`, `docs/engineering-guide.md`, `server/src/tools/register-bulk-import-tools.ts`.
Likely change: update docs/tool descriptions; implement only if official docs support it.
Dependent files to re-check: OpenAI Apps docs, MCP descriptor metadata.
Required skills: openai-docs, openai-developers:build-chatgpt-app, mcp-builder.
Evidence: official-doc citation in notes and tested behavior or honest unsupported status.
Done rule: no fake connector file support claim.
```

Goal 8.5: verify Codex local file handoff.

```text
Objective: prove Codex can reference local files only through authenticated safe server path.
Target files: `server/src/tools/register-bulk-import-tools.ts`, `CODEX_MCP_SETUP.md` if present or docs.
Likely change: add docs and tests for local paths.
Dependent files to re-check: `server/src/auth/codex-token.ts`, `server/src/tool-permissions.ts`.
Required skills: mcp-builder, security-threat-model.
Evidence: safe local file test and denied unsafe path test.
Done rule: Codex file path support does not widen auth/scope.
```

#### Stage 9: Markdown, Formula, And Rich Text Fidelity

Stage objective:

```text
Make imported note content faithful at Markdown, formula, and rich-text levels.
```

Goal 9.1: fix heading/bullet structure.

```text
Objective: headings and bullets become intended Rem hierarchy.
Target files: `shared/bridge/markdown-importer.ts`, `src/remnote/write/markdownImportExecutor.ts`.
Likely change: parser tree rules, heading collapse, list stack behavior.
Dependent files to re-check: `tests/structured-batch.test.ts`, `tests/bulk-import.test.ts`.
Required skills: superpowers:test-driven-development, remnote-mcp-workflow-auditor.
Evidence: nested heading/bullet fixtures pass.
Done rule: hierarchy readback matches source outline.
```

Goal 9.2: preserve formula spans.

```text
Objective: inline/block formulas survive write/readback.
Target files: `src/remnote/richTextFormatting.ts`, `src/remnote/write/remnoteSdkHelpers.ts`, `src/remnote/write/markdownImportExecutor.ts`.
Likely change: adjust Latex span parsing or rich text conversion.
Dependent files to re-check: `src/remnote/write/verification.ts`, style tests.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: local formula fixture plus live formula test when available.
Done rule: formulas not duplicated, dropped, or plain-text polluted.
```

Goal 9.3: preserve tables and code blocks.

```text
Objective: table/code content is preserved or honestly unsupported.
Target files: `shared/bridge/markdown-importer.ts`, `src/remnote/write/tableWrites.ts`.
Likely change: table parser output or unsupported-result reporting.
Dependent files to re-check: `shared/bridge/protocol-write-results.ts`.
Required skills: superpowers:test-driven-development, remnote-mcp-workflow-auditor.
Evidence: table/code fixtures.
Done rule: unsupported content is reported, not silently lost.
```

Goal 9.4: improve readback normalization.

```text
Objective: compare source and RemNote output without hiding loss.
Target files: `src/remnote/write/verification.ts`, `shared/bridge/markdown-importer.ts`.
Likely change: normalize markdown syntax, formula delimiters, whitespace, but preserve semantic text.
Dependent files to re-check: source-fidelity tests and bulk tests.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: missing-text test still fails; formatting-only differences pass.
Done rule: fidelity checks are strict enough to catch real loss.
```

Goal 9.5: define formula live matrix.

```text
Objective: list exact formula live cases for final proof.
Target files: `server/src/live-tool-regression.ts`, `docs/remnote-mcp-repair-and-testing.md`.
Likely change: add gated live cases and docs.
Dependent files to re-check: `server/src/live-tool-smoke.ts`.
Required skills: remnote-mcp-workflow-auditor, task-observer.
Evidence: live test output or BLOCKED reason.
Done rule: final audit can prove formulas with exact cases.
```

#### Stage 10: Card Tools

Stage objective:

```text
Fix card parser bugs and prove card workflows.
```

Goal 10.1: reproduce marker-both bug.

```text
Objective: failing test for extra malformed basic card from cloze line.
Target files: `tests/card-verifier.test.ts`, `src/remnote/write/cardWrites.ts`.
Likely change: test first, no implementation until failure seen.
Dependent files to re-check: `server/src/tools/register-card-tools.ts`.
Required skills: superpowers:test-driven-development, remnote-mcp-workflow-auditor.
Evidence: failing test before fix.
Done rule: test matches latest report failure.
```

Goal 10.2: fix card marker classification.

```text
Objective: one source marker creates intended card types only.
Target files: `src/remnote/write/cardWrites.ts`, `src/remnote/cards/`.
Likely change: parser branch ordering or marker normalization.
Dependent files to re-check: `shared/bridge/protocol-write-args.ts`, `protocol-write-results.ts`.
Required skills: superpowers:test-driven-development.
Evidence: all marker fixtures pass.
Done rule: no extra card emitted from cloze line.
```

Goal 10.3: verify card idempotency.

```text
Objective: retry does not duplicate card set.
Target files: `src/remnote/write/cardWrites.ts`, `src/remnote/write/writeCaches.ts`.
Likely change: idempotency key usage or existing-card detection.
Dependent files to re-check: `tests/write-idempotency-duplicates.test.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: retry card creation test.
Done rule: same source/key yields stable card count.
```

Goal 10.4: verify card_set validation.

```text
Objective: `verify_card_set` catches malformed, missing, and duplicate cards.
Target files: `src/remnote/cards/`, `server/src/tools/register-card-tools.ts`.
Likely change: verifier result fields and repair recommendations.
Dependent files to re-check: `tests/card-verifier.test.ts`.
Required skills: remnote-mcp-workflow-auditor, mcp-builder.
Evidence: malformed fixture returns failed verification.
Done rule: verifier output is useful to ChatGPT/Codex.
```

Goal 10.5: define representative live card proof.

```text
Objective: prove at least basic, cloze, and one advanced card live.
Target files: `server/src/live-tool-regression.ts`, `docs/remnote-mcp-repair-and-testing.md`.
Likely change: add gated live cases.
Dependent files to re-check: `server/src/live-tool-smoke.ts`.
Required skills: remnote-mcp-workflow-auditor.
Evidence: live output or BLOCKED reason.
Done rule: card status separates local proof from live proof.
```

#### Stage 11: Style, Design, And UI-Facing Note Quality

Stage objective:

```text
Make style/design tools safe and non-polluting.
```

Goal 11.1: reproduce style pollution risk.

```text
Objective: test that style metadata never becomes visible text.
Target files: `src/remnote/write/style-correctness-regression.ts`, `tests/style-presets.test.ts`.
Likely change: add explicit pollution fixture.
Dependent files to re-check: `src/remnote/write/formattingWrites.ts`.
Required skills: superpowers:test-driven-development, remnote-mcp-workflow-auditor.
Evidence: failing/passing style regression.
Done rule: visible text stays clean.
```

Goal 11.2: verify `apply_style_plan`.

```text
Objective: prove multi-style plan applies intended styles only.
Target files: `src/remnote/write/formattingWrites.ts`, `server/src/tools/register-formatting-tools.ts`.
Likely change: fix range selection, style map, or result verification.
Dependent files to re-check: `src/remnote/richTextFormatting.ts`, `src/remnote/write/verification.ts`.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: `npm run test:style-correctness`, `npm run server:test:style-schema`.
Done rule: style plan has local proof before live run.
```

Goal 11.3: verify design template safety.

```text
Objective: design templates cannot write unsafe or malformed plans.
Target files: `src/remnote/templates/designTemplates.ts`, `src/remnote/write/designedNoteTools.ts`, `server/src/tools/register-design-tools.ts`.
Likely change: validate template import/export and preview output.
Dependent files to re-check: `tests/design-template-preview.test.ts`.
Required skills: figma-create-design-system-rules, security-threat-model.
Evidence: design preview/import/export tests.
Done rule: preview remains no-write; apply remains scoped.
```

Goal 11.4: verify style after formula.

```text
Objective: style operations do not corrupt formula/rich text spans.
Target files: `src/remnote/write/formattingWrites.ts`, `src/remnote/richTextFormatting.ts`.
Likely change: range/span handling.
Dependent files to re-check: formula tests from Stage 9.
Required skills: remnote-mcp-workflow-auditor, superpowers:test-driven-development.
Evidence: combined style+formula regression.
Done rule: styled formula remains formula.
```

Goal 11.5: live-prove style/design representative path.

```text
Objective: prove `apply_style_plan` or design repair against disposable root.
Target files: `server/src/live-tool-regression.ts`, `docs/remnote-mcp-repair-and-testing.md`.
Likely change: add gated live test.
Dependent files to re-check: UI status if write approval prompts show.
Required skills: remnote-mcp-workflow-auditor, task-observer.
Evidence: live output or BLOCKED reason.
Done rule: latest report no longer says style path not run without update.
```

#### Stage 12: ChatGPT End-To-End Workflow

Stage objective:

```text
Prove real ChatGPT can use intended RemNote MCP workflow safely.
```

Goal 12.1: refresh official OpenAI assumptions.

```text
Objective: verify current Apps SDK/MCP/OAuth metadata requirements.
Target files: `chatgpt-app-submission.json`, `server/src/mcp-server.ts`, docs.
Likely change: update metadata, scopes, annotations, or submission notes only from current docs.
Dependent files to re-check: `server/src/tools/tool-context.ts`.
Required skills: openai-docs, openai-developers:build-chatgpt-app.
Evidence: cited doc notes in session/report.
Done rule: no stale Apps SDK assumption remains.
```

Goal 12.2: verify app descriptor and tool metadata.

```text
Objective: make ChatGPT tool list understandable and safe.
Target files: `chatgpt-app-submission.json`, `server/src/mcp-server.ts`, `TOOL_REFERENCE.md`.
Likely change: align tool names, descriptors, scopes, security schemes, and profile docs.
Dependent files to re-check: `server/src/tool-registry.ts`.
Required skills: mcp-builder, openai-developers:build-chatgpt-app.
Evidence: server build and tool schema/profile tests.
Done rule: ChatGPT sees intended `mass_note_writer` surface unless configured otherwise.
```

Goal 12.3: prove hosted pairing with real plugin.

```text
Objective: ChatGPT OAuth/pairing reaches correct plugin session.
Target files: no code unless failure is found; inspect auth/session files.
Likely change: if failure, fix Stage 2 files first.
Dependent files to re-check: `server/src/auth/oauth-routes.ts`, `server/src/bridge/session-router.ts`.
Required skills: remnote-mcp-workflow-auditor, security-threat-model.
Evidence: date, account/session, plugin status, pairing status.
Done rule: no fake paired/connected state.
```

Goal 12.4: run ChatGPT safe write workflow.

```text
Objective: ChatGPT reads, previews, writes, verifies, retries under disposable root.
Target files: no code unless failure is found; likely Stage 6/9 files if content fails.
Likely change: fix underlying tool, not ChatGPT wrapper, if content/readback fails.
Dependent files to re-check: bulk/markdown/write modules.
Required skills: remnote-mcp-workflow-auditor, mcp-builder.
Evidence: exact Rem IDs, tool outputs, readback, duplicate count.
Done rule: one complete ChatGPT workflow is live-proven.
```

Goal 12.5: verify ChatGPT reconnect behavior.

```text
Objective: ChatGPT sees clear state when RemNote closes/reopens.
Target files: `server/src/bridge-hub.ts`, `server/src/bridge/plugin-connection.ts`, `src/widgets/bridge-status.tsx` if failure.
Likely change: fix heartbeat/stale-state/reporting.
Dependent files to re-check: `server/src/health-check.ts`.
Required skills: remnote-mcp-workflow-auditor, nodejs-backend-patterns.
Evidence: connected -> disconnected/stale -> reconnected log.
Done rule: no stale write after reconnect boundary.
```

#### Stage 13: Codex End-To-End Workflow

Stage objective:

```text
Prove Codex bearer workflow without privilege bypass.
```

Goal 13.1: verify Codex setup docs/env.

```text
Objective: make Codex token setup explicit and separate from RemNote local token.
Target files: `render.yaml`, `server/src/config.ts`, `CODEX_MCP_SETUP.md` if present, docs.
Likely change: update docs/env names, not token values.
Dependent files to re-check: `server/src/auth/codex-token.ts`.
Required skills: security-threat-model, caveman-commit.
Evidence: doc diff and config diagnostics.
Done rule: setup cannot confuse local bridge token with Codex bearer token.
```

Goal 13.2: verify bearer auth failures.

```text
Objective: missing/invalid Codex token fails clearly.
Target files: `server/src/auth/codex-token.ts`, `server/src/codex-bearer-smoke.ts`.
Likely change: adjust parser/error codes only if smoke fails.
Dependent files to re-check: `server/src/server/create-http-server.ts`.
Required skills: superpowers:test-driven-development, security-threat-model.
Evidence: `npm run server:test:codex-bearer`.
Done rule: invalid bearer never reaches tool handler.
```

Goal 13.3: verify Codex plugin routing.

```text
Objective: valid Codex request routes to intended plugin session or fails.
Target files: `server/src/codex-routing-smoke.ts`, `server/src/bridge/session-router.ts`, `server/src/bridge-hub.ts`.
Likely change: fix routing association or error.
Dependent files to re-check: `server/src/auth/codex-pairing-routes.ts`.
Required skills: remnote-mcp-workflow-auditor, mcp-builder.
Evidence: `npm run server:test:codex-routing`, `npm run server:test:codex-pairing`.
Done rule: Codex cannot write to stale or wrong plugin.
```

Goal 13.4: verify Codex permission boundary.

```text
Objective: Codex bearer cannot widen scope or use danger tools.
Target files: `server/src/tool-permissions.ts`, `server/src/tool-policy.ts`, `server/src/codex-bearer-smoke.ts`.
Likely change: add tests or tighten principal mapping.
Dependent files to re-check: `server/src/tools/register-delete-tools.ts`.
Required skills: security-threat-model, remnote-mcp-workflow-auditor.
Evidence: auth + boundaries + profile tests.
Done rule: bearer proves identity only, not RemNote authority.
```

Goal 13.5: run Codex live disposable workflow.

```text
Objective: Codex reads, writes, verifies, retries under approved root.
Target files: no code unless failure points to tool/auth/session module.
Likely change: fix exact failing layer.
Dependent files to re-check: Stage 2/3/6 files depending on failure.
Required skills: remnote-mcp-workflow-auditor, mcp-builder.
Evidence: exact commands/tool outputs, Rem IDs, duplicate count.
Done rule: live Codex path is proven or blocked with exact missing env/runtime.
```

#### Stage 14: Plugin UI Polish

Stage objective:

```text
Make plugin UI clear enough for real users and agents.
```

Goal 14.1: map UI state model.

```text
Objective: list every visible state and source field.
Target files: `src/widgets/bridge-status.tsx`, `src/widgets/index.tsx`, `src/bridge/status.ts`.
Likely change: clarify derived state variables and labels.
Dependent files to re-check: `server/src/health-check.ts`, `server/src/bridge-hub.ts`.
Required skills: graphify, figma-create-design-system-rules.
Evidence: state table in notes or docs.
Done rule: UI labels map to backend states one-to-one.
```

Goal 14.2: fix layout overlap/spacing.

```text
Objective: prevent boxes, tokens, URLs, and status panels from overlapping.
Target files: `src/style.css`, `src/widgets/components/BridgeWidgetPieces.tsx`.
Likely change: grid/flex constraints, wrapping, max-width, overflow, spacing.
Dependent files to re-check: `src/widgets/bridge-status.tsx`.
Required skills: figma-create-design-system-rules, caveman.
Evidence: build and screenshot/manual inspection.
Done rule: narrow/wide panes readable.
```

Goal 14.3: improve error/progress display.

```text
Objective: user sees what is pending, blocked, failed, or connected.
Target files: `src/widgets/bridge-status.tsx`, `src/widgets/index.tsx`.
Likely change: status grouping, error copy, progress rows, advanced details collapse.
Dependent files to re-check: `src/style.css`.
Required skills: remnote-mcp-workflow-auditor, figma-create-design-system-rules.
Evidence: UI build and state screenshots if possible.
Done rule: no confusing "connected" when paired/plugin state disagrees.
```

Goal 14.4: separate danger and auth controls.

```text
Objective: dangerous tier/delete and tokens are visually separated.
Target files: `src/widgets/index.tsx`, `src/style.css`.
Likely change: warning styling, section order, labels.
Dependent files to re-check: `server/src/tool-policy.ts` for names.
Required skills: security-threat-model, figma-create-design-system-rules.
Evidence: build/manual UI review.
Done rule: user cannot confuse normal tier with danger tier.
```

Goal 14.5: validate plugin build.

```text
Objective: UI changes compile and RemNote manifest validates.
Target files: build artifacts only.
Likely change: fix TypeScript/CSS errors.
Dependent files to re-check: `package.json` scripts.
Required skills: caveman, task-observer.
Evidence: `npm run build`, `npm run validate`.
Done rule: UI polish is not accepted without build/validate or blocker reason.
```

#### Stage 15: Security Audit

Stage objective:

```text
Find and fix high-risk auth, scope, token, file, and logging issues.
```

Goal 15.1: write system threat model.

```text
Objective: map assets, trust boundaries, entrypoints, attackers.
Target files: security report path chosen by session, Section 15 files.
Likely change: documentation/report first; code only after findings.
Dependent files to re-check: auth/session/tool/files/logging modules.
Required skills: security-threat-model, graphify.
Evidence: threat model artifact or session report.
Done rule: threats are repo-specific, not generic checklist.
```

Goal 15.2: audit tokens and sessions.

```text
Objective: protect local token, OAuth tokens, Codex bearer, sessions, pairing codes.
Target files: `server/src/auth/`, `server/src/storage/`, `server/src/sessions/`.
Likely change: hash/redact/ttl/rotation/validation fixes.
Dependent files to re-check: `server/src/server/create-http-server.ts`, diagnostics.
Required skills: security-threat-model, nodejs-backend-patterns.
Evidence: auth/security tests and manual review notes.
Done rule: no token appears in logs, diagnostics, or tool output.
```

Goal 15.3: audit scope/destructive abuse paths.

```text
Objective: prevent malicious write/delete outside user intent.
Target files: `server/src/tool-permissions.ts`, `server/src/tools/register-delete-tools.ts`, `src/remnote/permissions.ts`.
Likely change: tighten checks, tests, and error handling.
Dependent files to re-check: Stage 3 tests.
Required skills: security-threat-model, codex-security:deep-security-scan.
Evidence: boundaries/security tests.
Done rule: no high-severity scope/delete finding remains.
```

Goal 15.4: audit file-backed import abuse.

```text
Objective: prevent path traversal, data exfiltration, and unsafe large reads.
Target files: `server/src/tools/register-bulk-import-tools.ts`, `server/src/config.ts`, `server/src/audit-payload-safety.ts`.
Likely change: path/size/root validation tests and code fixes.
Dependent files to re-check: Stage 8 tests.
Required skills: security-threat-model, codex-security:deep-security-scan.
Evidence: security tests and denied path cases.
Done rule: file import cannot read outside allowed roots.
```

Goal 15.5: run deep scan once functional fixes land.

```text
Objective: reduce missed findings after major behavior changes.
Target files: whole repo or scoped auth/server/plugin paths.
Likely change: fix validated findings only; track accepted risks.
Dependent files to re-check: all changed files.
Required skills: codex-security:deep-security-scan, grill-me.
Evidence: scan report plus validation.
Done rule: high findings fixed or explicitly blocked/accepted with reason.
```

#### Stage 16: Performance And Soak Audit

Stage objective:

```text
Prove large workflows finish within budgets or fail safely.
```

Goal 16.1: record baseline budgets.

```text
Objective: know current timeout and performance budgets before changes.
Target files: `server/src/config.ts`, `server/src/performance/tool-budgets.ts`.
Likely change: docs/report only unless budget is wrong.
Dependent files to re-check: `server/src/performance-benchmark.ts`.
Required skills: nodejs-backend-patterns, graphify.
Evidence: benchmark output.
Done rule: baseline numbers recorded.
```

Goal 16.2: benchmark Markdown pipeline.

```text
Objective: measure parser/planner performance on realistic large input.
Target files: `server/src/markdown-pipeline-benchmark.ts`, `shared/bridge/markdown-importer.ts`.
Likely change: optimize parser/planner only if benchmark proves bottleneck.
Dependent files to re-check: Stage 6/9 tests.
Required skills: superpowers:test-driven-development, nodejs-backend-patterns.
Evidence: `npm run server:test:markdown-pipeline-benchmark`.
Done rule: improvement does not weaken fidelity.
```

Goal 16.3: benchmark server/tool flow.

```text
Objective: measure tool registration, job steps, and verification.
Target files: `server/src/performance-benchmark.ts`, `server/src/area3-certification.ts`.
Likely change: optimize request/job handling only with test coverage.
Dependent files to re-check: `server/src/bridge/request-ledger.ts`, `server/src/bridge-hub.ts`.
Required skills: nodejs-backend-patterns, remnote-mcp-workflow-auditor.
Evidence: `npm run server:test:performance`.
Done rule: no timeout/late-response leak under benchmark.
```

Goal 16.4: live soak disposable root.

```text
Objective: run large workflow against real RemNote if available.
Target files: `server/src/live-tool-regression.ts`, `server/src/live-tool-smoke.ts`.
Likely change: fix actual bottleneck layer or mark blocked.
Dependent files to re-check: bulk/import/write/bridge files.
Required skills: remnote-mcp-workflow-auditor, task-observer.
Evidence: live Rem IDs, job IDs, timings, reconnect result.
Done rule: live soak is live-proven or honestly blocked.
```

Goal 16.5: update mass-note readiness report.

```text
Objective: report performance status with proof boundaries.
Target files: `server/src/mass-note-audit-report.ts`, generated reports/docs.
Likely change: add timing fields or statuses.
Dependent files to re-check: `docs/remnote-mcp-repair-and-testing.md`.
Required skills: remnote-mcp-workflow-auditor, caveman-commit.
Evidence: `npm run server:mass-note-audit`.
Done rule: report separates local benchmark from live soak.
```

#### Stage 17: Architecture Cleanup

Stage objective:

```text
Reduce friction only after behavior is proven.
```

Goal 17.1: query graph for tight coupling.

```text
Objective: identify real high-degree modules and import cycles.
Target files: `graphify-out/GRAPH_REPORT.md`, source files named by graph.
Likely change: none until a narrow refactor is selected.
Dependent files to re-check: tests around selected module.
Required skills: graphify, improve-codebase-architecture.
Evidence: graph query/report excerpt.
Done rule: refactor target is evidence-backed.
```

Goal 17.2: remove stale docs/names.

```text
Objective: align docs with current code without changing behavior.
Target files: `Agents.md`, `docs/`, `TOOL_REFERENCE.md`, `render.yaml`.
Likely change: replace stale references and legacy names where safe.
Dependent files to re-check: `server/src/config.ts`.
Required skills: caveman-commit, grill-me.
Evidence: `git diff --check`.
Done rule: docs no longer point to deleted files or false scripts.
```

Goal 17.3: split only one overgrown module if needed.

```text
Objective: make a proven painful module easier to test.
Target files: one selected file such as `bridge-status.tsx`, `markdownImportExecutor.ts`, or `create-http-server.ts`.
Likely change: extract focused helper with tests.
Dependent files to re-check: imports/callers named by graph.
Required skills: improve-codebase-architecture, superpowers:test-driven-development.
Evidence: tests pass before/after; diff is narrow.
Done rule: public behavior unchanged.
```

Goal 17.4: dedupe validation logic.

```text
Objective: reduce repeated validation without weakening checks.
Target files: selected schema/validation modules.
Likely change: extract helper and update callers.
Dependent files to re-check: tool schemas, bridge validation, tests.
Required skills: nodejs-backend-patterns, superpowers:test-driven-development.
Evidence: failing test if helper omits case, then pass.
Done rule: validation coverage same or stronger.
```

Goal 17.5: prove cleanup did not change readiness.

```text
Objective: run affected tests and report no proof upgrade.
Target files: changed files only.
Likely change: docs/status only if cleanup changed surface.
Dependent files to re-check: stage docs.
Required skills: grill-me, caveman.
Evidence: targeted tests + `git diff --check`.
Done rule: cleanup does not claim new live proof.
```

#### Stage 18: Final Release Audit

Stage objective:

```text
Decide readiness strictly from evidence.
```

Goal 18.1: run full local gate.

```text
Objective: prove code/build/test suite status.
Target files: whole repo.
Likely change: fix failing tests in owning earlier stage, not in final audit unless tiny.
Dependent files to re-check: all failure owners.
Required skills: task-observer, grill-me.
Evidence: full command log from Section 18.
Done rule: every command has PASS/FAIL/BLOCKED.
```

Goal 18.2: run full live gate.

```text
Objective: prove real RemNote workflow with disposable root.
Target files: live test scripts and reports.
Likely change: fix owners by earlier stage; final audit records truth.
Dependent files to re-check: bridge/auth/bulk/write modules if live fails.
Required skills: remnote-mcp-workflow-auditor.
Evidence: Rem IDs, job IDs, tool outputs, readback.
Done rule: no live claim without connected plugin and disposable root.
```

Goal 18.3: finalize tool matrix.

```text
Objective: every public tool has local/server/live/client status.
Target files: `TOOL_REFERENCE.md`, `docs/remnote-mcp-repair-and-testing.md`, reports.
Likely change: docs/report update.
Dependent files to re-check: `server/src/tool-registry.ts`.
Required skills: mcp-builder, remnote-mcp-workflow-auditor.
Evidence: generated reference and audit table.
Done rule: unknown/broken tools are not hidden.
```

Goal 18.4: complete security/perf/UI signoff.

```text
Objective: final readiness covers non-functional requirements.
Target files: security report, perf report, UI screenshots/notes, docs.
Likely change: docs/report update or block release.
Dependent files to re-check: Stage 14-16 artifacts.
Required skills: codex-security:deep-security-scan, figma-create-design-system-rules, nodejs-backend-patterns.
Evidence: signoff table with PASS/FAIL/BLOCKED.
Done rule: no high-risk unsigned area remains.
```

Goal 18.5: issue final verdict.

```text
Objective: choose exactly one readiness verdict.
Target files: `Agents.md`, final report artifact, docs.
Likely change: update verdict only when evidence supports it.
Dependent files to re-check: all stage evidence.
Required skills: grill-me, caveman.
Evidence: final report with command/live proof list.
Done rule: verdict is NOT_READY, PARTIAL_LIVE_PROOF_ONLY, LOCAL_READY_FOR_LIVE_TEST, LIVE_READY_FOR_LIMITED_USE, or PRODUCTION_READY with proof.
```

### Stage 0: Evidence Refresh And Graph Map

Goal:

```text
Refresh repo state, graph map, reports, and baseline commands.
```

Inspect:

```text
Agents.md
log.md
TOOL_REFERENCE.md
docs/
Remnote MCP test by Chagpt result with report/
package.json
server/package.json
server/src/tool-registry.ts
server/src/tool-policy.ts
server/src/config.ts
```

Run:

```bash
git status --short
graphify update .
npm run server:build
node - <<'NODE'
import('./server/dist/server/src/tool-registry.js').then((m) => {
  console.log(JSON.stringify(m.getToolRegistrySummary({ profile: 'mass_note_writer' }), null, 2));
});
NODE
```

Acceptance:

```text
Current tool counts are known.
Current docs/reports are understood.
Current graph/report is refreshed or explicitly marked stale.
No readiness claim is made.
```

### Stage 1: Tool Registry And Descriptor Truth

Goal:

```text
Make MCP tool exposure honest, minimal, and client-compatible.
```

Inspect:

```text
server/src/tool-policy.ts
server/src/tool-registry.ts
server/src/mcp-server.ts
server/src/mcp-tool-map.ts
server/src/tools/
TOOL_REFERENCE.md
chatgpt-app-submission.json
```

Use:

```text
mcp-builder
openai-docs
openai-developers:build-chatgpt-app
```

Verify:

```text
Tool descriptors are clear.
Tool schemas match implementation.
Tool metadata correctly marks read/write/destructive behavior.
Profile filtering works.
Hidden tools stay hidden.
Danger tools stay out of normal profiles.
ChatGPT app metadata is current.
Codex-visible tool list is intentional.
```

Commands:

```bash
npm run server:build
npm run server:test:tool-schemas
npm run server:test:tool-profile
npm run server:generate-tool-reference
```

Acceptance:

```text
Registry report matches intended profiles.
TOOL_REFERENCE.md is regenerated.
No unsupported tool is exposed as safe.
No tool is called verified just because it is listed.
```

### Stage 2: Auth, Pairing, And Session Routing

Goal:

```text
Make ChatGPT OAuth/pairing and Codex bearer routing correct and honest.
```

Inspect:

```text
server/src/config.ts
server/src/server/create-http-server.ts
server/src/auth/
server/src/bridge/session-router.ts
server/src/bridge-hub.ts
server/src/bridge/plugin-connection.ts
src/bridge/client.ts
src/widgets/bridge-status.tsx
render.yaml
```

Use:

```text
security-threat-model
nodejs-backend-patterns
mcp-builder
openai-docs
```

Verify:

```text
Local mode requires token unless intentionally no-auth local dev.
Hosted mode requires pairing flag and session secret.
ChatGPT OAuth cannot route to the wrong plugin.
Codex bearer cannot route to the wrong plugin.
Pairing-required errors are clear.
Plugin-not-connected errors are clear.
Stale sessions are not treated as connected.
```

Commands:

```bash
npm run server:test:auth
npm run server:test:pairing
npm run server:test:routing
npm run server:test:codex-bearer
npm run server:test:codex-routing
npm run server:test:codex-pairing
npm run server:test:e2e-hosted-smoke
```

Acceptance:

```text
Local/hosted/Codex lanes are documented and tested.
Legacy env strings are either intentionally supported or cleaned up.
No unsafe auth fallback exists.
```

### Stage 3: Scope, Write Approval, And Destructive Safety

Goal:

```text
Preserve RemNote permission semantics and prevent unsafe writes/deletes.
```

Inspect:

```text
server/src/tool-permissions.ts
src/remnote/permissions.ts
src/bridge/handlers/approval.ts
src/bridge/handlers/scope.ts
server/src/tools/register-delete-tools.ts
src/remnote/write/deleteWrites.ts
tests/unified-stage-gateway.test.ts
tests/write-idempotency-duplicates.test.ts
```

Use:

```text
security-threat-model
superpowers:test-driven-development
remnote-mcp-workflow-auditor
```

Verify:

```text
Focused Rem scope works.
Current Rem tree scope works.
Approved root scope works.
Workspace scope is explicit.
Trusted write is required where intended.
Delete requires dry-run/expected parent/expected title/ancestor where intended.
Codex and ChatGPT cannot bypass approvals.
```

Commands:

```bash
npm run server:test:boundaries
npm run test -- tests/unified-stage-gateway.test.ts tests/write-idempotency-duplicates.test.ts
```

Acceptance:

```text
Unsafe write paths are blocked.
Destructive tools remain gated.
Scope failures return useful errors.
```

### Stage 4: Tool-By-Tool Correctness Matrix

Goal:

```text
Create and verify an honest matrix for every public tool.
```

Inspect:

```text
server/src/tools/
src/remnote/write/
src/remnote/read.ts
tests/tool-status-matrix.test.ts
docs/remnote-mcp-repair-and-testing.md
TOOL_REFERENCE.md
```

Use:

```text
remnote-mcp-workflow-auditor
superpowers:test-driven-development
task-observer
```

For each tool record:

```text
profile exposure
schema status
local test status
server-local status
live status
idempotency status
scope status
error quality
ChatGPT status
Codex status
known failures
next test
```

Commands:

```bash
npm run test -- tests/tool-status-matrix.test.ts
npm run server:test:tools-core
npm run server:test:tools-advanced
npm run server:test:tools-diagnostics
```

Acceptance:

```text
Every public tool has a status.
Unknowns are marked unknown.
Broken tools are not described as working.
```

### Stage 5: Workflow Compatibility And Retry Safety

Goal:

```text
Prove tool sequences work together without duplicate or corrupt output.
```

Inspect:

```text
tests/agents-staged-repair-simulation.test.ts
tests/write-idempotency-duplicates.test.ts
server/src/area3-certification.ts
server/src/live-tool-regression.ts
src/remnote/write/writeCaches.ts
src/remnote/write/verification.ts
```

Use:

```text
remnote-mcp-workflow-auditor
superpowers:test-driven-development
```

Verify workflows:

```text
read -> preview -> write -> readback -> retry
write -> style -> verify -> retry
write -> cards -> verify -> retry
bulk start -> step -> fail -> resume -> verify
ChatGPT read/write -> Codex read/write -> disconnect -> reconnect
```

Commands:

```bash
npm run test:agents-simulated-live
npm run server:test:area3
npm run server:test:idempotency
```

Acceptance:

```text
Retries are safe.
Failures are resumable.
Duplicate prevention is proven locally before live testing.
```

### Stage 6: Bulk Import Source Fidelity

Goal:

```text
Fix and prove bulk import content preservation.
```

Inspect:

```text
shared/bridge/markdown-importer.ts
shared/bridge/bulk-import.ts
server/src/tools/register-bulk-import-tools.ts
server/src/bulk-import/job-store.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/verification.ts
tests/bulk-import.test.ts
tests/bulk-import-tools.test.ts
server/src/area1-smoke.ts
```

Use:

```text
superpowers:test-driven-development
remnote-mcp-workflow-auditor
nodejs-backend-patterns
```

Reproduce:

```text
Missing source sentence.
Incorrect Bullet B/formula hierarchy.
PARTIAL status on tiny bulk job.
source_fidelity_failed verification.
```

Commands:

```bash
npm run test -- tests/bulk-import.test.ts tests/bulk-import-tools.test.ts
npm run server:test:markdown-importer
npm run server:test:source-fidelity
```

Acceptance:

```text
Local tests reproduce the live failure or a narrower equivalent.
Fix preserves all source text.
Fix preserves hierarchy.
Verification reports exact failures.
No weakening of source fidelity rules.
```

### Stage 7: Bulk Resume And Persistent Job Durability

Goal:

```text
Make long-running bulk jobs reliable across retries and storage modes.
```

Inspect:

```text
server/src/bulk-import/job-store.ts
server/src/storage/
shared/bridge/bulk-import.ts
server/src/tools/register-bulk-import-tools.ts
server/src/area3-certification.ts
```

Use:

```text
nodejs-backend-patterns
superpowers:test-driven-development
security-threat-model
```

Verify:

```text
memory_only durability is clearly labeled.
persistent durability works with Postgres.
resume does not duplicate completed chunks.
cancel is safe.
job status survives intended server transitions when persistent storage is configured.
```

Commands:

```bash
npm run server:test:area3
npm run server:mass-note-audit
```

Acceptance:

```text
Resume semantics are documented and tested.
Persistent jobs are proven or marked blocked with exact reason.
```

### Stage 8: File-Backed And Connector-Scale Imports

Goal:

```text
Make file-backed import safe and usable for huge Markdown sources.
```

Inspect:

```text
server/src/tools/register-bulk-import-tools.ts
server/src/config.ts
server/src/security/redaction.ts
server/src/audit-payload-safety.ts
```

Use:

```text
security-threat-model
mcp-builder
openai-docs
```

Verify:

```text
Allowed roots are correct.
Path traversal is blocked.
Oversized files fail clearly.
Missing files fail clearly.
ChatGPT file handoff is realistic or documented as not supported.
Codex local file handoff is realistic and authenticated.
```

Commands:

```bash
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run server:test:security
```

Acceptance:

```text
File-backed import is either live-proven or honestly marked unproven.
No unsafe path expansion exists.
```

### Stage 9: Markdown, Formula, And Rich Text Fidelity

Goal:

```text
Prove Markdown and formula fidelity under realistic note content.
```

Inspect:

```text
shared/bridge/markdown-importer.ts
src/remnote/richTextFormatting.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/structuredBatch.ts
src/remnote/write/verification.ts
src/remnote/write/styleMutationInvariant.ts
```

Use:

```text
superpowers:test-driven-development
remnote-mcp-workflow-auditor
```

Verify:

```text
Inline formula.
Block formula.
Formula inside bullet.
Formula inside nested bullet.
Markdown heading boundaries.
Tables.
Code blocks.
Long paragraphs.
Readback normalization.
```

Commands:

```bash
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run test -- tests/structured-batch.test.ts
```

Acceptance:

```text
Formula fidelity is proven locally and then live.
Known Bullet B nesting failure is fixed.
```

### Stage 10: Card Tools

Goal:

```text
Fix card parser and prove card workflows.
```

Inspect:

```text
src/remnote/write/cardWrites.ts
src/remnote/cards/
server/src/tools/register-card-tools.ts
tests/card-verifier.test.ts
```

Use:

```text
superpowers:test-driven-development
remnote-mcp-workflow-auditor
```

Reproduce:

```text
marker "both" emitted malformed extra basic card from cloze line
```

Commands:

```bash
npm run test -- tests/card-verifier.test.ts
npm run server:test:tools-advanced
```

Acceptance:

```text
Malformed extra card bug is fixed.
All card types have local tests.
At least representative card types have live readback.
Retry does not duplicate cards.
```

### Stage 11: Style, Design, And UI-Facing Note Quality

Goal:

```text
Prove style and design tools do not corrupt notes.
```

Inspect:

```text
src/remnote/write/formattingWrites.ts
src/remnote/write/designedNoteTools.ts
src/remnote/style/
src/remnote/templates/
server/src/tools/register-design-tools.ts
server/src/tools/register-formatting-tools.ts
tests/design-template-preview.test.ts
tests/style-presets.test.ts
```

Use:

```text
superpowers:test-driven-development
figma-create-design-system-rules
remnote-mcp-workflow-auditor
```

Commands:

```bash
npm run test:style-correctness
npm run test -- tests/design-template-preview.test.ts tests/style-presets.test.ts
npm run server:test:style-schema
```

Acceptance:

```text
No visible style pollution.
Style readback works.
Style scope is safe.
Design previews stay no-write.
apply_style_plan has live proof.
```

### Stage 12: ChatGPT End-To-End Workflow

Goal:

```text
Prove ChatGPT can use the intended profile safely and reliably.
```

Inspect:

```text
chatgpt-app-submission.json
server/src/auth/oauth-routes.ts
server/src/auth/chatgpt-pairing-routes.ts
server/src/mcp-server.ts
server/src/server/create-http-server.ts
server/src/bridge/session-router.ts
src/widgets/bridge-status.tsx
```

Use:

```text
openai-docs
openai-developers:build-chatgpt-app
mcp-builder
remnote-mcp-workflow-auditor
```

Verify live:

```text
Install/connect ChatGPT app or connector.
Pair plugin.
Read focused Rem.
Preview a note.
Write under approved root.
Verify readback.
Retry same write.
Run small bulk job after Stage 6 fix.
Disconnect plugin.
Confirm ChatGPT sees clear disconnected/pairing-required state.
Reconnect plugin.
Confirm state recovers.
```

Acceptance:

```text
ChatGPT workflow is live-proven, with exact dates, Rem IDs, and outputs.
No false connected state.
No duplicate write on retry.
```

### Stage 13: Codex End-To-End Workflow

Goal:

```text
Prove Codex can use the MCP safely with bearer auth and correct plugin routing.
```

Inspect:

```text
server/src/auth/codex-token.ts
server/src/auth/codex-pairing-routes.ts
server/src/codex-bearer-smoke.ts
server/src/codex-routing-smoke.ts
server/src/codex-pairing-smoke.ts
server/src/bridge/session-router.ts
server/src/server/create-http-server.ts
```

Use:

```text
security-threat-model
mcp-builder
remnote-mcp-workflow-auditor
```

Verify live:

```text
Codex authenticates with bearer token.
Codex receives clear missing-token error without token.
Codex receives clear plugin-not-paired or plugin-not-connected error when appropriate.
Codex reads focused Rem through correct plugin.
Codex writes under approved root only.
Codex retries without duplicates.
Codex cannot use danger tools in normal profile.
```

Acceptance:

```text
Codex workflow is live-proven.
Bearer token handling is safe.
No privilege bypass.
```

### Stage 14: Plugin UI Polish

Goal:

```text
Make the UI clear, stable, and production-quality.
```

Inspect:

```text
src/widgets/index.tsx
src/widgets/bridge-status.tsx
src/widgets/components/BridgeWidgetPieces.tsx
src/widgets/bridge-panel/
src/style.css
```

Use:

```text
figma-create-design-system-rules
task-observer
```

Fix:

```text
Box overlap.
Spacing.
Status hierarchy.
Pairing clarity.
Connection clarity.
Error display.
Loading/progress display.
Advanced details hierarchy.
Responsive behavior.
Long string wrapping.
```

Commands:

```bash
npm run build
npm run validate
```

Acceptance:

```text
UI builds.
UI is inspected.
Known visual problems are resolved or documented with screenshots.
```

### Stage 15: Security Audit

Goal:

```text
Perform a serious security review after functional fixes.
```

Use:

```text
security-threat-model
codex-security:deep-security-scan
nodejs-backend-patterns
```

Inspect all files in Section 15.

Run:

```bash
npm run server:test:auth
npm run server:test:security
npm run server:test:boundaries
npm run server:test:e2e-hosted-smoke
```

Acceptance:

```text
Threat model is documented.
Findings are fixed or tracked.
No high severity auth/session/scope/logging finding remains unresolved.
```

### Stage 16: Performance And Soak Audit

Goal:

```text
Prove reliability under realistic mass-note load.
```

Inspect:

```text
server/src/performance-benchmark.ts
server/src/markdown-pipeline-benchmark.ts
server/src/mass-note-audit-report.ts
server/src/live-tool-regression.ts
server/src/live-tool-smoke.ts
```

Run:

```bash
npm run server:test:performance
npm run server:test:markdown-pipeline-benchmark
npm run server:test:performance-benchmark
npm run server:mass-note-audit
```

Live soak should include:

```text
Many Rems under disposable root.
Large Markdown import.
Resume after interrupted job.
Readback after completion.
Repeated no-duplicate retry.
Connection close/reopen.
```

Acceptance:

```text
Performance budget is met or adjusted with evidence.
Timeouts are clear.
Large workflow completes or fails safely.
```

### Stage 17: Architecture Cleanup

Goal:

```text
Remove real architectural friction without destabilizing behavior.
```

Use:

```text
improve-codebase-architecture
nodejs-backend-patterns
graphify
```

Allowed cleanup:

```text
Dead duplicate code.
Stale docs references.
Confusing naming around local/hosted legacy modes.
Overgrown modules that already have clear boundaries.
Repeated validation logic.
Repeated status mapping.
```

Not allowed:

```text
Broad rewrites without failing tests.
Changing auth semantics for style.
Moving protocol types without compatibility tests.
Weakening safety gates to simplify code.
```

Acceptance:

```text
Diff is smaller than the problem.
Tests still pass.
Docs remain accurate.
```

### Stage 18: Final Release Audit

Goal:

```text
Decide if the project is production-ready.
```

The final audit must cover:

```text
MCP tool registry.
All public tool descriptors.
All intended tool workflows.
Bulk operations.
Markdown import behavior.
Formula fidelity.
Card fidelity.
Style/design fidelity.
Parent-scope safety.
Duplicate prevention.
Idempotency.
Resume and retry.
ChatGPT workflow.
Codex workflow.
Connection persistence.
UI/design quality.
Security.
Performance.
Code quality.
Docs.
Deployment config.
```

Run at minimum:

```bash
npm run check-types
npm run build
npm run validate
npm run test
npm run server:build
npm run server:smoke
npm run server:test:auth
npm run server:test:codex-bearer
npm run server:test:codex-routing
npm run server:test:codex-pairing
npm run server:test:pairing
npm run server:test:routing
npm run server:test:connector-compat-routing
npm run server:test:security
npm run server:test:boundaries
npm run server:test:tool-profile
npm run server:test:tool-schemas
npm run server:test:tools-core
npm run server:test:tools-advanced
npm run server:test:tools-diagnostics
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run server:test:idempotency
npm run server:test:performance
npm run server:test:e2e-hosted-smoke
npm run server:mass-note-audit
```

Run live tests against a disposable root:

```bash
npm run bridge:live-tool-smoke
npm run bridge:live-tool-regression
```

Only run destructive live checks if explicitly approved and scoped to disposable data.

Acceptance:

```text
Every stage has evidence.
Every unresolved issue is tracked.
No P0/P1 issue remains.
Live evidence is recent and exact.
Docs match current behavior.
Final verdict is strict.
```

## 20. Live Testing Protocol

Live testing must protect user data.

Before any live write:

```text
Confirm RemNote is open.
Confirm the plugin is installed.
Confirm the plugin is connected to the intended server.
Confirm the approved root or focused Rem.
Create or select a disposable test root.
Record the root Rem ID.
Use unique test labels.
Use idempotency keys.
Avoid delete unless explicitly approved.
```

For every live write:

```text
Record tool name.
Record input summary.
Record output status.
Record created/updated Rem IDs.
Read back the Rem tree.
Compare expected text.
Compare hierarchy.
Compare cards/styles/formulas where relevant.
Retry if idempotency is part of the contract.
Record whether retry created duplicates.
```

For every live failure:

```text
Keep the exact error.
Keep the tool response.
Keep any job ID.
Keep any Rem IDs.
Classify as code failure, runtime failure, auth failure, plugin connection failure, scope failure, or blocked.
Do not hide partial writes.
```

## 21. Error Quality Requirements

Errors should be actionable.

Good errors include:

```text
error code
short message
tool name
auth mode if relevant
connection state if relevant
scope requirement if relevant
pairing requirement if relevant
retry guidance if safe
job ID if relevant
Rem ID if relevant
```

Bad errors:

```text
undefined
unknown error
failed
not connected when actually not paired
paired when actually no plugin route exists
success when verification failed
partial without reason
```

Preserve distinctions:

```text
PLUGIN_NOT_PAIRED
PLUGIN_NOT_CONNECTED
TRUSTED_WRITE_REQUIRED
OUT_OF_SCOPE
WRITE_APPROVAL_REQUIRED
AUTH_REQUIRED
TOKEN_INVALID
SOURCE_FIDELITY_FAILED
PARTIAL
ALREADY_APPLIED
```

If code uses different exact names, preserve actual names and document them.

## 22. Deployment Requirements

Inspect:

```text
render.yaml
server/src/config.ts
server/src/health-check.ts
server/src/server/create-http-server.ts
server/src/storage/postgres-store.ts
server/src/storage/memory-store.ts
```

Verify deployment config:

```text
Single port works.
Health path is correct.
Public base URL is set.
MCP server URL is set.
OAuth issuer is set.
Postgres is configured for hosted persistence.
Session secret is configured.
Admin debug secret is configured.
Codex token is configured only when Codex is intended.
Delete tool disabled by default.
Audit logging is enabled.
Allowed origins are explicit.
Legacy hosted mode string is intentionally accepted or replaced.
```

Do not rely on memory storage for production hosted pairing unless explicitly scoped.

## 23. Handoff Template

Future Codex sessions should end with:

```text
Summary:
- What changed.

Files changed:
- path

Files inspected:
- path

Validation:
- command -> result
- command -> blocked reason

Live proof:
- live-tested or not live-tested
- Rem IDs/job IDs if live-tested

Security impact:
- auth/scope/token/destructive/logging impact

Remaining risks:
- risk

Next stage:
- exact stage number and first command
```

If the session changed behavior, update this file or related docs when the project state changed.

## 24. Current Recommended Next Session

The recommended next implementation session is:

```text
Stage 6: Bulk Import Source Fidelity
```

Reason:

```text
The newest live report shows a tiny bulk job still failed with PARTIAL/source_fidelity_failed.
Mass use and huge Markdown imports cannot be trusted until this is fixed.
The failure is concrete enough to reproduce locally.
It affects the central goal of large-scale RemNote work.
```

Start with:

```bash
git status --short
npm run server:build
npm run test -- tests/bulk-import.test.ts tests/bulk-import-tools.test.ts
npm run server:test:markdown-importer
npm run server:test:source-fidelity
```

Then inspect:

```text
shared/bridge/markdown-importer.ts
shared/bridge/bulk-import.ts
server/src/tools/register-bulk-import-tools.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/verification.ts
Remnote MCP test by Chagpt result with report/new-report.md
```

Reproduce the missing sentence and bad hierarchy failure before changing code.

## 25. Final Readiness Verdict Rules

The final verdict must be strict.

Allowed verdicts:

```text
NOT_READY
PARTIAL_LIVE_PROOF_ONLY
LOCAL_READY_FOR_LIVE_TEST
LIVE_READY_FOR_LIMITED_USE
PRODUCTION_READY
```

Use `NOT_READY` when P0 basics fail.

Use `PARTIAL_LIVE_PROOF_ONLY` when some live tests pass but major workflows remain broken or untested.

Use `LOCAL_READY_FOR_LIVE_TEST` when local tests pass and live testing is the next blocker.

Use `LIVE_READY_FOR_LIMITED_USE` when core live workflows pass but mass use, security, performance, or UI is not final.

Use `PRODUCTION_READY` only when all final audits pass and the evidence is recent.

As of this guide, the verdict remains:

```text
PARTIAL_LIVE_PROOF_ONLY
```
