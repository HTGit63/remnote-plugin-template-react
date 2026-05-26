# AGENTS.md — RemNote ChatGPT Bridge Hosted-Auth Refinement

## Purpose

This file gives coding agents strict instructions for the next major refinement of the RemNote ChatGPT Bridge.

The bridge already has strong RemNote functionality. The next mission is not to add random tools. The next mission is to make the connection dependable, uniquely paired, secure, recoverable, and smooth for trusted focused/selected Rem workflows.

The target product is:

```text
ChatGPT / Vivy = reasoning layer
Render hosted bridge = identity, routing, session, dashboard, MCP endpoint
RemNote plugin = RemNote SDK access layer and final local scope enforcement
RemNote knowledge base = user-owned data
```

Do not build an AI chatbot inside RemNote.

Do not put OpenAI API keys in the plugin.

Do not call OpenAI from the plugin.

Do not scrape ChatGPT.

Do not scrape the RemNote DOM.

Do not pretend hosted public mode is complete until OAuth, pairing, persistent sessions, revocation, and per-user routing are implemented and tested.

---

## 0.3 Phase 7-12 Completion Status - 2026-05-26

Repo-side implementation status:

```text
Phase 7: complete - OAuth protected-resource metadata, authorization-server metadata, DCR, PKCE auth-code gated by RemNote plugin pairing approval, refresh rotation, revoke, bearer validation, scope checks, resource/audience checks.
Phase 8: complete - trusted focused/selected mode preserved, recommended mode exposed, destructive operations remain approval gated, plugin remains final scope authority.
Phase 9: complete - hosted session router wired into BridgeHub, paired plugin routing by user, reconnect/status states added, idempotency records stored without note content.
Phase 10: complete - rate limits, CSRF, security headers, body/payload limits, pairing one-time delivery, revocation, token expiry, no-token public guard.
Phase 11: complete - /connect pairing page, /pairing approval routes, plugin hosted pairing panel, recommended mode, status labels, local secret storage for plugin session secret.
Phase 12: complete at repo/local smoke level - auth, pairing, routing, server smoke, build, type, plugin validation, diff, and audit gates added/run.
```

Current hosted-auth wording:

```text
ChatGPT MCP OAuth + RemNote Plugin Pairing
```

Do not call this RemNote OAuth. Render cannot access RemNote by itself; RemNote note access comes through the active paired plugin and RemNote Plugin SDK.

External proof still required before public launch wording:

```text
real hosted PostgreSQL DATABASE_URL
real public HTTPS/WSS Render deployment
live RemNote sandbox with plugin connected
ChatGPT Developer Mode OAuth/MCP run through hosted URL
privacy policy/support URL/screenshots for submission
```

---

# 0. Current Repository Truth

## 0.1 Current working branch context

Work against the latest active branch unless the user says otherwise:

```text
release/final-polish
```

The current bridge is functionally strong. It already includes:

```text
RemNote plugin widget
typed bridge protocol
WebSocket bridge client inside RemNote plugin
Node/TypeScript companion server
MCP Streamable HTTP endpoint
single-port personal Render shape
tool registry and simple/full tool profiles
bounded read/navigation tools
safe write tools
structured note batch tools
polished note tree tools
formatting tools
flashcard tools
guarded delete-by-ID
diagnostics and health checks
approval lifecycle evidence
audit-log interfaces
hosted OAuth/pairing/session storage implementation
public-hosted per-user routing
```

Do not break the working bridge while adding hosted auth.

---

## 0.2 Important baseline limitations and 2026-05-26 status

The following were real code-level limitations at the start of the hosted-auth pass. Keep them here as regression guards.

### Auth is no longer only local-token based

Local/personal auth still uses:

```text
server/src/auth/local-token.ts
```

It grants local bridge scopes and validates a static bearer token or `x-remnote-bridge-token`.

This is acceptable for local/personal testing only.

Public multi-user hosted mode now uses OAuth bearer validation through:

```text
server/src/auth/oauth-routes.ts
server/src/auth/token-verifier.ts
```

---

### Public hosted mode uses explicit deployment mode

Legacy compatibility flag:

```bash
REMNOTE_BRIDGE_HOSTED_MODE=1
```

maps to personal token mode.

Public hosted OAuth now uses:

```bash
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
```

Startup requires HTTPS public URL, MCP resource, PostgreSQL storage, `DATABASE_URL`, and no static `REMNOTE_BRIDGE_TOKEN`.

---

### Auth/session/storage types are implemented

These files define and implement hosted mode primitives:

```text
server/src/auth/types.ts
server/src/storage/types.ts
server/src/storage/memory-store.ts
server/src/storage/postgres-store.ts
server/src/sessions/audit-log.ts
```

They include concepts such as:

```text
hosted_oauth
OAuthAccount
HostedSessionToken
PairedPluginSession
SessionStore
AuditLogger
```

PostgreSQL storage exists and is required for public-hosted mode outside loopback smoke tests.

