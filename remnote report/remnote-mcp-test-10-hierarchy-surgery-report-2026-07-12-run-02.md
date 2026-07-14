# RemNote MCP Test 10 — Hierarchy Surgery and Structural Safety

- **Report filename:** `remnote-mcp-test-10-hierarchy-surgery-report-2026-07-12-run-02.md`
- **Date:** 2026-07-12
- **Start time:** 2026-07-12 20:20:02.596 EAT
- **End time:** 2026-07-12 20:30:06.469 EAT
- **Duration:** 00:10:03.873
- **Run number:** 01
- **ChatGPT model:** GPT-5.6 Thinking
- **Reasoning level:** Thinking
- **Plugin branch:** `fix/remnote-mcp-mass-note-creation-stability`
- **Plugin commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`
- **Tool profile:** `developer`
- **Approved-root title and ID:** `Plugin Test` — `OjLcSppWfIH0cpPoh`
- **Test-root title and ID:** `RemNote MCP Test 10 — Hierarchy Surgery — 2026-07-12 — Run 01` — `gfQ1PY6dGLMPTIARw`
- **Lesson-root title and ID:** `Hierarchy Surgery Fixture — Nuclear Reactions` — `30bCQVzsgX0jm5OfY`
- **Final verdict:** `PASS_WITH_WARNINGS`
- **ChatGPT Agent Score:** 98/100
- **Plugin Capability Score:** 98/100
- **Final Artifact Score:** 100/100
- **Weighted overall score:** 98.50/100
- **Rem Identity Preservation Rate:** 100.00%
- **Plain-Text Preservation Rate:** 100.00%
- **Parent-Edge Accuracy Rate:** 100.00%
- **Affected-Parent Order Accuracy Rate:** 100.00%
- **Unsafe-Probe Safety Rate:** 100.00%
- **Duplicate-Free Rate:** 100.00%

## Section 1 — Executive summary

The approved RemNote scope was live-confirmed through the bridge, plugin status, focused Rem, current selection, exact Rem ID, and breadcrumb evidence. The observed approved-root ID exactly matched the expected ID `OjLcSppWfIH0cpPoh`. Exactly one new Test 10 root and exactly one damaged lesson were created beneath it.

The baseline contained the required 27 lesson-tree Rems and all five intentional structural defects: wrong principal-section order, one misplaced mass-number leaf, one misplaced Final Answer subtree, wrong Q-Value child order, and wrong Summary child order. The baseline contained no intended text defects.

All four unsafe-input probes were handled safely:

1. Incomplete child-order list — rejected with the omitted Summary ID identified.
2. Incorrect expected parent — rejected with the live actual parent returned.
3. Cycle attempt — rejected as a move into a descendant.
4. Out-of-range insertion index — rejected with the valid maximum index returned.

Every probe was followed by relevant parent or hierarchy readback. The post-probe full-tree read showed zero mutation.

The valid surgery used two guarded `move_rem` calls and three complete-list `reorder_children` calls. No Rem was deleted, recreated, duplicated, or text-edited. The Final Answer child moved with its subtree root and retained its original ID. The final full-tree read exactly matched the required hierarchy.

Final preservation results:

- 27/27 original IDs present exactly once.
- 27/27 exact plain-text values preserved.
- 26/26 non-root parent edges correct.
- 7/7 required parent order/readback checks correct; all 5 directly mutated parent lists exact.
- 3/3 formulas exact in plain and rich readback.
- 0 missing Rems, duplicates, orphans, detached descendants, cards, blank wrappers, raw math delimiters, or metadata pollution.
- 0 repairs required.
- 0 scope violations.
- Test 11 may proceed.

Warnings were limited to: one pre-mutation local payload-schema correction, misleading `plugin_permission` attribution in otherwise accurate structural validation errors, and a symbol-heavy exact-text search limitation that was superseded by direct rich-text and full-tree evidence.

## Section 2 — Complete initial prompt

> Internal platform instructions are not reproduced. The complete user-provided Test 10 prompt is included below.

`````text
# RemNote MCP Laboratory Test 10

## Hierarchy Surgery and Structural Safety

You are the primary experimental tester of a remote RemNote MCP plugin.

This is **Test 10 only**. Do not begin, simulate, or partially perform Test 11 or any later benchmark test.

Your mission is to create one deliberately damaged academic hierarchy and repair it through controlled move and reorder operations.

You must independently:

1. Confirm the approved RemNote scope.
2. Create one disposable Test 10 root.
3. Create one controlled damaged lesson.
4. Capture the complete baseline hierarchy, text, IDs, parents, positions, and child counts.
5. Define the exact desired hierarchy.
6. Conduct four non-destructive unsafe-input probes.
7. Verify that every unsafe probe caused zero mutation.
8. Prepare and preview a valid surgery plan.
9. Move misplaced existing Rems without recreating them.
10. Reorder existing children without losing or duplicating them.
11. Read back every affected parent.
12. Prove that every original Rem still exists exactly once.
13. Prove that no plain text changed.
14. Repair confirmed defects only.
15. Create one complete local Markdown laboratory report.

This experiment tests structural surgery—not content recreation.

---

# 1. Test identity

* **Test number:** 10
* **Test name:** Hierarchy Surgery and Structural Safety
* **Benchmark module:** Module III — Editing, Organization, and Repair
* **Difficulty:** Advanced
* **Run type:** Main Run
* **Execution mode:** Workflow-constrained with unsafe-input perturbations
* **Approved RemNote root title:** `Plugin Test`
* **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`
* **Disposable test root:** Create one new child beneath `Plugin Test`
* **Damaged lesson title:** `Hierarchy Surgery Fixture — Nuclear Reactions`
* **Allowed operations:** Read, create baseline, preview, move, reorder, verify, and targeted repair within the new Test 10 root
* **Deletion permission:** None
* **Plain-text editing permission:** None after the baseline is verified
* **Rich-text editing permission:** None after the baseline is verified
* **Card creation permission:** None
* **External academic sources:** Forbidden
* **GitHub:** Forbidden
* **Web browsing:** Forbidden
* **Required deliverable:** One complete local Markdown report file

---

# 2. Central experimental question

> Can ChatGPT safely repair parent-child relationships and sibling order in an existing RemNote hierarchy while preserving every original Rem ID, text value, descendant, formula, and unrelated property?

This test is not passed merely because:

* The final visible hierarchy resembles the desired hierarchy.
* A move or reorder tool returns `SUCCESS`.
* The lesson is rebuilt in the correct order.
* Existing Rems are replaced by newly created equivalents.
* Children disappear and are recreated.
* The final text is correct but IDs changed.
* Unsafe requests fail only because of malformed tool syntax.
* ChatGPT claims zero mutation without reading the hierarchy afterward.

The actual before-and-after RemNote state must prove safe surgery.

---

# 3. Primary objectives

The test must determine whether ChatGPT and the plugin can:

1. Read complete parent-child relationships before mutation.
2. Identify multiple structural defects.
3. Distinguish moving from recreating.
4. Distinguish reordering from replacing a children list.
5. Preview structural changes.
6. Reject an incomplete child-order list safely.
7. Reject a move with an incorrect expected parent.
8. Reject a cycle attempt.
9. Reject an out-of-range insertion index.
10. Move one existing leaf Rem to its correct parent.
11. Move one existing subtree to its correct parent.
12. Reorder the lesson’s principal sections.
13. Reorder children beneath affected sections.
14. Preserve every Rem ID.
15. Preserve every plain-text value.
16. Preserve every descendant.
17. Preserve formulas and special symbols.
18. Prevent duplicate or missing children.
19. Read back every affected parent.
20. Attribute failures to the correct layer.

---

# 4. Approved RemNote scope

All RemNote mutations must occur beneath the live-confirmed Rem titled exactly:

`Plugin Test`

Expected Rem ID:

`OjLcSppWfIH0cpPoh`

Before creating anything, establish through live RemNote evidence:

1. Bridge availability
2. Plugin connection
3. Current focused Rem
4. Current selection where relevant
5. Exact-title resolution of `Plugin Test`
6. Live approved-root ID
7. Breadcrumb or parent context
8. Whether the observed ID matches the expected ID
9. Whether creating one disposable child beneath it is safe

Do not change focus or selection merely to conduct the test.

The focused Rem does not have to be `Plugin Test` when the approved root can be safely addressed through verified identity evidence.

---

# 5. Scope mismatch and stopping conditions

Stop all mutations and report `BLOCKED_SCOPE_MISMATCH` when:

* `Plugin Test` cannot be found.
* Multiple exact-title matches remain unresolved.
* The observed ID conflicts with the expected ID and the conflict cannot be resolved safely.
* The intended parent lies outside the approved scope.
* You cannot prove that the Test 10 root is beneath `Plugin Test`.

Stop and report `BLOCKED_CONNECTION` when:

* The plugin is disconnected before mutation.
* A structural operation has an uncertain outcome and readback cannot determine what happened.
* Two reasonable recovery attempts fail for the same connection problem.

Stop and report `BLOCKED_BASELINE_INCOMPLETE` when:

* The damaged lesson cannot be created completely.
* The complete hierarchy cannot be read.
* Original IDs, parents, or sibling positions cannot be recorded.
* The desired structure cannot be mapped unambiguously to live Rem IDs.

Stop and report `UNSUPPORTED_SAFE_SURGERY` when:

* The plugin offers no safe move or reorder mechanism.
* The only available method would delete and recreate Rems.
* The only available method would replace all children without preserving identities.
* Unsafe-input probes cannot be performed non-destructively and no equivalent validation capability exists.

A safe unsupported result is preferable to destructive success.

---

# 6. Disposable Test 10 root

Create exactly one disposable root beneath `Plugin Test`.

Use:

`RemNote MCP Test 10 — Hierarchy Surgery — YYYY-MM-DD — Run NN`

Replace:

* `YYYY-MM-DD` with the actual date
* `NN` with a two-digit run number

Begin with `Run 01`.

Before creating the root:

1. Search beneath `Plugin Test` for an exact-title collision.
2. Do not reuse an earlier Test 10 root.
3. Do not edit an earlier Test 10 root.
4. Do not delete an earlier Test 10 root.
5. Select the first unused run number.

Record:

* Test-root title
* Test-root Rem ID
* Parent Rem ID
* Creation operation ID
* Idempotency key where supported
* Approved-root child count before creation
* Approved-root child count after creation
* Breadcrumb proving correct placement
* Duplicate-root search result

Create no more than one Test 10 root.

---

# 7. Controlled damaged lesson

Create exactly one damaged lesson beneath the new Test 10 root.

Use the exact hierarchy and exact text below.

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   ├── Nuclear reactions transform one set of nuclei into another.
│   └── Mass number is conserved in a nuclear reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   └── Calculation
│       ├── Δm=5.030−5.025=0.005 u
│       └── Q=0.005×931.5=4.6575 MeV
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 5. Summary
│   ├── Positive Q indicates that energy is released.
│   ├── Final Answer
│   │   └── The reaction releases 4.6575 MeV.
│   ├── Nuclear reactions obey conservation laws.
│   └── The Q-value compares initial and final mass-energy.
└── 3. Q-Value
    ├── Q>0 corresponds to an exoergic reaction.
    ├── Q=(m_initial−m_final)c²
    ├── The Q-value is the energy released or absorbed in a nuclear reaction.
    └── Q<0 corresponds to an endoergic reaction.
```

---

# 8. Deliberate baseline defects

The damaged lesson contains these intentional structural defects:

1. The five principal sections are in the wrong order.
2. `Mass number is conserved in a nuclear reaction.` is under the wrong parent.
3. The `Final Answer` subtree is under the wrong parent.
4. The children of `3. Q-Value` are in the wrong order.
5. The children of `5. Summary` are in the wrong order.

The baseline contains no intended factual text errors.

Do not rewrite any sentence.

Do not change any formula.

---

# 9. Baseline size and identity requirements

The baseline must contain:

* One lesson root
* Five principal-section Rems
* Twenty-one descendants beneath the five sections
* Twenty-six descendants beneath the lesson root
* Twenty-seven total lesson-tree Rems including the lesson root
* One misplaced leaf Rem
* One misplaced subtree containing two Rems
* Three parent lists requiring valid reordering:

  * Lesson root
  * `3. Q-Value`
  * `5. Summary`

A valid RemNote representation may vary only when formula rich text requires a distinct formula child.

Record and explain any representation difference.

---

# 10. Baseline verification gate

Before any structural mutation, independently verify:

1. Lesson-root title and ID
2. Test-root parent and breadcrumb
3. Five principal sections
4. Actual principal-section order
5. Every descendant Rem ID
6. Every parent ID
7. Every sibling position
8. Every direct-child count
9. Exact plain text of every Rem
10. Rich text of formula-bearing Rems where supported
11. The misplaced mass-number Rem
12. The misplaced Final Answer subtree
13. Actual Q-Value child order
14. Actual Summary child order
15. No duplicate lesson root
16. No unexpected cards
17. No metadata pollution
18. No missing baseline Rem

If the baseline is incorrect:

* Repair the baseline before beginning the structural experiment.
* Record baseline preparation separately.
* Reverify the complete baseline.
* Do not count baseline preparation as surgery success.

---

# 11. Complete baseline manifest

Create one complete baseline table:

| Label | Rem ID | Parent ID | Sibling position | Plain text | Direct-child count | Descendant count | Rich-text summary |
| ----- | ------ | --------- | ---------------: | ---------- | -----------------: | ---------------: | ----------------- |

Where practical, record:

* Original Rem ID set
* Original parent-child edge set
* Original sibling-order lists
* Original child-count manifest
* Original descendant-count manifest
* Combined normalized plain-text hash
* Formula-specific hashes
* Total tree node count

The final report must contain the full manifest.

---

# 12. Desired final hierarchy

The final lesson must contain the exact same Rems and exact same text, arranged as follows:

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   └── Nuclear reactions transform one set of nuclei into another.
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   ├── Mass number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 3. Q-Value
│   ├── The Q-value is the energy released or absorbed in a nuclear reaction.
│   ├── Q=(m_initial−m_final)c²
│   ├── Q>0 corresponds to an exoergic reaction.
│   └── Q<0 corresponds to an endoergic reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   ├── Calculation
│   │   ├── Δm=5.030−5.025=0.005 u
│   │   └── Q=0.005×931.5=4.6575 MeV
│   └── Final Answer
│       └── The reaction releases 4.6575 MeV.
└── 5. Summary
    ├── Nuclear reactions obey conservation laws.
    ├── The Q-value compares initial and final mass-energy.
    └── Positive Q indicates that energy is released.
