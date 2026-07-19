# RemNote MCP Repository Guide

## Contract

This applies repository-wide. Follow the user request first. Preserve RemNote
safety, source fidelity, stable IDs, idempotency, and honest proof boundaries.

## Workflow

- Start with `git branch --show-current`, `git rev-parse HEAD`, and
  `git status --short`; read relevant code and tests before editing.
- Use RED → verified RED → minimum GREEN → focused test → regression → refactor
  for behavior changes. Do not invent runtime tests for documentation-only work.
- Prefer small changes at established seams and preserve unrelated user work.
- Make a short plan when work crosses files or subsystems.

## Safety

- Never commit credentials, tokens, pairing codes, database URLs, or `.env`.
- Do not weaken authentication, pairing, RemNote scope, write approval, URL
  validation, limits, or destructive-tool gating.
- Keep deletion off unless the user approves a disposable destructive test.
- After an uncertain write, inspect state and reuse its idempotency key; never
  blind-replay with a new key.
- Preserve long-note source fidelity unless the user asks for rewriting.

## Proof

Separate source inspection, focused tests, regression, build, exact-commit CI,
hosted identity, connected-plugin round trips, live mutation/readback,
idempotency/recovery, and human visual/playback confirmation. Server reachability
is not plugin connectivity; media readback is not playback proof.

Reference `src/` for plugin behavior, `shared/bridge/` for protocol,
`server/src/` for MCP/auth/routing/jobs, `tests/` for regressions, and
`TOOL_REFERENCE.md` plus `docs/engineering-guide.md` for public behavior.

## Standard gates

```bash
npm test && npm run check-types && npm run validate && npm run build
npm run server:build && npm run server:smoke
git diff --check
```

Add area-specific security, auth, routing, boundary, schema, idempotency, source
fidelity, storage, and live gates when needed. Report blockers honestly.

## Release and branches

- Plugin version comes from `public/manifest.json`; npm `0.0.1` is separate.
- Keep `main` free of `graphify-out/` and event-specific evaluation files.
- Keep Graphify on `fix/remnote-mcp-mass-note-creation-stability`.
- Put evaluation instructions and benchmarks on their documentation branch.
- Never move release tags, force-push shared branches, or delete a branch
  without proving reachability and obtaining user approval.

Do not claim completion until fresh checks pass, the tree is reviewed, and
requested refs exist. State remaining manual, release, or human steps plainly.
