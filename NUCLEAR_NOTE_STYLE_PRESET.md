# Nuclear Physics Note Style Preset

Preset name:

```text
nuclear_physics_h1_h3_spacer_math
```

## Purpose

Use this preset for any future Nuclear Physics I note. It is not tied to a specific lesson number or topic.

## Supported Tools

- `create_polished_note_tree`
- `apply_structured_note_batch`
- `create_or_replace_note_from_markdown`
- `verify_note_design`
- `apply_style_plan`

## Input Fields

```json
{
  "stylePreset": "nuclear_physics_h1_h3_spacer_math",
  "course": "Nuclear Physics I",
  "rootHeadingLevel": "H1",
  "sectionHeadingLevel": "H3",
  "insertSiblingSpacers": true,
  "spacerText": "\u200b",
  "majorFormulaMode": "mathBlockRem",
  "verifyAfterWrite": true
}
```

## Structure Rules

- Main note root is `H1`.
- Major section headings under the root are `H3`.
- Spacer Rems use zero-width space (`\u200b`).
- Spacer Rems are root-level siblings between H3 sections.
- Content stays nested under its H3 section.
- Display math (`$$...$$` and `\[...\]`) becomes separate math block Rems.
- Inline math stays inline.

## Standard Sections

Use only sections that fit the provided topic or prepared note:

- Physical Basis
- Definitions and Core Quantities
- Mathematical Setup
- Derivation
- Interpretation
- Limitations and Assumptions
- Common Error Patterns

## Preferred Workflow

1. Read focused Rem and children.
2. Check duplicate title.
3. Call `create_polished_note_tree`, `apply_structured_note_batch`, or `create_or_replace_note_from_markdown` with the preset.
4. Verify with `get_rem_tree`.
5. Verify with `verify_note_design` and the same preset.
6. Report only created/updated note, root Rem ID, confirmations, and issues.

## Verification Shape

```json
{
  "rootRemId": "ROOT_REM_ID",
  "stylePreset": "nuclear_physics_h1_h3_spacer_math",
  "expected": {
    "rootHeadingLevel": "H1",
    "sectionHeadingLevel": "H3",
    "spacersAreRootChildren": true,
    "mathBlocksAreSeparateRems": true,
    "noContentUnderSpacerRems": true,
    "contentNestedUnderSections": true,
    "previousNotesUntouched": true
  }
}
```

## Current Proof

Automated parser/schema tests pass for the generic regression note:

- `npm run server:test:nuclear-physics-style-preset`
- `npm run server:test:markdown-importer`
- `npm run server:test:style-schema`

Live RemNote write verification remains required before claiming production live success. The local MCP probe reached diagnostics, but plugin-backed tools returned `PLUGIN_NOT_CONNECTED` because no RemNote plugin socket was connected.
