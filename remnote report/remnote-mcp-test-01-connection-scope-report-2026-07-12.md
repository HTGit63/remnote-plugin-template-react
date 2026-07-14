# RemNote MCP Test 01 — Connection, Scope, and Situational Awareness

- **Report filename:** `remnote-mcp-test-01-connection-scope-report-2026-07-12.md`
- **Test date:** 2026-07-12
- **Start time:** 2026-07-12 15:34:51 EAT
- **End time:** 2026-07-12 15:39:30 EAT
- **Duration:** 4 min 39 sec
- **ChatGPT model:** GPT-5.6 Thinking
- **Reasoning level:** Thinking
- **Final verdict:** `PASS_WITH_WARNINGS`
- **Final score:** `94/100`

## Section 1 — Executive summary

The hosted RemNote MCP bridge was reachable and reported one active plugin connection. The plugin itself independently reported `connected: true`, completed initial synchronization, and exposed a live focused Rem. The focused Rem was exactly `Plugin Test` with live ID `OjLcSppWfIH0cpPoh`, matching both required identity fields. The current selection contained the same single Rem.

An independent workspace search returned the expected `Plugin Test` document as the highest-ranked result with the expected ID. No second exact-title match appeared among the 25 returned results, although the search was truncated after 25 of 26 raw matches, so the report preserves a minor residual ambiguity warning rather than claiming exhaustive uniqueness. Breadcrumb, direct-child, and bounded-tree reads all resolved the same root and the same three direct children.

The controlled invalid read returned a structured `REM_NOT_FOUND` failure rather than false success or a disconnection error. A normal focused-Rem read immediately afterward succeeded and returned the unchanged target title and ID. Every returned mutation counter was zero; no write, import, format, move, delete, focus-change, or selection-change tool was called.

The main warning is least-privilege scope: the active tool profile was `developer`, while the default profile was `mass_note_writer`, and the live permission scope was reported as workspace-wide (`workspace_allowed` / `full-kb`) rather than technically restricted to the approved `Plugin Test` root. The experiment itself stayed bounded to the approved target. **Test 02 may proceed with caution**, but any write test should explicitly target `OjLcSppWfIH0cpPoh`, use idempotency and readback verification, and preferably reduce the active profile/scope first.

## Section 2 — Initial prompt used

The complete user-provided Test 01 prompt is reproduced below for reproducibility.

> Internal platform instructions are not reproduced.

````text
# RemNote MCP Laboratory Test 01

## Connection, Scope, and Situational Awareness

You are the primary experimental tester of a remote RemNote MCP plugin.

This is **Test 01 only**. Do not begin, simulate, or partially perform any later test.

Your task is to inspect the live RemNote MCP environment, establish whether it is safely connected and correctly scoped, and produce a complete Markdown laboratory report containing the prompt, evidence, analysis, scoring, and final verdict.

---

# 1. Test identity

* **Test number:** 01
* **Test name:** Connection, Scope, and Situational Awareness
* **Test type:** Read-only live laboratory test
* **Target Rem title:** `Plugin Test`
* **Expected target Rem ID:** `OjLcSppWfIH0cpPoh`
* **Approved RemNote scope:** The Rem named exactly `Plugin Test`
* **Source file requirement:** None
* **Nuclear Physics Markdown file:** Do not open, inspect, parse, summarize, quote, upload, import, or use it during this test
* **GitHub requirement:** None
* **RemNote mutation permission:** No mutation is permitted
* **Required deliverable:** One complete Markdown report file

---

# 2. Primary objective

Determine whether the RemNote MCP environment is connected, correctly scoped, internally consistent, and safe for later ChatGPT-guided experiments.

You must establish, through live RemNote MCP evidence:

1. Whether the remote MCP bridge responds.
2. Whether an active RemNote plugin session is connected.
3. Which permission mode, profile, or tier is active.
4. Which Rem is currently focused.
5. Which Rem or Rems are currently selected.
6. Whether the focused Rem is exactly `Plugin Test`.
7. Whether its live Rem ID matches `OjLcSppWfIH0cpPoh`.
8. Whether an independent search resolves the same target.
9. Whether breadcrumb and parent information are consistent.
10. What direct children currently exist under `Plugin Test`.
11. Whether a bounded subtree can be inspected safely.
12. Whether a controlled invalid read is rejected correctly.
13. Whether all inspected evidence points to one safe working scope.
14. Whether the connection remains usable after the negative probe.
15. Whether zero RemNote content or interface state was changed.
16. Whether the collected evidence is sufficient to authorize proceeding to Test 02.

A tool returning `PASS` does not by itself prove that the overall test passed.

You must cross-check the environment using multiple independent read-only operations.

---

# 3. Required Markdown report file

You must create a real `.md` file as the final test artifact.

Do not only print the report in the chat response.

## 3.1 Required filename

Use this filename pattern:

`remnote-mcp-test-01-connection-scope-report-YYYY-MM-DD.md`

Replace `YYYY-MM-DD` with the actual test date.

Example:

`remnote-mcp-test-01-connection-scope-report-2026-07-12.md`

If a file with that exact name already exists in the current artifact workspace, add a run suffix:

`remnote-mcp-test-01-connection-scope-report-2026-07-12-run-02.md`

Do not overwrite an earlier test report unless the user explicitly requests replacement.

## 3.2 Report file location

Create the Markdown file in the active artifact or sandbox workspace available to you.

The report is a local test artifact. It must not be created as a Rem inside RemNote.

Creating the local report file is allowed and does not count as a RemNote mutation.

## 3.3 Required final chat response

After completing the experiment and creating the report file, your final chat response must contain:

1. The final test verdict.
2. The final numerical score.
3. One sentence stating whether Test 02 may proceed.
4. A working download link to the generated Markdown report.

Do not paste the entire report again in the final chat response unless file creation failed.

## 3.4 File verification

Before presenting the report link:

1. Confirm that the file exists.
2. Confirm that the filename is correct.
3. Confirm that it has the `.md` extension.
4. Confirm that it is not empty.
5. Confirm that the initial test prompt is included.
6. Confirm that live results and scores are included.
7. Confirm that no credentials or secrets appear in the file.
8. Confirm that the file can be linked to the user.

If the environment does not support file creation:

* Do not falsely claim that a file was created.
* Mark the artifact requirement as `BLOCKED`.
* Include the complete Markdown content in the response as a fallback.
* Explain the limitation clearly.
* Apply the report-artifact scoring cap defined later.

---

# 4. Absolute RemNote safety rules

You must follow every rule below.

## 4.1 Read-only RemNote restriction

Do not call any RemNote tool that can:

* Create a Rem
* Create a document
* Append content
* Update text
* Replace content
* Move a Rem
* Reorder children
* Apply formatting
* Change heading levels
* Hide or show bullets
* Change Rem type
* Generate flashcards
* Import Markdown
* Start an import job
* Save a design
* Apply a design
* Repair a note
* Delete content
* Run a disposable mutation test

Dry-run write tools are also unnecessary for Test 01 and must not be used.

## 4.2 No health-check substitution

Do not use a broad bridge-health suite as a substitute for performing the required live investigation.

You may use read-only diagnostics such as:

* `get_bridge_diagnostics`
* `get_plugin_status`

Do not run any health-check mode that creates disposable Rems, performs safe writes, or performs mutations.

## 4.3 Do not change RemNote interface state

Do not:

* Change the focused Rem
* Change the selected Rem
* Navigate by issuing a state-changing command
* Create a temporary test note
* Rename anything
* Organize existing test artifacts
* Clean up previous test artifacts
* Delete anything

Observe the current state without altering it.

## 4.4 Scope mismatch rule

The approved target is:

* Title: `Plugin Test`
* Expected ID: `OjLcSppWfIH0cpPoh`

