# OpenAI Build Week — RemNote MCP Submission Draft

> Prepared from repository state on July 18, 2026. This is a submission draft, not a claim that every owner action below is complete. Items marked **PENDING** or **OWNER ACTION** must be resolved before submission.

## 1. Recommended Tagline

### Primary Tagline

RemNote MCP lets AI agents safely turn complex ideas into structured, verifiable knowledge in RemNote.

Character count: 102, including spaces.

### Alternate Taglines

1. A safe MCP bridge for AI agents to read, write, verify, and repair structured knowledge in RemNote.
2. Give ChatGPT and Codex controlled, reliable tools for building structured notes, cards, formulas, and hierarchies in RemNote.
3. From AI reasoning to verified RemNote knowledge: scoped writes, resumable imports, read-back, and recovery through MCP.

## 2. Devpost Full Project Description

### Inspiration / Problem

AI agents are good at reasoning, explaining, and generating large amounts of useful material. Moving that material into a personal knowledge system is still surprisingly manual. A long answer that looks correct in chat can become a damaged note when headings flatten, formulas change, flashcards lose their structure, a connection drops halfway through, or a retry creates duplicates.

I wanted an agent to do more than paste text into RemNote. It should understand a note as a hierarchy, operate only inside an area the user approves, preserve the source, verify the result after writing, and recover safely when a multi-step operation is interrupted.

### What it does

RemNote MCP is a developer tool that gives MCP clients such as ChatGPT and Codex controlled access to RemNote. It exposes tools for inspecting the current RemNote context, reading note trees, searching, creating and updating structured notes, working with Markdown, formatting content, managing cards, and running resumable bulk-import jobs.

The key workflow is:

1. The user chooses a RemNote scope and writing-access level.
2. The agent reads the relevant context and prepares a plan.
3. The agent calls a purpose-built MCP tool instead of simulating UI clicks.
4. The plugin performs the operation through the RemNote Plugin API.
5. The system reports created, updated, and deleted IDs, warnings, and verification state.
6. The agent reads the result back and makes a targeted repair if needed.

The result is an agent-access layer for structured knowledge operations, not a second chat interface inside RemNote.

### How it works

RemNote MCP has two cooperating runtimes:

- A Node.js MCP server handles MCP discovery and calls, authentication, tool profiles, permission policy, hosted pairing, durable import-job state, and diagnostic envelopes.
- A React/TypeScript RemNote plugin maintains a WebSocket bridge to the server. It re-checks scope and permissions, performs the actual RemNote SDK operation, and returns structured results.

The request path is:

`ChatGPT or Codex → MCP server → auth/tool/scope checks → WebSocket bridge → RemNote plugin → RemNote Plugin API → read-back/verification → structured MCP result`

That separation matters. The language model remains in ChatGPT or Codex; RemNote MCP supplies narrowly defined, inspectable tools. Local mode uses a shared local bearer token. Hosted mode uses OAuth or an explicit pairing flow for ChatGPT and a separate bearer identity for Codex. The plugin controls the effective RemNote scope and writing mode in both cases.

Long imports use a plan/job/chunk model instead of a single unbounded write. A job records its revision and chunk state, skips already verified chunks during resume, and distinguishes `written_not_verified`, `partial`, `failed`, `blocked`, and `verified`. Cancellation prevents future chunks; it does not pretend to undo already written Rems.

### What makes it different

This is not a chatbot embedded in a notes app, and it does not give a model an unrestricted database connection. It is a controlled tool boundary between an agent and a running RemNote workspace.

Three design choices define the project:

- **Scope before power.** The user chooses a focused Rem, selected tree, approved root, or workspace scope, plus a read/write permission level. Destructive tools stay in a separately confirmed danger tier.
- **Verification is a first-class result.** A successful transport call is not automatically a successful note operation. Results distinguish server reachability, plugin reachability, mutation outcome, and read-back verification.
- **Recovery is explicit.** Imports have durable job state, mutation IDs, idempotency behavior, legal state transitions, resume rules, and a reconciliation operation for cases where live evidence is ambiguous. The system does not blindly replay an uncertain chunk.

### What I built during OpenAI Build Week

RemNote MCP existed before Build Week. Before the eligible period it already had a RemNote plugin, an MCP/bridge server, local and hosted concepts, and a broad surface for reading, writing, cards, formatting, Markdown, and bulk imports. I am not submitting that pre-existing foundation as new work.

The Build Week work began from commit `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`, committed July 12, 2026 at 13:05:44 `+03:00` (10:05:44 UTC), before the July 13 9:00 AM Pacific boundary. The candidate submission head is `5380dd5f2b87fa7d908a346fef81862498d47eea`. Seven commits after the boundary transformed the foundation through a live reliability and repair campaign.

The main Build Week contribution was a systematic 15-scenario RemNote campaign followed by repeated Codex-driven diagnosis, implementation, regression testing, deployment, and retesting. That work included:

