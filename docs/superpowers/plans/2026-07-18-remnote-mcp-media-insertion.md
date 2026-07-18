# RemNote MCP Media Insertion Implementation Plan

> Execution date: 2026-07-18
> Stage boundary: this document completes Stage 2 design. Production implementation starts only in Stage 3.
> Execution mode: one primary agent; the user prohibited subagents.

## Goal

Add three first-class public MCP tools that insert URL-backed media into a new,
dedicated child Rem without replacing existing content:

- `insert_image_from_url`
- `insert_audio_from_url`
- `insert_video_from_url`

The first release accepts stable client-provided URLs. It does not generate,
upload, proxy, retain, or host media.

## Verified API and package basis

- Installed `@remnote/plugin-sdk@0.0.46` exposes:
  - `plugin.richText.image(url, width?, height?)`
  - `plugin.richText.audio(url)`
  - `plugin.richText.video(url)`
- The installed builder implementation serializes image as `{ i: "i", url,
  width?, height? }`, audio as `{ i: "a", url, onlyAudio: true }`, and video as
  `{ i: "a", url, onlyAudio: false }`.
- Installed `@modelcontextprotocol/sdk@1.29.0` accepts tool annotations through
  the repository's `BridgeToolAnnotations` model, including optional
  `idempotentHint`.
- Official OpenAI documentation confirms image generation returns image data
  and speech generation returns audio data/streams. Neither output is
  automatically a durable URL that this RemNote media contract can insert.
- RemNote documentation and installed typings are design evidence, not current
  connected-runtime proof.

## Public tool schemas

### Shared schemas

Add these exports to `server/src/tools/schemas.ts`:

```ts
export const MEDIA_URL_SCHEMA = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .transform((value, context) => {
    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        context.addIssue({ code: z.ZodIssueCode.custom, message: 'Media URL must use http or https.' });
        return z.NEVER;
      }
      return parsed.toString();
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'Media URL is malformed.' });
      return z.NEVER;
    }
  });

export const MEDIA_LABEL_SCHEMA = z.string().trim().min(1).max(500);
export const MEDIA_DIMENSION_SCHEMA = z.number().int().min(1).max(4096);
```

The URL transform canonicalizes the scheme/host/default port through the
platform URL parser but preserves path, query, and fragment. It rejects empty,
malformed, `javascript:`, `file:`, `data:`, and other non-HTTP(S) inputs. A
2048-character ceiling bounds bridge, logs, and SDK input. Image dimensions are
positive integers capped at 4096.

### `insert_image_from_url`

```ts
z.object({
  parentId: REM_ID_SCHEMA.describe('Parent Rem that receives a dedicated image child Rem.'),
  url: MEDIA_URL_SCHEMA.describe('Stable HTTP(S) image URL.'),
  position: POSITION_SCHEMA.describe('Insert the dedicated media child at the start or end.'),
  label: MEDIA_LABEL_SCHEMA.optional().describe('Optional plain-text label rendered after the image.'),
  width: MEDIA_DIMENSION_SCHEMA.optional().describe('Optional image width in pixels, 1-4096.'),
  height: MEDIA_DIMENSION_SCHEMA.optional().describe('Optional image height in pixels, 1-4096.'),
  idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate media children.'),
  verifyAfterWrite: z.boolean().default(true).describe('Read back and verify the media representation.'),
})
```

### `insert_audio_from_url`

```ts
z.object({
  parentId: REM_ID_SCHEMA.describe('Parent Rem that receives a dedicated audio child Rem.'),
  url: MEDIA_URL_SCHEMA.describe('Stable HTTP(S) audio URL.'),
  position: POSITION_SCHEMA.describe('Insert the dedicated media child at the start or end.'),
  label: MEDIA_LABEL_SCHEMA.optional().describe('Optional plain-text label rendered after the audio player.'),
  idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate media children.'),
  verifyAfterWrite: z.boolean().default(true).describe('Read back and verify the media representation.'),
})
```