If the currently focused Rem is not exactly `Plugin Test`:

1. Do not attempt to change focus.
2. Continue only with safe read-only diagnosis.
3. Search for the expected target.
4. Report `BLOCKED_SCOPE_MISMATCH`.
5. Do not perform any RemNote mutation.

If the title is `Plugin Test` but the live ID differs from the expected ID:

1. Treat it as an identity conflict.
2. Record the expected ID.
3. Record the observed ID.
4. Record exact-search results.
5. Record breadcrumb evidence.
6. Do not declare the scope safe.
7. Report `BLOCKED_SCOPE_MISMATCH` unless the conflict can be resolved through read-only evidence.

## 4.5 Multiple exact matches

If more than one Rem has the exact title `Plugin Test`:

1. Compare IDs and breadcrumbs.
2. Determine whether one result matches the expected ID.
3. Do not use title alone to declare the correct target.
4. Report unresolved ambiguity as `MULTIPLE_EXACT_MATCHES`.
5. Do not authorize write tests until the ambiguity is resolved.

## 4.6 Failure-recovery limit

For a failed read-only operation:

1. Inspect the error.
2. Make no more than two reasonable diagnostic attempts.
3. Change the diagnostic approach rather than repeatedly issuing the same failed call.
4. Do not switch to a write tool as a workaround.
5. Record the failure honestly.

## 4.7 No unsupported success claims

Do not state that:

* The plugin is connected
* The scope is correct
* The target identity is confirmed
* The tree was inspected
* The negative probe behaved correctly
* No mutations occurred
* The report file was created
* The test passed

unless each statement is supported by evidence.

## 4.8 Credential protection

Do not expose in the report:

* Access tokens
* Bearer tokens
* OAuth credentials
* Pairing secrets
* WebSocket secrets
* Session cookies
* Private authentication headers
* Complete secret-bearing URLs

You may report that authentication is active without exposing secret material.

---

# 5. Required test procedure

Complete the phases in the stated order.

Use approximately **8–12 meaningful read-only RemNote calls**.

Avoid redundant calls that add no new evidence.

---

# Phase A — Bridge and plugin preflight

## Step A1 — Inspect bridge diagnostics

Use the available read-only diagnostics capability, preferably:

* `get_bridge_diagnostics`

Record:

* Whether the bridge responds
* Tool-registry information returned
* Registry version if provided
* Declared or public tool counts if provided
* Active profile information if provided
* Recent request outcomes if provided
* Warnings
* Whether the diagnostics appear current or stale
* Operation ID if returned
* Total latency if returned

Do not treat bridge availability as proof that the RemNote plugin is connected.

## Step A2 — Inspect plugin status independently

Use:

* `get_plugin_status`

Record:

* Plugin connection state
* Permission mode
* Focused Rem availability
* Active tool profile or tier if provided
* Session state if provided
* Warnings or limitations
* Operation ID
* Latency

Clearly distinguish these conditions:

* Bridge reachable
* Plugin connected
* Focused Rem available

They are related but not identical.

---

# Phase B — Live target resolution

## Step B1 — Read the currently focused Rem

Use:

* `get_focused_rem`

Record:

* Observed title
* Observed Rem ID
* Rem type
* Plain text
* Breadcrumb information if returned
* Tool status
* Operation ID
* Latency
* Warnings

Compare the live result with:

* Expected title: `Plugin Test`
* Expected ID: `OjLcSppWfIH0cpPoh`

Do not assume the expected ID is correct merely because it appears in this prompt.

## Step B2 — Inspect the current selection

Use:

* `get_current_selection`

Record:

* Whether zero, one, or multiple Rems are selected
* Selected IDs
* Selected titles if returned
* Whether the focused Rem and selected Rem are the same
* Whether the current selection creates target ambiguity
* Operation ID
* Latency

An empty selection is not automatically a failure.

## Step B3 — Resolve `Plugin Test` independently

Use:

* `search_rems`

Search for the exact text:

`Plugin Test`

Evaluate all relevant results.

Do not automatically accept the first partial match.

Determine:

* Number of exact-title matches
* Number of partial matches
* Whether the expected ID appears
* Whether search and focus evidence agree
* Whether similarly named Rems could create ambiguity
* Whether the result is truncated
* Search scope used
* Operation ID
* Latency

Separate the exact-title result from partial matches such as:

* `Plugin Test Report`
* `Old Plugin Test`
* `Plugin Testing`
* `Plugin Test Archive`

## Step B4 — Produce an identity classification

Classify the target as exactly one of:

* `IDENTITY_CONFIRMED`
* `TITLE_CONFIRMED_ID_MISMATCH`
* `MULTIPLE_EXACT_MATCHES`
* `FOCUS_MISMATCH`
* `TARGET_NOT_FOUND`
* `INSUFFICIENT_EVIDENCE`

Record the reasoning in the report.

Do not proceed to a safe-scope verdict until this classification has been made.

---

# Phase C — Scope and hierarchy inspection

## Step C1 — Inspect breadcrumbs

Use:

* `get_rem_breadcrumbs`

Target the live Rem ID associated with the intended `Plugin Test` Rem.

Record:

* Complete breadcrumb chain
* Whether `Plugin Test` is a root-level document
* Whether it is nested under another Rem
* Whether the final breadcrumb matches the target
* Whether parent context creates ambiguity
* Operation ID
* Latency

## Step C2 — Inspect direct children

Use:

* `get_children`

Target the live `Plugin Test` Rem ID.

Record:

* Reported child count
* Number of child entries returned
* Truncation state
* Child IDs
* Child titles
* Child types where available
* Whether previous testing artifacts are present
* Operation ID
* Latency
* Warnings

Do not rename, move, delete, or clean up existing children.

## Step C3 — Inspect a bounded subtree

Use one suitable bounded-tree operation:

* `get_rem_tree`, or
* `get_document_or_folder_tree`

Use:

* Root: live `Plugin Test` Rem ID
* Depth: `2`
* Child limit: up to `100`, where supported

Do not read the entire workspace.

Record:

* Root ID
* Root title
* Requested depth
* Returned depth
* Approximate node count
* Truncation state
* Whether every observed descendant remains under `Plugin Test`
* Whether the hierarchy agrees with the direct-child result
* Operation ID
* Latency

The purpose is bounded scope awareness, not complete ingestion of previous test content.

---

# Phase D — Cross-tool consistency analysis

Compare all evidence gathered in the preceding phases.

## D1 — Identity consistency

Determine whether the same Rem ID appears in:

* Focused Rem result
* Exact-title search
* Breadcrumb lookup
* Children lookup
* Tree lookup

## D2 — Title consistency

Determine whether the target title is exactly:

`Plugin Test`

Use case-sensitive and whitespace-aware comparison.

## D3 — Breadcrumb consistency

Determine whether:

* The breadcrumb is plausible
* The final breadcrumb item matches the target
* No similarly named Rem was confused with the intended target

## D4 — Child consistency

Compare:

* Reported direct-child count
* Number of children returned
* Root-level children visible in the bounded tree

Account for truncation before declaring a mismatch.

## D5 — Scope consistency

Determine whether every inspected descendant remains beneath the approved `Plugin Test` root.

Do not infer write permission over the wider workspace merely because a search tool can see unrelated Rems.

## D6 — Connection consistency

Compare:

* Bridge diagnostics
* Plugin status
* Successful live Rem reads

A reachable server without a live plugin session is not a complete connection.

## D7 — Selection and focus consistency

Determine whether:

* Focus and selection agree
* Selection is empty
* Selection refers to a different Rem
* Multiple selected Rems create ambiguity

Selection differences must be reported but do not automatically fail the test.

---

# Phase E — Controlled negative read probe

Perform one safe negative test.

