# RemNote MCP Stages 1-3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Subagents are forbidden for this run by the user. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete AGENTS.md Stages 1-3 by closing proven existing release drift, designing a safe URL-media contract, and implementing image/audio/video insertion through strict RED-GREEN TDD without claiming unrun live proof.

**Architecture:** Preserve the current registry-to-bridge architecture. Three public MCP tools use shared URL and placement schemas, map one-to-one to bridge tool names, pass existing scope/write-tier checks, and route to one focused plugin media writer that validates capability before creating a dedicated child Rem. The writer reuses canonical idempotency caches, write-operation planning, structured error envelopes, and post-write readback rather than proxy-fetching media through the server.

**Tech Stack:** TypeScript, React 17 RemNote plugin, `@remnote/plugin-sdk` 0.0.46, Node.js MCP server, `@modelcontextprotocol/sdk` 1.29.0, Zod 4, Vitest 3.

## Global Constraints

- Target branch: `fix/remnote-mcp-mass-note-creation-stability`.
- No production behavior change without a focused failing test first.
- Preserve auth, session, CSRF, origin, scope, trusted-write, and danger-tier controls.
- Media URLs allow only `http:` and `https:`; reject empty, malformed, `javascript:`, `file:`, and overlong values.
- Server does not fetch media URLs; RemNote rich-text builder owns the external fetch/render step.
- Default placement creates a dedicated child Rem and never erases unrelated target text.
- Same idempotency key must not create a second media Rem.
- Missing runtime builder returns typed `SDK_UNSUPPORTED` before mutation.
- Automated/local proof, deployed server proof, connected-plugin proof, readback proof, and visual/playback proof stay separate.
- Graphify update runs only after Stage 3 implementation and regression work is frozen.
- Commit occurs only after Stage 3 verification and Graphify refresh.

## Stage 0 Audit Snapshot

- Branch/HEAD: `fix/remnote-mcp-mass-note-creation-stability` at `5380dd5f2b87fa7d908a346fef81862498d47eea`.
- Initial worktree: modified `AGENTS.md`; untracked `OPENAI_BUILD_WEEK_SUBMISSION_DRAFT.md`; both predate implementation work.
- Remote branch and hosted `/health`: exact same SHA as HEAD.
- CI: GitHub Actions run `29603562034` succeeded for exact HEAD.
- Hosted service: HTTP 200, hosted OAuth required, one connected plugin session, active runtime profile `developer`, 73 public tools.
- Initial sync: not exposed by public `/health`; unauthenticated quick plugin health returns HTTP 401, so current sync state is not independently verified in this run.
- Installed SDK: `@remnote/plugin-sdk` 0.0.46; installed typings expose `richText.image`, `richText.audio`, and `richText.video`.
- Runtime media builders: not reported by current capability probes and therefore unverified.
- Default profile: `mass_note_writer`; current registry reports 76 declared, 73 all-public, and 20 default-public tools.
- Drift: generated docs still report 75/72/19; ChatGPT submission display name is `RemNote ChatGPT Bridge` and its prose says 19 tools although it serializes 20.
- Version decision: npm package/server version `0.0.1` remains an internal implementation package version; RemNote manifest `0.1.0` remains the product/plugin release version. This split must be documented, not silently normalized.
- Latest Tests 01-15 live campaign: historical live evidence for deployed `76c6e2d`; current exact SHA has server/CI proof but not a fresh exact-SHA Tests 01-15 campaign.
- Test 14: local table-budget regression passes; historical two-run live campaign on `76c6e2d` remained `BLOCKED_JOB_STATE`; exact current SHA lacks authenticated disposable-root live reruns.
- README: root README absent.
- Artifact: local `PluginZip.zip` exists; no verified public exact-SHA artifact URL.
- Existing MCP media tools: none.

---

### Task 1: Stage 1 Reliability and Release-Truth Closure

**Files:**
- Modify: `tests/chatgpt-app-contract.test.ts`
- Modify: `tests/bulk-import-tools.test.ts` only if the exact two-run Test 14 behavior is not already covered by existing focused cases
- Modify: `chatgpt-app-submission.json`
- Modify: `server/src/dashboard/templates.ts`
- Modify: `server/src/auth/oauth-routes.ts`
- Modify: `public/manifest.json`
- Modify: `docs/engineering-guide.md`
- Regenerate: `TOOL_REFERENCE.md`
- Regenerate: `docs/tool-tier-summary.md`
- Regenerate: `docs/developer-diagnostics-reference.md`
- Modify: `AGENTS.md` with an honest Stage 1 execution record

**Interfaces:**
- Consumes: `getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE): string[]` and `getToolRegistrySummary(false, DEFAULT_TOOL_PROFILE)`.
- Produces: user-facing product name `RemNote MCP`, registry-derived count prose, documented package/product version split, and current generated registry documents.

