# AGENTS.md — RemNote MCP Bridge Stabilization, Architecture, and Cleanup Plan

## Repository

```text
HTGit63/remnote-plugin-template-react
```

## Target Branch

```text
feature/hosted-auth-pairing
```

## Primary Mission

Stabilize the RemNote MCP bridge so it becomes a clean, maintainable, secure, and genuinely useful system for high-fidelity RemNote note writing.

The current branch added many features, but the project is still not production-ready. The latest work must focus on:

1. Fixing the deployment/build failure.
2. Separating server code from RemNote plugin SDK code.
3. Reducing bloat and splitting oversized files.
4. Making Markdown-to-RemNote bulk import reliable and fast.
5. Hardening hosted/local security behavior.
6. Ensuring the public MCP tool registry is accurate and safe.
7. Proving everything with tests and two audit passes.

Do not add more features until the existing system is stable.

---

# Second-Pass Audit Findings That Must Be Treated as Known Bugs

The next Codex run must not rediscover these as surprises. Treat them as already observed risks and verify/fix them explicitly.

## Known Build and Boundary Bugs

1. `server/tsconfig.json` still includes `../src/bridge/**/*.ts`, so the server build can still compile plugin-side files.
2. `server/src/mcp-server.ts` still imports bridge protocol from `../../src/bridge/protocol.js` instead of an SDK-free shared module.
3. Any server file importing from `src/bridge/**` is suspect unless that file is proven SDK-free.
4. Server-only install must not require the root package or `@remnote/plugin-sdk`.

## Known Tool Registry and Safety Bugs

1. `delete_rem_by_id` is currently included in the `core` profile. That is too aggressive for a default/simple profile.
2. `replace_rem` is publicly exposed and metadata classifies it as `write` while policy says dangerous. This mismatch must be fixed.
3. `create_folder` remains in policy/metadata/protocol even though it is unsupported. It must not be public/callable.
4. `getAllPublicMcpToolNames(exposeDeleteTool)` ignores `exposeDeleteTool`, so delete exposure behavior is misleading.
5. `getHiddenMcpTools()` currently returns an empty list, so hidden/unsupported/dangerous tool reporting can be dishonest.
6. `callabilitySource: "registry_only_not_live_execution"` must not be presented as real runtime verification.
7. Tool count must be generated from the canonical source of truth, not hand-maintained in docs.

## Known Hosted Deployment Bugs

1. `render.yaml` sets hosted OAuth mode but does not set `REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1`.
2. Render build uses `npm install && npm run build`; use a deterministic/deploy-safe install strategy and ensure dev dependencies needed for TypeScript build are available.
3. Config uses both `toolProfile` and `toolTier` names in responses. Internal logic should use one canonical term.
4. Hosted CORS config in `render.yaml` includes `https://www.remnote.com` but not necessarily `https://remnote.com`; verify final allowed origins intentionally.

## Known Security Bugs

1. Hosted `validateMcpToolPermission` currently checks scope but must also enforce trusted write and destructive permissions.
2. Public discovery/no-auth tool listing must be reviewed. Discovery may be allowed, but it must not expose dangerous/debug internals beyond what is intended.
3. Root dashboard and diagnostics must not expose PID, cwd, recent tool calls, pairing/session internals, token/session details, or storage internals publicly in hosted mode.
4. Audit logs and diagnostics must redact secrets, tokens, pairing codes, session secrets, database URLs, and OAuth secrets.

## Known Markdown Importer Gaps

1. The importer exists, but one MCP call may still perform many internal SDK writes. That is acceptable only if timeout, rollback, partial failure, and verification are robust.
2. Source fidelity verification is currently snippet-based. It must become stronger: headings, ordering, formulas, paragraphs, bullets, code, tables, and pollution Rem checks.
3. Rollback behavior after verification failure must be explicit and tested.
4. Parser/dry-run tests must not require live RemNote.

---

# Required Double-Pass Code Review

Codex must inspect the codebase twice.

## Pass A — Before Writing Code

Perform a read-only audit and document:

```text
current branch
latest commit
build boundary
dependency graph
server/plugin/shared import violations
tool registry drift
security gaps
markdown importer gaps
dead code and bloat
tests currently present/missing
deployment config risks
```

## Pass B — After Writing Code

Repeat the audit after implementation and prove:

```text
the original failures are gone
new architecture boundaries are enforced
no new god files were created
security behavior is stronger
importer behavior is tested
tool registry is consistent
deployment is ready or explicitly not ready
```

Both passes must write audit files under `docs/audits/`.


---

# Working Principles

## Non-Negotiable Engineering Rules

1. Prefer simple, explicit code over clever abstractions.
2. Do not hide broken behavior behind docs or fake diagnostics.
3. Do not expose dangerous tools just to match an expected tool count.
4. Do not silently summarize, compress, or drop user-provided notes.
5. Do not let server code compile plugin-only RemNote SDK code.
6. Do not create another giant “god file.”
7. Do not make broad rewrites without tests proving behavior is preserved.
8. Do not remove working direct MCP tools unless they are unsafe, unsupported, or dead.
9. Do not scrape the RemNote DOM.
10. Do not add OpenAI API calls or a chat UI inside RemNote.
11. Keep the RemNote plugin as the SDK access layer only.
12. Keep the hosted server as the auth/routing/MCP layer only.
13. Shared code must be SDK-free.
14. Every write-capable tool must have clear permission and safety behavior.
15. Every destructive operation must require explicit guardrails.

---

# Required Two-Turn Audit Workflow

This task must be completed in two audit turns. Do not skip either audit.

## Audit Turn 1 — Read-Only Architecture and Safety Audit

Before modifying code, inspect the repository and produce a written audit report.

### Audit Turn 1 Must Determine

