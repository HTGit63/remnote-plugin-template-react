# RemnoteMCP Two-Stage Audit

Generated: 2026-06-26T17:39Z
Branch: `fix/remnote-mcp-mass-note-creation-stability`
Contract: `Agents.md` live-test recovery stages 0-13.

## Stage 1 — Static/Source Audit

Status: PASS for code-readiness rows; live rows remain gated.

- Runtime/source metadata aliases present: `gitSha`, `branchName`, `buildTime`, `toolSchemaVersion`, `toolRegistryVersion`, `defaultToolProfile`, `activeToolProfile`, `registeredToolNames`, `mcpListedToolNames`, `runtimeVerifiedTools`.
- `mass_note_writer` exposes only the intended 19 tools.
- Standard envelope includes `status`, `toolName`, `operationId`, `idempotencyKey`, `idempotencyResult`, target IDs, mutation IDs, verification, error fields, retryability, warnings, and `phaseDurations.totalMs`.
- File-backed import accepts local paths plus mounted reference forms such as `file://...` and `sandbox:...`, and returns path, byte length, raw source hash, extracted chapter hash, and planned source hash.
- Conductor context artifacts now exist for product, communication, tech stack, workflow, and tracks.

Generated readiness report:

- `reports/remnote-mcp-readiness-audit-2026-06-26T17-34-48-390Z.json`
- `reports/remnote-mcp-readiness-audit-2026-06-26T17-34-48-390Z.md`

Readiness summary:

```text
REGISTRY_PRESENT: 2
READY_FOR_RUNTIME_TEST: 11
LIVE_TEST_NOT_RUN: 4
FAIL: 0
```

## Stage 2 — Automated Local/Runtime-Local Audit

Status: PASS for local gates.

Commands run:

```text
npm run check-types: PASS
npm run validate: PASS
npm run build: PASS with webpack size warnings only
npm run server:build: PASS
npm test: PASS, 10 files / 37 tests
npm run server:smoke: PASS
npm run server:test:tool-profile: PASS
npm run server:test:source-fidelity: PASS
npm run test:style-correctness: PASS
npm run server:test:boundaries: PASS
git diff --check: PASS
```

Extra check:

```text
npm audit --omit=dev: NOT RUN TO COMPLETION
Reason: npm registry audit endpoint returned an empty error twice.
```

## Live Boundary

Temporary local server health:

```text
deploymentMode: local
toolCallAuthMode: local_bearer_required
activeToolTier: mass_note_writer
publicToolCount: 19
bridge.connected: false
```

`REMNOTE_LIVE_TEST_PARENT_ID` was unset.

Final live stages cannot be marked `LIVE_PROVEN_READY` in this environment. Required live inputs remain:

- running MCP server
- connected RemNote plugin socket
- disposable `REMNOTE_LIVE_TEST_PARENT_ID`

Until those exist, correct status remains:

```text
The RemNote MCP bridge has a working safety/read core, but mass note creation is not live-proven. Bulk import, file-backed import, styling, card verification, duplicate protection, and runtime stability require staged fixes before real use.
```
