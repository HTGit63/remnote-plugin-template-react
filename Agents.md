# Agents.md — RemnoteMCP User-Grade Rebuild Plan

## 0. Mission

This repository is the **RemnoteMCP** project.

The goal is to build a user-grade RemNote MCP bridge that lets ChatGPT/Vivy create, edit, verify, repair, and style RemNote notes and flashcards safely, quickly, and beautifully.

The product target is **public RemNote users**, not only local development.

The bridge must feel like a real RemNote study productivity plugin, not a developer console.

Core product promise:

```text
User gives ChatGPT content, a document, or a note-writing instruction.
RemnoteMCP creates clean RemNote-native notes/cards quickly.
The structure is correct, math is real RemNote math, headings/styles are correct, flashcards are usable, and dangerous edits require clear approval.
```

The plugin must not become a fake AI chatbot inside RemNote. ChatGPT/Vivy is the reasoning layer. The RemNote plugin is the SDK access layer. The bridge/server is the secure MCP transport and authorization layer.

---

## 0.1 Official RemNote Plugin Documentation Sources

Agents must use these official docs while working on this project.

Primary docs:

```text
https://plugins.remnote.com/
https://plugins.remnote.com/CHANGELOG
https://plugins.remnote.com/advanced/permissions
https://plugins.remnote.com/advanced/widgets
https://plugins.remnote.com/advanced/manifest
https://plugins.remnote.com/advanced/settings
https://plugins.remnote.com/advanced/storage
https://plugins.remnote.com/advanced/rich-text
https://plugins.remnote.com/advanced/tables
https://plugins.remnote.com/advanced/submitting-plugins
```

API reference areas to check before implementing SDK features:

```text
AppNamespace
RemNamespace
RichTextNamespace
QueueNamespace
ReaderNamespace
WidgetLocation
PluginCommandMenuLocation
SelectionType
```

Important docs-derived guidance:

```text
RemNote plugins are designed around security-first permission scopes and levels.
Sandboxed plugins are strongly preferred for public users.
Widgets should be used to create polished UI surfaces.
Manifest metadata matters for marketplace readiness.
Recent SDK versions add transactions, better markdown tree creation, tables, reader APIs, initial sync readiness, and widget/menu improvements.
```

Do not rely only on old SDK assumptions. Check the changelog before using or rejecting an API.

---

## 0.2 Current Repo Reality From Second-Pass Audit

The current repo still shows several prototype-era traits that must be fixed before public user release.

Observed current state:

```text
Root package still pins @remnote/plugin-sdk at 0.0.14.
The plugin manifest still says "RemNote ChatGPT Bridge", not "RemnoteMCP".
The manifest requests broad All + ReadCreateModifyDelete permission.
The manifest does not yet include public-release polish such as projectUrl, supportUrl, changelogUrl, or proper final branding.
The server registry exposes many tools as public, but the registry metadata is too shallow.
Tool metadata currently lacks category, risk level, operation tier, tool access tier, SDK capability, and live verification state.
The permission system still mixes write mode, scope, and danger behavior.
The default permission scope is focused_rem_only, but user-grade note writing should onboard users into a clear default such as Focused Rem + descendants.
The current bridge status widget is large and debug-heavy rather than a simple public-user UX.
The server has good early security controls, but hosted/public auth is intentionally not production-ready.
```

Key files agents should inspect before changing behavior:

```text
package.json
public/manifest.json
src/widgets/bridge-status.tsx
src/widgets/index.tsx
src/bridge/protocol.ts
src/bridge/client.ts
src/bridge/handlers.ts
src/remnote/permissions.ts
src/remnote/read.ts
src/remnote/write.ts
src/remnote/richTextFormatting.ts
src/remnote/serialize.ts
server/src/app.ts
server/src/config.ts
server/src/bridge-hub.ts
server/src/mcp-server.ts
server/src/tool-registry.ts
server/src/health-check.ts
server/src/smoke.ts
server/src/live-test.ts
README.md
SAFETY.md
ARCHITECTURE.md
NEXT_STEPS.md
```

---

## 1. Product Decisions Already Made

These decisions are fixed unless the project owner explicitly changes them.

### 1.1 Product name

```text
RemnoteMCP
```

Use this name in UI, docs, manifest metadata, diagnostics, and future branding.

Do not keep user-facing text as "RemNote ChatGPT Bridge" after the branding goal is reached.

### 1.2 First production target

```text
Public RemNote users
```

This means security, onboarding, setup UX, safe defaults, diagnostics, documentation, marketplace metadata, and support flow must be treated seriously.

### 1.3 Primary workflow priority

```text
Notes first, flashcards second.
```

Do not neglect flashcards. Many RemNote users care deeply about cards. But the first-class workflow is polished, structured, beautiful RemNote notes.

### 1.4 Default writing mode

The user should be asked once during onboarding:

```text
Which writing mode should RemnoteMCP use by default?
```

Recommended default:

```text
Focused Rem + descendants
```

Explanation shown to user:

