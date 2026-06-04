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

## Must Live-Test Before Goal 2+ Use

- `plugin.app.transaction` rollback behavior with multi-step writes
- `createSingleRemWithMarkdown` exact parent/index behavior in a live RemNote client
- `createTreeWithMarkdown` hierarchy behavior and returned Rem ordering in a live RemNote client
- `createTable`, `rem.isTable`, and table filter behavior
- Reader APIs in PDF/web-reader contexts
- Queue APIs while RemNote queue is open
- Folder creation via modern folder APIs before exposing `create_folder`
- Dynamic permission requests for `DescendantsOfId`
