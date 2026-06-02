# Security & Authorization Guide

This guide documents the security architecture, authorization checks, permission scopes, and logging safeguards enforced by the companion server.

---

## 1. Authentication Hierarchy

The server evaluates access permissions sequentially for every incoming MCP request:

```text
Incoming MCP Tool Request
  |
  +--> [1. Transport Auth] -- Has Bearer Token? (Local Mode)
  |                         -- Has OAuth Token? (Hosted Mode)
  |
  +--> [2. Expiry Check]   -- Is token valid and unexpired?
  |
  +--> [3. Registry Gating] -- Is tool allowed in active Profile?
  |
  +--> [4. Scope Match]    -- Does token cover the requested Rem ID?
  |                         (focused-rem-only / current-rem-tree / full-kb)
  |
  +--> [5. Operation Auth] -- For writes: requiresTrustedWrite checks?
  |                         -- For deletes: requires delete scope + guard fields?
  |
  v
Access Granted -> Forward to WebSocket Client
```

---

## 2. RemNote Access Scopes

RemNote tokens restrict access to specific nodes within the Knowledge Base (KB). These scopes form a strict subset hierarchy:

1. **`focused-rem-only`**: The tool can read or modify *only* the current active Rem being viewed by the user.
2. **`current-rem-tree`**: The tool can access the active Rem and its descendent child nodes.
3. **`full-kb`**: The tool has permission to interact with any node inside the user's Knowledge Base.

---

## 3. Trusted Write Modes

Write operations that modify formatting or structures have `requiresTrustedWrite: true` set in their policies. These actions are permitted only if:

* The OAuth token includes the `bridge:trusted_write` scope.
* **`trustedWriteMode`** is set to `'trusted-inside-scope'` (allowing background updates inside the active scope) or the user explicitly clicks an approval prompt in the plugin client.

---

## 4. Destructive Operation Guards

Destructive tools (`delete_rem_by_id` and `replace_rem`) require the `bridge:delete` OAuth scope.

### `delete_rem_by_id` Safety Check:
* **Dry-Run Default**: `dryRun` defaults to `true`.
* **Real Delete validation**: When `dryRun` is set to `false`, the client must supply:
  1. `confirmTitle`: Match confirmation string.
  2. `expectedParentId` or `expectedAncestorId`: Verifies parent alignment to prevent accidental deletions of shifted nodes.

---

## 5. Diagnostics Gating & Logs Redaction

To prevent sensitive information exposure:

* **Diagnostics Authorization**: The `/diagnostics` endpoint requires a dashboard cookie session or the `ADMIN_DEBUG_SECRET` provided in the `x-admin-debug-secret` header.
* **Health Endpoint Redaction**: Public hosted `/health` returns minimal boolean statuses without listing server directories, PIDs, active pairing codes, or connected usernames.
* **Log Scrubbing**: Access tokens, OAuth client secrets, session secrets, database URLs, and pairing codes are automatically redacted from error payloads and logs before they are written to disk.
