# Stage 7 Judge-Ready Release Engineering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the exact-release Stage 6 proof, promote the proven branch to `main`, and publish a verified, judge-ready RemNote MCP v0.1.0 release.

**Architecture:** Preserve all production TypeScript, React, and bridge behavior. Limit changes to release metadata, documentation, generated plugin packaging, Git refs, and release evidence; then prove the unchanged runtime with the repository's full local and connected-live gates.

**Tech Stack:** React 17, TypeScript, Webpack 5, Node.js 20+, `@modelcontextprotocol/sdk`, RemNote Plugin SDK, Vitest, Streamable HTTP, WebSocket, PostgreSQL, Git, GitHub.

## Global Constraints

- Do not change production source code during documentation cleanup or Stage 7 packaging.
- Keep `TOOL_REFERENCE.md`, `log.md`, `AGENTS.md`, machine-readable JSON reports, and all existing remote branches.
- Remove the approved obsolete Markdown reports, including `remnote report/`, `OPENAI_BUILD_WEEK_SUBMISSION_DRAFT.md`, `PRODUCT.md`, and `security_best_practices_report.md`.
- Promote `fix/remnote-mcp-mass-note-creation-stability` to `main` only through a verified fast-forward; never force-push or delete another branch.
- Release identity is plugin product version `0.1.0`; the intentional internal package/server `0.0.1` lane remains documented, while manifest, archive, tag, checksum, source SHA, README, and health evidence must agree on their respective identities.
- Use official OpenAI documentation for ChatGPT Apps SDK and Codex MCP setup claims.
- Do not call Stage 7 complete without fresh verification, exact live deployment identity, and the user's visual Stage 6 playback confirmation.

---

### Task 1: Close Stage 6 and remove approved report clutter

**Files:**
- Modify: `AGENTS.md`
- Delete: `remnote report/**`
- Delete: `OPENAI_BUILD_WEEK_SUBMISSION_DRAFT.md`
- Delete: `PRODUCT.md`
- Delete: `security_best_practices_report.md`
- Delete: `reports/*.md`
- Delete: `server/reports/*.md`

**Interfaces:**
- Consumes: exact deployed SHA `ebc99df6901356b055a425b5909e8d0b5829d5cf`, native media readback, idempotency results, and the user's visible playback confirmation.
- Produces: an explicit Stage 6 `100% COMPLETE` status and a professional repository document inventory.

- [ ] **Step 1: Record the final visual proof in `AGENTS.md`**

Add the dated confirmation that the image rendered, audio player played, YouTube embedded and played, direct MP4 rendered and played to completion, and the plugin panel showed `Connected`.

- [ ] **Step 2: Delete only the approved obsolete Markdown artifacts**

Use `apply_patch` deletions. Preserve JSON evidence and the explicitly protected `TOOL_REFERENCE.md` and `log.md`.

- [ ] **Step 3: Verify the cleanup boundary**

Run: `git status --short && git ls-files '*.md' '*.MD'`

Expected: only the approved files are deleted; protected documents remain tracked; production source files are unchanged.

- [ ] **Step 4: Commit the Stage 6 closure and cleanup**

```bash
git add AGENTS.md docs/superpowers/plans/2026-07-19-stage-7-release-engineering.md
git add -u -- 'remnote report' OPENAI_BUILD_WEEK_SUBMISSION_DRAFT.md PRODUCT.md security_best_practices_report.md reports server/reports
git diff --cached --check
git commit -m "docs(stage6): close live media proof and prune reports"
```

Expected: one documentation-only commit with no production source changes.

### Task 2: Promote the proven branch to `main`

**Files:**
- Modify: Git refs only.

**Interfaces:**
- Consumes: clean committed feature branch and verified `main` ancestry.
- Produces: local and remote `main` at the exact Stage 6 closure commit while preserving all old branches.

- [ ] **Step 1: Refresh remote refs and prove fast-forward ancestry**

