# RemNote SDK Notes

Last audited: 2026-06-03

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

## Must Live-Test Before Goal 2+ Use

- `plugin.app.transaction` rollback behavior with multi-step writes
- `createSingleRemWithMarkdown` and `createTreeWithMarkdown` hierarchy behavior
- `createTable`, `rem.isTable`, and table filter behavior
- Reader APIs in PDF/web-reader contexts
- Queue APIs while RemNote queue is open
- Folder creation via modern folder APIs before exposing `create_folder`
- Dynamic permission requests for `DescendantsOfId`
