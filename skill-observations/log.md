# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

---

## 2026-07-10 RemNote Stage 9 and 10

### Observation 1: Check repository documentation policy before saving plans

**Status:** OPEN
**Date:** 2026-07-10
**Session context:** A multi-stage implementation plan used the writing-plans skill inside a repository with a strict documentation allowlist.
**Skill:** writing-plans
**Type:** open-source
**Phase/Area:** Plan save location

**Issue:** The skill's default `docs/superpowers/plans/` path conflicted with binding repository guidance that forbade new Markdown files outside an allowlist. Following the default would create cleanup debt before implementation began.

**Suggested improvement:** Add a pre-save check to the Save Plans section: read repository guidance and documentation policies first; when the default path is forbidden, use a user-approved existing planning file, task tracker, or temporary out-of-repository plan path.

**Principle:** Artifact-location defaults must yield to repository-local storage and cleanup contracts.

### Observation 2: Keep meta-skill state outside product worktrees

**Status:** OPEN
**Date:** 2026-07-10
**Session context:** Task-observer first-use setup occurred during a code implementation session with a clean-diff requirement.
**Skill:** task-observer
**Type:** open-source
**Phase/Area:** Observation log location

**Issue:** Defaulting the persistent observation log and principles files to the active repository created unrelated untracked product-worktree files. This complicates diff review and can conflict with repository artifact policies.

**Suggested improvement:** Add path resolution before first-use setup: prefer a configured user-level observation workspace; otherwise use an ignored metadata directory outside the product repository or request a location before creating files. Verify the chosen path does not pollute `git status`.

**Principle:** Meta-workflow persistence must remain isolated from deliverable source trees unless the repository explicitly owns that state.

## 2026-07-11 RemNote Stage 14 UI validation

### Observation 3: Host-injected widgets need host-aware visual proof

**Status:** OPEN
**Date:** 2026-07-11
**Session context:** A plugin widget bundle rendered blank in a standalone browser because its SDK waits for host-provided runtime injection, while the same bundle rendered correctly inside the desktop host.
**Skill:** build-web-apps:frontend-testing-debugging, playwright
**Type:** open-source
**Phase/Area:** Visual preview and screenshot validation

**Issue:** A generic local-page preview can produce a blank or misleading result for SDK widgets, embedded panels, and extension surfaces that require host injection. Treating that as the product UI would create false visual failures or false proof from a hand-built substitute.

**Suggested improvement:** Add a host-awareness preflight: determine whether the surface requires a desktop app, extension shell, iframe bridge, or injected SDK; use that real host and its debugging target for primary inspection. Use deterministic standalone fixtures only for post-fix responsive stress, and label fixture screenshots separately from host-runtime screenshots.

**Principle:** Visual proof must run in the product's real rendering boundary; synthetic fixtures are supplementary evidence, not runtime proof.