- Hardening the plan/start/run/status/resume/verify/cancel bulk-import lifecycle with revision-aware persistence, legal transitions, stable mutation identities, duplicate/replay protection, and read-only verification.
- Adding the public `reconcile_note_import_job_chunk` tool so an operator can resolve an uncertain chunk from actual live evidence instead of silently replaying it.
- Correcting chunk planning so native and logical chunks respect the requested node budget. This addresses the live case where a nominal 30-node chunk expanded to 40 actual RemNote nodes and blocked execution.
- Building a note-design compiler and verification manifest, with role classification, metadata filtering, Concept→Descriptor pairing, dry-run behavior, and exact design verification.
- Fixing formatting-result truthfulness, including correct dry-run reporting and outer-envelope updated IDs; adding native highlight support; and reporting unsupported SDK heading behavior honestly instead of claiming success.
- Moving connection ownership into a persistent plugin runtime so closing or reopening the sidebar does not own the WebSocket lifecycle. The final UI has explicit Connection, Writing Access, Design Style, Ping, Connect, Disconnect, pairing approval, and health-check controls.
- Hardening auth and input boundaries: spoofed forwarded-address throttling, scope and metadata bounds, HTTP/WebSocket/source-file size limits, local file-root and symlink protections, and removal of a tracked environment file.
- Adding PostgreSQL-backed CI coverage and expanding the automated suite. The current local media-stage proof passes 33 test files and 326 tests; PostgreSQL durability and connected media rendering remain separate proof obligations.

The live campaign did not end with a fictional all-green claim. Tests 1–2, 4–11, 13, and 15 produced pass or pass-with-warning evidence in the final campaign report. Tests 3 and 12 exposed a real RemNote SDK heading limitation while their supported content/design behavior passed. Test 14 exposed the chunk-budget defect on the then-deployed build. The exact-budget repair is implemented and regression-tested at the candidate commit, but it still needs a post-deployment connected-plugin rerun before I can call that scenario live-verified.

### How I used Codex

I used Codex as the engineering loop around the repository, not merely as a code generator. In the eligible sessions, Codex:

- inspected Git history, architecture boundaries, runtime configuration, reports, and failures;
- reproduced and classified failures across server, bridge, plugin, RemNote SDK, and verification layers;
- implemented focused fixes in the import state machine, tool policy, plugin runtime, formatting/design handlers, hosted pairing, and UI;
- generated and maintained regression tests for routing, schemas, state transitions, idempotency, persistence, security, performance, fault recovery, and plugin behavior;
- ran local gates and compared them with live RemNote evidence rather than treating unit tests as proof of runtime behavior;
- reviewed deployed health/commit identity and used subsequent live runs to drive the next repair cycle.

The strongest Codex development thread is local thread `019f5d24-d695-7fb0-95b5-d2ab1d53909e`, which covers most of the eligible implementation through commit `281df8b`. A second thread, `019f6adb-7b3e-7281-a205-0f2e2e421458`, finalized the release at `5380dd5`. The required Devpost `/feedback` ID is still pending; a local thread ID alone is not proof that feedback logs were uploaded.

### How I used GPT-5.6

The Build Week Codex sessions record `gpt-5.6-sol` as the agentic coding model, with high reasoning effort. I used that GPT-5.6-based Codex workflow for the eligible reliability campaign: tracing cross-runtime defects, designing safer state transitions, reconciling code-level proof with live reports, implementing repairs, and reviewing regression results.

I am not claiming GPT-5.6 originally built the whole project. The plugin and broad MCP foundation predate Build Week and include work done with earlier tools and models. GPT-5.6's specific contribution was helping turn that existing prototype and tool surface into a more durable, testable, and honest developer tool during the eligible period. GPT-5.6 is a development-time tool here; it is not bundled into the RemNote plugin and is not the runtime model behind every MCP call.

### Challenges I ran into

**A retry can be more dangerous than a failure.** If a connection fails after a write but before confirmation, replaying the same chunk can duplicate a knowledge tree. Solving that required stable mutation IDs, revision checks, explicit uncertain states, read-only verification, and a reconciliation path based on real evidence.

**Logical Markdown nodes and native RemNote nodes are not always one-to-one.** A 30-node logical chunk expanded into 40 actual nodes because some structures create more than one Rem. The live failure was only fixed once planning and verification used the same exact native-node budget.

**Transport success is not behavior success.** A healthy HTTP endpoint, connected WebSocket, returned tool result, and correct RemNote tree are four different levels of proof. The reports and envelopes had to preserve those distinctions.

**The RemNote SDK has capability boundaries.** Heading assignment was unavailable in the SDK version used by this repository. The correct behavior was to preserve supported content, report the unsupported part, and avoid claiming that the visual heading mutation succeeded.

**A UI lifecycle bug was really a runtime-ownership bug.** The bridge had been too closely coupled to the sidebar. Moving connection ownership into the plugin activation runtime made reconnect behavior independent of whether the status widget was open.

**Security depends on deployment semantics.** Local bearer auth, hosted OAuth, ChatGPT pairing, Codex bearer identity, user scope, and trusted-write approval are different controls. Treating them as one token would have weakened the boundary and made diagnostics misleading.

### Accomplishments I am proud of

- Converting a broad existing MCP tool surface into a tested workflow that plans, writes, reads back, verifies, resumes, and reconciles instead of assuming success.
- Preserving honest proof levels. The repository records supported passes, warnings, blocked states, and SDK limitations rather than turning every automated check into a live claim.
- Finishing the candidate commit with a successful CI run that includes PostgreSQL and 292 automated tests across 32 files.
- Proving three independent 160-node module imports in Test 15, including requested card behavior and verification/repair passes, without treating one successful note as enough evidence.
- Making connection, permission scope, writing access, design selection, pairing, and diagnostics visible in the RemNote sidebar instead of hiding important controls in environment variables.