```text
RemnoteMCP will write inside the Rem you are focused on and inside the children it creates there. This is the safest normal mode for creating one note without giving broad workspace access.
```

The user can change this later from settings.

### 1.5 Performance target

The target for medium note creation is:

```text
Under 5 seconds when possible.
```

This is not optional. If note creation takes minutes, the user can do it manually. Speed is a product requirement.

If under 5 seconds is not technically possible in a given path, diagnostics must explain why and show which layer caused the delay.

### 1.6 Template storage

Design templates must be saved in:

```text
1. Plugin local settings or local plugin storage for fast local use.
2. Hosted account sync later for cross-device/template sync.
```

Do not depend only on RemNote-visible template Rems.

### 1.7 Repair behavior

Repairs are allowed only:

```text
After approval.
```

The agent may preview repairs first, but real repair must be approved.

### 1.8 Dangerous tools

Dangerous tools such as delete-by-id and replace must remain available, but they must be explicitly controlled.

Default behavior:

```text
Dangerous tools require user confirmation.
```

Danger Zone behavior:

```text
A user can enter Danger Zone and allow broader dangerous operations.
```

However, even in Danger Zone, ChatGPT must be warned through tool descriptions and diagnostics that these tools are dangerous and must not be used casually or wildly.

### 1.9 No fake production security

Do not pretend hosted auth is ready.

Until real hosted auth/pairing exists:

```text
hosted mode must stay disabled or clearly marked experimental
local token mode must remain secure
no fake OAuth
no broad hosted access
```

### 1.10 Public-user onboarding is mandatory

A public user must not need to understand WebSocket ports, MCP internals, ngrok, bridge paths, raw diagnostics, or permission internals just to start.

---

## 2. Known Evidence and Failure Signals

The current plugin is usable but not user-grade.

Known benchmark/test problems:

```text
Large structured payloads are fragile.
Full one-shot structured writes can be blocked.
Some content had to be shortened.
append_to_rem dumps Markdown as text instead of creating clean Rem children.
set_rem_heading_level creates unwanted Size → H1/H3 child Rems.
delete_rem_by_id appeared in diagnostics but was not actually callable in one session.
create_or_replace_note_from_markdown repeatedly failed with PARTIAL_FAILURE.
Some formula-heavy rich updates were blocked.
The benchmarked 5.9 note run took about 727 seconds, which is far too slow.
```

Known positive signals:

```text
Many read tools work.
Many simple write and card tools work.
apply_structured_note_batch can work when payloads are reduced.
get_rem_rich can verify heading/color/style.
move_rem works when the required guard is supplied.
The server has useful security checks around local token, CORS, remote bind, and hosted mode blocking.
```

Critical interpretation:

```text
The bridge is not broken, but its workflow is not product-grade yet.
The next work must focus on foundation, correctness, speed, UX, and safety.
```

---

## 3. Non-Negotiable Engineering Rules

### 3.1 Do not build on the old SDK

The current old SDK foundation must be upgraded before major new feature work.

Do not add major new tools before:

```text
SDK upgrade passes
tool refactor passes
transactional write path exists
heading/style/math correctness is fixed
```

### 3.2 Do not fake tool success

Never report success if:

```text
the RemNote SDK operation failed
the tool was blocked
the tool was hidden
the tool was skipped
the tool only exists in the registry but was not callable
```

Diagnostics must distinguish:

```text
declared
registered
listed
callable
liveVerified
sdkUnsupported
hidden
blockedByTier
blockedByScope
gatewayBlocked
partialFailure
```

### 3.3 Do not silently damage user notes

Never silently:

```text
delete existing Rems
replace existing children
repair notes
move notes
rewrite user content
```

Existing-note mutation must require an explicit approved operation, unless the user has intentionally enabled the right trusted/danger setting.

### 3.4 Do not expose dangerous tools casually

Dangerous tools must be:

```text
hidden by default or clearly tier-gated
described as dangerous to ChatGPT
confirmed by the user
guarded by parent/ancestor/title checks where possible
logged in diagnostics
```

### 3.5 Speed matters

A medium note should target under 5 seconds.

Avoid workflows that require:

```text
dozens of sequential MCP calls
repeated approvals
manual fallback loops
unbounded verification calls
large fragile payloads without chunking
```

### 3.6 Notes must be RemNote-native

Generated notes must use real RemNote structure:

```text
headings as heading Rems
bullets as child Rems
formulas as inline/block math nodes
tables as RemNote tables where possible
cards as RemNote cards
spacer Rems only when intentionally requested by template/style
```

Do not dump Markdown syntax into one Rem if the user expects RemNote hierarchy.

### 3.7 Public user UX matters

The plugin UI must be understandable to a non-developer RemNote user.

Default view should not look like raw diagnostics.

Advanced/debug details must be hidden behind an advanced section.

### 3.8 Official docs must guide SDK work

Agents must check:

```text
https://plugins.remnote.com/
https://plugins.remnote.com/CHANGELOG
```

before assuming APIs are missing, deprecated, or unsupported.

### 3.9 Sandbox-first public release

For public users, prefer sandboxed plugin behavior. Only request native mode if it is absolutely required and well justified.

