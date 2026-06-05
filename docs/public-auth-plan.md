# RemnoteMCP Public Auth Plan

Status: local mode is secure enough for local use; hosted public mode remains beta and must not be presented as production-ready until the gates below pass.

## Current Local Mode

- RemNote plugin connects to the local companion over WebSocket.
- Local MCP calls require the configured bearer token when the server is configured that way.
- Note bodies, raw markdown, local tokens, and session secrets must stay out of copied diagnostic bundles.
- Local mode must return local-mode failures such as `PLUGIN_NOT_CONNECTED`; it must not pretend hosted pairing exists.

## Hosted Public Target

Hosted mode needs these pieces before public release:

- Account identity backed by OAuth or another real authenticated account layer.
- Device pairing with short-lived pairing codes.
- Scoped plugin session token bound to one user and one device.
- Revocation UI for active sessions.
- Audit log that records tool name, risk tier, scope, and timing without note-body logging.
- Template sync only after server-side account/template ownership is enforced.

## Internal Tier Mapping

| RemnoteMCP operation tier | RemNote permission level |
| --- | --- |
| Read Only | `Read` |
| Read + Create | `ReadCreate` |
| Read + Create + Modify | `ReadCreateModify` |
| Full Control With Delete Approval | `ReadCreateModifyDelete` |
| Danger Zone | `ReadCreateModifyDelete` plus RemnoteMCP confirmation and audit gates |

| RemnoteMCP scope | RemNote permission scope story |
| --- | --- |
| Focused Rem | Runtime focus guard; future dynamic `DescendantsOfId` grant for focused root |
| Focused Rem + Descendants | Runtime focus-tree guard; future dynamic `DescendantsOfId` grant |
| Selected Rem | Runtime selected-rem guard |
| Selected Rem + Descendants | Runtime selected-tree guard; future dynamic `DescendantsOfId` grant |
| Approved Root | Runtime approved-root guard; best future fit for dynamic `DescendantsOfId` |
| Workspace | Current manifest `All`; should remain beta-only unless users opt into it |

## Manifest Position

The beta manifest still requests `All` + `ReadCreateModifyDelete` because RemnoteMCP exposes read, create, modify, move, repair, and guarded delete workflows. Runtime RemnoteMCP scopes narrow actual bridge behavior. Public listing should prefer dynamic `DescendantsOfId` where RemNote supports it, then reduce the manifest scope.

Official docs that shape this plan:

- https://plugins.remnote.com/advanced/permissions
- https://plugins.remnote.com/advanced/manifest
- https://plugins.remnote.com/advanced/storage
- https://plugins.remnote.com/advanced/settings

## Release Blockers

- Hosted auth must reject invalid, expired, revoked, or mismatched sessions before routing tools.
- Danger tools must require confirmation and guard checks.
- Diagnostics must prove redaction of tokens and note bodies.
- Hosted pairing must not open the plugin WebSocket before RemNote approval.
- Template sync must stay disabled until account ownership is implemented.