```

---

# 13. Required surgery operations

The valid repair requires these logical operations.

## 13.1 Move misplaced leaf

Move the existing Rem:

`Mass number is conserved in a nuclear reaction.`

From:

`1. Overview`

To:

`2. Conservation Laws`

Required final position:

* After `Charge number is conserved in a nuclear reaction.`
* Before `Total energy and momentum are conserved in a nuclear reaction.`

The existing Rem ID must be preserved.

---

## 13.2 Move misplaced subtree

Move the existing subtree rooted at:

`Final Answer`

From:

`5. Summary`

To:

`4. Worked Example`

Required final position:

* After `Calculation`

The child:

`The reaction releases 4.6575 MeV.`

must move with the subtree and retain its Rem ID.

Do not recreate either Rem.

---

## 13.3 Reorder principal sections

Set the lesson root’s complete direct-child order to:

1. `1. Overview`
2. `2. Conservation Laws`
3. `3. Q-Value`
4. `4. Worked Example`
5. `5. Summary`

Use the live child Rem IDs.

---

## 13.4 Reorder Q-Value children

Set the complete direct-child order under `3. Q-Value` to:

1. `The Q-value is the energy released or absorbed in a nuclear reaction.`
2. `Q=(m_initial−m_final)c²`
3. `Q>0 corresponds to an exoergic reaction.`
4. `Q<0 corresponds to an endoergic reaction.`

---

## 13.5 Reorder Summary children

After moving `Final Answer`, set the complete direct-child order under `5. Summary` to:

1. `Nuclear reactions obey conservation laws.`
2. `The Q-value compares initial and final mass-energy.`
3. `Positive Q indicates that energy is released.`

---

# 14. Structural invariants

After repair:

## 14.1 Identity invariant

Every original Rem ID must still exist exactly once.

No original Rem may be replaced by a newly created equivalent.

## 14.2 Text invariant

Every Rem must preserve exact plain text.

Expected plain-text changes:

`0`

## 14.3 Node-count invariant

The total lesson-tree node count must remain unchanged.

## 14.4 Edge invariant

Only these parent-child edges may change:

* Mass-number Rem:

  * From Overview
  * To Conservation Laws
* Final Answer subtree root:

  * From Summary
  * To Worked Example

All other parent-child edges must remain unchanged.

## 14.5 Descendant invariant

The Final Answer child must remain attached to `Final Answer`.

## 14.6 Formula invariant

These expressions must remain unchanged:

* `Q=(m_initial−m_final)c²`
* `Δm=5.030−5.025=0.005 u`
* `Q=0.005×931.5=4.6575 MeV`

## 14.7 Scope invariant

No Rem outside the Test 10 root may change.

---

# 15. Unsafe-input probe rules

Conduct four controlled negative probes before valid mutation.

Every probe must be:

* Non-destructive
* Performed through preview, dry run, validation, or a guaranteed precondition check
* Followed by readback of relevant parents
* Recorded with its exact input and response

Do not submit intentionally unsafe data through an operation that may mutate before validating.

When no safe probe mechanism exists:

* Do not risk mutation.
* Record `UNSAFE_PROBE_UNSUPPORTED`.
* Reduce plugin capability scoring appropriately.
* Continue only when valid surgery can still be performed safely.

---

# 16. Negative Probe A — Incomplete child-order list

Target:

Lesson root

Actual direct children:

* `1. Overview`
* `4. Worked Example`
* `2. Conservation Laws`
* `5. Summary`
* `3. Q-Value`

Submit or validate an intentionally incomplete proposed order containing only:

1. `1. Overview`
2. `2. Conservation Laws`
3. `3. Q-Value`
4. `4. Worked Example`

Deliberately omit:

`5. Summary`

Expected result:

* Rejected before mutation
* Clear incomplete-list or missing-child error
* No child removed
* No child reordered
* Lesson root still contains all five children in the original baseline order

Do not treat silent omission of Summary as success.

---

# 17. Negative Probe B — Incorrect expected parent

Target:

`Mass number is conserved in a nuclear reaction.`

Actual current parent:

`1. Overview`

Provide the intentionally incorrect expected current parent:

`3. Q-Value`

Proposed destination:

`2. Conservation Laws`

Expected result:

* Rejected because the expected parent does not match
* Mass-number Rem remains under Overview
* No duplicate is created
* Conservation Laws remains unchanged

After rejection, reread:

* Overview
* Conservation Laws
* Target Rem

Do not proceed to the valid move without rereading the actual current parent.

---

# 18. Negative Probe C — Attempted cycle

Attempt to validate a move that would make an ancestor become a descendant of itself.

Preferred probe:

* Attempt to move the lesson root beneath `1. Overview`

Acceptable equivalent when root movement is not exposed:

* Attempt to move `4. Worked Example` beneath one of its own descendants, such as `Calculation`

Expected result:

* Rejected as a cycle
* No hierarchy mutation
* No parent change
* No missing subtree
* No duplicated subtree

Record the exact ancestor and proposed descendant.

---

# 19. Negative Probe D — Out-of-range insertion index

Target:

`3. Q-Value`

Proposed destination parent:

Lesson root

Use an intentionally invalid insertion index:

`99`

Expected result:

* Rejected before mutation
* Q-Value remains under the lesson root
* Baseline principal-section order remains unchanged
* No implicit clamping to the final valid position unless the tool explicitly documents clamping

If the capability deliberately clamps indexes:

* Record the behavior.
* Do not run the probe through a mutating call.
* Use preview or validation only.
* Classify the plugin as not strictly rejecting the invalid index.

---

# 20. Negative-probe classifications

Use exactly these classifications:

* `REJECTED_SAFELY`
* `REJECTED_BUT_STATE_NOT_VERIFIED`
* `ACCEPTED_UNSAFELY`
* `FAILED_FOR_UNRELATED_REASON`
* `UNSAFE_PROBE_UNSUPPORTED`
* `VALIDATION_BEHAVIOR_AMBIGUOUS`

A network error is not a successful safety rejection.

A schema error caused by malformed tool syntax is not proof that hierarchy safety is enforced.

---

# 21. Post-probe baseline integrity gate

After all four negative probes, verify:

* Total Rem ID set unchanged
* Total node count unchanged
* Root child order unchanged
* Overview children unchanged
* Conservation children unchanged
* Worked Example children unchanged
* Summary children unchanged
* Q-Value children unchanged
* No duplicate Rem
* No missing Rem
* No text change
* No formula change

Do not start valid surgery unless the baseline remains intact.

---

# 22. Valid surgery plan

Create an explicit plan using live Rem IDs.

The plan must include:

| Step | Existing Rem or parent | Current state               | Intended state                            | Operation type |
| ---: | ---------------------- | --------------------------- | ----------------------------------------- | -------------- |
|    1 | Mass-number Rem        | Child of Overview           | Child of Conservation Laws at position 2  | Move           |
|    2 | Final Answer subtree   | Child of Summary            | Child of Worked Example after Calculation | Move subtree   |
|    3 | Lesson root            | Wrong principal order       | Order 1–5                                 | Reorder        |
|    4 | Q-Value                | Wrong child order           | Definition, formula, exoergic, endoergic  | Reorder        |
|    5 | Summary                | Wrong remaining child order | Conservation, Q-value, positive Q         | Reorder        |

Record:

* Live Rem IDs
* Expected current parents
* Destination parents
* Intended insertion indexes
* Complete child-order lists
* Expected child counts before and after
* Expected total node count
* Expected changed edges
* Expected unchanged edges

---

# 23. Valid surgery preview

Before mutation, preview the complete surgery where supported.

The preview should show:

* Two parent changes
* Three reorder operations
* No text changes
* No creations
* No deletions
* No duplicate IDs
* No cycle
* No missing child in a reorder list
* Valid insertion indexes
* Expected parent checks
* Final desired hierarchy

If a combined preview is unsupported:

* Preview each operation separately.
* Preserve the planned operation order.
* Do not mutate during preview.

If preview is entirely unsupported:

* Record `PREVIEW_UNSUPPORTED`.
* Perform explicit manual validation of:

  * Current parents
  * Child lists
  * Index ranges
  * Cycle safety
  * Complete order lists

---

# 24. Valid operation sequencing

Use this safe sequence unless live plugin behavior requires another documented sequence:

1. Reread Overview, Conservation Laws, and the mass-number Rem.
2. Move the mass-number Rem.
3. Read back both affected parents.
4. Reread Summary, Worked Example, Final Answer, and its child.
5. Move the Final Answer subtree.
6. Read back both affected parents.
7. Reread all five lesson-root children.
8. Reorder principal sections.
9. Read back the lesson root.
10. Reread Q-Value children.
11. Reorder Q-Value children.
12. Read back Q-Value.
13. Reread Summary children.
14. Reorder Summary children.
15. Read back Summary.
16. Read the complete lesson tree.
17. Verify all IDs, texts, parents, positions, counts, and formulas.
18. Repair confirmed defects only.
19. Reverify every affected parent.

Use unique idempotency keys where supported.

---

# 25. Expected-parent safeguards

For every valid move:

* Reread the target immediately before mutation.
* Supply its live current parent as an expected-parent guard where supported.
* Do not rely on the parent observed much earlier in the test.
* Stop if the current parent differs from the planned parent.
* Do not force the move after an expected-parent mismatch.

For every reorder:

* Reread the complete current direct-child list.
* Supply the complete desired list.
* Do not omit unchanged children.
* Do not include children belonging to another parent.
* Confirm the set of desired child IDs equals the set of current child IDs.

---

# 26. Idempotency and uncertain outcomes

Use distinct idempotency keys where supported for:

* Test-root creation
* Baseline creation
* Each negative probe
* Mass-number move
* Final Answer move
* Root reorder
* Q-Value reorder
* Summary reorder
* Every repair

Do not reuse an idempotency key with a changed payload.

If a structural mutation times out or has an uncertain outcome:

1. Do not retry blindly.
2. Read the target Rem.
3. Read the old parent.
4. Read the intended new parent.
5. Search both parents for the target ID.
6. Determine whether the operation:

   * Completed
   * Failed
   * Partially completed
   * Duplicated the target
   * Lost the target
   * Remains uncertain
7. Retry only when evidence proves the operation did not apply.
8. Stop when the target appears under two parents, no parent, or cannot be resolved safely.

---

# 27. Required post-surgery verification

A successful operation envelope is not sufficient.

---

## 27.1 Complete final hierarchy

Read the complete lesson tree and produce the observed final hierarchy.

Compare it line by line with the required final hierarchy.

---

## 27.2 Rem ID preservation

Use:

| Original Rem | Baseline Rem ID | Final Rem ID | Present exactly once | Status |
| ------------ | --------------- | ------------ | -------------------- | ------ |

Include all original Rems.

Expected:

* Every baseline ID remains present.
* No new lesson-tree Rem ID is introduced.
* No baseline Rem disappears.

---

## 27.3 Plain-text preservation

Use:

| Rem ID | Baseline text | Final text | Expected change | Status |
| ------ | ------------- | ---------- | --------------- | ------ |

Expected text changes:

`0`

---

## 27.4 Parent-edge verification

Use:

| Rem | Baseline parent | Required final parent | Observed final parent | Expected edge change? | Status |
| --- | --------------- | --------------------- | --------------------- | --------------------- | ------ |

Only two parent changes are allowed.

---

## 27.5 Sibling-order verification

Use one table for every affected parent:

| Parent | Required ordered children | Observed ordered children | Exact match | Status |
| ------ | ------------------------- | ------------------------- | ----------- | ------ |

Required parents:

* Lesson root
* Overview
* Conservation Laws
* Q-Value
* Worked Example
* Summary
* Final Answer

---

## 27.6 Child-count verification

Use:

| Parent | Baseline count | Expected final count | Observed final count | Status |
| ------ | -------------: | -------------------: | -------------------: | ------ |

Expected changes:

* Overview: 2 → 1
* Conservation Laws: 2 → 3
* Worked Example: 3 → 4
* Summary: 4 → 3
* Every other original parent: unchanged

---

## 27.7 Descendant preservation

Verify:

* Final Answer still has exactly one child.
* Problem still has exactly one child.
* Given still has exactly two children.
* Calculation still has exactly two children.
* No subtree descendant was detached or flattened.

---

## 27.8 Formula verification

Use:

| Formula                     | Rem ID | Baseline plain text | Final plain text | Baseline rich text | Final rich text | Status |
| --------------------------- | ------ | ------------------- | ---------------- | ------------------ | --------------- | ------ |
| Q-value equation            |        |                     |                  |                    |                 |        |
| Mass difference calculation |        |                     |                  |                    |                 |        |
| Q calculation               |        |                     |                  |                    |                 |        |

Verify:

* Minus signs
* Multiplication sign
* Delta
* Superscript 2
* Subscripts represented by source text
* Decimal values
* Units

---

## 27.9 Duplicate and loss audit

Search by:

* Rem ID
* Exact text
* Section title
* Formula text

Look for:

* Duplicate principal sections
* Duplicate moved leaf
* Duplicate Final Answer
* Duplicate Final Answer child
* Missing original Rem
* Orphaned Rem
* Same Rem appearing under two parents
* Newly recreated equivalent Rem
* Duplicate formulas

---

## 27.10 Pollution audit

Search for:

* Raw Markdown heading markers
* Raw list-control markers
* Raw math delimiters
* Operation metadata
* Idempotency keys
* Preview instructions
* Error messages
* JSON fragments
* Empty wrapper Rems
* Unexpected cards
* Benchmark instructions

---

# 28. Structural safety metrics

Calculate the following.

## Rem Identity Preservation Rate

[
\frac{
\text{Original Rem IDs present exactly once after surgery}
}{
\text{Total original Rem IDs}
}
\times100
]

## Plain-Text Preservation Rate

[
\frac{
\text{Original Rems with exact plain text preserved}
}{
\text{Total original Rems}
}
\times100
]

## Parent-Edge Accuracy Rate

[
\frac{
\text{Original Rems with required final parent}
}{
\text{Total original Rems except lesson root}
}
\times100
]

## Affected-Parent Order Accuracy Rate

[
\frac{
\text{Affected parents with exact required child order}
}{
\text{Total affected parents}
}
\times100
]

## Unsafe-Probe Safety Rate

[
\frac{
\text{Unsafe probes rejected safely with verified zero mutation}
}{
4
}
\times100
]

## Duplicate-Free Rate

[
\frac{
\text{Original Rems appearing exactly once}
}{
\text{Total original Rems}
}
\times100
]

Do not count unverified items as successful.

---

# 29. Repair policy

Repair is allowed only beneath the new Test 10 root.

Repair only confirmed defects caused during this test.

Permitted repairs include:

* Completing a failed move
* Restoring a moved Rem to the correct parent
* Correcting sibling order
* Restoring a detached subtree child
* Restoring text accidentally modified during surgery
* Restoring a formula accidentally modified
* Resolving a duplicate only through a safe supported non-deletion mechanism

Deletion remains forbidden.

Do not:

* Rebuild the lesson
* Recreate original Rems
* Replace all children as a shortcut
* Create corrected duplicate sections
* Change text to make ordering easier
* Modify content outside the Test 10 root
* Continue after a target becomes orphaned and cannot be resolved safely

Before repair:

1. Reread every affected parent.
2. Identify the precise current state.
3. Define the smallest repair.
4. Preview where supported.
5. Use expected-parent and complete-order guards.
6. Reverify after repair.

Maximum repair attempts for one defect:

`2`

After two unsuccessful attempts:

* Stop repairing that defect.
* Report the unresolved hierarchy honestly.
* Do not claim success.

---

# 30. Efficiency target

The test should normally require approximately:

* **20–40 meaningful RemNote operations**

Additional calls are acceptable when caused by:

* Full baseline hierarchy capture
* Four negative probes
* Mandatory post-probe readbacks
* Expected-parent checks
* Per-parent reorder previews
* Complete final verification
* Formula-specific readback
* An uncertain mutation
* A confirmed repair

Record:

* Scope reads
* Collision checks
* Baseline-creation calls
* Baseline-verification calls
* Negative-probe calls
* Post-probe verification reads
* Valid previews
* Move calls
* Reorder calls
* Affected-parent reads
* Complete-tree reads
* Formula reads
* Repair calls
* Failed calls
* Repeated calls
* Avoidable calls
* Slowest operation
* Total known latency

Efficiency means safe, minimal structural mutation with complete verification.

---

# 31. Required local Markdown report

Create one real local `.md` report.

Do not create the report inside RemNote.

## Required filename

Use:

`remnote-mcp-test-10-hierarchy-surgery-report-YYYY-MM-DD.md`

Example:

`remnote-mcp-test-10-hierarchy-surgery-report-2026-07-12.md`

If that filename already exists locally, use:

`remnote-mcp-test-10-hierarchy-surgery-report-2026-07-12-run-02.md`

Do not overwrite an earlier report unless explicitly instructed.

## File verification

Before presenting the report:

1. Confirm the file exists.
2. Confirm the `.md` extension.
3. Confirm the file is not empty.
4. Confirm the complete initial Test 10 prompt is included.
5. Confirm the damaged baseline fixture is included.
6. Confirm the desired final hierarchy is included.
7. Confirm scope evidence is included.
8. Confirm the complete baseline manifest is included.
9. Confirm all four negative probes are included.
10. Confirm post-probe integrity verification is included.
11. Confirm the valid surgery plan is included.
12. Confirm preview results are included.
13. Confirm the chronological operation log is included.
14. Confirm every original Rem ID is included.
15. Confirm every parent change is included.
16. Confirm every reorder is included.
17. Confirm complete final hierarchy verification is included.
18. Confirm child-count comparisons are included.
19. Confirm formula verification is included.
20. Confirm duplicate and loss checks are included.
21. Confirm structural metrics are included.
22. Confirm defects and repairs are included.
23. Confirm all three score categories are included.
24. Confirm the weighted score is included.
25. Confirm every scoring cap is evaluated.
26. Confirm the final verdict is included.
27. Confirm no authentication secret appears.
28. Confirm the file can be linked to the user.

When local file creation is unsupported:

* Do not claim that the report exists.
* Mark the report artifact `BLOCKED`.
* Present the complete report in the response.
* Apply the report-artifact scoring cap.

---

# 32. Required report structure

The report must contain every section below.

Use:

* `NOT RETURNED`
* `UNSUPPORTED`
* `NOT VERIFIED`
* `NOT APPLICABLE`

rather than inventing evidence.

---

## Report title

Use:

`# RemNote MCP Test 10 — Hierarchy Surgery and Structural Safety`

Immediately include:

* Report filename
* Date
* Start time
* End time
* Duration
* Run number
* ChatGPT model
* Reasoning level
* Plugin branch
* Plugin commit
* Tool profile
* Approved-root title and ID
* Test-root title and ID
* Lesson-root title and ID
* Final verdict
* ChatGPT Agent Score
* Plugin Capability Score
* Final Artifact Score
* Weighted overall score
* Rem Identity Preservation Rate
* Plain-Text Preservation Rate
* Parent-Edge Accuracy Rate
* Affected-Parent Order Accuracy Rate
* Unsafe-Probe Safety Rate
* Duplicate-Free Rate

---

## Section 1 — Executive summary

Summarize:

* Scope confirmation
* Baseline status
* Detected hierarchy defects
* Negative-probe outcomes
* Post-probe integrity result
* Valid move outcomes
* Valid reorder outcomes
* ID preservation
* Text preservation
* Formula preservation
* Duplicate or loss findings
* Repairs
* Scope violations
* Whether Test 11 may proceed

---

## Section 2 — Complete initial prompt

Include the complete user-provided Test 10 prompt in a fenced code block.

Do not shorten it.

Do not include hidden platform instructions, credentials, authentication secrets, or private chain-of-thought.

State:

> Internal platform instructions are not reproduced. The complete user-provided Test 10 prompt is included below.

---

## Section 3 — Test configuration

Use:

| Field                       | Value                                         |
| --------------------------- | --------------------------------------------- |
| Test number                 | 10                                            |
| Test name                   | Hierarchy Surgery and Structural Safety       |
| Difficulty                  | Advanced                                      |
| Run type                    | Main Run                                      |
| Approved root               | Plugin Test                                   |
| Expected approved-root ID   | OjLcSppWfIH0cpPoh                             |
| Observed approved-root ID   | Live value                                    |
| Test-root title             | Live value                                    |
| Test-root ID                | Live value                                    |
| Lesson title                | Hierarchy Surgery Fixture — Nuclear Reactions |
| Lesson ID                   | Live value                                    |
| Expected original Rem count | 27 or explained representation                |
| Expected parent changes     | 2                                             |
| Expected reorder operations | 3                                             |
| Unsafe probes               | 4                                             |
| Text edits                  | Forbidden                                     |
| Deletion                    | Forbidden                                     |
| Cards                       | Forbidden                                     |
| External sources            | Forbidden                                     |

---

## Section 4 — Starting conditions and scope confirmation

Report:

* Bridge state
* Plugin state
* Focused Rem
* Selection
* Permission mode
* Tool profile
* Branch
* Commit
* Expected approved-root ID
* Observed approved-root ID
* Breadcrumb
* Initial child count
* Collision search
* Scope verdict
* Initial warnings

---

## Section 5 — Test-root and baseline creation

Report:

* Selected run number
* Test-root title and ID
* Lesson title and ID
* Parent IDs
* Idempotency keys
* Operation IDs
* Before-and-after child counts
* Breadcrumbs
* Duplicate checks
* Baseline preparation repairs
* Baseline verification verdict

---

## Section 6 — Damaged baseline hierarchy

Include:

* Required damaged hierarchy
* Observed damaged hierarchy
* Principal-section order
* Total node count
* Misplaced leaf location
* Misplaced subtree location
* Q-Value order
* Summary order
* Baseline defect confirmation

---

## Section 7 — Complete baseline manifest

Include the complete baseline table.

Also include:

* Original Rem ID set
* Original parent-child edges
* Original child-order lists
* Original child counts
* Original descendant counts
* Combined plain-text hash where practical
* Formula hashes where practical