### 3.10 Minimum permission principle

The current broad permission manifest is acceptable only as a prototype baseline.

A public release must either:

```text
request the narrowest practical manifest scope
or clearly explain why broad scope is required
or dynamically request narrower runtime permissions where possible
```

---

## 4. Final 12-Goal Execution Roadmap

Follow the order below unless the project owner explicitly changes it.

The order is designed to reduce breakage and avoid building advanced workflows on broken foundations.

```text
1. SDK upgrade and official docs alignment
2. Existing tool refactor for new SDK
3. Tool truth / diagnostics / exposure cleanup
4. Transactional write engine
5. Markdown-to-Rem hierarchy pipeline
6. Heading/style/math correctness
7. Large payload resilience and speed
8. Tier and permission model
9. Tool division and registry cleanup
10. Sample-based design templates and storage/sync
11. Designed-note and flashcard high-level tools
12. UI / access / logo / auth / release polish
```

---

# Goal 1 — Upgrade the RemNote SDK Foundation and Align With Official Docs

## Purpose

Bring RemnoteMCP from old SDK behavior to the current RemNote plugin SDK so the bridge can use modern transactions, markdown tree creation, sync readiness, tables, reader APIs, and improved plugin UI APIs.

## 1.A — Upgrade SDK dependency

Tasks:

```text
Update @remnote/plugin-sdk from the old pinned version to the current stable version.
Pin the exact version first, not a broad caret range.
Regenerate package-lock.
Document the exact SDK version in README and diagnostics.
```

Acceptance:

```text
package.json uses current stable SDK
lockfile updated
no duplicate SDK versions
```

## 1.B — Fix breaking type/build errors

Tasks:

```text
Run npm run check-types.
Run npm run validate.
Run npm run build.
Run npm run server:build.
Fix all SDK breaking changes.
Pay special attention to registerPowerup and changed namespace APIs.
```

Acceptance:

```text
type check passes
plugin validate passes
plugin build passes
server build passes
```

## 1.C — Add SDK capability detection

Tasks:

```text
Create a capability detector for modern SDK APIs.
Detect plugin.app.transaction.
Detect plugin.app.waitForInitialSync.
Detect createSingleRemWithMarkdown.
Detect createTreeWithMarkdown.
Detect createTable.
Detect reader APIs where available.
Detect queue APIs where available.
Return SDK_UNSUPPORTED cleanly when an API is absent.
```

Acceptance:

```text
diagnostics reports supportedSdkCapabilities
diagnostics reports unsupportedSdkCapabilities
no tool guesses SDK support
```

## 1.D — Add sync readiness before bridge ready

Tasks:

```text
Call plugin.app.waitForInitialSync when available before reporting ready.
Expose initialSyncComplete in plugin status.
Do not block forever; add timeout and diagnostic warning.
```

Acceptance:

```text
bridge reports sync-ready status
plugin does not claim full readiness before initial sync
timeout produces clean diagnostic state
```

## 1.E — Add official-doc audit notes

Tasks:

```text
Add a docs/REMNOTE_SDK_NOTES.md file.
Summarize SDK APIs used by RemnoteMCP.
Link to the official plugin docs and changelog.
List APIs that must be tested live.
```

Acceptance:

```text
agents have a local SDK notes file with official docs links
future agents do not need to rediscover the same SDK facts
```

---

# Goal 2 — Refactor Existing Tools for the Modern SDK

## Purpose

Update current tools to use official SDK APIs instead of fragile old workarounds.

## 2.A — Refactor simple create tools

Tasks:

```text
Update create_rem to use createSingleRemWithMarkdown when appropriate.
Update create_document with modern SDK path.
Update simple create_rem_tree to use createTreeWithMarkdown when appropriate.
Keep compatibility fallback only if needed.
```

Acceptance:

```text
create_rem works with markdown
create_document works
create_rem_tree creates actual hierarchy for simple markdown trees
```

## 2.B — Keep advanced structured writing separate

Tasks:

```text
Do not replace apply_structured_note_batch with plain markdown.
Keep create_styled_rem_tree for rich/styled notes.
Use SDK markdown APIs only for simple unstyled or lightly styled paths.
```

Acceptance:

```text
simple markdown tool and advanced styled-note tool are separate
advanced notes still support headings, colors, math, spacers, cards, and verification
```

## 2.C — Add official table support wrapper

Tasks:

```text
Add internal wrapper for plugin.rem.createTable when supported.
Add table capability detection.
Add private test utilities for table creation.
Do not expose public table tools until live-tested.
```

Acceptance:

```text
table capability appears in diagnostics
unsupported table API returns SDK_UNSUPPORTED
```

## 2.D — Remove or hide fake/unsupported tools

Tasks:

```text
Audit create_folder and all SDK-limited tools.
Hide unsupported tools from normal users or mark them clearly unsupported.
Do not count unsupported tools as working.
```

Acceptance:

```text
diagnostics separates unsupported from working
tool list is honest
```

## 2.E — Refactor old command-style workarounds

Tasks:

```text
Audit apply_remnote_command.
Audit set_rem_heading_level.
Audit style tools that simulate RemNote commands.
Prefer direct SDK operations over command/powerup-style indirect operations.
Remove any path that creates unintended child Rems.
```

Acceptance:

```text
style operations do not create content pollution
indirect command tools are fallback-only
```

---

# Goal 3 — Fix Tool Truth, Exposure, and Diagnostics

## Purpose

Make diagnostics truthful and prevent confusion between registered tools and live-working tools.

## 3.A — Define tool state model

Every tool registry entry must include:

```text
name
description
category
declared
registered
listed
callable
liveVerified
sdkUnsupported
hidden
blockedByTier
blockedByScope
gatewayBlocked
lastSuccessAt
lastFailureAt
lastErrorCode
riskLevel
operationTier
toolAccessTier
scopeRequirement
sdkCapability
```

Acceptance:

```text
tool diagnostics can explain exactly why a tool is or is not usable
```

## 3.B — Fix registry/list/call mismatch

Tasks:

```text
Compare source registry to MCP tools/list.
Compare MCP tools/list to actual callable tools.
Report mismatches.
Do not mark registry-only tools as callable.
```

Acceptance:

```text
get_bridge_diagnostics does not overclaim
mcpListedTools and actualMcpCallableTools are separated
```

## 3.C — Fix delete_rem_by_id truth

Tasks:

```text
Make delete_rem_by_id Danger-tier public or explicitly hidden.
If exposed, make it callable.
If hidden, remove it from public tool claims.
Keep dryRun true by default.
Require parent/ancestor/title guard for real delete.
Require explicit confirmation for real delete.
```

Acceptance:

```text
delete_rem_by_id does not appear as usable unless it is actually callable
real delete requires guard and confirmation
```

## 3.D — Add live health history

Tasks:

```text
Track last success/failure by tool.
Track partial failures.
Track gateway blocks.
Track SDK_UNSUPPORTED.
Track tool tier blocks.
Track scope blocks.
Track average duration.
Track last benchmark run.
```

Acceptance:

```text
diagnostics gives recent and useful tool history
health check reports are actionable
```

## 3.E — Add public-user diagnostic summaries

Tasks:

```text
Create simple diagnostic summary for normal users.
Create full diagnostic bundle for developers.
Add one-click copy diagnostic bundle from UI.
Redact tokens, note bodies, and private payloads.
```

Acceptance:

```text
normal users can understand the problem
developers can debug without leaking note content
```

---

# Goal 4 — Build a Transactional Write Engine

## Purpose

Prevent partial note creation, blank Rems, unsafe replacement, and slow fallback-heavy writes.

## 4.A — Introduce write operation plans

Before writing, every complex note operation must generate a plan:

```text
operationId
idempotencyKey
target parent/root
nodes to create
nodes to update
nodes to delete
styles to apply
math blocks to create
cards to create
verification checks
rollback strategy
estimated payload size
estimated operation count
estimated time budget
```

Acceptance:

```text
dryRun returns a clear operation plan
real write executes the same plan
```

## 4.B — Wrap multi-step writes in SDK transactions

Apply transaction support to:

```text
apply_structured_note_batch
create_styled_rem_tree
create_polished_note_tree
create_or_replace_note_from_markdown
replace_children
update_root_and_replace_children
repair_note_design
create_designed_note_tree
```

Acceptance:

```text
multi-step writes are transactional when SDK supports it
failed transactions do not leave silent partial notes
```

## 4.C — Make replacement safe

Tasks:

```text
Do not delete existing children before replacement is verified.
Prefer create-new → verify → swap/replace.
Preserve old content on failure.
Report exactly what changed.
```

Acceptance:

```text
replace failure does not destroy existing note
partial failure includes recovery details
```

## 4.D — Improve idempotency

Tasks:

```text
Prevent duplicate notes on retry.
Use idempotencyKey for all complex writes.
Return already_applied when repeated.
Plan persistent idempotency for hosted mode.
```

Acceptance:

```text
same idempotencyKey does not create duplicate note
duplicate attempt returns previous result
```

## 4.E — Add write engine module boundaries

Tasks:

```text
Create src/remnote/write-engine/plan.ts.
Create src/remnote/write-engine/execute.ts.
Create src/remnote/write-engine/verify.ts.
Create src/remnote/write-engine/rollback.ts.
Create src/remnote/write-engine/types.ts.
Keep old write.ts as a thin compatibility layer or split it.
```

Acceptance:

```text
write engine code is testable and not buried in one giant file
```

---

# Goal 5 — Build Markdown-to-Rem Hierarchy Pipeline

## Purpose

Turn Markdown into clean RemNote-native hierarchy instead of dumping Markdown as visible text.

## 5.A — Build Markdown note parser

Support:

```text
# root title
### H3 section headings
nested bullets
ordered lists
blank spacer Rems
inline math
block math
tables
worked examples
flashcard markers only when requested
callouts/admonitions where useful
```

Acceptance:

```text
parser produces a structured intermediate tree
parser does not lose content
```