1. Current branch and latest commit.
2. Whether `npm run server:build` currently passes or fails.
3. Whether `npm run build` currently passes or fails.
4. Whether the server build still compiles plugin-side SDK files.
5. Whether `@remnote/plugin-sdk` is imported anywhere in server-compiled code.
6. Whether public tool registry, tool metadata, protocol, tool map, and docs agree.
7. Whether dangerous delete tools are exposed.
8. Whether `create_or_replace_note_from_markdown` is fully wired from:
   - MCP registry
   - MCP server registration
   - bridge protocol
   - plugin handler
   - RemNote write executor
   - tests
9. Whether Markdown import verification actually detects content loss.
10. Whether health-check local/direct mode still reports `NO_PAIRED_PLUGIN_SESSION`.
11. Whether server routes expose unsafe hosted diagnostics.
12. Whether trusted write mode and destructive tool permissions are actually enforced.
13. Which files are bloated and need segmentation.
14. Which files are empty, duplicated, obsolete, or placeholder-only.
15. Which docs are stale or misleading.

### Audit Turn 1 Output Required

Create or update:

```text
docs/audits/audit-turn-1-readonly.md
```

Include:

```text
Executive summary
Build status
Architecture boundary findings
Tool registry findings
Markdown importer findings
Security findings
Bloat/dead-code findings
Prioritized fix list
Files likely to modify
Files likely to remove
Risks
```

After this audit, proceed to implementation.

---

## Audit Turn 2 — Post-Repair Verification Audit

After implementing fixes, run a second audit.

### Audit Turn 2 Must Verify

1. Server build no longer compiles plugin SDK files.
2. Server package builds without `@remnote/plugin-sdk`.
3. Root plugin build still works.
4. Tool registry and protocol are consistent.
5. Public tools match the intended profile.
6. Dangerous legacy delete tools remain hidden/removed.
7. `delete_rem_by_id` is guarded and dry-run by default.
8. Markdown importer preserves source fidelity.
9. Health-check works correctly in local and hosted mode.
10. Security checks enforce scope, trusted write, and destructive permissions.
11. Dashboard/debug routes are safe in hosted mode.
12. Tests pass.
13. Documentation matches implementation.

### Audit Turn 2 Output Required

Create or update:

```text
docs/audits/audit-turn-2-post-repair.md
```

Include:

```text
What changed
What was removed
What was split
Build results
Test results
Security verification
Remaining limitations
Final go/no-go deployment verdict
```

---


# Goal -1 — Create a Codebase Map Before Refactoring

## Purpose

Prevent blind refactoring. Codex must first understand the repository shape and dependency boundaries.

## Required Output

Create:

```text
docs/audits/codebase-map.md
```

Include:

```text
directory tree summary
entry points
server build entry
plugin build entry
shared candidates
plugin-only files
server-only files
files importing @remnote/plugin-sdk
files importing server internals
oversized files ranked by line count
dead/empty/placeholder files
critical dependency graph
```

## Required Checks

1. Generate or manually document a list of files over 500, 800, and 1000 lines.
2. Identify circular dependencies if any are visible.
3. Identify files that mix responsibilities.
4. Identify files whose names no longer match their behavior.
5. Identify tests that are smoke-only but not assertion-heavy.

## Acceptance Criteria

1. Refactoring starts only after this map exists.
2. Any proposed file split references this map.
3. Audit Turn 1 links to this map.

---

# Goal 0 — Preflight and Baseline

## Purpose

Establish a clean baseline before changing code.

## Tasks

1. Confirm repository branch and latest commit.
2. Inspect package scripts in:
   - `package.json`
   - `server/package.json`
3. Inspect build config:
   - `tsconfig.json`
   - `server/tsconfig.json`
   - `render.yaml`
4. Inspect tool registry and protocol:
   - `server/src/tool-registry.ts`
   - `server/src/tool-policy.ts`
   - `server/src/mcp-tool-map.ts`
   - shared/protocol location if present
   - `src/bridge/protocol.ts`
5. Inspect plugin bridge files:
   - `src/bridge/client.ts`
   - `src/bridge/handlers.ts`
   - `src/bridge/pairing.ts`
6. Inspect RemNote write files:
   - `src/remnote/write/**`
7. Inspect server routing/auth files:
   - `server/src/app.ts`
   - `server/src/auth/**`
   - `server/src/routes/**` if present
8. Search for:
   - `@remnote/plugin-sdk`
   - `NO_PAIRED_PLUGIN_SESSION`
   - `delete_focused_rem`
   - `delete_selected_rem`
   - `delete_rem`
   - `create_folder`
   - `Size`
   - `H1`
   - `H2`
   - `H3`
   - `toolTier`
   - `toolProfile`
   - `registry_only_not_live_execution`
   - `maxDepth`
   - `TODO`
   - `placeholder`
   - empty files

## Acceptance Criteria

1. Baseline audit file exists.
2. Current failures are documented before fixes.
3. No code is changed before Audit Turn 1 is written.

---

# Goal 1 — Fix Build and Deployment Boundary

## Problem

The server build currently compiles plugin-side source files. This caused deployment failure because plugin-side files import `@remnote/plugin-sdk`, while the server package does not depend on it.

Current broken pattern:

```json
"rootDir": "..",
"include": ["src/**/*.ts", "../src/bridge/**/*.ts"]
```

## Target Architecture

Use three clean layers:

```text
shared/
  bridge/
    protocol.ts
    markdown-importer.ts
    tool-types.ts
    style-types.ts
    errors.ts

server/
  src/
    app.ts
    mcp-server.ts
    routes/
    auth/
    storage/
    bridge-hub.ts

src/
  bridge/
    client.ts
    handlers.ts
    pairing.ts
  remnote/
    read.ts
    write/
  widgets/
```

## Layer Rules

### `shared/**`

May contain:

```text
types
schemas
pure parsers
pure validators
pure formatters
constants
SDK-free tool definitions
```

Must not import:

```text
@remnote/plugin-sdk
React
DOM APIs
server-only auth/storage modules
Node-only networking modules unless intentionally shared and build-safe
```

### `server/**`

May import:

```text
shared/**
server/src/**
@modelcontextprotocol/sdk
pg
ws
zod
node built-ins
```

Must not import:

```text
@remnote/plugin-sdk
src/remnote/**
src/widgets/**
src/bridge/client.ts
src/bridge/handlers.ts
src/bridge/pairing.ts
```

### `src/**` Plugin Code

May import:

```text
shared/**
@remnote/plugin-sdk
React
plugin bridge client/handlers
plugin RemNote read/write modules
```

Must not import:

```text
server/src/**
server storage/auth internals
```

## Required Changes

1. Move SDK-free protocol/types from `src/bridge/protocol.ts` to:

```text
shared/bridge/protocol.ts
```

2. Move SDK-free Markdown importer from `src/bridge/markdown-importer.ts` to:

```text
shared/bridge/markdown-importer.ts
```

3. Update imports:
   - server imports from `shared/bridge/**`
   - plugin imports from `shared/bridge/**`
4. Keep plugin-only handler/client/pairing files under `src/bridge/**`.
5. Update `server/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "rootDir": "..",
    "outDir": "dist",
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*.ts",
    "../shared/**/*.ts"
  ],
  "exclude": [
    "../src/remnote/**",
    "../src/widgets/**",
    "../src/bridge/client.ts",
    "../src/bridge/handlers.ts",
    "../src/bridge/pairing.ts"
  ]
}
```

6. Verify `server/package.json` does not need `@remnote/plugin-sdk`.
7. Verify `cd server && npm run build` passes with only server dependencies installed.

## Acceptance Criteria

1. `npm run server:build` passes.
2. `cd server && npm run build` passes.
3. Server build output contains no plugin widget or RemNote SDK runtime files.
4. `grep -R "@remnote/plugin-sdk" server/src shared` returns no matches.
5. Render deployment build can succeed.

## Additional Boundary Tests Required

Add a server-only boundary test script, for example:

```bash
npm run server:test:boundaries
```

It must fail if:

```text
server/src imports ../src/remnote/**
server/src imports ../src/widgets/**
server/src imports ../src/bridge/client
server/src imports ../src/bridge/handlers
server/src imports ../src/bridge/pairing
server/src or shared imports @remnote/plugin-sdk
server/src or shared imports React
shared imports server/src/**
plugin src imports server/src/**
```

Also add a static grep-style CI check so this cannot regress.

## Build Output Rule

The server `dist/` output must not contain copied plugin widget, plugin handler, or RemNote SDK runtime files. If `rootDir` remains `..`, verify output layout is intentional and documented. Prefer a cleaner build layout if practical.


---

# Goal 2 — Reduce Bloat and Split Oversized Files

## Purpose

Make the codebase maintainable. The current project is too compacted and hard to reason about.

## Target File Size Guidelines

These are guidelines, not absolute laws:

```text
< 250 lines: ideal
250–500 lines: acceptable for route or parser files
500–800 lines: allowed only for dense registries/tests
> 800 lines: split unless there is a strong reason
> 1000 lines: must split
```

## Split Plugin Write Code

Current hotspot:

```text
src/remnote/write/index.ts
```

Refactor into:

```text
src/remnote/write/index.ts
src/remnote/write/writeErrors.ts
src/remnote/write/writeCaches.ts
src/remnote/write/writeValidation.ts
src/remnote/write/basicWrites.ts
src/remnote/write/treeWrites.ts
src/remnote/write/structuredBatch.ts
src/remnote/write/markdownImportExecutor.ts
src/remnote/write/formattingWrites.ts
src/remnote/write/deleteWrites.ts
src/remnote/write/cardWrites.ts
src/remnote/write/verification.ts
src/remnote/write/remnoteSdkHelpers.ts
```

### Module Responsibilities

#### `index.ts`

Only re-export public functions/types.

#### `writeErrors.ts`

Contains:

```text
RemnoteWriteError
SDK error mapping
partial execution error helpers
```

#### `writeCaches.ts`

Contains:

```text
idempotency caches
cache size limits
remember/read cache helpers
```

#### `writeValidation.ts`

Contains:

```text
argument normalization
tree limit validation
style normalization
color normalization
safe guard validation
```

#### `basicWrites.ts`

Contains:

```text
create_rem
append_to_rem
create_document
update_rem
replace_rem
move_rem
reorder_children
```

#### `treeWrites.ts`

Contains:

```text
create_rem_tree
create_styled_rem_tree
tree traversal
structured child creation
```

#### `structuredBatch.ts`

Contains:

```text
apply_structured_note_batch
replace children
append children
update root and replace children
rollback handling
```

#### `markdownImportExecutor.ts`

Contains:

```text
create_or_replace_note_from_markdown
Markdown plan execution
integrated verification
partial failure reporting
```

#### `formattingWrites.ts`

Contains:

```text
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_rem_type
set_hide_bullet
clear_rem_formatting
apply_style_plan
apply_remnote_command
```

#### `deleteWrites.ts`

Contains:

```text
delete_rem_by_id
delete preview
guard validation
dry-run default behavior
```

#### `cardWrites.ts`

Contains:

```text
create_basic_flashcard
create_concept_card
create_descriptor_card
create_cloze_card
create_multiple_choice_card
create_list_answer_card
```

#### `verification.ts`

Contains:

```text
verify_note_design
verify created Rems
Markdown source fidelity verification against RemNote output
pollution Rem detection
```

## Split Server App Code

Current hotspot:

```text
server/src/app.ts
```

Refactor into:

```text
server/src/app.ts
server/src/server/create-http-server.ts
server/src/server/runtime-info.ts
server/src/server/request-context.ts
server/src/routes/mcp-routes.ts
server/src/routes/health-routes.ts
server/src/routes/plugin-api-routes.ts
server/src/routes/dashboard-routes.ts
server/src/routes/oauth-routes.ts
server/src/routes/pairing-routes.ts
server/src/routes/diagnostics-routes.ts
server/src/routes/route-utils.ts
```