### `insert_video_from_url`

```ts
z.object({
  parentId: REM_ID_SCHEMA.describe('Parent Rem that receives a dedicated video child Rem.'),
  url: MEDIA_URL_SCHEMA.describe('Stable HTTP(S) video or YouTube URL.'),
  position: POSITION_SCHEMA.describe('Insert the dedicated media child at the start or end.'),
  label: MEDIA_LABEL_SCHEMA.optional().describe('Optional plain-text label rendered after the video.'),
  idempotencyKey: IDEMPOTENCY_KEY_SCHEMA.optional().describe('Prevents duplicate media children.'),
  verifyAfterWrite: z.boolean().default(true).describe('Read back and verify the media representation.'),
})
```

Schemas stay strict through MCP Zod registration. No YouTube-specific parser is
added because the installed SDK accepts an ordinary URL.

## Shared protocol contract

Add to `shared/bridge/protocol-write-args.ts`:

```ts
export type MediaKind = 'image' | 'audio' | 'video';

export interface InsertMediaFromUrlArgs {
  parentId: string;
  url: string;
  position?: 'start' | 'end';
  label?: string;
  idempotencyKey?: string;
  verifyAfterWrite?: boolean;
}

export interface InsertImageFromUrlArgs extends InsertMediaFromUrlArgs {
  width?: number;
  height?: number;
}
```

Add to `shared/bridge/protocol-write-results.ts`:

```ts
export interface InsertMediaFromUrlResult {
  createdRemId: string;
  parentId: string;
  mediaKind: MediaKind;
  url: string;
  position: 'start' | 'end';
  insertIndex: number;
  status: 'inserted' | 'already_applied';
  idempotencyKey: string;
  label?: string;
  width?: number;
  height?: number;
  verification?: {
    attempted: boolean;
    createdRemFound: boolean;
    mediaKindMatched: boolean;
    urlMatched: boolean;
  };
}
```

Add all three names to `BridgeToolName`, `SafeWriteBridgeToolName`,
`BRIDGE_TOOL_NAMES`, `BRIDGE_TOOL_ANNOTATIONS`, `BridgeToolArgs`, and
`BridgeToolResults`. The MCP names and bridge names are identical, so
`server/src/mcp-tool-map.ts` needs no special case.

## MCP registration and annotations

Create `server/src/tools/register-media-tools.ts` with one explicit registration
per public tool. Each forwards its exact arguments through `callPlugin` and
uses `bridgeToolResult`.

Register the module in `server/src/mcp-server.ts` after basic writes and before
formatting/high-level tools.

All three annotations are:

```ts
{
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
}
```

Justification:

- `readOnlyHint: false`: a dedicated child Rem is created.
- `destructiveHint: false`: no existing Rem content is replaced, moved, or
  deleted.
- `idempotentHint: true`: a repeated explicit idempotency key and identical
  normalized payload returns the first created ID without a second mutation.
- `openWorldHint: true`: RemNote may fetch/render the remote HTTP(S) URL. The
  MCP server does not fetch it, but the operation deliberately introduces an
  external resource into RemNote.

## Registry, profile, permission, and capability-guide changes

- Add all three tools to `NOTE_WRITER_TIER_TOOLS`; do not expand the default
  `mass_note_writer` profile or the current ChatGPT submission tool list.
- Add explicit `meta(..., 'simple_write', 'medium', { supportsIdempotency:
  true, sdkCapability: 'plugin.richText.image' })`, `audio`, and `video`
  entries with their matching capability strings.
- Add each tool to `TOOL_PERMISSIONS` as a trusted write requiring
  `current-rem-tree` access.
- Add each bridge tool to plugin `SAFE_WRITE_TOOLS` and `CREATE_TOOLS`.
- Add the media tools and their URL-only boundary to the formatting/design
  section of `server/src/remnote-capability-guide.ts`.
