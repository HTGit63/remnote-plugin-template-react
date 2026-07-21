# RemNote MCP — OpenAI Build Week Judge Guide

> I did not want another AI note generator. I wanted an AI agent to work with
> my existing knowledge base under my control.

That is the reason I built RemNote MCP. It connects ChatGPT and Codex to
RemNote through narrow, inspectable tools instead of browser automation or one
large paste. The user chooses the scope and writing level. The plugin performs
the RemNote SDK operation. The tool reports what it created or changed and, for
important workflows, reads the result back.

This is the fastest honest path for evaluating the current project. Please use
RemNote desktop's **Develop from localhost** flow. Do not use the old plugin ZIP
for this branch; RemNote still has to review public plugin releases, and the ZIP
does not contain the newest judge-branch changes.

## Five-minute review

1. Read the project story and judging-criteria map below.
2. Follow **Run the plugin from localhost**.
3. Connect the hosted MCP app and refresh its tool metadata.
4. Run the read-only test before approving any write.
5. Use a disposable `Plugin Test` Rem for the structured-write and media tests.
6. Check [BENCHMARKS.md](BENCHMARKS.md) for every registered tool and current
   proof status.
7. Check [BUILD_WEEK_ENGINEERING_AUDIT.md](BUILD_WEEK_ENGINEERING_AUDIT.md) for
   the complete engineering, Codex, failure-repair, and security record.

## Required `/feedback` Codex Session ID

Use this as the primary session for the hackathon feedback requirement:

```text
019f761b-7a26-7413-a2b1-99112f18888d
```

This session contains the main media-first implementation and judge-package
work. The engineering audit lists the other material supporting sessions and
states what each contributed. Those sessions are supporting evidence; the ID
above is the single recommended `/feedback` submission.

## Project identity

