# MCP Tool Audit

Generated from the June 24 live matrix and current source policy.

## Current Counts

| Metric | Count | Source |
| --- | ---: | --- |
| Declared tools | 75 | `TOOL_METADATA` / bridge registry |
| All public-capable tools | 72 | excludes unsupported/hidden static tools |
| Default `mass_note_writer` tools | 19 | ChatGPT default profile |
| Hidden/unavailable tools | 3 | `create_folder`, `delete_rem_by_id`, `replace_rem` |
| Profile-hidden tools in default profile | 53 | available only in higher profiles |
| Platform-blocked in June 24 manual path | 2 | `preview_markdown_note_tree`, `create_note_from_markdown_tree` |

## Default Profile

`mass_note_writer` exposes only:

```text
get_bridge_status
get_plugin_status
get_focused_rem
get_rem
get_children
get_rem_tree
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
create_or_replace_note_from_markdown
plan_note_import
plan_note_import_from_file
start_note_import_job
start_note_import_from_file
run_note_import_job_step
get_note_import_job_status
resume_note_import_job
verify_note_import_job
cancel_note_import_job
```

Style, card, design mutation, debug/raw, delete, replace, folder, and legacy Markdown-tree writers stay out of the default profile.

## Problem Tool Matrix

| Tool | Category | Declared | Registered | Public | Server-local | Bridge required | Destructive | Schema valid | ChatGPT-visible default | Hidden/blocking reason | Safety level | Expected latency | Test coverage | Live status | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `update_rem_rich` | repair/style | yes | yes in `power_user+` | yes | no | yes | no | yes | no | hidden by default profile; whole-rich replacement must preserve plain text when used as style-only | high | live style <=5s | style invariant regression | June 24 failed on plain-text mutation from bad fixture/payload | use only for same-plain-text rich styling; prefer span style tools |
| `apply_remnote_command` | repair/style | yes | yes in `power_user+` | yes | no | yes | no | yes | no | hidden by default profile; style commands are invariant-guarded | high | live style <=5s | style invariant regression | June 24 failed on child pollution | keep higher-tier; use `set_*` style tools first |
| `clear_rem_formatting` | repair/style | yes | yes in `power_user+` | yes | no | yes | no | yes | no | hidden by default profile; SDK cannot clear every whole-Rem style | high | live style <=5s | style invariant regression | June 24 failed on child-order mutation | keep higher-tier; return partial/unsupported when SDK cannot reset safely |
| `preview_markdown_note_tree` | Markdown preview | yes | yes in `note_writer+` | yes | yes | no | no | yes | no | hidden by default profile to reduce ChatGPT surface; now server-local when exposed | low | p95 <100ms realistic | registry test + parser tests | June 24 platform-blocked manually | safe preview in higher profile; normal flow uses bulk planner |
| `create_note_from_markdown_tree` | Markdown writer | yes | yes in `note_writer+` | yes | no | yes | no | yes | no | hidden by default profile; legacy writer replaced by bulk importer | medium | high-level write <=5s for small notes | schema/area tests | June 24 platform-blocked manually | prefer `create_or_replace_note_from_markdown` |
| `create_folder` | unsupported write | yes | no public registration | no | no | no | no | no public schema | no | no modern RemNote SDK folder creation path live-verified | unsupported | n/a | registry hidden test | not public/unavailable | keep hidden; do not fake folders |
| `delete_rem_by_id` | destructive | yes | only with env + `danger` | gated | no | yes | yes | yes | no | requires `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1`, dry-run, guards, approval | dangerous | approval path | permission/delete guard tests | destructive path blocked in June 24 audit | hidden by default; use only disposable current-session cleanup |
| `replace_rem` | destructive replacement | yes | no public registration | no | no | no | yes | no public schema | no | replacement guards/readback/rollback not live-proven | dangerous | n/a | registry hidden test | not public/unavailable | keep hidden until expected hash/text + rollback proof exists |

## Status Meanings

- `PASS`: runtime execution and verification passed.
- `PASS_SERVER_LOCAL`: server-local execution passed without plugin write.
- `PASS_WITH_WARNING`: usable, but non-critical limitation reported.
- `BLOCKED_PLATFORM`: client/platform blocked call before bridge proof.
- `BLOCKED_SAFETY`: bridge safety policy blocked call by design.
- `FAILED_SCHEMA`: schema validation failed.
- `FAILED_RUNTIME`: bridge/plugin execution failed.
- `FAILED_VERIFICATION`: readback or invariant failed.
- `HIDDEN_BY_POLICY`: intentionally excluded from current profile.
- `NOT_PUBLIC_OR_UNAVAILABLE`: not exposed or SDK path unsupported.
- `SKIPPED_WITH_REASON`: skipped with explicit written reason.

## Audit Workflow

1. Confirm focus with `get_focused_rem`.
2. Create disposable sandbox under focused Rem.
3. Run read tools first.
4. Run safe writes with idempotency keys.
5. Run style tools only on disposable Rems with two known children.
6. Keep destructive tools dry-run unless current-session disposable target and user approval exist.
7. Write compact report sections, not Markdown tables.

Do not turn blocked/hidden rows into runtime failures when policy intentionally blocks them. Do not hide schema or registry drift.