- Regenerate `TOOL_REFERENCE.md`, `docs/tool-tier-summary.md`, and
  `docs/developer-diagnostics-reference.md`; update count snapshots that assert
  exact current registry totals.

## Plugin normalization and routing

### Validation helpers

Add to `src/bridge/handlers/validation.ts`:

```ts
export const MAX_MEDIA_URL_CHARS = 2048;
export const MAX_MEDIA_LABEL_CHARS = 500;
export const MAX_MEDIA_DIMENSION = 4096;

export function requiredMediaUrl(args: unknown): string;
export function optionalMediaLabel(args: unknown): string | undefined;
export function optionalMediaDimension(args: unknown, field: 'width' | 'height'): number | undefined;
```

`requiredMediaUrl` repeats the plugin-side trust-boundary validation and URL
canonicalization. It never trusts server-only Zod validation. Dimension and
label validation likewise reject invalid direct bridge traffic before any SDK
mutation.

### Argument routing

Add three explicit cases to `normalizeArgs` in
`src/bridge/handlers/args.ts`. Each uses `requiredParentId`,
`requiredMediaUrl`, `optionalAppendPosition`, `optionalMediaLabel`,
`optionalIdempotencyKey`, and `optionalBoolean`; image also uses the dimension
helper.

Add all three tools to the parent-target branch of `getStaticScopeTargetIds`
in `src/bridge/handlers/scope.ts`.

Import and route all three cases in `src/bridge/handlers.ts` to focused write
functions exported from `src/remnote/write/index.ts`.

## Runtime capability probes

Extend `RemnoteSdkCapabilityName` and the namespace union in
`shared/bridge/protocol-read.ts`:

```ts
| 'plugin.richText.image'
| 'plugin.richText.audio'
| 'plugin.richText.video'

namespace: 'app' | 'rem' | 'reader' | 'queue' | 'richText';
```

Add probes in `src/remnote/sdkCapabilities.ts` for the three builder functions.
These probes describe current runtime availability in status/health output.

The media write itself independently checks that its exact builder is a
function before creating a Rem. For example, a missing image capability throws:

```ts
new RemnoteWriteError(
  'SDK_UNSUPPORTED',
  'plugin.richText.image is not available in this RemNote runtime.',
  { capability: 'plugin.richText.image', mediaKind: 'image' }
)
```

The audio and video branches substitute their exact capability and media-kind
names.

Capability failure performs zero mutation.

## Shared media write module

Create `src/remnote/write/mediaWrites.ts`:

```ts
export async function insertMediaFromUrl(
  plugin: RNPlugin,
  mediaKind: MediaKind,
  args: InsertImageFromUrlArgs | InsertMediaFromUrlArgs
): Promise<InsertMediaFromUrlResult>;

export function insertImageFromUrl(plugin: RNPlugin, args: InsertImageFromUrlArgs): Promise<InsertMediaFromUrlResult>;
export function insertAudioFromUrl(plugin: RNPlugin, args: InsertMediaFromUrlArgs): Promise<InsertMediaFromUrlResult>;
export function insertVideoFromUrl(plugin: RNPlugin, args: InsertMediaFromUrlArgs): Promise<InsertMediaFromUrlResult>;
```

Execution order:

1. Validate/canonicalize all arguments at the plugin boundary.
2. Confirm the exact `plugin.richText` builder exists.
3. Resolve the required parent Rem.
4. Build media rich text before any mutation:
   - image: `await plugin.richText.image(url, width, height).value()`;
   - audio: `await plugin.richText.audio(url).value()`;
   - video: `await plugin.richText.video(url).value()`.
5. When `label` exists, append `.newline().text(label)` on the same builder.
   The label is plain text and is never interpreted as HTML or Markdown.
6. Compute a fresh deterministic start/end insert index.
7. Create one new child Rem, set its rich text, and parent it at that index.
8. Read the child back when `verifyAfterWrite !== false`; verify the expected
   rich-text discriminator, normalized URL, and audio/video `onlyAudio` flag.
