# RemNote MCP — Fresh All-Tool Benchmark

Run date: 2026-07-21

Branch: `judges/openai-build-week-v0.1.1`

Audited code/deployment baseline: `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb`

## Verdict

The registry declares 82 tools and exposes 79 in the developer profile. All 79
passed schema/profile/server-local certification, while the three non-public
entries retain explicit gated, hidden, or unsupported reasons.

The final connected acceptance closed the uploaded-media gap. The supplied
MP3 and genuine MP4 were each accepted through ChatGPT file handling, stored
persistently, inserted under the live `Plugin Test` Rem, verified by the write
action, and independently read back from RemNote. Uploaded image, audio, and
video insertion are now connected passes.

## Rules used for this report

- `CONNECTED PASS` means a real hosted server, connected RemNote plugin, and
  SDK read returned successfully in this pass.
- `CONNECTED MUTATION PASS` additionally means a real write was performed and
  the created Rem was independently read back.
- `PRIOR CONNECTED PASS` means a retained earlier mutation/readback result; it
  is not promoted to a current run.
- `AUTOMATED PASS` means current schema, policy, local, or simulated-runtime
  checks passed; it does not claim a live RemNote mutation.
- `BLOCKED` names the exact external or session boundary.
- `NOT RUN` is not silently treated as success.
- Native readback does not equal human-visible rendering or playback.

## Environment and identity

| Field | Value |
| --- | --- |
| Original all-tool benchmark start | `2026-07-21T16:50:54Z` |
| Final connected media acceptance completed | `2026-07-21T19:36:40Z` |
| OS | Linux `6.17.0-35-generic`, x86_64 |
| Node.js | `v22.23.0` |
| npm | `10.9.8` |
| Judge-branch SHA before final docs | `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb` |
| Hosted deploy SHA used for live media | `bc2e142fe3f0a7348e9c5b6520345d97745fe0fb` |
| Server / manifest version | `0.0.1 / 0.1.1` |
| RemNote SDK | `0.0.46` |
| Registry/schema | `2026-07-21.hosted-media-file-schemas-v2` |
| Active hosted profile | `developer` |
| Hosted auth | OAuth pairing; tool calls require hosted OAuth |
| Plugin | connected, one active hosted connection, initial sync complete |
| RemNote permission | full workspace scope, trusted inside scope |
| Connected test Rem | `OjLcSppWfIH0cpPoh` (`Plugin Test`) |
| Declared / public / default tools | `82 / 79 / 25` |

## Automated verification

| Gate | Fresh result |
| --- | --- |
| Clean dependency install | PASS: root and server `npm ci` |
| Focused ChatGPT/media regression | PASS: 3 files, 62 tests |
| Final documentation contract | RED: 4/4 failed on stale setup/evidence; GREEN: 4/4 passed after rewrite |
| Full Vitest suite | PASS: 45 files, 389 tests |
| Root type check | PASS |
| RemNote SDK validation | PASS |
| Plugin production build | PASS; existing non-blocking bundle-size warnings only |
| Server TypeScript build | PASS |
| Server smoke | PASS |
| Auth, pairing, hosted routing, connector compatibility | PASS |
| Security auth/session and boundary smoke | PASS |
| Core, advanced, diagnostics, profile, schema, health-routing certification | PASS |
| Tool profiles | PASS: basic 8, mass-note 25, note-writer 57, power-user 74, developer 79 |
| Danger simulation | PASS: 80 when the normally gated delete tool is explicitly enabled |
| Style, formula preset, Markdown import, source fidelity | PASS |
| Bulk storage, idempotency, trusted-write regression | PASS |
| Performance, hosted E2E simulation, staged repair simulation | PASS |
| Root production dependency audit | PASS: 0 vulnerabilities |
| Server production dependency audit | High `fast-uri` advisory fixed at 3.1.4; 2 moderate `@hono/node-server` Windows-only advisories remain for the Linux deployment |
| Server full dependency audit | The same 2 moderate findings plus 1 low Windows-only `esbuild` development finding |
| Forced audit fix | NOT RUN: npm proposes a breaking MCP SDK downgrade; no force change was accepted during final verification |