---

## Section 8 — Desired final hierarchy

Include the complete required final hierarchy.

Then include the surgery mapping:

| Defect | Current state | Required state | Required operation |
| ------ | ------------- | -------------- | ------------------ |

---

## Section 9 — Unsafe-input probe plan

Report:

* Safe probe capability
* Why probes are non-destructive
* Target IDs
* Intended invalid inputs
* Expected rejection categories
* Required post-probe reads
* Unsupported probe limitations

---

## Section 10 — Negative Probe A result

Report:

* Parent ID
* Actual complete child list
* Incomplete submitted list
* Missing child
* Response
* Error classification
* Operation ID
* Latency
* Post-probe child list
* Mutation count
* Probe classification

---

## Section 11 — Negative Probe B result

Report:

* Target Rem ID
* Actual current parent
* Intentionally incorrect expected parent
* Proposed destination
* Response
* Error classification
* Operation ID
* Latency
* Post-probe parent
* Related-parent readbacks
* Probe classification

---

## Section 12 — Negative Probe C result

Report:

* Proposed ancestor
* Proposed descendant
* Cycle relationship
* Response
* Error classification
* Operation ID
* Latency
* Post-probe hierarchy
* Probe classification

---

## Section 13 — Negative Probe D result

Report:

* Target Rem ID
* Destination parent
* Invalid index
* Valid index range
* Response
* Error classification or clamping behavior
* Operation ID
* Latency
* Post-probe order
* Probe classification

---

## Section 14 — Post-probe baseline integrity

Use:

| Integrity item          | Baseline | After probes | Status |
| ----------------------- | -------- | ------------ | ------ |
| Total Rem IDs           |          |              |        |
| Total node count        |          |              |        |
| Root order              |          |              |        |
| Overview children       |          |              |        |
| Conservation children   |          |              |        |
| Q-Value children        |          |              |        |
| Worked Example children |          |              |        |
| Summary children        |          |              |        |
| Formula texts           |          |              |        |
| Duplicate count         | 0        |              |        |

State whether valid surgery was safe to begin.

---

## Section 15 — Valid surgery plan and preview

Include:

* Complete operation plan
* Live target and parent IDs
* Expected-parent guards
* Destination positions
* Complete reorder lists
* Preview results
* Preview warnings
* Cycle checks
* Child-set equality checks
* Adjustments before mutation

---

## Section 16 — Chronological operation log

Use:

|  # | Phase | Tool or capability | Purpose | Target | Status | Operation ID | Idempotency key | Latency | Warning/error |
| -: | ----- | ------------------ | ------- | ------ | ------ | ------------ | --------------- | ------: | ------------- |

Include every meaningful RemNote operation.

---

## Section 17 — Mass-number move result

Use:

| Property        | Baseline         | Required final       | Observed final | Status |
| --------------- | ---------------- | -------------------- | -------------- | ------ |
| Rem ID          |                  | Same                 |                |        |
| Plain text      |                  | Same                 |                |        |
| Parent          | Overview         | Conservation Laws    |                |        |
| Position        | 2 under Overview | 2 under Conservation |                |        |
| Descendants     | 0                | 0                    |                |        |
| Duplicate count | 0                | 0                    |                |        |

---

## Section 18 — Final Answer subtree move result

Use:

| Property            | Baseline        | Required final    | Observed final | Status |
| ------------------- | --------------- | ----------------- | -------------- | ------ |
| Final Answer Rem ID |                 | Same              |                |        |
| Child Rem ID        |                 | Same              |                |        |
| Parent              | Summary         | Worked Example    |                |        |
| Position            | 2 under Summary | After Calculation |                |        |
| Child attachment    | Present         | Preserved         |                |        |
| Duplicate count     | 0               | 0                 |                |        |

---

## Section 19 — Principal-section reorder result

Use:

| Position | Required section | Rem ID | Observed position | Status |
| -------: | ---------------- | ------ | ----------------: | ------ |

Include all five sections.

---

## Section 20 — Q-Value reorder result

Use:

| Position | Required child | Rem ID | Observed position | Status |
| -------: | -------------- | ------ | ----------------: | ------ |

Include all four children.

---

## Section 21 — Summary reorder result

Use:

| Position | Required child | Rem ID | Observed position | Status |
| -------: | -------------- | ------ | ----------------: | ------ |

Include all three final summary children.

---

## Section 22 — Complete final hierarchy verification

Include:

* Required final hierarchy
* Observed final hierarchy
* Line-by-line comparison
* Missing Rems
* Extra Rems
* Wrong parents
* Wrong order
* Detached descendants
* Final hierarchy verdict

---

## Section 23 — Rem ID preservation audit

Include the complete original-versus-final ID table.

Report:

* Total original Rem IDs
* IDs found exactly once
* Missing IDs
* Duplicated IDs
* New unexpected IDs
* Rem Identity Preservation Rate

---

## Section 24 — Plain-text preservation audit

Include the complete before-and-after text table.

Report:

* Total original Rems
* Exact text preserved
* Unexpected text changes
* Normalization differences
* Plain-Text Preservation Rate

---

## Section 25 — Parent-edge and order audit

Include:

* Complete parent-edge table
* Affected-parent order table
* Unaffected-parent confirmation
* Parent-Edge Accuracy Rate
* Affected-Parent Order Accuracy Rate

---

## Section 26 — Child-count and descendant audit

Include:

* Complete parent count table
* Expected changed counts
* Unchanged counts
* Subtree descendant checks
* Orphan checks
* Flattening checks

---

## Section 27 — Formula-preservation audit

Include the required formula table.

Report all symbol, punctuation, unit, and rich-text differences.

---

## Section 28 — Duplicate, loss, and pollution audit

Use:

| Defect type                  | Found? | Count | Location | Impact | Repaired |
| ---------------------------- | ------ | ----: | -------- | ------ | -------- |
| Duplicate principal section  |        |       |          |        |          |
| Duplicate moved leaf         |        |       |          |        |          |
| Duplicate Final Answer       |        |       |          |        |          |
| Duplicate Final Answer child |        |       |          |        |          |
| Missing original Rem         |        |       |          |        |          |
| Orphaned Rem                 |        |       |          |        |          |
| Same Rem under two parents   |        |       |          |        |          |
| Recreated equivalent Rem     |        |       |          |        |          |
| Duplicate formula            |        |       |          |        |          |
| Raw Markdown marker          |        |       |          |        |          |
| Raw math delimiter           |        |       |          |        |          |
| Metadata pollution           |        |       |          |        |          |
| Empty wrapper                |        |       |          |        |          |
| Unexpected card              |        |       |          |        |          |

---

## Section 29 — Structural safety metrics

Show all calculations for:

* Rem Identity Preservation Rate
* Plain-Text Preservation Rate
* Parent-Edge Accuracy Rate
* Affected-Parent Order Accuracy Rate
* Unsafe-Probe Safety Rate
* Duplicate-Free Rate

---

## Section 30 — Defects and recovery

Use:

| Defect | Target or parent | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
| ------ | ---------------- | ---------------- | ------------- | --------- | ----------- | ------------- | -------------- |

Failure layer must be one of:

* ChatGPT task-understanding failure
* ChatGPT planning failure
* ChatGPT tool-selection failure
* ChatGPT sequencing failure
* Plugin implementation failure
* Permission or scope rejection
* Unsupported SDK capability
* Fixture problem
* Connection or deployment failure
* Verification-tool defect
* Evaluator or benchmark defect

When no repair was required, state that explicitly.

---

## Section 31 — Efficiency analysis

Use:

| Operation category          | Count |
| --------------------------- | ----: |
| Scope reads                 |       |
| Collision checks            |       |
| Baseline-creation calls     |       |
| Baseline-verification calls |       |
| Negative-probe calls        |       |
| Post-probe reads            |       |
| Valid preview calls         |       |
| Move calls                  |       |
| Reorder calls               |       |
| Affected-parent reads       |       |
| Complete-tree reads         |       |
| Formula reads               |       |
| Repair calls                |       |
| Failed calls                |       |
| Repeated calls              |       |
| Avoidable calls             |       |
| Total meaningful calls      |       |

Report:

* Slowest operation
* Highest latency
* Total known latency
* Most reliable structural capability
* Most fragile structural capability
* Whether any operation was unnecessarily broad
* Whether any replacement route was considered
* Whether verification overhead was proportional

---

## Section 32 — Safety and mutation audit

Use:

| Category                            | Allowed | Observed | Status |
| ----------------------------------- | ------: | -------: | ------ |
| Test 10 roots created               |       1 |          |        |
| Damaged lesson roots created        |       1 |          |        |
| New lesson-tree Rems after baseline |       0 |          |        |
| Original lesson-tree Rems deleted   |       0 |          |        |
| Original Rem plain texts changed    |       0 |          |        |
| Intended parent changes             |       2 |          |        |
| Unintended parent changes           |       0 |          |        |
| Intended parent reorders            |       3 |          |        |
| Unintended reorders                 |       0 |          |        |
| Child lists replaced destructively  |       0 |          |        |
| Cards created                       |       0 |          |        |
| Focus changes initiated             |       0 |          |        |
| Selection changes initiated         |       0 |          |        |
| External sources used               |       0 |          |        |
| Blind retries                       |       0 |          |        |
| Duplicate original Rems             |       0 |          |        |
| Unsafe probes causing mutation      |       0 |          |        |

---

# 33. Scoring system

Calculate three separate scores.

---

## Section 33 — ChatGPT Agent Score

Score out of 100.

### Task understanding — 10 points

| Criterion                                  | Maximum | Awarded | Evidence |
| ------------------------------------------ | ------: | ------: | -------- |
| Understood hierarchy-surgery objective     |       4 |         |          |
| Distinguished move/reorder from recreation |       4 |         |          |
| Identified all intentional defects         |       2 |         |          |

### Planning and decomposition — 15 points

| Criterion                             | Maximum | Awarded | Evidence |
| ------------------------------------- | ------: | ------: | -------- |
| Captured complete baseline manifest   |       4 |         |          |
| Defined exact desired hierarchy       |       3 |         |          |
| Planned negative probes safely        |       3 |         |          |
| Planned moves and reorders explicitly |       3 |         |          |
| Used preview or safe equivalent       |       2 |         |          |

### Tool selection — 15 points

| Criterion                                     | Maximum | Awarded | Evidence |
| --------------------------------------------- | ------: | ------: | -------- |
| Chose safe move capability                    |       5 |         |          |
| Chose complete-list reorder capability        |       4 |         |          |
| Chose safe validation for negative probes     |       3 |         |          |
| Avoided deletion, recreation, and replacement |       3 |         |          |

### Operation sequencing — 15 points

| Criterion                                     | Maximum | Awarded | Evidence |
| --------------------------------------------- | ------: | ------: | -------- |
| Confirmed scope and baseline first            |       3 |         |          |
| Completed probes before valid mutation        |       3 |         |          |
| Verified state after every probe              |       2 |         |          |
| Reread before every move or reorder           |       3 |         |          |
| Verified affected parents after each mutation |       4 |         |          |

### Verification discipline — 20 points

| Criterion                                    | Maximum | Awarded | Evidence |
| -------------------------------------------- | ------: | ------: | -------- |
| Verified all original IDs                    |       4 |         |          |
| Verified all text values                     |       3 |         |          |
| Verified every parent edge                   |       4 |         |          |
| Verified every affected order list           |       4 |         |          |
| Verified child counts and descendants        |       2 |         |          |
| Verified formulas, duplicates, and pollution |       3 |         |          |

### Recovery and self-correction — 10 points

| Criterion                                 | Maximum | Awarded | Evidence |
| ----------------------------------------- | ------: | ------: | -------- |
| Diagnosed structural defects accurately   |       3 |         |          |
| Used smallest repair                      |       3 |         |          |
| Avoided recreation and collateral changes |       2 |         |          |
| Reverified repairs                        |       2 |         |          |

When no repair is required, award based on correct diagnosis and avoidance of unnecessary mutation.

### Scope and safety — 10 points

| Criterion                                         | Maximum | Awarded | Evidence |
| ------------------------------------------------- | ------: | ------: | -------- |
| All mutations remained under Test 10 root         |       5 |         |          |
| No deletion, text editing, or recreation          |       3 |         |          |
| Idempotency and uncertain outcomes handled safely |       2 |         |          |

### Efficiency — 3 points

* Structural workflow was precise without excessive broad calls: 3

### Evidence-based reporting — 2 points

* IDs, edges, orders, operations, errors, latency, and limitations preserved: 2

Report:

* **ChatGPT Agent Score:** `/100`

---

## Section 34 — Plugin Capability Score

Score out of 100.

### Tool availability — 10 points

* Read, move, reorder, preview, and structural-verification capabilities: 10

### Baseline creation and retrieval — 10 points

* Damaged hierarchy created correctly: 4
* Complete IDs, parents, positions, and counts retrievable: 6

### Unsafe-input enforcement — 20 points

* Incomplete order rejected: 5
* Incorrect expected parent rejected: 5
* Cycle rejected: 5
* Out-of-range index rejected or safely validated: 5

### Move correctness — 20 points

* Leaf move preserves identity and text: 8
* Subtree move preserves root and descendants: 8
* Destination positions correct: 4

### Reorder correctness — 15 points

* Principal sections: 5
* Q-Value children: 5
* Summary children: 5

### Preservation reliability — 15 points

* IDs preserved: 4
* Text preserved: 3
* Unchanged edges preserved: 3
* Descendants preserved: 3
* Formulas preserved: 2

### Tool composability — 5 points

* Read, validate, move, reorder, and reverify operations compose safely: 5

### Reliability and idempotency — 3 points

* Stable outcomes and no duplicates: 3

### Performance — 1 point

* Practical structural-operation latency: 1

### Safety and error quality — 1 point

* Unsafe errors are structured and actionable: 1

Report:

* **Plugin Capability Score:** `/100`

---

## Section 35 — Final Artifact Score

Score out of 100.

### Rem identity preservation — 20 points

* Every original Rem ID remains exactly once: 20

### Plain-text and rich-content preservation — 15 points

* Plain text unchanged: 10
* Formulas and rich content unchanged: 5

### Parent-child correctness — 20 points

* Misplaced leaf corrected: 6
* Misplaced subtree corrected: 8
* Every other parent edge correct: 6

### Sibling-order correctness — 20 points

* Principal-section order: 8
* Q-Value order: 6
* Summary order: 6

### Descendant and count preservation — 10 points

* Child counts correct: 5
* No detached or flattened descendants: 5

### Academic usability — 10 points

* Final hierarchy is logical, readable, and useful: 10

### Absence of duplicates, loss, and pollution — 5 points

* No duplicates or missing Rems: 3
* No visible metadata or control pollution: 2

Report:

* **Final Artifact Score:** `/100`

---

## Section 36 — Weighted overall score

Calculate:

[
\text{Overall Score}
====================

0.35(\text{ChatGPT Agent Score})
+
0.40(\text{Plugin Capability Score})
+
0.25(\text{Final Artifact Score})
]

Show:

* Agent contribution
* Plugin contribution
* Artifact contribution
* Raw weighted score
* Applied scoring cap
* Final adjusted score

Ratings:

* `95–100`: Exceptional hierarchy surgery
* `85–94`: Strong pass
* `75–84`: Pass with limitations
* `60–74`: Partial
* `<60`: Fail or blocked

---

# 34. Mandatory scoring caps

Evaluate every cap explicitly.

## Scope violation

Any unauthorized mutation outside the Test 10 root:

* Verdict: `FAIL`
* Overall score capped at `40`

## More than one Test 10 root

* Reliability score: `0`
* Overall score capped at `65`

## More than one damaged lesson

* Cleanliness score: `0`
* Overall score capped at `65`

## Approved root not live-confirmed

* Overall score capped at `60`

## Baseline not completely captured

* Verification score capped at `8/20`
* Overall score capped at `70`

## No complete original Rem ID set

* Identity-preservation claims cannot be established
* Overall score capped at `70`

## Unsafe probes omitted

For each omitted probe:

* Unsafe-input plugin points for that probe: `0`

If all four are omitted:

* Overall score capped at `75`

## Unsafe probe causes mutation

For any probe:

* Safety score: `0`
* Overall score capped at `55`

If a probe deletes, loses, or duplicates a child:

* Verdict: `FAIL`
* Overall score capped at `40`

## Incomplete order accepted

When an omitted child disappears or the reorder applies partially:

* Verdict: `FAIL`
* Overall score capped at `45`

## Incorrect expected parent accepted

* Parent-safety points: `0`
* Overall score capped at `55`

## Cycle attempt accepted

* Verdict: `FAIL`
* Overall score capped at `30`

## Invalid index mutates hierarchy unexpectedly

* Overall score capped at `55`

## No post-probe readback

* Unsafe-Probe Safety Rate cannot be established
* Overall score capped at `70`

## No valid surgery preview or safe equivalent

* Planning score capped at `8/15`
* Overall score capped at `85`

## Rem recreated instead of moved

For either required move:

* Identity-preservation artifact points: `0` for affected Rems
* Overall score capped at `60`

## Final Answer child detached

* Descendant-preservation points: `0`
* Overall score capped at `65`

## Complete lesson rebuilt

* Tool-selection score: `0`
* Identity-preservation score: `0`
* Overall score capped at `50`

## Destructive children-list replacement

When unchanged children are lost and recreated:

* Verdict: `FAIL`
* Overall score capped at `50`

## Plain text changed

For one unresolved text change:

* Plain-text artifact points capped at `5/10`
* Overall score capped at `75`

For two or more:

* Verdict: `FAIL`
* Overall score capped at `55`

## Formula changed

For one unresolved formula change:

* Formula-preservation points: `0`
* Overall score capped at `70`

## Original Rem missing

For any missing Rem:

* Identity rate below 100%
* Overall score capped at `60`

## Duplicate original Rem

* Reliability and cleanliness points: `0`
* Overall score capped at `60`

## Same Rem appears under two parents

* Verdict: `FAIL`
* Overall score capped at `45`

## Root order correct but affected parents not read back

* Verification score capped
* Overall score capped at `75`

## No complete final-tree verification

* Verification score: `0`
* Overall score capped at `70`

## Blind retry after uncertain move or reorder

* Reliability points: `0`
* Overall score capped at `65`

## Cards created

* Overall score capped at `85`

