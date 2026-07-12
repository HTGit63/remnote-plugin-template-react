# RemNote MCP Repair And Testing

Compressed from old docs, test matrix, repair plan, audits, live reports, and cleanup notes.

## Evidence Labels

- `OLD_REPORT_EVIDENCE`: old ChatGPT RemNote MCP reports.
- `NEW_REPORT_EVIDENCE`: new ChatGPT RemNote MCP reports.
- `CODE_EVIDENCE`: current repo code.
- `LIVE_RETEST_EVIDENCE`: current Codex live mini-suite, 2026-07-02.
- `INFERENCE`: reasoned link, not direct proof.
- `UNKNOWN`: not proven.

## Priority Scheme

- P0 — Safety and correctness blockers
- P1 — Tool reliability and verification gaps
- P2 — Bulk import, resume, and no-duplicate quality
- P3 — Styling, card, formula, and readability improvements
- P4 — Reporting and developer experience

## Historical Test 01-15 Status, 2026-07-02 Baseline

This table is retained as input evidence. It is superseded by the 2026-07-12 Stage 18 audit below and must not be read as current code status.

| Test | Area | Old | New | Current live | Main repair |
|---|---|---|---|---|---|
| 01 | Preflight/focus/scope | PASS | PASS_WITH_WARNING | PASS_VERIFIED narrow path | Keep focus/root/readback gate |
| 02 | Tool visibility/profile | PASS_WITH_WARNINGS | PASS_WITH_WARNINGS | PASS_WITH_WARNING, danger profile exposed | Separate default vs danger profile |
| 03 | Default tool audit | PARTIAL | FAILED_VERIFICATION | Not rerun full | Fix source fidelity + file path |
| 04 | Read/search consistency | PASS_WITH_WARNINGS | PARTIAL | Read children/breadcrumbs passed narrow path | Bound reads, report scope truth |
| 05 | Safe write/idempotency | FAILED_VERIFICATION | PASS_WITH_WARNINGS | PASS_VERIFIED same-key replay | Preserve zero-duplicate replay |
| 06 | Markdown preview/planning | PARTIAL | PARTIAL | Preview passed no-write | File plan still blocked |
| 07 | Small bulk workflow | FAILED_VERIFICATION | FAILED_VERIFICATION | FAIL_VERIFIED | Fix source coverage + hierarchy |
| 08 | Full file import | BLOCKED | BLOCKED | Not run safety reason | Define hosted connector-file boundary |
| 09 | Resume/retry/partial | BLOCKED | FAILED_VERIFICATION | PASS dry-run, actual chunk failed | Short keys, durable jobs, no rewrite verified chunks |
| 10 | Duplicate/scope/cleanup | FAILED_VERIFICATION | PASS_WITH_WARNINGS | Not rerun full | Finish different-parent proof |
| 11 | Formula fidelity | FAILED_VERIFICATION | FAILED_VERIFICATION | PASS_WITH_WARNING one rich inline math | Prove formula-heavy import |
| 12 | Design/style invariants | FAILED_VERIFICATION | PARTIAL_STABILITY_BLOCKED | PASS simple color/highlight only | Retest full `apply_style_plan` |
| 13 | Card lifecycle | FAILED_VERIFICATION | NOT_RUN_DEPENDENCY_BLOCKED | PASS basic card only; parser warning | Fix cloze/MC/list/parser |
| 14 | Latency/stability | FAILED_RUNTIME | FAILED_STABILITY | PASS_WITH_WARNING short spot only | Long soak, stale connection detection |
| 15 | Final combined proof | PARTIAL_PROOF | NOT_LIVE_PROVEN_READY | PARTIAL only | Finish P0-P3 first |

## Tool Status

## Stage 4 Tool Matrix Audit, 2026-07-09

Current generated registry truth:

- Declared tools: 75.
- Public tools without delete gate: 72.
- Default `mass_note_writer` public tools: 19.
- Danger profile public tools with delete gate: 73.
- Hidden or gated source-level tools: `delete_rem_by_id`, `replace_rem`, `create_folder`.
- Default profile runtime-unverified tools: 9.

`TOOL_REFERENCE.md` now includes a generated Tool Correctness Matrix for every declared tool.
Rows separate profile exposure, schema status, local/server-local status, live status,
idempotency, scope, error quality, ChatGPT/Codex status, known failures, and next test.
`server_local_verified` is not live RemNote proof. Any row without a recent connected
plugin success stays `live_not_run`.

Working narrow path, still not broad readiness:

- `get_bridge_status`: connected status OK; not enough alone.
- `ping_remnote_plugin`: plugin route OK in current run.
- `get_plugin_status`: responsive in current run.
- `get_focused_rem`: focus confirmed.
- `get_current_selection`: selection confirmed.
- `create_rem`: root/child/report writes verified.
- `get_children`: parent/root/import reads verified in mini-suite.
- `get_rem_breadcrumbs`: parent chain verified.
- `preview_markdown_note_tree`: no-write preview OK.
- `get_rem_rich`: inline math + style readback OK.
- `create_basic_flashcard`: basic card OK.
- `set_rem_text_color`, `set_rem_highlight_color`: simple style OK, no child pollution in mini-suite.