---

### BridgeHub now has hosted per-user routing

Local/personal mode still holds one active plugin WebSocket connection.

Public-hosted mode now routes:

```text
user_id + device_id + plugin_session_id → plugin WebSocket connection
```

Regression guard: the server must route each ChatGPT MCP request only to the plugin session paired to the authenticated user.

---

### Render service has dashboard routes

The hosted server now has dashboard, login, pairing, logout, and diagnostics routes. Root/health still provide machine status.

Regression guard: the hosted Render side needs:

```text
login/logout
pair RemNote plugin
show ChatGPT OAuth status
show plugin connection status
show active device
show current access mode
show revocation controls
show diagnostics
```

---

### Plugin supports static and hosted session WebSocket hello

Local/personal mode sends:

```ts
{
  type: "plugin_hello",
  token: bridgeToken
}
```

Hosted mode now sends:

```ts
{
  type: "plugin_hello",
  deviceId,
  pluginSessionId,
  pluginSessionToken,
  protocolVersion,
  clientName
}
```

Static bridge token remains only for local/personal mode.

---

### Plugin wording supports hosted states

Hosted mode must keep these clearer states:

```text
Not paired
Pairing required
Paired but offline
Connecting
Connected
Reconnecting
Token expired
Session revoked
Another device connected
Server unreachable
```

---

### Trusted write behavior exists and must be preserved

Current permission model already supports:

```text
read_only
confirm_writes
trusted_writes
danger_zone
```

And scopes:

```text
focused_rem_only
focused_rem_and_descendants
selected_rem_only
selected_rem_and_descendants
approved_document_or_folder
workspace_allowed
```

This is good. Preserve it.

The recommended seamless mode is:

```text
trusted_writes + focused_rem_and_descendants
```

Safe writes inside the allowed scope should run without repeated RemNote-side approvals.

Destructive operations must still require explicit approval.

---

### Search scope filtering exists and must remain enforced

`search_rems` already does ancestor-chain post-filtering when a context root exists.

Do not regress this.

For scoped search, the tool must keep returning scope metadata:

```text
scopeRequested
scopeEnforcement
rawResultCount
filteredResultCount
filteredOutCount
```

---

### Server dependencies do not yet include hosted-auth dependencies

Current server dependencies are minimal:

```text
@modelcontextprotocol/sdk
ws
zod
```

Hosted auth will require new dependencies or explicit custom implementations for:

```text
OAuth/OIDC client integration
JWT/JWKS verification
secure cookies
CSRF protection
database driver or ORM
passwordless/session handling if needed
rate limiting
HTML/dashboard rendering or static assets
```

Prefer established libraries and providers. Do not hand-roll crypto or OAuth logic unless absolutely necessary.

---

# 1. External Standards to Follow

The hosted MCP server must follow current MCP/OpenAI auth expectations:

```text
OAuth 2.1 authorization-code flow with PKCE
OAuth protected resource metadata
OAuth authorization server metadata
Authorization: Bearer <access_token> on MCP requests
server-side token verification on every request
issuer validation
audience/resource validation
expiration validation
scope validation
short-lived access tokens
no access tokens in URLs
401 WWW-Authenticate challenge when auth is required
```

The MCP canonical resource must be stable, HTTPS, and consistent. Example:

```text
https://your-service.onrender.com
```

or:

```text
https://your-service.onrender.com/mcp
```

Choose one canonical resource and use it consistently in:

```text
protected resource metadata
authorization request resource parameter
token request resource parameter
token audience/resource claim
MCP token verification
WWW-Authenticate challenge
```

---

# 2. Non-Negotiable Rules

## 2.1 Product rules

Do not add random tools.

Do not expand tool surface while doing auth work.

Do not remove working local token mode until OAuth/pairing is fully tested.

Do not remove `trusted_writes`.

Do not loosen plugin-side scope enforcement.

Do not let server-side auth become the only write boundary.

Do not trust ChatGPT or the server alone to enforce RemNote scope.

Do not use workspace-wide access as the default.

Do not silently delete, replace, or move user notes.

Do not fake unsupported RemNote SDK features.

Do not log note bodies, markdown payloads, OAuth tokens, plugin tokens, refresh tokens, authorization codes, or secrets.

Do not put tokens in URL query strings except short-lived one-time pairing codes when there is no safer alternative, and even then avoid logging them.

---

## 2.2 Security rules

All hosted traffic must use:

```text
HTTPS for HTTP endpoints
WSS for plugin WebSocket
secure cookies
exact redirect URI matching
PKCE S256
state parameter validation
CSRF protection for dashboard mutation routes
short-lived access tokens
hashed stored session tokens
revocation support
rate limiting on auth and pairing endpoints
audit logs without note content
```

Every token stored server-side must be hashed unless it must be recoverable for a valid technical reason.

Every user-specific MCP call must resolve to:

```text
authenticated user_id
valid scopes
active paired plugin session
allowed RemNote permission scope
connected plugin WebSocket
```

If any of those are missing, fail safely.

---

## 2.3 Data privacy rules

Never persist note content by default.

Never log full Rem text, markdown payloads, rich text payloads, or raw note trees.

Acceptable logs:

```text
request id
tool name
user id hash or internal id
device id
session id
status
error code
duration
scope
permission mode
connection status
created/updated/deleted Rem IDs when needed for recovery
partial execution evidence without note body
```

---

## 2.4 RemNote safety rules

Plugin-side scope enforcement remains mandatory.

Destructive tools always require explicit approval.

Public delete remains:

```text
delete_rem_by_id
```

Hidden legacy delete tools stay hidden unless intentionally enabled for local development:

```text
delete_rem
delete_focused_rem
delete_selected_rem
```

`delete_rem_by_id` must default to:

```text
dryRun: true
```

Real delete requires guard evidence:

```text
dryRun: false
expectedParentId or expectedAncestorId
optional confirmTitle match
post-delete verification
```

If delete status is uncertain, return unknown/retryable status and require a fresh dry-run.

---

# 3. Target Hosted Architecture

## 3.1 Final target

```text
ChatGPT App
  ↓ OAuth 2.1 + PKCE
Render Hosted MCP Server
  ↓ token verification + user routing
Bridge Session Router
  ↓ user_id → active plugin_session_id
Secure WSS Bridge
  ↓ plugin session token + heartbeat
RemNote Plugin
  ↓ local permission mode + local scope enforcement
Focused / Selected / Approved Rem subtree
```

---

## 3.2 Account and pairing flow

```text
1. User opens Render dashboard.
2. User signs in with Google or another established OAuth/OIDC provider.
3. Render creates or loads user account.
4. User opens RemNote plugin.
5. Plugin shows Not Paired.
6. User clicks Pair RemNote.
7. Plugin opens hosted pairing URL.
8. Server creates short-lived pairing challenge.
9. User confirms pairing in dashboard.
10. Plugin receives local device/session credentials.
11. Plugin connects to WSS using plugin session token.
12. ChatGPT connects to MCP using OAuth.
13. Server maps ChatGPT OAuth user → paired plugin session.
14. MCP tool calls route only to that user's RemNote plugin.
```

---

## 3.3 Required identity objects

Implement persistent storage for:

```text
users
oauth_accounts
dashboard_sessions
plugin_devices
plugin_sessions
pairing_challenges
mcp_clients
mcp_authorization_codes
mcp_access_tokens or token hashes
mcp_refresh_tokens or token hashes
scope_grants
audit_events
idempotency_records
request_outcomes
```

Start with PostgreSQL for durable state. Redis may be added for short-lived challenges and rate limiting, but it should not be the only durable store.

---

# 4. Required Execution Order

Do these phases in order.

Do not skip phases.

Do not mix auth, routing, and UI in one uncontrolled change.

Each phase must leave the repo buildable.

---

# Phase 0 — Baseline, Branch Safety, and Proof Log

## Goal

Protect the current working bridge before major hosted-auth work begins.

## Tasks

1. Confirm the active branch.

```bash
git status
git branch --show-current
```

2. Create a new branch for hosted auth.

```bash
git checkout release/final-polish
git pull
git checkout -b feature/hosted-auth-pairing
```

3. Record current behavior in:

```text
docs/hosted-auth-baseline.md
```

Include:

```text
current branch
commit SHA
tool profile
public tool count in full profile
public tool count in simple profile
hidden delete tools
current Render env shape
current known limitations
```

4. Run baseline validation.

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm audit
npm audit --omit=dev
git diff --check
```

5. If RemNote is available, run live sandbox test.

```bash
npm run bridge:live-test
```

If RemNote is not connected, record that the live test reached MCP but plugin tools were unavailable.

## Acceptance Criteria

```text
new branch exists
baseline doc exists
current tool behavior recorded
automated checks pass or failures are documented
no hosted-auth code added yet
```

---

# Phase 1 — Mode Boundaries and Configuration Cleanup

## Goal

Make local, personal hosted, and public hosted modes explicit before adding OAuth.

## Required modes

```text
local_dev
personal_hosted_token
public_hosted_oauth
```

## Tasks

1. Refactor config in:

```text
server/src/config.ts
```

Add explicit mode parsing:

```ts
type BridgeDeploymentMode =
  | "local_dev"
  | "personal_hosted_token"
  | "public_hosted_oauth";
```

2. Preserve existing local behavior.

3. Preserve personal hosted token behavior.

4. Keep public hosted OAuth blocked until Phase 5+, then enable only behind strict config validation.

5. Add canonical URL config:

```bash
REMNOTE_BRIDGE_PUBLIC_BASE_URL=https://your-service.onrender.com
REMNOTE_BRIDGE_MCP_RESOURCE=https://your-service.onrender.com
REMNOTE_BRIDGE_DASHBOARD_URL=https://your-service.onrender.com/dashboard
```

6. Add strict validation:

```text
local_dev:
  may bind localhost
  token required unless explicit no-token dev flag is set