- [ ] **Step 1: Write the failing metadata-truth test**

Extend `tests/chatgpt-app-contract.test.ts` so the submission contract asserts:

```ts
type SubmissionAppInfo = { display_name: string; description: string };
const expected = getPublicMcpToolNames(false, DEFAULT_TOOL_PROFILE);
const appInfo = (submission as { app_info: SubmissionAppInfo }).app_info;
expect(appInfo.display_name).toBe('RemNote MCP');
expect(appInfo.description).toContain(`exactly ${expected.length} focused tools`);
expect(appInfo.description).not.toContain('RemNote ChatGPT Bridge');
```

Add exact user-facing string checks for dashboard/OAuth sources and assert `public/manifest.json` no longer links to the absent `main/README.md` changelog.

- [ ] **Step 2: Verify RED**

Run:

```bash
npx vitest run tests/chatgpt-app-contract.test.ts
```

Expected RED: old display name is `RemNote ChatGPT Bridge`, description says 19 instead of current registry-derived 20, and manifest changelog targets missing `main/README.md`.

- [ ] **Step 3: Apply minimum metadata fix**

Change public display strings to `RemNote MCP`, update the submission description to current registry count, keep internal npm package IDs unchanged, point changelog to the stable GitHub releases page, and document:

```text
npm package/server 0.0.1 = implementation package version
RemNote manifest 0.1.0 = plugin product version
```

- [ ] **Step 4: Verify GREEN and surrounding Stage 1 regressions**

Run:

```bash
npx vitest run tests/chatgpt-app-contract.test.ts tests/version-metadata.test.ts
npx vitest run tests/bulk-import-tools.test.ts tests/bulk-import.test.ts tests/bridge-reconnect.test.ts tests/bridge-runtime-lifecycle.test.ts tests/bridge-retry-safety.test.ts tests/verifier-evidence-phase4.test.ts tests/design-template-preview.test.ts tests/read-style-metadata-filtering.test.ts
npm run server:test:security
npm run server:test:boundaries
npm run server:test:idempotency
npm run server:test:bulk-storage
```

Expected GREEN: product metadata follows registry truth; Test 14 budgets, resumable state transitions, completed-job no-replay, reconnect ownership, verifier truth, auth, boundaries, and idempotency remain green. PostgreSQL-specific proof remains explicitly blocked if `DATABASE_URL` is absent.

- [ ] **Step 5: Regenerate registry documentation**

Run:

```bash
npm run server:generate-tool-reference
```

Expected: generated counts match current registry and no hand-maintained count remains stale.

- [ ] **Step 6: Record Stage 1 proof boundary**

Add an execution record under Stage 1 in `AGENTS.md` stating local/CI/deployment-health results, current plugin connection truth, and exact blockers for authenticated Test 14 live reruns, initial-sync proof, PostgreSQL durability, and exact-SHA Tests 01-15 proof.

---

### Task 2: Stage 2 Media Contract and Threat Model

**Files:**
- Create: `docs/superpowers/plans/2026-07-18-remnote-mcp-media-insertion.md`
- Modify: `AGENTS.md` with an honest Stage 2 execution record

**Interfaces:**
- Consumes: installed `RichTextNamespace` types, current MCP annotation types, `BridgeToolName`, `ToolPolicyEntry`, and existing write/scope/idempotency conventions.
- Produces: exact schemas, `MediaKind`, `MediaInsertArgs`, `MediaInsertResult`, `insertMediaFromUrl(plugin, args)`, bridge routing map, annotations, rollback semantics, fixtures, and live-proof requirements.

- [ ] **Step 1: Load current implementation references**

Read MCP builder best practices and TypeScript guide, installed SDK declarations, Context7 RemNote RichText docs, installed MCP SDK annotation types, existing registry/tool-policy patterns, scope validation, write caches, and fake RemNote test helpers.

- [ ] **Step 2: Decide exact public contract**

Define:

```ts
type MediaPosition = 'start' | 'end';
type MediaKind = 'image' | 'audio' | 'video';
type MediaInsertArgs = {
  parentId: string;
  url: string;
  position: MediaPosition;
  label?: string;
  idempotencyKey: string;
  verifyAfterWrite: boolean;
  width?: number;
  height?: number;
};
```

Image accepts optional width/height; audio/video schemas reject them. `position` defaults to `end`; `verifyAfterWrite` defaults to true. `label` names the dedicated child Rem but never becomes raw HTML.

- [ ] **Step 3: Decide security and failure semantics**

Document that the server validates but never fetches the URL. Allow only bounded HTTP(S); reject malformed/active/local-file schemes. Capability check occurs before `createRem`; parent scope and trusted-write authorization remain existing server/plugin gates. A failed builder or child write must not change parent text. Return `SDK_UNSUPPORTED` with exact capability and zero mutation when absent.

