# RemNote MCP — Build Week Engineering Audit

Date: 2026-07-21

Branch: `judges/openai-build-week-v0.1.1`

Code/deployment baseline audited: `4a5ee394ee536e3ccebbe141dd9d3a6856c16967`

## Verdict

RemNote MCP is a real, non-trivial MCP and RemNote desktop integration with a
large tested tool surface, explicit permission boundaries, resumable state,
native RemNote structures, and connected-plugin evidence. The uploaded MP3 and
MP4 server paths are implemented, registered, deployed, and covered by focused
tests. The final reported failure is a client-discovery issue: the current
conversation retained an older 77-tool snapshot even after the deployed server
started returning 79 tools.

No additional application/media patch was justified during this audit. The
correct recovery is to refresh the Developer Mode app and start a new
conversation. Changing the media code again would not update an already-open
chat. The only runtime dependency change is a minimal lockfile security update
for the audited `body-parser` advisory.

The repository is ready for judge evaluation through **Develop from
localhost**, subject to these honest boundaries:

- this pass performed read-only connected checks, not 79 live mutations;
- `insert_audio_from_file` and `insert_video_from_file` still need a fresh-chat
  connected acceptance run after the app refresh;
- the reported `.mp4` fixture was actually Matroska/WebM with VP8 and is not a
  valid MP4 input;
- native media readback still needs a human rendering/playback check;
- the hosted-media origin is public-by-URL and is not for confidential files;
- the personal PostgreSQL deployment has no aggregate per-owner quota yet.

## Audit method and proof boundaries

The audit used repository history, current source, generated registry metadata,
focused and full automated tests, a raw hosted MCP `tools/list`, live bridge
diagnostics, read-only connected RemNote calls, prior retained connected test
results, local file inspection, Devpost project data, and official OpenAI Apps
SDK documentation.

Evidence is labelled by layer:

| Layer | What it can prove |
| --- | --- |
| Static/source | Intended architecture, guards, and registered contracts |
| Local automated | Deterministic code behavior under test doubles and local processes |
| Server-local simulation | MCP schemas, profiles, routing, idempotency, and state-machine behavior without a real knowledge base |
| Hosted discovery | What the deployed server advertises to a fresh MCP client |
| Connected read-only | Real server → WebSocket → RemNote plugin → SDK read path |
| Connected mutation/readback | A real write and the native structure later returned by RemNote |
| Human UI check | Visible rendering, playback, and interaction quality |

No lower layer is presented as proof of a higher layer.

## Before Build Week

The repository already had a broad foundation before the event: a React
RemNote plugin, a Node MCP bridge, read/write tools, Markdown hierarchy,
formatting, cards, and an early bulk-import workflow. Codex had already been
part of the development process. This submission does not claim that the whole
project was created from zero during Build Week.

The event work turned that broad prototype into a safer and more verifiable
system. The largest changes were state-machine reliability, source fidelity,
connection ownership, tool-policy clarity, post-write proof, release hygiene,
and native media.

## Build Week engineering sequence

### Reliability and state

The first remediation pass repaired import job revisions, legal transitions,
stable mutation identities, cancellation, no-replay behavior, unknown-outcome
reconciliation, and exact node budgeting. Later connected tests found that
deep and width-limited readback could still truncate a correct write. Commits
`0e665e0`, `f314c8f`, and `aff5cbb` closed those gaps with regressions.

### Native RemNote structure

The project strengthened rich text, formula, heading, highlight, Concept,
Descriptor, card, and design-verification paths. Unsupported SDK behavior was
made explicit instead of being reported as a successful approximation. Plain
Markdown or a plain URL is never accepted as proof of a native structure.

### Connection and judge experience

The plugin connection was moved out of a sidebar-dependent lifecycle and into
the persistent plugin runtime. Local development gained a supervised service,
status, and doctor commands. The sidebar was reduced to the choices a person
actually needs: connection, scope, writing access, style, pairing, and health.

