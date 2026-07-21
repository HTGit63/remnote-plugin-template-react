# RemNote MCP — Build Week Engineering Audit

Date: 2026-07-21

Branch: `judges/openai-build-week-v0.1.1`

Code/deployment baseline audited: `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb`

## Verdict

RemNote MCP is a real, non-trivial MCP and RemNote desktop integration with a
large tested tool surface, explicit permission boundaries, resumable state,
native RemNote structures, and connected mutation evidence. The uploaded MP3
and MP4 paths are implemented, registered, deployed, and now live-proven from
ChatGPT file input through persistent hosting, RemNote SDK mutation, tool
verification, independent child readback, and raw native rich-text readback.

The earlier blocker was an old client discovery snapshot. After the hosted
default and discovery updates were deployed and the app metadata refreshed,
the current conversation exposed and successfully invoked both file tools. No
additional media implementation change was required for the final acceptance.

The repository is ready for judge evaluation through **Develop from
localhost**, subject to these honest boundaries:

- this campaign did not live-mutate all 79 public tools;
- the earlier mislabeled WebM fixture remains a correctly rejected input;
- native media readback still needs a human rendering/playback check;
- the hosted-media origin is public-by-URL and is not for confidential files;
- the personal PostgreSQL deployment has no aggregate per-owner quota yet.

## Audit method and proof boundaries

The audit used repository history, current source, generated registry metadata,
focused and full automated tests, a raw hosted MCP `tools/list`, live bridge
diagnostics, connected RemNote reads and media writes, independent readback,
local file inspection, Devpost project data, and official OpenAI Apps SDK
documentation.

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

- deployment commit `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb`;
- plugin connected and synchronized;
- active `developer` profile with full workspace/trusted write access;
- registry/schema/discovery version
  `2026-07-21.hosted-media-file-schemas-v2`;
- 79 public server tools and no raw-registry mismatch;
- RemNote Plugin SDK `0.0.46` with audio and video rich-text capability.

### What the current conversation exposes

The refreshed client exposes all three uploaded-file actions. The bridge
reported 79 public developer tools, no registry mismatch, no required connector
refresh, one connected plugin, and RemNote audio/video SDK capability. Both
`insert_audio_from_file` and `insert_video_from_file` were invoked successfully
against `Plugin Test`.

This confirms the previous 77-tool result was stale client metadata rather
than missing server implementation. The documented recovery remains important
for future schema changes: redeploy, refresh the app, and start a new
conversation before diagnosing a newly registered action as absent.

### File truth

The final supplied audio fixture, `fiesta.mp3`, was inspected directly:

| Property | Value |
| --- | --- |
| Size | `1,481,572` bytes |
| Container/codec | MPEG Layer III with ID3 metadata |
| Bitrate | 64 kbps |
| Sample rate | 44.1 kHz |
| Channels | stereo |
| Duration | about 84.79 seconds |
| SHA-256 | `82f6e9058205f3d3469807f2a79c6f285b32ee432c2a4417785eea5a0626d074` |
| Loader limit | 25 MiB |

The final video fixture, `file_example_MP4_480_1_5MG.mp4`, is a genuine
1,570,024-byte ISO MP4 with H.264 video, AAC audio, a duration of about 30.53
seconds, and SHA-256
`71944d7430c461f0cd6e7fd10cee7eb72786352a3678fc7bc0ae3d410f72aece`.

The earlier `.mp4`-named fixture contained Matroska/WebM with VP8 and was
correctly rejected. Accepting the genuine MP4 and rejecting the mislabeled
WebM proves the loader validates bytes rather than trusting the extension.

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
| SEC-DEP-02 | Low | Accepted platform boundary | Server tooling retains an `esbuild` Windows development-server file-read advisory; it is outside the Linux hosted path. |
| SEC-DEP-03 | High | Fixed | `fast-uri` 3.1.2 had an IDN host-confusion advisory; the lockfile now resolves 3.1.4. |
| SEC-DEP-04 | Moderate | Accepted platform boundary | The MCP SDK currently resolves `@hono/node-server` 1.19.14, which has a Windows encoded-backslash `serve-static` advisory. The deployment is Linux, and npm's proposed fix is a forced breaking SDK downgrade. |

