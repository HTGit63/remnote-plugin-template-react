# RemNote MCP Benchmarks

## Current v0.1.1 maintenance build

| Gate | Result |
| --- | --- |
| Focused release-hygiene TDD | 3/3 passed after verified RED |
| Root Vitest suite | 40 files, 349 tests passed |
| TypeScript | passed |
| RemNote SDK validation | passed with `@remnote/plugin-sdk@0.0.46` |
| Plugin production build | passed; non-blocking Webpack size warnings |
| Server TypeScript build | passed |
| Security/auth regression | passed |
| Boundary validation | passed |
| Tool schema checks | passed |
| Idempotency checks | passed |
| Source-fidelity checks | passed |
| Root production dependency audit | 0 vulnerabilities |
| Server production dependency audit | 0 vulnerabilities |
| ZIP integrity | 21 entries; `unzip -t` passed |
| ZIP manifest | RemNote MCP `0.1.1`, desktop-only |
| ZIP Graphify content | none |
| Local ZIP SHA-256 | `207e1d5fd13cbe9c22e45555a36624d1fb7bc4475f9159f1c97191416527ea5b` |

The archive is 630,748 bytes. The checksum above is valid for the locally
verified archive produced on 2026-07-19; the public artifact must reproduce it
before being presented as identical.

## Exact live release evidence

| Layer | Result | Boundary |
| --- | --- | --- |
| Hosted deployment | PASS | `c0a6ff9187debcad04d1f30f2b509bedd862e508` |
| Plugin connection and sync | PASS | Connected RemNote plugin, 76-tool developer profile |
| Core read/write/readback | PASS | Exact-release connected campaign |
| Idempotency and guarded writes | PASS | Stable IDs and stale-state refusal |
| Resumable import / Test 14 | PASS | Two exact runs, persistent checkpoints, no replay |
| Image | PASS | Native readback plus user-confirmed render |
| Audio | PASS | Native readback plus user-confirmed playback |
| YouTube | PASS | Native readback plus user-confirmed embed/playback |
| Direct MP4 | PASS | Native readback plus user-confirmed playback to 0:05 |

The live campaign belongs to the functionally identical production source
behind `v0.1.0`. The v0.1.1 maintenance change has local automated/build
proof; it must not be described as a new live mutation campaign.

## Historical release identifiers

- v0.1.0 tag target:
  `c0a6ff9187debcad04d1f30f2b509bedd862e508`
- v0.1.0 artifact commit:
  `146b171bef68baef7555896978cc3d84177f3884`
- v0.1.0 ZIP SHA-256:
  `bc43addc88e6c32c01ea1cf9e4a5c080ff29eefbcd4f189121363454f49474c2`
- Exact media proof source:
  `ebc99df6901356b055a425b5909e8d0b5829d5cf`
- Green certification workflow:
  GitHub Actions run `29689809412`

## Proof rules

Server health is not plugin connectivity. An MCP response is not a verified
mutation. Stored media rich text is not visible render or playback. A
functionally identical tree is useful regression evidence but is not the same
claim as a fresh exact-commit live campaign.
