# Stages 1–7 Completion Audit

## Verdict

The product completion program through Stage 7 is **100% complete** against the
immutable v0.1.0 release, its public no-build artifact, exact deployed runtime,
connected RemNote campaign, and user-confirmed media playback. The v0.1.1
maintenance upload is tracked separately and does not change production
behavior.

| Stage | Completion | Evidence |
| --- | ---: | --- |
| 1 — reliability and release defects | 100% | regression-driven replay, auth, boundary, reconnect, readback, and Test 14 repairs |
| 2 — media design | 100% | URL-only schemas, capability probes, idempotency, and rollback contract |
| 3 — media implementation | 100% | image/audio/video routes, typed unsupported behavior, compensation, and tests |
| 4 — regression and architecture | 100% | full automated, security, profile, routing, persistence, and performance gates |
| 5 — plugin user experience | 100% | sidebar state/control matrix and native connected-panel evidence |
| 6 — exact-release RemNote proof | 100% | read/write/readback, recovery, Test 14, and human-confirmed media |
| 7 — release engineering | 100% | public main, immutable v0.1.0 tag, public verified ZIP, install/connection instructions, and evaluation prompts |

## Stage 6 retained proof

- Image Rem `bQae0xzHsWdZts6y7`: native URL readback, stable-ID replay,
  user-confirmed visible render.
- Audio Rem `9OBzXKeko2dIwWx4V`: native URL readback, stable-ID replay,
  user-confirmed playback.
- Final video root `XPFBYmEiwUpSaxQ5P`:
  - YouTube `Pqtihq0K8aFw0JjGW`: embedded and played.
  - Direct MP4 `xi7BoEuts2fuaRFtS`: rendered and played to `0:05 / 0:05`.
- Same-key repeats preserved IDs and created no duplicates.
- The RemNote MCP panel was visibly Connected during confirmation.

## Stage 7 retained proof

- Annotated `v0.1.0` exists remotely and peels to the exact release source.
- The public v0.1.0 archive is downloadable and checksum-verified.
- Canonical `main` contains the release implementation.
- The hosted runtime reported the exact deployed source and connected plugin.
- Installation, safe scope, read, write, resume, and media instructions exist.
- No secret is required in an evaluation prompt, and destructive tools remain
  outside the instructed workflow.

## v0.1.1 maintenance boundary

The patch version exists so RemNote accepts a new upload after v0.1.0. Its
changes are limited to the plugin manifest, public/evaluation documentation,
release-hygiene regression coverage, and removal of generated Graphify output
from public branches. All production TypeScript is unchanged.

Before calling v0.1.1 publicly released, verify:

- remote `main` contains the maintenance commit;
- `release-artifacts/v0.1.1` contains the verified ZIP;
- public download SHA-256 matches [BENCHMARKS.md](BENCHMARKS.md);
- immutable `v0.1.1` exists if a new tagged release is desired;
- any claim of fresh v0.1.1 live proof is supported by a new connected test.

## Current live-check note

During the maintenance pass, the installed RemNote MCP connector returned HTTP
451 `no_biscuit_no_service` before tool execution. That attempt is
`BLOCKED`, not a plugin failure and not a live pass. No RemNote mutation was
attempted.