### Route Responsibilities

#### `mcp-routes.ts`

Handles:

```text
/mcp
MCP discovery
MCP tools/list
MCP tools/call
streamable HTTP transport
tool permission validation
```

#### `health-routes.ts`

Handles:

```text
/health
/public/status
minimal safe status
```

#### `diagnostics-routes.ts`

Handles:

```text
/diagnostics
/api/plugin/diagnostics
runtime verification matrix
admin/authorized diagnostics only
```

#### `dashboard-routes.ts`

Handles:

```text
/
/dashboard
admin dashboard
public-safe landing
```

#### `plugin-api-routes.ts`

Handles:

```text
/api/plugin/tool-profile
/api/plugin/health-check
/api/plugin/*
```

#### `oauth-routes.ts`

Handles OAuth metadata, auth, token, callback routes.

#### `pairing-routes.ts`

Handles local/hosted pairing flows.

#### `route-utils.ts`

Contains shared route helpers only.

## Acceptance Criteria

1. `src/remnote/write/index.ts` is no longer a god file.
2. `server/src/app.ts` is no longer a god file.
3. Behavior is preserved through tests.
4. No newly created module becomes another large dumping ground.
5. Public exports remain stable.

---

# Goal 3 — Remove Dead, Duplicate, Placeholder, and Unsupported Code

## Purpose

Clean code means removing what should not exist, not only adding fixes.

## Required Search

Find and classify:

```text
empty files
placeholder-only files
duplicated docs
old phase/final-polish docs no longer needed
unused imports
unused exports
unreachable code
unsupported public tools
obsolete comments
stale README claims
deprecated legacy delete tools
```

## Required Actions

1. Remove genuinely empty files.
2. Remove placeholder-only files.
3. Remove stale docs that only describe old phases and are no longer useful.
4. Keep important architecture/audit docs.
5. Remove or hide unsupported tools from public MCP registration.
6. Remove references to removed tools from README/Agents docs.
7. Add a short changelog entry describing removals.

## Unsupported Tool Policy

`create_folder` is unsupported by the current RemNote SDK.

Requirements:

1. Do not expose `create_folder` in public MCP tools.
2. Do not register it as callable under normal profiles.
3. Keep only a capability-guide note:
   - “Folder creation is unsupported by the installed RemNote SDK.”
4. If backwards compatibility requires keeping a protocol type, mark it:
   - internal
   - unsupported
   - not exposed
   - not callable

## Acceptance Criteria

1. No empty placeholder source files remain.
2. No unsupported tool is publicly exposed.
3. Docs no longer claim unsupported tools work.
4. Public tool count is intentional and documented.
5. Removed files are listed in Audit Turn 2.

---

# Goal 4 — Build a Clean Tool Registry and Public Tool Architecture

## Purpose

The MCP tool system must have one source of truth.

## Current Risk

The following can drift:

```text
MCP_TOOL_REGISTRY
TOOL_METADATA
TOOL_POLICY_ENTRIES
BridgeToolName
BRIDGE_TOOL_NAMES
BRIDGE_TOOL_ANNOTATIONS
mcp-tool-map
README tool docs
Agents docs
bridge status UI
```

## Target Architecture

Create one canonical source, then derive everything else.

Recommended:

```text
shared/tools/tool-definitions.ts
server/src/tools/register-*.ts
server/src/tool-registry.ts
```

Each tool definition should include:

```ts
{
  name: string;
  bridgeToolName: string;
  title: string;
  category: "status" | "read" | "write" | "formatting" | "batch" | "cards" | "diagnostics" | "delete" | "debug";
  profile: "core" | "advanced_notes" | "developer_diagnostics" | "full";
  policy: "preferred" | "fallback" | "debug" | "read" | "cards" | "dangerous" | "unsupported";
  riskLevel: "low" | "medium" | "high" | "dangerous";
  requiresWrite: boolean;
  requiresDelete: boolean;
  supportsDryRun: boolean;
  supportsIdempotency: boolean;
  sdkSupported: boolean;
  exposedNormally: boolean;
  recommendedForNormalUse: boolean;
}
```

## Tool Profile Rules

Use one canonical term:

```text
toolProfile
```

Allowed values:

```text
core
advanced_notes
developer_diagnostics
full
```

`toolTier` may remain only as a backwards-compatible response alias, not as internal logic.


## Second-Pass Registry Corrections Required

1. Move `delete_rem_by_id` out of the default/core profile unless there is a compelling safety-reviewed reason.
2. Mark `replace_rem` consistently as dangerous across:
   - metadata
   - policy
   - permission table
   - MCP annotations
   - docs
3. Make `exposeDeleteTool` meaningful or remove the parameter. It must not be ignored.
4. Implement honest hidden-tool reporting. `getHiddenMcpTools()` must report unsupported, gated, disabled, and profile-hidden tools.
5. Do not show `debug_get_raw_rich_text` in normal user-facing profiles unless the active profile is developer diagnostics or full.
6. `create_or_replace_note_from_markdown` should be the preferred high-level note tool in `advanced_notes`, not buried behind low-level tools.
7. Tool profile names must be canonical:
   - internal: `toolProfile`
   - compatibility aliases may include `toolTier`, but only as response aliases.


## Required Tests

Add a registry consistency test that fails if:

1. A public MCP tool has no metadata.
2. Metadata exists for a missing tool.
3. Protocol has a bridge tool that is not mapped.
4. Tool map points to a non-existent bridge tool.
5. Unsupported tools are publicly exposed.
6. Dangerous legacy delete tools appear.
7. Docs claim a different count from code.

## Delete Tool Rules

These tools must not be exposed publicly:

```text
delete_focused_rem
delete_selected_rem
delete_rem
```

`delete_rem_by_id` may remain public only if:

1. `dryRun` defaults to `true`.
2. Real delete requires `dryRun: false`.
3. Real delete requires guard fields:
   - `expectedParentId` or `expectedAncestorId`
   - `confirmTitle`
   - approval