### URL media

Image, audio, YouTube, and direct-video URL tools were designed before
implementation. They use dedicated media children, native RemNote rich-text
builders, stable idempotency, scope and permission checks, typed SDK failures,
and exact readback. A 15-scenario connected campaign drove follow-up repairs;
retained evidence includes visible image rendering and audio/video playback.

### Uploaded file media

The later hosted-media work added the missing bridge between temporary ChatGPT
uploads and RemNote's URL-only media builders:

```text
authorized ChatGPT file object
→ HTTPS download with SSRF controls
→ byte-signature and size validation
→ owner-scoped PostgreSQL asset
→ opaque immutable HTTPS URL
→ native RemNote image/audio/video builder
→ exact rich-text readback
→ retain dependency or delete definitive orphan
```

Raster image upload was repaired first. The same generic pipeline was then
extended to MP3 audio and MP4 video in `66904f8`. File schemas and discovery
versioning were refreshed in `4a5ee39`.

## MP3 and MP4 diagnosis

### What the code and deployed server expose

The audited raw hosted `tools/list` returned 79 developer-profile tools. Both
file tools were present with top-level OpenAI file parameters:

- `insert_audio_from_file` → `_meta["openai/fileParams"] = ["audioFile"]`
- `insert_video_from_file` → `_meta["openai/fileParams"] = ["videoFile"]`

Each input object declares `download_url`, `file_id`, `mime_type`, and
`file_name`; `download_url` and `file_id` are required. Hosted OAuth scopes and
non-destructive/idempotent annotations are present. The live bridge reported:

- deployment commit `4a5ee394ee536e3ccebbe141dd9d3a6856c16967`;
- plugin connected and synchronized;
- active `developer` profile with full workspace/trusted write access;
- registry/schema/discovery version
  `2026-07-21.hosted-media-file-schemas-v2`;
- 79 public server tools and no raw-registry mismatch;
- RemNote Plugin SDK `0.0.46` with audio and video rich-text capability.

### What the current conversation exposes

The already-open client tool snapshot contained 77 tools. It included
`insert_image_from_file` and all three URL media tools, but not
`insert_audio_from_file` or `insert_video_from_file`. A session cannot invoke a
tool absent from its loaded registry, even when the server has since changed.

The OpenAI Apps SDK deployment workflow requires rebuilding/restarting the MCP
server and refreshing the app after a tool change. A new conversation is also
needed to obtain the new tool snapshot. This is the remaining operational fix.

### File truth

The supplied `NEW LINEN 新しいリネン.mp3` was inspected directly:

| Property | Value |
| --- | --- |
| Size | `2,970,931` bytes |
| Container/codec | MPEG Layer III |
| Bitrate | 192 kbps |
| Sample rate | 44.1 kHz |
| Channels | stereo |
| Duration | about 116.09 seconds |
| Loader limit | 25 MiB |

It is a valid supported fixture. The reported video sample had an `.mp4`
filename but was identified as Matroska/WebM with VP8. The MP4 loader checks the
actual `ftyp` container and accepted brands, so rejecting that file is correct.
The next live test must use a real MP4.

### Why successful bytes are not deleted immediately

The installed RemNote SDK exposes URL media builders, not a binary upload API.
After successful readback, RemNote still references the bridge URL. Deleting
the PostgreSQL bytes would break cold-cache or another-device rendering. The
result therefore reports `retained_remote_dependency`.

A new asset is deleted only after a definitive plugin no-write failure.
Unknown write status, partial execution, and existing replayed assets are
retained because cleanup could otherwise turn a successful write into broken
media.

## Architecture review

The architecture review found no reason for a major rewrite. The current seams
match the problem:

- `tool-registry.ts` is the canonical declared/public inventory;
- `tool-policy.ts` owns profile, risk, SDK, warning, and timeout metadata;
- `register-media-tools.ts` owns MCP file descriptors and orchestration;
- `hosted-image-loader.ts` validates image, MP3, and MP4 bytes;
- `safe-remote-download.ts` owns remote-network policy;
- storage providers own durable jobs and owner-scoped hosted assets;
- `mediaWrites.ts` owns native plugin builders and readback;
- the bridge runtime owns persistent RemNote connectivity.

The image-era filenames now contain generic media types, which is slightly
awkward, but they are cohesive and tested. Renaming them during a final media
repair would add churn without changing behavior. A future cleanup can rename
the module with no protocol change.

The next meaningful architecture additions are operational rather than a new
abstraction layer: aggregate per-owner quota, asset lifecycle/admin controls,
and optional isolated SVG rasterization if there is real demand.

## Security audit

### Controls verified

- Hosted file ingestion requires authenticated OAuth, read scope, approved
  current-tree scope, and trusted write access.
- Remote URLs require HTTPS on port 443 without embedded credentials.
- DNS results are filtered to public addresses and one validated address is
  pinned for the TLS request. Redirects are resolved and revalidated.
- Loopback, private, link-local, carrier-grade NAT, documentation, mapped IPv6,
  NAT64, multicast, and other special-use ranges are blocked.
- Content length, streamed byte count, time, redirect count, MIME signature,
  and safe filename length are bounded.
- Images accept PNG/JPEG/WebP/GIF bytes; audio accepts MP3 frames; video accepts
  MP4 `ftyp` containers. Claimed MIME and filename extensions are not trusted.
- SVG is rejected because active XML on the shared media origin would weaken
  the boundary without sanitization or isolated rasterization.
- SQL values are parameterized. Asset reuse and deletion are owner-scoped.
- Asset routes accept opaque UUIDv4 paths and GET/HEAD, serve verified types,
  support byte ranges for audio/video, and set `nosniff`, CSP, referrer, and
  cross-origin headers required by RemNote.
- Temporary ChatGPT download URLs, owners, hashes, tokens, and database details
  are not returned in normal tool results. Unexpected exception messages are
  redacted.

### Repair retained from the image campaign

An IPv4-mapped IPv6 subnet in Node's shared `BlockList` accidentally matched
ordinary IPv4 checks, causing public image hosts to be rejected. Mixed DNS
answers were also rejected too broadly. The fix keeps mapped IPv6 rejection in
a separate check, filters public answers, pins a public address, and still
rejects hosts with no safe answer. Tests cover public IPv4, mixed answers,
private-only answers, mapping, redirects, and pinned lookup. No private-network
bypass or broad hostname allowlist was introduced.

### Findings

| ID | Severity | Status | Finding |
| --- | --- | --- | --- |
| SEC-MEDIA-01 | High | Fixed | Unexpected exception text could reach structured MCP output; it is now redacted with a safe layer code. |
| SEC-MEDIA-02 | High | Fixed | Shared mapped-IPv6 blocking caused public IPv4 hosts to fail; separate checks restored public IPv4 without weakening SSRF controls. |
| SEC-MEDIA-03 | Medium | Accepted boundary | RemNote must fetch a public opaque URL. Do not use hosted file media for confidential content. |
| SEC-MEDIA-04 | Medium | Open operational limit | Per-file limits exist, but the personal 1 GB PostgreSQL deployment has no aggregate per-owner quota. Monitor usage before broader access. |
| SEC-MEDIA-05 | Low | Documented | Referenced assets cannot be deleted automatically while RemNote depends on their URLs. |
| SEC-MEDIA-06 | Low | Intentional | SVG and mislabeled/non-MP4 video are rejected; conversion must happen outside the trusted media origin. |
| SEC-DEP-01 | Low | Fixed | Server `body-parser 2.2.2` was updated to `2.3.0`; production dependency audits now report zero. |
| SEC-DEP-02 | Low | Accepted dev-only | Current root/server test tooling retains an `esbuild` Windows development-server advisory; it is outside the Linux hosted production path and was not force-upgraded. |