Historical failed or risky items (superseded where later stage evidence says so):

- `run_note_import_job_step`: current mini-suite failed source fidelity/hierarchy.
- `verify_note_import_job`: correctly failed current bad import.
- `resume_note_import_job`: dry-run safe; real recovery not proven.
- `plan_note_import`: passed, but pre-section source not preserved downstream.
- `plan_note_import_from_file`, `start_note_import_from_file`: old/new blocked by path/hosted file boundary.
- `create_flashcards_from_markdown`: parser bug with `marker: both`.
- `create_cloze_card`, `create_multiple_choice_card`, `create_list_answer_card`: not live-proven.
- `apply_style_plan`: old pollution/stability risk; not rerun full.
- `delete_rem_by_id`: keep gated.

## Stage 6 Local Fix, 2026-07-09

Local Stage 6 regressions now cover the July 2 tiny bulk failure shape:

- H1 intro text before the first H2 is preserved as a `Chapter introduction` chunk, so `Alpha source sentence.` is no longer dropped during planning.
- Final readback verification checks direct child hierarchy and reports `wrongParentChunks` when `Bullet B` or its formula is nested under `Bullet A`.
- `run_note_import_job_step` only marks a chunk `verified` when plugin write verification is explicitly `passed` and readback source fidelity also passes.
- Bulk tool envelopes now expose chunk IDs, idempotency keys, created IDs, readback status, plugin verification status, missing/extra previews, and top-level verification method/status.
- `live-tool-smoke` defines a gated Stage 6 disposable-root sequence: `plan_note_import`, `start_note_import_job`, `run_note_import_job_step`, `verify_note_import_job`.
- `live-tool-regression` reports that sequence as blocked unless a real connected plugin and `REMNOTE_LIVE_TOOL_PARENT_ID` or `REMNOTE_LIVE_TEST_PARENT_ID` are available.

This is local readiness for live retest, not live proof. Keep Test 07 marked live-failed until the gated live sequence passes against a disposable RemNote root.

## Stage 7 Local Fix, 2026-07-09

Local Stage 7 regressions now cover bulk resume/durability safety:

- Bulk chunk/job transitions are guarded; failed or partial chunks cannot become `verified` without explicit passed verification and mutation IDs.
- Status/start/run/resume/verify/cancel envelopes expose `storageDurability`; `memory_only` includes a restart-loss warning.
- `cancel_note_import_job` only cancels future work. Later run/resume calls return `JOB_CANCELLED` and do not delete existing Rems.
- Storage providers now expose bulk plan/job methods. Memory storage is proven process-local; Postgres persistence is wired and smoke-tested only when `DATABASE_URL` is configured.
- `server:test:bulk-storage` reports Postgres as `BLOCKED` when `DATABASE_URL` is absent instead of pretending persistent proof ran.
- Area 3 certification includes a dry-run resume/cancel sequence for the bulk import workflow.

This is local/simulated proof plus a configured-DB smoke path, not live RemNote proof and not Postgres proof unless the smoke reports Postgres `PASS`.

## Stage 9 Local Fix And Live Formula Matrix, 2026-07-10

Local Stage 9 regressions now cover Markdown/rich-text fidelity beyond plain-text presence:

- Loose nested lists retain their source parent across blank lines; sibling bullets remain siblings.
- Inline and block formula counts come from actual RemNote rich-text math spans during write readback. Flattened, missing, or duplicated spans fail verification even when plain text still matches.
- Dollar-delimited text inside fenced code is not counted as math.
- Empty Markdown table cells retain column position. Markdown tables are reported as Rem hierarchy, not native RemNote tables; fenced code is reported as literal text, not native code-block formatting.
- Formatting-only and formula-delimiter differences normalize, while missing or reordered semantic snippets fail.

Exact gated live formula cases in `live-tool-smoke`:

1. Inline formula: `STAGE9_INLINE_FORMULA: $E=mc^2$` -> `get_rem_rich` must report `inline_math`.
2. Block formula: `F_{stage9} = ma` inside `$$` delimiters -> `get_rem_rich` must report `math_block`.
3. Nested-bullet formula: `STAGE9_NESTED_FORMULA: $qE=qvB$` -> `get_rem_rich` must report `inline_math` on the nested Rem.

Run `npm run bridge:live-tool-regression` with a real connected plugin plus `REMNOTE_LIVE_TOOL_PARENT_ID` or `REMNOTE_LIVE_TEST_PARENT_ID`. Without that runtime, formula status is `BLOCKED`; local/simulated results are not live proof.

