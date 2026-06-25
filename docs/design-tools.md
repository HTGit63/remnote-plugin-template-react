# Design And Styling Tools

Content fidelity comes before styling.

## Safe Workflow

1. Write content with `create_or_replace_note_from_markdown` or the bulk import job flow.
2. Verify source readback.
3. Apply optional style only after content verification.
4. Verify styling with `verify_note_design`.
5. If styling changes text, child count, or child order, treat styling as failed and keep content status separate.

## Presets

- `clean_academic`: default.
- `exam_ready`: stronger study/exam layout.
- `formula_heavy`: preferred for physics/math notes.
- `minimal`: heading-only layout.
- `colorful_study`: higher visual emphasis; use only when style tools are safe.

For physics/nuclear notes, prefer `formula_heavy` or `exam_ready`.

## Invariants

Style-only tools must preserve:

- plain text hash
- child IDs
- child order
- formulas
- source fidelity

Style tools must never create visible metadata Rems such as `Size`, `H1`, `H2`, `H3`, or `normal`.

## Tool Policy

- Default ChatGPT profile hides style/design mutation tools.
- `apply_style_plan`, `update_rem_rich`, `apply_remnote_command`, and `clear_rem_formatting` are higher-tier tools.
- `update_rem_rich` is safe only when the requested rich text has the same plain text as the target Rem.
- `clear_rem_formatting` can return partial because installed SDK paths do not expose every reset.

## Verification Fields

Design/style responses should expose:

```text
beforePlainText
afterPlainText
beforeChildOrder
afterChildOrder
beforeChildIds
afterChildIds
metadataPollutionChildren
childOrderUnchanged
plainTextUnchanged
noChildrenCreated
onlyExpectedStyleChanged
```

## Cleanup

Automatic cleanup is only acceptable for disposable current-session test roots. For real user notes, report pollution and ask for approval before any delete.