No known critical or unaccepted high-severity finding remains in the audited
media path. The remaining Windows-only transitive findings and the rejected
forced downgrade are recorded in the benchmark.

## Current connected proof

The focused target was Rem `OjLcSppWfIH0cpPoh` (`Plugin Test`). Current calls
passed for bridge status, plugin status, focused Rem, direct children, direct
Rem reads, and raw-rich-text diagnostics.

The live timing benchmark used one warm-up plus ten measured calls for four
representative routes. All bridge, ping, and focused-Rem calls returned PASS.
Nine of ten current-selection responses produced the normal structured status;
one client response lacked the structured envelope and is reported as an
outlier, not silently discarded. Full timings are in [BENCHMARKS.md](BENCHMARKS.md).

The final acceptance created exactly two media children:

| Workflow | Created Rem | Native readback |
| --- | --- | --- |
| `insert_audio_from_file` with `fiesta.mp3` | `C4AUcbO4uXbJkAMZp` | media node `i: "a"`, `onlyAudio: true`, hosted URL matched |
| `insert_video_from_file` with a genuine H.264/AAC MP4 | `QyPyn0Ch6C6NdStoO` | media node `i: "a"`, `onlyAudio: false`, hosted URL matched |

Both tools returned `PASS`, found the created Rem, matched the media kind and
URL, and retained the persistent hosted dependency. Independent `get_children`
confirmed both IDs under `Plugin Test`; separate `get_rem` and raw-rich-text
calls also returned `PASS`. No existing Rem was modified, moved, formatted, or
deleted.

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
| `e465ecf` | Jul 21 | Finalize the first media evaluation package |
| `bc2e142` | Jul 21 | Make the hosted bridge the extension default |

The `main` branch also contains `f6f043f` (`feat: reconcile production auth and
hosted media`), which is not part of this judge branch's linear history and is
therefore not counted above.

## Release history

| Evidence | Value |
| --- | --- |
| `v0.1.0` peeled commit | `c0a6ff9187debcad04d1f30f2b509bedd862e508` |
| `v0.1.1` peeled commit | `417218945879148b842e16a465c0a8ac639b9985` |
| Current judge source before final documentation | `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb` |

The evaluation path is the current source branch loaded through RemNote
desktop's **Develop from localhost** workflow at `http://localhost:8080`.

## Final acceptance checklist

Already completed in this audit:

- compare local, remote branch, deployed SHA, raw `tools/list`, and current
  client snapshot;
- inspect the exact MP3 and genuine MP4 fixtures;
- run focused ChatGPT/media tests;
- run current connected read-only and timing checks;
- insert uploaded MP3 and MP4 files through the hosted bridge;
- independently read both native media Rems back;
- review SSRF, bytes, MIME, redirects, auth, scope, ownership, error redaction,
  and active-content boundaries;
- consolidate the old stage and media audits into this document.

Judge or owner UI follow-up:

1. Pull the final judge branch and use **Develop from localhost**.
2. Refresh the ChatGPT Developer Mode app if its tool list is older than the
   deployed registry.
3. Run the bounded read prompt before approving writes.
4. Confirm visible image rendering and audio/video playback in RemNote.
5. Monitor PostgreSQL usage and retained hosted dependencies.
6. Do not broaden access or claim public listing from these results.

## Primary references

- [OpenAI Apps SDK: build an MCP server](https://developers.openai.com/apps-sdk/build/mcp-server)
- [OpenAI Apps SDK reference](https://developers.openai.com/apps-sdk/reference)
- [OpenAI Apps SDK deployment workflow](https://developers.openai.com/apps-sdk/deploy)
- [RemNote RichTextNamespace](https://plugins.remnote.com/api/classes/RichTextNamespace)
- [Generated current tool reference](../TOOL_REFERENCE.md)
- [All-tool benchmark and verification](BENCHMARKS.md)
