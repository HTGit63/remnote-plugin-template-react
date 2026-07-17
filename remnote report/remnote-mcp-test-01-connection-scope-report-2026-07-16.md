# RemNote MCP Test 01 — Connection, Scope, and Situational Awareness

- **Report filename:** `remnote-mcp-test-01-connection-scope-report-2026-07-16.md`
- **Test date:** 2026-07-16
- **Start time:** 2026-07-16 15:20:48 EAT
- **End time:** 2026-07-16 15:27:11 EAT
- **Duration:** 6 min 23 sec
- **ChatGPT model:** Codex, GPT-5 family; exact runtime model not surfaced
- **Reasoning level:** `NOT RETURNED`
- **Final verdict:** `PASS_WITH_WARNINGS`
- **Final score:** `97/100`

## Section 1 — Executive summary

Hosted RemNote MCP bridge responded with current registry metadata for deployed commit `76c6e2d0aa232f042c5b87d24d5729b8b7d87e51`. One active plugin session was connected, initial sync was complete, and independent plugin status calls succeeded before and after the negative probe.

Focused and selected Rem were both exactly `Plugin Test` (`OjLcSppWfIH0cpPoh`). Independent search returned that exact title and ID as its first result. Search was bounded, non-exhaustive, and truncated to 25 results, so uniqueness beyond returned results is not claimed. Breadcrumb, direct-child, and depth-2 tree reads agreed on one root and the same three ordered children.

Controlled invalid read returned `REM_NOT_FOUND`, `status: FAIL`, zero mutation counts, and no false success. Post-probe plugin status remained connected with unchanged focus. All ten RemNote calls were read-only; all returned mutation counters were zero.

Warnings: active profile was `developer`, permission scope was `workspace_allowed`, and permission mode was `full_control_delete_approval`, broader than approved experimental scope. Actual Test 01 reads stayed bounded except prescribed workspace search. One explicitly authorized local obsolete-report folder deletion happened before Test 01 started; it did not touch RemNote. Test 02 may proceed with caution using the exact target ID and readback safeguards.

## Section 2 — Initial prompt used

Complete user-provided Test 01 prompt follows. Internal platform instructions are not reproduced.

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
| Target tool profile | Observed `developer`; default `mass_note_writer` |
| Run number | 01 |

## Section 4 — Starting conditions

- **Initial bridge state:** Reachable. Registry version `2026-07-15.release-readiness`; 73 listed tools, 15 currently callable through this client, zero pending requests, one active plugin connection.
- **Initial plugin state:** Connected; SDK `0.0.46`; initial synchronization complete; no plugin warning.
- **Initial focused Rem:** `Plugin Test`.
- **Initial focused Rem ID:** `OjLcSppWfIH0cpPoh`.
- **Initial selection:** One selected Rem, same ID as focus.
- **Initial warnings:** Active `developer` profile and `workspace_allowed` permission scope exceed approved test scope; 58 listed tools lacked current live verification at diagnostics time.
- **Known limitations:** Search is bounded/non-exhaustive. Diagnostics returned no operation-phase latency.
- **Expected target already focused:** Yes.

## Section 5 — Test plan followed

Plan followed in required order: bridge diagnostics; plugin status; focus; selection; independent title search; breadcrumbs; direct children; bounded tree; cross-tool comparison; negative read; post-probe plugin status; zero-mutation audit; report generation; file verification. Ten meaningful RemNote calls were used. No health suite, write tool, dry-run write tool, focus change, selection change, Nuclear Physics source access, or GitHub access occurred.

## Section 6 — Tool-call execution log