4. Hosted mode requires destructive scope.
5. Local mode still requires plugin approval.

## Acceptance Criteria

1. Registry and protocol cannot drift silently.
2. Tool counts are generated, not hand-maintained.
3. Tool profile output is consistent across:
   - status
   - diagnostics
   - server hello
   - README
   - bridge widget
4. Dangerous legacy delete tools are absent.

---

# Goal 5 — Fix Markdown-to-RemNote Importer

## Purpose

The bridge must be useful for real long notes. It must not be slower or worse than manual copy-paste.

## Preferred Tool

```text
create_or_replace_note_from_markdown
```

## Required User Experience

For one long note, the assistant should need:

```text
one MCP tool call
one RemNote approval
one compact verification report
```

Not dozens of calls.

## Required Input Modes

Support:

```text
create_child
replace_target_children
update_target_and_replace_children
append_to_target
```

## Required Defaults

```ts
{
  mode: "create_child",
  duplicatePolicy: "create_new",
  headingMapping: {
    rootHeading: "first_h1",
    rootHeadingLevel: "H1",
    sectionHeadingLevel: "H3",
    subsectionHeadingLevel: "H3"
  },
  remnoteLayout: {
    insertSpacerBetweenSections: true,
    spacerText: "",
    preserveBlankLines: true,
    paragraphMode: "child_rem_per_paragraph",
    bulletMode: "preserve_markdown_bullets"
  },
  mathOptions: {
    inlineMathDelimiters: "both",
    blockMathDelimiters: "both",
    formulaMode: "preserve",
    rejectMalformedMath: true
  },
  fidelityOptions: {
    requireExactText: true,
    allowWhitespaceNormalization: true,
    preserveSourceOrder: true,
    failOnContentLoss: true
  },
  safetyOptions: {
    dryRun: false,
    verifyAfterWrite: true,
    rollbackOnFailure: true
  },
  limits: {
    maxMarkdownChars: 120000,
    maxDepth: 12,
    maxNodes: 1000
  }
}
```

## Parser Requirements

The parser must preserve:

```text
H1/H2/H3/H4 headings
paragraphs
blank lines
section spacers
nested bullets
numbered lists
inline math: $...$ and \(...\)
block math: $$...$$ and \[...\]
plain formulas
code blocks
tables as plain text if rich conversion is unsupported
bold/italic text where practical
source order
```

## Fidelity Rules

The importer must never:

```text
summarize
compress
omit examples
omit formulas
omit paragraphs
reorder sections
change heading meaning
replace exact content with shorter content
```

unless the user explicitly asks.

## Verification Requirements

Integrated verification must return:

```ts
{
  passed: boolean;
  checkedNodeCount: number;
  headingCount: number;
  paragraphCount: number;
  bulletCount: number;
  mathBlockCount: number;
  inlineMathCount: number;
  codeBlockCount: number;
  tableCount: number;
  missingTextSnippets: string[];
  extraTextSnippets: string[];
  structureMismatches: string[];
  pollutionRems: string[];
}
```

## Failure Behavior

If import fails:

1. Do not silently leave an incomplete note without reporting it.
2. Return:
   - `rootRemId` if available
   - `createdRemIds`
   - `updatedRemIds`
   - `failedAtPath`
   - `failedReason`
   - `rollbackStatus`
   - `verification`
3. If rollback succeeds, report it.
4. If rollback fails, report exactly which Rem IDs remain.
5. If rollback is intentionally not attempted after verification failure, return:
   - `rollbackStatus: "not_attempted_by_policy"`
   - `rootRemId`
   - inspection instructions


## Large Import Execution Strategy

The implementation must choose and document one of these strategies:

### Strategy A — Single Internal Batch

One MCP call sends a parsed tree to the plugin, and the plugin writes all Rems internally under one approval.

### Strategy B — Chunked Internal Batch

One MCP call sends the source, plugin parses/plans, then writes internally in safe chunks with progress and rollback.

### Strategy C — Dry-Run Then Apply

First call may be dry-run only, second call applies exactly the plan using an idempotency key.

Normal assistant use must still avoid dozens of tiny external MCP calls.

## Timeout and Cancellation Rules

1. Long import operations must respect request timeout.
2. If cancelled, return partial execution info.
3. Idempotency key must prevent duplicate long-note creation after retry.
4. A retry after unknown status must support safe detection of already-created root by source hash/idempotency metadata where possible.

## Source Hash Metadata

Where the RemNote SDK allows it, store or report:

```text
sourceHash
idempotencyKey
importedAt
importToolVersion
```

If SDK metadata is unavailable, return those fields in the result and use duplicate detection by root title plus optional idempotency cache.


## Performance Requirements

Add a parser performance smoke test:

```bash
npm run server:test:performance
```

It must not require live RemNote.

It must verify:

```text
120k char Markdown parse completes quickly
dry-run plan generation does not call RemNote SDK
node count and depth limits are enforced
source-fidelity check runs locally
```

## Acceptance Criteria

1. Long Markdown import works in one MCP call.
2. Parser tests pass without RemNote.
3. Dry-run returns a preview plan.
4. Real write returns created IDs and verification.
5. No source text is silently dropped.
6. No `Size`, `H1`, `H2`, `H3`, or `normal` pollution Rems appear.
7. If content loss is simulated, verification fails.

---

# Goal 6 — Fix Structured Batch and Tree Depth Handling

## Problem

The current structured write tools reject realistic study-note trees too early.

Observed failures:

```text
Styled tree depth exceeds requested maxDepth.
Structured note batch depth exceeds requested maxDepth.
```

## Requirements

Use consistent depth and node limits across:

```text
create_rem_tree
create_styled_rem_tree
create_polished_note_tree
apply_structured_note_batch
create_or_replace_note_from_markdown
```

## Defaults

```text
default maxDepth: 8
default maxNodes: 200
hard maxDepth: 12
hard maxNodes: 1000
```

