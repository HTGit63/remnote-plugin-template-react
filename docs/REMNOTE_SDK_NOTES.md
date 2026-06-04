# RemNote SDK Notes

Last audited: 2026-06-04

Pinned package:

```text
@remnote/plugin-sdk 0.0.46
```

Official sources:

- https://plugins.remnote.com/
- https://plugins.remnote.com/CHANGELOG
- https://plugins.remnote.com/advanced/permissions
- https://plugins.remnote.com/advanced/manifest
- https://plugins.remnote.com/advanced/widgets
- https://plugins.remnote.com/advanced/rich-text
- https://plugins.remnote.com/advanced/tables
- https://plugins.remnote.com/advanced/settings
- https://plugins.remnote.com/advanced/storage
- https://plugins.remnote.com/advanced/submitting-plugins
- https://plugins.remnote.com/api/classes/AppNamespace
- https://plugins.remnote.com/api/classes/RemNamespace
- https://plugins.remnote.com/api/classes/RichTextNamespace
- https://plugins.remnote.com/api/classes/QueueNamespace
- https://plugins.remnote.com/api/classes/ReaderNamespace

## Goal 1 Findings

- Current npm `latest` was checked as `0.0.46`.
- `0.0.39` changed `plugin.app.registerPowerup` to an object argument.
- `0.0.37` added `plugin.app.waitForInitialSync`.
- `0.0.32` added `plugin.reader`.
- `0.0.31` added `plugin.rem.createTable` and table helpers.
- `0.0.20` replaced `createWithMarkdown` with `createSingleRemWithMarkdown` and `createTreeWithMarkdown`.
- `0.0.18` added `plugin.app.transaction`.
- RemNote docs strongly prefer sandboxed plugins and minimal permission scopes for public users.

## Capability Detector

Runtime diagnostics now report:

```text
sdkVersion
supportedSdkCapabilities
unsupportedSdkCapabilities
sdkCapabilityDetails
initialSyncSupported
initialSyncComplete
initialSyncTimedOut
initialSyncWarning
```

Detected capabilities:

```text
plugin.app.transaction
plugin.app.waitForInitialSync
plugin.rem.createSingleRemWithMarkdown
plugin.rem.createTreeWithMarkdown
plugin.rem.createTable
plugin.reader.addHighlight
plugin.queue.getCurrentCard
plugin.queue.getNumRemainingCards
plugin.queue.getCurrentStreak
plugin.queue.inLookbackMode
```

Optional APIs must be checked through capability detection before tool code depends on them. If an optional API is absent, the tool path must return `SDK_UNSUPPORTED` rather than guessing or simulating success.

## APIs Used Now

- `plugin.rem.createSingleRemWithMarkdown`, `createTreeWithMarkdown`, `createTable`
- `plugin.rem.createRem`, `findOne`, `findMany`, `findByName`, `getAll`, `moveRems`
- `RemObject.setText`, `setBackText`, `setParent`, `getChildrenRem`, `getDescendants`, `remove`
- `RemObject.setIsDocument`, `setType`, `setFontSize`, `setHighlightColor`, `setIsListItem`
- `RemObject.setEnablePractice`, `setPracticeDirection`, `setIsCardItem`, `getCards`
- `plugin.richText.parseFromMarkdown`, `toString`, `length`, `text`, `latex`
- `plugin.focus.getFocusedRem`
- `plugin.editor.getSelectedRem`
- `plugin.settings.getSetting`, `setSetting`
- `plugin.storage.getLocal`, `setLocal`
- `plugin.app.waitForInitialSync` when available, with timeout before bridge registration

## Goal 2 Findings

- `create_rem` and `create_document` prefer `plugin.rem.createSingleRemWithMarkdown` when the runtime exposes it.
- `create_rem_tree` prefers `plugin.rem.createTreeWithMarkdown` for simple unstyled trees when no start-position insertion is requested.
- Old `createRem` + `parseFromMarkdown` creation remains fallback-only for runtimes missing the modern markdown APIs or for tree insertion modes the markdown API cannot place precisely.
- `apply_structured_note_batch`, `create_styled_rem_tree`, and polished-note paths stay separate from simple markdown paths so headings, colors, math, spacers, cards, and verification remain on the structured writer.
- `plugin.rem.createTable` is wrapped internally in `src/remnote/write/tableWrites.ts`; no public table MCP tool is exposed until live-tested.
- `create_folder` remains hidden from the normal MCP callable surface and returns `SDK_UNSUPPORTED` if reached through the plugin bridge.

