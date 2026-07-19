# RemNote MCP — Reproducible Benchmark Evidence

This document separates automated checks, deployed identity, connected-plugin
behavior, live RemNote mutation/readback, and human visual/playback evidence.
Those layers answer different questions and are not interchangeable.

## Release identity

| Evidence | Verified result |
| --- | --- |
| Public `main` source | `417218945879148b842e16a465c0a8ac639b9985` |
| Remote `v0.1.1` tag | peels to `417218945879148b842e16a465c0a8ac639b9985` |
| Immutable `v0.1.0` tag | peels to `c0a6ff9187debcad04d1f30f2b509bedd862e508` |
| Live-proven production code | `ebc99df6901356b055a425b5909e8d0b5829d5cf` |
| `0.1.1` artifact commit | `c8b65b990e5ca3ecdfb47f032c6f9acdd1c7890c` |
| `0.1.1` archive size | `630,748` bytes |
| Archive entries | `21` |
| Archive SHA-256 | `207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b` |
| Exact-main CI | run `29691773546`, number `22`, completed successfully |
| CI head SHA | `417218945879148b842e16a465c0a8ac639b9985` |
| Public generated Graphify content | none in `main`, judge branch, or release archives |

The live-proven code and immutable `v0.1.0` source differ only by retained
report cleanup in production-path directories. The `v0.1.0` to `v0.1.1`
production-path difference is `public/manifest.json`, which increments the
installable plugin version because RemNote rejects a replacement upload with
the same version.

## Automated release gates

| Gate | Result |
| --- | --- |
| Focused `0.1.1` release-hygiene TDD | `3/3` passed after verified RED |
| Root Vitest suite | `40` files, `349` tests passed |
| TypeScript type checking | passed |
| RemNote SDK validation | passed with `@remnote/plugin-sdk@0.0.46` |
| Plugin production build | passed; only non-blocking Webpack size warnings |
| Server TypeScript build | passed |
| Server smoke | passed |
| Authentication and security regressions | passed |
| Routing and connector compatibility | passed |
| Boundary validation | passed |
| Tool schema checks | passed |
| Tool-profile certification | passed |
| Idempotency checks | passed |
| Bulk-import memory persistence checks | passed |
| Source-fidelity checks | passed |
| Style-correctness checks | passed |
| Root production dependency audit | `0` vulnerabilities |
| Server production dependency audit | `0` vulnerabilities |
| ZIP integrity | `unzip -t` passed |
| ZIP manifest | RemNote MCP `0.1.1`, desktop-only |
| Exact-main GitHub Actions | success on the exact public source SHA |

The Stage 3 media implementation first produced focused RED failures for
registration, policy, protocol, capabilities, each builder route,
compensation, and operation metadata. Its GREEN checkpoint passed 33 focused
media tests, 98 related regression tests, and a full suite of 33 files / 326
tests. Later Stage 6 repairs increased the full suite to 346 tests; final
release hygiene brought the retained `0.1.1` suite to 349 tests.

## Connected exact-release campaign

| Layer | Result | What it proves |
| --- | --- | --- |
| Hosted deployment identity | PASS | The expected production source was serving health and MCP traffic. |
| Plugin connection and sync | PASS | A real RemNote plugin session was connected and synchronized. |
| Context, focus, scope, and bounded reads | PASS | The agent could inspect only the approved live context. |
| Structured write and readback | PASS | Created Rem IDs, hierarchy, content, and properties were observable after mutation. |
| Same-key idempotent replay | PASS | Repeated requests preserved IDs and created no duplicate. |
| Guarded mutation | PASS | Stale or unsafe state was refused rather than blindly overwritten. |
| Cards, math, styling, and hierarchy | PASS | Supported native structures survived write and readback. |
| Test 14 resumable import | PASS | Two exact runs completed with persistent checkpoints and no replay. |
| Image insertion | PASS | Native URL readback, stable-ID replay, and human-confirmed render. |
| Audio insertion | PASS | Native URL readback, stable-ID replay, and human-confirmed playback. |
| YouTube insertion | PASS | Native URL readback, stable-ID replay, and human-confirmed embedded playback. |
| Direct MP4 insertion | PASS | Native URL readback, stable-ID replay, and playback confirmed to `0:05 / 0:05`. |

