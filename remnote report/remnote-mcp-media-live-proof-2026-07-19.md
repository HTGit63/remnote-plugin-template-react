# RemNote MCP Media Live Proof — 2026-07-19

Branch: `fix/remnote-mcp-mass-note-creation-stability`

HEAD: `aff5cbb71b4818c3e0e218d56355217099382904`

Deployment SHA: `aff5cbb71b4818c3e0e218d56355217099382904`

Plugin build SHA: `NOT_RUNTIME_OBSERVABLE` — plugin status reports SDK/runtime
capabilities but does not embed a separate build SHA.

SDK version: `0.0.46`

Approved root: `Stage 6 Exact Release Proof — 2026-07-19 — aff5cbb`
(`Tmbge6Mza34dYR7q5`) beneath focused `Plugin Test` (`OjLcSppWfIH0cpPoh`)

Image URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg` (`HTTP 200`, `image/jpeg`)

Image mutation IDs: `BLOCKED`

Image readback: `BLOCKED`

Image visual result: `BLOCKED`

Image idempotency repeat: `BLOCKED`

Audio URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3` (`HTTP 200`, `audio/mpeg`)

Audio mutation IDs: `BLOCKED`

Audio readback: `BLOCKED`

Audio player result: `BLOCKED`

Audio idempotency repeat: `BLOCKED`

YouTube URL: `https://www.youtube.com/watch?v=jNQXAC9IVRw` (`HTTP 200`)

Video mutation IDs: `BLOCKED`

Video readback: `BLOCKED`

Video playback/embed result: `BLOCKED`

Video idempotency repeat: `BLOCKED`

Direct video URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` (`HTTP 200`, `video/mp4`)

Result: `BLOCKED`

Limitations:

- Server registry and discovery advertise `insert_image_from_url`,
  `insert_audio_from_url`, and `insert_video_from_url`.
- Live plugin reports native `plugin.richText.image`, `.audio`, and `.video`
  builders as supported.
- Current connector session exposes 72 RemNote tools but omits all three media
  tools and `reconcile_note_import_job_chunk`.
- Media calls therefore cannot be invoked through the user-authorized connector
  in this session. Stored URL text would not meet the Stage 6 contract and was
  not used as fake media proof.
- Native visual render, audio playback, and video playback require user-visible
  RemNote confirmation after connector refresh and successful MCP insertion.

Overall media verdict: `BLOCKED` — connector tool surface refresh required.

## Root cause and repair candidate

- Exact deployed server `aff5cbb71b4818c3e0e218d56355217099382904`
  returns 76 tools from `tools/list`; all three native media tools are present.
- The connected plugin reports image, audio, and video rich-text SDK support.
- The installed Codex app snapshot exposes 72 tools. It is missing the same four
  post-snapshot tools: image, audio, video, and import reconciliation.
- MCP server identity was hard-coded to `0.1.0`, so registry and schema changes
  did not change the discovery identity used by connector caches.
- This repair derives server identity from the tool registry and advances both
  tool versions to `2026-07-19.connector-media-proof`.
- This repair also extends the already-exposed `run_bridge_health_check` with a
  media-only probe. It calls the exact native media operations, targets the
  approved parent directly only when every requested tool is media, returns
  bounded readback evidence, and reuses stable per-media idempotency keys.
- No URL-text or simulated RemNote result is accepted as live media proof.

## Local repair verification

- TDD media probe: first run reports `inserted`; the identical retry reports
  `already_applied` for image, audio, and video.
- Full unit suite: 39 files, 346 tests passed.
- Typecheck, validation, plugin build, server build, server smoke, security,
  boundaries, tool schemas, idempotency, hosted routing, connector routing,
  Codex routing, 76-tool profile, and health routing passed.

Repair status: `READY_FOR_EXACT-SHA_DEPLOY`.

Stage 6 status remains `BLOCKED` until the repair commit is deployed and the
connected RemNote media probe plus native render/player/playback confirmation
are recorded here.