The final documentation regression was run before the rewrite and failed all
four checks for the expected reasons: both guides used the old launch command,
and the benchmark/audit lacked the new connected Rem IDs. After the rewrite,
the focused contract passed 4/4 and the complete suite passed 389/389. The red
result is retained because this report should show the repair loop, not only
the final green line.

The earlier security pass updated `body-parser` and removed a root
`brace-expansion` advisory. The final recheck found a new high-severity
`fast-uri` advisory; the non-breaking audit repair updated it from 3.1.2 to
3.1.4. Root production audit now reports zero. Server production audit retains
two moderate `@hono/node-server` path-traversal findings; the full dependency
audit also includes one low `esbuild` development-server finding. All three are
specific to Windows behavior, while the deployed server is Linux. npm's
remaining production remediation would force a breaking
`@modelcontextprotocol/sdk` downgrade, so it was not applied.

## Local performance measurements

Measurements use a monotonic timer where possible. Descriptor generation used
one warm-up and 20 measured runs in one process.

### Developer-profile descriptor construction

| Metric | Result |
| --- | ---: |
| Tools constructed | 79 |
| Runs | 20 |
| Minimum | 3.946 ms |
| Median | 7.029 ms |
| p95 | 9.075 ms |
| Maximum | 15.492 ms |
| Audio file descriptor present | yes |
| Video file descriptor present | yes |

This measures local registration/descriptor work, not network or RemNote
latency.

### Markdown pipeline

| Fixture | Native nodes | Local time | Fidelity checks |
| --- | ---: | ---: | --- |
| Small | 5 | 4.175 ms | PASS |
| Nuclear-physics style | 14 | 1.504 ms | PASS |
| Formula | 6 | 1.020 ms | PASS |
| Table/cards | 17 | 0.973 ms | PASS |

Formula, source-fidelity, bullet, and table assertions were true in every
fixture.

### Structured-note performance cases

| Case | Nodes | Local time | Result |
| --- | ---: | ---: | --- |
| Small | 3 | 5 ms | success |
| Medium | 17 | 1 ms | success |
| Large formula-heavy | 216 | 11 ms | success with performance warning; 4 fallback chunks |
| Other retained cases | varied | 0–1 ms | success |

These are deterministic server/plugin-pipeline simulations, not real RemNote
wall time.

## Current connected timing

Each route used one warm-up plus ten measured calls. `wall` includes the entire
client/tool path; `plugin phase` is the lifecycle time reported inside the
bridge response.

| Route | Successful structured results | Wall min / median / p95 / max | Plugin min / median / p95 / max |
| --- | ---: | --- | --- |
| `get_bridge_status` | 10/10 | 1840 / 2974 / 21537 / 21537 ms | 4 / 6 / 498 / 498 ms |
| `ping_remnote_plugin` | 10/10 | 729 / 913 / 2469 / 2469 ms | 16 / 27 / 33 / 33 ms |
| `get_current_selection` | 9/10 normal envelopes; 1 missing envelope | 696 / 1018 / 30811 / 30811 ms | 21 / 29 / 230 / 230 ms |
| `get_focused_rem` | 10/10 | 716 / 1285 / 2371 / 2371 ms | 10 / 26 / 94 / 94 ms |

The two large wall-time outliers occurred outside the plugin execution phase.
They are retained in p95/max and should be investigated as client/tool transport
latency if repeated. They are not hidden by reporting only server phase time.

## Current connected read matrix

No write tool was called.

| Tool | Status | Wall time | Reported bridge phase |
| --- | --- | ---: | ---: |
| `get_rem` | PASS | 1298 ms | 131 ms |
| `get_children` | PASS | 2751 ms | 18 ms |
| `get_rem_breadcrumbs` | PASS | 970 ms | 94 ms |
| `get_rem_rich` | PASS | 2073 ms | 21 ms |
| `get_rem_tree` | PASS | 876 ms | 34 ms |
| `get_document_or_folder_tree` | PASS | 1510 ms | 29 ms |
| `search_rems` | PASS | 1216 ms | 173 ms |
| `debug_get_raw_rich_text` | PASS | 811 ms | 39 ms |
| `run_bridge_health_check` read-only | PASS | 4374 ms | aggregate tool, no single phase value |
| `get_plugin_status` | PASS | 1591 ms | 17 ms |
| `get_bridge_diagnostics` | PASS | 8132 ms | server aggregate |
| `get_remnote_capability_guide` | RETURNED | 1075 ms | server-local content result |