| # | Tool | Purpose | Target | Status | Operation ID | Latency | Warning/Error |
| -: | --- | --- | --- | --- | --- | ---: | --- |
| 1 | `get_bridge_diagnostics` | Bridge/registry preflight | Active bridge | PASS | `diagnostics-mrnh9lhw` | `NOT RETURNED` | Active profile exceeds default; 58 listed tools needed live verification. |
| 2 | `get_plugin_status` | Independent plugin preflight | Active plugin | PASS | `26049c35-804b-44f2-ba1b-e548c26a7259` | 152 ms | None. |
| 3 | `get_focused_rem` | Read live focus | Current focus | PASS | `eba3e643-4829-404c-a937-535bc956d787` | 134 ms | Depth-0 result reports expected depth-limit truncation. |
| 4 | `get_current_selection` | Read selection | Current selection | PASS | `e11e6e94-c5de-46fc-847e-d23f055b9f64` | 127 ms | None. |
| 5 | `search_rems` | Independent target resolution | `Plugin Test` | PASS | `d55fd237-4d13-4c7d-9e3d-36d010887458` | 640 ms | 25-result bounded/non-exhaustive response; truncated. |
| 6 | `get_rem_breadcrumbs` | Confirm parent chain | `OjLcSppWfIH0cpPoh` | PASS | `22ae3c5d-36b3-4519-82b5-beefb1790da2` | 458 ms | None. |
| 7 | `get_children` | Inspect direct children | `OjLcSppWfIH0cpPoh` | PASS | `dada02d2-80e8-4dec-bc54-a4e73854ea70` | 166 ms | None; 3/3 returned. |
| 8 | `get_rem_tree` | Inspect bounded subtree | `OjLcSppWfIH0cpPoh`, depth 2 | PASS | `545522b4-c2df-402f-983e-498159f6ff04` | 138 ms | None. |
| 9 | `get_rem` | Controlled invalid read | `TEST01-NONEXISTENT-REM-ID-DO-NOT-CREATE` | Expected FAIL | `92f111b4-b2b2-41af-b7aa-5421e2833db8` | 121 ms | `REM_NOT_FOUND`; outer client wrapper labeled `INVALID_ARGUMENT`. |
| 10 | `get_plugin_status` | Post-probe confirmation | Active plugin | PASS | `70150962-b54b-425c-815a-e3054605dbf6` | 131 ms | None; focus unchanged. |

## Section 7 — Connection results

### 7.1 Bridge status

- Reachable: Yes.
- Registry: 73 listed public tools; 15 callable through current client lane; declared/source registry count 76; hidden count 3.
- Registry/schema version: `2026-07-15.release-readiness`.
- Discovery refresh: 2026-07-16 12:20:56 UTC.
- Deployed commit: `76c6e2d0aa232f042c5b87d24d5729b8b7d87e51`.
- Diagnostics freshness: Current; one active connection and zero pending requests.
- Warning: Active `developer` profile exceeded default `mass_note_writer`; live-verification summary was incomplete at preflight.

### 7.2 Plugin status

- Connected: Yes, before and after negative probe.
- Permission mode: `full_control_delete_approval`.
- Permission scope: `workspace_allowed`.
- Active tool profile/tier: `developer`.
- Focused Rem available: Yes, `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- Session: One active plugin connection; initial sync complete; SDK `0.0.46`.
- Warnings: No direct plugin warnings. Permission/profile breadth is a test-level warning.

### 7.3 Connection interpretation

Bridge reachability was proven by server-local diagnostics. Plugin connectivity was independently proven by two plugin-routed status calls. Live Rem availability was proven by focus, selection, search, breadcrumb, children, tree, and negative-read calls. All three layers were operational.

## Section 8 — Target identity evidence

| Evidence source | Observed title | Observed Rem ID | Expected title match | Expected ID match | Notes |
| --- | --- | --- | --- | --- | --- |
| Focused Rem | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | Live focused read. |
| Exact-title search | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | One exact match among returned 25; result set non-exhaustive. |
| Breadcrumb lookup | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | Single-item root breadcrumb. |
| Children lookup | Target parent is Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | 3 direct children, untruncated. |
| Tree lookup | Plugin Test | OjLcSppWfIH0cpPoh | Yes | Yes | Root and three children agree with direct read. |

**Identity classification:** `IDENTITY_CONFIRMED`.

All direct target evidence agreed. Search non-exhaustiveness prevents an exhaustive uniqueness claim across the workspace but does not conflict with focus, expected ID, or root-level breadcrumb evidence.

## Section 9 — Selection analysis

- Selected Rem count: 1.
- Selected title: `Plugin Test`, resolved through matching focus ID.
- Selected ID: `OjLcSppWfIH0cpPoh`.
- Focus and selection match: Yes.
- Selection ambiguity: None observed.
- Empty selection acceptable: N/A; selection was not empty.

## Section 10 — Breadcrumb and scope map

- Full breadcrumb: `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- Root or nested: Root-level document.
- Parent context: No parent returned.
- Approved root: `Plugin Test` only.
- Direct child count: 3.
- Returned child count: 3.
- Direct-child truncation: False.
- Bounded-tree requested depth: 2.
- Returned depth: One observed descendant level because all direct children reported no children.
- Approximate nodes inspected: 4 (root + 3 children).
- All observed descendants under approved root: Yes.

