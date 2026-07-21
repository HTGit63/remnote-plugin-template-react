# RemNote MCP — OpenAI Build Week Stages 1–7 Engineering Record

## Final verdict

Stages 1–7 are **100% complete** for the released product. The completion claim
combines repository inspection, focused TDD, broad automated regression,
exact-commit CI, hosted identity, connected-plugin behavior, live RemNote
mutation/readback, idempotency and recovery proof, and human confirmation of
media rendering and playback. No single layer is presented as proof of all the
others.

| Final stage | Completion | Decisive evidence |
| --- | ---: | --- |
| 1 — existing reliability and release defects | 100% | state, fidelity, verifier, reconnect, metadata, and Test 14 repairs plus exact-release reruns |
| 2 — media design | 100% | completed URL-only contracts, capability model, security boundary, idempotency model, and implementation plan before production code |
| 3 — media implementation | 100% | three public tools, strict validation, dedicated placement, readback, compensation, and RED/GREEN coverage |
| 4 — regression and architecture | 100% | full suites, security/profile/routing/import/performance gates, dependency audits, CI, and a narrow asset-loader hardening change |
| 5 — plugin user experience | 100% | complete state/control exercise, accessibility checks, restored selector activation, and later native connected-panel evidence |
| 6 — exact-release RemNote proof | 100% | read/write/readback, guarded mutation, recovery, two Test 14 runs, and human-confirmed image/audio/YouTube/MP4 behavior |
| 7 — release engineering | 100% | public source, immutable tags, verified ZIPs, clean artifact branches, exact-main CI, and judge instructions |

## Scope and method

OpenAI Build Week submissions opened on July 13, 2026 at 16:00 UTC. This audit
reviews the Git history after that exact cutoff across the six retained branch
tips requested for evaluation:

- `fix/remnote-mcp-mass-note-creation-stability`
- `judges/openai-build-week-v0.1.1`
- `main`
- `release-artifacts/v0.1.0`
- `release-artifacts/v0.1.1`
- `release/local-stage7-evidence`

After this judge-documentation revision is committed, their union contains 35
unique commits in the window: 34 earlier implementation/release commits plus
this documentation-only update. The audit also reads the historical execution
contracts, retained documentation, test names, changed paths, release refs,
Devpost project copy, and the current public artifact. It does not infer
behavior from commit subjects alone.

The project existed before the event. The earlier foundation was also built
with Codex, primarily using GPT-5.5, and included the plugin, MCP bridge, broad
tool surface, Markdown workflows, rich formatting, flashcards, and an initial
bulk-import system. During Build Week, GPT-5.6-based Codex sessions were used to
extend and harden that foundation. This record therefore explains the eligible
reliability, media, verification, and release work without claiming that the
whole repository was created during the event.

## Why two seven-part plans appear in the history

The repository contains two related but different seven-part plans. They are
not duplicate claims.

The first plan, active at the beginning of the Build Week commit history, was a
reliability-remediation roadmap created from failing live scenarios. It focused
on the correctness of the already broad product. The second plan, introduced
on July 18 after that campaign, was the final product-completion contract. It
retained the reliability obligations, added first-class media, and defined the
path from local proof to exact-release live proof and judge packaging.

### Initial reliability-remediation phases

| Phase | Plan before implementation | Outcome reached during the campaign |
| --- | --- | --- |
| 1 | Make resumable import state truthful and crash-safe. | Added revision-aware state, legal transitions, stable mutation identities, persistence semantics, duplicate protection, and explicit uncertain/reconciliation behavior. |
| 2 | Preserve import hierarchy and semantic source fidelity. | Corrected planning and execution around hierarchy, native-node expansion, Markdown meaning, cards, tables, and source-preserving verification. |
| 3 | Compile saved design rules into one deterministic note plan. | Added a design-plan compiler and verification manifest so preview, execution, and verification share one interpretation. |
| 4 | Make verifiers read-only, typed, and evidence-specific. | Removed verifier-side mutation assumptions and returned typed pass/partial/fail evidence with actionable repair suggestions. |
| 5 | Preserve rich text, math, headings, and Markdown style during repair. | Added mutation invariants and regressions for headings, colors, highlights, formulas, child order, and card behavior. |
| 6 | Make reads, schemas, errors, scope, and reconnection actionable. | Strengthened bounded reads, error envelopes, scope enforcement, retry classification, reconnect ownership, and diagnostics. |
| 7 | Lock architecture seams and pass the release benchmark. | Added focused architecture tests, CI, tool-profile evidence, security gates, and a repeatable 15-scenario campaign. |