## Media evidence

| Workflow | Server/automated | Connected evidence | Current verdict |
| --- | --- | --- | --- |
| Uploaded PNG/JPEG → image | PASS | Prior July 21 native insert and readback PASS | PASS, not repeated here |
| Image URL → image | PASS | Retained native readback/render PASS | PASS |
| Public MP3 URL → audio | PASS | Retained native readback/playback PASS | PASS |
| Uploaded MP3 → audio | PASS: descriptor, loader, storage, range, native route, cleanup tests | Current connected mutation and independent native readback PASS | PASS |
| YouTube URL → video | PASS | Retained native readback/playback PASS | PASS |
| Direct MP4 URL → video | PASS | Retained native readback/playback PASS | PASS |
| Uploaded real MP4 → video | PASS: descriptor, loader, storage, range, native route, cleanup tests | Current connected mutation and independent native readback PASS | PASS |
| Mislabeled `.mp4` containing WebM/VP8 | rejection PASS | Reported file inspection only | UNSUPPORTED INPUT, correctly rejected |
| SVG upload | rejection PASS | Prior rejection | UNSUPPORTED by design |

### Uploaded MP3 connected acceptance

| Evidence | Value |
| --- | --- |
| Source | `fiesta.mp3` |
| Local bytes / SHA-256 | `1,481,572` / `82f6e9058205f3d3469807f2a79c6f285b32ee432c2a4417785eea5a0626d074` |
| Local media inspection | MP3, 44.1 kHz stereo, about 84.79 seconds |
| Tool / operation | `insert_audio_from_file` / `7d653c1c-ca3f-4455-99a6-10a938563198` |
| Parent / created Rem | `OjLcSppWfIH0cpPoh` / `C4AUcbO4uXbJkAMZp` |
| Hosted type / bytes | `audio/mpeg` / `1,481,572` |
| Tool verification | created Rem found; media kind and URL matched |
| Independent child readback | child index 3 under `Plugin Test` |
| Raw native rich text | media node `i: "a"`, `onlyAudio: true` |
| Asset state | persistent; `retained_remote_dependency` |

### Uploaded MP4 connected acceptance

| Evidence | Value |
| --- | --- |
| Source | `file_example_MP4_480_1_5MG.mp4` |
| Local bytes / SHA-256 | `1,570,024` / `71944d7430c461f0cd6e7fd10cee7eb72786352a3678fc7bc0ae3d410f72aece` |
| Local media inspection | ISO MP4, H.264 video, AAC audio, about 30.53 seconds |
| Tool / operation | `insert_video_from_file` / `760ceaf0-2b0a-405d-8a9b-5d03cf90951d` |
| Parent / created Rem | `OjLcSppWfIH0cpPoh` / `QyPyn0Ch6C6NdStoO` |
| Hosted type / bytes | `video/mp4` / `1,570,024` |
| Tool verification | created Rem found; media kind and URL matched |
| Independent child readback | child index 4 under `Plugin Test` |
| Raw native rich text | media node `i: "a"`, `onlyAudio: false` |
| Asset state | persistent; `retained_remote_dependency` |

The write tools and the separate `get_children`, `get_rem`, and raw-rich-text
reads all returned `PASS`. This proves connected native mutation and readback.
Human playback remains a separate UI-level check.

## Every declared tool

The table has one row for every entry in the generated registry. `Automated`
means current schema/profile/server-local certification passed but no live
mutation was run in this pass.

