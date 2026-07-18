# Stage 4-5 verification record

Date: 2026-07-18

Branch: `fix/remnote-mcp-mass-note-creation-stability`

Pre-change HEAD: `ffb6c02d303ced7eb5c59fe374dfcec57d3ba1dc`

Scope: `AGENTS.md` Stage 4 and Stage 5 only

## Verdict

- Stage 4 execution work: complete.
- Stage 4 acceptance gate: **BLOCKED** by exact-commit remote CI and PostgreSQL durability proof.
- Stage 5 browser/UI work: complete in the real RemNote SDK sandbox renderer.
- Stage 5 acceptance gate: **BLOCKED** because the native Wayland RemNote window could not be automated or captured and the companion server was not running.
- No native RemNote, deployed-release, or production-readiness claim is made.

## Defects fixed through TDD

### Widget asset injection

The standalone widget loader accepted arbitrary `widgetName` query input and used it to construct script and stylesheet URLs. A crafted URL could therefore select an external script URL.

- RED: `npx vitest run tests/widget-loader-security.test.ts` failed because `https://evil.example/payload-sandbox.js` was selected.
- Fix: allow only `bridge-status`; all missing or untrusted values fall back to it.
- GREEN: the focused regression passes.

### Judge setup ambiguity

The hosted UI said to pair from an unspecified dashboard even though the implemented flow is ChatGPT pairing code to this widget. Vendor-specific Render wording also leaked into user recovery copy.

- RED: `npx vitest run tests/bridge-ui-state.test.ts` failed three hosted-guidance cases.
- Fix: shared ChatGPT-to-widget instruction plus provider-neutral hosted error copy.
- GREEN: `tests/bridge-ui-state.test.ts`, `tests/bridge-widget-ux.test.ts`, and `tests/widget-loader-security.test.ts` pass together: 3 files, 32 tests.

## Stage 4 automated evidence

The following commands completed with exit code 0:

- `npm run check-types`
- `npm test` — final rerun: 34 files, 330 tests
- `npm run validate`
- `npm run build`
- `npm run server:build`
- `npm run server:smoke`
- `npm run server:test:security`
- `npm run server:test:boundaries`
- `npm run server:test:tool-schemas`
- `npm run server:test:idempotency`
- `npm run server:test:source-fidelity`
- `npm run server:test:health-check-routing`
- `npm run test:style-correctness`
- `npm run server:test:auth`
- `npm run server:test:codex-bearer`
- `npm run server:test:codex-routing`
- `npm run server:test:codex-pairing`
- `npm run server:test:pairing`
- `npm run server:test:connector-compat-routing`
- `npm run server:test:tool-profile`
- `npm run server:test:tier-switching`
- `npm run server:test:structured-depth`
- `npm run server:test:markdown-importer`
- `npm run server:test:performance`
- `npm run server:test:e2e-hosted-smoke`
- `npm audit --omit=dev` — 0 vulnerabilities
- `npm audit --omit=dev --prefix server` — 0 vulnerabilities

The final post-fix rerun completed the entire matrix above successfully, including the long server smoke and the refreshed browser pairing review.

`npm run server:test:bulk-storage` exited 0 but reported an honest mixed result: memory storage passed; PostgreSQL was `BLOCKED` because `DATABASE_URL` is not configured.

The local branch was based on `ffb6c02d303ced7eb5c59fe374dfcec57d3ba1dc`, while the remote branch still pointed to `5380dd5f...`. `gh` was not installed. No exact-commit CI run existed, and no push was authorized.

## Architecture and security review

The architecture review found large ownership seams in the bridge request dispatcher and widget, but the regression suite did not expose a behavior defect that justified a broad release-time refactor. The smallest release-risk fix was the widget asset allowlist above. The temporary HTML review report is outside the repository at `/tmp/architecture-review-remnote-mcp-stage4-20260718T2053.html`.

A focused source scan found no runtime use of `dangerouslySetInnerHTML`, `eval`, `new Function`, `document.write`, or `javascript:` URLs in `src`, `server/src`, or `webpack.config.js`. The only `javascript:` match was an intentional security-smoke payload.

## Stage 5 browser evidence

Playwright loaded the built widget at `http://127.0.0.1:8080/index.html?widgetName=bridge-status`, activated the real `@remnote/plugin-sdk` sandbox plugin, and used deterministic fake host facts and endpoint responses. This is browser proof of the actual widget component and styles, not native RemNote proof.

Verified in the rendered UI:

- disconnected, connecting, connected, reconnecting, failed, and expired-token presentations;
- ChatGPT pairing code and local-label entry;
- pairing review details, requested scopes, write approval, and tool tier;
- pairing denial and code clearing;
- paired/connected presentation;
- Ping, Connect, and Disconnect controls;
- writing access and all scope choices;
- design style selection;
- Advanced settings, health result, tool tier, authentication boundary, and isolated danger controls;
- loading/progress and error copy through the state matrix.

State labels observed from the real rendered component:

| Input state | Banner | Recovery text |
| --- | --- | --- |
| `connecting` | Connecting | Connecting to the companion server. |
| `reconnecting` | Reconnecting | Connection lost. Reconnecting safely. |
| `error` | Error | Check the local companion server URL and bridge token, then reconnect. |
| `token_expired` | Token Invalid or Expired | Update the local bridge token, then reconnect. |

Responsive and accessibility measurements:

- 360 px sidebar: `scrollWidth === clientWidth === 360`; no clipped interactive controls.
- All five visible primary controls were at least 44 px high; measured heights were 46-72 px.
- Keyboard Tab order reached Connection, Writing access, Design style, Open ChatGPT, and Advanced settings.
- Each keyboard-focused control exposed a visible 2 px violet outline.
- 200% CSS zoom reduced the effective layout width to 180 px without root horizontal overflow.
- Reduced-motion emulation changed primary-action transitions to `none` / `0s`.
- Primary and muted text computed as light colors on dark surfaces; no unreadable contrast was observed.

Recorded screenshots:

- `output/playwright/stage5-sandbox-disconnected.png`
- `output/playwright/stage5-sandbox-pairing-review.png`
- `output/playwright/stage5-sandbox-connected.png`
- `output/playwright/stage5-sandbox-narrow.png`

The sandbox emitted only harness-resource 404s for `/favicon.ico` and SDK-requested `/App.css`; the widget stylesheet and component rendered. These are not counted as native or hosted runtime proof.

## Judge one-minute answers

1. Server reachable: open Connection and use Ping; server and ChatGPT Remote status are separate.
2. Plugin connected: header and live status must both say Connected.
3. Approved scope: Writing access shows it; Advanced repeats it under Scope.
4. Write access: Writing access shows the standard write mode; destructive access is isolated in Danger Zone.
5. Disconnect: Connection exposes Disconnect beside Ping and Connect.
6. First test: use Ping, then run Quick Health Check in Advanced settings.

## Native proof boundary

RemNote Flatpak 1.26.30 was running on Wayland. No bridge listener existed on ports 47391 or 47392. The window was not exposed through X11, GNOME denied programmatic focus and screenshot access, and the process had no remote-debugging port. Restarting the user's RemNote process with unsafe debugging flags was not attempted.

Therefore the Stage 5 native visual gate remains blocked. Exact-release connected-plugin proof belongs to Stage 6 and was not claimed here.