Commits `5f87e2b` through `5380dd5` executed and repeatedly retested this first
plan. Live findings were not hidden. They generated follow-up commits for
reconnect behavior, node budgeting, verifier truth, plugin runtime ownership,
and the remaining Test 14 defects.

### Final product-completion stages

On July 18, commit `ffb6c02` replaced the large remediation document with a
final product-completion contract. Its Stage 1 absorbed remaining reliability
and release defects. Stages 2–3 designed and implemented media. Stages 4–5
froze architecture risk and exercised the user experience. Stage 6 required
exact connected RemNote proof. Stage 7 required a judge-installable release.
The sections below show the plan, work, proof, and final result for each stage.

## Stage 1 — Close existing reliability and release defects

### Plan

Stage 1 was ordered by risk: fix Test 14 and resumable-import truth first; then
verification truthfulness; then connection ownership and retry safety; then
metadata and release identity; and only then consider architecture cleanup.
Every repaired defect required a focused failing test before the minimum fix,
followed by related regression gates. Local evidence had to remain separate
from connected exact-release proof.

### Work completed

The import lifecycle was checked across plan, start, run, status, resume,
verify, reconcile, and cancel. The work aligned logical and native node
manifests, validated legal job transitions, used revision-aware compare-and-set
state, retained stable mutation identities, prevented completed-chunk replay,
and distinguished a confirmed failure from an unknown outcome.

Verification was made read-only and evidence-specific. Dry runs stayed
mutation-free; applied manifests were read back; native metadata was filtered;
Concept–Descriptor relationships were verified explicitly; and partial results
did not masquerade as full success. Rich-text and design repairs preserved
supported existing content instead of recreating it loosely.

Connection reliability moved from a sidebar-owned socket toward a persistent
plugin runtime. The bridge gained safer request cleanup, online recovery,
reconnect tests, and retry classification. Public identity and tool-profile
metadata were reconciled, including the intentional distinction between npm
package version `0.0.1` and the plugin manifest version.

### Proof and closure

The July 18 checkpoint passed 117 focused tests plus metadata, security, auth,
boundary, idempotency, storage, and generated-reference checks. It correctly
left PostgreSQL durability and connected Test 14 evidence blocked when the
required environment was unavailable. Stage 6 later closed the live boundary:
Test 14 passed twice on the exact deployed runtime with persistent checkpoints,
one attempt per chunk, whole-tree readback, and completed-job no-replay.

**Final Stage 1 result: 100% complete.** The important implementation lineage
is `5f87e2b`, `81eef93`, `a65ce2c`, `76c6e2d`, `5380dd5`, `0e665e0`,
`f314c8f`, and `aff5cbb`.

## Stage 2 — Design media before implementation

### Plan

The design stage deliberately ended before production implementation. It had
to define exact schemas for `insert_image_from_url`,
`insert_audio_from_url`, and `insert_video_from_url`; identify the real fetch
owner; choose safe placement and rollback behavior; define capability probes;
specify MCP annotations and permission tiers; define idempotency and readback;
and prepare the RED/GREEN sequence and live fixtures.

The v1 boundary was stable HTTP(S) URL insertion. It explicitly excluded media
generation, upload hosting, retained binary storage, and hidden assumptions
that ChatGPT voice or generated media automatically supplies a durable URL.

This paragraph records the historical v0.1.1 boundary. A later July 20 working-
tree delta adds a separate top-level ChatGPT `imageFile` tool, PostgreSQL-backed
opaque asset hosting, and native image insertion without rewriting the original
release evidence.

### Work completed

Codex inspected installed `@remnote/plugin-sdk@0.0.46` typings and confirmed
the image, audio, and video rich-text builders. It established that the MCP
server does not fetch or proxy these media URLs; the RemNote environment owns
the open-world fetch. The design therefore enforced strict URL and input
validation without pretending server-side SSRF controls applied to a request
the server never makes.

All three tools were designed as writes that are non-destructive, idempotent,
and open-world. They target a dedicated child Rem rather than erasing unrelated
text. Missing SDK builders must return typed `SDK_UNSUPPORTED` with no mutation.
Failed post-write verification must compensate when possible and expose an
orphan ID as `PARTIAL_FAILURE` when compensation itself fails.

### Proof and closure