- [ ] **Step 4: Decide MCP annotations**

For all three tools:

```ts
{
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
}
```

Rationale: tools add private RemNote content, do not overwrite/delete, same complete arguments/idempotency key have no additional effect, and RemNote resolves a remote URL outside the closed private workspace.

- [ ] **Step 5: Save and self-review the media plan**

Plan must enumerate exact RED tests, expected failure reason, minimum GREEN seams, regression commands, authenticated disposable-root fixtures, image render/audio playback/YouTube embed proof, and rollback behavior. Scan it for placeholder text and type/name mismatches.

- [ ] **Step 6: Record Stage 2 completion**

Mark design complete and production implementation not yet started at that checkpoint. Cite installed SDK 0.0.46 types and Context7 RemNote API docs; label runtime rendering as unproven until live Stage 6.

---

### Task 3: Stage 3 Media Schemas, Protocol, and Registry Surface

**Files:**
- Create: `tests/media-tools.test.ts`
- Modify: `server/src/tools/schemas.ts`
- Create: `server/src/tools/register-media-tools.ts`
- Modify: `server/src/mcp-server.ts`
- Modify: `server/src/tool-policy.ts`
- Modify: `server/src/tool-registry.ts`
- Modify: `server/src/mcp-tool-map.ts`
- Modify: `server/src/remnote-capability-guide.ts`
- Modify: `shared/bridge/protocol-registry.ts`
- Modify: `shared/bridge/protocol-write-args.ts`
- Modify: `shared/bridge/protocol-write-results.ts`
- Modify: `chatgpt-app-submission.json` only if media belongs in the default profile; default decision is note-writer tier, so submission surface should remain registry-consistent without media.

**Interfaces:**
- Consumes: `ToolRegistrationContext`, bridge tool registration pattern, Zod 4 schemas, current tool metadata/profile hierarchy.
- Produces: `INSERT_IMAGE_FROM_URL_INPUT_SCHEMA`, `INSERT_AUDIO_FROM_URL_INPUT_SCHEMA`, `INSERT_VIDEO_FROM_URL_INPUT_SCHEMA`, three public MCP registrations, three bridge tool names, exact tool policies, and structured media result types.

- [ ] **Step 1: RED schema tests**

Test valid HTTP(S), empty/malformed/`javascript:`/`file:`/overlong URLs, non-positive/excessive image dimensions, position defaults, and audio/video rejection of image dimensions.

- [ ] **Step 2: Verify schema RED**

Run:

```bash
npx vitest run tests/media-tools.test.ts
```

Expected RED: media schemas and tool registrations do not exist.

- [ ] **Step 3: GREEN schemas and protocol names**

Add one shared media URL schema with maximum 2048 characters, image dimensions from 1 through 4096, explicit parent ID, idempotency key, position, label, and verify flag. Add exact bridge tool unions/mappings and typed arguments/results.

- [ ] **Step 4: RED discovery/annotation tests**

Assert all three tools are public in `note_writer`, absent from `mass_note_writer` unless explicitly added there, route to exact bridge commands, require approved-root write access, and publish the four annotations from Task 2.

- [ ] **Step 5: GREEN registry/registration**

Register three focused tools with concise `Use this when ...` descriptions, structured bridge result envelopes, note-writer access, additive/non-destructive policy, and performance budgets consistent with one child creation plus readback.

- [ ] **Step 6: Verify registry GREEN**

Run:

```bash
npx vitest run tests/media-tools.test.ts tests/tool-status-matrix.test.ts tests/chatgpt-app-contract.test.ts
npm run server:test:tool-schemas
npm run server:test:tool-profile
```

Expected GREEN: discovery, mappings, schemas, annotations, profile exposure, and existing submission surface are consistent.

---

### Task 4: Stage 3 Plugin Media Writer, Capability Gates, and Idempotency

**Files:**
- Create: `src/remnote/write/mediaWrites.ts`
- Modify: `src/remnote/write/index.ts`
- Modify: `src/remnote/sdkCapabilities.ts`
- Modify: `src/bridge/handlers.ts`
- Modify: `src/bridge/handlers/args.ts`
- Modify: `src/bridge/handlers/validation.ts`
- Modify: `src/bridge/handlers/scope.ts` only if the existing approved-root write classifier does not automatically cover new tools
- Modify: `tests/helpers/fakeRemnote.ts`
- Extend: `tests/media-tools.test.ts`

**Interfaces:**
- Consumes: `RNPlugin`, `buildWriteOperationPlan`, `executeWriteOperation`, `findRequiredRem`, `runSdkOperation`, existing idempotency caches, and bridge success/failure helpers.
- Produces: `insertMediaFromUrl(plugin, kind, args): Promise<InsertMediaResult>` and runtime capabilities `plugin.richText.image`, `plugin.richText.audio`, `plugin.richText.video`.