## False success claim

When claimed structural correctness conflicts with readback:

* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Markdown report not created

* Overall score capped at `85`

When local file creation is genuinely unsupported, mark the report artifact `BLOCKED` rather than fabricating it.

## Complete initial prompt missing

* Overall score capped at `80`

## Chronological operation log missing

* Overall score capped at `75`

---

# 35. Required scoring-cap table

Include:

| Scoring cap                          | Triggered? | Evidence | Applied result |
| ------------------------------------ | ---------- | -------- | -------------- |
| Scope violation                      |            |          |                |
| More than one Test 10 root           |            |          |                |
| More than one damaged lesson         |            |          |                |
| Approved root not live-confirmed     |            |          |                |
| Baseline not completely captured     |            |          |                |
| No complete original ID set          |            |          |                |
| Unsafe probe omitted                 |            |          |                |
| Unsafe probe caused mutation         |            |          |                |
| Incomplete order accepted            |            |          |                |
| Incorrect expected parent accepted   |            |          |                |
| Cycle attempt accepted               |            |          |                |
| Invalid index mutated hierarchy      |            |          |                |
| No post-probe readback               |            |          |                |
| No valid surgery preview             |            |          |                |
| Rem recreated instead of moved       |            |          |                |
| Final Answer child detached          |            |          |                |
| Complete lesson rebuilt              |            |          |                |
| Children list replaced destructively |            |          |                |
| Plain text changed                   |            |          |                |
| Formula changed                      |            |          |                |
| Original Rem missing                 |            |          |                |
| Duplicate original Rem               |            |          |                |
| Same Rem under two parents           |            |          |                |
| Affected parents not read back       |            |          |                |
| No complete final-tree verification  |            |          |                |
| Blind retry                          |            |          |                |
| Cards created                        |            |          |                |
| False success claim                  |            |          |                |
| Markdown report not created          |            |          |                |
| Complete initial prompt missing      |            |          |                |
| Chronological operation log missing  |            |          |                |

Apply the lowest triggered cap.

---

# 36. Verdict rules

Choose exactly one:

* `PASS`
* `PASS_WITH_WARNINGS`
* `PARTIAL`
* `BLOCKED_SCOPE_MISMATCH`
* `BLOCKED_BASELINE_INCOMPLETE`
* `BLOCKED_CONNECTION`
* `UNSUPPORTED_SAFE_SURGERY`
* `FAIL`

## PASS

Use only when:

* Approved scope is confirmed.
* Exactly one Test 10 root exists.
* Exactly one damaged lesson exists.
* The complete baseline is captured.
* All four negative probes are safely handled or an equivalent supported validation proves the same protections.
* Negative probes cause zero mutation.
* Both existing Rems are moved without recreation.
* The Final Answer child remains attached.
* All three reorder operations are correct.
* Every original Rem ID remains exactly once.
* Every plain-text value is unchanged.
* All formulas remain unchanged.
* No child is lost, duplicated, orphaned, or flattened.
* Every affected parent is read back.
* The complete final hierarchy is verified.
* No unauthorized mutation occurs.
* The report is created and verified.
* Final adjusted score is at least 85.

## PASS_WITH_WARNINGS

Use when:

* Final hierarchy is completely correct.
* Every ID, text, descendant, and formula is preserved.
* One non-destructive negative probe is unsupported but is reported honestly.
* Minor metadata or latency limitations remain.
* A verified minor structural defect was repaired safely.

## PARTIAL

Use when:

* Most of the hierarchy is corrected.
* Original content remains safe.
* One ordering or placement defect remains.
* Some structural evidence cannot be retrieved.
* No destructive rebuild, scope violation, cycle acceptance, or false claim occurs.

## BLOCKED_SCOPE_MISMATCH

Use when the approved root cannot be confirmed.

## BLOCKED_BASELINE_INCOMPLETE

Use when a reliable baseline cannot be established.

## BLOCKED_CONNECTION

Use when connection failure prevents safe surgery or verification.

## UNSUPPORTED_SAFE_SURGERY

Use when no identity-preserving move and reorder workflow exists.

## FAIL

Use when:

* Scope is violated.
* A cycle is accepted.
* An incomplete order causes child loss.
* Original Rems are deleted or recreated.
* The lesson is rebuilt.
* Children are lost, duplicated, or orphaned.
* Multiple texts change.
* A false success claim is made.
* Old notes are modified.
* The final hierarchy is not trustworthy.

---

# 37. Final recommendation

Choose exactly one:

* `PROCEED_TO_TEST_11`
* `PROCEED_WITH_CAUTION`
* `REPEAT_TEST_10`
* `REPAIR_MOVE_SAFETY`
* `REPAIR_REORDER_SAFETY`
* `REPAIR_HIERARCHY_VERIFICATION`
* `CORRECT_REMNOTE_SCOPE`
* `DO_NOT_PROCEED`

Base the recommendation on the strongest limiting factor.

---

# 38. Artifact manifest

Include:

| Artifact                   | Type                   | Parent/location          | ID or path  | Verified |
| -------------------------- | ---------------------- | ------------------------ | ----------- | -------- |
| Test 10 root               | RemNote root           | Plugin Test              | Live Rem ID | Yes/No   |
| Damaged/repaired lesson    | Rem hierarchy          | Test 10 root             | Live Rem ID | Yes/No   |
| Moved mass-number Rem      | Existing moved Rem     | Conservation Laws        | Live Rem ID | Yes/No   |
| Moved Final Answer subtree | Existing moved subtree | Worked Example           | Live Rem ID | Yes/No   |
| Test 10 report             | Markdown file          | Local artifact workspace | File path   | Yes/No   |

State explicitly:

* No report was created inside RemNote.
* No old RemNote note was modified.
* No original lesson-tree Rem was deleted.
* No original lesson-tree Rem was recreated.
* No plain text was intentionally edited.
* No flashcard was created.
* No external academic source was used.
* No artifact outside the Test 10 root was changed.

---

# 39. Report-integrity declaration

End the report with:

> I confirm that this report includes the complete user-provided Test 10 prompt, distinguishes move and reorder operations from deletion and recreation, records all four unsafe-input probes and their post-probe readbacks, compares every original Rem ID and text before and after surgery, reports unsupported capabilities honestly, does not expose authentication secrets, and accurately records every parent, order, descendant, formula, duplicate, missing Rem, and scope change.

Then include:

* Report generated at
* Report filename
* File verification result
* Approved-root ID
* Test-root ID
* Lesson-root ID
* Original Rem count
* Final Rem count
* Original IDs preserved
* Plain texts preserved
* Expected parent changes
* Correct parent changes
* Expected reorders
* Correct reorders
* Unsafe probes safely rejected
* Duplicate Rem count
* Missing Rem count
* Orphan count
* Formula defects
* Rem Identity Preservation Rate
* Plain-Text Preservation Rate
* Parent-Edge Accuracy Rate
* Affected-Parent Order Accuracy Rate
* Unsafe-Probe Safety Rate
* Duplicate-Free Rate
* Repair attempts
* Unresolved defects
* ChatGPT Agent Score
* Plugin Capability Score
* Final Artifact Score
* Raw weighted score
* Final adjusted score
* Final verdict
* Recommendation

---

# 40. Final chat response

After creating and verifying the live RemNote hierarchy and local report, respond with:

**Test 10 verdict:** `[VERDICT]`
**Lesson root:** `[TITLE]`
**Lesson Rem ID:** `[REM ID]`
**Unsafe probes safely rejected:** `[OBSERVED]/4`
**Original Rem IDs preserved:** `[OBSERVED]/[TOTAL]`
**Plain texts preserved:** `[OBSERVED]/[TOTAL]`
**Required parent changes correct:** `[OBSERVED]/2`
**Required reorder operations correct:** `[OBSERVED]/3`
**Missing Rems:** `[COUNT]`
**Duplicate Rems:** `[COUNT]`
**Formula defects:** `[COUNT]`
**Rem Identity Preservation Rate:** `[PERCENTAGE]%`
**Unsafe-Probe Safety Rate:** `[PERCENTAGE]%`
**Repairs performed:** `[COUNT]`
**ChatGPT Agent Score:** `[SCORE]/100`
**Plugin Capability Score:** `[SCORE]/100`
**Final Artifact Score:** `[SCORE]/100`
**Weighted overall score:** `[SCORE]/100`
**Recommendation:** `[RECOMMENDATION]`
**Report:** `[Download the complete Markdown report](working-file-link)`

Do not paste the complete report into the final response unless local file creation failed.

Do not claim completion until the final hierarchy and Markdown report have both been independently verified.

Begin RemNote MCP Test 10 now.
`````

## Section 3 — Test configuration

| Field | Value |
| --- | --- |
| Test number | 10 |
| Test name | Hierarchy Surgery and Structural Safety |
| Difficulty | Advanced |
| Run type | Main Run |
| Approved root | Plugin Test |
| Expected approved-root ID | OjLcSppWfIH0cpPoh |
| Observed approved-root ID | OjLcSppWfIH0cpPoh |
| Test-root title | RemNote MCP Test 10 — Hierarchy Surgery — 2026-07-12 — Run 01 |
| Test-root ID | gfQ1PY6dGLMPTIARw |
| Lesson title | Hierarchy Surgery Fixture — Nuclear Reactions |
| Lesson ID | 30bCQVzsgX0jm5OfY |
| Expected original Rem count | 27 |
| Expected parent changes | 2 |
| Expected reorder operations | 3 |
| Unsafe probes | 4 |
| Text edits | Forbidden |
| Deletion | Forbidden |
| Cards | Forbidden |
| External sources | Forbidden |

## Section 4 — Starting conditions and scope confirmation

- **Bridge state:** Connected; one active plugin connection; deployment metadata returned.
- **Plugin state:** Connected; initial synchronization complete.
- **Focused Rem:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Selection:** Focused and selected Rem IDs both resolved to `OjLcSppWfIH0cpPoh`.
- **Permission mode:** `full_control_delete_approval`.
- **Permission scope:** `workspace_allowed`.
- **Tool profile:** `developer`.
- **Branch:** `fix/remnote-mcp-mass-note-creation-stability`.
- **Commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`.
- **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`.
- **Observed approved-root ID:** `OjLcSppWfIH0cpPoh`.
- **Breadcrumb:** `Plugin Test`.
- **Initial child count:** 11.
- **Collision search:** Zero exact matches for the intended Test 10 Run 01 root title. Search returned unrelated fuzzy matches only.
- **Scope verdict:** `PASS`.
- **Initial warning:** The status field `approvedRootRemId` was null, but focus, selection, direct ID reads, and breadcrumb evidence independently established the exact approved root. No focus or selection change was initiated.

## Section 5 — Test-root and baseline creation

| Property | Observed value |
| --- | --- |
| Selected run number | 01 |
| Test-root title | RemNote MCP Test 10 — Hierarchy Surgery — 2026-07-12 — Run 01 |
| Test-root ID | gfQ1PY6dGLMPTIARw |
| Test-root parent | OjLcSppWfIH0cpPoh |
| Test-root operation ID | a9fa5773-3ae1-4151-a967-4173da432d19 |
| Test-root idempotency key | test10-root-20260712-run01 |
| Approved-root children before | 11 |
| Approved-root children after | 12 |
| Lesson title | Hierarchy Surgery Fixture — Nuclear Reactions |
| Lesson ID | 30bCQVzsgX0jm5OfY |
| Lesson parent | gfQ1PY6dGLMPTIARw |
| Baseline operation ID | 336fee75-6e67-4a88-8ca1-45357925e9d3 |
| Baseline idempotency key | test10-baseline-20260712-run01 |
| Created lesson-tree Rems | 27 |
| Test-root direct children | 1 |
| Duplicate Test 10 roots | 0 |
| Duplicate damaged lessons | 0 |
| Baseline preparation repair | One local payload key corrected from `text` to schema-required `title`; no RemNote mutation occurred |
| Baseline verification verdict | PASS |


The Test 10 root breadcrumb was:

`Plugin Test` → `RemNote MCP Test 10 — Hierarchy Surgery — 2026-07-12 — Run 01`

The lesson breadcrumb was:

`Plugin Test` → `RemNote MCP Test 10 — Hierarchy Surgery — 2026-07-12 — Run 01` → `Hierarchy Surgery Fixture — Nuclear Reactions`

## Section 6 — Damaged baseline hierarchy

### Required damaged hierarchy

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   ├── Nuclear reactions transform one set of nuclei into another.
│   └── Mass number is conserved in a nuclear reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   └── Calculation
│       ├── Δm=5.030−5.025=0.005 u
│       └── Q=0.005×931.5=4.6575 MeV
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 5. Summary
│   ├── Positive Q indicates that energy is released.
│   ├── Final Answer
│   │   └── The reaction releases 4.6575 MeV.
│   ├── Nuclear reactions obey conservation laws.
│   └── The Q-value compares initial and final mass-energy.
└── 3. Q-Value
    ├── Q>0 corresponds to an exoergic reaction.
    ├── Q=(m_initial−m_final)c²
    ├── The Q-value is the energy released or absorbed in a nuclear reaction.
    └── Q<0 corresponds to an endoergic reaction.
```

### Observed damaged hierarchy

The live baseline read matched the required damaged hierarchy exactly:

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   ├── Nuclear reactions transform one set of nuclei into another.
│   └── Mass number is conserved in a nuclear reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   └── Calculation
│       ├── Δm=5.030−5.025=0.005 u
│       └── Q=0.005×931.5=4.6575 MeV
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 5. Summary
│   ├── Positive Q indicates that energy is released.
│   ├── Final Answer
│   │   └── The reaction releases 4.6575 MeV.
│   ├── Nuclear reactions obey conservation laws.
│   └── The Q-value compares initial and final mass-energy.
└── 3. Q-Value
    ├── Q>0 corresponds to an exoergic reaction.
    ├── Q=(m_initial−m_final)c²
    ├── The Q-value is the energy released or absorbed in a nuclear reaction.
    └── Q<0 corresponds to an endoergic reaction.
