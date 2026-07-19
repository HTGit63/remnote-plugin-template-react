# RemNote MCP Evaluation Guide

This branch contains evaluation-only instructions and benchmark evidence. The
root [README](../README.md) remains the public guide for RemNote users.

## Release identity

| Item | Value |
| --- | --- |
| Product | RemNote MCP |
| Installable plugin version | `0.1.1` |
| Immutable proven tag | `v0.1.0` → `c0a6ff9187debcad04d1f30f2b509bedd862e508` |
| v0.1.1 main source | `417218945879148b842e16a465c0a8ac639b9985` |
| v0.1.1 artifact commit | `c8b65b990e5ca3ecdfb47f032c6f9acdd1c7890c` |
| Hosted MCP | `https://remnote-plugin-template-react.onrender.com/mcp` |
| Plugin WebSocket | `wss://remnote-plugin-template-react.onrender.com/remnote` |
| v0.1.1 archive branch | `release-artifacts/v0.1.1` |

`0.1.1` is a maintenance upload version because RemNote does not accept a
second plugin upload with the same version. Compared with the proven release,
it changes manifest metadata, public documentation, tests, and repository
hygiene only. No production TypeScript, bridge, server, policy, or UI behavior
changed.

The v0.1.1 public download reproduces SHA-256
`207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b`.
GitHub Actions run `29691773546` passed on the exact main source above.

## Installation

1. Download
   [PluginZip.zip](https://github.com/HTGit63/remnote-plugin-template-react/raw/refs/heads/release-artifacts/v0.1.1/PluginZip.zip).
2. In RemNote desktop, open **Settings → Plugins → Upload plugin**.
3. Select the ZIP, enable **RemNote MCP**, and open its sidebar.
4. Set the plugin WebSocket URL shown above.
5. In ChatGPT Developer Mode, create a private MCP app with the hosted MCP URL.
6. Complete pairing in the plugin.
7. Choose **Current Rem tree** and **Ask for every write**.
8. Create a disposable parent Rem before running write tests.

Do not use the `danger` profile. Do not place tokens, pairing codes, OAuth
credentials, session secrets, or database credentials in a prompt.

## Test 1 — bounded read

```text
Use RemNote MCP. Check bridge and plugin status, read the focused Rem, and read
at most 25 direct children in RemNote order. Return each Rem ID and label. Do
not call a write tool and do not mutate anything.
```

Pass: the requested Rems are returned in order and mutation counts are zero.

## Test 2 — safe structured write

```text
Under the approved disposable parent, create a note named "RemNote MCP Safe
Write" with one child containing the formula E=mc^2 and one Descriptor card:
Energy-mass relation::Energy equals mass times the speed of light squared.
Use idempotency key evaluation-v011-safe-write-01, verify after writing, and
read back the hierarchy, rich text, formula, and card. Repeat with the same key
and prove that no duplicate Rem was created.
```

Pass: hierarchy, formula, and card read back correctly; replay preserves IDs.

## Test 3 — resumable import

```text
Plan a resumable import of a four-section Markdown fixture under the approved
disposable parent. Start with idempotency key evaluation-v011-resume-01. Run
one job step and stop. Report the persistent checkpoint, resume only pending
chunks until complete, verify whole-source fidelity, and call resume again to
prove completed chunks are not replayed. Never delete existing Rems.
```

Pass: persistent progress is visible, source fidelity passes, and the final
resume creates nothing.

## Test 4 — image, audio, and video

Select `developer`, refresh the client tool snapshot, then prompt:

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

Optionally test direct MP4 playback with
`https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4`.

Pass requires both native rich-text readback and human confirmation that the
image renders and the audio/video players work.

## Evidence

See [BENCHMARKS.md](BENCHMARKS.md) for automated measurements and
[STAGE_1_7_AUDIT.md](STAGE_1_7_AUDIT.md) for the completion verdict and proof
boundaries.