The complete schema, helper, protocol, handler, capability, idempotency,
rollback, test, and live-fixture plan was recorded before media source changed.

**Final Stage 2 result: 100% complete.** The design checkpoint and its
implementation plan are retained in commit `ffb6c02`.

## Stage 3 — Implement image, audio, and video insertion with TDD

### Plan

Each medium required the same ordered proof: schema RED/GREEN, correct builder
selection, safe placement, same-key idempotency, absent-capability behavior,
scope and write-tier enforcement, structured result envelopes, readback, and
compensation. YouTube support had to use the native video builder without
claiming it created a RemNote source object or annotator source.

### Work completed

Commit `ffb6c02` added the three public tools to the `note_writer` profile and
wired them through registry, policy, schema, protocol, plugin validation,
scope, permission, capability, and write layers. Inputs accept bounded HTTP(S)
URLs; image dimensions and labels are bounded; unsafe and malformed schemes
are rejected on both sides of the bridge.

Each operation creates a deterministic dedicated child, returns its Rem ID,
reads back the serialized media kind and URL, reuses the original result for a
matching idempotency key, and rejects conflicting reuse. If verification fails,
the path removes the new child when possible; if cleanup fails, it reports the
remaining ID instead of claiming rollback.

### Proof and closure

Required failures were observed before implementation for registration,
protocol, policy, capabilities, each route, compensation, and operation-tier
metadata. The focused media suite passed 33 tests, the related six-file matrix
passed 98 tests, and that checkpoint's full suite passed 326 tests. Later Stage
6 live proof confirmed native readback, stable IDs, and actual rendering or
playback for image, audio, YouTube, and direct MP4.

**Final Stage 3 result: 100% complete.** Primary implementation commit:
`ffb6c02`; stale-client compatibility and live-proof repair: `ebc99df`.

## Stage 4 — Full regression, CI, security, and conditional architecture review

### Plan

Stage 4 required the complete local gate set, strong auth/routing/pairing/tool-
profile/import/idempotency/source-fidelity/performance coverage, both
production dependency audits, exact commit identity, and exact-commit CI.
Architecture changes were allowed only when a concrete release risk justified
them. Graphify was an inspection aid, not proof of behavior.

### Work completed

The automated matrix ran across plugin and server builds, schema and boundary
checks, security and pairing, routing and health, style correctness, bulk
storage, source fidelity, idempotency, tool profiles, and performance. A focused
RED/GREEN test found that the widget loader could accept an arbitrary asset URL;
the implementation closed that injection seam without performing a speculative
dispatcher or widget rewrite.

Later release work added exact-main CI, release-hygiene tests, two clean
dependency audits, ZIP validation, and checks that public branches do not ship
generated Graphify output.

### Proof and closure

The final `0.1.1` checkpoint passed 40 Vitest files / 349 tests, type checking,
SDK validation, plugin and server builds, server smoke, security, boundary,
schema, idempotency, source-fidelity, and dependency gates. GitHub Actions run
`29691773546` completed successfully on exact main SHA `4172189`.

**Final Stage 4 result: 100% complete.** Main verification commit: `ef34515`;
exact-main release/CI commits: `a98d80b`, `5a7e80f`, and `4172189`.

## Stage 5 — Plugin UI and judge experience

### Plan

A first-time evaluator needed to identify server reachability, plugin
connection, approved scope, write access, disconnect controls, and the first
safe test within one minute. The test matrix covered disconnected, connecting,
connected, reconnecting, failed, pairing, approval, scope, writing access,
design style, ping, connect, disconnect, health, advanced settings, loading,
errors, narrow layout, 200% zoom, keyboard focus, target sizes, contrast, and
reduced motion.

### Work completed

The sidebar was simplified from a diagnostic card wall into a native-style
daily view centered on Connection, Writing access, and Design style. Pairing,
health, diagnostics, and dangerous controls remained reachable through the
appropriate secondary surfaces. Branding was bundled through the compiled
asset path; accessibility behavior and narrow layouts received focused tests.

Stage 4/5 validation also corrected contradictory setup copy. On July 19,
actual RemNote use exposed two separate availability failures: the local HTTP
server did not persist after the initiating shell exited, and the sidebar
selector/index widget activation had regressed. Commits `0709e8e`, `f50a924`,
and `b0b6f83` added a supervised local service, restored the selector
registration, and restored index-widget activation with regressions.

### Proof and closure