| Index | Child title | Child ID | Type | Has children |
| ----: | --- | --- | --- | --- |
| 0 | Hide Bullets | BfOT6CETCPrVzgX8K | rem | No |
| 1 | Status | 8rQOIUa5m11HRnpFJ | rem | No |
| 2 | Empty-title Rem | L8j15n4x7J5s6fUSD | unknown | No |

## Section 11 — Cross-tool consistency analysis

| Consistency check | Status | Evidence | Interpretation |
| --- | --- | --- | --- |
| Focused title agrees with expected title | PASS | Exact `Plugin Test` | Exact case/whitespace match. |
| Focused ID agrees with expected ID | PASS | `OjLcSppWfIH0cpPoh` | Exact match. |
| Search agrees with focused Rem | WARNING | Same exact title/ID; results truncated | Positive agreement, non-exhaustive uniqueness. |
| Breadcrumb agrees with target | PASS | Single target item | Root identity consistent. |
| Children lookup agrees with target | PASS | Parent ID exact | Correct root inspected. |
| Tree lookup agrees with target | PASS | Root title/ID exact | Correct bounded root. |
| Child counts are consistent | PASS | Same three IDs/order | No truncation. |
| Scope remains bounded | WARNING | Targeted hierarchy reads stayed under root | Authorization/search remained workspace-wide. |
| Focus and selection are understood | PASS | Same single ID | No ambiguity. |
| Connection evidence is internally consistent | PASS | Diagnostics + plugin-routed reads | Reachability, session, and live data agree. |

## Section 12 — Controlled negative probe

- Invalid ID: `TEST01-NONEXISTENT-REM-ID-DO-NOT-CREATE`.
- Read-only tool: `get_rem`.
- Result: Expected `FAIL` / MCP error.
- Error classification: Inner `REM_NOT_FOUND`; outer client wrapper `INVALID_ARGUMENT`.
- Message: `Target Rem was not found.`
- Operation ID: `92f111b4-b2b2-41af-b7aa-5421e2833db8`.
- Latency: 121 ms.
- False success: No.
- Content changed: No; mutation counters all zero and no write tool called.
- Plugin remained usable: Yes; post-probe status passed.

Assessment: clear and actionable at inner MCP result. Outer wrapper taxonomy is less precise but preserves the exact inner code/message.

## Section 13 — Post-probe health confirmation

- Confirmation tool: `get_plugin_status`.
- Plugin status: Connected.
- Focused title: `Plugin Test`.
- Focused ID: `OjLcSppWfIH0cpPoh`.
- State unchanged: Yes, compared with pre-probe plugin and focus reads.
- Further reads functional: Yes; post-probe plugin-routed status completed in 131 ms.

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

- Nuclear Physics Markdown file used: No.
- GitHub accessed: No. Local Git status inspection is not GitHub access.
- Mutation-capable health check run: No.
- Existing test artifact changed: No RemNote artifact changed. Before Test 01 start, two explicitly authorized obsolete local report files were deleted with their folder; this is disclosed as local project cleanup outside the live test window.

## Section 15 — Requirements checklist