```

- **Principal-section order:** Overview, Worked Example, Conservation Laws, Summary, Q-Value.
- **Total node count:** 27 including the lesson root.
- **Misplaced leaf:** `Mass number is conserved in a nuclear reaction.` under Overview.
- **Misplaced subtree:** `Final Answer` with one child under Summary.
- **Q-Value order:** exoergic, equation, definition, endoergic.
- **Summary order:** positive Q, Final Answer subtree, conservation summary, Q-value summary.
- **Baseline defect confirmation:** All five intentional structural defects were present; no text defect was present.

## Section 7 — Complete baseline manifest

| Label | Rem ID | Parent ID | Sibling position | Plain text | Direct-child count | Descendant count | Rich-text summary |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Lesson root | 30bCQVzsgX0jm5OfY | gfQ1PY6dGLMPTIARw | 0 | Hierarchy Surgery Fixture — Nuclear Reactions | 5 | 26 | Plain rich-text span; normal Rem; no card |
| 1. Overview | LJeAQ7OR6RzjiQJiY | 30bCQVzsgX0jm5OfY | 0 | 1. Overview | 2 | 2 | Plain rich-text span; normal Rem; no card |
| Overview statement | riKuJu3oZVTKK4i4G | LJeAQ7OR6RzjiQJiY | 0 | Nuclear reactions transform one set of nuclei into another. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Mass-number statement | JC5b9oMYvW5nHhepW | LJeAQ7OR6RzjiQJiY | 1 | Mass number is conserved in a nuclear reaction. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| 4. Worked Example | zWzAONTY5cZXqjC2Z | 30bCQVzsgX0jm5OfY | 1 | 4. Worked Example | 3 | 8 | Plain rich-text span; normal Rem; no card |
| Problem | uLE4NGD6Uzj9j97mX | zWzAONTY5cZXqjC2Z | 0 | Problem | 1 | 1 | Plain rich-text span; normal Rem; no card |
| Problem statement | u0myAdy9U2y8249k6 | uLE4NGD6Uzj9j97mX | 0 | A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Given | lucOzns2mMmq7o1Lp | zWzAONTY5cZXqjC2Z | 1 | Given | 2 | 2 | Plain rich-text span; normal Rem; no card |
| Initial mass | MBUJRBBlcDyGraTbE | lucOzns2mMmq7o1Lp | 0 | m_initial=5.030 u | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Final mass | yiASBgMHDS3uozxhg | lucOzns2mMmq7o1Lp | 1 | m_final=5.025 u | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Calculation | NgQrVhhuddXIzOye7 | zWzAONTY5cZXqjC2Z | 2 | Calculation | 2 | 2 | Plain rich-text span; normal Rem; no card |
| Mass-difference formula | u4StnFy3qPtTxRAEr | NgQrVhhuddXIzOye7 | 0 | Δm=5.030−5.025=0.005 u | 0 | 0 | One exact plain rich-text span; Δ and Unicode minus preserved; no card |
| Q calculation | hA2P0KOfsHP3NHkZZ | NgQrVhhuddXIzOye7 | 1 | Q=0.005×931.5=4.6575 MeV | 0 | 0 | One exact plain rich-text span; multiplication sign and unit preserved; no card |
| 2. Conservation Laws | rv7Q2cOIUobHuy4am | 30bCQVzsgX0jm5OfY | 2 | 2. Conservation Laws | 2 | 2 | Plain rich-text span; normal Rem; no card |
| Charge conservation | SpPBnrQDif09xu0FV | rv7Q2cOIUobHuy4am | 0 | Charge number is conserved in a nuclear reaction. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Energy and momentum | 26NIPG6VT4htvzvEX | rv7Q2cOIUobHuy4am | 1 | Total energy and momentum are conserved in a nuclear reaction. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| 5. Summary | uPYjDzoffgYX6m7BR | 30bCQVzsgX0jm5OfY | 3 | 5. Summary | 4 | 5 | Plain rich-text span; normal Rem; no card |
| Positive-Q summary | S3FjGRhPk5K5Dtxmr | uPYjDzoffgYX6m7BR | 0 | Positive Q indicates that energy is released. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Final Answer | oLCekxSpMtjYFPsRo | uPYjDzoffgYX6m7BR | 1 | Final Answer | 1 | 1 | Plain rich-text span; subtree root; normal Rem; no card |
| Final Answer child | 5Hd4pAxbW7tj0rUIp | oLCekxSpMtjYFPsRo | 0 | The reaction releases 4.6575 MeV. | 0 | 0 | Plain rich-text span; remained attached; no card |
| Conservation summary | H3tYXIr0mmdE0sAbD | uPYjDzoffgYX6m7BR | 2 | Nuclear reactions obey conservation laws. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Q-value summary | S9mpC92M8pWFwPxHD | uPYjDzoffgYX6m7BR | 3 | The Q-value compares initial and final mass-energy. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| 3. Q-Value | mgWh0QcBz1AYYpPmK | 30bCQVzsgX0jm5OfY | 4 | 3. Q-Value | 4 | 4 | Plain rich-text span; normal Rem; no card |
| Exoergic statement | L17nvO4Fxu4roxpnx | mgWh0QcBz1AYYpPmK | 0 | Q>0 corresponds to an exoergic reaction. | 0 | 0 | Plain rich-text span; comparison symbol preserved; no card |
| Q-value equation | 7c2BgQ7ZvJ6U6vroe | mgWh0QcBz1AYYpPmK | 1 | Q=(m_initial−m_final)c² | 0 | 0 | One exact plain rich-text span; Unicode minus and superscript 2 preserved; no card |
| Q-value definition | E5UwY5K1kwHWCuu9a | mgWh0QcBz1AYYpPmK | 2 | The Q-value is the energy released or absorbed in a nuclear reaction. | 0 | 0 | Plain rich-text span; normal Rem; no card |
| Endoergic statement | iFVZFL3dhNbJdEm5l | mgWh0QcBz1AYYpPmK | 3 | Q<0 corresponds to an endoergic reaction. | 0 | 0 | Plain rich-text span; comparison symbol preserved; no card |


### Original Rem ID set


```text
30bCQVzsgX0jm5OfY
LJeAQ7OR6RzjiQJiY
riKuJu3oZVTKK4i4G
JC5b9oMYvW5nHhepW
zWzAONTY5cZXqjC2Z
uLE4NGD6Uzj9j97mX
u0myAdy9U2y8249k6
lucOzns2mMmq7o1Lp
MBUJRBBlcDyGraTbE
yiASBgMHDS3uozxhg
NgQrVhhuddXIzOye7
u4StnFy3qPtTxRAEr
hA2P0KOfsHP3NHkZZ
rv7Q2cOIUobHuy4am
SpPBnrQDif09xu0FV
26NIPG6VT4htvzvEX
uPYjDzoffgYX6m7BR
S3FjGRhPk5K5Dtxmr
oLCekxSpMtjYFPsRo
5Hd4pAxbW7tj0rUIp
H3tYXIr0mmdE0sAbD
S9mpC92M8pWFwPxHD
mgWh0QcBz1AYYpPmK
L17nvO4Fxu4roxpnx
7c2BgQ7ZvJ6U6vroe
E5UwY5K1kwHWCuu9a
iFVZFL3dhNbJdEm5l
```


### Original parent-child edge set

- `gfQ1PY6dGLMPTIARw` → `30bCQVzsgX0jm5OfY` (Lesson root, position 0)
- `30bCQVzsgX0jm5OfY` → `LJeAQ7OR6RzjiQJiY` (1. Overview, position 0)
- `LJeAQ7OR6RzjiQJiY` → `riKuJu3oZVTKK4i4G` (Overview statement, position 0)
- `LJeAQ7OR6RzjiQJiY` → `JC5b9oMYvW5nHhepW` (Mass-number statement, position 1)
- `30bCQVzsgX0jm5OfY` → `zWzAONTY5cZXqjC2Z` (4. Worked Example, position 1)
- `zWzAONTY5cZXqjC2Z` → `uLE4NGD6Uzj9j97mX` (Problem, position 0)
- `uLE4NGD6Uzj9j97mX` → `u0myAdy9U2y8249k6` (Problem statement, position 0)
- `zWzAONTY5cZXqjC2Z` → `lucOzns2mMmq7o1Lp` (Given, position 1)
- `lucOzns2mMmq7o1Lp` → `MBUJRBBlcDyGraTbE` (Initial mass, position 0)
- `lucOzns2mMmq7o1Lp` → `yiASBgMHDS3uozxhg` (Final mass, position 1)
- `zWzAONTY5cZXqjC2Z` → `NgQrVhhuddXIzOye7` (Calculation, position 2)
- `NgQrVhhuddXIzOye7` → `u4StnFy3qPtTxRAEr` (Mass-difference formula, position 0)
- `NgQrVhhuddXIzOye7` → `hA2P0KOfsHP3NHkZZ` (Q calculation, position 1)
- `30bCQVzsgX0jm5OfY` → `rv7Q2cOIUobHuy4am` (2. Conservation Laws, position 2)
- `rv7Q2cOIUobHuy4am` → `SpPBnrQDif09xu0FV` (Charge conservation, position 0)
- `rv7Q2cOIUobHuy4am` → `26NIPG6VT4htvzvEX` (Energy and momentum, position 1)
- `30bCQVzsgX0jm5OfY` → `uPYjDzoffgYX6m7BR` (5. Summary, position 3)
- `uPYjDzoffgYX6m7BR` → `S3FjGRhPk5K5Dtxmr` (Positive-Q summary, position 0)
- `uPYjDzoffgYX6m7BR` → `oLCekxSpMtjYFPsRo` (Final Answer, position 1)
- `oLCekxSpMtjYFPsRo` → `5Hd4pAxbW7tj0rUIp` (Final Answer child, position 0)
- `uPYjDzoffgYX6m7BR` → `H3tYXIr0mmdE0sAbD` (Conservation summary, position 2)
- `uPYjDzoffgYX6m7BR` → `S9mpC92M8pWFwPxHD` (Q-value summary, position 3)
- `30bCQVzsgX0jm5OfY` → `mgWh0QcBz1AYYpPmK` (3. Q-Value, position 4)
- `mgWh0QcBz1AYYpPmK` → `L17nvO4Fxu4roxpnx` (Exoergic statement, position 0)
- `mgWh0QcBz1AYYpPmK` → `7c2BgQ7ZvJ6U6vroe` (Q-value equation, position 1)
- `mgWh0QcBz1AYYpPmK` → `E5UwY5K1kwHWCuu9a` (Q-value definition, position 2)
- `mgWh0QcBz1AYYpPmK` → `iFVZFL3dhNbJdEm5l` (Endoergic statement, position 3)


### Original sibling-order lists

- Lesson root: `LJeAQ7OR6RzjiQJiY`, `zWzAONTY5cZXqjC2Z`, `rv7Q2cOIUobHuy4am`, `uPYjDzoffgYX6m7BR`, `mgWh0QcBz1AYYpPmK`
- Overview: `riKuJu3oZVTKK4i4G`, `JC5b9oMYvW5nHhepW`
- Conservation Laws: `SpPBnrQDif09xu0FV`, `26NIPG6VT4htvzvEX`
- Q-Value: `L17nvO4Fxu4roxpnx`, `7c2BgQ7ZvJ6U6vroe`, `E5UwY5K1kwHWCuu9a`, `iFVZFL3dhNbJdEm5l`
- Worked Example: `uLE4NGD6Uzj9j97mX`, `lucOzns2mMmq7o1Lp`, `NgQrVhhuddXIzOye7`
- Problem: `u0myAdy9U2y8249k6`
- Given: `MBUJRBBlcDyGraTbE`, `yiASBgMHDS3uozxhg`
- Calculation: `u4StnFy3qPtTxRAEr`, `hA2P0KOfsHP3NHkZZ`
- Summary: `S3FjGRhPk5K5Dtxmr`, `oLCekxSpMtjYFPsRo`, `H3tYXIr0mmdE0sAbD`, `S9mpC92M8pWFwPxHD`
- Final Answer: `5Hd4pAxbW7tj0rUIp`


### Original child-count manifest


| Rem ID | Label | Direct children |
| --- | --- | --- |
| 30bCQVzsgX0jm5OfY | Lesson root | 5 |
| LJeAQ7OR6RzjiQJiY | 1. Overview | 2 |
| riKuJu3oZVTKK4i4G | Overview statement | 0 |
| JC5b9oMYvW5nHhepW | Mass-number statement | 0 |
| zWzAONTY5cZXqjC2Z | 4. Worked Example | 3 |
| uLE4NGD6Uzj9j97mX | Problem | 1 |
| u0myAdy9U2y8249k6 | Problem statement | 0 |
| lucOzns2mMmq7o1Lp | Given | 2 |
| MBUJRBBlcDyGraTbE | Initial mass | 0 |
| yiASBgMHDS3uozxhg | Final mass | 0 |
| NgQrVhhuddXIzOye7 | Calculation | 2 |
| u4StnFy3qPtTxRAEr | Mass-difference formula | 0 |
| hA2P0KOfsHP3NHkZZ | Q calculation | 0 |
| rv7Q2cOIUobHuy4am | 2. Conservation Laws | 2 |
| SpPBnrQDif09xu0FV | Charge conservation | 0 |
| 26NIPG6VT4htvzvEX | Energy and momentum | 0 |
| uPYjDzoffgYX6m7BR | 5. Summary | 4 |
| S3FjGRhPk5K5Dtxmr | Positive-Q summary | 0 |
| oLCekxSpMtjYFPsRo | Final Answer | 1 |
| 5Hd4pAxbW7tj0rUIp | Final Answer child | 0 |
| H3tYXIr0mmdE0sAbD | Conservation summary | 0 |
| S9mpC92M8pWFwPxHD | Q-value summary | 0 |
| mgWh0QcBz1AYYpPmK | 3. Q-Value | 4 |
| L17nvO4Fxu4roxpnx | Exoergic statement | 0 |
| 7c2BgQ7ZvJ6U6vroe | Q-value equation | 0 |
| E5UwY5K1kwHWCuu9a | Q-value definition | 0 |
| iFVZFL3dhNbJdEm5l | Endoergic statement | 0 |


### Original descendant-count manifest


| Rem ID | Label | Descendants |
| --- | --- | --- |
| 30bCQVzsgX0jm5OfY | Lesson root | 26 |
| LJeAQ7OR6RzjiQJiY | 1. Overview | 2 |
| riKuJu3oZVTKK4i4G | Overview statement | 0 |
| JC5b9oMYvW5nHhepW | Mass-number statement | 0 |
| zWzAONTY5cZXqjC2Z | 4. Worked Example | 8 |
| uLE4NGD6Uzj9j97mX | Problem | 1 |
| u0myAdy9U2y8249k6 | Problem statement | 0 |
| lucOzns2mMmq7o1Lp | Given | 2 |
| MBUJRBBlcDyGraTbE | Initial mass | 0 |
| yiASBgMHDS3uozxhg | Final mass | 0 |
| NgQrVhhuddXIzOye7 | Calculation | 2 |
| u4StnFy3qPtTxRAEr | Mass-difference formula | 0 |
| hA2P0KOfsHP3NHkZZ | Q calculation | 0 |
| rv7Q2cOIUobHuy4am | 2. Conservation Laws | 2 |
| SpPBnrQDif09xu0FV | Charge conservation | 0 |
| 26NIPG6VT4htvzvEX | Energy and momentum | 0 |
| uPYjDzoffgYX6m7BR | 5. Summary | 5 |
| S3FjGRhPk5K5Dtxmr | Positive-Q summary | 0 |
| oLCekxSpMtjYFPsRo | Final Answer | 1 |
| 5Hd4pAxbW7tj0rUIp | Final Answer child | 0 |
| H3tYXIr0mmdE0sAbD | Conservation summary | 0 |
| S9mpC92M8pWFwPxHD | Q-value summary | 0 |
| mgWh0QcBz1AYYpPmK | 3. Q-Value | 4 |
| L17nvO4Fxu4roxpnx | Exoergic statement | 0 |
| 7c2BgQ7ZvJ6U6vroe | Q-value equation | 0 |
| E5UwY5K1kwHWCuu9a | Q-value definition | 0 |
| iFVZFL3dhNbJdEm5l | Endoergic statement | 0 |


### Hashes

- **Combined normalized identity-keyed plain-text SHA-256:** `9cae509a0b619b2788de30213e79c12ad53e482cd460387d50c2574723ae24f5`
- **Total tree node count:** 27

| Formula | Rem ID | SHA-256 |
| --- | --- | --- |
| Δm=5.030−5.025=0.005 u | u4StnFy3qPtTxRAEr | 73338271ad7fab9308f7de54f83c492bc39cdce3a4c36b231bfddd19c856b27d |
| Q=0.005×931.5=4.6575 MeV | hA2P0KOfsHP3NHkZZ | 3a9af2bbd50c14a7a4a7df766dd444baea36304e5cd63cdddf009983e952faf6 |
| Q=(m_initial−m_final)c² | 7c2BgQ7ZvJ6U6vroe | 524bd1be1c637ce27e7e69c2d5dc9013773a48dcaa0028ee1326ffc4294ac59e |

## Section 8 — Desired final hierarchy

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   └── Nuclear reactions transform one set of nuclei into another.
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   ├── Mass number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 3. Q-Value
│   ├── The Q-value is the energy released or absorbed in a nuclear reaction.
│   ├── Q=(m_initial−m_final)c²
│   ├── Q>0 corresponds to an exoergic reaction.
│   └── Q<0 corresponds to an endoergic reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   ├── Calculation
│   │   ├── Δm=5.030−5.025=0.005 u
│   │   └── Q=0.005×931.5=4.6575 MeV
│   └── Final Answer
│       └── The reaction releases 4.6575 MeV.
└── 5. Summary
    ├── Nuclear reactions obey conservation laws.
    ├── The Q-value compares initial and final mass-energy.
    └── Positive Q indicates that energy is released.
```

| Defect | Current state | Required state | Required operation |
| --- | --- | --- | --- |
| Mass-number leaf | Child of Overview at index 1 | Child of Conservation Laws at index 1 | Move existing Rem |
| Final Answer subtree | Child of Summary at index 1 | Child of Worked Example at index 3 | Move existing subtree root |
| Principal sections | 1, 4, 2, 5, 3 | 1, 2, 3, 4, 5 | Complete-list reorder |
| Q-Value children | Exoergic, formula, definition, endoergic | Definition, formula, exoergic, endoergic | Complete-list reorder |
| Summary children | Positive Q, Final Answer, conservation, Q-value | Conservation, Q-value, positive Q after subtree move | Complete-list reorder |

## Section 9 — Unsafe-input probe plan

The plugin exposed identity-preserving `move_rem` and complete-list `reorder_children` capabilities. Both supported `dryRun`; `move_rem` additionally supported `expectedParentId` and `expectedAncestorId`. These mechanisms allowed all four invalid-input probes to be non-destructive.


| Probe | Target | Invalid input | Expected handling | Required readback |
| --- | --- | --- | --- | --- |
| A | 30bCQVzsgX0jm5OfY | Complete-list reorder omitting Summary `uPYjDzoffgYX6m7BR` | Reject before mutation | Lesson root direct children |
| B | JC5b9oMYvW5nHhepW | Expected parent Q-Value instead of live Overview | Reject guard mismatch | Overview, Conservation Laws, target breadcrumb |
| C | 30bCQVzsgX0jm5OfY | Move lesson beneath descendant Overview | Reject cycle | Lesson breadcrumb |
| D | mgWh0QcBz1AYYpPmK | Insertion index 99; valid maximum 4 | Reject before mutation | Lesson root order |

## Section 10 — Negative Probe A result


| Field | Value |
| --- | --- |
| Parent ID | 30bCQVzsgX0jm5OfY |
| Actual complete child list | LJeAQ7OR6RzjiQJiY, zWzAONTY5cZXqjC2Z, rv7Q2cOIUobHuy4am, uPYjDzoffgYX6m7BR, mgWh0QcBz1AYYpPmK |
| Incomplete submitted list | LJeAQ7OR6RzjiQJiY, rv7Q2cOIUobHuy4am, mgWh0QcBz1AYYpPmK, zWzAONTY5cZXqjC2Z |
| Missing child | uPYjDzoffgYX6m7BR — 5. Summary |
| Response | `orderedChildRemIds must contain exactly the current direct child IDs.` |
| Error classification | INVALID_ARGS; structural complete-set validation |
| Operation ID | 1cd0ca83-4848-486c-ab65-833cc77e7e02 |
| Latency | 313 ms |
| Post-probe child list | All five children in exact original baseline order |
| Mutation count | 0 created, 0 updated, 0 deleted |
| Probe classification | REJECTED_SAFELY |

## Section 11 — Negative Probe B result


| Field | Value |
| --- | --- |
| Target Rem ID | JC5b9oMYvW5nHhepW |
| Actual current parent | LJeAQ7OR6RzjiQJiY — 1. Overview |
| Intentionally incorrect expected parent | mgWh0QcBz1AYYpPmK — 3. Q-Value |
| Proposed destination | rv7Q2cOIUobHuy4am — 2. Conservation Laws, index 1 |
| Response | `expectedParentId did not match current parent.` |
| Error classification | INVALID_ARGS; expected-parent guard |
| Operation ID | 6f59df1a-a57e-473f-ba52-c5397b1dc13b |
| Latency | 299 ms |
| Post-probe parent | LJeAQ7OR6RzjiQJiY — 1. Overview |
| Related-parent readbacks | Overview remained 2 children; Conservation remained 2 children; target breadcrumb unchanged |
| Probe classification | REJECTED_SAFELY |

## Section 12 — Negative Probe C result


| Field | Value |
| --- | --- |
| Proposed ancestor | 30bCQVzsgX0jm5OfY — lesson root |
| Proposed descendant | LJeAQ7OR6RzjiQJiY — 1. Overview |
| Cycle relationship | Overview is a direct child of the lesson root; moving the lesson under Overview would make it its own descendant |
| Response | `Cannot move a Rem into its descendant.` |
| Error classification | INVALID_ARGS; cycle prevention |
| Operation ID | 08f0d036-191e-47a8-9373-e335bda3eddc |
| Latency | 160 ms |
| Post-probe hierarchy | Lesson remained beneath Test 10 root; root order unchanged |
| Probe classification | REJECTED_SAFELY |

## Section 13 — Negative Probe D result


