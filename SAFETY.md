# Safety

## Core Rules

- No server-side RemNote SDK calls.
- No DOM scraping.
- No fake hosted identity.
- No success result when plugin socket is unavailable.
- No silent delete or destructive replace.
- No public hosted diagnostics with PID, cwd, sessions, tokens, pairing secrets, or storage internals.

## Hosted Auth

Hosted MCP calls validate:

```text
bearer token presence
token expiry
issuer/audience/resource
pairing approval/connection state
OAuth scopes
RemNote access scope
trusted write mode
delete scope for destructive tools
```

Trusted writes require `bridge:trusted_write` and `trustedWriteMode: "trusted-inside-scope"`.

Destructive tools require `bridge:delete`. Real `delete_rem_by_id` additionally requires:

```text
dryRun: false
confirmTitle
expectedParentId or expectedAncestorId
```

Real `replace_rem` requires `expectedPlainText` unless `dryRun=true`.

## Diagnostics

Public hosted `/` and `/health` return minimal status only.

Hosted `/diagnostics` requires:

```text
dashboard session
or ADMIN_DEBUG_SECRET via x-admin-debug-secret
```

Local `/diagnostics` uses local bridge token auth.

Secrets must not appear in diagnostics or logs:

```text
SESSION_SECRET
ADMIN_DEBUG_SECRET
DATABASE_URL
OAuth secrets
plugin session secret
access/refresh tokens
pairing code
authorization code
```

## Delete Tools

Absent legacy tools:

```text
delete_rem
delete_focused_rem
delete_selected_rem
```

Allowed gated tool:

```text
delete_rem_by_id
```

It is dry-run by default and hidden unless delete exposure is enabled.

## Verification Commands

```bash
npm run server:test:security
npm run server:test:hosted-diagnostics
npm run server:test:boundaries
```