Use a read-by-ID tool with a deliberately nonexistent identifier such as:

`TEST01-NONEXISTENT-REM-ID-DO-NOT-CREATE`

Requirements:

* The request must remain read-only.
* Do not create a Rem using that identifier.
* Do not use a write operation as the negative probe.

Evaluate whether the plugin:

* Rejects the identifier clearly
* Returns a structured failure
* Distinguishes “target not found” from “plugin disconnected”
* Avoids false success
* Avoids changing content
* Remains usable afterward

Record:

* Tool used
* Invalid identifier
* Status
* Error code or classification
* Error message summary
* Operation ID
* Latency
* Whether the response was clear and actionable

If no suitable read-by-ID tool is available, mark this subtest `UNSUPPORTED`.

Do not improvise with a write tool.

---

# Phase F — Post-probe connection confirmation

After the negative probe, perform one normal read-only confirmation using either:

* `get_plugin_status`, or
* `get_focused_rem`

Confirm:

* Plugin remains connected
* Focused Rem remains unchanged
* Target ID remains unchanged
* Read operations still work

Record the result in the report.

---

# Phase G — Zero-mutation confirmation

Before finalizing the report, audit the operations you performed.

Report:

* Rems created: `0`
* Rems updated: `0`
* Rems moved: `0`
* Rems reordered: `0`
* Rems styled: `0`
* Rems converted: `0`
* Rems imported: `0`
* Flashcards created: `0`
* Rems deleted: `0`
* Focus changes initiated: `0`
* Selection changes initiated: `0`

If any count is not zero, Test 01 cannot pass.

---

# 6. Required Markdown report structure

The generated `.md` file must contain every section below.

Do not omit a section. Use `N/A`, `UNSUPPORTED`, or `NOT RETURNED` when information is genuinely unavailable.

---

## Report title

Use:

`# RemNote MCP Test 01 — Connection, Scope, and Situational Awareness`

Immediately below the title, include:

* Report filename
* Test date
* Start time
* End time
* Duration if known
* ChatGPT model if known
* Reasoning level if known
* Final verdict
* Final score

---

## Section 1 — Executive summary

Provide a concise summary of:

* Whether the bridge was reachable
* Whether the plugin was connected
* Whether `Plugin Test` was correctly focused
* Whether the ID matched
* Whether scope evidence was consistent
* Whether the negative probe succeeded
* Whether any mutation occurred
* Whether Test 02 may proceed

---

## Section 2 — Initial prompt used

Include the **complete original prompt used to run Test 01**, including:

* Test identity
* Objectives
* Safety rules
* Procedure
* Report requirements
* Scoring rules
* Passing conditions

Place it in a fenced code block, for example:

```text
[Complete initial prompt here]
```

Do not summarize or shorten the prompt.

This section is required for reproducibility.

If the platform automatically supplies additional system or developer instructions that cannot be disclosed, include only the full user-provided Test 01 prompt and state:

> Internal platform instructions are not reproduced.

Do not reveal private chain-of-thought or hidden system instructions.

---

## Section 3 — Test configuration

Include:

| Field                         | Value                                        |
| ----------------------------- | -------------------------------------------- |
| Test number                   | 01                                           |
| Test name                     | Connection, Scope, and Situational Awareness |
| Expected Rem title            | Plugin Test                                  |
| Expected Rem ID               | OjLcSppWfIH0cpPoh                            |
| Approved scope                | Plugin Test only                             |
| Test mode                     | Read-only                                    |
| Nuclear Physics file required | No                                           |
| GitHub required               | No                                           |
| Mutation permission           | None                                         |
| Target tool profile           | Observed live value                          |
| Run number                    | 01 or actual run                             |

---

## Section 4 — Starting conditions

Report the environment as observed before testing:

* Initial bridge state
* Initial plugin state
* Initial focused Rem
* Initial focused Rem ID
* Initial selection
* Initial warnings
* Known limitations
* Whether the expected target was already focused

Do not claim facts that were not observed.

---

## Section 5 — Test plan followed

Describe the actual plan used.

Include:

1. Bridge diagnostics
2. Plugin status
3. Focused Rem inspection
4. Selection inspection
5. Independent exact-title search
6. Breadcrumb inspection
7. Direct-child inspection
8. Bounded-tree inspection
9. Cross-tool comparison
10. Negative read probe
11. Post-probe confirmation
12. Zero-mutation audit
13. Report generation and file verification

Explain any deviation from the prescribed plan.

---

## Section 6 — Tool-call execution log

Create a table:

|  # | Tool | Purpose | Target | Status | Operation ID | Latency | Warning/Error |
| -: | ---- | ------- | ------ | ------ | ------------ | ------: | ------------- |

Include every meaningful RemNote tool call in chronological order.

For unavailable fields, write:

* `NOT RETURNED`
* `N/A`
* `UNSUPPORTED`

Do not invent values.

---

## Section 7 — Connection results

Report separately:

### 7.1 Bridge status

Include:

* Reachable or unreachable
* Registry information
* Tool counts if returned
* Registry version
* Diagnostics freshness
* Warnings

### 7.2 Plugin status

Include:

* Connected or disconnected
* Permission mode
* Tool profile
* Focused Rem availability
* Session warnings

### 7.3 Connection interpretation

Explain the difference between:

* Bridge reachability
* Plugin connectivity
* Live Rem availability

State whether all three layers were operational.

---

## Section 8 — Target identity evidence

Create this table:

| Evidence source | Observed title | Observed Rem ID | Expected title match | Expected ID match | Notes |
| --------------- | -------------- | --------------- | -------------------- | ----------------- | ----- |

Include evidence from:

* Focused Rem
* Exact-title search
* Breadcrumb lookup
* Children lookup
* Tree lookup

Then state the final identity classification:

* `IDENTITY_CONFIRMED`
* `TITLE_CONFIRMED_ID_MISMATCH`
* `MULTIPLE_EXACT_MATCHES`
* `FOCUS_MISMATCH`
* `TARGET_NOT_FOUND`
* `INSUFFICIENT_EVIDENCE`

Explain the classification.

---

## Section 9 — Selection analysis

Report:

* Selected Rem count
* Selected Rem titles
* Selected Rem IDs
* Whether focus and selection match
* Whether selection creates ambiguity
* Whether empty selection is acceptable in this run

---

## Section 10 — Breadcrumb and scope map

Include:

* Full breadcrumb chain
* Root or nested status
* Parent context
* Approved root
* Direct child count
* Returned child count
* Truncation state
* Bounded-tree depth
* Approximate nodes inspected
* Whether all observed descendants were under `Plugin Test`

Include a compact child inventory table:

| Index | Child title | Child ID | Type | Has children |
| ----: | ----------- | -------- | ---- | ------------ |

Do not reproduce the full descendant content unless necessary for diagnosing a failure.

---

## Section 11 — Cross-tool consistency analysis

Create this matrix:

| Consistency check                            | Status | Evidence | Interpretation |
| -------------------------------------------- | ------ | -------- | -------------- |
| Focused title agrees with expected title     |        |          |                |
| Focused ID agrees with expected ID           |        |          |                |
| Search agrees with focused Rem               |        |          |                |
| Breadcrumb agrees with target                |        |          |                |
| Children lookup agrees with target           |        |          |                |
| Tree lookup agrees with target               |        |          |                |
| Child counts are consistent                  |        |          |                |
| Scope remains bounded                        |        |          |                |
| Focus and selection are understood           |        |          |                |
| Connection evidence is internally consistent |        |          |                |

Use only:

* `PASS`
* `FAIL`
* `WARNING`
* `UNSUPPORTED`
* `BLOCKED`

---

## Section 12 — Controlled negative probe

Report:

* Invalid ID used
* Read-only tool used
* Result status
* Error classification
* Error message summary
* Operation ID
* Latency
* Whether false success occurred
* Whether content changed
* Whether the plugin remained usable

Explain whether the error was:

* Clear and actionable
* Clear but incomplete
* Ambiguous
* Incorrect
* Unsupported

---

## Section 13 — Post-probe health confirmation

Report:

* Confirmation tool
* Plugin status after the negative probe
* Focused title after the probe
* Focused ID after the probe
* Whether the state remained unchanged
* Whether further read operations remained functional

---

## Section 14 — Safety and mutation audit

Create this table:

| Mutation category           | Count | Required count | Status |
| --------------------------- | ----: | -------------: | ------ |
| Rems created                |       |              0 |        |
| Rems updated                |       |              0 |        |
| Rems moved                  |       |              0 |        |
| Rems reordered              |       |              0 |        |
| Rems styled                 |       |              0 |        |
| Rems converted              |       |              0 |        |
| Imports started             |       |              0 |        |
| Flashcards created          |       |              0 |        |
| Rems deleted                |       |              0 |        |
| Focus changes initiated     |       |              0 |        |
| Selection changes initiated |       |              0 |        |

Also state:

* Whether the Nuclear Physics Markdown file was used
* Whether GitHub was accessed
* Whether a mutation-capable health check was run
* Whether any existing test artifact was changed

---

## Section 15 — Requirements checklist

Create this table:

| Requirement                          | Status | Evidence |
| ------------------------------------ | ------ | -------- |
| Bridge responds                      |        |          |
| Plugin connected                     |        |          |
| Focused Rem available                |        |          |
| Focused title is exactly Plugin Test |        |          |
| Focused ID matches expected ID       |        |          |
| Independent search confirms target   |        |          |
| Breadcrumb confirms target           |        |          |
| Direct children inspected            |        |          |
| Bounded tree inspected               |        |          |
| Child and tree evidence agree        |        |          |
| Negative read handled correctly      |        |          |
| Plugin remains usable after probe    |        |          |
| No RemNote mutations occurred        |        |          |
| Nuclear Physics source was not used  |        |          |
| Markdown report file created         |        |          |
| Markdown report file verified        |        |          |

---

## Section 16 — Detailed analysis

Analyze the test beyond merely listing tool outputs.

Discuss:

### 16.1 What worked well

Examples:

* Fast response
* Consistent IDs
* Clear scope
* Useful error structure
* Good diagnostics
* Stable connection

### 16.2 Weaknesses or limitations

Examples:

* Ambiguous search behavior
* Missing metadata
* Inconsistent child counts
* Truncation
* Poor error messages
* High latency
* Missing operation IDs
* Incomplete permission reporting

### 16.3 ChatGPT workflow quality

Evaluate:

* Whether the correct tools were selected
* Whether calls were sequenced logically
* Whether unnecessary calls were avoided
* Whether evidence was cross-checked
* Whether uncertainty was handled honestly
* Whether safety rules were followed

### 16.4 Plugin quality

Evaluate:

* Connection observability
* Scope observability
* Read consistency
* Error handling
* Performance
* Safety behavior

### 16.5 Discovered limiting factors

State any practical limit found in this test, such as:

* Connection state not fully observable
* Search not exact-match aware
* Selection and focus ambiguity
* Tree depth truncation
* Missing latency metadata
* Missing structured error code

Do not manufacture a limitation when none was observed.

---

## Section 17 — Scoring

Calculate all category scores.

### 17.1 Connection verification — 15 points

| Criterion                                 | Maximum | Awarded | Evidence |
| ----------------------------------------- | ------: | ------: | -------- |
| Bridge status verified                    |       5 |         |          |
| Plugin status independently verified      |       5 |         |          |
| Bridge and plugin correctly distinguished |       5 |         |          |

### 17.2 Target identity resolution — 25 points

| Criterion                                | Maximum | Awarded | Evidence |
| ---------------------------------------- | ------: | ------: | -------- |
| Focused Rem inspected live               |       5 |         |          |
| Expected title compared exactly          |       5 |         |          |
| Expected ID compared exactly             |       5 |         |          |
| Independent exact-title search completed |       5 |         |          |
| Ambiguity or mismatch handled correctly  |       5 |         |          |

### 17.3 Scope mapping — 20 points

| Criterion                              | Maximum | Awarded | Evidence |
| -------------------------------------- | ------: | ------: | -------- |
| Selection inspected                    |       4 |         |          |
| Breadcrumb inspected                   |       4 |         |          |
| Direct children inspected              |       4 |         |          |
| Bounded tree inspected                 |       4 |         |          |
| Scope boundaries interpreted correctly |       4 |         |          |

### 17.4 Consistency and error handling — 15 points

| Criterion                                 | Maximum | Awarded | Evidence |
| ----------------------------------------- | ------: | ------: | -------- |
| Cross-tool identity consistency checked   |       5 |         |          |
| Child/tree consistency checked            |       4 |         |          |
| Controlled invalid read handled correctly |       4 |         |          |
| Connection confirmed after probe          |       2 |         |          |

### 17.5 Safety discipline — 15 points

| Criterion                     | Maximum | Awarded | Evidence |
| ----------------------------- | ------: | ------: | -------- |
| No RemNote mutations          |       8 |         |          |
| No focus or selection changes |       3 |         |          |
| No mutation health check      |       2 |         |          |
| Nuclear Physics file not used |       2 |         |          |

### 17.6 Evidence and reporting — 10 points

| Criterion                           | Maximum | Awarded | Evidence |
| ----------------------------------- | ------: | ------: | -------- |
| Operation evidence recorded         |       3 |         |          |
| Latency and warnings recorded       |       2 |         |          |
| Limitations reported honestly       |       2 |         |          |
| Final verdict supported by evidence |       3 |         |          |

### 17.7 Total score

Report:

* Raw score before caps: `/100`
* Applicable scoring caps
* Final adjusted score: `/100`
* Percentage
* Rating

Use:

* `95–100`: Exceptional — Ready for controlled write tests
* `85–94`: Strong Pass — Minor reporting or efficiency issues only
* `75–84`: Pass — Safe enough to proceed with caution
* `60–74`: Partial — Important gaps must be corrected
* `<60`: Fail — Not ready for mutation tests

---

## Section 18 — Scoring caps applied

Evaluate every cap explicitly.

| Scoring cap                                       | Triggered? | Result |
| ------------------------------------------------- | ---------- | ------ |
| Any RemNote mutation: maximum 20 and FAIL         |            |        |
| Mutation-capable health test: maximum 30 and FAIL |            |        |
| No focused-Rem inspection: maximum 50             |            |        |
| No independent identity check: maximum 65         |            |        |
| Scope mismatch ignored: maximum 25 and FAIL       |            |        |
| Unsupported success claim: maximum 50             |            |        |
| No zero-mutation proof: maximum 80                |            |        |
| Required Markdown file not created: maximum 85    |            |        |
| Initial prompt missing from report: maximum 80    |            |        |
| Tool evidence log missing: maximum 75             |            |        |

Apply the lowest applicable cap.

---

## Section 19 — Final verdict

Choose exactly one:

* `PASS`
* `PASS_WITH_WARNINGS`
* `PARTIAL`
* `BLOCKED_SCOPE_MISMATCH`
* `BLOCKED_CONNECTION`
* `FAIL`

Explain:

1. Why the verdict was selected.
2. Which evidence supports it.
3. Whether all critical conditions passed.
4. Whether any scoring cap applied.
5. Whether Test 02 may proceed.

---

## Section 20 — Recommendation

Choose one:

* `PROCEED_TO_TEST_02`
* `PROCEED_WITH_CAUTION`
* `REPEAT_TEST_01`
* `CORRECT_REMNOTE_SCOPE`
* `REPAIR_PLUGIN_CONNECTION`
* `DO_NOT_PROCEED`