## Test 14 resumable-import evidence

Test 14 was treated as a state-machine and recovery test, not merely a large
write. The final exact-release campaign ran it twice. Each run used four
chunks, exposed a persistent 50% checkpoint after two chunks, attempted each
chunk once, completed whole-note live readback, and proved that invoking resume
after completion created nothing. Earlier live runs exposed logical-versus-
native node-budget and truncated-readback defects; those failures directly led
to commits `0e665e0`, `f314c8f`, and `aff5cbb` plus their regressions.

## Retained media proof

| Medium | Retained Rem evidence | Result |
| --- | --- | --- |
| Image | `bQae0xzHsWdZts6y7` | Correct native URL, no duplicate on replay, visible render confirmed. |
| Audio | `9OBzXKeko2dIwWx4V` | Correct native URL, no duplicate on replay, playback confirmed. |
| YouTube | root `XPFBYmEiwUpSaxQ5P`, child `Pqtihq0K8aFw0JjGW` | Embedded and played; independent readback and same-key replay passed. |
| Direct MP4 | root `XPFBYmEiwUpSaxQ5P`, child `xi7BoEuts2fuaRFtS` | Rendered and played to completion; independent readback and replay passed. |

The final video root contained exactly the two expected children. This matters
because a stored URL alone would not prove correct placement, and a rendered
player alone would not prove deterministic replay.

## Sidebar and setup evidence

Stage 5 exercised disconnected, connecting, connected, reconnecting, error,
pairing review, scope, writing-access, design-style, health, narrow-layout,
keyboard, focus, target-size, zoom, and reduced-motion states in the RemNote SDK
sandbox. That phase correctly recorded native capture as blocked. Subsequent
Stage 6 evidence supplied the missing native boundary: the user confirmed the
connected RemNote panel alongside working image, audio, YouTube, and direct MP4
content. Sandbox screenshots remain interaction evidence, not a substitute for
native RemNote proof.

## Build Week repository evidence

The official submission window opened at `2026-07-13 16:00 UTC`. After this
judge-documentation revision is committed, the retained tips of the six
reviewed branches contain 35 unique commits after that cutoff: 34 earlier
implementation/release commits plus the current documentation-only update. The
count includes implementation, regression, deployment-trigger,
release-documentation, CI-certification, and binary-artifact commits. It is not
presented as a lines-of-code metric because generated Graphify output
temporarily dominated repository language and diff statistics before being
removed from public branches.

See the [complete commit ledger](STAGE_1_7_AUDIT.md#complete-build-week-commit-ledger)
for the purpose and outcome of every retained Build Week commit.

## Reproduce the local gates

From a clean checkout of `main` at the public source SHA:

```bash
npm ci
npm ci --prefix server
npm test
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run server:test:security
npm run server:test:boundaries
npm run server:test:tool-schemas
npm run server:test:idempotency
npm run server:test:source-fidelity
npm run test:style-correctness
npm audit --omit=dev
npm audit --omit=dev --prefix server
git diff --check
```

Connected RemNote tests require a running hosted or local MCP server, a paired
and connected plugin, an approved scope, and a disposable test parent. Local
success must not be reported as connected live proof when those preconditions
are absent.

## Reproduce the archive check

```bash
curl -L \
  -o PluginZip.zip \
  https://github.com/HTGit63/remnote-plugin-template-react/raw/refs/heads/release-artifacts/v0.1.1/PluginZip.zip
sha256sum PluginZip.zip
unzip -t PluginZip.zip
unzip -l PluginZip.zip
```

Expected SHA-256:

```text
207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b
```

## Interpretation rules

A server health response is not plugin connectivity. Plugin connectivity is
not authorization to write. An MCP success envelope is not a verified RemNote
mutation. A native rich-text media URL is not visual rendering or playback.
A functionally identical maintenance tree is useful regression evidence but is
not a new exact-commit live campaign. The completion claim is based on the
combined evidence chain, with each boundary stated explicitly.