## Stage 10 Local Fix And Live Card Matrix, 2026-07-10

Local Stage 10 regressions now cover card parsing, retry behavior, and actionable verification:

- `marker: both` classifies cloze syntax before double-colon basics, so `{{answer::hint}}` emits only a cloze card.
- Marker-specific fixtures cover `double_colon`, `cloze`, and `both`; retries with the same source and idempotency key keep stable Rem IDs and card count.
- `verify_card_set` reports structured `malformedCards`, `duplicateCards`, and expected `missingCards`, plus non-destructive repair recommendations.
- Local card suites exercise basic, concept, descriptor, cloze, multiple-choice, and list-answer creation paths.

Exact gated live card cases in `live-tool-smoke` use a dedicated disposable matrix root:

1. Basic: create a deterministic front/back card.
2. Cloze: create text with an explicit `TARGET` cloze span.
3. Advanced: create a multiple-choice card with answer and choice items.
4. Readback: `verify_card_set` must find all three expected types and return `ok: true` with no malformed, duplicate, or missing cards.

Run `npm run bridge:live-tool-regression` with a real connected plugin plus `REMNOTE_LIVE_TOOL_PARENT_ID` or `REMNOTE_LIVE_TEST_PARENT_ID`. Without that runtime, card status is `BLOCKED`; local card tests are not live RemNote proof.

## Stage 11 Local Style Proof And Live Matrix, 2026-07-10

Local Stage 11 regressions prove style/design safety:

- Style-only writes preserve visible text, child IDs, and child order; visible `H1` pollution is detected with repair guidance.
- Multi-operation plans preserve earlier color/highlight spans while applying later bold spans to the same Rem.
- Formula math-span counts remain exact after text-span styling; plain-text equality alone is not accepted.
- Design preview remains no-write with parent/target IDs, and malformed or unsafe imported template rules fail with `INVALID_ARGS`.

Exact gated live style cases in `live-tool-smoke`:

1. `apply_style_plan` colors the exact `Live` text span and returns style-only mutation evidence.
2. `verify_note_design` reads the target back and must find the expected blue text-color span.

Run `npm run bridge:live-tool-regression` with a real connected plugin plus `REMNOTE_LIVE_TOOL_PARENT_ID` or `REMNOTE_LIVE_TEST_PARENT_ID`. Without that runtime, style status is `BLOCKED`; local style tests are not live RemNote proof.

## Stage 12 ChatGPT Contract And Reconnect Proof, 2026-07-10