personal_hosted_token:
  must bind 0.0.0.0
  must use HTTPS/WSS externally
  must require static token
  must allow only configured CORS origins

public_hosted_oauth:
  must require DB URL
  must require OAuth provider config
  must require public base URL
  must not use static bridge token as public auth
```

7. Add environment example docs:

```text
.env.local.example
.env.personal-hosted.example
.env.public-hosted.example
```

## Acceptance Criteria

```text
all existing tests pass
current local token mode still works
personal hosted token mode still works
public hosted mode either stays blocked before Phase 5 or requires strict OAuth/PostgreSQL config after implementation
config errors are helpful
```

---

# Phase 2 — Render Dashboard Foundation

## Goal

Give the Render service a real user-facing web UI without changing auth behavior yet.

## Files likely involved

```text
server/src/app.ts
server/src/http.ts
server/src/dashboard/*
server/src/static/*
```

## Tasks

1. Replace root JSON-only page with simple HTML dashboard shell.

2. Keep JSON status available at:

```text
GET /health
GET /diagnostics
GET /api/status
```

3. Dashboard should show:

```text
server status
bridge connected / disconnected
tool profile
public tool count
deployment mode
current auth mode
plugin connected status
last connected time
last disconnected time
```

4. For personal token mode, dashboard can show:

```text
not signed in
personal token mode active
public OAuth mode requires hosted config
```

5. Add UI placeholders for future:

```text
Sign in
Pair RemNote
Connected devices
ChatGPT connection
Revoke session
Audit log
```

6. Do not add fake sign-in buttons that pretend to work.

7. Use strict security headers:

```text
content-security-policy
x-content-type-options
referrer-policy
cache-control
frame-ancestors
```

8. Keep `/mcp` behavior unchanged.

## Acceptance Criteria

```text
/ shows dashboard HTML
/health still returns JSON
/diagnostics still requires auth where appropriate
/mcp behavior unchanged
no note data displayed
no secrets displayed
```

---

# Phase 3 — Persistent Storage Layer

## Goal

Add durable storage before account login, pairing, or OAuth.

## Preferred storage

Use PostgreSQL for durable state.

Add an in-memory store only for tests and local smoke tests.

## New files

```text
server/src/storage/types.ts
server/src/storage/postgres-store.ts
server/src/storage/memory-store.ts
server/src/storage/migrations/*
server/src/storage/index.ts
```

## Required interfaces

```ts
interface UserStore {}
interface OAuthAccountStore {}
interface DashboardSessionStore {}
interface PluginDeviceStore {}
interface PluginSessionStore {}
interface PairingChallengeStore {}
interface McpOAuthStore {}
interface AuditEventStore {}
interface IdempotencyStore {}
```

## Required tables

```text
users
oauth_accounts
dashboard_sessions
plugin_devices
plugin_sessions
pairing_challenges
mcp_clients
mcp_authorization_codes
mcp_tokens
scope_grants
audit_events
idempotency_records
request_outcomes
```

## Token storage rule

Store only hashes for:

```text
dashboard session tokens
plugin session tokens
pairing challenge secrets
authorization codes
access tokens if persisted
refresh tokens
```

Use constant-time comparison for secret verification.

## Acceptance Criteria

```text
storage interfaces exist
memory store passes unit/smoke tests
PostgreSQL migrations exist
no OAuth flow depends on in-memory-only state
tokens are hashed at rest
no note content is stored
```

---

# Phase 4 — User Login for Render Dashboard

## Goal

Allow the user to sign into the Render dashboard with Google or an established OIDC provider.

## Strong preference

Use an established identity provider or library.

Do not hand-roll Google OAuth/OIDC unless necessary.

## Required routes

```text
GET  /login
GET  /auth/start
GET  /auth/callback
POST /logout
GET  /dashboard
```

## Required behavior

1. User signs into dashboard.
2. Server creates local `user_id`.
3. OAuth account is linked to user.
4. Dashboard session cookie is issued.

## Cookie requirements

```text
HttpOnly
Secure in hosted mode
SameSite=Lax or Strict
short expiration
rotation on login
server-side revocation
```

## CSRF requirements

Dashboard mutation routes must require CSRF tokens.

This includes:

```text
logout
pair/start
pair/confirm
revoke device
disconnect session
change default permission mode
```

## Acceptance Criteria

```text
dashboard login works
logout revokes server-side session
dashboard route requires auth
CSRF protects mutation routes
no MCP auth changed yet
no plugin pairing yet
```

---

# Phase 5 — RemNote Plugin Pairing

## Goal

Bind one RemNote plugin installation/device to one signed-in dashboard user.

## Required plugin UI changes

Add or refactor:

```text
src/widgets/components/PairingPanel.tsx
src/widgets/hooks/usePairingState.ts
src/bridge/pairing.ts
```

Plugin default view must show:

```text
Not paired
Pair this RemNote
Paired as user@email.com
Connected / Reconnecting / Offline
Revoke pairing
```

## Pairing flow

Use short-lived pairing challenge.

Recommended flow:

```text
1. Plugin creates local deviceId if missing.
2. Plugin calls /pair/start or opens /pair/start URL with device public info.
3. Server creates pairingChallengeId and one-time code.
4. User signs into dashboard if needed.
5. User confirms pairing.
6. Plugin completes pairing and receives:
   - deviceId
   - pluginSessionId
   - pluginSessionToken
   - expiresAt
7. Plugin stores session token in RemNote local storage, not synced storage.
8. Plugin reconnects WSS with session credentials.
```

## Storage rule inside RemNote plugin

Use local storage for sensitive plugin session token.

Synced storage may store non-sensitive preferences only:

```text
preferred permission mode
preferred permission scope
server URL
UI preferences
```

Do not sync plugin session token across devices unless explicitly designed.

## WebSocket hello update

Change plugin hello from static token to:

```ts
{
  type: "plugin_hello",
  protocolVersion: 1,
  clientName: "remnote-plugin",
  deploymentMode: "public_hosted_oauth" | "personal_hosted_token" | "local_dev",
  deviceId,
  pluginSessionId,
  pluginSessionToken
}
```

Personal/local mode may continue to support:

```ts
token: bridgeToken
```

## Server validation

Server must verify:

```text
pluginSessionId exists
token hash matches
session not expired
session not revoked
device belongs to user
device is allowed
```

## Acceptance Criteria

```text
plugin can pair to signed-in user
paired plugin connects to hosted WSS
invalid plugin token is rejected
revoked plugin session cannot connect
expired plugin session shows re-pair required
local/personal token mode still works
```

---

# Phase 6 — Multi-User Bridge Session Router

## Goal

Replace single global plugin socket behavior with per-user/per-device routing.

## Current problem

Current bridge hub is effectively:

```text
one active pluginSocket
```

Hosted mode needs:

```text
user_id → one or more plugin sessions → active WebSocket connections
```

## New design

Create:

```text
server/src/bridge/session-router.ts
server/src/bridge/plugin-connection.ts
server/src/bridge/request-ledger.ts
```

Refactor existing:

```text
server/src/bridge-hub.ts
```

Do not destroy local behavior. Wrap it.

## Required routing key

Every MCP tool call must include authenticated principal:

```ts
{
  userId,
  sessionId,
  scopes,
  authMode
}
```

Then route:

```text
principal.userId → active paired plugin connection
```

## Multiple device policy

Start simple:

```text
one active plugin device per user by default
```

If a second plugin connects:

```text
either replace old connection and record reason
or reject new connection with DEVICE_CONFLICT
```

Expose this clearly in dashboard and plugin UI.

Do not silently route to the wrong device.

## Required error codes

```text
PLUGIN_NOT_PAIRED
PLUGIN_NOT_CONNECTED
DEVICE_CONFLICT
PLUGIN_SESSION_EXPIRED
PLUGIN_SESSION_REVOKED
NO_ACTIVE_DEVICE
```

## Acceptance Criteria

```text
two users cannot access each other's plugin
one user's ChatGPT call routes only to their paired plugin
wrong token cannot hijack connection
device conflict is explicit
local token mode still supports one active plugin
```

---

# Phase 7 — ChatGPT OAuth / MCP Authorization

## Goal

Make ChatGPT connect using OAuth instead of manual static token.

## Required endpoints

Protected resource metadata:

```text
GET /.well-known/oauth-protected-resource
```

Authorization server metadata:

```text
GET /.well-known/oauth-authorization-server
```

OAuth flow:

```text
GET  /oauth/authorize
POST /oauth/token
POST /oauth/revoke
```

Optional but recommended:

```text
POST /oauth/register
GET  /oauth/jwks
```

## Required OAuth features

```text
authorization-code flow
PKCE S256
state validation
resource parameter support
exact redirect URI validation
short-lived access tokens
refresh token rotation if refresh tokens are used
scope enforcement
audience/resource validation
JWT signature verification or opaque token introspection
```

## ChatGPT client registration

Prefer one of:

```text
CIMD if supported
DCR if implemented
predefined OAuth client if simpler for initial private testing
```

Do not require the user to manually paste API keys or bridge tokens into ChatGPT for public hosted mode.

## MCP auth behavior

For unauthenticated protected tool calls, return:

```text
401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://.../.well-known/oauth-protected-resource", scope="bridge:read bridge:write"
```

Each tool descriptor should declare security schemes.

Do not rely only on server-level auth defaults.

## Required scopes

Use narrow scopes:

```text
bridge:read
bridge:write
bridge:trusted_write
bridge:delete
bridge:admin
bridge:pair
```

Recommended default ChatGPT scopes:

```text
bridge:read
bridge:write
```

Only grant delete/admin when explicitly needed.

## Token verification

Every MCP request must validate:

```text
signature or token hash
issuer
audience/resource
expiration
not-before if present
revocation status
scopes
user id
```

If invalid:

```text
401 for missing/expired/invalid token
403 for valid token with insufficient scope
```

## Acceptance Criteria

```text
ChatGPT auth flow starts from MCP 401 challenge
OAuth authorization-code + PKCE completes
ChatGPT sends Authorization: Bearer token
server verifies token on every MCP request
wrong audience token is rejected
expired token is rejected
insufficient scope returns 403
MCP request resolves user_id
```

---

# Phase 8 — Trusted Write Mode Without Repeated RemNote Approval

## Goal

Make the seamless workflow safe and dependable.

## Required default recommendation

For normal note writing:

```text
permissionMode = trusted_writes
permissionScope = focused_rem_and_descendants
```

or:

```text
permissionMode = trusted_writes
permissionScope = selected_rem_and_descendants
```

## Approval rules

| Operation | Trusted focused/selected mode |
|---|---|
| read focused Rem | no RemNote approval |
| read selected Rem | no RemNote approval |
| create child under allowed root | no RemNote approval |
| append/update/style inside allowed root | no RemNote approval |
| create structured note tree inside allowed root | no RemNote approval |
| flashcard creation inside allowed root | no RemNote approval |
| search inside scoped root | no RemNote approval |
| replace Rem | approval required |
| delete Rem | approval required |
| workspace-level create | blocked unless workspace scope |
| workspace-level search | blocked unless workspace scope |

## Server-side mirror

Server should store the user's default preference, but plugin remains final authority.

Server may know:

```text
preferredPermissionMode
preferredPermissionScope
approvedRootRemId metadata if user set it
```

But the plugin must still enforce actual RemNote scope.

## Required UI

Plugin should show a one-click mode:

```text
Use Recommended Note Mode
```

Dashboard should show current mode:

```text
Focused Rem + Descendants
Trusted Writes
Destructive actions still require confirmation
```

## Acceptance Criteria

```text
safe writes inside focused descendants do not request repeated RemNote approval
safe writes outside scope are blocked
destructive tools still require approval
trusted mode is visible to user
scope can be downgraded immediately
```

---

# Phase 9 — Resilience, Reconnect, and Safe Failure Handling

## Goal

Make the connection dependable under real hosted conditions.

## Required connection states

Both dashboard and plugin must display:

```text
not_paired
pairing
paired_offline
connecting
connected
reconnecting
server_unreachable
token_expired
session_revoked
device_conflict
stale_connection
```

## WebSocket requirements

Keep heartbeat/ping-pong behavior.

Add:

```text
connection id
last heartbeat timestamp
server instance id
device id
session id
reconnect attempt count
close code/reason
```

## Render deployment behavior

Handle:

```text
server restart
Render redeploy
SIGTERM
stale WebSocket
plugin browser sleep/wake
network interruption
duplicate plugin tab/window
```

## Request safety rules

Read requests:

```text
may retry once after reconnect
```

Safe writes:

```text
must require idempotencyKey for auto-retry
must not blindly retry if request reached plugin
must verify target state before retry where possible
```

Deletes:

```text
never auto-retry real delete
must require fresh dry-run preview after uncertainty
```

Unknown write status:

```text
return RETRYABLE_UNKNOWN_WRITE_STATUS
include lifecycle
include requestId
include recommendation
```

Unknown delete status:

```text
return RETRYABLE_UNKNOWN_DELETE_STATUS
include lifecycle
require target re-check
```

## Idempotency

Persist idempotency records for high-level write tools:

```text
apply_structured_note_batch
create_polished_note_tree
create_styled_rem_tree
apply_style_plan
flashcard batch operations if added
```

Idempotency record should include:

```text
userId
tool
idempotencyKey
target root
request hash
status
createdRemIds
updatedRemIds
startedAt
finishedAt
errorCode
```

Do not store full note content.

## Acceptance Criteria

```text
Render redeploy does not corrupt state
disconnect during read gives clean retry/failure
disconnect during safe write gives idempotent recovery or unknown write status
disconnect during delete never claims success without verification
pending requests always resolve once
recent request ledger remains useful
```

---

# Phase 10 — Security Hardening

## Goal

Make the hosted system safe enough for trusted testers.

## Required controls

```text
rate limiting on /oauth/*, /pair/*, /mcp
CSRF on dashboard mutations
CORS allowlist
strict origin checks
secure cookie settings
CSP headers
no token logs
no note content logs
request body limits
WebSocket payload limits
pairing challenge expiration
session revocation
access token expiration
refresh token rotation if used
audit log retention policy
```

## OAuth-specific controls

```text
exact redirect URI matching
state validation
PKCE verifier validation
resource parameter required
audience/resource validation
issuer validation
scope validation
JWKS cache with rotation
clock skew handling
```

## Optional but valuable

```text
OpenAI connector mTLS validation if the deployment environment supports it
admin allowlist during private beta
email/domain allowlist during early testing
```

## Acceptance Criteria

```text
security checklist documented
auth failure paths return correct 401/403
tokens are never logged
pairing code cannot be reused
revoked session cannot call tools
wrong user cannot route to another plugin
```

---

# Phase 11 — Dashboard and Plugin UX Finalization

## Goal

Make the product easy to understand for normal users.

## Dashboard required screens

```text
Home / status
Login
Pair RemNote
Connected devices
ChatGPT connection
Permissions
Audit / recent activity
Diagnostics
Support / privacy links
```

## Dashboard status cards

```text
Signed in as
ChatGPT OAuth connected
RemNote plugin connected
Active device
Last heartbeat
Current access scope
Current write mode
Last successful tool call
Last failed tool call
```

## Plugin required screens

```text
Not paired
Pairing
Connected
Reconnecting
Approval needed
Recommended Note Mode
Advanced diagnostics
```

## UX rules

Default view must be simple.

Advanced diagnostics must be hidden.

Approval view must be clear and scrollable.

Approval footer must remain fixed.

Do not show local server IDs to normal users unless in advanced diagnostics.

Do not show raw JSON by default.

## Acceptance Criteria

```text
new user knows what to click
paired user sees connected state
offline user gets clear next action
trusted mode is understandable
dangerous actions are clearly separated
```

---

# Phase 12 — Tests, QA, Docs, and Release Gate

## Goal

Prove the bridge works before calling it done.

## Required automated tests

Add or update tests for:

```text
config mode validation
protected resource metadata
authorization server metadata
PKCE authorization flow
token verification
expired token rejection
wrong audience rejection
scope rejection
pairing challenge creation
pairing challenge expiration
pairing challenge one-time use
plugin session verification
plugin session revocation
per-user bridge routing
device conflict
trusted write scope enforcement
idempotency behavior
unknown write status
unknown delete status
dashboard CSRF
no note content in audit logs
```

## Required validation commands

```bash
npm run check-types
npm run validate
npm run build
npm run server:build
npm run server:smoke
npm run bridge:live-test
npm audit
npm audit --omit=dev
git diff --check
```

Add new scripts if needed:

```bash
npm run server:test:auth
npm run server:test:pairing
npm run server:test:routing
npm run server:test:security
```

## Required manual RemNote tests

Use a disposable sandbox:

```text
Test KB Space / ChatGPT Bridge Sandbox
```

Manual tests:

```text
pair plugin
connect WSS
connect ChatGPT OAuth
get_bridge_status
get_focused_rem
get_rem_tree
search_rems scoped to sandbox
create_polished_note_tree
apply_structured_note_batch
apply_style_plan
verify_note_design
create flashcards
delete_rem_by_id dryRun
delete_rem_by_id real delete on disposable child
disconnect plugin mid-read
disconnect plugin mid-write
Render redeploy while plugin is connected
token expiration
session revocation
wrong user access attempt
```

## Required Render tests

```text
/ dashboard loads
/health works
/diagnostics works with auth
/.well-known/oauth-protected-resource works
/.well-known/oauth-authorization-server works
/oauth/authorize works
/oauth/token works
/mcp returns OAuth challenge when needed
/mcp accepts valid bearer token
/remnote-bridge accepts paired plugin WSS
/remnote-bridge rejects invalid plugin session
```

## Docs to update

```text
README.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
docs/hosted-auth-design.md
docs/render-deployment.md
docs/oauth-setup.md
docs/pairing-flow.md
docs/test-matrix.md
chatgpt-app-submission.json
```

## Release wording

Correct:

```text
The bridge supports local and personal hosted token modes. Public hosted OAuth mode is implemented only after OAuth, pairing, persistent sessions, revocation, routing, and live RemNote tests pass.
```

Incorrect:

```text
Public hosted mode is ready because Render deploys.
OAuth is done because auth types exist.
Pairing is done because a static bridge token works.
Multi-user routing works because one plugin socket works.
```

## Acceptance Criteria

```text
all tests pass
manual RemNote sandbox passes
Render hosted flow passes
ChatGPT OAuth flow passes
wrong-user routing is impossible in tests
revocation works
docs are honest
public hosted mode flag can be enabled safely
```

---

# 5. File-Level Implementation Guide

## Server files likely to change

```text
server/src/config.ts
server/src/app.ts
server/src/http.ts
server/src/index.ts
server/src/bridge-hub.ts
server/src/auth/local-token.ts
server/src/auth/types.ts
server/src/sessions/types.ts
server/src/sessions/audit-log.ts
server/src/mcp-server.ts
server/src/tools/*
server/package.json
render.yaml
```

## Server files likely to add

```text
server/src/auth/oauth-provider.ts
server/src/auth/oauth-metadata.ts
server/src/auth/oauth-authorize.ts
server/src/auth/oauth-token.ts
server/src/auth/token-verifier.ts
server/src/auth/pkce.ts
server/src/auth/jwks.ts
server/src/auth/csrf.ts
server/src/auth/cookies.ts
server/src/auth/rate-limit.ts

server/src/storage/types.ts
server/src/storage/postgres-store.ts
server/src/storage/memory-store.ts
server/src/storage/migrations/*

server/src/pairing/routes.ts
server/src/pairing/service.ts
server/src/pairing/types.ts

server/src/dashboard/routes.ts
server/src/dashboard/templates.ts
server/src/dashboard/assets.ts

server/src/bridge/session-router.ts
server/src/bridge/plugin-connection.ts
server/src/bridge/request-ledger.ts
```

## Plugin files likely to change

```text
src/bridge/client.ts
src/bridge/protocol.ts
src/bridge/status.ts
src/widgets/bridge-status.tsx
src/widgets/components/*
src/remnote/permissions.ts
```

## Plugin files likely to add

```text
src/bridge/pairing.ts
src/bridge/session.ts
src/widgets/components/PairingPanel.tsx
src/widgets/components/ConnectionPanel.tsx
src/widgets/components/TrustedModePanel.tsx
src/widgets/hooks/usePairingState.ts
src/widgets/hooks/useHostedBridgeConnection.ts
```

## Docs likely to change

```text
README.md
ARCHITECTURE.md
SAFETY.md
NEXT_STEPS.md
docs/*
chatgpt-app-submission.json
```

---

# 6. Tool Behavior Preservation Rules

Do not regress these working behaviors:

```text
get_bridge_status
get_bridge_diagnostics
run_bridge_health_check
get_remnote_capability_guide
ping_remnote_plugin
get_plugin_status
get_focused_rem
get_rem
get_rem_tree
get_rem_rich
debug_get_raw_rich_text
get_current_selection
get_children
get_rem_breadcrumbs
search_rems
get_document_or_folder_tree
create_rem
append_to_rem
create_document
update_rem
replace_rem
move_rem
reorder_children
create_rem_tree
update_rem_rich
set_rem_heading_level
set_rem_text_color
set_rem_highlight_color
set_text_span_color
set_text_span_highlight
set_rem_type
set_hide_bullet
clear_rem_formatting
create_styled_rem_tree
apply_structured_note_batch
create_polished_note_tree
apply_style_plan
verify_note_design
create_basic_flashcard
create_concept_card
create_descriptor_card
create_cloze_card
create_multiple_choice_card
create_list_answer_card
delete_rem_by_id
```

Known unsupported behavior remains unsupported:

```text
create_folder returns SDK_UNSUPPORTED
clear_rem_formatting may be partial and must report honestly
```

Hidden legacy deletes remain hidden by default:

```text
delete_rem
delete_focused_rem
delete_selected_rem
```

---

# 7. Definition of Done

The hosted-auth refinement is done only when all are true:

```text
1. Local dev mode still works.
2. Personal hosted token mode still works.
3. Public hosted OAuth mode has real dashboard login.
4. RemNote plugin pairing works.
5. ChatGPT OAuth works through MCP.
6. MCP tokens are verified on every request.
7. User A cannot reach User B's RemNote plugin.
8. Plugin session revocation works.
9. Token expiration works.
10. Pairing challenge is one-time and short-lived.
11. Plugin stores sensitive session token locally, not synced.
12. Server routes by user_id and plugin_session_id.
13. Trusted focused/selected write mode is seamless for safe writes.
14. Destructive tools still require approval.
15. Unknown write/delete states are handled safely.
16. Render redeploy/reconnect does not corrupt writes.
17. Dashboard is usable.
18. Plugin UI is clear.
19. Tests cover auth, pairing, routing, session expiry, revocation, and scope.
20. Docs are honest about what is production-ready.
```

---

# 8. Coding Agent Behavior

When implementing:

```text
preserve working behavior first
use feature flags
commit small phases
run checks after each phase
document limitations honestly
never fake auth
never fake pairing
never fake SDK support
never widen RemNote scope silently
never log secrets
never log note bodies
```

If a change risks breaking current working tools, stop and make the smallest possible isolated change.

If an implementation choice is uncertain, prefer:

```text
established identity provider over custom OAuth
database-backed sessions over memory
scoped permissions over broad permissions
explicit errors over silent fallback
one active device over ambiguous routing
safe failure over automatic retry
```

---

# 9. Final Mission Statement

The bridge already knows how to work with RemNote.

Now make it trustworthy.

The final product should feel like:

```text
I sign in.
I pair my RemNote.
ChatGPT connects to my RemNote only.
The connection stays stable.
If it disconnects, it fails safely.
If I choose focused/selected trusted mode, safe note writing is smooth.
Dangerous actions still ask.
My notes are not leaked.
My tokens are not exposed.
Another user cannot touch my RemNote.
```

That is the standard for this phase.