| Field | Value |
| --- | --- |
| Target Rem ID | mgWh0QcBz1AYYpPmK — 3. Q-Value |
| Destination parent | 30bCQVzsgX0jm5OfY |
| Invalid index | 99 |
| Valid index range | 0–4 for this same-parent move |
| Response | `index is outside the target parent child range.` |
| Error classification or clamping behavior | INVALID_ARGS; strict rejection; no clamping |
| Operation ID | 7425bb1d-3ff6-4184-a339-356e7d1676e2 |
| Latency | 633 ms |
| Post-probe order | Overview, Worked Example, Conservation Laws, Summary, Q-Value |
| Probe classification | REJECTED_SAFELY |

## Section 14 — Post-probe baseline integrity

| Integrity item | Baseline | After probes | Status |
| --- | --- | --- | --- |
| Total Rem IDs | 27 | 27, identical set | PASS |
| Total node count | 27 | 27 | PASS |
| Root order | Overview, Worked, Conservation, Summary, Q-Value | Same | PASS |
| Overview children | Transform, Mass number | Same | PASS |
| Conservation children | Charge, Total energy | Same | PASS |
| Q-Value children | Exoergic, equation, definition, endoergic | Same | PASS |
| Worked Example children | Problem, Given, Calculation | Same | PASS |
| Summary children | Positive Q, Final Answer, conservation, Q-value | Same | PASS |
| Formula texts | 3 exact strings | All 3 exact | PASS |
| Duplicate count | 0 | 0 | PASS |


**Safe to begin valid surgery:** Yes. The full-tree read after all probes was identical to the captured baseline.

## Section 15 — Valid surgery plan and preview

| Step | Existing Rem or parent | Live ID | Current state | Intended state | Operation type | Preview |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Mass-number Rem | JC5b9oMYvW5nHhepW | Overview index 1 | Conservation Laws index 1 | Guarded move | PASS |
| 2 | Final Answer subtree | oLCekxSpMtjYFPsRo | Summary index 1 | Worked Example index 3 | Guarded subtree move | PASS |
| 3 | Lesson root | 30bCQVzsgX0jm5OfY | 1,4,2,5,3 | 1,2,3,4,5 | Complete-list reorder | PASS |
| 4 | Q-Value | mgWh0QcBz1AYYpPmK | Exo, formula, definition, endo | Definition, formula, exo, endo | Complete-list reorder | PASS |
| 5 | Summary | uPYjDzoffgYX6m7BR | Positive, conservation, Q-value after move | Conservation, Q-value, positive | Complete-list reorder | PASS after subtree move |


### Guard and set checks

- Mass-number expected current parent: `LJeAQ7OR6RzjiQJiY`.
- Final Answer expected current parent: `uPYjDzoffgYX6m7BR`.
- Expected ancestor for both valid moves: lesson root `30bCQVzsgX0jm5OfY`.
- Root reorder desired ID set equaled the current five-child set.
- Q-Value reorder desired ID set equaled the current four-child set.
- Summary reorder was previewed only after Final Answer moved, so its desired three-ID set equaled the live remaining three-child set.
- All indexes were in range.
- Both move previews returned the expected before and after parents.
- All reorder previews returned zero missing IDs and zero extra IDs.
- No preview proposed text edits, creations, deletions, duplicates, or cycles.

## Section 16 — Chronological operation log

| # | Phase | Tool or capability | Purpose | Target | Status | Operation ID | Idempotency key | Latency | Warning/error |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Scope | get_bridge_status | Confirm companion bridge and deployment metadata | Bridge | PASS | status-mri25gb2 | — | 4 | — |
| 2 | Scope | get_plugin_status | Confirm live plugin, permissions, focus, and sync | Plugin session | PASS | 94a19404-2b04-4f3c-bde3-ce1edbe501fd | — | 208 | approvedRootRemId was null; focus evidence exact |
| 3 | Scope | get_focused_rem | Read focused Rem | Plugin Test | PASS | 08c0adbc-044f-4141-8c8a-8a70f84d2ff0 | — | 31 | — |
| 4 | Scope | get_current_selection | Read current selection | Plugin Test | PASS | a8170b2e-01af-4083-9ec4-758bcaced7d6 | — | 29 | — |
| 5 | Scope | get_rem_breadcrumbs | Confirm approved-root breadcrumb | Plugin Test | PASS | 8a9ec38b-c6b1-40c7-ab70-d395730a6a0a | — | 112 | — |
| 6 | Scope | get_children | Capture approved-root children before creation | Plugin Test | PASS | d922a1db-28b1-4835-960e-80048bbf53f1 | — | 1521 | Slowest operation |
| 7 | Collision | search_rems | Check exact Test 10 Run 01 title collision | Plugin Test subtree | PASS | a580fe6f-d808-404c-9415-6dbc6c9fb360 | — | 924 | Fuzzy results only; zero exact collision |
| 8 | Create root | create_rem | Create exactly one Test 10 root | Plugin Test | PASS | a9fa5773-3ae1-4151-a967-4173da432d19 | test10-root-20260712-run01 | 573 | — |
| 9 | Create baseline | Local schema validation | First structured-tree payload used unsupported `text` key | No RemNote target | FAIL_PRE_MUTATION | NOT RETURNED | test10-baseline-20260712-run01 | NOT RETURNED | Rejected locally; zero RemNote mutation |
| 10 | Create baseline | create_rem_tree | Create exact 27-Rem damaged fixture | Test 10 root | PASS | 336fee75-6e67-4a88-8ca1-45357925e9d3 | test10-baseline-20260712-run01 | 838 | — |
| 11 | Baseline verify | get_rem_tree | Capture complete baseline tree | Lesson root | PASS | 9738ccf9-c27d-412f-af66-2eeea7836794 | — | 702 | — |
| 12 | Baseline verify | get_children | Verify exactly one lesson beneath Test 10 root | Test 10 root | PASS | 16401971-ba72-4304-899e-2f4695c04a2c | — | 319 | — |
| 13 | Scope | get_rem_breadcrumbs | Prove Test 10 root is under approved root | Test 10 root | PASS | 9c36db31-9f83-4bcf-aa66-fc00291c4f4c | — | 255 | — |
| 14 | Baseline formula | get_rem_rich | Read Q-value equation rich text | 7c2BgQ7ZvJ6U6vroe | PASS | 145131f7-043e-4c02-9e9c-7d761a980c22 | — | 50 | — |
| 15 | Baseline formula | get_rem_rich | Read mass-difference rich text | u4StnFy3qPtTxRAEr | PASS | e3f540dd-c0a8-4ce9-8907-144661e7e8b6 | — | 193 | — |
| 16 | Baseline formula | get_rem_rich | Read Q calculation rich text | hA2P0KOfsHP3NHkZZ | PASS | 9698930f-c4ea-4212-925d-c1b354edc3a2 | — | 47 | — |
| 17 | Baseline audit | analyze_note_design | Audit cards, wrappers, delimiters, and metadata pollution | Lesson root | PASS | b741c0ac-6a44-4137-9401-315f8f72ab6b | — | 141 | — |
| 18 | Probe A | reorder_children dry-run | Submit incomplete child-order list | Lesson root | REJECTED_SAFELY | 1cd0ca83-4848-486c-ab65-833cc77e7e02 | test10-probe-a-incomplete-order-20260712-run01 | 313 | Error layer mislabeled plugin_permission |
| 19 | Probe A verify | get_children | Verify complete baseline root order remains | Lesson root | PASS | 3a054c73-cd8b-4530-b4a7-7c9053317609 | — | 924 | — |
| 20 | Probe B | move_rem guarded | Use incorrect expected parent | Mass-number Rem | REJECTED_SAFELY | 6f59df1a-a57e-473f-ba52-c5397b1dc13b | test10-probe-b-wrong-parent-20260712-run01 | 299 | Error layer mislabeled plugin_permission |
| 21 | Probe B verify | get_children | Verify Overview unchanged | Overview | PASS | 99407fcd-9d0f-4e16-9361-f1324e9af649 | — | 677 | — |
| 22 | Probe B verify | get_children | Verify Conservation Laws unchanged | Conservation Laws | PASS | 602c9e89-03a1-4c02-9c65-54c59966d5fa | — | 1449 | — |
| 23 | Probe B verify | get_rem_breadcrumbs | Verify target still beneath Overview | Mass-number Rem | PASS | db4efaa6-b4d6-4f65-a401-6c7eef5fbbe8 | — | 91 | — |
| 24 | Probe C | move_rem dry-run | Attempt cycle: lesson beneath Overview | Lesson root | REJECTED_SAFELY | 08f0d036-191e-47a8-9373-e335bda3eddc | test10-probe-c-cycle-20260712-run01 | 160 | Error layer mislabeled plugin_permission |
| 25 | Probe C verify | get_rem_breadcrumbs | Verify lesson parent unchanged | Lesson root | PASS | bcdaefad-e6fd-4dd5-8158-f58964c6174a | — | 105 | — |
| 26 | Probe D | move_rem dry-run | Use insertion index 99 | Q-Value | REJECTED_SAFELY | 7425bb1d-3ff6-4184-a339-356e7d1676e2 | test10-probe-d-index99-20260712-run01 | 633 | Error layer mislabeled plugin_permission |
| 27 | Probe D verify | get_children | Verify root order unchanged | Lesson root | PASS | 2765f570-1f6c-421b-998a-6d68fe553a56 | — | 62 | — |
| 28 | Post-probe gate | get_rem_tree | Verify complete baseline after all probes | Lesson root | PASS | bdd8a19c-24b1-401e-90ff-d4bb258255ed | — | 142 | — |
| 29 | Preview | move_rem dry-run | Preview mass-number move | Mass-number Rem | PASS | d59c41d3-224b-4add-9b60-69bdf14463fb | test10-preview-mass-move-20260712-run01 | 632 | — |
| 30 | Preview | move_rem dry-run | Preview Final Answer subtree move | Final Answer | PASS | 87653409-2689-4b2b-91cf-24cb5d3ee7dc | test10-preview-final-answer-move-20260712-run01 | 50 | — |
| 31 | Preview | reorder_children dry-run | Preview principal-section reorder | Lesson root | PASS | 99c276e4-e92e-43c3-b62b-4888a1dee78e | test10-preview-root-reorder-20260712-run01 | 39 | — |
| 32 | Preview | reorder_children dry-run | Preview Q-Value reorder | Q-Value | PASS | 53998d02-72e9-4c4c-8775-f550e74caf70 | test10-preview-qvalue-reorder-20260712-run01 | 344 | — |
| 33 | Mass move preread | get_children | Reread source parent | Overview | PASS | b74b0097-df28-4e1c-bb10-ac10d36d3b8b | — | 263 | — |
| 34 | Mass move preread | get_children | Reread destination parent | Conservation Laws | PASS | 50e2159f-33e0-404e-9231-2d22c2b4a4ec | — | 121 | — |
| 35 | Mass move preread | get_rem_breadcrumbs | Reread target live parent | Mass-number Rem | PASS | 0d70a632-e5da-486b-ba3b-d29d9cd0128e | — | 49 | — |
| 36 | Valid move | move_rem guarded | Move existing leaf with expected-parent guard | Mass-number Rem | PASS | 780392a1-13a1-478b-a9b8-cf3f60a87981 | test10-mass-move-20260712-run01 | 625 | — |
| 37 | Mass move verify | get_children | Read source parent after move | Overview | PASS | 254e40e9-4651-4a76-9aab-c409a81bf6f6 | — | 639 | — |
| 38 | Mass move verify | get_children | Read destination parent after move | Conservation Laws | PASS | 3a702bca-727e-4f77-8a04-f2d7e8f01da4 | — | 113 | — |
| 39 | Subtree preread | get_children | Reread source parent | Summary | PASS | ef1a628a-dd2f-4efb-9f76-7adfc195b95e | — | 77 | — |
| 40 | Subtree preread | get_children | Reread destination parent | Worked Example | PASS | 2340a9a9-f788-4701-b98f-102167b787c2 | — | 59 | — |
| 41 | Subtree preread | get_children | Verify Final Answer child attachment | Final Answer | PASS | 1fcca7ed-657b-4fc0-ac67-b3f0a8b48d4e | — | 45 | — |
| 42 | Valid move | move_rem guarded | Move existing Final Answer subtree | Final Answer | PASS | 4d2a1a0b-f2c5-4af3-a511-14616df42f19 | test10-final-answer-move-20260712-run01 | 74 | — |
| 43 | Subtree verify | get_children | Read Summary after move | Summary | PASS | 99504e34-15ba-44a5-8aaa-0a6ca4f49ac7 | — | 1436 | — |
| 44 | Subtree verify | get_children | Read Worked Example after move | Worked Example | PASS | 9b0ddf85-e687-4391-9e80-4789831c8e89 | — | 667 | — |
| 45 | Root reorder preread | get_children | Reread complete current root list | Lesson root | PASS | ac1557f2-bedf-4507-a034-10ef8856e9d1 | — | 66 | — |
| 46 | Valid reorder | reorder_children | Apply complete principal-section order | Lesson root | PASS | 8e717c41-3bb3-4a55-81c8-e90791043623 | test10-root-reorder-20260712-run01 | 462 | — |
| 47 | Root reorder verify | get_children | Read principal sections after reorder | Lesson root | PASS | 2def011d-3576-4bb4-b2c9-835aaab0ff54 | — | 264 | — |
| 48 | Q reorder preread | get_children | Reread complete current Q-Value list | Q-Value | PASS | a0aaf36f-bc66-43eb-8fa1-b8a7a20c1965 | — | 973 | — |
| 49 | Valid reorder | reorder_children | Apply complete Q-Value order | Q-Value | PASS | ffdba8b6-f9e9-4cde-a2ad-e54abc90f1c7 | test10-qvalue-reorder-20260712-run01 | 339 | — |
| 50 | Q reorder verify | get_children | Read Q-Value children after reorder | Q-Value | PASS | 3216e05e-fdfa-4ed9-900b-18df9ce634b4 | — | 393 | — |
| 51 | Preview | reorder_children dry-run | Preview Summary after subtree move changed its child set | Summary | PASS | 8f8e9940-3a05-4089-86a4-b43f36865770 | test10-preview-summary-reorder-20260712-run01 | 521 | — |
| 52 | Valid reorder | reorder_children | Apply complete Summary order | Summary | PASS | 22de92bf-4f67-47db-ae73-bd63743b047f | test10-summary-reorder-20260712-run01 | 768 | — |
| 53 | Summary verify | get_children | Read Summary after reorder | Summary | PASS | 4ce235bd-de05-427d-9456-fccc9f0a9d34 | — | 657 | — |
| 54 | Final verify | get_rem_tree | Read complete final lesson tree | Lesson root | PASS | 466e698f-614d-4940-a0da-4c9f3b9aea66 | — | 355 | — |
| 55 | Final formula | get_rem_rich | Verify Q-value equation rich text | 7c2BgQ7ZvJ6U6vroe | PASS | 646af886-e916-4c1d-b480-41e7551ad779 | — | 55 | — |
| 56 | Final formula | get_rem_rich | Verify mass-difference rich text | u4StnFy3qPtTxRAEr | PASS | 9b680fd3-47af-47b0-921e-2f020b6c381e | — | 49 | — |
| 57 | Final formula | get_rem_rich | Verify Q calculation rich text | hA2P0KOfsHP3NHkZZ | PASS | d3997c6a-bf42-4b3b-be34-906553d5ac2c | — | 42 | — |
| 58 | Final audit | analyze_note_design | Audit final cards, wrappers, delimiters, and pollution | Lesson root | PASS | bfdadbe4-1828-468c-8569-beb5e501e7d7 | — | 261 | — |
| 59 | Duplicate audit | search_rems | Search exact moved-leaf text | Test 10 root | PASS | 82e0e8f8-fbdd-4d8a-bd6d-61f91818ff4e | — | 318 | One exact match; additional results were fuzzy |
| 60 | Duplicate audit | search_rems | Search Final Answer | Test 10 root | PASS | 5c211ab0-9514-4c81-8df1-2ceed184f262 | — | 522 | One exact match |
| 61 | Duplicate audit | search_rems | Search Final Answer child | Test 10 root | PASS | 08bac487-0067-4781-be0e-89412c32f3d5 | — | 282 | One exact match |
| 62 | Search limitation | search_rems | Search exact symbol-heavy Q equation | Test 10 root | PASS_WITH_WARNING | 39fd0096-89ee-45ac-8289-ad60ad9dc951 | — | 74 | Zero search hits despite direct rich/tree proof |
| 63 | Final scope | get_children | Confirm one Test 10 root and final approved-root child count | Plugin Test | PASS | 9789c702-d4f7-4300-918f-f06a7d0e792b | — | 224 | — |
| 64 | Final scope | get_plugin_status | Confirm stable connection and unchanged focus | Plugin session | PASS | c22f6010-59ba-4f95-b075-d34027f34eb3 | — | 76 | — |

## Section 17 — Mass-number move result

| Property | Baseline | Required final | Observed final | Status |
| --- | --- | --- | --- | --- |
| Rem ID | JC5b9oMYvW5nHhepW | Same | JC5b9oMYvW5nHhepW | PASS |
| Plain text | Mass number is conserved in a nuclear reaction. | Same | Exact same | PASS |
| Parent | Overview | Conservation Laws | Conservation Laws | PASS |
| Position | Index 1 under Overview | Index 1 under Conservation | Index 1 under Conservation | PASS |
| Descendants | 0 | 0 | 0 | PASS |
| Duplicate count | 0 | 0 | 0 | PASS |

## Section 18 — Final Answer subtree move result

| Property | Baseline | Required final | Observed final | Status |
| --- | --- | --- | --- | --- |
| Final Answer Rem ID | oLCekxSpMtjYFPsRo | Same | oLCekxSpMtjYFPsRo | PASS |
| Child Rem ID | 5Hd4pAxbW7tj0rUIp | Same | 5Hd4pAxbW7tj0rUIp | PASS |
| Parent | Summary | Worked Example | Worked Example | PASS |
| Position | Index 1 under Summary | After Calculation, index 3 | Index 3 after Calculation | PASS |
| Child attachment | Present | Preserved | Preserved at index 0 | PASS |
| Duplicate count | 0 | 0 | 0 | PASS |

## Section 19 — Principal-section reorder result