## 5.B — Convert parsed tree to RemNote nodes

Tasks:

```text
Each bullet becomes a child Rem.
Each section heading becomes heading Rem.
Each formula block becomes math block Rem.
Inline math becomes inline math rich-text span.
Body bullets nest under the correct section heading.
```

Acceptance:

```text
generated note is navigable as Rem hierarchy
no visible Markdown dash pollution
```

## 5.C — Add formula-safe splitting

Tasks:

```text
Do not split inside LaTeX blocks.
Do not escape formulas incorrectly.
Split long formula-heavy sections safely.
Validate common LaTeX delimiters before writing.
```

Acceptance:

```text
formula-heavy sections survive chunking
math is real RemNote math
```

## 5.D — Add public tools

Add tools:

```text
preview_markdown_note_tree
create_note_from_markdown_tree
append_markdown_as_rem_tree
```

Acceptance:

```text
preview does not write
create writes clean hierarchy
append writes clean hierarchy under existing Rem
```

## 5.E — Add Markdown import benchmarks

Tasks:

```text
Benchmark small Markdown note.
Benchmark 5.9-style nuclear physics note.
Benchmark formula-heavy note.
Benchmark note with tables and cards.
```

Acceptance:

```text
markdown pipeline has measurable performance and correctness results
```

---

# Goal 6 — Fix Heading, Style, Color, and Math Correctness

## Purpose

Fix visible note pollution and style problems.

## 6.A — Fix heading setter

Tasks:

```text
Inspect set_rem_heading_level implementation.
Remove any command/powerup path that creates Size → H1/H3 child Rems.
Use correct SDK heading/font-size API.
Add regression test that no children are created by style changes.
```

Acceptance:

```text
H1/H3 applied correctly
no Size child Rems are created
```

## 6.B — Fix text color and highlight separation

Tasks:

```text
Keep font color separate from highlight.
Keep span highlight separate from whole-Rem highlight.
Add verification for font color and highlight.
Avoid unsupported raw field hacks when SDK supports official path.
```

Acceptance:

```text
red H1 font works
blue H3 font works
highlight does not corrupt text color
```

## 6.C — Fix math insertion

Tasks:

```text
Inline math becomes inline math rich-text node.
Block math becomes separate math block Rem.
Escaped visible LaTeX is treated as a bug unless requested as literal text.
```

Acceptance:

```text
block formulas are real math Rems
inline formulas render as inline math
```

## 6.D — Add style verification and repair signals

Tasks:

```text
verify heading
verify color
verify highlight
verify bullet visibility
verify math type
detect pollution Rems
detect wrong nesting
detect broken formula text
```

Acceptance:

```text
verify_note_design catches heading pollution
repair_note_design can propose fixes
```

## 6.E — Add style regression suite

Tests:

```text
set H1 on existing Rem
set H3 on existing Rem
set red text color
set blue text color
set whole-rem highlight
set span highlight
insert inline math
insert block math
verify no children added by style tools
```

Acceptance:

```text
style regression tests run in smoke and live-test modes
```

---

# Goal 7 — Add Large-Payload Resilience and Under-5-Second Performance Path

## Purpose

Make note creation feel instant.

The target is:

```text
Under 5 seconds for medium notes when possible.
```

## 7.A — Define performance budgets

Budgets:

```text
planning: < 500 ms
single write execution: < 3000 ms
verification: < 1000 ms
total target: < 5000 ms
```

Acceptance:

```text
benchmarks report each phase
```

## 7.B — Reduce tool-call count

Tasks:

```text
Prefer one high-level write call.
Avoid sequential style calls.
Apply styles during creation, not after creation when possible.
Batch verification.
Avoid repeated get_rem_rich calls unless necessary.
```

Acceptance:

```text
medium note write uses one primary tool call
fallback path is rare
```

## 7.C — Add payload chunking only as fallback

Tasks:

```text
Attempt optimized one-shot plan first.
If payload exceeds safe limits, chunk by section.
Keep chunking automatic.
Report fallback reason.
Do not chunk inside math blocks or card syntax.
```

Acceptance:

```text
large notes do not randomly fail
chunking preserves hierarchy
```

## 7.D — Add benchmark suite

Benchmarks:

```text
small note
medium 5.9-style note
large formula-heavy note
flashcard set
table note
repair pass
template-based note
```

Acceptance:

```text
benchmark report includes total time, phase time, calls, fallbacks, failures
medium note target is <5 seconds or a clear blocker is reported
```

## 7.E — Add performance failure policy

Tasks:

```text
If target fails, report exact bottleneck.
Classify bottleneck as model payload, MCP transport, server, bridge WebSocket, RemNote SDK, verification, or approval wait.
Do not hide slow runs as success.
```

Acceptance:

```text
slow success is reported as success_with_performance_warning
```

---

# Goal 8 — Redesign Tiers, Permissions, and Tool Access

## Purpose

Separate operation permission, scope, and tool access.

## 8.A — Define operation permission tiers

Use:

```text
Read Only
Read + Create
Read + Create + Modify
Full Control With Delete Approval
Danger Zone
```