| # | Tool | Category / minimum profile | Public in normal developer profile | Current evidence |
| ---: | --- | --- | --- | --- |
| 1 | `get_bridge_status` | system / basic | yes | CONNECTED PASS, 10 measured runs |
| 2 | `get_plugin_status` | system / basic | yes | CONNECTED PASS |
| 3 | `get_focused_rem` | read / basic | yes | CONNECTED PASS, 10 measured runs |
| 4 | `get_rem` | read / basic | yes | CONNECTED PASS |
| 5 | `get_children` | read / basic | yes | CONNECTED PASS |
| 6 | `get_rem_tree` | read / basic | yes | CONNECTED PASS |
| 7 | `get_rem_breadcrumbs` | read / basic | yes | CONNECTED PASS |
| 8 | `search_rems` | read / basic | yes | CONNECTED PASS |
| 9 | `create_basic_flashcard` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 10 | `create_cloze_card` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 11 | `create_multiple_choice_card` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 12 | `create_list_answer_card` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 13 | `delete_rem_by_id` | danger / danger | no, unless server flag enabled | GATED; automated dry-run/guard certification only; LIVE NOT RUN |
| 14 | `get_current_selection` | read / note_writer | yes | CONNECTED: 9/10 normal envelopes, 1 client-envelope outlier |
| 15 | `get_rem_rich` | read / note_writer | yes | CONNECTED PASS |
| 16 | `get_document_or_folder_tree` | read / mass_note_writer | yes | CONNECTED PASS |
| 17 | `create_rem` | write / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 18 | `create_document` | write / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 19 | `append_to_rem` | write / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 20 | `insert_image_from_url` | media / mass_note_writer | yes | AUTOMATED PASS; PRIOR CONNECTED PASS |
| 21 | `insert_image_from_file` | media / mass_note_writer | yes | AUTOMATED PASS; PRIOR CONNECTED PASS |
| 22 | `insert_audio_from_url` | media / note_writer | yes | AUTOMATED PASS; PRIOR CONNECTED PASS |
| 23 | `insert_audio_from_file` | media / mass_note_writer | yes | CONNECTED MUTATION PASS; Rem `C4AUcbO4uXbJkAMZp` |
| 24 | `insert_video_from_url` | media / mass_note_writer | yes | AUTOMATED PASS; PRIOR CONNECTED YouTube/direct-video PASS |
| 25 | `insert_video_from_file` | media / mass_note_writer | yes | CONNECTED MUTATION PASS; Rem `QyPyn0Ch6C6NdStoO` |
| 26 | `update_rem` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 27 | `replace_rem` | danger / danger | no | HIDDEN until replacement guards are live-proven |
| 28 | `move_rem` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 29 | `reorder_children` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 30 | `create_rem_tree` | structured note / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 31 | `update_rem_rich` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 32 | `create_styled_rem_tree` | structured note / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 33 | `create_polished_note_tree` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 34 | `create_or_replace_note_from_markdown` | import / mass_note_writer | yes | AUTOMATED PASS; retained connected import proof |
| 35 | `plan_note_import` | import / mass_note_writer | yes | AUTOMATED PASS; server-local only this pass |
| 36 | `plan_note_import_from_file` | import / mass_note_writer | yes | AUTOMATED PASS; hosted file schema PASS; LIVE NOT RUN |
| 37 | `start_note_import_job` | import / mass_note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 38 | `start_note_import_from_file` | import / mass_note_writer | yes | AUTOMATED PASS; hosted file schema PASS; LIVE NOT RUN |
| 39 | `run_note_import_job_step` | import / mass_note_writer | yes | AUTOMATED PASS; retained connected import proof |
| 40 | `get_note_import_job_status` | import / mass_note_writer | yes | AUTOMATED PASS; retained connected import proof |
| 41 | `resume_note_import_job` | import / mass_note_writer | yes | AUTOMATED PASS; retained no-replay proof |
| 42 | `reconcile_note_import_job_chunk` | import repair / mass_note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 43 | `verify_note_import_job` | import / mass_note_writer | yes | AUTOMATED PASS; retained source-fidelity proof |
| 44 | `cancel_note_import_job` | import / mass_note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 45 | `preview_markdown_note_tree` | import / note_writer | yes | AUTOMATED PASS; server-local only this pass |
| 46 | `create_note_from_markdown_tree` | legacy import / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 47 | `append_markdown_as_rem_tree` | legacy import / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 48 | `apply_structured_note_batch` | structured note / note_writer | yes | AUTOMATED PASS; retained connected write proof |
| 49 | `apply_style_plan` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 50 | `verify_note_design` | read / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 51 | `analyze_note_design` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 52 | `save_note_design_template` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 53 | `list_note_design_templates` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 54 | `preview_note_design_plan` | design / note_writer | yes | AUTOMATED PASS; server-local only this pass |
| 55 | `export_note_design_template` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 56 | `import_note_design_template` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 57 | `create_designed_note_tree` | design / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 58 | `update_note_with_design` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 59 | `verify_note_against_design` | read / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 60 | `repair_note_design` | repair / power_user | yes | AUTOMATED PASS; dry-run default; LIVE NOT RUN |
| 61 | `create_card_set_from_note` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 62 | `create_flashcards_from_markdown` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 63 | `create_cloze_cards_from_note` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 64 | `verify_card_set` | read / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 65 | `repair_card_set` | repair / power_user | yes | AUTOMATED PASS; dry-run default; LIVE NOT RUN |
| 66 | `apply_remnote_command` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 67 | `set_rem_heading_level` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 68 | `set_rem_text_color` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 69 | `set_rem_highlight_color` | repair / power_user | yes | AUTOMATED PASS; retained highlight proof, not rerun |
| 70 | `set_text_span_color` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 71 | `set_text_span_highlight` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 72 | `set_rem_type` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 73 | `set_hide_bullet` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 74 | `clear_rem_formatting` | repair / power_user | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 75 | `create_concept_card` | card / note_writer | yes | AUTOMATED PASS; LIVE NOT RUN this pass |
| 76 | `create_descriptor_card` | card / note_writer | yes | AUTOMATED PASS; retained connected card proof |
| 77 | `ping_remnote_plugin` | debug / developer | yes | CONNECTED PASS, 10 measured runs |
| 78 | `get_bridge_diagnostics` | debug / developer | yes | CONNECTED PASS |
| 79 | `run_bridge_health_check` | debug / developer | yes | CONNECTED PASS in read-only mode |
| 80 | `get_remnote_capability_guide` | debug / developer | yes | CONNECTED RETURNED; content tool has no standard status field |
| 81 | `debug_get_raw_rich_text` | debug / developer | yes | CONNECTED PASS |
| 82 | `create_folder` | unsupported | no | UNSUPPORTED: no live-verified modern SDK folder API |

