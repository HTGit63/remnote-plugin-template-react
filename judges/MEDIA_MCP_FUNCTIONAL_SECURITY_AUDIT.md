# Media MCP Functional and Security Audit

Date: 2026-07-21
Branch: `judges/openai-build-week-v0.1.1`

## Outcome

The hosted ChatGPT image path and native YouTube/video path are implemented and
locally verified. No known critical or high-severity security finding remains
in the reviewed path. Connected deployment, real PostgreSQL, and visible
RemNote rendering/playback are intentionally not claimed by this report.

The installed RemNote SDK exposes `richText.image(url, width?, height?)`, not a
binary upload API. Successful image readback therefore proves that RemNote
stores a native URL-backed image, but it does not prove that RemNote copied the
bytes. Deleting the PostgreSQL asset after that success would break cold-cache
or another-device rendering. The tool now reports this state explicitly as
`retained_remote_dependency`.

## Functional audit

### ChatGPT image file flow

1. `insert_image_from_file` declares the official top-level ChatGPT file input
   with `_meta["openai/fileParams"]` and requires a stable idempotency key
   (`server/src/tools/register-media-tools.ts:54`).
2. File ingestion requires hosted OAuth, validates the file reference, sanitizes
   the file name, and recognizes only PNG, JPEG, WebP, or GIF byte signatures
   (`server/src/media/hosted-image-loader.ts:54`).
3. Remote retrieval requires HTTPS on port 443, rejects embedded credentials and
   private/special IP ranges, filters mixed DNS results to validated public
   addresses, pins one public address for the connection, revalidates redirects,
   and enforces redirect, time, and byte limits
   (`server/src/security/safe-remote-download.ts:22`).
4. PostgreSQL stores an opaque UUID, owner, idempotency key, source file ID,
   SHA-256, verified MIME, safe file name, and exact bytes
   (`server/src/storage/postgres-store.ts:164`).
5. The public route accepts only UUIDv4 asset paths and GET/HEAD, is rate-limited,
   and serves the verified type with `nosniff`, restrictive CSP, no referrer, and
   intentional cross-origin access for RemNote rendering
   (`server/src/server/create-http-server.ts:57`,
   `server/src/server/create-http-server.ts:609`).
6. The bridge calls native `insert_image_from_url`, whose plugin implementation
   uses `plugin.richText.image` and exact rich-text readback. Plain text URLs do
   not count as success (`src/remnote/write/mediaWrites.ts:116`).

### Hosted-byte lifecycle

- Successful exact URL readback returns `retained_remote_dependency`; the bytes
  stay available because the RemNote image still references them
  (`server/src/media/hosted-image-service.ts:139`).
- A newly created asset is deleted after a definitive no-write failure. The
  deletion is owner-scoped and parameterized by both asset ID and owner ID
  (`server/src/media/hosted-image-service.ts:162`,
  `server/src/storage/postgres-store.ts:738`).
- Unknown write status, unresolved partial execution, and pre-existing/replayed
  assets are retained. This prevents cleanup from converting an uncertain
  successful write into a broken image.
- The current 1 GB database is suitable only with usage monitoring. The default
  image cap is 10 MiB per file; there is no aggregate hosted-media quota in this
  release.

### YouTube and video flow

- `insert_video_from_url` remains a first-class default-profile tool, accepts a
  bounded HTTP(S) YouTube or direct-video URL, calls
  `plugin.richText.video`, and verifies the native rich-text representation.
- Its tool description explicitly forbids treating a plain URL Rem as an embed
  (`server/src/tools/register-media-tools.ts:236`).
- Actual playback still needs the connected RemNote test because structured
  readback is not human-visible playback proof.

## Functional verification

| Gate | Result |
|---|---|
| Vitest suite | PASS: 43 files, 368 tests |
| TypeScript | PASS: root and server builds |
| RemNote SDK validation | PASS |
| Hosted-image focused tests | PASS: byte validation, SSRF boundaries, owner-scoped deletion, public serving, retention states |
| Area 1 full MCP contract | PASS from compiled JavaScript |
| Boundary, schema, and default-profile checks | PASS from compiled JavaScript |
| Area 3 hosted contract | PASS from compiled JavaScript |
| Area 3 socket/runtime certification | BLOCKED by sandbox socket policy (`listen EPERM`) |
| Real PostgreSQL media write/delete | NOT RUN: no local `DATABASE_URL`; production credentials were not requested or inferred |
| Connected ChatGPT + RemNote rendering/playback | NOT RUN: reserved for the post-deployment live test |

## Security audit

### Controls verified