Acceptance:

```text
operation tier is separate from tool tier
```

## 8.B — Define scope tiers

Use:

```text
Focused Rem
Focused Rem + Descendants
Selected Rem
Selected Rem + Descendants
Approved Root
Workspace
```

Default onboarding should recommend:

```text
Focused Rem + Descendants
```

Acceptance:

```text
user can ask once and save default writing mode
default can be changed later
```

## 8.C — Define tool access tiers

Use:

```text
Basic
Note Writer
Power User
Developer
Danger
```

Suggested mapping:

```text
Basic: status/read
Note Writer: designed-note and markdown note tools
Power User: move/reorder/table/template tools
Developer: diagnostics/raw/debug
Danger: replace/delete/destructive repair
```

Acceptance:

```text
tool access tier controls visible/usable tools
```

## 8.D — Make tier changes live without reconnect

Tasks:

```text
Changing operation tier must not reconnect.
Changing scope tier must not reconnect.
Changing tool access tier must not reconnect.
Only server URL/token changes should reconnect.
Persist tier changes to plugin settings.
Use runtime refs/state for immediate behavior.
```

Acceptance:

```text
changing from trusted writes to danger zone applies instantly
changing from focused rem to workspace applies instantly
bridge connection remains alive
```

## 8.E — Warn user and ChatGPT about danger

Tasks:

```text
Danger Zone UI warning.
Danger tool descriptions warn ChatGPT.
Danger diagnostics flag active Danger Zone.
Danger actions still produce audit records.
Require explicit user action to enter Danger Zone.
Allow user to exit Danger Zone easily.
```

Acceptance:

```text
Danger Zone is explicit and hard to enter accidentally
ChatGPT sees danger metadata before tool use
```

## 8.F — Align with RemNote manifest permissions

Tasks:

```text
Map internal operation tiers to RemNote Permission Levels.
Map internal scopes to RemNote Permission Scopes.
Investigate dynamic DescendantsOfId permission request flow.
Document why any broad All scope remains necessary.
```

Acceptance:

```text
internal tiers do not contradict RemNote's permission model
public release has a minimal-permission story
```

---

# Goal 9 — Simplify Architecture and Tool Registry

## Purpose

Make the codebase maintainable for agents and humans.

## 9.A — Split server modules

Target structure:

```text
server/src/app
server/src/auth
server/src/bridge
server/src/tools
server/src/security
server/src/config
server/src/diagnostics
server/src/performance
```

Acceptance:

```text
server files are smaller and purpose-specific
```

## 9.B — Split plugin modules

Target structure:

```text
src/bridge
src/remnote/read
src/remnote/write
src/remnote/style
src/remnote/templates
src/remnote/cards
src/remnote/tables
src/remnote/permissions
src/remnote/capabilities
src/widgets/bridge-panel
```

Acceptance:

```text
UI code is not mixed with SDK operations
```

## 9.C — Rebuild tool registry

Every tool entry must include:

```text
category
operationTier
scopeRequirement
toolAccessTier
riskLevel
sdkCapability
isPublic
isDebug
isDangerous
liveVerificationRequired
performanceBudgetMs
userFacingName
agentWarning
```

Acceptance:

```text
registry is the source of truth
MCP registration derives from registry
diagnostics derives from registry
```

## 9.D — Clean tool categories

Categories:

```text
system
read
simple_write
markdown_note
structured_note
design_template
study_card
table
repair
debug
danger
```

Acceptance:

```text
tools are organized by user workflow and risk
```

## 9.E — Add documentation generation from registry

Tasks:

```text
Generate TOOL_REFERENCE.md from registry.
Generate user-facing tool tier summary.
Generate developer diagnostics reference.
```

Acceptance:

```text
docs match actual tool registry
agents do not manually maintain duplicate tool lists
```

---

# Goal 10 — Build Sample-Based Design Templates and Storage/Sync

## Purpose

Let users save a sample RemNote design and reuse it.

## 10.A — Analyze focused sample note

Tool:

```text
analyze_note_design
```

Extract:

```text
heading pattern
color pattern
spacing pattern
math pattern
bullet nesting
formula placement
table style
card style
worked example style
```

Acceptance:

```text
sample note analysis returns reusable design rules
```

## 10.B — Save templates locally

Tool:

```text
save_note_design_template
```

Storage:

```text
plugin local settings or local plugin storage
```

Acceptance:

```text
template persists locally
template can be listed
```

## 10.C — Prepare hosted template sync

Tasks:

```text
Define hosted template schema.
Define user/account/template ownership.
Define conflict behavior.
Define last-write-wins or versioned sync.
Do not implement insecure sync.
Add placeholder interfaces only.
```

Acceptance:

```text
hosted sync design exists
local templates work now
```

## 10.D — Preview template application

Tool:

```text
preview_note_design_plan
```

Acceptance:

```text
preview shows changes before writing
```

## 10.E — Add template import/export

Tasks:

```text
Export template JSON.
Import template JSON.
Validate template schema.
Reject templates with unsafe operation rules.
```