Run: `git fetch origin --prune && git merge-base --is-ancestor origin/main HEAD && git rev-list --left-right --count origin/main...HEAD`

Expected: ancestry exits `0`, with zero commits unique to `origin/main` and one or more commits unique to the feature branch.

- [ ] **Step 2: Fast-forward local `main`**

```bash
git switch main
git merge --ff-only fix/remnote-mcp-mass-note-creation-stability
```

Expected: `main` points to the feature branch tip with no merge commit.

- [ ] **Step 3: Push `main` without deleting branches**

Run: `git push origin main`

Expected: `origin/main` fast-forwards; the feature branch and all historical branches remain present.

### Task 3: Reconcile release identity and write the judge README

**Files:**
- Create: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: `public/manifest.json` product version `0.1.0`, intentional internal package/server version `0.0.1`, hosted URL `https://remnote-plugin-template-react.onrender.com`, official OpenAI Apps SDK and Codex MCP guidance, tool profile definitions, and Stage 1–6 proof.
- Produces: one public product identity, exact setup paths, four judge prompts, honest Build Week scope, security guidance, limitations, and a release checklist.

- [ ] **Step 1: Reconcile and preserve the intentional version lanes**

Confirm root `package.json`, `package-lock.json`, `server/package.json`, and `server/package-lock.json` consistently use internal implementation version `0.0.1`, while `public/manifest.json`, the ZIP artifact, README, and release tag consistently use plugin product version `0.1.0`. Do not change dependencies or runtime source.

- [ ] **Step 2: Create the root README with all 23 Stage 7 requirements**

Include the product summary, RemNote-specific value, architecture diagram, supported platforms, local and hosted setup, ChatGPT pairing, Codex Streamable HTTP configuration, permission model, profiles, release identity, historical foundation versus eligible delta, Codex/GPT-5.6 usage, judge quick start, read/write/resume/media prompts, limitations, security, troubleshooting, and artifact link/checksum fields.

- [ ] **Step 3: Audit public wording and metadata consistency**

Run: `rg -n 'RemNote ChatGPT Bridge' README.md public/manifest.json chatgpt-app-submission.json TOOL_REFERENCE.md && rg -n '"version": "0\\.0\\.1"' package.json package-lock.json server/package.json server/package-lock.json`

Expected: no stale user-facing product name; all four internal package records retain `0.0.1`; the README explicitly explains why the plugin product is `0.1.0`.

- [ ] **Step 4: Commit release identity and README**

```bash
git add README.md AGENTS.md
git diff --cached --check
git commit -m "docs(stage7): add judge-ready v0.1.0 release guide"
```

Expected: documentation only; package and dependency files remain byte-for-byte unchanged.

### Task 4: Build and inspect the official plugin archive

**Files:**
- Rebuild locally: ignored release asset `PluginZip.zip`
- Generate locally: ignored build directory `PluginZip/**`

**Interfaces:**
- Consumes: plugin manifest version `0.1.0` and unchanged production sources.
- Produces: uploadable RemNote plugin ZIP with a deterministic SHA-256 checksum.

- [ ] **Step 1: Build the production plugin archive**

Run: `npm run build`

Expected: Webpack succeeds and `PluginZip.zip` is recreated.

- [ ] **Step 2: Validate archive contents and metadata**

Run: `unzip -t PluginZip.zip && unzip -p PluginZip.zip manifest.json && sha256sum PluginZip.zip`

Expected: archive integrity passes, manifest says `RemNote MCP` version `0.1.0`, and one SHA-256 value is printed.

- [ ] **Step 3: Preserve the source/archive boundary**

Confirm `PluginZip.zip` remains ignored by Git, record its checksum in the
release documentation, and publish it as a GitHub release asset. Do not force a
generated binary into source history.

### Task 5: Run security, MCP, and release verification gates