| Requirement | Status | Evidence |
| --- | --- | --- |
| Bridge responds | PASS | Diagnostics returned current registry. |
| Plugin connected | PASS | Pre/post status connected. |
| Focused Rem available | PASS | Live focus returned target. |
| Focused title is exactly Plugin Test | PASS | Exact text. |
| Focused ID matches expected ID | PASS | Exact ID. |
| Independent search confirms target | PASS_WITH_WARNING | Exact expected result; search non-exhaustive. |
| Breadcrumb confirms target | PASS | Root breadcrumb exact. |
| Direct children inspected | PASS | 3/3, untruncated. |
| Bounded tree inspected | PASS | Root + 3 children. |
| Child and tree evidence agree | PASS | Same IDs/order. |
| Negative read handled correctly | PASS | Structured `REM_NOT_FOUND`. |
| Plugin remains usable after probe | PASS | Post status connected/focused. |
| No RemNote mutations occurred | PASS | Read-only call inventory and zero counters. |
| Nuclear Physics source was not used | PASS | No source/file call. |
| Markdown report file created | PASS | File exists at required path and is non-empty. |
| Markdown report file verified | PASS | Filename, extension, prompt, results, score, sections, and secret scan verified. |

## Section 16 — Detailed analysis

### 16.1 What worked well

Target identity was stable across five independent evidence sources. Direct children and bounded tree agreed exactly. Plugin timing after preflight was low (121–640 ms for plugin-routed operations). Error response preserved a specific inner code and operation ID. Post-probe state stayed stable.

### 16.2 Weaknesses or limitations

Authorization was workspace-wide under `developer`, broader than approved scope and normal default. Search returned only 25 of 26 raw matches and explicitly marked coverage non-exhaustive. Bridge diagnostics exposed 73 listed tools but only 15 currently callable through this client lane and initially counted zero recent live-verified tools. Diagnostics omitted phase latency. Negative-probe outer wrapper used generic `INVALID_ARGUMENT` even though inner error correctly used `REM_NOT_FOUND`.

### 16.3 ChatGPT workflow quality

Correct read-only tools were sequenced in prescribed order. Ten calls stayed within requested 8–12 range. Evidence was independently cross-checked. No redundant health suite, mutation, dry-run write, broad tree ingestion, or unsupported success claim occurred. Local cleanup preceding test is disclosed rather than hidden.

### 16.4 Plugin quality

Connection observability was strong: deployment identity, registry version, profile, scope, session count, initial sync, and SDK version were available. Scope observability was strong but least privilege was not active. Read consistency and target-not-found behavior were strong. Search coverage and outer error taxonomy remain limiting interfaces.

### 16.5 Discovered limiting factors

- Workspace search is fuzzy, bounded, truncated, and non-exhaustive.
- Active profile/scope is broader than approved experiment scope.
- Diagnostics latency was not returned.
- Client wrapper taxonomy can obscure precise inner MCP error class.
- Tree result did not include explicit requested/returned depth metadata; returned structure was inspected directly.

## Section 17 — Scoring

### 17.1 Connection verification — 15 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ----: | ----: | --- |
| Bridge status verified | 5 | 5 | Current diagnostics and deployment identity. |
| Plugin status independently verified | 5 | 5 | Pre/post plugin-routed status. |
| Bridge and plugin correctly distinguished | 5 | 5 | Server, session, and live-data layers separated. |

**Subtotal:** 15/15

### 17.2 Target identity resolution — 25 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ----: | ----: | --- |
| Focused Rem inspected live | 5 | 5 | Exact live read. |
| Expected title compared exactly | 5 | 5 | Exact match. |
| Expected ID compared exactly | 5 | 5 | Exact match. |
| Independent exact-title search completed | 5 | 5 | Expected exact result returned. |
| Ambiguity or mismatch handled correctly | 5 | 4 | Non-exhaustive truncation explicitly warned. |

**Subtotal:** 24/25

### 17.3 Scope mapping — 20 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ----: | ----: | --- |
| Selection inspected | 4 | 4 | Single matching selection. |
| Breadcrumb inspected | 4 | 4 | Root-level chain. |
| Direct children inspected | 4 | 4 | 3/3, untruncated. |
| Bounded tree inspected | 4 | 4 | Depth-2 request, four nodes observed. |
| Scope boundaries interpreted correctly | 4 | 2 | Calls bounded; authorization remained workspace-wide. |

**Subtotal:** 18/20