9. Return the created ID envelope and cache it only after successful optional
   verification.

No existing parent or sibling text is changed.

## Idempotency model

Add to `writeCaches.ts`:

```ts
export interface MediaIdempotencyEntry {
  signature: string;
  result: InsertMediaFromUrlResult;
}

export const MEDIA_RESULT_CACHE = new Map<string, MediaIdempotencyEntry>();
```

The signature is stable JSON over:

```text
mediaKind, parentId, normalized URL, position, normalized label, width, height
```

- Missing key: generate a session-local key through
  `getWriteIdempotencyKey(..., 'insert-media')`.
- Same key + same signature: return the cached created ID with
  `status: 'already_applied'`.
- Same key + different signature: return typed `INVALID_ARGS`; perform zero
  mutation.
- Cache scope is plugin memory, matching the repository's existing basic-write
  contract. Hosted durable idempotency is not claimed.

## Failure and rollback semantics

- Validation, capability checks, parent lookup, builder construction, and
  insert-index calculation occur before `plugin.rem.createRem()`.
- If create returns no Rem, return `SDK_ERROR` with zero known mutation.
- If `setText` or `setParent` fails after creation, attempt to remove the newly
  created Rem immediately.
- If rollback succeeds, return the original typed SDK error with
  `rollbackStatus: 'completed'` and the removed ID in details.
- If rollback fails, return `PARTIAL_FAILURE` with `rollbackStatus: 'failed'`,
  the orphan ID, failed stage, and both SDK/rollback messages. Never cache a
  failed result.
- If readback verification fails, remove the newly created child. Report
  `PARTIAL_FAILURE` only if that compensating remove also fails.
- Existing Rem text is never erased, so a failed insertion cannot damage prior
  note content.

## URL-fetch ownership and security boundary

The MCP server validates and forwards a URL but never calls `fetch`, resolves
DNS, follows redirects, downloads bytes, or proxies content. The plugin creates
RemNote rich text; the RemNote client/service owns any later external fetch.

Therefore:

- enforce HTTP(S), parsing, and length at both server and plugin boundaries;
- do not add a misleading server-side private-IP block and call it SSRF
  protection when the server does not fetch;
- report `openWorldHint: true` because external rendering may occur;
- never log media bytes or credentials;
- preserve OAuth/session/scope/write-approval controls;
- document that users should provide trusted, durable URLs and that remote
  hosts can observe ordinary client/service requests.

## OpenAI generation boundary

Version 1 is:

```text
stable client-provided image/audio/video URL
-> RemNote MCP URL validation and scoped write
-> RemNote rich-text media embed
```

OpenAI image APIs return image data, and OpenAI speech APIs return audio
data/streams. Generated bytes still require a secure upload/storage service and
durable URL before these tools can insert them. ChatGPT voice output is not
assumed to expose a reusable MCP-accessible URL.

No OpenAI API key, image/speech generation call, upload endpoint, object store,
retention policy, or media proxy is added in Stages 2-3.

## Strict TDD files and sequence

Create focused `tests/media-tools.test.ts`. Reuse `FakePlugin`, extending its
rich-text builders and call logs only after RED proves the absence.

### RED/GREEN 1: schemas and registration

RED assertions:

- three registrations exist and forward exact bridge command names;
- valid HTTPS accepted for all kinds;
- valid HTTP accepted;
- malformed, empty, over-2048, `javascript:`, and `file:` URLs rejected;
- image width/height reject non-integers, zero, negatives, and values over 4096;
- audio/video schemas expose no width/height;
- annotations match the four justified values.

Expected RED reason: media schemas and registration module do not exist.

GREEN: add minimum schemas, registrations, and MCP-server wiring.

### RED/GREEN 2: protocol, normalization, permission, and scope

RED assertions:

- raw bridge requests normalize all three contracts;
- direct invalid bridge URLs/dimensions fail before handling;
- tool names are recognized and mapped;
- server permission records require trusted current-tree writes;
- plugin permission and scope classification treat them as create-only safe
  writes under the explicit parent.

Expected RED reason: protocol unions, normalization, and policy maps lack the
new names.

GREEN: add minimum protocol/routing/policy changes.

### RED/GREEN 3: image builder and placement

RED assertions:

- image calls only `richText.image(url, width, height)`;
- creates exactly one child at start/end;
- parent and unrelated sibling text remain byte-for-byte unchanged;
- created ID/result/readback fields are present.

Expected RED reason: image write function does not exist.

GREEN: implement the shared helper's image branch and safe placement.

### RED/GREEN 4: image idempotency and capability failure

RED assertions:

- same key/payload returns same ID and no duplicate;
- same key/different payload returns `INVALID_ARGS` with no mutation;
- missing `richText.image` returns `SDK_UNSUPPORTED` with capability details
  and zero mutation.

GREEN: add signature cache and exact capability gate.

### RED/GREEN 5: audio

Repeat builder selection, placement, unrelated-content preservation,
idempotency, key conflict, capability failure, and rollback assertions for
`richText.audio`.

### RED/GREEN 6: video and YouTube

Repeat the matrix for `richText.video`, including a direct HTTPS media URL and
`https://www.youtube.com/watch?v=dQw4w9WgXcQ`. Do not parse YouTube semantics.

### RED/GREEN 7: rollback and serialization

RED assertions:

- forced `setText`/`setParent`/verification failures remove only the newly
  created Rem;
- rollback failure exposes the orphan ID and `PARTIAL_FAILURE`;
- structured MCP envelope preserves created ID and verification fields;
- runtime capability report lists image/audio/video builders as supported or
  unsupported accurately.

GREEN: complete rollback/readback/capability implementation.

## Regression and proof commands

Focused during TDD:

```bash
npx vitest run tests/media-tools.test.ts
```

Related regression after media implementation:

```bash
npx vitest run \
  tests/media-tools.test.ts \
  tests/tool-status-matrix.test.ts \
  tests/chatgpt-app-contract.test.ts \
  tests/bridge-runtime-lifecycle.test.ts \
  tests/bridge-retry-safety.test.ts \
  tests/bulk-import-tools.test.ts

npm run check-types
npm run server:build
npm run server:test:tool-schemas
npm run server:test:boundaries
npm run server:test:idempotency
npm run server:test:security
```

Before completion, run the repository's full canonical validation/build/test
gates required by current `AGENTS.md`. Keep local/simulated proof separate from
live RemNote rendering proof.

## Live proof fixtures reserved for later stages

Use a disposable approved parent only after exact-SHA deployment and
authenticated plugin health are proven:

- Image: a durable public HTTPS PNG/JPEG URL with known dimensions.
- Audio: a durable public HTTPS MP3 URL.
- Video: a public YouTube URL is mandatory; a direct HTTPS MP4/WebM URL is
  optional but preferred.

For each fixture:

1. call once with a unique idempotency key;
2. read back the created Rem ID and raw/rich representation;
3. repeat the same key and prove no duplicate;
4. visually confirm rendering in current RemNote;
5. delete only the known disposable created child through the guarded delete
   workflow;
6. retain timestamp, exact deploy SHA, input URL, created ID, readback, and
   cleanup evidence.

No Stage 3 report may claim this live rendering proof.

## Stage 2 exit checklist

- [x] Exact public schemas decided.
- [x] Shared helper/result interfaces decided.
- [x] Protocol/handler/capability changes enumerated.
- [x] Idempotency and conflict semantics decided.
- [x] RED expectations and test file decided.
- [x] Live fixtures and proof boundary decided.
- [x] Rollback/failure semantics decided.
- [x] OpenAI generated-media hosting boundary documented.
- [x] Production implementation intentionally not started in Stage 2.