No known critical or unaccepted high-severity finding remains in the audited
media path. Dependency-audit results are recorded fresh in the benchmark.

## Current connected read-only proof

The focused target was Rem `OjLcSppWfIH0cpPoh` (`Plugin Test`). Current calls
passed for bridge status, plugin ping, current selection, focused Rem, direct
Rem read, children, breadcrumbs, rich text, bounded tree, document/folder tree,
workspace search, raw-rich-text diagnostics, and read-only health check.

The live timing benchmark used one warm-up plus ten measured calls for four
representative routes. All bridge, ping, and focused-Rem calls returned PASS.
Nine of ten current-selection responses produced the normal structured status;
one client response lacked the structured envelope and is reported as an
outlier, not silently discarded. Full timings are in [BENCHMARKS.md](BENCHMARKS.md).

No Rem was created, updated, moved, formatted, or deleted by this audit.

## Codex contribution and session inventory

Codex was the engineering loop: inspect source and runtime evidence, write or
update the execution contract, add failing regressions, implement a narrow
repair, run focused and broad verification, test the deployed/connected path,
and revise the diagnosis when a lower layer passed but the product still did
not work.

Primary `/feedback` session:

| Session ID | Contribution |
| --- | --- |
| `019f761b-7a26-7413-a2b1-99112f18888d` | Main media-first implementation, full regression, live-proof recovery, release engineering, and judge-package work |

Material supporting sessions found in the local Codex record:

| Session ID | Contribution |
| --- | --- |
| `019f5d24-d695-7fb0-95b5-d2ab1d53909e` | Reliability remediation roadmap, staged implementation, and UI completion |
| `019f5d50-c156-7180-bfa7-b1b206a05c26` | Design/template subsystem work |
| `019f5d51-06dc-71c2-9b97-5af2c4ec5b7e` | Import chunking and resumable-state work |
| `019f5d51-81cd-7133-a25a-23e2eef804fe` | Import state and failure-boundary audit |
| `019f6adb-7b3e-7281-a205-0f2e2e421458` | Version 0.1 candidate finalization |
| `019f6b69-d44e-7703-959e-49def137a2a8` | Connection lifecycle root-cause work |
| `019f705a-663f-7ab2-8b19-a16d136c0273` | Architecture review; no production edit claimed |
| `019f7524-7371-74c0-9b2b-b03502a6e41c` | Media-first execution contract and proof boundaries |
| `019f7f1a-d109-7f22-8873-1328d35c8239` | Unified authentication and uploaded media campaign through schema refresh |
| `019f84ff-c2ed-7e22-8889-aea723102e48` | Hosted-media security architecture review |
| `019f8531-0712-7523-ae93-357e297a4531` | Generic image/audio/video hosting architecture review |

This list reports material engineering sessions, not every short inquiry or
subprocess. Private transcript content is not reproduced.

## Commit ledger on the judge branch

There are 32 commits after the July 13 event cutoff on the audited branch
before this final documentation commit.