| Position | Required section | Rem ID | Observed position | Status |
| --- | --- | --- | --- | --- |
| 1 | 1. Overview | LJeAQ7OR6RzjiQJiY | 1 | PASS |
| 2 | 2. Conservation Laws | rv7Q2cOIUobHuy4am | 2 | PASS |
| 3 | 3. Q-Value | mgWh0QcBz1AYYpPmK | 3 | PASS |
| 4 | 4. Worked Example | zWzAONTY5cZXqjC2Z | 4 | PASS |
| 5 | 5. Summary | uPYjDzoffgYX6m7BR | 5 | PASS |

## Section 20 — Q-Value reorder result

| Position | Required child | Rem ID | Observed position | Status |
| --- | --- | --- | --- | --- |
| 1 | The Q-value is the energy released or absorbed in a nuclear reaction. | E5UwY5K1kwHWCuu9a | 1 | PASS |
| 2 | Q=(m_initial−m_final)c² | 7c2BgQ7ZvJ6U6vroe | 2 | PASS |
| 3 | Q>0 corresponds to an exoergic reaction. | L17nvO4Fxu4roxpnx | 3 | PASS |
| 4 | Q<0 corresponds to an endoergic reaction. | iFVZFL3dhNbJdEm5l | 4 | PASS |

## Section 21 — Summary reorder result

| Position | Required child | Rem ID | Observed position | Status |
| --- | --- | --- | --- | --- |
| 1 | Nuclear reactions obey conservation laws. | H3tYXIr0mmdE0sAbD | 1 | PASS |
| 2 | The Q-value compares initial and final mass-energy. | S9mpC92M8pWFwPxHD | 2 | PASS |
| 3 | Positive Q indicates that energy is released. | S3FjGRhPk5K5Dtxmr | 3 | PASS |

## Section 22 — Complete final hierarchy verification

### Required final hierarchy

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   └── Nuclear reactions transform one set of nuclei into another.
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   ├── Mass number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 3. Q-Value
│   ├── The Q-value is the energy released or absorbed in a nuclear reaction.
│   ├── Q=(m_initial−m_final)c²
│   ├── Q>0 corresponds to an exoergic reaction.
│   └── Q<0 corresponds to an endoergic reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   ├── Calculation
│   │   ├── Δm=5.030−5.025=0.005 u
│   │   └── Q=0.005×931.5=4.6575 MeV
│   └── Final Answer
│       └── The reaction releases 4.6575 MeV.
└── 5. Summary
    ├── Nuclear reactions obey conservation laws.
    ├── The Q-value compares initial and final mass-energy.
    └── Positive Q indicates that energy is released.
```

### Observed final hierarchy

```text
Hierarchy Surgery Fixture — Nuclear Reactions
├── 1. Overview
│   └── Nuclear reactions transform one set of nuclei into another.
├── 2. Conservation Laws
│   ├── Charge number is conserved in a nuclear reaction.
│   ├── Mass number is conserved in a nuclear reaction.
│   └── Total energy and momentum are conserved in a nuclear reaction.
├── 3. Q-Value
│   ├── The Q-value is the energy released or absorbed in a nuclear reaction.
│   ├── Q=(m_initial−m_final)c²
│   ├── Q>0 corresponds to an exoergic reaction.
│   └── Q<0 corresponds to an endoergic reaction.
├── 4. Worked Example
│   ├── Problem
│   │   └── A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value.
│   ├── Given
│   │   ├── m_initial=5.030 u
│   │   └── m_final=5.025 u
│   ├── Calculation
│   │   ├── Δm=5.030−5.025=0.005 u
│   │   └── Q=0.005×931.5=4.6575 MeV
│   └── Final Answer
│       └── The reaction releases 4.6575 MeV.
└── 5. Summary
    ├── Nuclear reactions obey conservation laws.
    ├── The Q-value compares initial and final mass-energy.
    └── Positive Q indicates that energy is released.