### What I learned

The hardest part of an AI writing tool is not generating text. It is maintaining truth across retries, partial work, changing focus, remote connections, and an application's real API limits.

I also learned that evaluation should be an engineering input, not a final ceremony. The 15-scenario campaign was useful because each failure had to become one of four things: a reproducible product defect, an infrastructure problem, a confirmed SDK limitation, or a passing behavior with evidence. That classification made the next code change much clearer.

Finally, I learned to separate implementation proof from runtime proof. A regression test can prove a state machine rule; only a connected plugin write followed by a RemNote read-back proves the complete path.

### What's next

- Publish a judge-ready prebuilt plugin artifact tied to the final SHA, then rerun the connected-plugin campaign against that exact deployment.
- Add a guided demo workspace and automated disposable-root setup so judges can test without touching existing notes.
- Complete real ChatGPT Developer Mode file-upload validation in addition to the existing source-level and security tests.
- Improve observability around job revisions, reconnects, and verification evidence without exposing note content or secrets.
- Prove the new URL-backed image, audio, direct-video, and YouTube insertion tools in a connected RemNote runtime. Their local implementation and regression coverage are complete, but live rendering is not yet claimed.
- Continue reducing unsupported-format gaps as the RemNote Plugin API adds capabilities.

## 3. Built With

```text
Built with:
- TypeScript
- React 17
- Node.js 20+
- Model Context Protocol (MCP)
- RemNote Plugin API / SDK
- OpenAI Codex
- GPT-5.6
- WebSockets
- PostgreSQL
- Zod
- Vitest
- Webpack
- Render
```

## 4. Repository Information

### Primary Repository URL

https://github.com/HTGit63/remnote-plugin-template-react

### Build Week Development Branch

https://github.com/HTGit63/remnote-plugin-template-react/tree/fix/remnote-mcp-mass-note-creation-stability

Judges should use this branch because it contains the candidate Build Week repair and reliability work through commit `5380dd5f2b87fa7d908a346fef81862498d47eea`; `main` is substantially older. The branch itself and the project foundation predate or span the eligible period, so the submission does not claim the whole branch as new. The auditable Build Week range begins after `ff5e6d1ebf12dfc41c0e037cff99bfe690def240` and is shown by the comparison in Section 9.

## 5. Judge Testing Instructions

### Current testing status — read this first

The public hosted service is online at the candidate SHA, but the RemNote plugin must also be running and paired for plugin-routed tools to work. On July 18, 2026, `/health` returned HTTP 200 for exact SHA `5380dd5f2b87fa7d908a346fef81862498d47eea`, while also correctly reporting `connected: false` because no plugin session was attached at that moment.

The repository contains a local `PluginZip.zip`, but that artifact is ignored and is not available to judges through the public repository. **OWNER ACTION:** publish a prebuilt artifact for the exact candidate SHA as a GitHub Release asset and place its public URL here: `[ADD PUBLIC PREBUILT PLUGIN URL]`. Until that is done, the source-development path below is the only reproducible public path, and the Developer Tools “test without rebuilding” requirement is not fully satisfied.

### Supported platforms

- RemNote desktop or web with access to **Settings → Plugins → Build → Develop from localhost** or an installed prebuilt plugin.
- A computer that can run Node.js 20+ and npm for local development mode.
- Codex as the easiest local MCP client. ChatGPT Developer Mode is the intended hosted OAuth client.
- The plugin manifest disables mobile (`enableOnMobile: false`), so mobile is not a supported judge path.

### Prerequisites

1. A RemNote account and a disposable workspace/document for testing.
2. Git, Node.js 20+, and npm for the source path.
3. A Codex client for local Streamable HTTP MCP testing, or ChatGPT Developer Mode for hosted pairing.
4. No real notes that you cannot restore should be inside the approved test scope. Do not enable the danger tier.

### Fastest safe path today: local development mode

#### 1. Clone the exact candidate branch and commit

```bash
git clone --branch fix/remnote-mcp-mass-note-creation-stability https://github.com/HTGit63/remnote-plugin-template-react.git
cd remnote-plugin-template-react
git checkout 5380dd5f2b87fa7d908a346fef81862498d47eea
```

#### 2. Install and start the RemNote plugin development server

```bash
npm install
npm run dev
```

The plugin development URL is:

```text
http://localhost:8080
```

In RemNote, open **Settings → Plugins → Build → Develop from localhost**, enter the base URL `http://localhost:8080` (not `/manifest.json`), install/enable the plugin, and open **RemnoteMCP** from the command palette or right sidebar.

#### 3. Install and start the companion server

Open a second terminal in the repository:

```bash
npm run server:install
export REMNOTE_BRIDGE_TOKEN="$(openssl rand -hex 32)"
npm run server:dev
```

The local endpoints are:

```text
Plugin WebSocket: ws://localhost:47391/remnote-bridge
MCP:              http://127.0.0.1:47392/mcp
Health:           http://127.0.0.1:47392/health
```

#### 4. Configure the plugin

In the RemnoteMCP plugin settings or sidebar:

- Set **Bridge Server URL** to `ws://localhost:47391/remnote-bridge`.
- Set **SENSITIVE LOCAL AUTH — Bridge Token** to the same `REMNOTE_BRIDGE_TOKEN` value from the server terminal. Do not paste it into a prompt.
- Use **Focused Rem + Descendants** or **Approved Document or Folder** scope.
- Use **Read + Create + Modify** writing access.
- Use the **Note Writer** or recommended note mode. Do not use **DANGER — Destructive Tools**.
- Focus a new document called `Build Week Judge Sandbox`; if using approved-root scope, set that focused document as the approved root.
- Click **Connect**, then **Ping** or run the **Run RemnoteMCP Health Check** command.

#### 5. Configure Codex as the local MCP client

Keep `REMNOTE_BRIDGE_TOKEN` exported in the environment that launches Codex. Add this to Codex `config.toml`:

```toml
[mcp_servers.remnote]
url = "http://127.0.0.1:47392/mcp"
bearer_token_env_var = "REMNOTE_BRIDGE_TOKEN"
```

Restart/reload the Codex MCP connection after changing its config.

#### 6. Confirm the full connection

Use the sidebar **Ping** control, then call:

1. `get_bridge_status` — proves the server/bridge state only.
2. `ping_remnote_plugin` — proves a plugin-routed round trip.
3. `get_focused_rem` — proves the agent can see the focused sandbox.

Do not continue with writes if the server reports `PLUGIN_NOT_CONNECTED`, the focused Rem is wrong, or the intended scope is not visible.

### Simple read-only judge test

1. Create/focus `Build Week Judge Sandbox` in RemNote.
2. Add two manual child Rems: `Alpha` and `Beta`.
3. Ask the MCP client: “Use RemNote tools only. Confirm the focused Rem, list its direct children, and make no changes.”
4. Expected evidence: `get_focused_rem` identifies the sandbox and `get_children` returns `Alpha` and `Beta`; no created/updated/deleted IDs are reported.

### Safe write judge test

1. Keep the sandbox focused and permission scope limited to that tree.
2. Ask: “Preview a small Markdown import under the focused sandbox with a heading, two bullets, and one Concept::Descriptor pair. Do not write yet.”
3. Review the preview/plan and node count.
4. Ask the client to execute the approved write once with a stable idempotency key such as `judge-safe-write-01`.
5. Ask it to read the created parent and children back using `get_children`, `get_rem_breadcrumbs`, or `get_rem_rich` and report the verification state.
6. Repeat the same request with the same idempotency key. It should not create a second copy.

Expected evidence is a structured result containing created/updated IDs and a separate read-back/verification result. A transport-only success is not enough.

### Recommended impressive demo workflow

Use a 2–3 minute “interrupted structured lesson import” inside the disposable sandbox:

1. Provide a medium Markdown lesson containing nested sections, bullet hierarchy, inline math, and Concept::Descriptor card pairs.
2. Run `plan_note_import` and inspect the source hash, logical/native node counts, chunk plan, and warnings.
3. Start the job, run only part of it, then stop or disconnect before all chunks finish.
4. Reconnect and inspect job status.
5. Resume the job. Verified chunks should remain skipped instead of being replayed.
6. Run `verify_note_import_job` and read back a representative tree/card.
7. If a chunk is genuinely uncertain, demonstrate `reconcile_note_import_job_chunk` using the observed RemNote evidence; do not blindly mark it verified.

This is the clearest demonstration of what changed during Build Week. However, the final exact-node-budget fix for the previously blocked 40-vs-30 case is automated-regression-tested but still awaiting an exact-SHA connected-plugin rerun. Use a prepared demo fixture and complete that rerun before recording the public video.

### Personal hosted mode

There is one canonical server mode, `hosted`; a “personal hosted” setup means deploying that mode for one owner. Configure the Render/server secrets documented in the repository, including hosted mode, hosted pairing, allowed origins, `SESSION_SECRET`, PostgreSQL, and a dedicated `REMNOTE_CODEX_TOKEN`. Point the plugin at that deployment's `wss://.../remnote` endpoint and Codex at `https://.../mcp` using `bearer_token_env_var = "REMNOTE_CODEX_TOKEN"`. The Codex bearer proves client identity; it does not replace the explicit RemNote scope/trusted-write link.

### Public hosted mode

The current public endpoints are:

```text
Health: https://remnote-plugin-template-react.onrender.com/health
MCP:    https://remnote-plugin-template-react.onrender.com/mcp
Bridge: wss://remnote-plugin-template-react.onrender.com/remnote
```

For ChatGPT Developer Mode, add the hosted MCP URL and complete OAuth. The connector displays a short-lived hosted pairing code. In the RemnoteMCP sidebar, open **Connection → Pair ChatGPT**, enter that code, click **Check Code**, inspect the requested connection/scope/write/tool-tier details, then click **Approve**. Click **Ping** and confirm both “RemnoteMCP server” and “ChatGPT Remote” are connected before testing.

The hosted URL being reachable does not mean a judge can test alone: a compatible plugin build must be installed and online in the judge's RemNote session. That is why publishing the prebuilt exact-SHA plugin artifact is a blocking owner action.

## 6. Plugin / Developer Tool Installation Instructions