## Conservative mass-note audit result

`npm run server:mass-note-audit` exited successfully but its static report
returned one readiness FAIL: `BULK_JOB_RELIABILITY_INCOMPLETE` for scenario 14.
That script was run without a live gate payload, so it recorded 0 pass, 1 fail,
2 registry-present, 10 ready-for-runtime-test, and 4 live-test-not-run entries.
This is a conservative evidence-absence result, not a newly observed import
runtime failure. The dedicated current bulk-storage, idempotency, source-
fidelity, tool certification, and retained connected resumable-import tests
passed. The generated timestamped reports are not committed as if they were a
new live campaign.

## Reproduce the local gates

```bash
npm ci
npm ci --prefix server
npm test
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run server:test:auth
npm run server:test:pairing
npm run server:test:routing
npm run server:test:connector-compat-routing
npm run server:test:security
npm run server:test:boundaries
npm run server:test:tools-core
npm run server:test:tools-advanced
npm run server:test:tools-diagnostics
npm run server:test:tool-profile
npm run server:test:health-check-routing
npm run server:test:structured-depth
npm run server:test:tool-schemas
npm run server:test:tier-switching
npm run server:test:area2
npm run server:test:area3
npm run server:test:nuclear-physics-style-preset
npm run server:test:markdown-importer
npm run server:test:markdown-pipeline-benchmark
npm run server:test:performance-benchmark
npm run server:test:source-fidelity
npm run server:test:direct-write-trusted-mode-regression
npm run server:test:bulk-storage
npm run server:test:idempotency
npm run server:test:e2e-hosted-smoke
npm run test:style-correctness
npm run test:agents-simulated-live
npm audit --omit=dev
npm audit --omit=dev --prefix server
git diff --check
```

Connected testing additionally requires a running hosted or local MCP server,
a paired plugin, an approved RemNote scope, and a disposable parent. A fresh
conversation is required after tool metadata changes.

## Interpretation

The broad simulated certification is valuable because it exercises every
registered handler deterministically, including failure and guard paths. It is
not a claim that every tool mutated a real knowledge base on July 21. The
connected read matrix proves the live bridge, while the final MP3 and MP4 tests
add current connected mutation and independent native readback for those two
uploaded-file actions. Human rendering and playback remain separate checks.