**Files:**
- Create: `STAGE_1_7_COMPLETION_AUDIT.md`
- Modify: `README.md`
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: fresh command outputs, official OpenAI documentation, exact hosted health identity, connected plugin evidence, and archive checksum.
- Produces: a consolidated Stage 1–7 scorecard, Stage 7 completion record, known limitations, and exact release verdict.

- [ ] **Step 1: Run frontend and server verification**

Run all Stage 7 matrix commands from `AGENTS.md`, including root tests/typecheck/validate/build; server build/smoke/security/boundaries/tool schemas/idempotency/source fidelity/health routing/bulk storage/style/e2e; and the auth, pairing, routing, compatibility, profile, performance, and PostgreSQL gates.

Expected: every required local gate exits `0`; any environment-only gate is reported separately and never rewritten as a pass.

- [ ] **Step 2: Run focused security pattern checks**

Run: `rg -n 'dangerouslySetInnerHTML|innerHTML\\s*=|eval\\(|new Function|document\\.write|postMessage\\([^,]+,\\s*["'"']\\*["'"']|localStorage|sessionStorage|child_process|exec\\(|spawn\\(|SELECT .*\\$\\{|INSERT .*\\$\\{' src server/src scripts --glob '!**/dist/**'`

Expected: findings are either absent, safe by inspection, or documented with file/line and severity; no P0/P1 remains.

- [ ] **Step 3: Verify hosted exact identity and live connection**

Run the hosted health route and connected bridge health checks. Confirm the reported deployment SHA, 76-tool developer profile, plugin connection, initial sync, focus, and scope without performing another destructive write.

Expected: hosted identity matches the proven deployment, and connected truth remains green.

- [ ] **Step 4: Write the consolidated completion audit**

Record Stage 1 through Stage 7 percentages, hard-gate results, exact SHAs, archive checksum, media proof IDs, security outcome, tool metadata outcome, limitations, and the distinction between local, simulated, connected-live, visual, and release evidence.

- [ ] **Step 5: Commit the final Stage 7 evidence**

```bash
git add README.md AGENTS.md STAGE_1_7_COMPLETION_AUDIT.md docs/superpowers/plans/2026-07-19-stage-7-release-engineering.md
git diff --cached --check
git commit -m "docs(stage7): certify stages 1 through 7"
```

Expected: the commit records only verified evidence and completed checklist state.

### Task 6: Tag, publish, and prove immutable release identity

**Files:**
- Modify: Git refs and GitHub release state only.

**Interfaces:**
- Consumes: clean `main`, all required gates passing, final source SHA, and `PluginZip.zip` checksum.
- Produces: immutable `v0.1.0` tag, pushed `main`, public source/tag URLs, and a release artifact when GitHub release tooling is available.

- [ ] **Step 1: Prove clean final state**

Run: `git status --short --branch && git diff --check && git log -1 --format='%H %s'`

Expected: clean `main` and one exact final SHA.

- [ ] **Step 2: Push final `main`**

Run: `git push origin main`

Expected: `origin/main` equals local `main`.

- [ ] **Step 3: Create and push the immutable tag**

```bash
git tag -a v0.1.0 -m "RemNote MCP v0.1.0"
git push origin v0.1.0
```

Expected: `v0.1.0` is new and resolves to the final Stage 7 commit. If the tag already exists, stop instead of moving it.

- [ ] **Step 4: Publish the ZIP artifact where available**

Use authenticated GitHub release tooling to create release `v0.1.0` and attach `PluginZip.zip`. If that tooling is unavailable, retain the pushed immutable tag, exact checksum, and local archive path, and report the release-upload limitation explicitly.

- [ ] **Step 5: Verify remote refs and artifact identity**

Run: `git ls-remote origin refs/heads/main refs/tags/v0.1.0 refs/tags/v0.1.0^{} && sha256sum PluginZip.zip`

Expected: remote `main`, peeled tag SHA, final source SHA, and recorded checksum agree.