Acceptance:

```text
users can back up and share safe design templates
```

---

# Goal 11 — Create High-Level Designed-Note and Flashcard Tools

## Purpose

Give ChatGPT a small set of high-level user-grade tools instead of many fragile low-level calls.

## 11.A — Create designed note

Tool:

```text
create_designed_note_tree
```

Input:

```text
parentId
title
content
templateId
writingMode
verifyAfterWrite
performanceTargetMs
```

Acceptance:

```text
one tool creates polished note
```

## 11.B — Update designed note

Tool:

```text
update_note_with_design
```

Supports:

```text
append sections
replace children after approval
repair structure after approval
convert markdown pollution
convert formulas
```

Acceptance:

```text
existing note repair/update requires approval
```

## 11.C — Verify designed note

Tool:

```text
verify_note_against_design
```

Acceptance:

```text
verification catches missing headings, wrong color, wrong nesting, wrong math, pollution Rems
```

## 11.D — Repair designed note after approval

Tool:

```text
repair_note_design
```

Acceptance:

```text
repair plan shown
approval required
repair executes safely
```

## 11.E — Support flashcards without neglecting notes

Tools/workflows:

```text
create_card_set_from_note
create_flashcards_from_markdown
create_cloze_cards_from_note
verify_card_set
repair_card_set
```

Acceptance:

```text
notes remain primary workflow
flashcards are available and clean
```

## 11.F — Add queue-aware card helpers later

Tasks:

```text
Use queue APIs only after SDK upgrade and live verification.
Support reviewing current card context only if user asks.
Do not interfere with RemNote's scheduler.
```

Acceptance:

```text
card helpers respect RemNote study workflow
```

---

# Goal 12 — Build User-Grade UI, Access, Logo, Auth Plan, and Release Path

## Purpose

Turn the bridge into a public-user-ready RemNote plugin.

## 12.A — Rebuild plugin UI

Default UI:

```text
connection status
setup wizard
writing mode
focused Rem / approved root
template selector
pending approval
last result
health check button
```

Advanced UI:

```text
diagnostics
tool health
tool tier
copy debug bundle
server status
raw registry
```

Acceptance:

```text
new user understands setup in 30 seconds
debug clutter is hidden by default
```

## 12.B — Add easy access commands

Commands:

```text
Open RemnoteMCP
Run RemnoteMCP Health Check
Save Focused Note as Design Template
Use Focused Rem as Approved Root
Copy MCP URL
Copy Diagnostics
Open RemnoteMCP Settings
```

Acceptance:

```text
bridge can be opened and controlled from RemNote UI
```

## 12.C — Replace logo and branding

Tasks:

```text
Replace socket logo.
Create RemnoteMCP icon.
Update manifest name/description.
Add support/changelog/project URLs before release.
Use logo in widget/sidebar.
```

Acceptance:

```text
plugin branding looks user-grade
```

## 12.D — Plan secure public-user auth

Current:

```text
local token mode
```

Future:

```text
hosted account
device pairing
scoped session token
template sync
revocation UI
audit log
no note-body logging
```

Acceptance:

```text
hosted mode is not faked
auth plan exists
local token mode remains secure
```

## 12.E — Public release checklist

Checklist:

```text
privacy policy
support link
setup docs
security notes
sandbox health check
5-second benchmark attempt
known limitations
RemNote marketplace metadata
logo/icon
public docs
unlisted beta release plan
rollback plan
```

Acceptance:

```text
project has a release-readiness checklist
```

## 12.F — Update manifest for public readiness

Tasks:

```text
Change name to RemnoteMCP when branding assets are ready.
Update description under 200 characters.
Set author correctly.
Add projectUrl.
Add supportUrl.
Add changelogUrl.
Review requestNative.
Review requiredScopes.
Review enableOnMobile honestly.
```

Acceptance:

```text
manifest is ready for review or unlisted beta
```

---

## 5. Extra Gaps Added in This Second-Pass Revision

The previous roadmap was useful, but these gaps are now explicit requirements.

### Gap A — Official RemNote docs link for agents

Agents now have direct docs links at the top of this file.

### Gap B — Manifest and marketplace readiness

The previous plan mentioned logo and branding, but did not specify manifest fields and public release checks clearly enough.

Now included:

```text
projectUrl
supportUrl
changelogUrl
description length
author
requestNative review
permission scope review
unlisted beta plan
```

### Gap C — SDK docs notes file

Agents must create a local `docs/REMNOTE_SDK_NOTES.md` after SDK upgrade so future work does not rediscover the same changelog facts.

### Gap D — Capability detection beyond the first few APIs

Now includes:

```text
transaction
waitForInitialSync
markdown tree creation
table APIs
reader APIs
queue APIs
```

### Gap E — Dynamic permission and manifest alignment

The roadmap now requires mapping internal tiers to RemNote Permission Levels and Permission Scopes.

### Gap F — Tool registry documentation generation

The registry must become source of truth for docs and diagnostics.

### Gap G — Style regression tests

Heading/color/math bugs must have regression tests, not only manual fixes.