RemNote MCP supports RemNote desktop/web; mobile is not supported by the current manifest. For the judge-ready path, install the exact-SHA prebuilt plugin from `[ADD PUBLIC PREBUILT PLUGIN URL]`, open RemnoteMCP in the RemNote sidebar, focus a disposable `Build Week Judge Sandbox`, and choose Focused Rem + Descendants with Read + Create + Modify access. Connect ChatGPT Developer Mode to `https://remnote-plugin-template-react.onrender.com/mcp`; enter the connector's pairing code under **Connection → Pair ChatGPT**, review it, approve it, and click **Ping**. First test `get_focused_rem`/`get_children` read-only, then preview and create a small Markdown tree with a fixed idempotency key and verify it by read-back. Do not enable the danger tier. Source fallback: clone the candidate commit, run `npm install && npm run dev`, run `npm run server:install` followed by `npm run server:dev` with a shared `REMNOTE_BRIDGE_TOKEN`, load `http://localhost:8080` through RemNote's “Develop from localhost,” and connect the MCP client to `http://127.0.0.1:47392/mcp` using that token via an environment variable. Full details are in Section 5.

> **Not ready to paste until the prebuilt URL is filled in and tested from a clean machine.**

## 7. Submission Form Answers

```text
Submitter Type:
Individual

Country of Residence:
Ethiopia

Category:
Developer Tools

Repository URL:
https://github.com/HTGit63/remnote-plugin-template-react

Project/Test URL:
https://remnote-plugin-template-react.onrender.com/health

Judge Testing Instructions:
The health URL confirms the hosted service and deployed commit; the MCP connector URL is https://remnote-plugin-template-react.onrender.com/mcp. Install the exact-SHA prebuilt RemNote plugin from [ADD PUBLIC PREBUILT PLUGIN URL] in RemNote desktop/web (mobile is not supported), open its sidebar, focus a disposable “Build Week Judge Sandbox,” and choose Focused Rem + Descendants with Read + Create + Modify access. Add the hosted MCP URL to ChatGPT Developer Mode, complete OAuth, enter the connector's pairing code in Connection → Pair ChatGPT, inspect and approve it, then click Ping. Confirm with get_bridge_status, ping_remnote_plugin, and get_focused_rem. Run get_children as a read-only test. For a safe write, preview a small Markdown tree, approve one write with a fixed idempotency key, and read it back to verify the hierarchy. Do not enable the danger tier. See OPENAI_BUILD_WEEK_SUBMISSION_DRAFT.md Section 5 for local source fallback and the resumable-import demo.

Plugin / Developer Tool Instructions:
Supported: RemNote desktop/web; Node.js 20+ only for source setup; mobile unsupported. Preferred installation is the exact-SHA prebuilt plugin at [ADD PUBLIC PREBUILT PLUGIN URL]. Hosted MCP: https://remnote-plugin-template-react.onrender.com/mcp. Pair through the plugin's Connection panel, use a disposable focused/approved root, and test read-only before writing. Source fallback: checkout 5380dd5f2b87fa7d908a346fef81862498d47eea, run npm install and npm run dev, run npm run server:install then npm run server:dev with REMNOTE_BRIDGE_TOKEN set, load http://localhost:8080 through RemNote's Develop from localhost flow, and connect the MCP client to http://127.0.0.1:47392/mcp using the same token through its environment. Never paste secrets into prompts or enable danger tools for judging.
```

Why the Project/Test URL is `/health`: it is a real, browser-verifiable URL and reports deployment identity and availability. The `/mcp` URL is the actual connector endpoint, but opening it in a browser does not constitute an authenticated end-to-end test. Both still require a running paired plugin for RemNote-routed operations.

## 8. Codex `/feedback` Session ID

```text
/feedback Session ID:
PENDING — must be retrieved from the primary Codex Build Week development session.
```

### Recommended session to submit

The best current candidate is the primary eligible implementation thread:

```text
019f5d24-d695-7fb0-95b5-d2ab1d53909e
```

That is a local Codex thread ID, **not yet the confirmed Devpost feedback-upload ID**. It covers most core Build Week changes through commit `281df8b`. The finalization thread is `019f6adb-7b3e-7281-a205-0f2e2e421458` and contains the final candidate commit; use it only if review of the timelines shows it contains the majority of core functionality.

### How to retrieve and preserve the correct ID

1. From the repository, resume the primary implementation thread:

   ```bash
   codex resume 019f5d24-d695-7fb0-95b5-d2ab1d53909e
   ```

2. Confirm you are in the intended Build Week development thread by checking its visible history and thread ID. Do not upload this submission-drafting thread by mistake.
3. Type `/feedback` in Codex.
4. Choose **good result** if that accurately describes the thread.
5. When asked **Upload logs?**, choose yes. The timestamped logs are the evidence the Build Week rules request.
6. Add a concise note such as: “Primary OpenAI Build Week RemNote MCP implementation session covering the eligible live-test, repair, regression, and deployment cycle.” Submit it.
7. Wait for the success cell. It should say **Feedback uploaded** and show a **Thread ID**. Copy that exact ID into this draft and the Devpost field. Do not substitute a guessed ID.
8. Preserve the local session by not deleting Codex session data and by recording the ID in a separate submission checklist. The known local rollout is:

   ```text
   /home/hunde-tefera/.codex/sessions/2026/07/13/rollout-2026-07-13T23-22-03-019f5d24-d695-7fb0-95b5-d2ab1d53909e.jsonl
   ```

9. If you decide that the finalization session contains most core functionality, repeat the same verification with:

   ```bash
   codex resume 019f6adb-7b3e-7281-a205-0f2e2e421458
   ```

   Do not submit two IDs unless the form/rules allow it. Select the one that honestly contains the majority of the core Build Week implementation.

