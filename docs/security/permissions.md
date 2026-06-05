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
  +--> [3. Registry Gating] -- Is tool allowed in active access tier?
  |
  +--> [4. Scope Match]    -- Does token cover the requested Rem ID?
  |                         (focused-rem-only / current-rem-tree / full-kb)
  |
  +--> [5. Operation Auth] -- Read / Read+Create / Read+Create+Modify / Delete checks
  |                         -- For deletes: danger tier + delete scope + guard fields?
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

## 3. Operation Permission Modes

The plugin permission mode maps bridge operations to RemNote manifest permission levels:

| Bridge mode | RemNote operation level |
| :--- | :--- |
| `read_only` | `Read` |
| `read_create` | `ReadCreate` |
| `read_create_modify` | `ReadCreateModify` |
| `full_control_delete_approval` | `ReadCreateModifyDelete`, with per-delete approval |
| `danger_zone` | `ReadCreateModifyDelete`, only for explicit destructive testing/admin |

Write operations that modify formatting or structures still require either trusted mode inside the active scope or explicit plugin approval.

---

## 4. Destructive Operation Guards

`delete_rem_by_id` requires the `danger` access tier, `REMNOTE_BRIDGE_ENABLE_DELETE_TOOL=1`, the `bridge:delete` OAuth scope, and plugin delete approval. `replace_rem` stays hidden until stronger guards are live-verified.

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