## Error Reporting

When a tree is rejected, return:

```text
actualDepth
allowedMaxDepth
actualNodeCount
allowedMaxNodes
failedPath
failedTitle
```

## Tests

Add or update tests proving:

1. A realistic 5-level study-note tree passes.
2. A realistic Markdown note with H1 + H3 + nested bullets passes.
3. Extreme depth fails safely.
4. Extreme node count fails safely.
5. Error message points to the exact path/title.

## Acceptance Criteria

1. Realistic notes are not rejected.
2. Unsafe giant trees still fail.
3. All high-level write tools use the same validation logic.

---

# Goal 7 — Fix Style System and Formatting Safety

## Problem

Heading/style application previously created pollution Rems such as:

```text
Size
H1
H2
H3
normal
```

This must never happen.

## Canonical Style Shape

Use this internally everywhere:

```ts
style?: {
  headingLevel?: "H1" | "H2" | "H3" | "normal";
  textColor?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "default";
  highlightColor?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "default";
  hideBullet?: boolean;
  remType?: "normal" | "concept" | "descriptor";
}
```

## Legacy Alias Policy

Accept aliases only at external boundaries:

```text
color -> textColor
highlight -> highlightColor
type -> remType
```

After normalization, internal code must use canonical fields only.

## Canonical Style Operations

Use explicit discriminated operations:

```ts
type StylePlanOperation =
  | { type: "heading"; remId: string; headingLevel: "H1" | "H2" | "H3" | "normal" }
  | { type: "text_color"; remId: string; color: RemColor }
  | { type: "highlight"; remId: string; color: RemColor }
  | { type: "hide_bullet"; remId: string; hideBullet: boolean }
  | { type: "rem_type"; remId: string; remType: "normal" | "concept" | "descriptor" }
  | { type: "text_color_span"; remId: string; color: RemColor; range?: Range; text?: string; occurrence?: number }
  | { type: "highlight_span"; remId: string; color: RemColor; range?: Range; text?: string; occurrence?: number }
  | { type: "bold_span"; remId: string; range?: Range; text?: string; occurrence?: number }
  | { type: "italic_span"; remId: string; range?: Range; text?: string; occurrence?: number };
```

## Unsupported SDK Behavior

If the RemNote SDK cannot apply a style safely:

```text
return SDK_UNSUPPORTED
```

Do not fake success.

Do not create text child Rems to represent style.

## Tests

Add tests proving:

1. Canonical style shape normalizes legacy aliases.
2. Internal code uses canonical style fields.
3. Heading style does not create child Rems.
4. `Size`, `H1`, `H2`, `H3`, `normal` pollution is detected.
5. Font color and highlight remain separate.
6. Span font color and span highlight remain separate.

## Acceptance Criteria

1. No style operation writes style labels as Rem children.
2. Style schema is consistent across high-level tools.
3. Unsupported operations fail cleanly.

---

# Goal 8 — Fix Health Check and Diagnostics

## Problem

Health check reported:

```text
NO_PAIRED_PLUGIN_SESSION
```

even when direct MCP calls worked against the local RemNote plugin.

## Required Modes

Health check must distinguish:

```text
local_direct
hosted_paired
no_plugin
hosted_missing_pairing
```

## Requirements

1. Local direct bridge health-check must use the active WebSocket plugin connection.
2. Local direct bridge health-check must not require hosted pairing.
3. Hosted health-check must use paired session routing.
4. Hosted missing pairing must return a clear hosted-specific error.
5. No fake success.
6. A tool passes only if it actually succeeds.
7. Write health checks must use:
   - dry-run, or
   - disposable sandbox Rems, or
   - explicit user-provided parent Rem.
8. Destructive checks must never perform real delete unless explicitly requested in a controlled test.

## Diagnostics Must Report

```text
deploymentMode
pluginConnectionStatus
hostedPairingStatus
activeToolProfile
publicToolCount
registeredToolCount
runtimeVerifiedTools
runtimeUnverifiedTools
lastHealthCheckResult
lastSuccessfulPluginTool
lastFailedPluginTool
```

## Acceptance Criteria

1. Local/direct connected plugin does not produce `NO_PAIRED_PLUGIN_SESSION`.
2. Hosted/no-pairing reports hosted-specific missing pairing.
3. Diagnostics are honest about unverified tools.
4. Health-check does not pollute RemNote with test Rems unless explicitly using sandbox mode.

---

# Goal 9 — Harden Security

## Purpose

The hosted bridge must not expose unsafe write or debug behavior.

## Permission Rules

### Access Scope

Use scope hierarchy:

```text
focused-rem-only < current-rem-tree < full-kb
```

Tools must declare required scope.

### Trusted Write

If a tool has:

```text
requiresTrustedWrite: true
```

then hosted execution requires one of:

```text
trustedWriteMode: "trusted-inside-scope"
```

or

```text
plugin approval flow
```

Do not silently execute trusted writes without trusted mode or approval.

### Destructive Tools

If a tool is destructive:

1. Require `bridge:delete`.
2. Require explicit guard fields.
3. Require plugin approval.
4. Default dry-run must be true.
5. Real delete must be visibly intentional.

### Local Mode

Local mode may rely on plugin approval, but the server should still classify destructive tools and prevent accidental silent deletion.


## Public MCP Discovery Rule

Hosted discovery may be unauthenticated only if it returns a safe tool list and OAuth metadata required by ChatGPT. It must not reveal:

```text
recent requests
runtime diagnostics
pairing sessions
debug internals
dangerous tools hidden by profile
storage details
server cwd/pid
```

If tool discovery includes tools that require scopes, each tool must include accurate `securitySchemes` metadata.

## Admin Authentication Rule

Protected diagnostics/dashboard routes must require one of:

```text
admin session
ADMIN_DEBUG_SECRET
explicit local-only mode
```

In hosted mode, admin/debug routes must not rely only on obscurity.


## Dashboard and Diagnostic Route Safety

