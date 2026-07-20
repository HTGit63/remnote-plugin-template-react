# RemNote MCP — Judge Evaluation Guide

> **RemNote MCP lets AI agents safely turn complex ideas into structured,
> verifiable knowledge in RemNote.**

Generating another document is easy. The harder problem is letting an AI agent
operate on a learning-oriented knowledge system without losing hierarchy,
formatting, formulas, flashcards, identity, or user control. RemNote MCP is the
tool layer built for that problem.

This branch is the evaluation companion for the public project. The root
[README](../README.md) remains the installation and usage guide for all RemNote
users. This folder explains the Build Week work, the role of Codex, the proof
behind the release, and the fastest safe evaluation path.

## Five-minute review path

1. Read **Why this project exists** and **What Codex changed during Build Week**
   below.
2. Inspect the exact metrics and proof boundaries in
   [BENCHMARKS.md](BENCHMARKS.md).
3. Read the plan-to-proof narrative and complete commit ledger in
   [STAGE_1_7_AUDIT.md](STAGE_1_7_AUDIT.md).
4. Download the public `0.1.1` plugin archive and install it in RemNote desktop.
5. Run the bounded read, safe write, resumable import, and media prompts in this
   guide under a disposable Rem.

## Project and release identity

| Item | Verified value |
| --- | --- |
| Devpost project | [RemNote MCP](https://devpost.com/software/remnote-mcp) |
| Hackathon | [OpenAI Build Week](https://openai.devpost.com/) |
| Official submission window opened | `2026-07-13 16:00 UTC` |
| Installable plugin version | `0.1.1` |
| Public source | `main` at `417218945879148b842e16a465c0a8ac639b9985` |
| Immutable tag | `v0.1.1` → `417218945879148b842e16a465c0a8ac639b9985` |
| Live-proven runtime source | `ebc99df6901356b055a425b5909e8d0b5829d5cf` |
| Immutable `0.1.0` release | `v0.1.0` → `c0a6ff9187debcad04d1f30f2b509bedd862e508` |
| `0.1.1` artifact commit | `c8b65b990e5ca3ecdfb47f032c6f9acdd1c7890c` |
| Plugin archive | [PluginZip.zip](https://github.com/HTGit63/remnote-plugin-template-react/raw/refs/heads/release-artifacts/v0.1.1/PluginZip.zip) |
| Archive SHA-256 | `207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b` |
| Exact-main CI | [GitHub Actions run 29691773546](https://github.com/HTGit63/remnote-plugin-template-react/actions/runs/29691773546), success |
| Hosted MCP | `https://remnote-plugin-template-react.onrender.com/mcp` |
| Plugin WebSocket | `wss://remnote-plugin-template-react.onrender.com/remnote` |

RemNote requires a new version number for a replacement upload, so `0.1.1` is
the installable maintenance release. Between the live-proven `0.1.0` source and
`0.1.1`, production TypeScript, bridge, and server behavior did not change. The
production-path difference is the plugin manifest version; the other changes
are release documentation, release-hygiene coverage, and removal of generated
Graphify output from public branches and archives.

## Why this project exists

The project began with a practical content-production problem. While building
Phronesis, an education platform, the author used AI to research curricula,
explain concepts, develop examples, and work with scientific formulas. The AI
could produce useful text, but converting that text into a durable learning
resource remained manual. Hierarchy had to be rebuilt, formulas preserved,
formatting restored, flashcards created, and the finished material prepared for
later export or transformation.

RemNote was already the preferred authoring environment because one knowledge
tree can combine nested notes, rich formatting, scientific notation, linked
concepts, Concept–Descriptor relationships, and active-recall cards. That makes
the target more demanding than a conventional page write. A correct operation
may need to preserve content, parent-child order, rich-text representation,
mathematical meaning, card behavior, references, existing Rem identity, and a
safe recovery path after an uncertain failure.

RemNote MCP connects that environment to MCP clients such as ChatGPT and Codex.
Instead of simulating clicks or pasting a wall of text, the client calls narrow,
inspectable tools. The user chooses the allowed RemNote scope and writing level;
the plugin performs the SDK operation; the result reports IDs, warnings, and
verification evidence; and the client can read the result back before deciding
whether a targeted repair is needed.

The intended content workflow is:

```text
curriculum or source material
→ ChatGPT / Codex reasoning
→ RemNote MCP
→ structured RemNote knowledge
→ hierarchy + formulas + formatting + cards + media
→ export or transformation
→ Phronesis or another destination
```

## What the product does

RemNote MCP exposes controlled tools for context inspection, bounded tree
reads, search, structured note creation and updates, Markdown imports,
formatting, cards, scientific formulas, note-design verification, URL-based
image/audio/video insertion, diagnostics, and resumable bulk-import jobs.

Two runtimes cooperate. A Node.js MCP server handles discovery, authentication,
tool profiles, policy, hosted pairing, durable job state, routing, and
diagnostics. A React/TypeScript RemNote plugin owns the live connection,
re-checks scope and permission, performs RemNote Plugin API operations, and
returns structured results.

```text
ChatGPT or Codex
→ MCP auth, profile, schema, and scope checks
→ WebSocket bridge
→ persistent RemNote plugin runtime
→ RemNote Plugin API
→ readback and verification
→ structured MCP result
```

Long imports are deliberately not one unbounded write. They use a
plan/job/chunk lifecycle with revisions, stable mutation identities,
checkpoints, no-replay rules, verification, cancellation, and explicit
reconciliation when an outcome is uncertain.

## What Codex changed during Build Week

The repository predates Build Week and was already developed with Codex. The
pre-event foundation—primarily built through GPT-5.5-based Codex sessions—had
the RemNote plugin, MCP bridge, broad read/write surface, Markdown workflows,
formatting and card operations, and the original bulk-import system. This
submission does **not** claim that GPT-5.6 created the entire project from
scratch.

OpenAI Build Week opened on July 13, 2026 at 16:00 UTC. From that point through
this judge-package revision, the six retained branch tips contain 35 unique
commits: 34 earlier implementation/release commits plus this documentation-only
branch update. Codex with GPT-5.6 was used as the repository engineering loop: it
inspected architecture and live reports, classified failures across runtime
layers, planned bounded repairs, implemented them with regression tests, ran
local and hosted checks, interpreted connected RemNote evidence, and repeated
the cycle when real behavior disagreed with assumptions.

The significant Build Week delta was a reliability transformation:

- resumable imports gained revision-aware state, legal transitions, stable
  mutation identities, read-only verification, no-replay behavior, and
  reconciliation for uncertain chunks;
- hierarchy and source-fidelity handling were repaired, including exact native
  node budgets and complete readback for deep or width-limited trees;
- design compilation and verification became deterministic and evidence-based,
  including metadata filtering and Concept–Descriptor relationships;
- rich text, formulas, cards, headings, highlights, and repair behavior gained
  stronger invariants and truthful unsupported-SDK results;
- connection ownership moved from the sidebar lifecycle to a persistent plugin
  runtime, while local development gained a supervised server and clearer
  diagnostics;
- the sidebar was simplified around connection, writing access, design style,
  pairing, health, and safe advanced controls;
- authentication and inputs were hardened with rate, scope, metadata, payload,
  file-root, symlink, and secret-handling protections;
- image, audio, and video insertion were designed first, then implemented as
  HTTP(S)-URL tools with capability probes, strict validation, dedicated-child
  placement, idempotency, readback, and compensation;
- a 15-scenario connected RemNote campaign and focused Stage 6 reruns drove
  additional fixes instead of being treated as a ceremonial final check;
- the project was packaged as immutable `v0.1.0`, then published as clean
  installable `v0.1.1` source and a checksum-verified no-build ZIP.

The complete milestone and commit-level account is in
[STAGE_1_7_AUDIT.md](STAGE_1_7_AUDIT.md).

## Build Week timeline

| Date | Main engineering outcome |
| --- | --- |
| July 14 | Completed the first seven-phase remediation pass, then used deployed live benchmarks to find and close remaining state, fidelity, verification, and reconnect defects. |
| July 15 | Added CI, tightened release metadata and tool exposure, fixed exact native-node budgeting, and simplified the plugin control surface. |
| July 16 | Refined the native-style sidebar, asset packaging, accessibility, and truthful highlight verification. |
| July 17 | Completed the 15-scenario campaign record, hardened pairing/configuration, and moved connection ownership into the persistent plugin runtime. |
| July 18 | Reframed the work as the final product-completion contract; designed and implemented image, audio, and video URL tools with strict tests; completed broad regression and sandbox UI verification. |
| July 19 | Repaired local plugin serving and selector activation, fixed deep and width-limited import readback, recovered media proof through a stale client snapshot, completed exact-release live proof, published `v0.1.0`, produced `v0.1.1`, removed generated Graphify output from public artifacts, and created this judge branch. |

## Evaluation against the judging criteria

| Criterion | Where to look |
| --- | --- |
| Technological Implementation | The Stage 1–7 audit shows the Codex-driven repair loop, TDD sequence, architecture seams, 34-commit ledger, 349-test release suite, exact-main CI, and live RemNote campaign. |
| Design | Install the plugin and inspect the connected sidebar. Its primary decisions are connection, writing access, and design style; pairing and diagnostics remain available without dominating the daily view. |
| Potential Impact | The project addresses a concrete educational-authoring workflow: converting AI reasoning into structured, reusable learning material instead of another isolated document. |
| Quality of the Idea | RemNote MCP treats hierarchy, rich text, formulas, cards, linked knowledge, media, and recovery as one agent-operation problem rather than reducing integration success to page text. |

## Install and connect

1. Download the public
   [PluginZip.zip](https://github.com/HTGit63/remnote-plugin-template-react/raw/refs/heads/release-artifacts/v0.1.1/PluginZip.zip).
2. In RemNote desktop, open **Settings → Plugins → Upload plugin**.
3. Select the ZIP, enable **RemNote MCP**, and open its sidebar.
4. Set the WebSocket endpoint to
   `wss://remnote-plugin-template-react.onrender.com/remnote`.
5. In ChatGPT Developer Mode, create a private MCP app using
   `https://remnote-plugin-template-react.onrender.com/mcp`.
6. Complete pairing in the plugin and refresh the client tool snapshot.
7. Start with **Current Rem tree** and **Ask for every write**.
8. Create a disposable parent Rem before testing writes.

Do not use the `danger` profile for evaluation. Never place tokens, pairing
codes, OAuth credentials, session secrets, or database credentials in a prompt.

## Test 1 — bounded read

```text
Use RemNote MCP. Check bridge and plugin status, read the focused Rem, and read
at most 25 direct children in RemNote order. Return each Rem ID and label. Do
not call a write tool and do not mutate anything.
```

Pass means the requested Rems return in order and the result reports no
mutation.

## Test 2 — safe structured write and replay

```text
Under the approved disposable parent, create a note named "RemNote MCP Safe
Write" with one child containing the formula E=mc^2 and one Descriptor card:
Energy-mass relation::Energy equals mass times the speed of light squared.
Use idempotency key evaluation-v011-safe-write-01, verify after writing, and
read back the hierarchy, rich text, formula, and card. Repeat with the same key
and prove that no duplicate Rem was created.
```

Pass means the hierarchy, formula, and card read back correctly and replay
preserves the original IDs.

## Test 3 — interrupted and resumed import

```text
Plan a resumable import of a four-section Markdown fixture under the approved
disposable parent. Start with idempotency key evaluation-v011-resume-01. Run
one job step and stop. Report the persistent checkpoint, resume only pending
chunks until complete, verify whole-source fidelity, and call resume again to
prove completed chunks are not replayed. Never delete existing Rems.
```

Pass means the checkpoint is visible, the final source-fidelity verification
passes, and the final resume creates nothing.

## Test 4 — image, audio, YouTube, and direct video

The default `mass_note_writer` profile now exposes image and YouTube tools. Use
`note_writer` or higher when the audio tool is also required, then refresh the
client tool snapshot.

```text
Under the approved disposable parent, insert exactly one image, one audio
player, and one YouTube embed with verify-after-write enabled and these keys:
evaluation-v011-image-01, evaluation-v011-audio-01, and
evaluation-v011-video-01. Use:
image https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg
audio https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3
video https://www.youtube.com/watch?v=jNQXAC9IVRw
Read back the native rich-text payloads, repeat each same-key operation, and
prove that IDs stay stable with no duplicate.
```

The optional direct-file fixture is
`https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`.
Media passes only when native rich-text readback succeeds **and** a human
confirms that the image renders and the audio/video players work.

## Evidence map

| Question | Source |
| --- | --- |
| What exactly changed during Build Week? | [STAGE_1_7_AUDIT.md](STAGE_1_7_AUDIT.md) |
| Which commit implemented or proved each milestone? | [Commit ledger](STAGE_1_7_AUDIT.md#complete-build-week-commit-ledger) |
| What passed automatically and live? | [BENCHMARKS.md](BENCHMARKS.md) |
| What tools and schemas are public? | [TOOL_REFERENCE.md](../TOOL_REFERENCE.md) |
| How do users install and operate the product? | [Root README](../README.md) |
| How are architecture, diagnostics, and repair handled? | [Engineering guide](../docs/engineering-guide.md) and [repair/testing guide](../docs/remnote-mcp-repair-and-testing.md) |

## Proof boundaries and known limitations

The release deliberately separates proof layers. A healthy hosted endpoint is
not proof that the plugin is connected. A successful MCP response is not proof
that RemNote mutated correctly. Native media readback is not playback proof.
The retained Stage 6 result includes exact URL readback, stable-ID replay, and
user-confirmed image, audio, YouTube, and direct MP4 behavior.

The installed RemNote SDK is `@remnote/plugin-sdk@0.0.46`. When a required
runtime capability is absent, the media path returns typed `SDK_UNSUPPORTED`
without mutation. The original v0.1.1 campaign used URL-only media. The July 20
hosted-image delta adds `insert_image_from_file`: ChatGPT image files are byte-
validated, persisted in PostgreSQL, served from opaque immutable HTTPS URLs,
and routed through the same native image builder. Because the installed RemNote
SDK stores a URL-backed rich-text image rather than accepting a binary upload,
successful readback retains the required bridge bytes and reports that remote
dependency. Newly created orphans are deleted only after definitive no-write
failures; uncertain writes are retained. This new path has automated
and simulated bridge proof in the working tree; connected deployed rendering
must still be rerun on the updated deployment. Audio and video remain URL-
backed. Destructive tools remain outside this evaluation workflow.

The exact connected campaign belongs to the production code at `ebc99df`,
which is functionally identical to the runtime in `v0.1.0` and `v0.1.1`.
`v0.1.1` has automated, build, artifact, and exact-main CI proof; it is not
misrepresented as a separate fresh live-mutation campaign.