For any new primary session used for remaining work, write down the thread ID immediately, keep all eligible work in that same thread where practical, run `/feedback` before submission, choose log upload, and preserve both the success message and local rollout. A bare `codex resume` history entry is not a replacement for a successful `/feedback` upload.

## 9. Build Week Evidence

OpenAI Build Week began July 13, 2026 at 9:00 AM Pacific Time. In July, Pacific Time is PDT (`UTC−07:00`), so the boundary is July 13, 2026 at 16:00:00 UTC or 19:00:00 in Ethiopia (`UTC+03:00`). The recommended baseline below is safely before that boundary.

| Evidence | Before Build Week | During Build Week | Why It Matters |
|---|---|---|---|
| Repository foundation | By `ff5e6d1`, the repository already had the RemNote plugin, MCP/bridge server, broad read/write/card/formatting/Markdown/bulk-import tools, and local/hosted architecture. | The submission describes these as the base, not new work. | Keeps the pre-existing-project claim honest and focuses judging on eligible changes. |
| Eligible Git history | `ff5e6d1` was committed July 12, 2026 13:05:44 `+03:00` (10:05:44 UTC). | Seven commits from `5f87e2b` on July 14 through `5380dd5` on July 17 form the candidate eligible range. | Provides an auditable boundary that is safely after the official start. |
| Live campaign | Earlier reports and tool infrastructure existed, including baseline evidence created before the boundary. | A 15-test live RemNote campaign drove repeated diagnosis, repair, deployment, and reruns across complex writes, design, cards, recovery, and 160-node imports. | Shows evaluation causing meaningful engineering work, not merely producing a demo. |
| Bulk import lifecycle | Planning and bulk-job tools existed, but live testing exposed durability, replay, verification, and exact-budget gaps. | Revision/CAS behavior, legal transitions, stable mutation IDs, read-only verification, duplicate prevention, safer resume, and explicit reconciliation were implemented/hardened. | Makes interrupted long writes recoverable without blind duplication. |
| Exact chunk budget | Logical planning could undercount actual native RemNote nodes. | Test 14 exposed 40 actual nodes against a 30-node limit; the candidate commit aligns native planning and verification with the exact budget. | Fixes a concrete live failure. Automated regression is green; exact-SHA connected-plugin rerun remains pending. |
| Design and formatting | Existing formatting/design tool concepts were present. | Added/hardened compiler/manifests, role classification, metadata filtering, Concept→Descriptor mapping, truthful dry-run/envelopes, highlight support, and explicit unsupported-heading reporting. | Makes style results testable and prevents unsupported mutations from being reported as success. |
| Connection ownership and UI | The bridge/sidebar interaction could leave connection state fragile or confusing. | Persistent plugin-owned runtime, reconnect controls, safer local disconnect, hosted pairing review, health checks, and clearer Connection/Writing Access/Design Style UI landed in the eligible range. | Judges can see and control the real connection/scope boundary. |
| Security | Auth, scope, and transport protections existed but the campaign found hardening gaps. | Fixed forwarded-address throttling; bounded scope/metadata, HTTP/WS bodies, and source files; protected local file roots/symlinks; removed a tracked environment file. | Reduces ways a developer tool could bypass intended limits or leak secrets. |
| Automated proof | The repository already had tests before the event. | Candidate SHA CI passes with PostgreSQL and 32 files / 292 tests, including auth, schema, routing, state, storage, idempotency, performance, fault, security, and plugin tests. | Prevents live fixes from becoming one-off patches. It is automated proof, not a substitute for live RemNote proof. |
| Live proof boundary | No claim that all possible tools were live-green before the event. | Final campaign: 1–2, 4–11, 13, and 15 passed or passed with warnings; 3 and 12 retain a confirmed SDK heading limitation; 14's local repair awaits exact-SHA live rerun. | Gives judges a precise, non-inflated readiness picture. |
| Deployment | Earlier branch deployments were tested during the campaign. | Hosted health currently reports exact candidate SHA `5380dd5`; the GitHub Actions run for that SHA succeeded. Current health also reports no attached plugin, so a new paired live run is still required. | Proves deployment identity while preserving the difference between server availability and end-to-end behavior. |
| Codex/GPT-5.6 evidence | Earlier project work used earlier tools/models. | Eligible local threads `019f5d24...` and `019f6adb...` record `gpt-5.6-sol` and cover the repair/finalization cycle. `/feedback` upload remains pending. | Narrows the GPT-5.6 claim to evidenced Build Week development work. |

### Eligible commit sequence

| Commit | Date (`+03:00`) | Build Week contribution summary |
|---|---:|---|
| `5f87e2b` | 2026-07-14 17:19 | Completed the primary local remediation phases across bulk jobs, tool behavior, runtime, and regression coverage. |
| `466b808` | 2026-07-14 17:24 | Updated evidence/reports and the repository execution contract. Some report contents describe earlier baselines and should not all be treated as newly authored product functionality. |
| `81eef93` | 2026-07-14 18:28 | Recorded and addressed live benchmark gaps. |
| `a65ce2c` | 2026-07-14 20:51 | Repaired post-deployment benchmark regressions. |
| `76c6e2d` | 2026-07-15 20:24 | Closed release gaps and improved plugin UX. |
| `281df8b` | 2026-07-16 14:44 | Hardened sidebar lifecycle and native highlight behavior. |
| `5380dd5` | 2026-07-17 21:15 | Finalized v0.1 with security, connection, UI, tests, and release evidence. |