Hosted mode must not expose sensitive runtime details publicly.

### Public Routes

Allowed public info:

```text
ok
service name
deployment mode
health status
public base URL if safe
tool registry version
minimal uptime if needed
```

### Protected Routes

Require admin session or admin secret:

```text
/dashboard
/diagnostics
/debug/status
pairing internals
recent requests
pid
cwd
storage details
token/session info
```

## Secrets

Never log or return:

```text
SESSION_SECRET
ADMIN_DEBUG_SECRET
DATABASE_URL
OAuth client secret
plugin session secret
access token
refresh token
pairing code
authorization code
```

## Render Configuration

Fix `render.yaml`.

If deployment mode is hosted, add:

```text
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
```

If hosted pairing is not ready, change deployment mode to local or personal-hosted token mode intentionally.

## Acceptance Criteria

1. Trusted write mode is enforced.
2. Destructive tools require delete scope and approval.
3. Hosted dashboard/debug routes are protected.
4. Secrets are redacted from diagnostics/logs.
5. Render config matches config validation.

---

# Goal 10 — Improve Hosted/Local Architecture

## Target Runtime Architecture

```text
ChatGPT MCP Client
        |
        v
Hosted/Local MCP Server
        |
        |-- Auth and permission checks
        |-- Tool registry/profile filtering
        |-- Health and diagnostics
        |-- Request routing
        |
        v
BridgeHub
        |
        v
RemNote Plugin WebSocket Client
        |
        v
RemNote SDK Access Layer
        |
        v
RemNote Workspace
```

## Server Responsibilities

The server should handle:

```text
MCP protocol
HTTP routes
OAuth/local token auth
pairing/session routing
rate limiting
CORS/host checks
tool permissions
registry summaries
request timeouts
audit logging
```

The server must not handle:

```text
RemNote SDK calls
RemNote rich text mutation internals
plugin UI rendering
DOM access
```

## Plugin Responsibilities

The plugin should handle:

```text
RemNote SDK reads
RemNote SDK writes
approval prompts
permission scope enforcement inside RemNote
rich text formatting
tree creation
Markdown import execution
```

The plugin must not handle:

```text
OAuth token issuance
hosted session storage
MCP HTTP transport
server routing
database persistence
```

## Shared Layer Responsibilities

The shared layer should handle:

```text
protocol types
tool names
pure schemas
Markdown parsing
style normalization
tree validation
source fidelity planning
```

The shared layer must not import:

```text
@remnote/plugin-sdk
React
Node HTTP server modules
database drivers
```

## Acceptance Criteria

1. Boundaries are visible from directory structure.
2. Each layer has a clear responsibility.
3. Cross-layer imports are intentional and tested.
4. Future developers can understand the system from `ARCHITECTURE.md`.

---

# Goal 11 — Improve Documentation and Developer Onboarding

## Required Docs

Update:

```text
README.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
DEPLOY_RENDER.md
Agents.md
```

Create or update:

```text
docs/audits/audit-turn-1-readonly.md
docs/audits/audit-turn-2-post-repair.md
docs/development/local-setup.md
docs/development/server-plugin-boundary.md
docs/development/tool-registry.md
docs/development/markdown-importer.md
docs/deployment/render.md
docs/security/permissions.md
```

## Documentation Rules

1. Docs must describe actual behavior, not planned behavior.
2. Tool counts must be generated or verified against source.
3. Unsupported tools must be clearly marked.
4. Local mode and hosted mode must be explained separately.
5. Do not keep stale “phase” docs unless they remain useful.
6. Include troubleshooting for:
   - deployment build failure
   - `NO_PAIRED_PLUGIN_SESSION`
   - plugin not connected
   - insufficient scope
   - trusted write not approved
   - Markdown import partial failure

## Acceptance Criteria

1. New developer can understand architecture in under 15 minutes.
2. Deployment instructions are accurate.
3. Troubleshooting docs match real error codes.
4. Docs do not claim untested tools are verified.

---

# Goal 12 — Testing and Quality Gates

## Required Commands