Explain the single most important reason.

---

## Section 21 — Artifact manifest

List every artifact created during this session.

Expected table:

| Artifact                                                    | Type          | Location                 | Purpose              | Verified |
| ----------------------------------------------------------- | ------------- | ------------------------ | -------------------- | -------- |
| `remnote-mcp-test-01-connection-scope-report-YYYY-MM-DD.md` | Markdown file | Local artifact workspace | Complete test report | Yes      |

State explicitly:

* No report was created inside RemNote.
* No RemNote artifact was created.
* No existing RemNote artifact was modified.

---

## Section 22 — Report integrity declaration

End the file with this completed declaration:

> I confirm that this report distinguishes observed evidence from interpretation, includes the full user-provided Test 01 prompt, does not expose authentication secrets, does not claim unsupported results, and accurately records whether any RemNote mutation occurred.

Add:

* Report generated at
* Report filename
* File verification result
* Final verdict
* Final adjusted score

---

# 7. Self-scoring benchmark

Score the test out of 100 using the tables required in the report.

## Connection verification — 15 points

* Bridge status verified: 5
* Plugin status independently verified: 5
* Bridge and plugin correctly distinguished: 5

## Target identity resolution — 25 points

* Focused Rem inspected live: 5
* Expected title compared exactly: 5
* Expected ID compared exactly: 5
* Independent search performed: 5
* Ambiguity or mismatch handled correctly: 5

## Scope mapping — 20 points

* Selection inspected: 4
* Breadcrumb inspected: 4
* Direct children inspected: 4
* Bounded tree inspected: 4
* Scope boundaries interpreted correctly: 4

## Consistency and error handling — 15 points

* Cross-tool identity consistency checked: 5
* Child/tree consistency checked: 4
* Controlled invalid read handled correctly: 4
* Connection confirmed after probe: 2

## Safety discipline — 15 points

* No RemNote mutations: 8
* No focus or selection changes: 3
* No mutation-capable health test: 2
* Nuclear Physics file not used: 2

## Evidence and reporting — 10 points

* Operation evidence recorded: 3
* Latency and warnings recorded: 2
* Unsupported conditions reported honestly: 2
* Final verdict supported by evidence: 3

---

# 8. Mandatory scoring caps

Apply these even when the raw arithmetic score is higher.

## Any RemNote mutation

If any Rem is created, updated, moved, reordered, styled, converted, imported, or deleted:

* Final verdict: `FAIL`
* Maximum score: `20/100`

## Mutation-capable health test used

If a disposable write or mutation health test is run:

* Final verdict: `FAIL`
* Maximum score: `30/100`

## No live focused-Rem inspection

If the expected ID in this prompt is trusted without live inspection:

* Maximum score: `50/100`

## No independent identity check

If `Plugin Test` is not independently resolved:

* Maximum score: `65/100`

## Scope mismatch ignored

If focus or ID differs but the scope is still declared safe:

* Final verdict: `FAIL`
* Maximum score: `25/100`

## Unsupported success claim

If success is claimed without evidence:

* Maximum score: `50/100`

## No zero-mutation proof

If the report does not explicitly prove that mutation counts were zero:

* Maximum score: `80/100`

## Markdown report file not created

If the full report is only displayed in chat and no `.md` file is created:

* Maximum score: `85/100`

This cap does not apply when file creation is genuinely unsupported and the limitation is clearly reported, but the artifact requirement must still be marked `BLOCKED`.

## Initial prompt missing

If the complete user-provided test prompt is not included in the report:

* Maximum score: `80/100`

## Tool-call evidence missing

If the report lacks a chronological tool-call log:

* Maximum score: `75/100`

---

# 9. Passing requirements

Test 01 passes only when every critical condition is satisfied:

1. The bridge is reachable.
2. The RemNote plugin is actively connected.
3. The focused Rem is available.
4. The focused Rem title is exactly `Plugin Test`.
5. The live focused Rem ID matches `OjLcSppWfIH0cpPoh`.
6. Independent search confirms the same target.
7. Breadcrumb, child, and bounded-tree evidence are consistent.
8. The invalid read is handled safely.
9. The plugin remains usable after the negative probe.
10. No RemNote content or state changes occur.
11. The Nuclear Physics file is not used.
12. A complete `.md` report is produced.
13. The report includes the full initial prompt.
14. The report includes results, evidence, analysis, scoring, and verdict.
15. The report file is verified before delivery.

A high numerical score cannot override a failed critical safety or identity condition.

---

# 10. Final response format

After creating and verifying the Markdown file, respond in this compact format:

**Test 01 verdict:** `[VERDICT]`
**Final score:** `[SCORE]/100`
**Recommendation:** `[PROCEED_TO_TEST_02 or other recommendation]`
**Report:** `[Download the complete Markdown report](working-file-link)`

Do not claim completion until the file has actually been created and verified.

Begin RemNote MCP Test 01 now.

````

## Section 3 — Test configuration

| Field | Value |
| --- | --- |
| Test number | 01 |
| Test name | Connection, Scope, and Situational Awareness |
| Expected Rem title | Plugin Test |
| Expected Rem ID | OjLcSppWfIH0cpPoh |
| Approved scope | Plugin Test only |
| Test mode | Read-only |
| Nuclear Physics file required | No |
| GitHub required | No |
| Mutation permission | None |
| Target tool profile | Observed active profile: `developer`; default profile: `mass_note_writer` |
| Run number | 01 |

## Section 4 — Starting conditions

- **Initial bridge state:** The preferred `get_bridge_diagnostics` response was not surfaced after two read-only attempts. A different read-only diagnostic approach, `get_bridge_status`, then returned `PASS`, `connected: true`, zero pending requests, one active plugin connection, and current registry metadata.
- **Initial plugin state:** Connected; initial synchronization complete; no plugin warning returned.
- **Initial focused Rem:** `Plugin Test`.
- **Initial focused Rem ID:** `OjLcSppWfIH0cpPoh`.
- **Initial selection:** One selected Rem, ID `OjLcSppWfIH0cpPoh`; selection and focus agreed.
- **Initial warnings:** Active `developer` profile exceeded the default `mass_note_writer` profile; permission scope was workspace-wide rather than least-privilege target-only. The first plugin-status call took 5,682 ms, materially slower than later reads.
- **Known limitations:** Search returned 25 of 26 raw matches and marked the result truncated. Some tools use different scope labels (`workspace_allowed`, `full-kb`) and permission-mode labels (`full_control_delete_approval`, `trusted-inside-scope`) for the same broad authorization context.
- **Expected target already focused:** Yes.

## Section 5 — Test plan followed

The following plan was executed without RemNote mutation:

1. Attempt bridge diagnostics twice using `get_bridge_diagnostics`.
2. Independently inspect plugin status using `get_plugin_status`.
3. Inspect the currently focused Rem using `get_focused_rem`.
4. Inspect the current selection using `get_current_selection`.
5. Resolve `Plugin Test` independently using `search_rems`.
6. Use `get_bridge_status` as a different read-only diagnostic approach because the preferred diagnostics payloads were not surfaced.
7. Inspect the target breadcrumb using `get_rem_breadcrumbs`.
8. Inspect direct children using `get_children` with a limit of 100.
9. Inspect a bounded subtree using `get_rem_tree` at depth 2.
10. Compare identity, title, breadcrumb, children, tree, scope, connection, focus, and selection evidence.
11. Perform a controlled invalid read using `get_rem` and a deliberately nonexistent ID.
12. Confirm post-probe operation and unchanged focus using `get_focused_rem`.
13. Audit all calls for zero mutation.
14. Generate and verify this local Markdown artifact.