### Gap H — Template import/export

Public users need a way to back up and share safe design templates.

### Gap I — Queue-aware flashcard helpers

Flashcards are still secondary, but RemNote users care about studying. Queue-aware helpers are planned after SDK upgrade.

### Gap J — Performance failure policy

Slow success must be reported as `success_with_performance_warning`, not treated as clean success.

### Gap K — Public-user diagnostic summaries

Normal users need simple diagnostics; developers need redacted debug bundles.

### Gap L — Module boundaries for the write engine

The old `write.ts` is too large. The write engine must be split into plan, execute, verify, rollback, and types.

---

## 6. Recommended Codex Goal Prompts

### First Codex goal

```text
Read Agents.md fully and complete Goal 1 only. Upgrade @remnote/plugin-sdk to the current stable version, fix all resulting type/build/validation errors, add SDK capability diagnostics including sdkVersion and initialSyncComplete, call waitForInitialSync when available before bridge readiness, and create docs/REMNOTE_SDK_NOTES.md with links to https://plugins.remnote.com/ and https://plugins.remnote.com/CHANGELOG. Do not add new product tools, do not redesign UI, and do not change dangerous-tool behavior in this pass.
```

### Second Codex goal

```text
Read Agents.md fully and complete Goal 2 only. Refactor existing RemNote tools to use the modern SDK where appropriate, especially simple markdown creation and tree creation. Preserve the advanced structured writer. Add SDK_UNSUPPORTED capability checks for unsupported APIs and update diagnostics so tools never claim success unless the SDK operation actually succeeded.
```

### Third Codex goal

```text
Read Agents.md fully and complete Goal 3 only. Fix tool truth, exposure, and diagnostics so declared, registered, listed, callable, liveVerified, hidden, blockedByTier, blockedByScope, sdkUnsupported, and gatewayBlocked states are separate. Resolve the delete_rem_by_id mismatch so it is either callable under the correct tier or honestly hidden.
```

### Fourth Codex goal

```text
Read Agents.md fully and complete Goal 4 only. Build a transactional write engine with dry-run operation plans, transaction-backed execution when supported by the SDK, safe replacement behavior, partial failure reporting, idempotency, and clear write-engine module boundaries. Do not redesign the UI in this pass.
```

### Fifth Codex goal

```text
Read Agents.md fully and complete Goal 5 only. Build a Markdown-to-Rem hierarchy pipeline so markdown headings, bullets, formulas, tables, and worked examples become clean RemNote-native structure instead of visible markdown text. Include preview and create tools, but preserve existing simple append tools.
```

### Sixth Codex goal

```text
Read Agents.md fully and complete Goal 6 only. Fix heading/style/color/math correctness, especially the set_rem_heading_level Size → H1/H3 pollution bug. Add regression tests proving style changes do not create child Rems and that red H1, blue H3, inline math, and block math verify correctly.
```

### Seventh Codex goal

```text
Read Agents.md fully and complete Goal 7 only. Add performance budgets, benchmark suite, payload chunking fallback, and a success_with_performance_warning result state. Target under 5 seconds for medium notes and report bottlenecks by layer when the target is missed.
```

### Eighth Codex goal

```text
Read Agents.md fully and complete Goal 8 only. Redesign operation permission tiers, scope tiers, and tool access tiers. Make tier changes live without reconnecting unless server URL or token changes. Align the model with RemNote manifest Permission Levels and Scopes, and add clear Danger Zone warnings for both user and ChatGPT.
```

---

## 7. What Agents Must Not Do

Do not:

```text
skip SDK upgrade
add random new tools before fixing core write path
claim all tools work because they are listed
remove safety approval
enable hosted mode without real auth
let Danger Zone become default
hide partial failures
delete or replace user notes silently
create note designs by dumping raw Markdown into one Rem
ship UI that looks like a debug console
forget flashcards entirely
ignore the under-5-second performance target
ignore official RemNote plugin docs
leave manifest as prototype branding for public release
keep tool registry metadata shallow
```

---

## 8. Definition of User-Grade

RemnoteMCP is user-grade only when all of these are true:

```text
A public RemNote user can install and understand it.
The setup wizard explains writing mode clearly.
The default writing mode is safe and useful.
Medium note creation targets under 5 seconds.
Generated notes are clean RemNote-native hierarchy.
Math renders as RemNote math.
Headings/styles do not pollute the note.
Design templates can be saved and reused.
Flashcards are supported enough for real users.
Diagnostics are truthful.
Dangerous tools require clear confirmation.
The UI is clean and not a developer dump.
Auth/security plan is honest and not fake.
The manifest is public-release ready.
Official RemNote plugin docs are linked and followed.
```

---

## 9. Final Public-Readiness Gate

Do not call RemnoteMCP public-ready until all of these pass:

```text
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
style regression live test
markdown hierarchy live test
designed note benchmark
flashcard set benchmark
danger tool dry-run/guard test
diagnostics redaction test
manifest review
security review
privacy review
setup wizard review
```

The release can still happen as an unlisted beta before full public listing, but the UI must say beta clearly.