Make these commands exist and pass from repo root:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run server:test:tool-profile
npm run server:test:health-check-routing
npm run server:test:structured-depth
npm run server:test:style-schema
npm run server:test:markdown-importer
npm run server:test:source-fidelity
npm run server:test:performance
npm run server:test:security
npm run server:test:boundaries
```

## Server-Only Build Test

This must pass separately:

```bash
cd server
npm install
npm run build
```

This must work without root `node_modules` and without `@remnote/plugin-sdk` installed in `server`.

## Required Test Areas

### Build Boundary

Test that server build does not compile or import plugin SDK files.

### Tool Registry

Test that registry, metadata, protocol, map, and docs stay consistent.

### Markdown Importer

Test:

```text
H1 root
8 H3 sections
blank spacers
paragraphs
nested bullets
numbered lists
inline math
block math
code block
table
formula-heavy section
source order
source fidelity
pollution Rem detection
```

### Structured Depth

Test realistic 5-level notes and unsafe extreme trees.

### Style Schema

Test canonical style and legacy alias normalization.

### Health Check

Test local direct and hosted paired behavior separately.

### Boundaries

Test:

```text
server does not import plugin SDK
shared does not import plugin SDK
plugin does not import server internals
server dist does not contain plugin runtime files
```

### Security

Test:

```text
missing token
expired token
wrong audience
insufficient scope
missing trusted write
destructive tool without delete scope
hosted diagnostics without admin auth
```

### Performance

Test parser and dry-run plan generation without live RemNote.

## Acceptance Criteria

1. All required scripts exist.
2. All required scripts pass.
3. Tests do not require live RemNote unless clearly named as live tests.
4. Live tests are optional and documented separately.

---

# Goal 13 — Manual Golden Test

After automated tests pass, perform the manual golden test if live RemNote bridge access is available.

## Setup

Focus this Rem:

```text
Plugin Test
```

## Tool Call

Use:

```text
create_or_replace_note_from_markdown
```

## Sample Note Must Include

```text
1 H1 title
at least 8 H3 sections
blank spacers between sections
multiple paragraphs per section
nested bullets
numbered list
inline math
block math
code block
table
formula-heavy section
```

## Expected Result

```text
one MCP write call
one approval
H1 root
H3 section headings
empty spacer Rems between major sections
all paragraphs preserved
all formulas preserved
all bullets preserved
code block preserved
table preserved as plain text if needed
no Size/H1/H2/H3/normal pollution Rems
verification passed
rootRemId returned
createdRemIds returned
```

## If Live RemNote Is Not Available

Do not fake the result.

Report:

```text
Live RemNote manual test not run because live plugin access was unavailable.
Automated dry-run/parser tests passed.
Manual test remains required before production release.
```

---


# Goal 14 — Deployment, CI, and Dependency Reliability

## Purpose

Make deployment predictable and prevent dependency-boundary regressions.

## Requirements

1. Decide whether root and server use separate lockfiles or a workspace. Document it.
2. Prefer deterministic installs:
   - `npm ci` when lockfiles exist
   - otherwise document why `npm install` is used
3. Ensure TypeScript build has dev dependencies available in Render.
4. Add `engines.node` if Render/Node version matters.
5. Ensure `server/start` path matches emitted build output.
6. Ensure `render.yaml` rootDir/build/start settings match the actual package layout.
7. Ensure hosted env vars satisfy `validateConfig`.
8. Document required Render environment variables in `docs/deployment/render.md`.

## Acceptance Criteria

1. Render build command is correct.
2. Render start command is correct.
3. Hosted config does not fail validation from missing flags.
4. Server build is reproducible from a clean checkout.
5. Deployment failure troubleshooting is documented.

---

# Goal 15 — Error Taxonomy, Observability, and Recovery

## Purpose

Make failures understandable and recoverable instead of vague.

## Required Error Taxonomy

Standardize errors across server/plugin/shared:

```text
INVALID_ARGS
PERMISSION_DENIED
INSUFFICIENT_SCOPE
TRUSTED_WRITE_REQUIRED
PLUGIN_NOT_CONNECTED
HOSTED_SESSION_MISSING
NO_PAIRED_PLUGIN_SESSION
SDK_UNSUPPORTED
SDK_ERROR
TIMEOUT
PARTIAL_FAILURE
ROLLBACK_FAILED
SOURCE_FIDELITY_FAILED
TOOL_UNSUPPORTED
TOOL_HIDDEN_BY_PROFILE
```

## Requirements

1. Errors must include:
   - code
   - user-safe message
   - internal details only in protected diagnostics
   - recovery suggestion where useful
2. Long writes must report partial state.
3. Diagnostics must not overclaim runtime verification.
4. Add a recent-request ring buffer with redacted args.
5. Add optional request IDs to correlate server route request, MCP tool call, and plugin WebSocket request.

## Acceptance Criteria

1. Common failures are easy to diagnose.
2. No secrets appear in error details.
3. Partial failures are actionable.
4. Health check and importer errors use the standard taxonomy.

---

# Goal 16 — Release Discipline and Branch Hygiene

## Purpose

Prevent giant unstable patches from becoming the normal workflow.

## Requirements

1. Keep the stabilization branch focused.
2. Do not mix unrelated hosted OAuth redesign, plugin UI redesign, and Markdown importer rewrites unless required by the architecture boundary.
3. Commit in logical chunks:
   - build boundary
   - shared layer migration
   - registry cleanup
   - write module split
   - importer tests
   - security hardening
   - docs
4. Each chunk should build before moving to the next when practical.
5. If a task is too large, leave a clearly documented follow-up instead of half-implementing it.

## Acceptance Criteria

1. Final report groups changes by goal.
2. Remaining limitations are explicit.
3. No speculative docs claim unfinished features are complete.

---

# Final Acceptance Criteria

The project is fixed only when all conditions below are true.

## Build

1. Root plugin build passes.
2. Server build passes.
3. Server build does not compile plugin SDK code.
4. Render config matches deployment mode.
5. Hosted startup config validation passes.

## Architecture

1. Shared/server/plugin boundaries are clean.
2. God files are split.
3. Empty/placeholder files are removed.
4. Unsupported tools are hidden or removed.
5. Docs reflect actual implementation.

## Tooling

1. Tool registry has one source of truth.
2. Tool profile output is consistent.
3. Dangerous legacy delete tools are absent.
4. `delete_rem_by_id` is guarded and dry-run by default.
5. `create_or_replace_note_from_markdown` is preferred for long notes.

## Markdown Import

1. Long Markdown import works in one MCP call.
2. Source fidelity is enforced.
3. Verification detects missing content.
4. Partial failures are clearly reported.
5. No styling pollution Rems are created.

## Security

1. Hosted auth validates tokens, scopes, audience, and expiration.
2. Trusted write mode is enforced.
3. Destructive tools require delete scope and approval.
4. Dashboard/debug details are protected.
5. Secrets are redacted.

## Testing

1. All required commands pass.
2. Audit Turn 1 report exists.
3. Audit Turn 2 report exists.
4. Test output is documented.
5. Remaining limitations are honest and specific.

---

# Final Output Required From Codex

When finished, provide a clear report with:

1. Current branch and commit.
2. Summary of Audit Turn 1 findings.
3. Summary of implementation changes.
4. Exact files changed.
5. Exact files removed.
6. New architecture/module structure.
7. Build commands run and results.
8. Test commands run and results.
9. Security fixes completed.
10. Markdown importer verification result.
11. Tool registry/tool profile result.
12. Health-check routing result.
13. Manual golden test result or reason it was not run.
14. Remaining limitations.
15. Boundary test result.
16. Deployment config verification.
17. Final deployment verdict:

```text
READY_TO_DEPLOY
```

or

```text
NOT_READY_TO_DEPLOY
```

Do not mark ready unless build, tests, security, and architecture checks all pass.