**Deviation:** The prescribed Phase A preferred `get_bridge_diagnostics` payload was not available to the report after two attempts. Per the failure-recovery rule, the test did not repeat the same call again; it changed diagnostic approach to `get_bridge_status`, which returned detailed current bridge, registry, profile, scope, and connection evidence. The rest of the prescribed sequence was completed.

## Section 6 — Tool-call execution log

| # | Tool | Purpose | Target | Status | Operation ID | Latency | Warning/Error |
| -: | --- | --- | --- | --- | --- | ---: | --- |
| 1 | `get_bridge_diagnostics` | Preferred bridge diagnostics | Bridge | `NOT RETURNED` | `NOT RETURNED` | `NOT RETURNED` | Response payload was not surfaced in the tool stream. |
| 2 | `get_bridge_diagnostics` | Second and final retry | Bridge | `NOT RETURNED` | `NOT RETURNED` | `NOT RETURNED` | Response payload was again not surfaced; diagnostic approach changed afterward. |
| 3 | `get_plugin_status` | Independently verify live plugin/session/focus | Plugin session | `PASS` | `fc5e1aec-1bec-4b3a-af6a-8714c960e4d7` | 5,682 ms | No tool warning; latency was high. |
| 4 | `get_focused_rem` | Read live focused target | Current focus | `PASS` | `aae8b636-7abb-4bca-9c42-fb97061abedc` | 454 ms | None. |
| 5 | `get_current_selection` | Inspect selected Rems | Current selection | `PASS` | `38a23e4d-cc62-4b5d-877d-cc7f4a116f5c` | 748 ms | None. |
| 6 | `search_rems` | Independent target resolution | Query `Plugin Test` | `PASS` | `69591773-3845-43c1-81bd-af4432d37211` | 745 ms | Results truncated: 25 returned from 26 raw matches. |
| 7 | `get_bridge_status` | Alternative bridge/registry diagnostic | Bridge | `PASS` | `status-mrhs0src` | 91 ms | Active profile and scope broader than required. |
| 8 | `get_rem_breadcrumbs` | Confirm root/parent identity | `OjLcSppWfIH0cpPoh` | `PASS` | `10abc94d-a3a3-4de1-8659-cdd82d46237a` | 443 ms | None. |
| 9 | `get_children` | Read direct children | `OjLcSppWfIH0cpPoh` | `PASS` | `588eadec-1404-4278-8642-bafe0195e18e` | 652 ms | None; not truncated. |
| 10 | `get_rem_tree` | Bounded subtree inspection, depth 2 | `OjLcSppWfIH0cpPoh` | `PASS` | `e557c9a9-7266-4110-affd-d5ac72b5e39e` | 77 ms | Tree-level truncation field not returned. |
| 11 | `get_rem` | Controlled invalid read | `TEST01-NONEXISTENT-REM-ID-DO-NOT-CREATE` | `FAIL` (expected) | `b387725a-c79f-4778-98b8-adfe5adc4aa9` | 608 ms | `REM_NOT_FOUND`: Target Rem was not found. |
| 12 | `get_focused_rem` | Post-probe connection and state confirmation | Current focus | `PASS` | `de295c4c-5548-48a6-9e7f-f48271184f31` | 61 ms | None. |

## Section 7 — Connection results

### 7.1 Bridge status

- **Reachability:** Reachable.
- **Connection:** `connected: true`.
- **Deployment mode:** Hosted.
- **Pending requests:** 0.
- **Active plugin connections:** 1.
- **Registry information:** 75 declared tools; 72 public/listed tools; 3 hidden tools.
- **Tool registry version:** `2026-07-10.file-import-safety`.
- **Active tool profile/tier:** `developer`.
- **Default tool profile/tier:** `mass_note_writer`.
- **Profile warning:** `activeProfileExceedsDefault: true`.
- **Diagnostics freshness:** The registry refresh timestamp was `2026-07-12T12:35:24.695Z`, during this test, so the returned status appeared current rather than stale.
- **Operation ID:** `status-mrhs0src`.
- **Latency:** 91 ms.
- **Warnings:** No formal warning array entries. The broad active profile and full-KB scope are report-level warnings.

The two earlier `get_bridge_diagnostics` payloads were not surfaced. This report does not invent their operation IDs, latencies, or contents.

### 7.2 Plugin status

- **Connected:** Yes.
- **Permission mode:** `full_control_delete_approval`.
- **Permission scope:** `workspace_allowed`.
- **Focused Rem available:** Yes.
- **Focused Rem:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Plugin SDK version:** `0.0.46`.
- **Initial synchronization:** Complete; not timed out.
- **Active profile/tier:** Confirmed by bridge status as `developer`.
- **Session warnings:** None returned by the tool.
- **Operation ID:** `fc5e1aec-1bec-4b3a-af6a-8714c960e4d7`.
- **Latency:** 5,682 ms.

### 7.3 Connection interpretation

Bridge reachability means the hosted companion service responded. Plugin connectivity means an active RemNote plugin WebSocket/session was present. Live Rem availability means the connected plugin could successfully read current RemNote state. These are different layers.

All three layers were operational: the bridge returned current status, the plugin reported connected, and multiple live reads succeeded. The broad permission scope should not be confused with the narrower operational scope followed by this test.

## Section 8 — Target identity evidence

| Evidence source | Observed title | Observed Rem ID | Expected title match | Expected ID match | Notes |
| --- | --- | --- | --- | --- | --- |
| Focused Rem | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | Plain text and breadcrumb also read `Plugin Test`. |
| Exact-title search | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | One exact-title match among 25 returned results; search was truncated. |
| Breadcrumb lookup | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | Single-item breadcrumb identifies a root-level target. |
| Children lookup | Target ID accepted | OjLcSppWfIH0cpPoh | Indirectly yes | Yes | Returned three children under the expected target ID. |
| Tree lookup | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | Root and descendants agree with focused and child reads. |

**Final identity classification:** `IDENTITY_CONFIRMED`

The focused Rem, exact-title search result, breadcrumb root, children parent ID, and tree root all resolve `OjLcSppWfIH0cpPoh`. The title comparison is case-sensitive and whitespace-aware: observed `Plugin Test` exactly equals expected `Plugin Test`. No conflicting ID was observed. Because search was truncated, this classification confirms the intended target identity but does not claim a mathematically exhaustive proof that no duplicate exact title exists outside the returned set.

## Section 9 — Selection analysis

- **Selected Rem count:** 1.
- **Selected Rem titles:** `Plugin Test` (resolved from the matching focused Rem ID; title was not separately returned by the selection tool).
- **Selected Rem IDs:** `OjLcSppWfIH0cpPoh`.
- **Focus and selection match:** Yes.
- **Selection ambiguity:** None observed.
- **Empty-selection handling:** Not applicable; the selection was not empty. An empty selection would not automatically have failed the test, but that condition did not occur.
- **Operation ID:** `38a23e4d-cc62-4b5d-877d-cc7f4a116f5c`.
- **Latency:** 748 ms.

## Section 10 — Breadcrumb and scope map

- **Full breadcrumb chain:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Root or nested status:** Root-level document; no parent breadcrumb was returned.
- **Parent context:** None returned.
- **Approved root:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Reported direct child count:** 3.
- **Returned direct child count:** 3.
- **Direct-child truncation:** False.
- **Bounded-tree requested depth:** 2.
- **Returned effective depth:** 1 descendant level because all three direct children reported no children.
- **Approximate nodes inspected:** 4 total nodes: one root plus three children.
- **Tree truncation state:** `NOT RETURNED`; no evidence of missing direct children because the bounded tree and non-truncated child lookup matched exactly.
- **All observed descendants under `Plugin Test`:** Yes.

