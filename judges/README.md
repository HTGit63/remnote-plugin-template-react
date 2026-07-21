# RemNote MCP — OpenAI Build Week Judge Guide

RemNote MCP lets ChatGPT and Codex work safely with an existing RemNote
knowledge base. Instead of pasting generated text into a page, the agent can
read bounded context, create native hierarchy, preserve formulas and cards,
insert media, and verify important writes through RemNote readback.

The user remains in control through OAuth pairing, RemNote scope, tool
profiles, write approval, idempotency, and typed failure states.

## Five-minute evaluation path

1. Clone the judge branch and start the extension with `npm run dev`.
2. Load `http://localhost:8080` through RemNote desktop's
   **Develop from localhost** screen.
3. Connect the extension to the hosted Render bridge.
4. Connect ChatGPT or Codex to the hosted MCP endpoint.
5. Focus a disposable Rem named `Plugin Test`.
6. Run the read-only prompt, then the media prompt below.
7. Use [BENCHMARKS.md](BENCHMARKS.md) and
   [BUILD_WEEK_ENGINEERING_AUDIT.md](BUILD_WEEK_ENGINEERING_AUDIT.md) to review
   proof layers, failures, repairs, and limitations.

## Required `/feedback` Codex Session ID

Use this primary build session in the Devpost submission:

```text
019f761b-7a26-7413-a2b1-99112f18888d
```

The engineering audit lists supporting sessions and their specific
contributions. This is the single recommended ID for the required `/feedback`
field.

## Project identity

