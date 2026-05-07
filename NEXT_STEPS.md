# Next Steps

## Completed Milestones

1. Documentation and product direction updated.
2. OpenAI runtime dependency removed from the active plugin path.
3. RemNote SDK logic refactored into service files.
4. AI sidebar replaced with bridge-status widget.
5. Typed bridge protocol added.
6. WebSocket bridge client added inside the plugin.
7. Local companion server skeleton added.
8. Read-only tool flow implemented through MCP and the bridge.
9. Safe create/append write flow implemented with RemNote-side approval.
10. MCP/ChatGPT tool layer added.

## Shipping Verification

Run these before release:

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
```

## Manual RemNote QA

Use a sandbox document first:

```text
Test KB Space / ChatGPT Bridge Sandbox
```

Manual checks:

- start plugin dev server with `npm run dev`;
- start companion server with a generated `REMNOTE_BRIDGE_TOKEN`;
- enter the same token in the plugin setting;
- confirm the bridge-status widget shows connected;
- focus a test Rem and call `get_focused_rem`;
- call `append_to_rem`, approve in RemNote, and verify child creation;
- call `append_to_rem`, reject in RemNote, and verify no child is created.

## Release Notes

The MCP layer intentionally exposes only read tools plus safe create/append writes. Internal `replace_rem` and `delete_rem` bridge operations remain blocked from ChatGPT/MCP exposure until a separate destructive-action review is completed.