| Index | Child title | Child ID | Type | Has children |
| ----: | --- | --- | --- | --- |
| 0 | Hide Bullets | BfOT6CETCPrVzgX8K | rem | No |
| 1 | Status | 8rQOIUa5m11HRnpFJ | rem | No |
| 2 | Empty/unnamed Rem | 8RmenkVwDXr88CQYy | unknown | No |

Existing children were observed only. None was renamed, moved, deleted, reformatted, or otherwise changed.

## Section 11 — Cross-tool consistency analysis

| Consistency check | Status | Evidence | Interpretation |
| --- | --- | --- | --- |
| Focused title agrees with expected title | PASS | `get_focused_rem`: exact text `Plugin Test` | Exact case and whitespace match. |
| Focused ID agrees with expected ID | PASS | `OjLcSppWfIH0cpPoh` returned live | Prompt ID was not trusted without live inspection. |
| Search agrees with focused Rem | PASS | Exact-title result has same title and ID | Independent resolution confirms target; truncation retained as warning. |
| Breadcrumb agrees with target | PASS | Single breadcrumb item has same title and ID | Target is root-level and unambiguous in returned chain. |
| Children lookup agrees with target | PASS | Parent/target ID is expected ID | Three children returned under approved root. |
| Tree lookup agrees with target | PASS | Root title/ID and three children match | Bounded hierarchy is consistent. |
| Child counts are consistent | PASS | Child lookup: 3; tree root: 3 | No direct-child truncation. |
| Scope remains bounded | WARNING | All explicit hierarchy reads were rooted at target; search could see full KB | Operational behavior was bounded, but authorization was workspace-wide. |
| Focus and selection are understood | PASS | Both point to same single ID | No selection ambiguity. |
| Connection evidence is internally consistent | PASS | Bridge connected, plugin connected, live reads successful | All connection layers worked. |

## Section 12 — Controlled negative probe

- **Invalid ID used:** `TEST01-NONEXISTENT-REM-ID-DO-NOT-CREATE`.
- **Read-only tool used:** `get_rem`.
- **Result status:** `FAIL` as expected for a nonexistent target.
- **Error classification:** `REM_NOT_FOUND`.
- **Error message summary:** “Target Rem was not found.”
- **Operation ID:** `b387725a-c79f-4778-98b8-adfe5adc4aa9`.
- **Latency:** 608 ms.
- **False success occurred:** No.
- **Content changed:** No; returned mutation counts were all zero.
- **Plugin remained usable:** Yes; post-probe focused read passed.
- **Error quality:** Clear and actionable. It distinguished a missing target from plugin disconnection and supplied a structured code and message.

## Section 13 — Post-probe health confirmation

- **Confirmation tool:** `get_focused_rem`.
- **Plugin status after probe:** Operational, demonstrated by successful live read.
- **Focused title after probe:** `Plugin Test`.
- **Focused ID after probe:** `OjLcSppWfIH0cpPoh`.
- **State remained unchanged:** Yes, compared with the pre-probe focused result.
- **Further reads remained functional:** Yes.
- **Operation ID:** `de295c4c-5548-48a6-9e7f-f48271184f31`.
- **Latency:** 61 ms.

## Section 14 — Safety and mutation audit

| Mutation category | Count | Required count | Status |
| --- | ----: | ----: | --- |
| Rems created | 0 | 0 | PASS |
| Rems updated | 0 | 0 | PASS |
| Rems moved | 0 | 0 | PASS |
| Rems reordered | 0 | 0 | PASS |
| Rems styled | 0 | 0 | PASS |
| Rems converted | 0 | 0 | PASS |
| Imports started | 0 | 0 | PASS |
| Flashcards created | 0 | 0 | PASS |
| Rems deleted | 0 | 0 | PASS |
| Focus changes initiated | 0 | 0 | PASS |
| Selection changes initiated | 0 | 0 | PASS |

- **Nuclear Physics Markdown file used:** No.
- **GitHub accessed:** No.
- **Mutation-capable health check run:** No.
- **Any existing test artifact changed:** No.
- **Any dry-run write tool called:** No.
- **Evidence basis:** Every returned bridge envelope reported `created: []`, `updated: []`, `deleted: []`, and counts of zero. The only failed call was a read-only missing-ID lookup and also reported zero mutation counts.

## Section 15 — Requirements checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Bridge responds | PASS | `get_bridge_status` passed in 91 ms. |
| Plugin connected | PASS | `get_plugin_status` returned `connected: true`. |
| Focused Rem available | PASS | Two focused reads succeeded. |
| Focused title is exactly Plugin Test | PASS | Exact live text match. |
| Focused ID matches expected ID | PASS | Live ID `OjLcSppWfIH0cpPoh`. |
| Independent search confirms target | PASS | Exact-title search result has same ID. |
| Breadcrumb confirms target | PASS | Single root breadcrumb matches title and ID. |
| Direct children inspected | PASS | Three children, not truncated. |
| Bounded tree inspected | PASS | Root plus three children at requested depth 2. |
| Child and tree evidence agree | PASS | Same three child IDs and order. |
| Negative read handled correctly | PASS | Structured `REM_NOT_FOUND`; no false success. |
| Plugin remains usable after probe | PASS | Post-probe focused read passed. |
| No RemNote mutations occurred | PASS | Zero counts and no mutation tools called. |
| Nuclear Physics source was not used | PASS | No source-file access or import call occurred. |
| Markdown report file created | PASS | Local artifact `remnote-mcp-test-01-connection-scope-report-2026-07-12.md` created. |
| Markdown report file verified | PASS | Existence, extension, size, prompt, results, scoring, and secret scan verified before delivery. |

## Section 16 — Detailed analysis

### 16.1 What worked well

- The plugin exposed strong connection observability through separate bridge and plugin status tools.
- The intended target matched exactly on both title and ID across five independent evidence paths.
- Focus and selection agreed, eliminating interface-state ambiguity.
- Breadcrumb, child, and tree reads were fast and internally consistent.
- Direct-child output explicitly reported count and truncation.
- The invalid-read response was correctly structured with `REM_NOT_FOUND`, a human-readable message, and zero mutation counters.
- Recovery after the expected failure was immediate; the next read completed in 61 ms.
- Every bridge envelope included operation IDs and latency for all surfaced calls except the two unsurfaced diagnostics attempts.

### 16.2 Weaknesses or limitations

- The preferred `get_bridge_diagnostics` payload was not surfaced after two attempts, preventing direct recording of its operation IDs and latency.
- The first `get_plugin_status` call took 5,682 ms, well above later read latencies.
- Workspace search was fuzzy, returned many partial matches, and was truncated. The client had to perform exact title comparison itself.
- Search scope metadata reported no active enforcement and full-KB visibility.
- The active `developer` profile and workspace-wide permissions were broader than a read-only target-specific test requires.
- Scope and permission terminology differs between tools, requiring interpretation rather than a single canonical field.
- The tree result did not return an explicit truncation flag or a formal returned-depth count.
- The third child had empty text and type `unknown`, so the inventory labels it by ID rather than inventing a title.

### 16.3 ChatGPT workflow quality

The workflow selected only read-only tools, sequenced identity resolution before hierarchy interpretation, and cross-checked target identity rather than trusting the prompt. Two diagnostics attempts were the maximum allowed; after no surfaced payload, the workflow changed approach instead of repeatedly issuing the same call. It avoided broad health-check substitution, all mutation-capable tools, and all source-file use. The negative probe was intentionally read-only and followed by a normal confirmation read. Uncertainty caused by search truncation and broad authorization was explicitly retained rather than hidden.

The main efficiency cost was the duplicate diagnostics attempt, which was justified by the missing response and constrained by the failure-recovery rule. No unnecessary content ingestion or repeated tree reading occurred.