The SDK sandbox exercised all planned state, control, layout, focus, zoom, and
motion cases and preserved the correct boundary that sandbox screenshots were
not native proof. The later connected Stage 6 campaign supplied the native
boundary: the RemNote MCP panel was visibly Connected while media rendered and
played in RemNote.

**Final Stage 5 result: 100% complete.** Core commits: `76c6e2d`, `281df8b`,
`5380dd5`, `ef34515`, `0709e8e`, `f50a924`, and `b0b6f83`.

## Stage 6 — Exact-release connected RemNote proof

### Plan

Stage 6 could not pass from source inspection or unit tests. The same release
candidate had to prove focus and scope, bounded reads, writes, readback,
idempotency, guarded mutation, cards, formulas, supported styling, hierarchy,
resumable import, Test 14, image, audio, and video. A disconnect or stale client
snapshot had to be classified honestly rather than converted into a pass.

### Work completed

Initial exact-release runs exposed three live product issues. Deep reads needed
an explicit depth contract; completed bulk imports needed whole-tree readback
instead of truncated verification; and width-limited reads could stop after the
node budget without returning later siblings. Commits `0e665e0`, `f314c8f`,
and `aff5cbb` repaired those defects and added focused tests.

The installed Codex connector also held a stale 72-tool snapshot after the
server exposed the new media tools. Commit `ebc99df` tied server identity to
the discovery version and added a media-only compatibility probe through the
already exposed bridge-health tool. The probe stayed narrowly scoped, reused
stable idempotency keys, required direct-parent access, and returned exact URL
readback evidence for only the three media operations.

### Proof and closure

At deployed SHA `ebc99df`, health, bridge, plugin connection, sync, focus,
scope, read, write, readback, idempotency, guarded mutation, cards, rich math,
supported styling, hierarchy, and resumable import passed. Test 14 passed twice
with four chunks, persistent 50% checkpoints, one attempt per chunk, full
readback, and completed-job no-replay.

The image and audio returned native URL evidence, preserved IDs on same-key
replay, and were confirmed visually/audibly by the user. The final video root
`XPFBYmEiwUpSaxQ5P` contained exactly YouTube child
`Pqtihq0K8aFw0JjGW` and direct-MP4 child `xi7BoEuts2fuaRFtS`.
Independent readback and repeat calls preserved both IDs with no duplicate;
the user confirmed the YouTube embed and direct MP4 playback, including the MP4
at `0:05 / 0:05`.

**Final Stage 6 result: 100% complete.** Repair/proof commits: `0e665e0`,
`f314c8f`, `aff5cbb`, `ebc99df`, `ecaaaf4`, and `dd4d815`.

## Stage 7 — Judge-ready release engineering

### Plan

Stage 7 required a public source SHA, a prebuilt plugin artifact, reproducible
checksum, immutable tag, installation and hosted-connection instructions,
safe evaluation prompts, known limitations, security guidance, exact metadata,
and an explicit distinction between the pre-existing foundation and Build Week
delta. A judge needed to understand, install, connect, approve scope, read,
write, verify, resume, and test media without private explanation.

### Work completed

The project received a general-user README, retained technical references, and
a public no-build plugin ZIP. `v0.1.0` was tagged at `c0a6ff9`; its archive was
published and verified. Documentation commits certified Stages 1–7 and recorded
successful exact-tree CI on both the public line and a local evidence branch.

For the final RemNote upload, `main` advanced to `0.1.1` at `4172189`. That
commit changed the installable manifest version, added release-hygiene
coverage, tightened public documentation, and removed generated Graphify output
from public source. The `0.1.1` archive at `c8b65b9` passed ZIP integrity and
matched SHA-256
`207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b`.
The older artifact branch was cleaned separately at `4f47c84`, and the judge
branch was created to keep event-specific evidence away from the public-user
README.

### Proof and closure

Remote tags `v0.1.0` and `v0.1.1` peel to their recorded source SHAs. Exact-main
CI run `29691773546` succeeded on `4172189`. Public artifact branches contain
the verified archives and no generated Graphify tree. The current judge guide
provides bounded read, safe write, resumable import, and media prompts with
security and proof boundaries.

**Final Stage 7 result: 100% complete.** Release lineage: `3107f63`, `c0a6ff9`,
`146b171`, `0f769be`, `6ec88ce`, `a98d80b`, `5a7e80f`, `4172189`,
`47d9111`, `c8b65b9`, `4f47c84`, and `b941eed`.

## Complete Build Week commit ledger