| Commit | Date | Recorded purpose |
| --- | --- | --- |
| `5f87e2b` | Jul 14 | Complete local remediation phases 1–7 |
| `466b808` | Jul 14 | Record phase completion evidence |
| `81eef93` | Jul 14 | Repair gaps found by live benchmarks |
| `a65ce2c` | Jul 14 | Close post-deployment regressions |
| `76c6e2d` | Jul 15 | Close release gaps and simplify plugin UX |
| `281df8b` | Jul 16 | Refine native sidebar and highlight proof |
| `5380dd5` | Jul 17 | Finalize version 0.1 candidate |
| `ffb6c02` | Jul 18 | Implement stages 1–3 URL media support |
| `ef34515` | Jul 18 | Verify stages 4–5 |
| `0709e8e` | Jul 19 | Keep local plugin dev server available |
| `f50a924` | Jul 19 | Restore sidebar selector |
| `b0b6f83` | Jul 19 | Restore index widget activation |
| `f38212d` | Jul 19 | Trigger exact-release deployment |
| `0e665e0` | Jul 19 | Preserve deep import readback |
| `f314c8f` | Jul 19 | Recover truncated import readback |
| `aff5cbb` | Jul 19 | Restore node-limited siblings |
| `ebc99df` | Jul 19 | Recover stale connector media proof |
| `ecaaaf4` | Jul 19 | Record exact-SHA media proof |
| `c0a6ff9` | Jul 19 | Prepare immutable `v0.1.0` package |
| `0f769be` | Jul 19 | Certify product-completion stages |
| `6ec88ce` | Jul 19 | Record publication gates |
| `a98d80b` | Jul 19 | Add release CI certification |
| `5a7e80f` | Jul 19 | Record exact-tree CI |
| `4172189` | Jul 19 | Publish clean `v0.1.1` source |
| `47d9111` | Jul 19 | Add evaluation guide and benchmarks |
| `b941eed` | Jul 19 | Record verified `v0.1.1` publication |
| `01d49be` | Jul 19 | Publish the first full judge record |
| `ecf3eb5` | Jul 20 | Unify ChatGPT and Codex authentication |
| `1fd3fe2` | Jul 20 | Add secure hosted-image lifecycle |
| `22ae223` | Jul 21 | Repair safe public hosted-image downloads |
| `66904f8` | Jul 21 | Add uploaded MP3 and MP4 media tools |
| `4a5ee39` | Jul 21 | Refresh ChatGPT file schemas and discovery |

The `main` branch also contains `f6f043f` (`feat: reconcile production auth and
hosted media`), which is not part of this judge branch's linear history and is
therefore not counted above.

## Release and artifact history

| Evidence | Value |
| --- | --- |
| `v0.1.0` peeled commit | `c0a6ff9187debcad04d1f30f2b509bedd862e508` |
| `v0.1.1` peeled commit | `417218945879148b842e16a465c0a8ac639b9985` |
| `0.1.1` artifact commit | `c8b65b990e5ca3ecdfb47f032c6f9acdd1c7890c` |
| Historical ZIP size | `630,748` bytes |
| Historical ZIP SHA-256 | `207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b` |

The ZIP remains immutable historical evidence. It is not the evaluation path
for the current judge branch. Judges should load the branch through RemNote's
localhost development workflow.

## Final acceptance checklist

Already completed in this audit:

- compare local, remote branch, deployed SHA, raw `tools/list`, and current
  client snapshot;
- inspect the exact MP3 and supplied PNG;
- run focused ChatGPT/media tests;
- run current connected read-only and timing checks;
- review SSRF, bytes, MIME, redirects, auth, scope, ownership, error redaction,
  and active-content boundaries;
- consolidate the old stage and media audits into this document.

Judge or owner live follow-up:

1. Pull the final judge branch and use **Develop from localhost**.
2. Refresh the ChatGPT Developer Mode app and start a new conversation.
3. Confirm that all 79 tools include `insert_audio_from_file` and
   `insert_video_from_file`.
4. Insert the valid MP3 under a disposable Rem with a stable key and require
   native audio readback plus human playback.
5. Insert a genuine MP4 fixture the same way; do not use the mislabeled WebM.
6. Confirm PostgreSQL usage and the retained dependency status.
7. Do not broaden access or claim App Store publication from these results.

## Primary references

- [OpenAI Apps SDK: build an MCP server](https://developers.openai.com/apps-sdk/build/mcp-server)
- [OpenAI Apps SDK reference](https://developers.openai.com/apps-sdk/reference)
- [OpenAI Apps SDK deployment workflow](https://developers.openai.com/apps-sdk/deploy)
- [RemNote RichTextNamespace](https://plugins.remnote.com/api/classes/RichTextNamespace)
- [Generated current tool reference](../TOOL_REFERENCE.md)
- [All-tool benchmark and verification](BENCHMARKS.md)