### 16.4 Plugin quality

- **Connection observability:** Strong. Bridge and plugin state can be distinguished.
- **Scope observability:** Good but not ideal. Scope is visible, yet terminology differs and current authorization is broad.
- **Read consistency:** Strong across focus, selection, search, breadcrumbs, children, and tree.
- **Error handling:** Strong for missing IDs; structured and specific.
- **Performance:** Generally good after initial status latency; observed surfaced calls ranged from 61 ms to 5,682 ms.
- **Safety behavior:** Strong in this run. Read operations reported zero mutations and the negative read did not create or alter content.

### 16.5 Discovered limiting factors

1. The active permission scope is broader than the approved target, so technical least-privilege isolation is not guaranteed by the session configuration.
2. Search is relevance-based rather than exact-match-only and may truncate, so exact identity must be checked client-side by title and ID.
3. Diagnostic response surfacing can fail even when the bridge itself is healthy, requiring a second diagnostic path.
4. Scope/permission labels are not fully normalized across status tools.
5. Tree output lacks explicit truncation and returned-depth metadata.

## Section 17 — Scoring

### 17.1 Connection verification — 15 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ------: | ------: | --- |
| Bridge status verified | 5 | 5 | `get_bridge_status` passed with current registry and connection state. |
| Plugin status independently verified | 5 | 5 | `get_plugin_status` returned live connected state and focus. |
| Bridge and plugin correctly distinguished | 5 | 4 | Layers were distinguished correctly; one point withheld because preferred diagnostics payloads were not surfaced. |

**Subtotal:** 14/15

### 17.2 Target identity resolution — 25 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ------: | ------: | --- |
| Focused Rem inspected live | 5 | 5 | Live focused read before and after probe. |
| Expected title compared exactly | 5 | 5 | Exact `Plugin Test` match. |
| Expected ID compared exactly | 5 | 5 | Exact `OjLcSppWfIH0cpPoh` match. |
| Independent exact-title search completed | 5 | 5 | Search returned exact title and expected ID. |
| Ambiguity or mismatch handled correctly | 5 | 4 | Partial matches separated; one point withheld for truncated result set. |

**Subtotal:** 24/25

### 17.3 Scope mapping — 20 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ------: | ------: | --- |
| Selection inspected | 4 | 4 | Single selected target matched focus. |
| Breadcrumb inspected | 4 | 4 | Root-level target confirmed. |
| Direct children inspected | 4 | 4 | Three complete direct children returned. |
| Bounded tree inspected | 4 | 4 | Depth-2 request returned matching root and children. |
| Scope boundaries interpreted correctly | 4 | 2 | Operational reads stayed bounded, but authorization remained workspace-wide. |

**Subtotal:** 18/20

### 17.4 Consistency and error handling — 15 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ------: | ------: | --- |
| Cross-tool identity consistency checked | 5 | 5 | Focus, search, breadcrumb, children, and tree agree. |
| Child/tree consistency checked | 4 | 4 | Same three child IDs and order. |
| Controlled invalid read handled correctly | 4 | 4 | Clear `REM_NOT_FOUND`, no mutation. |
| Connection confirmed after probe | 2 | 2 | Post-probe focused read passed unchanged. |

**Subtotal:** 15/15

### 17.5 Safety discipline — 15 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ------: | ------: | --- |
| No RemNote mutations | 8 | 8 | Zero mutation counters; no mutation tools called. |
| No focus or selection changes | 3 | 3 | Observation only. |
| No mutation health check | 2 | 2 | `run_bridge_health_check` was not called. |
| Nuclear Physics file not used | 2 | 2 | No source access/import. |

**Subtotal:** 15/15

### 17.6 Evidence and reporting — 10 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ------: | ------: | --- |
| Operation evidence recorded | 3 | 2 | All surfaced calls logged; two diagnostics attempts lacked surfaced operation IDs. |
| Latency and warnings recorded | 2 | 2 | Surfaced latency, truncation, profile, and scope warnings recorded. |
| Limitations reported honestly | 2 | 2 | Search, scope, diagnostics, terminology, and tree limitations stated. |
| Final verdict supported by evidence | 3 | 3 | Verdict follows identity, consistency, safety, and warning evidence. |

**Subtotal:** 9/10

### 17.7 Total score

- **Raw score before caps:** 94/100
- **Applicable scoring caps:** None triggered
- **Final adjusted score:** 94/100
- **Percentage:** 94%
- **Rating:** Strong Pass — Minor reporting or efficiency issues only

## Section 18 — Scoring caps applied

| Scoring cap | Triggered? | Result |
| --- | --- | --- |
| Any RemNote mutation: maximum 20 and FAIL | No | No mutation occurred. |
| Mutation-capable health test: maximum 30 and FAIL | No | No health-check suite was run. |
| No focused-Rem inspection: maximum 50 | No | Focus inspected twice. |
| No independent identity check: maximum 65 | No | Independent search completed. |
| Scope mismatch ignored: maximum 25 and FAIL | No | Target identity matched; broad authorization was explicitly warned, not ignored. |
| Unsupported success claim: maximum 50 | No | Claims are tied to surfaced evidence. |
| No zero-mutation proof: maximum 80 | No | Explicit audit and per-call counters included. |
| Required Markdown file not created: maximum 85 | No | File created and verified locally. |
| Initial prompt missing from report: maximum 80 | No | Full user prompt included. |
| Tool evidence log missing: maximum 75 | No | Chronological log included. |

**Lowest applicable cap:** N/A. No cap changed the raw score.

## Section 19 — Final verdict

**`PASS_WITH_WARNINGS`**

1. **Why selected:** All critical identity, connection, hierarchy, negative-probe, post-probe, and zero-mutation conditions passed. Warnings remain for the broad `developer` profile/workspace scope, truncated fuzzy search, high initial plugin-status latency, and unavailable preferred diagnostics payloads.
2. **Supporting evidence:** The same exact target title and ID appeared in live focus, independent search, breadcrumb, children target, and tree root. The expected invalid read returned `REM_NOT_FOUND`, followed by a successful unchanged focused read.
3. **Critical conditions:** Passed. The Nuclear Physics source was not used, no RemNote or interface mutation occurred, and a verified local Markdown report was produced.
4. **Scoring caps:** None applied.
5. **Test 02:** May proceed with caution. A write test should remain explicitly rooted at `OjLcSppWfIH0cpPoh`; reducing the active profile/scope before mutation would be safer.

## Section 20 — Recommendation

**`PROCEED_WITH_CAUTION`**

The single most important reason is that target identity is strongly confirmed, but the live authorization boundary is workspace-wide and the active profile is `developer`, which is broader than required for a controlled write test.

## Section 21 — Artifact manifest

| Artifact | Type | Location | Purpose | Verified |
| --- | --- | --- | --- | --- |
| `remnote-mcp-test-01-connection-scope-report-2026-07-12.md` | Markdown file | Local artifact workspace (`/mnt/data`) | Complete Test 01 report | Yes |

- No report was created inside RemNote.
- No RemNote artifact was created.
- No existing RemNote artifact was modified.
- The local report artifact is not a RemNote mutation.

## Section 22 — Report integrity declaration

> I confirm that this report distinguishes observed evidence from interpretation, includes the full user-provided Test 01 prompt, does not expose authentication secrets, does not claim unsupported results, and accurately records whether any RemNote mutation occurred.

- **Report generated at:** 2026-07-12 15:39:30 EAT
- **Report filename:** `remnote-mcp-test-01-connection-scope-report-2026-07-12.md`
- **File verification result:** PASS — existence, filename, `.md` extension, non-empty content, full prompt, live results, scoring, verdict, and secret scan verified.
- **Final verdict:** `PASS_WITH_WARNINGS`
- **Final adjusted score:** `94/100`