| Item | Value |
| --- | --- |
| Project | [RemNote MCP on Devpost](https://devpost.com/software/remnote-mcp) |
| Event | [OpenAI Build Week](https://openai.devpost.com/) |
| Category | Education |
| Judge branch | `judges/openai-build-week-v0.1.1` |
| RemNote extension version | `0.1.1` |
| Server implementation version | `0.0.1` |
| RemNote Plugin SDK | `0.0.46` |
| Deployed judge commit verified live | `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb` |
| Hosted MCP | `https://remnote-plugin-template-react.onrender.com/mcp` |
| Extension WebSocket | `wss://remnote-plugin-template-react.onrender.com/remnote` |
| Declared / public developer tools | `82 / 79` |

## Why I built it

I was creating educational material for Phronesis. AI could research and draft
the lesson, but the useful result still had to be reconstructed manually in
RemNote. A learning note is more than text: it has ordered hierarchy, formulas,
Concepts, Descriptors, cards, formatting, references, stable IDs, and media.

RemNote MCP turns that transfer into a controlled workflow:

```text
existing knowledge or source material
→ ChatGPT / Codex reasoning
→ scoped MCP action
→ RemNote desktop extension
→ native RemNote structure
→ readback and verification
```

## What is technically substantial

- An OAuth-protected Streamable HTTP MCP server with explicit file schemas and
  profile-based tool exposure.
- A persistent authenticated WebSocket connection to the RemNote desktop
  extension.
- RemNote-side scope, write approval, idempotency, and post-write verification.
- Resumable Markdown imports with durable checkpoints, reconciliation, and
  source-fidelity checks.
- PostgreSQL-backed hosting for temporary ChatGPT image, MP3, and MP4 uploads.
- SSRF-resistant downloads, byte-signature validation, byte ranges for media,
  opaque URLs, and definitive-orphan cleanup.
- Native RemNote rich text for images, audio, video, formulas, cards, Concepts,
  Descriptors, and structured note trees.

## Install and run

### Supported platform

Use RemNote desktop on a machine with Git, Node.js 20 or newer, and npm.

### 1. Start the extension

```bash
git clone https://github.com/HTGit63/remnote-plugin-template-react.git
cd remnote-plugin-template-react
git checkout judges/openai-build-week-v0.1.1
npm ci
npm run dev
```

Keep the terminal running. In RemNote desktop:

1. Open **Settings → Plugins**.
2. Choose **Develop from localhost**.
3. Enter exactly `http://localhost:8080`.
4. Do not append `/manifest.json`.
5. Enable **RemNote MCP** and open its sidebar.

This port loads the extension source only. It is not the MCP endpoint and does
not require ngrok when evaluating against the hosted Render bridge.

### 2. Confirm the hosted bridge

The RemNote MCP sidebar should show:

```text
wss://remnote-plugin-template-react.onrender.com/remnote
```

An older installation may retain a localhost override. Replace that saved
value with the hosted address above, complete pairing, select
`mass_note_writer` or `developer`, and keep **Ask for every write** enabled.

### 3. Connect ChatGPT or Codex

Create or refresh the private Developer Mode app with:

```text
https://remnote-plugin-template-react.onrender.com/mcp
```

| Address | Used by | Purpose |
| --- | --- | --- |
| `http://localhost:8080` | RemNote desktop | Load the current extension source |
| `wss://remnote-plugin-template-react.onrender.com/remnote` | RemNote extension | Connect to the hosted bridge |
| `https://remnote-plugin-template-react.onrender.com/mcp` | ChatGPT or Codex | Discover and invoke MCP tools |

After a deployment or profile change, refresh the app under
**Settings → Plugins** and begin a new conversation to receive the latest tool
descriptors.

## Evaluation prompts

### Test 1 — connection and bounded read

Create and focus a disposable Rem named `Plugin Test`, then ask:

```text
Use RemNote MCP. Check bridge and plugin status, read the focused Rem, and read
at most 20 direct children in RemNote order. Return IDs and labels. Do not call
a write tool.
```

Pass requires a connected plugin, the correct focused Rem, ordered bounded
children, and no mutation.

### Test 2 — safe structured write and replay

```text
Under the focused Plugin Test Rem, create a child called “Build Week Safe
Write” containing the formula E=mc^2 and the Descriptor card:
Energy-mass relation::Energy equals mass times the speed of light squared.
Use idempotency key build-week-safe-write-01, verify the write, and read the
result back. Repeat the exact request with the same key and prove that no
duplicate was created.
```

Pass requires native structure, successful readback, and stable IDs on replay.

### Test 3 — uploaded image, audio, and video

Upload a small PNG or JPEG, an MP3, and a genuine MP4, then ask:

```text
Under Plugin Test, insert each uploaded file with its native RemNote media
tool. Use a different stable idempotency key per file. Verify each created Rem
and read it back independently. Do not substitute Markdown or a plain URL.
```

Expected actions:

- `insert_image_from_file`
- `insert_audio_from_file`
- `insert_video_from_file`

### Test 4 — public URL media

```text
Under Plugin Test, insert one public image URL, one public MP3 URL, one YouTube
URL, and one direct MP4 URL. Require native media readback. A plain text URL
does not count as a media insertion.
```

## Current live media proof

The hosted deployment and connected RemNote extension were tested again on
July 21 against `Plugin Test` (`OjLcSppWfIH0cpPoh`).

| Workflow | Current result | Connected evidence |
| --- | --- | --- |
| Uploaded raster image | PASS | Native image insertion and readback retained from the current media campaign |
| Uploaded MP3 | PASS | `fiesta.mp3`, 1,481,572 bytes, Rem `C4AUcbO4uXbJkAMZp`, `audio/mpeg`, native `onlyAudio: true` readback |
| Uploaded MP4 | PASS | H.264/AAC MP4, 1,570,024 bytes, Rem `QyPyn0Ch6C6NdStoO`, `video/mp4`, native `onlyAudio: false` readback |
| Public image/audio/video URLs | PASS | Native connected insertion and readback retained |
| YouTube | PASS | Native connected video insertion and readback retained |

For both uploaded-file tests, the tool verified the created Rem, media kind,
hosted URL, and persistent asset. A separate `get_children`, `get_rem`, and raw
rich-text read confirmed the parent, stable Rem ID, hosted URL, and native media
shape. This is connected mutation/readback proof, not a local simulation.

The earlier rejected video was WebM/VP8 content with an `.mp4` filename. The
new fixture is a real MP4 with H.264 video and AAC audio, so it passes the byte
validator and native video path. SVG remains intentionally unsupported.

Readback proves the stored native structure. A person should still confirm
visible rendering and playback in RemNote during evaluation.

## OpenAI Build Week criteria

The current Devpost criteria are mapped directly to evidence:

| Criterion | Evidence in this project |
| --- | --- |
| Technological Implementation | Codex supported non-trivial architecture, TDD repairs, tool schemas, resumable state, secure media ingestion, deployment diagnosis, and verification. Commits and sessions are recorded in the engineering audit. |
| Design | The project runs as one coherent experience: local RemNote extension, hosted MCP, sidebar permission controls, typed actions, native results, and readback. |
| Potential Impact | Students, educators, researchers, and knowledge workers can use AI inside an existing structured knowledge base without surrendering control of the whole workspace. |
| Quality of the Idea | The project treats hierarchy, rich text, cards, media, retries, permissions, and partial failure as one safe agent workflow rather than another note generator. |

## How Codex and GPT-5.6 were used

Codex was the engineering loop: inspect the repository and runtime, write a
failing regression, implement a narrow repair, run focused and full gates,
test the deployed path, and revise the diagnosis when one layer passed but the
product still failed. GPT-5.6 was used during the final architecture,
uploaded-media, diagnostics, documentation, and verification work.

Important decisions included separating MCP callability from live runtime
verification, keeping hosted media while RemNote still references it, rejecting
active SVG content, validating real bytes instead of extensions, preserving
custom endpoint overrides, and making Render the default bridge for new source
installations.

## Evidence and limitations

| Question | Evidence |
| --- | --- |
| How do I install and run it? | This guide and the [root README](../README.md) |
| What passed locally and live? | [BENCHMARKS.md](BENCHMARKS.md) |
| What changed and why? | [BUILD_WEEK_ENGINEERING_AUDIT.md](BUILD_WEEK_ENGINEERING_AUDIT.md) |
| What are the exact tool contracts? | [TOOL_REFERENCE.md](../TOOL_REFERENCE.md) |

Current boundaries:

- RemNote desktop must be open and connected for SDK operations.
- The ChatGPT integration is private Developer Mode, not a public listing.
- Native readback is not a substitute for human rendering or playback checks.
- Hosted assets are public by opaque URL because RemNote must fetch them; do
  not use this path for confidential media.
- The personal PostgreSQL deployment has per-file limits but no aggregate
  per-owner quota or end-user media deletion screen.
- This evidence does not claim that all 79 public tools were live-mutated in
  one campaign; the benchmark labels automated, retained, connected, and
  human-proof layers separately.

## Devpost submission checklist

- Working project: verified locally, on the hosted bridge, and through
  connected RemNote reads and media writes.
- Category: Education.
- Repository: public with setup and testing instructions.
- README: includes supported platform, sample prompts, endpoints, and evidence.
- Demo: record a public YouTube video shorter than three minutes with narration
  covering the product, Codex, and GPT-5.6.
- `/feedback`: use `019f761b-7a26-7413-a2b1-99112f18888d`.