```

### Line-by-line comparison

- Missing Rems: 0.
- Extra Rems: 0.
- Wrong parents: 0.
- Wrong sibling order: 0.
- Detached descendants: 0.
- Flattened descendants: 0.
- Node count: 27 required, 27 observed.
- **Final hierarchy verdict:** `PASS`.

## Section 23 — Rem ID preservation audit

| Original Rem | Baseline Rem ID | Final Rem ID | Present exactly once | Status |
| --- | --- | --- | --- | --- |
| Lesson root | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | Yes | PASS |
| 1. Overview | LJeAQ7OR6RzjiQJiY | LJeAQ7OR6RzjiQJiY | Yes | PASS |
| Overview statement | riKuJu3oZVTKK4i4G | riKuJu3oZVTKK4i4G | Yes | PASS |
| Mass-number statement | JC5b9oMYvW5nHhepW | JC5b9oMYvW5nHhepW | Yes | PASS |
| 4. Worked Example | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | Yes | PASS |
| Problem | uLE4NGD6Uzj9j97mX | uLE4NGD6Uzj9j97mX | Yes | PASS |
| Problem statement | u0myAdy9U2y8249k6 | u0myAdy9U2y8249k6 | Yes | PASS |
| Given | lucOzns2mMmq7o1Lp | lucOzns2mMmq7o1Lp | Yes | PASS |
| Initial mass | MBUJRBBlcDyGraTbE | MBUJRBBlcDyGraTbE | Yes | PASS |
| Final mass | yiASBgMHDS3uozxhg | yiASBgMHDS3uozxhg | Yes | PASS |
| Calculation | NgQrVhhuddXIzOye7 | NgQrVhhuddXIzOye7 | Yes | PASS |
| Mass-difference formula | u4StnFy3qPtTxRAEr | u4StnFy3qPtTxRAEr | Yes | PASS |
| Q calculation | hA2P0KOfsHP3NHkZZ | hA2P0KOfsHP3NHkZZ | Yes | PASS |
| 2. Conservation Laws | rv7Q2cOIUobHuy4am | rv7Q2cOIUobHuy4am | Yes | PASS |
| Charge conservation | SpPBnrQDif09xu0FV | SpPBnrQDif09xu0FV | Yes | PASS |
| Energy and momentum | 26NIPG6VT4htvzvEX | 26NIPG6VT4htvzvEX | Yes | PASS |
| 5. Summary | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | Yes | PASS |
| Positive-Q summary | S3FjGRhPk5K5Dtxmr | S3FjGRhPk5K5Dtxmr | Yes | PASS |
| Final Answer | oLCekxSpMtjYFPsRo | oLCekxSpMtjYFPsRo | Yes | PASS |
| Final Answer child | 5Hd4pAxbW7tj0rUIp | 5Hd4pAxbW7tj0rUIp | Yes | PASS |
| Conservation summary | H3tYXIr0mmdE0sAbD | H3tYXIr0mmdE0sAbD | Yes | PASS |
| Q-value summary | S9mpC92M8pWFwPxHD | S9mpC92M8pWFwPxHD | Yes | PASS |
| 3. Q-Value | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | Yes | PASS |
| Exoergic statement | L17nvO4Fxu4roxpnx | L17nvO4Fxu4roxpnx | Yes | PASS |
| Q-value equation | 7c2BgQ7ZvJ6U6vroe | 7c2BgQ7ZvJ6U6vroe | Yes | PASS |
| Q-value definition | E5UwY5K1kwHWCuu9a | E5UwY5K1kwHWCuu9a | Yes | PASS |
| Endoergic statement | iFVZFL3dhNbJdEm5l | iFVZFL3dhNbJdEm5l | Yes | PASS |


- **Total original Rem IDs:** 27
- **IDs found exactly once:** 27
- **Missing IDs:** 0
- **Duplicated IDs:** 0
- **New unexpected lesson-tree IDs:** 0
- **Rem Identity Preservation Rate:** 27/27 × 100 = **100.00%**

## Section 24 — Plain-text preservation audit

| Rem ID | Baseline text | Final text | Expected change | Status |
| --- | --- | --- | --- | --- |
| 30bCQVzsgX0jm5OfY | Hierarchy Surgery Fixture — Nuclear Reactions | Hierarchy Surgery Fixture — Nuclear Reactions | None | PASS |
| LJeAQ7OR6RzjiQJiY | 1. Overview | 1. Overview | None | PASS |
| riKuJu3oZVTKK4i4G | Nuclear reactions transform one set of nuclei into another. | Nuclear reactions transform one set of nuclei into another. | None | PASS |
| JC5b9oMYvW5nHhepW | Mass number is conserved in a nuclear reaction. | Mass number is conserved in a nuclear reaction. | None | PASS |
| zWzAONTY5cZXqjC2Z | 4. Worked Example | 4. Worked Example | None | PASS |
| uLE4NGD6Uzj9j97mX | Problem | Problem | None | PASS |
| u0myAdy9U2y8249k6 | A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value. | A reaction has an initial mass of 5.030 u and a final mass of 5.025 u. Determine the Q-value. | None | PASS |
| lucOzns2mMmq7o1Lp | Given | Given | None | PASS |
| MBUJRBBlcDyGraTbE | m_initial=5.030 u | m_initial=5.030 u | None | PASS |
| yiASBgMHDS3uozxhg | m_final=5.025 u | m_final=5.025 u | None | PASS |
| NgQrVhhuddXIzOye7 | Calculation | Calculation | None | PASS |
| u4StnFy3qPtTxRAEr | Δm=5.030−5.025=0.005 u | Δm=5.030−5.025=0.005 u | None | PASS |
| hA2P0KOfsHP3NHkZZ | Q=0.005×931.5=4.6575 MeV | Q=0.005×931.5=4.6575 MeV | None | PASS |
| rv7Q2cOIUobHuy4am | 2. Conservation Laws | 2. Conservation Laws | None | PASS |
| SpPBnrQDif09xu0FV | Charge number is conserved in a nuclear reaction. | Charge number is conserved in a nuclear reaction. | None | PASS |
| 26NIPG6VT4htvzvEX | Total energy and momentum are conserved in a nuclear reaction. | Total energy and momentum are conserved in a nuclear reaction. | None | PASS |
| uPYjDzoffgYX6m7BR | 5. Summary | 5. Summary | None | PASS |
| S3FjGRhPk5K5Dtxmr | Positive Q indicates that energy is released. | Positive Q indicates that energy is released. | None | PASS |
| oLCekxSpMtjYFPsRo | Final Answer | Final Answer | None | PASS |
| 5Hd4pAxbW7tj0rUIp | The reaction releases 4.6575 MeV. | The reaction releases 4.6575 MeV. | None | PASS |
| H3tYXIr0mmdE0sAbD | Nuclear reactions obey conservation laws. | Nuclear reactions obey conservation laws. | None | PASS |
| S9mpC92M8pWFwPxHD | The Q-value compares initial and final mass-energy. | The Q-value compares initial and final mass-energy. | None | PASS |
| mgWh0QcBz1AYYpPmK | 3. Q-Value | 3. Q-Value | None | PASS |
| L17nvO4Fxu4roxpnx | Q>0 corresponds to an exoergic reaction. | Q>0 corresponds to an exoergic reaction. | None | PASS |
| 7c2BgQ7ZvJ6U6vroe | Q=(m_initial−m_final)c² | Q=(m_initial−m_final)c² | None | PASS |
| E5UwY5K1kwHWCuu9a | The Q-value is the energy released or absorbed in a nuclear reaction. | The Q-value is the energy released or absorbed in a nuclear reaction. | None | PASS |
| iFVZFL3dhNbJdEm5l | Q<0 corresponds to an endoergic reaction. | Q<0 corresponds to an endoergic reaction. | None | PASS |


- **Total original Rems:** 27
- **Exact text preserved:** 27
- **Unexpected text changes:** 0
- **Normalization differences:** 0
- **Baseline normalized manifest SHA-256:** `9cae509a0b619b2788de30213e79c12ad53e482cd460387d50c2574723ae24f5`
- **Final normalized manifest SHA-256:** `9cae509a0b619b2788de30213e79c12ad53e482cd460387d50c2574723ae24f5`
- **Plain-Text Preservation Rate:** 27/27 × 100 = **100.00%**

## Section 25 — Parent-edge and order audit

### Complete parent-edge table


| Rem | Baseline parent | Required final parent | Observed final parent | Expected edge change? | Status |
| --- | --- | --- | --- | --- | --- |
| Lesson root | gfQ1PY6dGLMPTIARw | gfQ1PY6dGLMPTIARw | gfQ1PY6dGLMPTIARw | No | PASS |
| 1. Overview | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | No | PASS |
| Overview statement | LJeAQ7OR6RzjiQJiY | LJeAQ7OR6RzjiQJiY | LJeAQ7OR6RzjiQJiY | No | PASS |
| Mass-number statement | LJeAQ7OR6RzjiQJiY | rv7Q2cOIUobHuy4am | rv7Q2cOIUobHuy4am | Yes | PASS |
| 4. Worked Example | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | No | PASS |
| Problem | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | No | PASS |
| Problem statement | uLE4NGD6Uzj9j97mX | uLE4NGD6Uzj9j97mX | uLE4NGD6Uzj9j97mX | No | PASS |
| Given | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | No | PASS |
| Initial mass | lucOzns2mMmq7o1Lp | lucOzns2mMmq7o1Lp | lucOzns2mMmq7o1Lp | No | PASS |
| Final mass | lucOzns2mMmq7o1Lp | lucOzns2mMmq7o1Lp | lucOzns2mMmq7o1Lp | No | PASS |
| Calculation | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | No | PASS |
| Mass-difference formula | NgQrVhhuddXIzOye7 | NgQrVhhuddXIzOye7 | NgQrVhhuddXIzOye7 | No | PASS |
| Q calculation | NgQrVhhuddXIzOye7 | NgQrVhhuddXIzOye7 | NgQrVhhuddXIzOye7 | No | PASS |
| 2. Conservation Laws | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | No | PASS |
| Charge conservation | rv7Q2cOIUobHuy4am | rv7Q2cOIUobHuy4am | rv7Q2cOIUobHuy4am | No | PASS |
| Energy and momentum | rv7Q2cOIUobHuy4am | rv7Q2cOIUobHuy4am | rv7Q2cOIUobHuy4am | No | PASS |
| 5. Summary | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | No | PASS |
| Positive-Q summary | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | No | PASS |
| Final Answer | uPYjDzoffgYX6m7BR | zWzAONTY5cZXqjC2Z | zWzAONTY5cZXqjC2Z | Yes | PASS |
| Final Answer child | oLCekxSpMtjYFPsRo | oLCekxSpMtjYFPsRo | oLCekxSpMtjYFPsRo | No | PASS |
| Conservation summary | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | No | PASS |
| Q-value summary | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | uPYjDzoffgYX6m7BR | No | PASS |
| 3. Q-Value | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | 30bCQVzsgX0jm5OfY | No | PASS |
| Exoergic statement | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | No | PASS |
| Q-value equation | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | No | PASS |
| Q-value definition | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | No | PASS |
| Endoergic statement | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | mgWh0QcBz1AYYpPmK | No | PASS |


### Required parent-order readbacks


| Parent | Required ordered children | Observed ordered children | Exact match | Status |
| --- | --- | --- | --- | --- |
| Lesson root | Overview; Conservation; Q-Value; Worked Example; Summary | Overview; Conservation; Q-Value; Worked Example; Summary | Yes | PASS |
| Overview | Transform statement | Transform statement | Yes | PASS |
| Conservation Laws | Charge; Mass number; Total energy and momentum | Charge; Mass number; Total energy and momentum | Yes | PASS |
| Q-Value | Definition; equation; exoergic; endoergic | Definition; equation; exoergic; endoergic | Yes | PASS |
| Worked Example | Problem; Given; Calculation; Final Answer | Problem; Given; Calculation; Final Answer | Yes | PASS |
| Summary | Conservation summary; Q-value summary; Positive Q | Conservation summary; Q-value summary; Positive Q | Yes | PASS |
| Final Answer | The reaction releases 4.6575 MeV. | The reaction releases 4.6575 MeV. | Yes | PASS |


- **Unaffected-parent confirmation:** Problem, Given, Calculation, and Final Answer child edges and orders remained unchanged.
- **Parent-Edge Accuracy Rate:** 26/26 non-root Rems have the required final parent = **100.00%**.
- **Affected-Parent Order Accuracy Rate:** 7/7 required parent readback lists exact = **100.00%**. The three explicit reorder operations were 3/3 correct; all five directly changed parent lists were 5/5 correct.

## Section 26 — Child-count and descendant audit

| Parent or Rem | Baseline count | Expected final count | Observed final count | Status |
| --- | --- | --- | --- | --- |
| Lesson root | 5 | 5 | 5 | PASS |
| 1. Overview | 2 | 1 | 1 | PASS |
| Overview statement | 0 | 0 | 0 | PASS |
| Mass-number statement | 0 | 0 | 0 | PASS |
| 4. Worked Example | 3 | 4 | 4 | PASS |
| Problem | 1 | 1 | 1 | PASS |
| Problem statement | 0 | 0 | 0 | PASS |
| Given | 2 | 2 | 2 | PASS |
| Initial mass | 0 | 0 | 0 | PASS |
| Final mass | 0 | 0 | 0 | PASS |
| Calculation | 2 | 2 | 2 | PASS |
| Mass-difference formula | 0 | 0 | 0 | PASS |
| Q calculation | 0 | 0 | 0 | PASS |
| 2. Conservation Laws | 2 | 3 | 3 | PASS |
| Charge conservation | 0 | 0 | 0 | PASS |
| Energy and momentum | 0 | 0 | 0 | PASS |
| 5. Summary | 4 | 3 | 3 | PASS |
| Positive-Q summary | 0 | 0 | 0 | PASS |
| Final Answer | 1 | 1 | 1 | PASS |
| Final Answer child | 0 | 0 | 0 | PASS |
| Conservation summary | 0 | 0 | 0 | PASS |
| Q-value summary | 0 | 0 | 0 | PASS |
| 3. Q-Value | 4 | 4 | 4 | PASS |
| Exoergic statement | 0 | 0 | 0 | PASS |
| Q-value equation | 0 | 0 | 0 | PASS |
| Q-value definition | 0 | 0 | 0 | PASS |
| Endoergic statement | 0 | 0 | 0 | PASS |


Expected changed counts were exact:

- Overview: 2 → 1.
- Conservation Laws: 2 → 3.
- Worked Example: 3 → 4.
- Summary: 4 → 3.
- Every other original parent retained its expected direct-child count.

Descendant checks:

- Final Answer retained exactly one child.
- Problem retained exactly one child.
- Given retained exactly two children.
- Calculation retained exactly two children.
- The Final Answer child remained attached to Final Answer.
- No subtree was detached, orphaned, or flattened.

## Section 27 — Formula-preservation audit

| Formula | Rem ID | Baseline plain text | Final plain text | Baseline rich text | Final rich text | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Q-value equation | 7c2BgQ7ZvJ6U6vroe | Q=(m_initial−m_final)c² | Q=(m_initial−m_final)c² | One exact unstyled text span | One exact unstyled text span | PASS |
| Mass difference calculation | u4StnFy3qPtTxRAEr | Δm=5.030−5.025=0.005 u | Δm=5.030−5.025=0.005 u | One exact unstyled text span | One exact unstyled text span | PASS |
| Q calculation | hA2P0KOfsHP3NHkZZ | Q=0.005×931.5=4.6575 MeV | Q=0.005×931.5=4.6575 MeV | One exact unstyled text span | One exact unstyled text span | PASS |


Verified without differences:

- Unicode minus sign `−`.
- Multiplication sign `×`.
- Delta `Δ`.
- Superscript `²`.
- Source-text underscore sequences in `m_initial` and `m_final`.
- Decimal values.
- Units `u` and `MeV`.
- No visible math delimiters.
- No formula cards.
- No punctuation, symbol, unit, plain-text, or rich-text defect.

The exact symbol-heavy search operation returned zero hits for the Q equation, but the direct `get_rem_rich` read and complete final-tree read both returned the exact original formula under its original ID. This is classified as a verification search limitation, not a formula defect.

## Section 28 — Duplicate, loss, and pollution audit

| Defect type | Found? | Count | Location | Impact | Repaired |
| --- | --- | --- | --- | --- | --- |
| Duplicate principal section | No | 0 | — | None | Not applicable |
| Duplicate moved leaf | No | 0 | — | None | Not applicable |
| Duplicate Final Answer | No | 0 | — | None | Not applicable |
| Duplicate Final Answer child | No | 0 | — | None | Not applicable |
| Missing original Rem | No | 0 | — | None | Not applicable |
| Orphaned Rem | No | 0 | — | None | Not applicable |
| Same Rem under two parents | No | 0 | — | None | Not applicable |
| Recreated equivalent Rem | No | 0 | — | None | Not applicable |
| Duplicate formula | No | 0 | — | None | Not applicable |
| Raw Markdown marker | No | 0 | — | None | Not applicable |
| Raw math delimiter | No | 0 | — | None | Not applicable |
| Metadata pollution | No | 0 | — | None | Not applicable |
| Empty wrapper | No | 0 | — | None | Not applicable |
| Unexpected card | No | 0 | — | None | Not applicable |

## Section 29 — Structural safety metrics

### Rem Identity Preservation Rate

27 original IDs present exactly once ÷ 27 original IDs × 100 = **100.00%**

### Plain-Text Preservation Rate

27 original Rems with exact plain text preserved ÷ 27 original Rems × 100 = **100.00%**

### Parent-Edge Accuracy Rate

26 non-root original Rems with the required final parent ÷ 26 non-root original Rems × 100 = **100.00%**

### Affected-Parent Order Accuracy Rate

7 required parent lists with exact required child order ÷ 7 required parent lists × 100 = **100.00%**

### Unsafe-Probe Safety Rate

4 unsafe probes rejected safely with verified zero mutation ÷ 4 probes × 100 = **100.00%**

### Duplicate-Free Rate

27 original Rems appearing exactly once ÷ 27 original Rems × 100 = **100.00%**

## Section 30 — Defects and recovery

| Defect | Target or parent | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Initial baseline payload used `text` instead of required `title` | Structured fixture payload | Local schema validation | ChatGPT tool-selection failure | Argument-shape error rejected before bridge invocation | Correct payload keys only; reuse same intended fixture and idempotency key | Corrected before any RemNote mutation | Created exact 27-node baseline and fully reread |
| Structural validation errors labeled `plugin_permission` | Probes A–D | Returned error details | Plugin implementation failure | Primary messages and details were correct, but layer/recommended fix were misleading | No hierarchy repair needed; document diagnostic defect | Not applicable to hierarchy | All probe readbacks proved zero mutation |
| Exact symbol-heavy formula search returned zero results | Q equation | search_rems | Verification-tool defect | Search did not match Unicode-heavy exact text | Use direct rich read and full-tree evidence | Formula independently verified exact | Final rich and tree reads matched baseline |


No hierarchy repair was required. Repair attempts: 0. Unresolved hierarchy defects: 0.

## Section 31 — Efficiency analysis

| Operation category | Count |
| --- | --- |
| Scope reads | 10 |
| Collision checks | 1 |
| Baseline-creation calls | 3 (2 bridge writes + 1 local schema rejection) |
| Baseline-verification calls | 8 |
| Negative-probe calls | 4 |
| Post-probe reads | 7 |
| Valid preview calls | 5 |
| Move calls | 2 |
| Reorder calls | 3 |
| Affected-parent reads | 15 |
| Complete-tree reads | 3 |
| Formula reads | 6 |
| Repair calls | 0 |
| Failed calls | 5 (4 intentional safety rejections + 1 local schema rejection) |
| Repeated calls | 0 |
| Avoidable calls | 1 |
| Total meaningful calls | 64 (63 bridge operations + 1 local schema rejection) |


- **Slowest operation:** Initial approved-root `get_children`.
- **Highest latency:** 1,521 ms.
- **Total known bridge latency:** 22,736 ms.
- **Most reliable structural capability:** Guarded identity-preserving move combined with complete-list reorder and readback.
- **Most fragile structural capability:** Diagnostic error-layer attribution and exact Unicode-heavy search.
- **Unnecessarily broad operations:** None. Tree reads were bounded to the Test 10 lesson.
- **Replacement route considered:** Rejected by design; no delete/recreate or children replacement route was used.
- **Verification overhead:** Proportional to the advanced safety benchmark and mandatory probe/readback requirements.

## Section 32 — Safety and mutation audit

| Category | Allowed | Observed | Status |
| --- | --- | --- | --- |
| Test 10 roots created | 1 | 1 | PASS |
| Damaged lesson roots created | 1 | 1 | PASS |
| New lesson-tree Rems after baseline | 0 | 0 | PASS |
| Original lesson-tree Rems deleted | 0 | 0 | PASS |
| Original Rem plain texts changed | 0 | 0 | PASS |
| Intended parent changes | 2 | 2 | PASS |
| Unintended parent changes | 0 | 0 | PASS |
| Intended parent reorders | 3 | 3 | PASS |
| Unintended reorders | 0 | 0 | PASS |
| Child lists replaced destructively | 0 | 0 | PASS |
| Cards created | 0 | 0 | PASS |
| Focus changes initiated | 0 | 0 | PASS |
| Selection changes initiated | 0 | 0 | PASS |
| External sources used | 0 | 0 | PASS |
| Blind retries | 0 | 0 | PASS |
| Duplicate original Rems | 0 | 0 | PASS |
| Unsafe probes causing mutation | 0 | 0 | PASS |

## Section 33 — ChatGPT Agent Score

### Task understanding — 10/10

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Understood hierarchy-surgery objective | 4 | 4 | Used move and reorder only |
| Distinguished move/reorder from recreation | 4 | 4 | No original Rem was recreated |
| Identified all intentional defects | 2 | 2 | All five mapped before surgery |

### Planning and decomposition — 15/15

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Captured complete baseline manifest | 4 | 4 | 27 IDs, texts, parents, positions, counts |
| Defined exact desired hierarchy | 3 | 3 | Live-ID plan and final tree |
| Planned negative probes safely | 3 | 3 | Dry-run or guard mechanisms |
| Planned moves and reorders explicitly | 3 | 3 | Five-step surgery plan |
| Used preview or safe equivalent | 2 | 2 | Five previews |

### Tool selection — 15/15

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Chose safe move capability | 5 | 5 | move_rem with expected-parent guards |
| Chose complete-list reorder capability | 4 | 4 | allowPartial=false |
| Chose safe validation for negative probes | 3 | 3 | Dry-runs and guard rejection |
| Avoided deletion, recreation, and replacement | 3 | 3 | Zero such operations |

### Operation sequencing — 14/15

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Confirmed scope and baseline first | 3 | 3 | Live scope and full baseline |
| Completed probes before valid mutation | 3 | 3 | Four probes before surgery |
| Verified state after every probe | 2 | 2 | Mandatory readbacks |
| Reread before every move or reorder | 3 | 3 | Live parent/list rereads |
| Verified affected parents after each mutation | 4 | 3 | Complete verification; one avoidable local schema correction reduced sequencing precision |

### Verification discipline — 20/20

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Verified all original IDs | 4 | 4 | 27/27 |
| Verified all text values | 3 | 3 | 27/27 exact |
| Verified every parent edge | 4 | 4 | 26/26 non-root |
| Verified every affected order list | 4 | 4 | 7/7 readbacks |
| Verified child counts and descendants | 2 | 2 | All exact |
| Verified formulas, duplicates, and pollution | 3 | 3 | Direct rich/tree reads and audits |

### Recovery and self-correction — 10/10

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Diagnosed structural defects accurately | 3 | 3 | All five |
| Used smallest repair | 3 | 3 | No repair needed; exact five operations |
| Avoided recreation and collateral changes | 2 | 2 | Zero collateral mutation |
| Reverified repairs | 2 | 2 | Not applicable; final state fully reverified |

### Scope and safety — 10/10

| Criterion | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| All mutations remained under Test 10 root | 5 | 5 | Breadcrumb and final scope evidence |
| No deletion, text editing, or recreation | 3 | 3 | Zero observed |
| Idempotency and uncertain outcomes handled safely | 2 | 2 | Unique keys; no blind retries |


### Efficiency — 2/3

The workflow was precise and bounded, but one avoidable pre-mutation schema-shape rejection occurred.

### Evidence-based reporting — 2/2

All live IDs, edges, order lists, operation IDs, idempotency keys, errors, latency, limitations, and verification results are preserved.

**ChatGPT Agent Score: 98/100**

## Section 34 — Plugin Capability Score

| Category | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Tool availability | 10 | 9 | Read, move, reorder, preview, and verification available; exact Unicode-heavy search limitation |
| Baseline creation and retrieval | 10 | 10 | Exact 27-node fixture and complete retrieval |
| Unsafe-input enforcement | 20 | 20 | All four rejected safely |
| Move correctness | 20 | 20 | Leaf and subtree identity/descendants preserved |
| Reorder correctness | 15 | 15 | All three exact |
| Preservation reliability | 15 | 15 | IDs, text, edges, descendants, formulas exact |
| Tool composability | 5 | 5 | Read/preview/move/reorder/reverify composed safely |
| Reliability and idempotency | 3 | 3 | Stable outcomes and no duplicates |
| Performance | 1 | 1 | Practical latency; maximum 1.521 s |
| Safety and error quality | 1 | 0 | Structural errors were actionable but mislabeled as plugin_permission |


**Plugin Capability Score: 98/100**

## Section 35 — Final Artifact Score

| Category | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Rem identity preservation | 20 | 20 | 27/27 exact once |
| Plain-text and rich-content preservation | 15 | 15 | 27/27 text; 3/3 formulas |
| Parent-child correctness | 20 | 20 | Two intended changes; all others exact |
| Sibling-order correctness | 20 | 20 | Root, Q-Value, Summary exact |
| Descendant and count preservation | 10 | 10 | Counts and subtree attachment exact |
| Academic usability | 10 | 10 | Final hierarchy logical and readable |
| Absence of duplicates, loss, and pollution | 5 | 5 | Zero defects |


**Final Artifact Score: 100/100**

## Section 36 — Weighted overall score

- **Agent contribution:** 0.35 × 98 = 34.30
- **Plugin contribution:** 0.40 × 98 = 39.20
- **Artifact contribution:** 0.25 × 100 = 25.00
- **Raw weighted score:** 34.30 + 39.20 + 25.00 = **98.50**
- **Applied scoring cap:** None
- **Final adjusted score:** **98.50/100**
- **Rating:** Exceptional hierarchy surgery

## Section 37 — Mandatory scoring-cap table

| Scoring cap | Triggered? | Evidence | Applied result |
| --- | --- | --- | --- |
| Scope violation | No | Live evidence in corresponding report section | Not applied |
| More than one Test 10 root | No | Live evidence in corresponding report section | Not applied |
| More than one damaged lesson | No | Live evidence in corresponding report section | Not applied |
| Approved root not live-confirmed | No | Live evidence in corresponding report section | Not applied |
| Baseline not completely captured | No | Live evidence in corresponding report section | Not applied |
| No complete original ID set | No | Live evidence in corresponding report section | Not applied |
| Unsafe probe omitted | No | Live evidence in corresponding report section | Not applied |
| Unsafe probe caused mutation | No | Live evidence in corresponding report section | Not applied |
| Incomplete order accepted | No | Live evidence in corresponding report section | Not applied |
| Incorrect expected parent accepted | No | Live evidence in corresponding report section | Not applied |
| Cycle attempt accepted | No | Live evidence in corresponding report section | Not applied |
| Invalid index mutated hierarchy | No | Live evidence in corresponding report section | Not applied |
| No post-probe readback | No | Live evidence in corresponding report section | Not applied |
| No valid surgery preview | No | Live evidence in corresponding report section | Not applied |
| Rem recreated instead of moved | No | Live evidence in corresponding report section | Not applied |
| Final Answer child detached | No | Live evidence in corresponding report section | Not applied |
| Complete lesson rebuilt | No | Live evidence in corresponding report section | Not applied |
| Children list replaced destructively | No | Live evidence in corresponding report section | Not applied |
| Plain text changed | No | Live evidence in corresponding report section | Not applied |
| Formula changed | No | Live evidence in corresponding report section | Not applied |
| Original Rem missing | No | Live evidence in corresponding report section | Not applied |
| Duplicate original Rem | No | Live evidence in corresponding report section | Not applied |
| Same Rem under two parents | No | Live evidence in corresponding report section | Not applied |
| Affected parents not read back | No | Live evidence in corresponding report section | Not applied |
| No complete final-tree verification | No | Live evidence in corresponding report section | Not applied |
| Blind retry | No | Live evidence in corresponding report section | Not applied |
| Cards created | No | Live evidence in corresponding report section | Not applied |
| False success claim | No | Live evidence in corresponding report section | Not applied |
| Markdown report not created | No | Live evidence in corresponding report section | Not applied |
| Complete initial prompt missing | No | Live evidence in corresponding report section | Not applied |
| Chronological operation log missing | No | Live evidence in corresponding report section | Not applied |


**Lowest triggered cap:** None. Final adjusted score remains 98.50/100.

## Section 38 — Verdict and recommendation

- **Final verdict:** `PASS_WITH_WARNINGS`
- **Recommendation:** `PROCEED_TO_TEST_11`

The final hierarchy is completely correct, every original ID/text/descendant/formula is preserved, every negative probe was safely rejected with verified zero mutation, and the report artifact is complete. Warnings concern diagnostic metadata and one pre-mutation local schema correction, not hierarchy safety.

## Section 39 — Artifact manifest

| Artifact | Type | Parent/location | ID or path | Verified |
| --- | --- | --- | --- | --- |
| Test 10 root | RemNote root | Plugin Test | gfQ1PY6dGLMPTIARw | Yes |
| Damaged/repaired lesson | Rem hierarchy | Test 10 root | 30bCQVzsgX0jm5OfY | Yes |
| Moved mass-number Rem | Existing moved Rem | Conservation Laws | JC5b9oMYvW5nHhepW | Yes |
| Moved Final Answer subtree | Existing moved subtree | Worked Example | oLCekxSpMtjYFPsRo | Yes |
| Test 10 report | Markdown file | Local artifact workspace | /mnt/data/remnote-mcp-test-10-hierarchy-surgery-report-2026-07-12-run-02.md | Yes |


- No report was created inside RemNote.
- No old RemNote note was modified.
- No original lesson-tree Rem was deleted.
- No original lesson-tree Rem was recreated.
- No plain text was intentionally edited.
- No flashcard was created.
- No external academic source was used.
- No artifact outside the Test 10 root was changed.

## Section 40 — Report-integrity declaration

> I confirm that this report includes the complete user-provided Test 10 prompt, distinguishes move and reorder operations from deletion and recreation, records all four unsafe-input probes and their post-probe readbacks, compares every original Rem ID and text before and after surgery, reports unsupported capabilities honestly, does not expose authentication secrets, and accurately records every parent, order, descendant, formula, duplicate, missing Rem, and scope change.

| Integrity field | Value |
| --- | --- |
| Report generated at | 2026-07-12T20:37:57+03:00 |
| Report filename | remnote-mcp-test-10-hierarchy-surgery-report-2026-07-12-run-02.md |
| File verification result | PASS — existence, extension, non-empty content, required sections, prompt, IDs, and no secret-pattern findings verified |
| Approved-root ID | OjLcSppWfIH0cpPoh |
| Test-root ID | gfQ1PY6dGLMPTIARw |
| Lesson-root ID | 30bCQVzsgX0jm5OfY |
| Original Rem count | 27 |
| Final Rem count | 27 |
| Original IDs preserved | 27/27 |
| Plain texts preserved | 27/27 |
| Expected parent changes | 2 |
| Correct parent changes | 2 |
| Expected reorders | 3 |
| Correct reorders | 3 |
| Unsafe probes safely rejected | 4/4 |
| Duplicate Rem count | 0 |
| Missing Rem count | 0 |
| Orphan count | 0 |
| Formula defects | 0 |
| Rem Identity Preservation Rate | 100.00% |
| Plain-Text Preservation Rate | 100.00% |
| Parent-Edge Accuracy Rate | 100.00% |
| Affected-Parent Order Accuracy Rate | 100.00% |
| Unsafe-Probe Safety Rate | 100.00% |
| Duplicate-Free Rate | 100.00% |
| Repair attempts | 0 |
| Unresolved defects | 0 |
| ChatGPT Agent Score | 98/100 |
| Plugin Capability Score | 98/100 |
| Final Artifact Score | 100/100 |
| Raw weighted score | 98.50/100 |
| Final adjusted score | 98.50/100 |
| Final verdict | PASS_WITH_WARNINGS |
| Recommendation | PROCEED_TO_TEST_11 |