- Hosted OAuth, write scope, trusted-write mode, and current-tree scope remain
  mandatory for `insert_image_from_file`
  (`server/src/tool-permissions.ts:88`, `server/src/tool-permissions.ts:200`).
- SQL values are parameterized. The hosted-media delete cannot target another
  owner (`server/src/storage/postgres-store.ts:685`).
- SSRF defenses cover private IPv4, IPv4-mapped IPv6, NAT64, special-use ranges,
  redirect revalidation, DNS pinning, TLS, timeout, and byte ceilings.
- SVG and caller-claimed MIME types are not trusted. The response uses the MIME
  detected from supported byte signatures and includes `nosniff`.
- Public asset IDs are random UUIDv4 values. The route does not reveal owner,
  file ID, original download URL, idempotency key, or hash.
- Temporary ChatGPT download URLs are not passed to the RemNote plugin and are
  not returned in tool output.
- Unexpected exception messages are now redacted from MCP responses and server
  logs (`server/src/tools/tool-context.ts:533`,
  `server/src/tools/register-media-tools.ts:185`).
- Repository secret scanning found only documented example credentials and the
  isolated CI test database credential. No real token, database URL, or private
  key was found.

### 2026-07-21 remote-host repair

- Root cause 1: adding IPv4-mapped IPv6 subnet `::ffff:0:0/96` to Node's shared
  `BlockList` also matched ordinary IPv4 checks, so public IPv4 download hosts
  were incorrectly reported as non-public.
- Root cause 2: a mixed DNS response was rejected when any answer was
  non-public, even though the connection is pinned to one selected address.
- Repair: mapped IPv6 addresses remain explicitly rejected, DNS answers are
  filtered to public addresses, the first validated public answer is pinned,
  and a host with no public answer still fails with `REMOTE_HOST_BLOCKED`.
- Regression proof exercises the real DNS-selection and pinned-request path;
  it verifies public IPv4, mixed public/private answers, and private-only
  blocking. No hostname allowlist or private-network bypass was added.

### Findings and residual risks

| ID | Severity | Status | Finding |
|---|---|---|---|
| SEC-MEDIA-01 | High | Fixed | Raw unexpected exception text could appear in MCP structured output. It is now replaced with a generic internal error and safe layer code. |
| SEC-MEDIA-02 | Medium | Accepted for current personal deployment | There is a per-image limit but no aggregate or per-owner byte quota. An authenticated writer could exhaust a small PostgreSQL plan. Monitor usage and add an atomic aggregate quota before broader multi-tenant use. |
| SEC-MEDIA-03 | Medium | Required architecture boundary | Asset URLs are public bearer-like UUID URLs because RemNote must fetch them. Do not use this path for confidential images. |
| SEC-MEDIA-04 | Low | Documented | Successful assets cannot be automatically deleted while RemNote readback still contains the bridge URL. The new lifecycle status prevents false deletion claims. |
| SEC-MEDIA-05 | Informational | Blocked external check | Online `npm audit` could not resolve `registry.npmjs.org` in the sandbox. Root and server offline-cache audits each reported zero vulnerabilities; rerun online in CI/deployment. |
| SEC-MEDIA-06 | High | Fixed | The IPv4-mapped IPv6 `BlockList` entry caused public IPv4 file hosts to fail as non-public. Mapped IPv6 is now rejected explicitly, public IPv4 is accepted, and the request remains pinned to a validated public answer. |

## Live acceptance checklist

After deploying this commit:

1. Confirm the server reports the new Git SHA and lists
   `insert_image_from_file`, `insert_image_from_url`, and
   `insert_video_from_url` in the active profile.
2. Use a disposable RemNote parent and insert a ChatGPT-generated PNG.
3. Require a successful MCP response, a native image rich-text readback, and
   visible rendering after reopening the note or using another device.
4. Confirm the result says `cleanupStatus: retained_remote_dependency` while
   `remnoteStillReferencesHostedUrl` is true.
5. Trigger a safe missing-parent test with a new idempotency key and verify the
   result says `deleted_unreferenced_after_failure`; confirm its asset route is
   no longer available.
6. Insert a YouTube lesson with `insert_video_from_url`; require native video
   readback and human playback. A plain text link is a failure.
7. Run online dependency audit and inspect PostgreSQL usage before widening
   access.

## Primary references

- [OpenAI Apps SDK MCP server guide](https://developers.openai.com/apps-sdk/build/mcp-server/)
- [OpenAI Apps SDK reference](https://developers.openai.com/apps-sdk/reference/)
- [Model Context Protocol tool specification](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- [RemNote RichTextNamespace](https://plugins.remnote.com/api/classes/RichTextNamespace)
