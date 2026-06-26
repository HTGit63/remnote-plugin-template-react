# Workflow

## Order

1. Read `Agents.md`.
2. Check product/context files.
3. Patch one stage gap at a time.
4. Add or update focused tests.
5. Run local gates.
6. Generate readiness report.
7. Run live gates only with connected plugin and disposable root.

## Required Local Gates

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm test
git diff --check
```

## Optional Focused Gates

```bash
npm run server:test:tool-profile
npm run server:test:source-fidelity
npm run test:style-correctness
npm run server:mass-note-audit
```

## Live Gates

Run live gates only when RemNote is open, plugin is connected, and `REMNOTE_LIVE_TEST_PARENT_ID` points to a disposable root.