This ledger covers every unique commit reachable from the six reviewed branch
tips after the official July 13 start. Closely related publication commits are
kept separate because they establish different branch or artifact identities.
The first 34 rows use immutable short hashes. The final row describes the
commit containing this audit as the judge branch's current `HEAD`; a Git commit
cannot embed its own final hash because changing the file would change that
hash.

| Date | Commit | Significant change and why it mattered |
| --- | --- | --- |
| Jul 14 | `5f87e2b` | Executed the first seven-phase local remediation across bulk-import state, storage, hierarchy, deterministic design planning, read-only verification, rich repair, retry safety, permissions, schemas, and architecture regressions. |
| Jul 14 | `466b808` | Added the raw RemNote campaign reports and recorded completion claims so live findings could be audited rather than summarized from memory. These bulky reports were later pruned after their conclusions were consolidated. |
| Jul 14 | `81eef93` | Fixed benchmark gaps revealed by live verification in read behavior, Markdown/import schemas, design compilation, formatting, card verification, idempotency, and fake-runtime coverage. |
| Jul 14 | `a65ce2c` | Closed post-deploy regressions, notably reconnect behavior and remaining bulk-import/design/repair mismatches, and added a post-deploy verification report plus bridge reconnect tests. |
| Jul 15 | `76c6e2d` | Added CI and product identity, corrected release/tool-profile gaps and native-node budgeting, introduced runtime sidebar actions and design styles, simplified the plugin UX, and expanded regression coverage. |
| Jul 16 | `281df8b` | Refined the native-style sidebar, bundled the real logo correctly, improved accessibility/layout behavior, strengthened highlight truth, and added focused widget and repair tests. |
| Jul 17 | `5380dd5` | Consolidated the 15-scenario live campaign, removed a tracked local `.env`, hardened config/pairing/security, moved bridge ownership into a persistent plugin runtime, filtered read metadata, and added lifecycle/runtime regressions. |
| Jul 18 | `ffb6c02` | Replaced the old roadmap with the final completion contract, completed Stages 1–3, designed then implemented the three media URL tools across every server/bridge/plugin layer, and added strict media TDD. |
| Jul 18 | `ef34515` | Completed Stage 4/5 verification, added broad gate evidence and SDK-sandbox screenshots, hardened widget asset loading against arbitrary URLs, and expanded UI-state regressions. |
| Jul 19 | `0709e8e` | Added a supervised local RemNote development service with start/status/doctor/stop commands, asset checks, owned-PID shutdown, cache policy coverage, and documentation so localhost serving survives the launching shell. |
| Jul 19 | `f50a924` | Restored the missing RemNote sidebar selector registration and added a regression that asserts the selector remains exposed. |
| Jul 19 | `b0b6f83` | Restored index-widget activation in the build loader while preserving asset-injection protection, fixing the second reason the plugin selector could disappear. |
| Jul 19 | `f38212d` | Created an empty, traceable release trigger so Render would redeploy the exact Stage 6 candidate without mixing a functional change into the deployment action. |
| Jul 19 | `0e665e0` | Added depth-aware read schemas and serialization so exact-release bulk-import verification could inspect deep trees without silently losing descendants. |
| Jul 19 | `f314c8f` | Added complete Rem-tree readback for finished import jobs, updated persistent job verification, and added no-cache local dev headers plus regressions for truncated readback. |
| Jul 19 | `aff5cbb` | Corrected node-limited traversal so reaching the budget inside one branch does not incorrectly discard later siblings; added a focused regression. |
| Jul 19 | `ebc99df` | Recovered media proof from a stale connector tool snapshot by versioning discovery identity and adding a tightly scoped compatibility probe through bridge health; also captured exact Tests 01–15 and Test 14 evidence. |
| Jul 19 | `ecaaaf4` | Recorded exact-SHA native media readback and the first completed human media confirmations without changing production behavior. |
| Jul 19 | `dd4d815` | Closed the final video proof, consolidated Stage 6 evidence, removed obsolete reports and draft documents, and added the Stage 7 release-engineering plan on the development line. |
| Jul 19 | `3107f63` | Added the first judge-ready `0.1.0` release guide and public README instructions on the retained development branch. |
| Jul 19 | `c0a6ff9` | Prepared the immutable public `v0.1.0` source by carrying forward the proven runtime and consolidating documentation/report cleanup into the release line. |
| Jul 19 | `146b171` | Published the prebuilt `0.1.0` `PluginZip.zip` on its artifact branch so judges could install without building. |
| Jul 19 | `21032c7` | Certified Stages 1–7 and added the completion audit on the local development/Graphify-retention line. |
| Jul 19 | `0f769be` | Applied the same Stage 1–7 certification to the public source line, keeping branch-specific release evidence aligned. |
| Jul 19 | `4c858a1` | Updated the local development branch with completed main-publication gates while preserving Graphify only on that historical work line. |
| Jul 19 | `6ec88ce` | Recorded the corresponding publication gates on the public source line. |
| Jul 19 | `a98d80b` | Triggered exact-tree GitHub Actions verification for the release source without introducing a functional change. |
| Jul 19 | `70088d5` | Recorded the successful exact-tree CI result on the local Stage 7 evidence branch. |
| Jul 19 | `5a7e80f` | Recorded the same successful exact-tree CI result on the public main lineage. |
| Jul 19 | `4172189` | Published clean `0.1.1` source: incremented the RemNote plugin manifest, added release-hygiene coverage, updated public docs, and removed the very large generated Graphify tree from public source. |
| Jul 19 | `47d9111` | Created the dedicated judge folder with evaluation instructions, benchmarks, and the Stage 1–7 audit, separating event evidence from public-user documentation. |
| Jul 19 | `c8b65b9` | Published the verified `0.1.1` plugin archive on its dedicated artifact branch. |
| Jul 19 | `4f47c84` | Removed generated Graphify output from the `0.1.0` artifact branch as well, leaving its binary release intact while cleaning the public language profile. |
| Jul 19 | `b941eed` | Updated judge evidence after the `0.1.1` source, artifact, checksum, tag, and exact-main CI publication were verified. |
| Jul 19 | current judge-branch `HEAD` | Rebuilt the evaluation guide from the live Devpost tagline and description, reconstructed both seven-part plans from Git history, explained all retained Build Week commits, expanded reproducible benchmarks, removed the obsolete blocked design-QA report, and left `AGENTS.md` empty for future instructions. |

