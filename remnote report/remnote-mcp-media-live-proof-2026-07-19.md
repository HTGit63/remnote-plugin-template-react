# RemNote MCP Media Live Proof — 2026-07-19

Branch: `fix/remnote-mcp-mass-note-creation-stability`

HEAD: `ebc99df6901356b055a425b5909e8d0b5829d5cf`

Deployment SHA: `ebc99df6901356b055a425b5909e8d0b5829d5cf`

Plugin build SHA: `NOT_RUNTIME_OBSERVABLE` — plugin status reports SDK/runtime
capabilities but does not embed a separate build SHA.

SDK version: `0.0.46`

Approved root: `Stage 6 Exact Release Proof — 2026-07-19 — aff5cbb`
(`Tmbge6Mza34dYR7q5`) beneath focused `Plugin Test` (`OjLcSppWfIH0cpPoh`)

Image URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg` (`HTTP 200`, `image/jpeg`)

Image mutation ID: `bQae0xzHsWdZts6y7`

Image readback: `PASS` — raw rich text contains native image payload
`{"i":"i","url":"https://interactive-examples.mdn.mozilla.net/media/cc0-images/grapefruit-slice-332-332.jpg"}`.

Image visual result: `PENDING_USER_VISIBLE_CONFIRMATION`

Image idempotency repeat: `PASS` — operation `health-mrrrko2h` returned
`already_applied` with the same Rem ID and child index `7`.

Audio URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3` (`HTTP 200`, `audio/mpeg`)

Audio mutation ID: `9OBzXKeko2dIwWx4V`

Audio readback: `PASS` — raw rich text contains native audio payload
`{"i":"a","url":"https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3","onlyAudio":true}`.

Audio player result: `PENDING_USER_VISIBLE_CONFIRMATION`

Audio idempotency repeat: `PASS` — operation `health-mrrrko2h` returned
`already_applied` with the same Rem ID and child index `8`.

YouTube URL: `https://www.youtube.com/watch?v=jNQXAC9IVRw` (`HTTP 200`)

YouTube mutation ID: `vR0GEHXOXGjQiBe9E`

YouTube readback: `PASS` — raw rich text contains native video payload
`{"i":"a","url":"https://www.youtube.com/watch?v=jNQXAC9IVRw","onlyAudio":false}`.

YouTube playback/embed result: `PENDING_USER_VISIBLE_CONFIRMATION`

YouTube idempotency repeat: `PASS` — operation `health-mrrrko2h` returned
`already_applied` with the same Rem ID and child index `9`.

Direct video URL: `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4` (`HTTP 200`, `video/mp4`)

Direct video mutation ID: `TAaM36oxyhKUPAOTc`

Direct video readback: `PASS` — raw rich text contains native video payload
`{"i":"a","url":"https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4","onlyAudio":false}`.

Direct video idempotency repeat: `PASS` — operation `health-mrrrkws8`
returned `already_applied` with the same Rem ID and child index `10`.

Direct video playback result: `PENDING_USER_VISIBLE_CONFIRMATION`

Limitations:

- Exact deployment, local HEAD, and origin all match
  `ebc99df6901356b055a425b5909e8d0b5829d5cf`.
- Live server exposes 76 tools with registry/schema version
  `2026-07-19.connector-media-proof`.
- Connected plugin reports initial sync complete and native
  `plugin.richText.image`, `.audio`, and `.video` support.
- Codex app snapshot remains at 72 descriptors. The compatibility path through
  `run_bridge_health_check` invoked the exact three native media operations.
- First operation `health-mrrrkbe3` passed all three writes and exact readback.
- Identical retry `health-mrrrko2h` passed all three as `already_applied`.
- Direct-video operations `health-mrrrkvj0` and `health-mrrrkws8` passed insert
  and idempotent replay.
- Independent `get_rem_rich` calls confirmed native media payload type, exact
  URL, and audio/video discriminator for every created Rem.
- Independent child listing found exactly one of each expected Rem ID at child
  indexes `7`, `8`, `9`, and `10`; no retry duplicates appeared.
- Native visual render and player playback remain user-visible proof. MCP
  readback cannot truthfully infer pixels or sound.

Overall media verdict: `LIVE_MCP_PASS_VISUAL_CONFIRMATION_PENDING`.

## Root cause and deployed repair

- Before the repair, exact deployed server
  `aff5cbb71b4818c3e0e218d56355217099382904` returned 76 tools from
  `tools/list`, while the connected Codex app snapshot exposed only 72.
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

Repair status: `EXACT-SHA_LIVE_PROVEN`.

Stage 6 automated, connector, plugin, mutation, readback, and idempotency gates
pass. Completion remains pending only native render/player/playback confirmation
inside RemNote.