| Item | Current value |
| --- | --- |
| Project | [RemNote MCP on Devpost](https://devpost.com/software/remnote-mcp) |
| Event | [OpenAI Build Week](https://openai.devpost.com/) |
| Judge branch | `judges/openai-build-week-v0.1.1` |
| Installable manifest version | `0.1.1` |
| MCP/server implementation version | `0.0.1` |
| RemNote Plugin SDK | `0.0.46` |
| Hosted MCP | `https://remnote-plugin-template-react.onrender.com/mcp` |
| Plugin WebSocket | `wss://remnote-plugin-template-react.onrender.com/remnote` |
| Deployed media/discovery code checked on July 21 | `4a5ee394ee536e3ccebbe141dd9d3a6856c16967` |
| Current registry/schema version | `2026-07-21.hosted-media-file-schemas-v2` |
| Declared / public developer tools | `82 / 79` |

The final judge-documentation commit is intentionally not described as a new
deployment. It changes the evaluation package, not the production media path.

## The problem I wanted to solve

I was building educational material for Phronesis. AI could help me research,
explain, and draft difficult topics, but the useful result still had to be
rebuilt manually inside RemNote. A learning note is not just a string. It can
have ordered hierarchy, formulas, Concepts, Descriptors, rich-text emphasis,
flashcards, references, and media. It also has stable identities that should
not change because a request was retried.

RemNote MCP turns that manual transfer into a controlled agent workflow:

```text
source material or an existing RemNote note
→ ChatGPT / Codex reasoning
→ scoped MCP tool call
→ RemNote desktop plugin
→ native hierarchy, cards, formulas, formatting, and media
→ readback and verification
```

The product is useful beyond one note. It gives people who already use RemNote
a way to let an agent help with their real knowledge base without granting an
unbounded “do anything” command.

## What is technically different

RemNote MCP combines four boundaries that are normally handled separately:

- an OAuth-protected Streamable HTTP MCP server with explicit tool schemas and
  profiles;
- a persistent authenticated WebSocket bridge to the RemNote desktop plugin;
- RemNote-side permission, scope, approval, idempotency, and readback rules;
- PostgreSQL-backed resumable imports and hosted media for temporary ChatGPT
  file uploads.

Long imports use plan, job, chunk, checkpoint, verification, cancellation, and
reconciliation states. They do not replay an unknown write blindly. File media
uses authorized ChatGPT file objects, verified bytes, safe remote download,
opaque hosted URLs, native RemNote builders, and post-write readback.

## How the project matches the official criteria

| OpenAI Build Week criterion | Evidence |
| --- | --- |
| Technological Implementation | Codex was used for non-trivial architecture, TDD repairs, registry work, resumable state, media ingestion, live diagnosis, and verification. The engineering audit links the work to commits and sessions. |
| Design | The product is runnable as one coherent flow: local RemNote plugin, hosted MCP, sidebar scope/approval controls, narrow tools, typed results, and readback. |
| Potential Impact | It addresses a real workflow for students, educators, researchers, and knowledge workers who want AI assistance inside an existing structured knowledge base. |
| Quality of the Idea | It treats safe agent operation over hierarchy, rich text, formulas, cards, media, retries, and partial failure as one product problem—not just “generate a note.” |

## Run the plugin from localhost

Use RemNote desktop and Node.js 20 or newer.

```bash
git clone https://github.com/HTGit63/remnote-plugin-template-react.git
cd remnote-plugin-template-react
git checkout judges/openai-build-week-v0.1.1
npm ci
npm ci --prefix server
npm run dev:start
npm run dev:status
npm run dev:doctor
```

In RemNote desktop:

1. Open **Settings → Plugins**.
2. Choose **Develop from localhost**.
3. Enter exactly `http://localhost:8080`.
4. Enable **RemNote MCP** and open its sidebar.
5. Confirm the default server endpoint is
   `wss://remnote-plugin-template-react.onrender.com/remnote`. If an older
   installation retained a localhost override, replace it with this value.
6. Complete pairing and select `mass_note_writer` or `developer` for media.
7. Keep **Ask for every write** enabled.

Do not append `/manifest.json` to the localhost URL. Leave `npm run dev:start`
running for the evaluation.

In ChatGPT Developer Mode, add or refresh the private app using:

```text
https://remnote-plugin-template-react.onrender.com/mcp
```

After any server deployment or profile change, refresh the app in
**Settings → Plugins** and start a new conversation. OpenAI's app workflow
caches tool discovery; an already-open chat cannot gain newly registered tools
mid-conversation.

Port `8080` only loads the RemNote development plugin. It is not the MCP
endpoint. Judges using the hosted Render bridge do not need ngrok. Developers
running the companion MCP server locally must expose port `47392` through an
HTTPS tunnel such as ngrok and connect ChatGPT to the tunnel's `/mcp` path; the
root README documents that advanced flow.

## Test 1 — connection and bounded read

Focus a disposable Rem named `Plugin Test`, then use:

```text
Use RemNote MCP. Check bridge and plugin status, read the focused Rem, and read
at most 20 direct children in RemNote order. Return IDs and labels. Do not call
a write tool.
```

Pass means the plugin is connected, the focused Rem is correct, the children
are bounded and ordered, and no mutation is reported.

## Test 2 — safe structured write and replay

```text
Under the focused Plugin Test Rem, create a child note called “Build Week Safe
Write” with one formula E=mc^2 and one Descriptor card:
Energy-mass relation::Energy equals mass times the speed of light squared.
Use idempotency key build-week-safe-write-01, verify after writing, and read the
result back. Repeat the exact request with the same key and prove that no
duplicate was created.
```

Pass requires native hierarchy and content readback plus stable IDs on replay.
A successful response without readback is incomplete evidence.

## Test 3 — uploaded PNG, MP3, and MP4

Upload one small PNG, one MP3, and one **real MP4 container**, then use:

```text
Under Plugin Test, insert each uploaded file with its native RemNote media tool.
Use a different stable idempotency key per file. Verify the created media Rems
by readback. Do not replace a failed media call with Markdown or a plain URL.
```

Expected tool names:

- `insert_image_from_file`
- `insert_audio_from_file`
- `insert_video_from_file`

If only the URL versions appear, stop the test, refresh the ChatGPT app, and
start a new chat. On July 21 the deployed server returned all 79 public tools,
including both new file tools, while the already-open test conversation still
showed 77. That is a client discovery snapshot, not a missing server
registration.

The supplied MP3 used during diagnosis is valid MPEG Layer III and within the
limit. The previously reported `.mp4` sample was actually Matroska/WebM with
VP8, so it is not a valid MP4 fixture. The loader correctly rejects it. SVG is
also unsupported by design.

After successful readback, a person should reopen the Rem and confirm image
rendering, audio playback, and video playback. That last UI check cannot be
replaced by a JSON response.

## Test 4 — URL media

```text
Under Plugin Test, insert one stable public image URL, one public MP3 URL, one
YouTube URL, and one direct MP4 URL. Require native media readback and then
confirm rendering or playback in RemNote. A plain text URL is a failure.
```

Image URL, public MP3 URL, YouTube, and direct-video paths have connected
success evidence. The current benchmark keeps that prior live proof separate
from this pass's read-only checks.

## What is proven now

- The deployed server and connected plugin reported the same current media
  implementation SHA.
- Raw hosted MCP discovery returned 79 developer-profile tools and included
  strict ChatGPT file schemas for image, audio, and video.
- The connected `Plugin Test` Rem passed current selection, focus, read, tree,
  rich-text, breadcrumb, search, diagnostics, and read-only health checks.
- Focused media/ChatGPT regressions passed 62/62 tests.
- Earlier July 21 connected tests proved uploaded PNG/JPEG insertion, URL audio,
  and native YouTube insertion.

## What is not claimed

- This documentation pass did not perform 79 live mutations. Most write tools
  are covered by schema, policy, simulation, focused regressions, and retained
  connected evidence; their current-pass live status is marked `NOT RUN`.
- The already-open ChatGPT conversation could not call the new MP3/MP4 file
  tools because it held the old 77-tool snapshot.
- A mislabeled WebM file is not proof that real MP4 ingestion fails.
- Native readback is not human rendering or playback proof.
- Local tests do not prove hosted PostgreSQL availability or a connected
  RemNote session.
- The public media URL is not appropriate for confidential files.

## Evidence map

| Question | Document |
| --- | --- |
| How do I run the project? | [Root README](../README.md) |
| What changed, why, and through which Codex sessions? | [BUILD_WEEK_ENGINEERING_AUDIT.md](BUILD_WEEK_ENGINEERING_AUDIT.md) |
| What is the status of every tool and every verification gate? | [BENCHMARKS.md](BENCHMARKS.md) |
| What schemas and policies does the server generate? | [TOOL_REFERENCE.md](../TOOL_REFERENCE.md) |

Those are the three primary judge documents in this folder: this guide, the
engineering audit, and the benchmark. Historical stage and standalone media
audit material has been merged into them so the evidence has one current home.