Use `git show --format=fuller <sha>` before submission if Devpost needs every author/committer timestamp copied verbatim.

### Recommended baseline commit

```text
ff5e6d1ebf12dfc41c0e037cff99bfe690def240
```

This is the best immediate pre-Build-Week boundary in the inspected branch. It is safer and more representative than `main`, which is much older and would inflate the eligible diff with unrelated pre-event work.

### Current submission commit

```text
5380dd5f2b87fa7d908a346fef81862498d47eea
```

Branch:

```text
fix/remnote-mcp-mass-note-creation-stability
```

### Recommended Git comparison

GitHub:

https://github.com/HTGit63/remnote-plugin-template-react/compare/ff5e6d1ebf12dfc41c0e037cff99bfe690def240...5380dd5f2b87fa7d908a346fef81862498d47eea

Local commands:

```bash
git log --reverse --date=iso-strict --format='%H %ad %s' ff5e6d1ebf12dfc41c0e037cff99bfe690def240..5380dd5f2b87fa7d908a346fef81862498d47eea
git diff --stat ff5e6d1ebf12dfc41c0e037cff99bfe690def240 5380dd5f2b87fa7d908a346fef81862498d47eea
git diff --name-status ff5e6d1ebf12dfc41c0e037cff99bfe690def240 5380dd5f2b87fa7d908a346fef81862498d47eea
```

Do not lead with the raw insertion count: generated analysis/report artifacts make it a poor measure of product work. Lead with the seven eligible commits, concrete source changes, test additions, live-campaign results, and exact proof boundaries.

Useful evidence links:

- Candidate branch: https://github.com/HTGit63/remnote-plugin-template-react/tree/fix/remnote-mcp-mass-note-creation-stability
- Candidate CI run: https://github.com/HTGit63/remnote-plugin-template-react/actions/runs/29603562034
- Hosted health: https://remnote-plugin-template-react.onrender.com/health
- Live campaign report in the branch: `remnote report/remnote-mcp-tests-01-15-live-campaign-report-2026-07-17.md`
- Official rules: https://openai.devpost.com/rules

## 10. Proposed README Material

The repository currently has no committed root `README.md`, which is a serious submission gap because the official rules require a README explaining Codex use and GPT-5.6 decisions. Do not silently create it as part of this draft-only task. After review, add the following section to a real root README and include installation/license context around it.

---

# OpenAI Build Week 2026

RemNote MCP is a pre-existing developer tool that gives ChatGPT, Codex, and other MCP clients controlled access to a running RemNote workspace. Its foundation—including the RemNote plugin, MCP/bridge server, and a broad set of read, write, formatting, card, Markdown, and import tools—existed before OpenAI Build Week.

For Build Week, I focused on making that foundation reliable under real structured-note workloads. The eligible work is the range after pre-event baseline `ff5e6d1ebf12dfc41c0e037cff99bfe690def240` through candidate commit `5380dd5f2b87fa7d908a346fef81862498d47eea`:

https://github.com/HTGit63/remnote-plugin-template-react/compare/ff5e6d1ebf12dfc41c0e037cff99bfe690def240...5380dd5f2b87fa7d908a346fef81862498d47eea

During that period, a 15-scenario live RemNote campaign drove:

- durable, revision-aware bulk-import jobs with safer resume and duplicate prevention;
- exact logical/native chunk budgeting;
- explicit reconciliation of uncertain chunks from live evidence;
- stronger verification/read-back semantics and honest partial/unsupported outcomes;
- design compiler/manifests and formatting-result fixes;
- persistent plugin-owned connection/reconnect behavior and clearer permission/pairing UI;
- stronger authentication, rate-limit, scope, file, and transport boundaries; and
- a current local suite of 33 test files and 326 tests, with PostgreSQL durability tracked as a separate environment-dependent check.

## How Codex and GPT-5.6 were used

Codex was the development and evaluation loop: it inspected the existing architecture and reports, diagnosed live failures, implemented changes across the server/bridge/plugin boundary, added regression tests, ran gates, and compared local proof with repeated RemNote read-back evidence. The eligible Codex sessions record the GPT-5.6-based `gpt-5.6-sol` model. GPT-5.6 was used for the Build Week repair and reliability work; the repository's older foundation was developed before this event with earlier tools and models.

GPT-5.6 was especially useful for reasoning across failure layers that look similar from the outside: unreachable MCP server, disconnected plugin, rejected scope, uncertain mutation, unsupported SDK behavior, and incorrect RemNote output. The implementation keeps those results distinct rather than reporting a generic success.

## Architecture

```text
ChatGPT/Codex
    ↓ MCP + auth
Node.js MCP server
    ↓ tool/profile/scope checks
WebSocket bridge
    ↓ plugin permission checks
RemNote plugin + RemNote Plugin API
    ↓
structured result + read-back verification
```

The model runs in the MCP client. RemNote MCP is the controlled tool layer; it is not an embedded chatbot and it does not bypass the user's chosen RemNote scope.

## Judge starting point

1. Review the eligible compare link above.
2. Read `OPENAI_BUILD_WEEK_SUBMISSION_DRAFT.md` for exact installation and test steps.
3. Inspect `remnote report/remnote-mcp-tests-01-15-live-campaign-report-2026-07-17.md` for the live campaign and its remaining limitations.
4. Check the candidate CI run: https://github.com/HTGit63/remnote-plugin-template-react/actions/runs/29603562034
5. Confirm deployment identity at https://remnote-plugin-template-react.onrender.com/health