- [ ] **Step 1: RED builder-selection tests**

For image/audio/video, assert only the matching rich-text builder receives the normalized URL; image receives width/height; media rich text is written to a new child under the intended parent.

- [ ] **Step 2: RED safe-placement tests**

Assert parent text and unrelated children remain unchanged, `start`/`end` position is deterministic, and result reports created IDs plus verification evidence.

- [ ] **Step 3: RED idempotency tests**

Invoke each tool twice with the same idempotency key. Expected first result creates one child; second returns `already_applied` and the child count remains one.

- [ ] **Step 4: RED missing-capability tests**

Delete one builder from fake runtime and call its tool. Expect typed `SDK_UNSUPPORTED`, capability detail, zero `createRem` calls, and unchanged parent/children.

- [ ] **Step 5: Verify behavioral RED**

Run:

```bash
npx vitest run tests/media-tools.test.ts
```

Expected RED: media writer, capability probes, and bridge handlers do not exist.

- [ ] **Step 6: GREEN focused media writer**

Implement validate → capability check → parent lookup/scope guard → idempotency lookup → rich-text build → child create/position → readback → cache result. Never clear parent rich text. Map SDK exceptions through existing structured write errors and include partial-created IDs if a post-create operation fails.

- [ ] **Step 7: GREEN capability/report routing**

Add three runtime probes, normalize bridge args, dispatch exact commands, and include result types in protocol envelopes. Keep authorization at both server policy and plugin scope seams.

- [ ] **Step 8: Verify behavioral GREEN and security regressions**

Run:

```bash
npx vitest run tests/media-tools.test.ts tests/unified-stage-gateway.test.ts tests/write-idempotency-duplicates.test.ts
npm run server:test:security
npm run server:test:boundaries
npm run server:test:idempotency
```

Expected GREEN: correct builders, safe placement, capability failure before mutation, scope/tier enforcement, structured errors, and no duplicates.

---

### Task 5: Stage 3 Combined Regression and Completion Record

**Files:**
- Modify: `AGENTS.md` with Stage 3 execution record
- Regenerate: `TOOL_REFERENCE.md`
- Regenerate: `docs/tool-tier-summary.md`
- Regenerate: `docs/developer-diagnostics-reference.md`

**Interfaces:**
- Consumes: complete Stage 3 tool surface and focused test evidence.
- Produces: current generated docs and an explicit local-complete/live-unproven stage record.

- [ ] **Step 1: Run full required local verification**

Run:

```bash
npm run check-types
npm test
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run server:test:security
npm run server:test:boundaries
npm run server:test:tool-schemas
npm run server:test:idempotency
npm run server:test:source-fidelity
npm run server:test:health-check-routing
npm run server:test:bulk-storage
npm run test:style-correctness
npm audit --omit=dev
npm audit --omit=dev --prefix server
git diff --check
```

Expected: every local command exits 0. If network audit fails, record exact registry error and do not reuse historical zero-vulnerability claims.

- [ ] **Step 2: Regenerate tool docs after media registration**

Run `npm run server:generate-tool-reference`, then rerun `tests/chatgpt-app-contract.test.ts` and `git diff --check`.

- [ ] **Step 3: Record Stage 3 completion boundary**

In `AGENTS.md`, state all three public tools are locally discoverable and regression-proven. State live image render, audio playback, YouTube embed, exact runtime capability, and same-key live duplicate proof remain unclaimed because Stage 3 explicitly ends before live success.

---

### Task 6: Final Graphify Refresh and Commit

**Files:**
- Update: `graphify-out/graph.json`
- Update: `graphify-out/graph.html`
- Update: `graphify-out/GRAPH_REPORT.md`
- Update: Graphify manifest/cost/label artifacts produced by the installed tool

**Interfaces:**
- Consumes: frozen post-Stage-3 repository.
- Produces: current architecture graph and one final repository commit.

- [ ] **Step 1: Refresh Graphify last**

Run from repository root:

```bash
graphify . --update
```

No subagents may be used. If semantic docs need extraction and no configured Gemini backend exists, use the installed Graphify incremental cache/inline fallback without violating the user rule.

- [ ] **Step 2: Verify Graphify integrity**

Confirm `graph.json`, `graph.html`, and `GRAPH_REPORT.md` exist; run Graphify health diagnostics; report dangling/missing/collapsed edges honestly.

- [ ] **Step 3: Review final diff and commit everything requested**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff --cached --stat
```

Stage intended repository changes, including the pre-existing AGENTS contract and submission draft because the user explicitly requested one final commit of everything. Inspect staged paths before committing.

Commit message:

```text
feat(remnote-mcp): complete stages 1-3 media support
```

Do not claim exact-release live media proof, Test 14 rerun proof, public artifact proof, or full product `COMPLETE` unless those external gates actually ran.