## Branch lineage and purpose

| Branch | Purpose and final reviewed state |
| --- | --- |
| `main` | Canonical public source at `4172189`; clean `0.1.1`, no Graphify output, exact-main CI green. |
| `fix/remnote-mcp-mass-note-creation-stability` | Historical development and audit line. The local retained tip is `4c858a1`; the published remote/tagged release line resolves through `c0a6ff9`. Graphify remains here by design, not in public release branches. |
| `judges/openai-build-week-v0.1.1` | Evaluation narrative and historical evidence plus later post-release authentication/media commits that were selectively reconciled into `main`. Those later commits do not change immutable `v0.1.1` evidence. |
| `release-artifacts/v0.1.0` | Preserves the `0.1.0` ZIP; cleaned at `4f47c84` so generated Graphify files are absent. |
| `release-artifacts/v0.1.1` | Preserves the final installable `0.1.1` ZIP at `c8b65b9`. |
| `release/local-stage7-evidence` | Local evidence branch at `70088d5` retaining the exact-tree CI record; it is not the canonical public source. |

## Codex contribution, stated precisely

Codex was not used as a one-shot generator. It was used as the engineering
control loop around the repository. It inspected historical contracts and live
reports, mapped failures to server/bridge/plugin/SDK boundaries, wrote focused
regressions, implemented bounded fixes, ran verification, compared local proof
with deployed and connected behavior, and revised the next plan when evidence
disagreed with the previous assumption.

The human developer supplied the product need, priorities, approvals, RemNote
environment, deployment actions, and final visual/playback confirmation. Codex
performed the repository analysis, planning, implementation, test construction,
debugging, evidence classification, documentation, and release preparation
described above. Before Build Week that loop primarily used GPT-5.5; the
eligible Build Week extension and hardening cycle used GPT-5.6-based Codex
sessions.

## Remaining boundaries after 100% Stage 1–7 completion

Completion does not mean the platform has no limits. The installed SDK may not
support every visual mutation, and such cases must return truthful typed
results. Media v1 inserts stable HTTP(S) URLs; it does not upload generated
bytes or provide object storage. The `danger` profile and destructive tools are
not part of the judge workflow. A new `0.1.1` connected mutation campaign would
be fresh evidence, but it is not required to establish production equivalence:
the release changed no production TypeScript, bridge, or server behavior after
the exact live campaign.

These are product boundaries, not incomplete Stage 1–7 tasks. The public
release, artifact, verification record, and judge workflow are complete.