## Quick judge test

Use RemNote desktop/web and install the exact candidate prebuilt plugin from `[ADD PUBLIC PREBUILT PLUGIN URL]`. Connect ChatGPT Developer Mode to `https://remnote-plugin-template-react.onrender.com/mcp`, approve the short-lived pairing code in the plugin, and limit access to a disposable `Build Week Judge Sandbox`. First call `get_focused_rem` and `get_children` read-only. Then preview and create a small Markdown tree with a stable idempotency key and verify the result by reading the hierarchy back. Do not enable the danger tier.

For source-based local testing, use Node.js 20+, run `npm install` and `npm run dev`, run the companion server with `npm run server:install` and `npm run server:dev`, load `http://localhost:8080` through RemNote's **Develop from localhost**, and connect the MCP client to `http://127.0.0.1:47392/mcp` with the shared local bearer supplied through an environment variable.

## Proof boundary

Automated tests, deployed server health, and live plugin behavior are separate evidence layers. The candidate SHA has successful CI and is deployed. The latest campaign contains substantial connected-plugin proof, but the exact-SHA post-deployment rerun—especially the repaired Test 14 native-node budget case—must be completed before claiming every scenario is live-verified. The current RemNote SDK version also does not support the heading mutation tested in scenarios 3 and 12; supported content is preserved and the limitation is reported explicitly.

---

## 11. Missing Information Checklist

### Blocking before submission

- [ ] **Run `/feedback` on the correct primary Build Week Codex thread**, upload logs, and replace the pending field with the exact success-screen Thread ID.
- [ ] **Publish a public prebuilt plugin artifact for exact SHA `5380dd5...`** (preferably a GitHub Release asset) and replace every `[ADD PUBLIC PREBUILT PLUGIN URL]` placeholder.
- [ ] **Test the prebuilt artifact from a clean machine/account** using the written judge path. The repository-only source build is not enough for the Developer Tools no-rebuild expectation.
- [ ] **Commit a root `README.md` before the final cutoff** after reviewing Section 10. The current candidate tree has no committed root README.
- [ ] **Rerun the connected-plugin live campaign against exact deployed SHA `5380dd5...`**, especially Test 14, and update claims/results without converting known SDK limitations into passes.
- [ ] **Keep a RemNote plugin session/test environment available through judging**, or give judges a setup that pairs their own RemNote safely. The hosted server currently has no active plugin connection.
- [ ] **Choose and lock the final cutoff SHA.** If any owner actions change the repository, replace `5380dd5...` and regenerate the compare/CI/deployment evidence.

### Devpost assets and fields

- [ ] Final public YouTube demo URL; video must be under three minutes and clearly show what was added during Build Week plus Codex/GPT-5.6 use.
- [ ] Final `/feedback` Session ID.
- [ ] Final Project/Test URL decision after the clean judge test. `/health` is currently recommended for the browser field and `/mcp` for the connector.
- [ ] Public prebuilt plugin/release URL.
- [ ] Project thumbnail/cover image and any gallery screenshots.
- [ ] Short demo narration/script aligned with the eligible commit range.
- [ ] Confirm whether Devpost needs a public repository or judge access instructions at submission time; keep access available through judging.
- [ ] Confirm the repository's MIT license is acceptable for this submission. The existing license carries the original RemNote Inc. template copyright; do not misstate ownership of the template.

### Final technical verification

- [ ] Confirm branch and final SHA are pushed and the GitHub compare URL resolves publicly.
- [ ] Confirm final CI is green at the final SHA and save the run URL.
- [ ] Confirm `/health` reports that same SHA and expected hosted/auth mode.
- [ ] Confirm the plugin can pair from a new ChatGPT Developer Mode connection and that pairing codes are short-lived/single-use.
- [ ] Execute the read-only, safe-write, repeated-idempotency, read-back, and resumable-demo workflows in a disposable root.
- [ ] Review the 15-test report and update any claim changed by the exact-SHA rerun.
- [ ] Verify no secrets, local session files, note content, or ignored plugin artifacts are accidentally added to Git.

### Final editorial/compliance review

- [ ] Verify all event dates and the final commit timestamp against Pacific Time, not local calendar date alone.
- [ ] Keep the pre-existing foundation and eligible Build Week work visibly separated in the Devpost description, README, and video.
- [ ] Replace all square-bracket placeholders and all **PENDING/OWNER ACTION** text intended for internal review.
- [ ] Do not claim image insertion, full heading support, all-tools-live status, or exact-SHA Test 14 live success unless new evidence proves it.
- [ ] Ensure the demo audio explains what was built and how Codex/GPT-5.6 were used.
- [ ] Recheck the official rules immediately before submission for deadline, video, repository, README, license, access, and `/feedback` requirements.

## Submission-readiness summary

The engineering story is strong and auditable: a pre-existing MCP bridge underwent an eligible, Codex/GPT-5.6-driven reliability transformation anchored by seven commits, a 15-scenario live campaign, and a green 292-test candidate CI run. It is **not submission-ready yet** because the public prebuilt plugin path, required root README, `/feedback` upload ID, and exact-candidate connected-plugin rerun are still missing. Resolve those items, then update the final SHA and evidence everywhere before pasting this draft into Devpost.