Official OpenAI assumptions were refreshed from the current [authentication](https://developers.openai.com/apps-sdk/build/auth#triggering-authentication-ui), [tool planning](https://developers.openai.com/apps-sdk/plan/tools), [MCP server](https://developers.openai.com/apps-sdk/build/mcp-server), and [plugin submission](https://developers.openai.com/apps-sdk/deploy/submission) documentation:

- OAuth linking needs protected-resource metadata, per-tool `securitySchemes`, and runtime `_meta["mcp/www_authenticate"]` errors. Hosted `tools/list` now exposes top-level schemes plus the compatibility mirror; challenges include `error` and `error_description`.
- The submitted `mass_note_writer` worksheet matches the exact 19-tool runtime profile. Higher profiles are deployment options, not silently included in the default submission surface.
- Tool descriptions start with `Use this when`; output schemas and all three impact annotations are present. Server-persistent plan/job/verification/cancel tools are no longer mislabeled read-only. File reads do not claim public-world writes. The replace-capable Markdown tool advertises destructive potential.
- Current public distribution uses a plugin submission and a scan of the live HTTPS MCP endpoint. The obsolete worksheet schema URL was removed. This tool-only integration remains private Developer Mode work until hosted review prerequisites and real runtime proof exist.
- Hosted local routing now proves `connected -> disconnected/stale -> reconnected`. Disconnect persistence and connection-identity checks prevent an old socket close from removing a newer route; disconnected OAuth sessions can report `NO_ACTIVE_DEVICE` without a stale write or fake auth success.

Local evidence: `tests/chatgpt-app-contract.test.ts`, `npm run server:test:routing`, `npm run server:test:pairing`, `npm run server:test:tool-profile`, `npm run server:test:tool-schemas`, and `npm run server:build`.

Live boundary: no real ChatGPT account/app installation, production HTTPS deployment, live RemNote plugin session, disposable Rem IDs, or ChatGPT write/readback/retry transcript was available. Goals 12.3 and 12.4, plus the real-client half of 12.5, remain `LIVE_BLOCKED`; mock routing is not promoted to live proof.

## Stage 13 Codex Bearer And Routing Proof, 2026-07-11

Local Stage 13 evidence now covers Codex identity and RemNote authority as separate seams:

- Hosted setup uses dedicated `REMNOTE_CODEX_TOKEN`; `REMNOTE_BRIDGE_TOKEN` remains local bridge/plugin auth. `.env.example`, Render config, and `docs/engineering-guide.md` use canonical hosted mode and Codex `bearer_token_env_var` setup without embedding secret values.
- Missing/invalid bearer calls return an explicit MCP OAuth auth error and never reach a tool handler. Valid bearer reaches server/plugin routing; allowed source files pass and canonical-root escapes fail before import.
- Unlinked Codex bearer may read through the sole unambiguous active plugin route, but no longer inherits the latest ChatGPT pairing's scopes or `trusted-inside-scope` authority. Direct writes fail `TRUSTED_WRITE_REQUIRED` before the plugin.
- Explicit Codex pairing links one bearer client hash to one approved plugin session. Two active unlinked plugins produce `DEVICE_CONFLICT`; linked routing reaches only the selected plugin.
- Default `mass_note_writer` discovery omits danger tools. Direct danger calls are blocked by server permission policy, and bearer identity never grants delete scope.

Local evidence: `npm run server:test:codex-bearer`, `npm run server:test:codex-routing`, `npm run server:test:codex-pairing`, `npm run server:test:boundaries`, and `npm run server:test:tool-profile` all pass.

Live boundary: `REMNOTE_CODEX_TOKEN`, MCP endpoint env, and both disposable-parent env variables were unset; the configured public health URL timed out. No real Codex MCP process, live RemNote plugin, write/readback, Rem ID, idempotent retry, or duplicate count exists. Goal 13.5 remains `LIVE_BLOCKED`, not simulated success.

## Stage 14 Plugin UI State And Safety Map, 2026-07-11

The widget now derives one visible connection state from structured transport, pairing, health, and tier facts. Structured facts may downgrade a contradictory transport claim, but never upgrade an unconnected WebSocket to `connected`.

| Visible state | Source field/event | Visible label |
| --- | --- | --- |
| `not_paired` | Hosted URL without stored session, or `NO_PAIRED_PLUGIN_SESSION` close | Not Paired |
| `pairing` | `hostedPairingStatus: pending` | Pairing |
| `paired_offline` | Stored/approved pairing plus `pluginConnectionStatus: offline`, or hosted abnormal close | Paired Offline |
| `connecting` | WebSocket open/registration and SDK capability sync | Connecting |
| `connected` | `server_hello`, only while no stale/offline contradiction exists | Connected |
| `reconnecting` | Retry scheduled after a recoverable registration failure | Reconnecting |
| `server_unreachable` | Local abnormal close or WebSocket construction failure | Server Unreachable |
| `token_expired` | Invalid local token or expired hosted plugin session close | Token Invalid or Expired |
| `session_revoked` | Revoked/denied hosted pairing fact or close reason | Session Revoked |
| `device_conflict` | `DEVICE_CONFLICT` or replacement-connection close | Device Conflict |
| `stale_connection` | Health/tier `sessionStale`, `requiresConnectorRefresh`, or missed heartbeat | Stale Connection |
| `disconnected` | User stopped the panel/client | Disconnected |
| `error` | WebSocket/runtime error before a more specific close fact | Error |

Activity is displayed separately as approval pending, operation in progress, operation failed, connected, or blocked. `Ready` additionally requires completed RemNote initial sync and an approved root when that scope is selected. Pairing grants are shown before approval; pairing and transport errors are no longer hidden in Advanced Details.

Normal access, authentication identity, and destructive access now occupy separate visual sections. Danger mode, delete approval, and danger-tier tools require typing `ENABLE DANGER`; restoring the recommended note-writer profile does not. The native settings label also identifies the local bearer as sensitive local-only auth.

UI layout CSS lives in `src/index.css`; `src/style.css` remains the tracked Tailwind/base stylesheet. Stage 14 layout targets now name the file that owns the widget rules. State/close regressions live in `tests/bridge-ui-state.test.ts`.

Visual evidence:

- Actual RemNote 1.26.20 dev-plugin iframe rendered at `487 x 798` CSS pixels in a connected local-plugin state; `clientWidth` and `scrollWidth` were both `487`. The SDK widget was inspected through RemNote's CDP target, not a fake standalone page.
- That pass exposed a letter-by-letter header-pill wrap; the pill is now non-breaking at normal widths and becomes its own grid row below the 460px breakpoint.
- Deterministic post-fix stress fixtures at 320px and 720px covered danger warning, auth boundary, long WSS URL, destructive confirmation, and action buttons without overlap. Screenshots were generated at `/tmp/remnote-stage14-320.png` and `/tmp/remnote-stage14-720.png` for this run only.
- A second RemNote launch after the final CSS change stalled before creating a renderer target, so the post-fix 320/720 images are fixture evidence, not a second live RemNote screenshot. Build, typecheck, and DOM/CSS evidence remain distinct from hosted ChatGPT proof.

## Failure Taxonomy

- Connection/session: status can look connected while plugin calls time out.
- Scope: broad `workspace_allowed` exists; agent must self-limit to disposable root.
- Bulk source fidelity: missing source text, wrong chunk coverage, wrong hierarchy.
- Idempotency: long generated keys can exceed 128-char validator.
- Resume: `memory_only` jobs are restart-lossy; Postgres restart-resume is proven only with `DATABASE_URL` smoke `PASS`.
- Formula: rich inline math can work, but full formula import not proven.
- Cards: local parser, all creation types, retries, and verifier diagnostics are covered; representative live readback remains required before live status can pass.
- Style: local mutation, formula preservation, preview, and template-safety paths pass; representative live readback remains required.
- Reporting: never promote `ok: true` to pass without readback.

## P0 Repairs

1. Stale connection truth:
   - Files: `server/src/bridge-hub.ts`, `server/src/tools/register-status-tools.ts`, `server/src/bridge/plugin-connection.ts`.
   - Need: plugin-responsive vs socket-open distinction.
   - Test: simulate timeout, ensure status marks stale/unresponsive.

2. Scope + destructive safety:
   - Files: `server/src/tool-permissions.ts`, `src/bridge/handlers/scope.ts`.
   - Need: no write outside focus/approved root; delete stays gated.
   - Test: out-of-scope write rejected; delete dry-run/title/parent guards required.

## P1 Repairs

1. Verification status:
   - Keep `PASS`, `PARTIAL`, `FAIL`, `BLOCKED`, `UNKNOWN` distinct.
   - `written_not_verified` never becomes `verified`.
   - Tool envelope must expose verification attempt + method + warnings.

2. Profile matrix:
   - Default `mass_note_writer` and active `danger` must report separately.
   - Hidden tools: delete/replace/folder remain hidden unless explicit env/profile permits.

## P2 Repairs

1. Bulk chunk coverage:
   - Repro: source with H1 intro text before H2/H3, then section bullets.
   - Expected: intro preserved, section preserved, normalized full source matches.

2. Bullet hierarchy:
   - Repro: sibling bullets A/B plus formula paragraph.
   - Expected: Bullet B sibling of Bullet A, formula sibling/paragraph as planned, not child of Bullet A.

3. Idempotency key length:
   - Current format can exceed validator.
   - Fix: hash long job/section/source components.
   - Test: long jobId/source title still <=128 chars.

4. Job durability:
   - Current: `memory_only`.
   - Either add durable store or label restart-resume unsupported.

5. File-backed import:
   - Accept connector file object aliases: `sourceFilePath`, `filePath`, `path`, `sourceFileUri`.
   - Hosted arbitrary local paths must fail before write with clear error.

## P3 Repairs

1. Formula:
   - Use `get_rem_rich` proof: inlineMath/mathBlock, no raw delimiters where conversion requested.
   - Verify full source text too.

2. Style/design:
   - No visible `Size`, `H1`, `H2`, `H3`, `normal` child pollution.
   - No child reorder unless requested.
   - Retest full `apply_style_plan`.

3. Cards:
   - Basic: already narrow-pass.
   - Cloze/MC/list: add readback tests.
   - Parser: `marker: both` must not emit malformed basic card from cloze line.

## P4 Repairs

- Keep docs compressed.
- Keep root markdown count low.
- Put reports in consolidated report files.
- Keep final statuses exact.
- Keep `TOOL_REFERENCE.md` generated at root.

## Stage 15 Security Audit, 2026-07-12

Threat model scope covered HTTP/MCP entrypoints, local/OAuth/Codex auth lanes, dashboard and pairing sessions, hosted plugin routing, server/plugin permission seams, destructive tools, bulk-import storage, file loaders, diagnostics, audit logs, and deployment config.

Validated critical/high fixes:

- Hosted dashboard local-provider bypass rejected before state/session issuance.
- Pairing disconnect requires secret-owned session; debug/admin secrets are constant-time and header-only.
- S256 is the only PKCE method; early async route errors return bounded 400/413/500 responses.
- Request-selected tool tiers are clamped to approval; plugin registration cannot widen stored authority.
- Every public tool has explicit permission policy; bulk run/resume require trusted write; unknown policy fails closed.
- Connector compatibility no-auth is read-only.
- Local file imports require linked Codex; plans/jobs are principal-owned; status output omits source text.
- Vitest upgraded to 3.2.6 and Hono to 4.12.27. `npm audit` reports no critical/high findings; low esbuild dev-only findings remain.
- Offline reads return immediately when never forwarded; reconnect wait remains only for post-forward transient failures.

Residual tracked risks: PKCE-bound authorization-code exchange denial from consume-before-verify, bounded arbitrary public HTTPS OAuth file fetch, missing WebSocket hello deadline, and process-memory rate-bucket cleanup. None is assessed high after current controls.

Deep-scan proof boundary: Codex Security deep preflight was blocked because this runtime exposes 3 usable worker slots and the skill mandates 6. Ordinary security-scan preflight was ready and the repository-specific fallback review completed. Do not claim the six-worker deep scan ran.

Stage 15 acceptance commands passed: auth, Codex bearer/routing/pairing, pairing, routing, connector compatibility, security, boundaries, and hosted end-to-end smoke.

## Stage 16 Performance And Soak Audit, 2026-07-12

Baseline timeout budgets:

| Budget | Milliseconds |
| --- | ---: |
| Default request | 120000 |
| High-level write | 180000 |
| Bulk step | 240000 |
| Read | 30000 |
| Mutation | 60000 |
| Write approval | 30000 |
| Reconnect window / interval | 30000 / 400 |

Tool metadata contains 75 budgets from 1000ms to 12000ms.

Local benchmark proof:

- Markdown pipeline: 4 cases, 0.416–2.626ms. Formula validation, source fidelity, bullet cleanliness, and table-separator cleanliness all passed.
- Server/tool flow: 73-tool danger-profile certification passed; mock-plugin p95 was 16ms; request ledger returned to zero.
- Large-payload benchmark: all 7 cases passed under the 5000ms target. Formula-heavy 216-node case used four bounded fallback chunks and completed local planning/verification in 6ms.
- Owner-bound bulk plans required one certification fixture fix: start now consumes the plan ID returned by the owner-scoped planning request.

Live soak proof boundary:

- Initial live regression: MCP endpoint unreachable and disposable parent missing.
- Safe retry launched local server and RemNote 1.26.30. RemNote stalled before renderer/plugin connection; no disposable parent ID became available.
- No live write ran. Many-Rem import, interruption/resume, readback, no-duplicate retry, and close/reopen soak remain `BLOCKED`, not failed and not passed.

`npm run server:mass-note-audit` passed and generated a report whose local gate table records benchmark PASS separately from live soak BLOCKED. Current performance verdict: local budgets pass; live soak not proven.

## Stage 17 Architecture Cleanup, 2026-07-12

Graph refresh produced 2,840 nodes, 8,315 edges, and 163 communities. The highest-friction seams included `create-http-server.ts`, `register-bulk-import-tools.ts`, `bridge-status.tsx`, and `bridge-hub.ts`. The selected narrow target was bulk-import access control because ownership checks and public-result redaction were repeated inside the 1,500-line registration module.

- New `server/src/bulk-import/access.ts` is a focused Module. Its Interface owns principal identity, record ownership validation, and public chunk/job redaction; the registration Implementation calls that seam instead of duplicating rules.
- This increases Depth and Leverage while preserving Locality: storage and tool registration stay unchanged, and no unrelated Adapter was introduced.
- TDD evidence: the new access test failed while the Module was absent, then the access/import suites passed with 52 tests. `server:build` also passed.
- UI contract references now distinguish Tailwind/base `src/style.css` from widget-layout `src/index.css`; historical unavailable scripts are labeled as non-runnable evidence; the cleanup policy lists current canonical docs.
- Dashboard information architecture remains `/login` → auth start/callback → `/dashboard` → pairing panel. No orphan route or extra hierarchy was added.
- Targeted cleanup provides no new live readiness proof. The Stage 15 deep-scan and Stage 16 live-soak boundaries remain unchanged.

Architecture review artifact for this run: `/tmp/architecture-review-20260712-0919.html`.

## Stage 18 Final Release Audit, 2026-07-12

Execution status: all 99 Stage 1-18 goals were addressed and audited. Proof status is 89 `PASS` and 10 `BLOCKED`; blocked proof is not represented as a code failure or a pass. The exact final verdict is `PARTIAL_LIVE_PROOF_ONLY`.

Legend: ✅ goal implementation/audit and its required local evidence pass. ⚠️ goal execution is complete, but its named external/live/deep proof is blocked.

| Stage | Every goal | Evidence/result |
| --- | --- | --- |
| 1 | ✅ 1.1 registry completeness; ✅ 1.2 annotations; ✅ 1.3 schema compatibility; ✅ 1.4 reference generation; ✅ 1.5 danger/unsupported protection; ✅ 1.6 client discovery | Build, schemas, profile, generated 75-tool reference pass. |
| 2 | ✅ 2.1 deployment truth; ✅ 2.2 auth order; ✅ 2.3 OAuth/pairing contract; ✅ 2.4 Codex bearer; ✅ 2.5 router isolation; ✅ 2.6 auth errors; ✅ 2.7 UI auth state | All auth, pairing, routing, Codex, connector, and hosted E2E smokes pass locally. |
| 3 | ✅ 3.1 principal scope; ✅ 3.2 plugin enforcement; ✅ 3.3 trusted write; ✅ 3.4 destructive safety; ✅ 3.5 actionable errors; ✅ 3.6 no auth bypass | Boundaries and unified gateway pass; unknown policy fails closed. |
| 4 | ✅ 4.1 inventory; ✅ 4.2 reads; ✅ 4.3 writes; ✅ 4.4 diagnostics; ✅ 4.5 matrix test; ✅ 4.6 honest unproven labels | Generated correctness matrix preserves `live_not_run`; core/advanced/diagnostic suites pass. |
| 5 | ✅ 5.1 read-preview-write-readback; ✅ 5.2 retry classification; ✅ 5.3 style-after-write; ✅ 5.4 cards-after-note; ✅ 5.5 cross-client isolation | Simulation, idempotency, routing, and server certification pass. |
| 6 | ✅ 6.1 reproduce failure; ✅ 6.2 hierarchy parser; ✅ 6.3 fidelity comparison; ✅ 6.4 false-verification block; ✅ 6.5 retry idempotency; ✅ 6.6 envelopes; ✅ 6.7 audit expectations; ✅ 6.8 live retest script | Bulk, importer, source-fidelity, and audit gates pass locally; live script reports blockers honestly. |
| 7 | ✅ 7.1 state machine; ✅ 7.2 memory durability language; ⚠️ 7.3 persistent storage path; ✅ 7.4 resume; ✅ 7.5 cancel; ✅ 7.6 resume audit | Memory/resume/cancel pass. Configured PostgreSQL runtime proof remains blocked without `DATABASE_URL`. |
| 8 | ✅ 8.1 normalization; ✅ 8.2 roots; ✅ 8.3 size behavior; ✅ 8.4 ChatGPT handoff truth; ✅ 8.5 Codex file handoff | Traversal/private-network/size/root denials pass. Local files require linked Codex; hosted file boundary is explicit. |
| 9 | ✅ 9.1 hierarchy; ✅ 9.2 formulas; ✅ 9.3 tables/code; ✅ 9.4 readback normalization; ✅ 9.5 exact live matrix | Local fidelity passes. Stage acceptance remains live-blocked for inline/block/nested formula readback. |
| 10 | ✅ 10.1 marker bug reproduction; ✅ 10.2 classification fix; ✅ 10.3 card idempotency; ✅ 10.4 card-set validation; ✅ 10.5 representative live matrix | Local card tests pass. Stage acceptance remains live-blocked for basic/cloze/MC readback. |
| 11 | ✅ 11.1 pollution regression; ✅ 11.2 style plan local proof; ✅ 11.3 template safety; ✅ 11.4 style/formula safety; ⚠️ 11.5 representative live style path | Local style/design gates pass; real disposable-root `apply_style_plan` proof is blocked. |
| 12 | ✅ 12.1 current OpenAI contract; ✅ 12.2 descriptor/metadata; ⚠️ 12.3 hosted real-plugin pairing; ⚠️ 12.4 ChatGPT live write workflow; ⚠️ 12.5 ChatGPT live reconnect | Contract tests and hosted simulation pass. Real ChatGPT/plugin/Rem IDs are unavailable. |
| 13 | ✅ 13.1 setup/env; ✅ 13.2 bearer failures; ✅ 13.3 routing; ✅ 13.4 permission boundary; ⚠️ 13.5 Codex live disposable workflow | Codex auth/routing/boundaries pass locally; current real plugin/root is unavailable. |
| 14 | ✅ 14.1 UI states; ✅ 14.2 responsive layout; ✅ 14.3 errors/progress; ✅ 14.4 danger/auth separation; ✅ 14.5 build validation | UI tests, typecheck, build, validate pass; actual RemNote inspection and post-fix fixture boundaries are documented. |
| 15 | ✅ 15.1 threat model; ✅ 15.2 token/session audit; ✅ 15.3 scope/delete audit; ✅ 15.4 file abuse audit; ⚠️ 15.5 mandated deep scan | Functional security suite passes and no critical/high dependency finding remains. Six-worker deep scan is blocked because only three worker slots are usable. |
| 16 | ✅ 16.1 budgets; ✅ 16.2 Markdown benchmark; ✅ 16.3 server/tool benchmark; ⚠️ 16.4 live soak; ✅ 16.5 readiness report | Local benchmarks and mass audit pass. Real large import/resume/reconnect soak is blocked. |
| 17 | ✅ 17.1 graph query; ✅ 17.2 stale docs; ✅ 17.3 one narrow split; ✅ 17.4 validation dedupe; ✅ 17.5 readiness unchanged | Graph evidence, access-module TDD (52 tests), build, and diff check pass; no proof upgrade. |
| 18 | ✅ 18.1 full local gate; ⚠️ 18.2 full live gate; ✅ 18.3 tool matrix; ⚠️ 18.4 non-functional signoff; ✅ 18.5 strict verdict | 27/27 local commands pass after two repaired regressions. Live and deep-scan facets remain blocked. Verdict: `PARTIAL_LIVE_PROOF_ONLY`. |

Stage acceptance summary:

| Result | Stages |
| --- | --- |
| ✅ Locally accepted / audit complete | 1-8, 14-17 |
| ⚠️ Local work complete; stage acceptance awaits current live proof | 9-13, 18 |

Final local gate (rerun after fixing the failures found by the first audit):

```text
PASS npm test
PASS npm run test
PASS npm run check-types
PASS npm run build
PASS npm run validate
PASS npm run server:build
PASS npm run server:smoke
PASS npm run server:test:auth
PASS npm run server:test:codex-bearer
PASS npm run server:test:codex-routing
PASS npm run server:test:codex-pairing
PASS npm run server:test:pairing
PASS npm run server:test:routing
PASS npm run server:test:connector-compat-routing
PASS npm run server:test:security
PASS npm run server:test:boundaries
PASS npm run server:test:tool-profile
PASS npm run server:test:tool-schemas
PASS npm run server:test:tools-core
PASS npm run server:test:tools-advanced
PASS npm run server:test:tools-diagnostics
PASS npm run server:test:markdown-importer
PASS npm run server:test:source-fidelity
PASS npm run server:test:idempotency
PASS npm run server:test:performance
PASS npm run server:test:e2e-hosted-smoke
PASS npm run server:mass-note-audit
```

The first audit correctly failed `npm test`/`npm run test` on a bulk timeout-floor regression and `server:smoke` on stale unknown-tool/reconnect assumptions. Bulk steps now take precedence over destructive-write timeout classification. Reconnect now distinguishes server receipt from plugin transport: a never-forwarded offline read returns immediately; a forwarded read can retry after reconnect. Full Vitest result is 19 files and 166 tests passed.

Live gate:

| Command | Result | Exact boundary |
| --- | --- | --- |
| `npm run bridge:live-tool-smoke` | `BLOCKED` (exit 1) | `MCP_ENDPOINT_UNREACHABLE`; disposable parent `missing`; zero tools listed; zero Rem changes. |
| `npm run bridge:live-tool-regression` | `BLOCKED` (exit 1) | Tiny bulk, formula, card, and style matrices blocked; no connected plugin/root; zero live proof. |

Non-functional signoff:

| Area | Result | Proof boundary |
| --- | --- | --- |
| UI | `PASS_LOCAL_WITH_ACTUAL_INSPECTION_BOUNDARY` | Build/validate/state tests pass; RemNote 1.26.20 was inspected before final CSS fixture-only correction. |
| Security | `PASS_FUNCTIONAL_DEEP_SCAN_BLOCKED` | Threat model/fixes/security gates pass; six-worker deep scan unavailable; no critical/high dependency advisory remains. |
| Performance | `PASS_LOCAL_LIVE_SOAK_BLOCKED` | Parser/tool benchmarks and timeout budgets pass; no current real large-workflow soak. |
| Tool matrix | `PASS_LOCAL_LIVE_ROWS_UNPROVEN` | 75 declared tools regenerated; local/server/client fields recorded; absent live success remains `live_not_run`. |

Final verdict: `PARTIAL_LIVE_PROOF_ONLY`.

This is not `PRODUCTION_READY`. Promotion requires a connected real RemNote plugin and disposable root for Stage 9-13/16/18 live matrices, plus deep-scan capacity if the mandated six-worker scan is still required.

## Required Local Gates

Run at minimum:

```bash
npm test
npm run test
npm run build
```

If scripts exist/touched area needs them:

```bash
npm run server:build
npm run server:smoke
npm run check-types
npm run validate
```

Historical baseline, 2026-07-02 (the unavailable commands below are evidence, not runnable project scripts):

- `npm test`: PASSED, 14 files, 74 tests.
- `npm run test`: PASSED, 14 files, 74 tests.
- `npm run lint`: COMMAND_NOT_AVAILABLE.
- `npm run typecheck`: COMMAND_NOT_AVAILABLE.
- `npm run build`: PASSED, 3 webpack size warnings.

## Required Live Gate

Do not claim `LIVE_PROVEN_READY` until:

- Focus confirmed.
- Disposable root created.
- Safe writes/readback pass.
- Bulk source fidelity passes on representative source.
- File-backed import either passes with connector file or fails pre-write by design.
- Formula/card/style paths prove readback.
- Stability soak passes without stale connection.

Current status: `PARTIAL_LIVE_PROOF_ONLY`.

## Cleanup Policy

Root markdown allowed:

- `TOOL_REFERENCE.md`
- `log.md`

Docs markdown allowed:

- `docs/engineering-guide.md`
- `docs/remnote-mcp-repair-and-testing.md`
- `docs/developer-diagnostics-reference.md`
- `docs/stage-8-file-import-audit.md`
- `docs/tool-tier-summary.md`
- `docs/superpowers/plans/*.md`

Report evidence folder markdown allowed:

- `Remnote MCP test by Chagpt result with report/old-report.md`
- `Remnote MCP test by Chagpt result with report/new-report.md`

All other markdown must be compressed into these files or deleted.