## Goal 4 Findings

- `plugin.app.transaction` is the SDK-supported transaction boundary; write tools detect it at runtime and report whether it was used.
- Complex write tools now return an operation plan with operation ID, idempotency key, target, mutation counts, verification checks, rollback strategy, and estimated payload/work.
- Dry runs produce the same operation plan without mutating RemNote.
- Idempotent repeat calls return `already_applied` for high-level write tools instead of creating duplicates.
- Replacement modes stage new content first, verify staged Rems, then swap content so old children are preserved until the replacement is ready.
- If a replacement fails after the swap starts, the response reports staged, moved, and backup Rem IDs for recovery.

## Goal 5 Findings

- Markdown hierarchy import now has three public tools: `preview_markdown_note_tree`, `create_note_from_markdown_tree`, and `append_markdown_as_rem_tree`.
- Preview is read-only and parse-only; create and append are safe-write tools with `dryRun: true` defaults.
- The parser handles root titles, H3 headings, nested bullets, ordered lists, blank spacer Rems, inline math spans, block math Rems, tables, worked examples, optional flashcard markers, and callout/admonition blocks.
- Default bullet conversion is `plain_child_rems`, so list markers do not become visible dash text in RemNote.
- Flashcard marker conversion is opt-in through `flashcardOptions.enabled`; `Front:: Back` stays plain text unless requested.
- Formula-safe handling validates math delimiters and chunks long formula-heavy text without splitting inside inline math.
- Markdown pipeline benchmarks cover small notes, the 5.9 nuclear-style note shape, formula-heavy notes, and tables/cards.

## Goal 6 Findings

- `set_rem_heading_level` uses the SDK font-size path and records child-count proof before and after mutation.
- Public style tools verify they do not create `Size`, `H1`, `H2`, `H3`, or `normal` child Rem pollution.
- Font color, span color, whole-Rem highlight, and span highlight remain separate style operations.
- `insert_inline_math` writes inline math rich-text nodes while preserving existing text styles.
- `insert_math_block` creates a separate child Rem containing block math rich text.
- `verify_note_design` now checks heading/font size, text color, highlight, child count, child order, bullet visibility, math rich-text type, visible math delimiters, and pollution child Rems.
- Verification returns repair signals for detected pollution, including dry-run `delete_rem_by_id` suggestions.
- The style correctness regression suite runs in smoke and live-test scripts before bridge checks.

## Goal 7 Findings

- Default write performance budgets are planning 500 ms, single write execution 3000 ms, verification 1000 ms, and total 5000 ms.
- High-level write results can include a performance report with phase timings, primary tool call count, internal write count, fallback status, warnings, and bottleneck layer.
- Slow successful writes return `success_with_performance_warning` instead of hidden success.
- Markdown tree create/append paths plan one optimized write first and use automatic section chunking only when payload size crosses safe thresholds.
- Section chunking keeps hierarchy intact and avoids splitting inside math blocks, card syntax, and section subtrees.
- The benchmark suite covers small notes, medium 5.9-style notes, large formula-heavy notes, flashcard sets, table notes, repair passes, and template-based notes.
- Bottlenecks are classified as model payload, MCP transport, server, bridge WebSocket, RemNote SDK, verification, or approval wait.

## Must Live-Test Before Goal 2+ Use

- `plugin.app.transaction` rollback behavior with multi-step writes
- `createSingleRemWithMarkdown` exact parent/index behavior in a live RemNote client
- `createTreeWithMarkdown` hierarchy behavior and returned Rem ordering in a live RemNote client
- `preview_markdown_note_tree`, `create_note_from_markdown_tree`, and `append_markdown_as_rem_tree` against a live RemNote client with real math, tables, and callouts
- Style and math tools against a live RemNote client: red H1, blue H3, span highlight, inline math, block math, and no child pollution
- Performance path through ChatGPT MCP plus live RemNote plugin WebSocket, including medium note timing and large-payload fallback behavior
- `createTable`, `rem.isTable`, and table filter behavior
- Reader APIs in PDF/web-reader contexts
- Queue APIs while RemNote queue is open
- Folder creation via modern folder APIs before exposing `create_folder`
- Dynamic permission requests for `DescendantsOfId`