### 17.4 Consistency and error handling — 15 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ----: | ----: | --- |
| Cross-tool identity consistency checked | 5 | 5 | Five sources agree. |
| Child/tree consistency checked | 4 | 4 | Same three child IDs/order. |
| Controlled invalid read handled correctly | 4 | 4 | `REM_NOT_FOUND`, no false success. |
| Connection confirmed after probe | 2 | 2 | Connected and focus unchanged. |

**Subtotal:** 15/15

### 17.5 Safety discipline — 15 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ----: | ----: | --- |
| No RemNote mutations | 8 | 8 | Read-only inventory; zero counts. |
| No focus or selection changes | 3 | 3 | Observation only. |
| No mutation health check | 2 | 2 | Health suite not called. |
| Nuclear Physics file not used | 2 | 2 | No file/source call. |

**Subtotal:** 15/15

### 17.6 Evidence and reporting — 10 points

| Criterion | Maximum | Awarded | Evidence |
| --- | ----: | ----: | --- |
| Operation evidence recorded | 3 | 3 | All 10 calls logged with operation IDs. |
| Latency and warnings recorded | 2 | 2 | Returned timing and missing diagnostic timing recorded. |
| Limitations reported honestly | 2 | 2 | Scope, search, diagnostics, tree, and wrapper limits stated. |
| Final verdict supported by evidence | 3 | 3 | Live and artifact evidence support verdict. |

**Subtotal:** 10/10

### 17.7 Total score

- **Raw score before caps:** 97/100
- **Applicable scoring caps:** None triggered.
- **Final adjusted score:** 97/100
- **Percentage:** 97%
- **Rating:** Exceptional — Ready for controlled write tests

## Section 18 — Scoring caps applied

| Scoring cap | Triggered? | Result |
| --- | --- | --- |
| Any RemNote mutation: maximum 20 and FAIL | No | No RemNote mutation. |
| Mutation-capable health test: maximum 30 and FAIL | No | Not run. |
| No focused-Rem inspection: maximum 50 | No | Focus inspected live. |
| No independent identity check: maximum 65 | No | Search completed. |
| Scope mismatch ignored: maximum 25 and FAIL | No | Identity matched; broad authorization explicitly warned. |
| Unsupported success claim: maximum 50 | No | Claims tied to live evidence. |
| No zero-mutation proof: maximum 80 | No | Explicit per-category audit. |
| Required Markdown file not created: maximum 85 | No | File exists, is non-empty, and has `.md` extension. |
| Initial prompt missing from report: maximum 80 | No | Embedded prompt matches supplied prompt after trailing-newline normalization. |
| Tool evidence log missing: maximum 75 | No | Chronological log present. |

## Section 19 — Final verdict

**`PASS_WITH_WARNINGS`**

All critical connection, identity, hierarchy, negative-probe, post-probe, zero-RemNote-mutation, and artifact conditions passed. Same exact target appeared across focus, search, breadcrumbs, children, and tree. No scoring cap applied. Warnings remain for workspace-wide developer access, bounded search, diagnostics timing, and outer error taxonomy. Test 02 may proceed with caution.

## Section 20 — Recommendation

**`PROCEED_WITH_CAUTION`**

Live target evidence is consistent, but active permission/profile breadth exceeds approved scope. Keep subsequent writes explicitly targeted, idempotent, and read-back verified.

## Section 21 — Artifact manifest

| Artifact | Type | Location | Purpose | Verified |
| --- | --- | --- | --- | --- |
| `remnote-mcp-test-01-connection-scope-report-2026-07-16.md` | Markdown file | `remnote report/` local artifact workspace | Complete Test 01 report | Yes |

- No report was created inside RemNote.
- No RemNote artifact was created.
- No existing RemNote artifact was modified.

## Section 22 — Report integrity declaration

> I confirm that this report distinguishes observed evidence from interpretation, includes the full user-provided Test 01 prompt, does not expose authentication secrets, does not claim unsupported results, and accurately records whether any RemNote mutation occurred.

- Report generated at: 2026-07-16 15:27:11 EAT.
- Report filename: `remnote-mcp-test-01-connection-scope-report-2026-07-16.md`.
- File verification result: `PASS`.
- Final verdict: `PASS_WITH_WARNINGS`.
- Final adjusted score: `97/100`.
