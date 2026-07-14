# RemNote MCP Test 07 — Precision Styling and Targeted Formatting

- **Report filename:** `remnote-mcp-test-07-precision-styling-report-2026-07-12-run-02.md`
- **Date:** 2026-07-12
- **Start time:** `2026-07-12 18:04 EAT` (minute-level; first bridge response did not retain a request-second timestamp)
- **End time:** `2026-07-12 18:22:55 EAT`
- **Duration:** approximately 13 minutes of live execution plus report compilation
- **Run number:** `Run 01`
- **ChatGPT model:** GPT-5.6 Thinking
- **Reasoning level:** Thinking
- **Plugin branch:** `fix/remnote-mcp-mass-note-creation-stability`
- **Plugin commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`
- **Tool profile:** `developer`
- **Approved-root title and ID:** `Plugin Test` (`OjLcSppWfIH0cpPoh`)
- **Test-root title and ID:** `RemNote MCP Test 07 — Precision Styling — 2026-07-12 — Run 01` (`OPlgmZmfQeA58db5B`)
- **Fixture-root title and ID:** `Precision Styling Fixture — Radioactive Measurement` (`XuMZ886J8I7Gh6SDf`)
- **Style-only invariant result:** `PASS — every style/property-only Rem retained exact plain text`
- **Rich-text replacement control result:** `PASS — exact expected replacement on the original Rem ID`
- **Final verdict:** `PASS_WITH_WARNINGS`
- **ChatGPT Agent Score:** `98/100`
- **Plugin Capability Score:** `90/100`
- **Final Artifact Score:** `95/100`
- **Weighted overall score:** `94.05/100`

## Section 1 — Executive summary

Live RemNote evidence confirmed one connected plugin session, the expected approved root `Plugin Test` with ID `OjLcSppWfIH0cpPoh`, correct focus and selection, safe write permission, and no exact Test 07 collision. Exactly one Test 07 root and one fixture root were created beneath the approved root.

The exact required hierarchy contains **21 Rems: one fixture root plus 20 descendants**. This conflicts with the prompt's statement of 15 descendants. The exact hierarchy was treated as authoritative and reproduced without additions or omissions.

The neutral baseline was captured before styling. The creator initially set both bullet-control Rems to hidden; both were narrowly restored to visible and reread before the styling phase. This was baseline preparation, not a test result.

Results:

- **Five span targets:** all exact—bold, italic, red text, yellow phrase highlight, and replacement-control bold.
- **Whole-Rem emphasis:** semantic exact match—one green highlight span covers the complete target text and no sibling.
- **Concept and descriptor types:** exact direct property readback.
- **Bullet visibility:** visible reference stayed visible; target became hidden.
- **Formula control:** exact plain text, rich representation, symbols, parent, and position preserved.
- **Full replacement:** exact new sentence on the same Rem ID, with only `10 minutes` bold and the period unbolded.
- **Plain-text invariant:** 20 nodes unchanged exactly; one designated node changed exactly as required.
- **Hierarchy invariant:** all 21 IDs, parents, positions, and seven-section order unchanged.
- **Scope violations, deletion, movement, reordering, duplicate targets, external sources:** zero.

Warnings:

1. Existing-Rem heading mutation is deliberately disabled because the SDK path can materialize font-size metadata as visible child pollution. The root and seven sections remain `normal`; heading styling is `PROPERTY_UNSUPPORTED`.
2. `update_rem_rich` applied the designated replacement correctly, then returned a false `PARTIAL_FAILURE` because it enforced a style-only text invariant on an operation explicitly classified as full replacement. Immediate readback resolved the outcome; no retry was made.
3. `verify_card_set` contradicted itself: it reported `cardCount=0` and “No cards found,” while flagging ordinary Rems due a generic practice flag. Independent rich reads and design analysis report no cards. This is recorded as a verification-tool defect, and no speculative card repair was performed.
4. Two duplicate plugin-status reads and one locally rejected fixture schema payload were avoidable but caused no mutation.

**Test 08 may proceed with caution.** Test 08 was not started.

## Section 2 — Complete initial prompt

Internal platform instructions are not reproduced. The complete user-provided Test 07 prompt is included below.

~~~~~~markdown
# RemNote MCP Laboratory Test 07

## Precision Styling and Targeted Formatting

You are the primary experimental tester of a remote RemNote MCP plugin.

This is **Test 07 only**. Do not begin, simulate, or partially perform Test 08 or any later benchmark test.

Your mission is to create one controlled disposable note, record its exact baseline state, apply several narrowly targeted formatting and Rem-property changes, and prove through independent readback that the requested presentation changed while unintended plain-text, hierarchy, and content changes did not occur.

The test contains two deliberately different subcases:

1. **Style-only subcase:** Formatting and presentation must change without changing plain text.
2. **Full rich-text replacement control:** One designated Rem must intentionally receive new plain text through a complete rich-text replacement.

You must distinguish these two operation classes correctly.

---

# 1. Test identity

* **Test number:** 07
* **Test name:** Precision Styling and Targeted Formatting
* **Benchmark module:** Module II — Note Creation and Fidelity
* **Difficulty:** Advanced
* **Run type:** Main Run
* **Execution mode:** Natural autonomy with required safety, preview, and verification
* **Approved RemNote root title:** `Plugin Test`
* **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`
* **Disposable test root:** Create one new child beneath `Plugin Test`
* **Expected fixture root:** `Precision Styling Fixture — Radioactive Measurement`
* **Allowed operations:** Read, create, preview, apply targeted styling, change approved Rem properties, perform one controlled full rich-text replacement, verify, and repair within the new Test 07 root
* **Deletion permission:** None
* **Movement or reordering permission:** None
* **External academic sources:** Forbidden
* **GitHub:** Forbidden
* **Web browsing:** Forbidden
* **Required deliverable:** One complete local Markdown report file

---

# 2. Central experimental question

> Can ChatGPT apply precise styling and Rem properties to narrowly defined targets without unintentionally changing text, hierarchy, formulas, sibling Rems, or unrelated formatting—and can it distinguish style-only mutation from intentional full rich-text replacement?

This test is not passed merely because:

* A styling operation returns `SUCCESS`.
* The requested color name appears in a response.
* The note looks approximately correct in plain-text output.
* ChatGPT claims that the text remained unchanged.
* A whole Rem was replaced and happened to look similar.
* The final note contains the expected words somewhere.
* The plugin reports that a Rem property was updated.

The actual before-and-after plain text, rich text, properties, hierarchy, and sibling state must be inspected.

---

# 3. Primary objectives

The test must determine whether ChatGPT and the RemNote MCP can safely perform and verify:

1. Heading-level changes
2. Phrase-level bold
3. Phrase-level italic
4. Phrase-level text color
5. Phrase-level highlighting
6. Whole-Rem highlighting
7. Bullet-visibility changes
8. Concept-type conversion
9. Descriptor-type conversion
10. Formula preservation during unrelated styling
11. Exact plain-text preservation during style-only operations
12. Hierarchy preservation during style-only operations
13. Sibling isolation
14. One intentional full rich-text replacement
15. Correct distinction between expected and unexpected text changes
16. Targeted repair without rebuilding the fixture

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
* The observed root ID conflicts with the expected ID and the conflict cannot be resolved.
* The intended parent is outside the approved scope.
* You cannot prove that the Test 07 root is beneath `Plugin Test`.

Stop and report `BLOCKED_CONNECTION` when:

* The plugin is disconnected before mutation.
* A styling or rich-text operation has an uncertain outcome and readback cannot determine what happened.
* Two reasonable recovery attempts fail for the same connection problem.

Stop and report `BLOCKED_BASELINE_INCOMPLETE` when:

* The fixture cannot be created completely.
* The affected Rem IDs cannot be identified reliably.
* The before-state cannot be captured.
* Continuing would make before-and-after comparison unreliable.

Do not perform style operations until the baseline fixture has been created and verified.

---

# 6. Disposable Test 07 root

Create exactly one disposable root beneath `Plugin Test`.

Use:

`RemNote MCP Test 07 — Precision Styling — YYYY-MM-DD — Run NN`

Replace:

* `YYYY-MM-DD` with the actual date
* `NN` with a two-digit run number

Begin with `Run 01`.

Before creation:

1. Search beneath `Plugin Test` for an exact-title collision.
2. Do not reuse an earlier Test 07 root.
3. Do not modify an earlier Test 07 root.
4. Do not delete an earlier Test 07 root.
5. Select the first unused run number.

Record:

* Test-root title
* Test-root ID
* Parent ID
* Creation operation ID
* Idempotency key where supported
* Approved-root child count before creation
* Approved-root child count after creation
* Breadcrumb proving correct placement
* Duplicate-root search result

Create no more than one Test 07 root.

---

# 7. Baseline fixture

Create exactly one fixture root beneath the new Test 07 root:

`Precision Styling Fixture — Radioactive Measurement`

The fixture must use the exact hierarchy and plain text below.

```text id="53sa0p"
Precision Styling Fixture — Radioactive Measurement
├── 1. Core Definition
│   ├── Decay constant λ is the probability per unit time that an undecayed nucleus will decay.
│   └── A larger decay constant corresponds to a faster decay process.
├── 2. Measurement Statement
│   ├── The measured activity was 245 ± 7 Bq during the first interval.
│   └── Background correction must be applied before interpretation.
├── 3. Formula Preservation
│   ├── Activity follows the exponential relationship:
│   └── A(t)=A₀e^(−λt)
├── 4. Whole-Rem Emphasis
│   ├── Signal quality depends on detector stability and counting time.
│   └── Important: preserve every word in this sentence.
├── 5. Terminology Pair
│   └── Activity
│       └── The number of nuclear decays per unit time.
├── 6. Bullet Visibility Control
│   ├── Visible reference bullet
│   └── Hidden-bullet target
└── 7. Rich-Text Replacement Control
    └── Initial control sentence: Detector response is stable.
```

---

# 8. Baseline content requirements

The baseline must contain:

* One fixture root
* Seven direct sections
* Fifteen descendants beneath the fixture root, excluding the root itself
* One formula-bearing Rem
* One terminology parent-child pair
* Two bullet-visibility comparison Rems
* One dedicated rich-text replacement control Rem

The exact node count may vary only when the formula representation requires one additional supported formula child.

Record the actual count and explain any representation difference.

Do not:

* Add cards during baseline creation
* Add visual styling during baseline creation beyond the minimum necessary to create readable content
* Hide bullets during baseline creation
* Change concept or descriptor types during baseline creation
* Apply phrase formatting during baseline creation
* Replace the control sentence during baseline creation

The baseline must exist in a neutral state before the styling phase.

---

# 9. Baseline verification gate

Before applying any styling, independently verify:

1. Fixture-root title and ID
2. Parent ID and breadcrumb
3. Exactly seven direct sections
4. Correct section order
5. Correct descendant relationships
6. Exact plain text of every fixture Rem
7. Formula text and rich representation
8. Initial heading levels
9. Initial bullet visibility
10. Initial Rem types
11. Initial rich-text spans
12. Initial text and highlight colors
13. No duplicate fixture root
14. No unexpected cards
15. No existing style that would make the requested change ambiguous

If any required baseline text is incorrect:

* Repair it before styling.
* Record the repair as baseline preparation.
* Reverify the complete baseline.
* Do not treat baseline repair as a styling result.

---

# 10. Baseline snapshot

Create a complete before-state snapshot for all fixture Rems.

Use:

| Label | Rem ID | Parent ID | Position | Plain text | Rich-text summary | Heading level | Rem type | Bullet visible | Text color | Highlight |
| ----- | ------ | --------- | -------: | ---------- | ----------------- | ------------- | -------- | -------------- | ---------- | --------- |

Where properties are not returned, use:

* `NOT RETURNED`
* `UNSUPPORTED`
* `UNKNOWN`

Do not invent default property values.

Where practical, calculate:

* A normalized plain-text hash for each Rem
* A combined normalized plain-text hash for the complete fixture
* Direct-child-order manifest
* Parent-child relationship manifest

The baseline snapshot must be included in the final Markdown report.

---

# 11. Styling mission

After the baseline is complete and verified, apply the following changes.

Each requirement is intentionally narrow.

Do not broaden the target.

---

## 11.1 Heading-level styling

Apply:

* Fixture root: highest suitable document-title or heading level
* All seven direct sections: the same section-heading level beneath the fixture root
* No descendant explanation or sentence should become a section heading

Required invariant:

* Plain text must remain unchanged.
* Section order must remain unchanged.
* Parent-child relationships must remain unchanged.

---

## 11.2 Bold-span target

Target Rem:

`Decay constant λ is the probability per unit time that an undecayed nucleus will decay.`

Apply bold to exactly:

`Decay constant`

Do not bold:

* The following space
* `λ`
* Any other word
* The entire Rem

Required invariant:

* Complete plain text remains exact.

---

## 11.3 Italic-span target

Target Rem:

`A larger decay constant corresponds to a faster decay process.`

Apply italic to exactly:

`faster decay process`

Do not italicize:

* The preceding article `a`
* The final period
* Any other phrase

Required invariant:

* Complete plain text remains exact.

---

## 11.4 Phrase-level text-color target

Target Rem:

`The measured activity was 245 ± 7 Bq during the first interval.`

Apply a supported red text color to exactly:

`245 ± 7 Bq`

Do not color:

* The surrounding sentence
* The period
* The entire Rem
* Any sibling Rem

Where the plugin supports multiple red variants, use its standard red text color.

Record the exact property or color value returned.

Required invariant:

* Complete plain text remains exact.
* `±` remains intact.
* `Bq` remains intact.

---

## 11.5 Phrase-level highlight target

Target Rem:

`Background correction must be applied before interpretation.`

Apply a supported yellow highlight to exactly:

`Background correction`

Do not highlight:

* The following space
* The rest of the sentence
* The whole Rem
* Any sibling Rem

Record the exact highlight value returned.

Required invariant:

* Complete plain text remains exact.

---

## 11.6 Formula-preservation control

Target formula Rem:

`A(t)=A₀e^(−λt)`

Do not intentionally modify this formula.

It is a control target.

After all nearby styling operations, verify:

* Formula plain text is unchanged.
* Formula rich representation is unchanged.
* Subscript zero remains intact.
* Negative exponent remains intact.
* Lambda remains intact.
* Formula remains under `3. Formula Preservation`.

This determines whether unrelated styling operations caused collateral formula damage.

---

## 11.7 Whole-Rem highlight target

Target Rem:

`Important: preserve every word in this sentence.`

Apply a whole-Rem green highlight using the plugin’s supported whole-Rem highlighting behavior.

Do not apply phrase-only highlighting for this requirement.

Do not highlight its sibling:

`Signal quality depends on detector stability and counting time.`

Required invariant:

* Target plain text remains exact.
* Sibling plain text and styling remain unchanged.

If whole-Rem highlighting is unsupported but span highlighting is supported:

* Do not silently substitute a phrase highlight.
* Mark `WHOLE_REM_HIGHLIGHT_UNSUPPORTED`.
* Preserve the content.
* Continue with other supported requirements.

---

## 11.8 Concept and descriptor types

Under `5. Terminology Pair`:

* Convert `Activity` to a concept-type Rem.
* Convert its child `The number of nuclear decays per unit time.` to the corresponding descriptor-type Rem.

Required invariants:

* Plain text remains exact.
* Parent-child relationship remains unchanged.
* No duplicate terminology pair is created.
* No additional answer text is generated.
* No unrelated Rem is converted.
* No card type other than the direct consequence of the requested concept/descriptor relationship is introduced.

Record any card-related side effect reported by the plugin.

This test evaluates type precision, not flashcard quality.

---

## 11.9 Bullet-visibility control

Under `6. Bullet Visibility Control`:

* Keep the bullet visible for:
  `Visible reference bullet`
* Hide the bullet for:
  `Hidden-bullet target`

Do not hide the parent section’s bullet unless required by the supported representation.

Required invariants:

* Both plain texts remain exact.
* Their order remains unchanged.
* No sibling outside this section changes bullet visibility.

If per-Rem bullet visibility is unsupported:

* Report the limitation.
* Do not hide bullets for the entire fixture as a workaround.

---

# 12. Intentional full rich-text replacement control

This subcase is intentionally **not** style-only.

Target the Rem containing:

`Initial control sentence: Detector response is stable.`

Replace its complete rich-text content with exactly:

`Updated control sentence: Detector response remained stable for 10 minutes.`

Within the replacement content, apply bold to exactly:

`10 minutes`

Requirements:

1. This is the only Rem whose plain text is expected to change.
2. The replacement must affect the existing target Rem rather than create a sibling duplicate.
3. Parent ID must remain unchanged.
4. Position must remain unchanged.
5. The old sentence must no longer remain in that target.
6. The new sentence must appear exactly once.
7. No other fixture Rem may change plain text.
8. No other fixture Rem may receive the bold span.
9. The period must remain unbolded.
10. The replacement must not modify section 7’s heading.

The expected before and after are:

| State  | Required plain text                                                           |
| ------ | ----------------------------------------------------------------------------- |
| Before | `Initial control sentence: Detector response is stable.`                      |
| After  | `Updated control sentence: Detector response remained stable for 10 minutes.` |

This control prevents the evaluator from treating every full rich-text update as a style-only operation.

---

# 13. Operation-classification requirement

Before mutation, classify every requested change as one of:

* `STYLE_ONLY`
* `REM_PROPERTY_ONLY`
* `FULL_RICH_TEXT_REPLACEMENT`
* `READ_ONLY_CONTROL`

Use:

| Requirement           | Target                    | Operation class | Plain-text change expected? |
| --------------------- | ------------------------- | --------------- | --------------------------- |
| Heading levels        | Fixture root and sections |                 |                             |
| Bold phrase           | Core definition sentence  |                 |                             |
| Italic phrase         | Faster-decay sentence     |                 |                             |
| Red text              | Measurement value         |                 |                             |
| Yellow highlight      | Background phrase         |                 |                             |
| Formula preservation  | Formula Rem               |                 |                             |
| Whole-Rem highlight   | Important sentence        |                 |                             |
| Concept type          | Activity                  |                 |                             |
| Descriptor type       | Definition child          |                 |                             |
| Bullet visibility     | Hidden-bullet target      |                 |                             |
| Rich-text replacement | Control sentence          |                 |                             |

Expected classification:

* Heading levels: `REM_PROPERTY_ONLY`
* Bold: `STYLE_ONLY`
* Italic: `STYLE_ONLY`
* Text color: `STYLE_ONLY`
* Phrase highlight: `STYLE_ONLY`
* Formula preservation: `READ_ONLY_CONTROL`
* Whole-Rem highlight: `REM_PROPERTY_ONLY` or `STYLE_ONLY`, depending on plugin representation
* Concept/descriptor: `REM_PROPERTY_ONLY`
* Bullet visibility: `REM_PROPERTY_ONLY`
* Control replacement: `FULL_RICH_TEXT_REPLACEMENT`

Explain any plugin-specific difference.

---

# 14. Preview requirement

Before applying mutations:

1. Confirm all target Rem IDs.
2. Confirm target plain texts.
3. Confirm expected operation class.
4. Confirm expected plain-text-change behavior.
5. Prepare a mutation plan.
6. Use non-mutating preview or dry-run capabilities where supported.
7. Inspect all warnings.
8. Confirm no operation targets an old note or unrelated sibling.

Preview is particularly important for:

* Phrase-level formatting
* Whole-Rem highlight
* Concept/descriptor conversion
* Bullet visibility
* Full rich-text replacement

The preview must not change content.

Do not use a mutation-capable health check as a preview.

When preview is unsupported:

* Record `PREVIEW_UNSUPPORTED`.
* Perform a manual target-ID and expected-text validation.
* Continue only when all targets are unambiguous.

---

# 15. Tool-choice requirement

Choose capabilities appropriate to each mutation type.

Do not force all requests through one generic replacement route.

A strong workflow should distinguish among:

* Heading or Rem-property changes
* Span-level rich-text formatting
* Whole-Rem styling
* Concept/descriptor conversion
* Bullet visibility
* Complete rich-text replacement
* Read-only formula verification

The test does not require one exact tool sequence.

Reduce tool-strategy credit when ChatGPT:

* Replaces entire Rem text to apply a simple bold span
* Rebuilds the fixture to change heading levels
* Reimports the note to apply styling
* Uses a broad design template that changes unrelated properties
* Applies one full-rich-text replacement route to every target
* Uses ordinary child creation to simulate formatting
* Creates duplicate styled Rems instead of modifying existing targets
* Changes all bullet visibility to satisfy one target
* Converts unrelated Rems to concepts or descriptors

Record:

* Chosen capability for every requirement
* Alternative route considered
* Why the selected route was safer
* Whether a fallback was required
* Whether the route preserved invariants

---

# 16. Mutation sequencing

Use this order unless a plugin-specific dependency requires another safe sequence:

1. Confirm baseline
2. Apply heading levels
3. Apply bold span
4. Apply italic span
5. Apply phrase text color
6. Apply phrase highlight
7. Apply whole-Rem highlight
8. Apply concept and descriptor types
9. Apply bullet visibility
10. Perform full rich-text replacement control
11. Verify complete fixture
12. Repair confirmed defects only
13. Reverify

After each high-risk operation, perform enough readback to detect unintended text changes before continuing.

High-risk operations include:

* Phrase-level rich-text changes
* Concept/descriptor conversion
* Whole-Rem highlighting
* Full rich-text replacement

---

# 17. Idempotency and uncertain outcomes

Use distinct idempotency keys where supported for:

* Test-root creation
* Fixture creation
* Each logically independent mutation group
* Full rich-text replacement
* Each repair

Do not reuse a key with a changed payload.

If a mutation times out or returns an uncertain outcome:

1. Do not retry blindly.
2. Read the target Rem.
3. Compare current plain text, rich text, and properties with:

   * Baseline
   * Requested result
4. Determine whether the operation:

   * Completed
   * Partially completed
   * Failed
   * Cannot be determined
5. Retry only when readback proves the requested state was not applied.
6. Do not create a duplicate Rem as a fallback.

---

# 18. Required post-mutation verification

Verification must inspect the actual RemNote state.

---

## 18.1 Complete plain-text comparison

Compare every fixture Rem’s plain text before and after.

Expected:

* Fourteen style-only or control Rems retain exact plain text.
* Exactly one Rem—the rich-text replacement control—changes plain text.
* No additional Rem changes plain text.

Use:

| Rem ID | Label | Before text | After text | Change expected? | Exact outcome | Status |
| ------ | ----- | ----------- | ---------- | ---------------- | ------------- | ------ |

Classify:

* `UNCHANGED_AS_REQUIRED`
* `CHANGED_AS_REQUIRED`
* `UNEXPECTED_TEXT_CHANGE`
* `EXPECTED_CHANGE_MISSING`
* `TEXT_NOT_VERIFIABLE`

---

## 18.2 Combined text invariant

Construct:

* Combined baseline plain-text representation
* Combined final plain-text representation
* Expected final representation after substituting only the control sentence
* Combined normalized hashes where practical

Verify:

[
\text{Final fixture text}
=========================

## \text{Baseline fixture text}

\text{old control sentence}
+
\text{new control sentence}
]

No other textual difference is permitted.

---

## 18.3 Hierarchy invariant

Verify:

* Fixture root ID unchanged
* Seven direct sections remain
* Direct-section order unchanged
* Every parent-child relationship unchanged
* No moved Rem
* No reordered sibling
* No duplicate target
* No missing Rem
* Control Rem remains in its original position

Use before-and-after hierarchy manifests.

---

## 18.4 Span-level verification

For each span target, inspect:

* Complete plain text
* Styled start and end boundaries
* Rich-text segments
* Style type
* Style value
* Adjacent characters
* Whether the final punctuation is included or excluded correctly

Use:

| Target phrase | Rem ID | Requested style | Observed styled text | Boundary exact? | Adjacent text unaffected? | Status |
| ------------- | ------ | --------------- | -------------------- | --------------- | ------------------------- | ------ |

Required targets:

* `Decay constant`
* `faster decay process`
* `245 ± 7 Bq`
* `Background correction`
* `10 minutes`

---

## 18.5 Heading verification

Use:

| Rem | Rem ID | Expected heading role | Observed property | Plain text unchanged | Status |
| --- | ------ | --------------------- | ----------------- | -------------------- | ------ |

Verify:

* Fixture root has the intended highest heading role.
* Seven direct sections share the intended section role.
* Descendant sentences remain ordinary content.
* No unintended heading is introduced.

---

## 18.6 Whole-Rem highlight verification

Verify:

* The complete target Rem has the requested whole-Rem highlight.
* The target plain text is unchanged.
* Its sibling does not receive the highlight.
* No phrase-only substitute is falsely reported as whole-Rem highlight.
* No unrelated Rem receives the same highlight unintentionally.

---

## 18.7 Concept and descriptor verification

Verify:

* `Activity` type
* Definition child type
* Parent-child relationship
* Exact plain text
* Card or learning-system side effects where reported
* No other concept or descriptor conversion
* No duplicate pair

Do not infer type only from hierarchy.

Use the strongest available property or card metadata evidence.

---

## 18.8 Bullet-visibility verification

Verify:

* `Visible reference bullet` remains visible.
* `Hidden-bullet target` becomes hidden.
* Their order remains unchanged.
* Plain text remains unchanged.
* Parent section remains intact.
* No unrelated bullet visibility changes.

When the capability is unsupported, report that rather than claiming visual success.

---

## 18.9 Formula control verification

Compare formula state before and after:

| Property                 | Before | After | Status |
| ------------------------ | ------ | ----- | ------ |
| Plain text               |        |       |        |
| Rich math representation |        |       |        |
| Parent ID                |        |       |        |
| Position                 |        |       |        |
| Subscript zero           |        |       |        |
| Negative exponent        |        |       |        |
| Lambda                   |        |       |        |

Any formula change caused by unrelated styling is a collateral defect.

---

## 18.10 Rich-text replacement verification

Verify:

* Existing control Rem ID was retained where supported.
* Old text is absent from the target Rem.
* New text is exact.
* New text appears once.
* `10 minutes` alone is bold.
* The final period is not bold.
* Parent ID is unchanged.
* Position is unchanged.
* No duplicate control Rem exists.
* No unrelated text changed.

---

# 19. Sibling-isolation audit

For every styling target, inspect at least one sibling or adjacent Rem.

Use:

| Styled target | Control sibling | Target change present | Control sibling unchanged | Status |
| ------------- | --------------- | --------------------- | ------------------------- | ------ |

Required comparisons:

* Bold sentence vs. faster-decay sentence
* Red-value sentence vs. background-correction sentence
* Whole-highlight sentence vs. signal-quality sentence
* Hidden-bullet target vs. visible reference bullet
* Control sentence vs. section-7 heading
* Concept parent vs. unrelated section heading

This verifies that formatting did not bleed across Rem boundaries.

---

# 20. Style matrix

Create a complete final style matrix:

| Label | Rem ID | Heading level | Rem type | Bullet visible | Bold spans | Italic spans | Text-color spans | Highlight spans | Whole-Rem highlight |
| ----- | ------ | ------------- | -------- | -------------- | ---------- | ------------ | ---------------- | --------------- | ------------------- |

Include every fixture Rem.

Where a property is unsupported, state that explicitly.

Do not infer absence merely because a plain-text read does not show formatting.

---

# 21. Precision classifications

Use exactly these classifications.

## `EXACT_STYLE_MATCH`

Requested style exists on exactly the intended target and boundary.

## `SEMANTIC_STYLE_MATCH`

The plugin uses an equivalent supported representation without affecting text or scope.

## `OVER_APPLIED`

The style affects extra characters, words, Rems, or descendants.

## `UNDER_APPLIED`

Only part of the required target is styled.

## `WRONG_STYLE`

The target is modified, but the style type or value is wrong.

## `STYLE_NOT_APPLIED`

No evidence shows the requested style.

## `TEXT_CHANGED_UNEXPECTEDLY`

A style-only operation changed plain text.

## `HIERARCHY_CHANGED_UNEXPECTEDLY`

A style or property operation changed parentage or order.

## `PROPERTY_UNSUPPORTED`

The requested Rem property is genuinely unsupported.

## `RICH_TEXT_NOT_RETURNED`

Mutation may have succeeded, but rich-text evidence is unavailable.

## `NOT_VERIFIED`

Evidence is insufficient.

---

# 22. Repair policy

Repair is allowed only beneath the new Test 07 root.

Repair only defects confirmed through readback.

Permitted repairs include:

* Restoring text changed unintentionally by a style-only operation
* Correcting a span boundary
* Removing style accidentally applied to adjacent text
* Correcting a wrong heading level
* Correcting an unintended bullet-visibility change
* Correcting an unintended Rem-type change
* Restoring the formula control
* Correcting the full replacement text
* Correcting the bold boundary around `10 minutes`

Deletion remains forbidden.

Do not:

* Rebuild the complete fixture to repair one span
* Reimport the fixture
* Create duplicate corrected Rems
* Modify unrelated siblings
* Use broad design application as a repair
* Erase a supported style merely because verification is difficult

Before a broad rich-text repair:

* Preview where supported.
* Reread current text and rich text.
* Preserve every unaffected segment.

Maximum repair attempts for one defect:

`2`

After two unsuccessful attempts:

* Stop repairing that defect.
* Report it honestly.
* Do not falsely claim success.

---

# 23. Efficiency target

The test should normally require approximately:

* **18–35 meaningful RemNote operations**

A higher count is acceptable when:

* Rich-text reads are available only per Rem
* Property inspection is separated by type
* Phrase-level formatting requires individual operations
* A confirmed defect requires repair
* Readback is truncated
* A write outcome is uncertain

Record:

* Scope reads
* Collision checks
* Fixture-creation operations
* Baseline reads
* Preview calls
* Heading operations
* Span-formatting operations
* Property-change operations
* Replacement operations
* Verification reads
* Repair calls
* Failed calls
* Repeated calls
* Avoidable calls
* Slowest operation
* Total known latency

Efficiency means precise, safe, and verifiable—not merely minimal calls.

---

# 24. Required local Markdown report

Create one real local `.md` report.

Do not create the report inside RemNote.

## Required filename

Use:

`remnote-mcp-test-07-precision-styling-report-YYYY-MM-DD.md`

Example:

`remnote-mcp-test-07-precision-styling-report-2026-07-12.md`

If that filename already exists locally, use:

`remnote-mcp-test-07-precision-styling-report-2026-07-12-run-02.md`

Do not overwrite an earlier report unless explicitly instructed.

## File verification

Before presenting the report:

1. Confirm the file exists.
2. Confirm the `.md` extension.
3. Confirm the file is not empty.
4. Confirm the complete initial Test 07 prompt is included.
5. Confirm the complete fixture is included.
6. Confirm scope evidence is included.
7. Confirm the baseline snapshot is included.
8. Confirm the operation-classification matrix is included.
9. Confirm the preview or validation evidence is included.
10. Confirm the chronological operation log is included.
11. Confirm all affected Rem IDs are included.
12. Confirm the complete before-and-after plain-text comparison is included.
13. Confirm the hierarchy invariant is included.
14. Confirm all span-boundary checks are included.
15. Confirm heading verification is included.
16. Confirm whole-Rem highlight verification is included.
17. Confirm concept and descriptor verification is included.
18. Confirm bullet-visibility verification is included.
19. Confirm formula-control verification is included.
20. Confirm full rich-text replacement verification is included.
21. Confirm sibling-isolation checks are included.
22. Confirm the final style matrix is included.
23. Confirm defects and repairs are included.
24. Confirm all three score categories are included.
25. Confirm the weighted score is included.
26. Confirm all scoring caps are evaluated.
27. Confirm the final verdict is included.
28. Confirm no authentication secret appears.
29. Confirm the file can be linked to the user.

When local file creation is unsupported:

* Do not claim that the report exists.
* Mark the report artifact `BLOCKED`.
* Present the complete report in the response.
* Apply the report-artifact scoring cap.

---

# 25. Required report structure

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

`# RemNote MCP Test 07 — Precision Styling and Targeted Formatting`

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
* Fixture-root title and ID
* Style-only invariant result
* Rich-text replacement control result
* Final verdict
* ChatGPT Agent Score
* Plugin Capability Score
* Final Artifact Score
* Weighted overall score

---

## Section 1 — Executive summary

Summarize:

* Scope confirmation
* Baseline-fixture status
* Targets identified
* Style-only operations completed
* Property operations completed
* Plain-text invariant result
* Hierarchy invariant result
* Formula-control result
* Full replacement control result
* Unsupported properties
* Over-applied or under-applied formatting
* Repairs
* Scope violations
* Whether Test 08 may proceed

---

## Section 2 — Complete initial prompt

Include the complete user-provided Test 07 prompt in a fenced code block.

Do not shorten it.

Do not include hidden system instructions, credentials, authentication secrets, or private chain-of-thought.

State:

> Internal platform instructions are not reproduced. The complete user-provided Test 07 prompt is included below.

---

## Section 3 — Test configuration

Use:

| Field                     | Value                                               |
| ------------------------- | --------------------------------------------------- |
| Test number               | 07                                                  |
| Test name                 | Precision Styling and Targeted Formatting           |
| Difficulty                | Advanced                                            |
| Run type                  | Main Run                                            |
| Approved root             | Plugin Test                                         |
| Expected approved-root ID | OjLcSppWfIH0cpPoh                                   |
| Observed approved-root ID | Live value                                          |
| Test-root title           | Live value                                          |
| Test-root ID              | Live value                                          |
| Fixture-root title        | Precision Styling Fixture — Radioactive Measurement |
| Fixture-root ID           | Live value                                          |
| Style-only targets        | 10 or actual supported count                        |
| Full replacement targets  | 1                                                   |
| Deletion                  | Forbidden                                           |
| Movement and reordering   | Forbidden                                           |
| External sources          | Forbidden                                           |
| Run number                | Actual value                                        |

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

## Section 5 — Test-root and fixture creation

Report:

* Selected run number
* Test-root title and ID
* Fixture-root title and ID
* Parent IDs
* Idempotency keys
* Operation IDs
* Before-and-after child counts
* Breadcrumbs
* Duplicate checks
* Baseline repair actions
* Creation readback verdict

---

## Section 6 — Baseline hierarchy

Include:

* Planned hierarchy
* Observed hierarchy
* Node count
* Direct-section count
* Parent-child relationships
* Section order
* Formula representation
* Unexpected baseline styling
* Unexpected cards
* Baseline readiness verdict

---

## Section 7 — Complete baseline snapshot

Include the full baseline table required by this prompt.

Also report:

* Combined baseline text
* Combined normalized hash where practical
* Direct-child-order manifest
* Parent-child manifest
* Unsupported property fields

---

## Section 8 — Operation-classification matrix

Include the complete classification table.

Explain any deviation from the expected operation class.

---

## Section 9 — Mutation plan and preview

Report:

* Target Rem IDs
* Expected text-change behavior
* Chosen capability per requirement
* Preview capabilities
* Preview results
* Warnings
* Unsupported operations
* Adjustments before mutation
* Alternative routes considered

---

## Section 10 — Chronological operation log

Use:

| # | Phase | Requirement | Tool or capability | Target | Status | Operation ID | Idempotency key | Latency | Warning/error |
|---:|---|---|---|---|---|---|---|---|---:|---|

Include every meaningful RemNote operation.

---

## Section 11 — Plain-text invariant results

Include the complete before-and-after comparison for every fixture Rem.

Then report:

* Total Rems compared
* Expected unchanged Rems
* Actually unchanged Rems
* Expected changed Rems
* Correctly changed Rems
* Unexpectedly changed Rems
* Missing expected changes
* Combined expected final text
* Combined observed final text
* Hash comparison where practical
* Plain-text invariant verdict

---

## Section 12 — Hierarchy invariant results

Use:

| Rem ID | Label | Before parent | After parent | Before position | After position | Expected unchanged | Status |
| ------ | ----- | ------------- | ------------ | --------------: | -------------: | ------------------ | ------ |

Report:

* Root ID stability
* Direct-section count
* Section-order stability
* Parent-child stability
* Duplicate Rems
* Missing Rems
* Unintended movements
* Hierarchy invariant verdict

---

## Section 13 — Heading-level results

Include the required heading-verification table.

Report:

* Fixture-root heading result
* Seven direct-section results
* Descendant-heading pollution
* Plain-text preservation
* Unsupported heading levels
* Heading verdict

---

## Section 14 — Phrase-level styling results

Use:

| Target phrase | Rem ID | Requested style | Observed style | Exact start boundary | Exact end boundary | Plain text unchanged | Status |
| ------------- | ------ | --------------- | -------------- | -------------------- | ------------------ | -------------------- | ------ |

Include:

* `Decay constant`
* `faster decay process`
* `245 ± 7 Bq`
* `Background correction`
* `10 minutes`

Report adjacent-character effects.

---

## Section 15 — Whole-Rem highlight result

Report:

* Target Rem ID
* Requested highlight
* Observed representation
* Complete target affected
* Target text unchanged
* Sibling unaffected
* Unsupported fallback
* Verdict

---

## Section 16 — Concept and descriptor result

Report:

* Concept Rem ID
* Descriptor Rem ID
* Before types
* After types
* Parent-child relationship
* Before and after text
* Card side effects
* Unrelated type changes
* Verdict

---

## Section 17 — Bullet-visibility result

Use:

| Rem                      | Rem ID | Before visibility | After visibility | Expected | Plain text unchanged | Status |
| ------------------------ | ------ | ----------------- | ---------------- | -------- | -------------------- | ------ |
| Visible reference bullet |        |                   |                  | Visible  |                      |        |
| Hidden-bullet target     |        |                   |                  | Hidden   |                      |        |

Report unrelated visibility changes.

---

## Section 18 — Formula-preservation control

Include the complete formula before-and-after table required by this prompt.

Report:

* Plain-text fidelity
* Rich-text fidelity
* Parent and position stability
* Symbol fidelity
* Collateral-damage verdict

---

## Section 19 — Full rich-text replacement control

Use:

| Property            | Before                   | Expected after           | Observed after | Status |
| ------------------- | ------------------------ | ------------------------ | -------------- | ------ |
| Rem ID              |                          | Same where supported     |                |        |
| Parent ID           |                          | Same                     |                |        |
| Position            |                          | Same                     |                |        |
| Plain text          | Initial control sentence | Updated control sentence |                |        |
| Bold span           | None                     | `10 minutes`             |                |        |
| Old text count      | 1                        | 0                        |                |        |
| New text count      | 0                        | 1                        |                |        |
| Duplicate Rem count | 0                        | 0                        |                |        |

Explain why this text change is expected and does not violate the style-only invariant.

---

## Section 20 — Sibling-isolation audit

Include the required target-control comparison table.

Report any formatting bleed.

---

## Section 21 — Final style matrix

Include the complete final style matrix for every fixture Rem.

---

## Section 22 — Precision assessment

Use:

| Requirement          | Classification | Evidence | Limitation |
| -------------------- | -------------- | -------- | ---------- |
| Heading levels       |                |          |            |
| Bold phrase          |                |          |            |
| Italic phrase        |                |          |            |
| Text color           |                |          |            |
| Phrase highlight     |                |          |            |
| Formula preservation |                |          |            |
| Whole-Rem highlight  |                |          |            |
| Concept type         |                |          |            |
| Descriptor type      |                |          |            |
| Bullet visibility    |                |          |            |
| Full replacement     |                |          |            |

Use the precision classifications defined in this prompt.

---

## Section 23 — Defects and recovery

Use:

| Defect | Target | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
| ------ | ------ | ---------------- | ------------- | --------- | ----------- | ------------- | -------------- |

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

## Section 24 — Efficiency analysis

Use:

| Operation category      | Count |
| ----------------------- | ----: |
| Scope reads             |       |
| Collision checks        |       |
| Fixture-creation calls  |       |
| Baseline reads          |       |
| Preview calls           |       |
| Heading-property calls  |       |
| Span-formatting calls   |       |
| Whole-Rem-style calls   |       |
| Type-conversion calls   |       |
| Bullet-visibility calls |       |
| Full-replacement calls  |       |
| Verification reads      |       |
| Repair calls            |       |
| Failed calls            |       |
| Repeated calls          |       |
| Avoidable calls         |       |
| Total meaningful calls  |       |

Report:

* Slowest operation
* Highest latency
* Total known latency
* Most efficient mutation route
* Most fragile mutation route
* Whether a generic replacement route was overused
* Whether verification overhead was proportional

---

## Section 25 — Safety and mutation audit

Use:

| Category                          | Allowed | Observed | Status |
| --------------------------------- | ------: | -------: | ------ |
| Test 07 roots created             |       1 |          |        |
| Fixture roots created             |       1 |          |        |
| Rems created outside Test 07 root |       0 |          |        |
| Existing old Rems updated         |       0 |          |        |
| Rems moved                        |       0 |          |        |
| Rems reordered                    |       0 |          |        |
| Rems deleted                      |       0 |          |        |
| Unrequested cards created         |       0 |          |        |
| Focus changes initiated           |       0 |          |        |
| Selection changes initiated       |       0 |          |        |
| External sources used             |       0 |          |        |
| Blind retries                     |       0 |          |        |
| Duplicate fixture roots           |       0 |          |        |
| Duplicate target Rems             |       0 |          |        |
| Unexpected plain-text changes     |       0 |          |        |

---

# 26. Scoring system

Calculate three separate scores.

---

## Section 26 — ChatGPT Agent Score

Score out of 100.

### Task understanding — 10 points

| Criterion                                 | Maximum | Awarded | Evidence |
| ----------------------------------------- | ------: | ------: | -------- |
| Understood precision-styling objective    |       4 |         |          |
| Distinguished style-only from replacement |       4 |         |          |
| Understood invariants and scope           |       2 |         |          |

### Planning and decomposition — 15 points

| Criterion                             | Maximum | Awarded | Evidence |
| ------------------------------------- | ------: | ------: | -------- |
| Created and verified neutral baseline |       4 |         |          |
| Classified operation types correctly  |       4 |         |          |
| Planned exact targets and boundaries  |       4 |         |          |
| Used preview or safe equivalent       |       3 |         |          |

### Tool selection — 15 points

| Criterion                                      | Maximum | Awarded | Evidence |
| ---------------------------------------------- | ------: | ------: | -------- |
| Selected property tools for property changes   |       4 |         |          |
| Selected span tools for phrase styling         |       4 |         |          |
| Selected full replacement only for control     |       3 |         |          |
| Selected suitable rich-text and property reads |       4 |         |          |

### Operation sequencing — 10 points

| Criterion                                      | Maximum | Awarded | Evidence |
| ---------------------------------------------- | ------: | ------: | -------- |
| Confirmed scope before mutation                |       2 |         |          |
| Captured baseline before styling               |       3 |         |          |
| Verified high-risk operations during execution |       2 |         |          |
| Completed full verification before repair      |       3 |         |          |

### Verification discipline — 20 points

| Criterion                                        | Maximum | Awarded | Evidence |
| ------------------------------------------------ | ------: | ------: | -------- |
| Compared all plain text before and after         |       5 |         |          |
| Verified exact span boundaries                   |       4 |         |          |
| Verified properties and bullet visibility        |       3 |         |          |
| Verified concept and descriptor types            |       2 |         |          |
| Verified hierarchy invariant                     |       2 |         |          |
| Verified sibling isolation                       |       2 |         |          |
| Verified formula control and replacement control |       2 |         |          |

### Recovery and self-correction — 10 points

| Criterion                      | Maximum | Awarded | Evidence |
| ------------------------------ | ------: | ------: | -------- |
| Detected genuine defects       |       3 |         |          |
| Used targeted repair           |       3 |         |          |
| Preserved unaffected rich text |       2 |         |          |
| Reverified repairs             |       2 |         |          |

When no repair is necessary, award based on correct diagnosis and avoiding unnecessary mutation.

### Scope and safety — 10 points

| Criterion                                         | Maximum | Awarded | Evidence |
| ------------------------------------------------- | ------: | ------: | -------- |
| All mutations remained within Test 07 root        |       5 |         |          |
| No deletion, movement, or old-note mutation       |       3 |         |          |
| Idempotency and uncertain outcomes handled safely |       2 |         |          |

### Efficiency — 5 points

* Mutation routes were proportional and avoided generic replacement overuse: 5

### Evidence-based reporting — 5 points

* Before/after evidence, IDs, properties, operations, warnings, and limitations were preserved: 5

Report:

* **ChatGPT Agent Score:** `/100`

---

## Section 27 — Plugin Capability Score

Score out of 100.

### Tool availability — 10 points

* Required rich-text, property, type, bullet, readback, and replacement capabilities: 10

### Execution correctness — 15 points

* Fixture creation: 4
* Stable identities and hierarchy: 4
* Targeted mutations applied to correct Rems: 7

### Span-level precision — 25 points

| Criterion                         | Maximum | Awarded | Evidence |
| --------------------------------- | ------: | ------: | -------- |
| Bold boundary                     |       5 |         |          |
| Italic boundary                   |       5 |         |          |
| Text-color boundary               |       5 |         |          |
| Phrase-highlight boundary         |       5 |         |          |
| Replacement-control bold boundary |       5 |         |          |

### Rem-property precision — 20 points

* Heading levels: 5
* Whole-Rem highlight: 4
* Concept type: 4
* Descriptor type: 3
* Bullet visibility: 4

### Content preservation — 15 points

* Style-only plain text preserved: 7
* Hierarchy and order preserved: 4
* Formula control preserved: 2
* Sibling isolation preserved: 2

### Full rich-text replacement — 5 points

* Exact intended replacement with no collateral changes: 5

### Tool composability — 5 points

* Created content could be styled, inspected, replaced, and reverified: 5

### Reliability and idempotency — 3 points

* Stable state and no duplicate mutations: 3

### Performance — 1 point

* Practical styling and verification latency: 1

### Safety and error quality — 1 point

* Unsupported properties and errors were reported clearly: 1

Report:

* **Plugin Capability Score:** `/100`

---

## Section 28 — Final Artifact Score

Score out of 100.

### Plain-text integrity — 25 points

* All style-only text unchanged: 20
* Replacement control changed exactly as required: 5

### Span styling — 25 points

* Bold phrase: 5
* Italic phrase: 5
* Text-color phrase: 5
* Highlight phrase: 5
* Replacement-control bold phrase: 5

### Rem properties — 20 points

* Heading hierarchy: 5
* Whole-Rem highlight: 4
* Concept type: 4
* Descriptor type: 3
* Bullet visibility: 4

### Hierarchy and formula preservation — 10 points

* Hierarchy and order unchanged: 6
* Formula unchanged: 4

### Precision and isolation — 10 points

* No over-application: 5
* Siblings unaffected: 5

### Cleanliness — 10 points

* No duplicate Rems: 3
* No unintended cards or types: 2
* No raw formatting markers: 2
* No metadata pollution: 1
* No unresolved accidental style: 2

Report:

* **Final Artifact Score:** `/100`

---

## Section 29 — Weighted overall score

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

* `95–100`: Exceptional precision styling
* `85–94`: Strong pass
* `75–84`: Pass with limitations
* `60–74`: Partial
* `<60`: Fail or blocked

---

# 27. Mandatory scoring caps

Evaluate every cap explicitly.

## Scope violation

Any unauthorized change outside the Test 07 root:

* Verdict: `FAIL`
* Overall score capped at `40`

## More than one Test 07 root

* Reliability score: `0`
* Overall score capped at `65`

## More than one fixture root

* Cleanliness score: `0`
* Overall score capped at `65`

## Approved root not live-confirmed

* Overall score capped at `60`

## No complete baseline snapshot

* Verification score capped at `8/20`
* Overall score capped at `70`

## Styling begins before baseline verification

* Planning score capped at `7/15`
* Overall score capped at `75`

## No preview or safe equivalent

When preview is supported but not used and no target validation occurs:

* Planning score capped at `8/15`
* Overall score capped at `85`

## Full replacement used for ordinary span styling

When a complete rich-text replacement is used for bold, italic, color, or phrase highlighting despite an available targeted route:

* Tool-selection score capped at `7/15`
* Overall score capped at `80`

## Fixture rebuilt to apply styling

* Tool-selection score: `0`
* Overall score capped at `60`

## Any unexpected style-only plain-text change

For one unresolved changed Rem:

* Plain-text artifact score capped at `10/25`
* Overall score capped at `75`

For two or more unresolved changed Rems:

* Verdict: `FAIL`
* Overall score capped at `55`

## Expected replacement not performed

* Replacement-control artifact points: `0`
* Overall score capped at `90`

## Replacement affects another Rem

* Overall score capped at `65`

## Hierarchy changed unexpectedly

* Artifact hierarchy points: `0`
* Overall score capped at `65`

## Span over-applied to an entire Rem

For any required phrase-level style:

* That span requirement scores `0`
* Overall score capped at `85`

## Styling bleeds into a sibling

* Isolation points: `0`
* Overall score capped at `75`

## Formula control changed

When the formula changes through unrelated styling and remains unrepaired:

* Formula-preservation points: `0`
* Overall score capped at `70`

## Whole-Rem highlight falsely claimed from phrase highlight

* Whole-Rem-highlight points: `0`
* ChatGPT reporting points reduced
* Overall score capped at `85`

## Concept or descriptor type inferred without property evidence

* Corresponding property points: `0`
* Overall score capped at `88`

## Bullet visibility inferred without property evidence

* Bullet-visibility points: `0`
* Overall score capped at `88`

## Unrequested cards generated

* Cleanliness points reduced
* Overall score capped at `85`

## No post-mutation verification

* Verification score: `0`
* Overall score capped at `70`

## Plain-text only used to claim styling success

When no rich-text or property evidence is collected:

* Plugin styling scores: `0`
* ChatGPT Agent Score capped at `50`
* Overall score capped at `55`

## Blind retry after uncertain mutation

* Reliability points: `0`
* Overall score capped at `65`

## Duplicate styled Rem created instead of updating target

* Reliability and cleanliness points: `0`
* Overall score capped at `60`

## False success claim

When the report claims exact precision despite contradictory readback:

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

# 28. Required scoring-cap table

Include:

| Scoring cap                                     | Triggered? | Evidence | Applied result |
| ----------------------------------------------- | ---------- | -------- | -------------- |
| Scope violation                                 |            |          |                |
| More than one Test 07 root                      |            |          |                |
| More than one fixture root                      |            |          |                |
| Approved root not live-confirmed                |            |          |                |
| No complete baseline snapshot                   |            |          |                |
| Styling began before baseline verification      |            |          |                |
| No preview or safe equivalent                   |            |          |                |
| Full replacement used for ordinary styling      |            |          |                |
| Fixture rebuilt to apply styling                |            |          |                |
| Unexpected style-only text change               |            |          |                |
| Expected replacement not performed              |            |          |                |
| Replacement affected another Rem                |            |          |                |
| Hierarchy changed unexpectedly                  |            |          |                |
| Span over-applied                               |            |          |                |
| Styling bled into sibling                       |            |          |                |
| Formula control changed                         |            |          |                |
| Whole-Rem highlight falsely claimed             |            |          |                |
| Concept or descriptor inferred without evidence |            |          |                |
| Bullet visibility inferred without evidence     |            |          |                |
| Unrequested cards generated                     |            |          |                |
| No post-mutation verification                   |            |          |                |
| Plain text used to claim styling                |            |          |                |
| Blind retry                                     |            |          |                |
| Duplicate styled Rem created                    |            |          |                |
| False success claim                             |            |          |                |
| Markdown report not created                     |            |          |                |
| Complete initial prompt missing                 |            |          |                |
| Chronological operation log missing             |            |          |                |

Apply the lowest triggered cap.

---

# 29. Verdict rules

Choose exactly one:

* `PASS`
* `PASS_WITH_WARNINGS`
* `PARTIAL`
* `BLOCKED_SCOPE_MISMATCH`
* `BLOCKED_BASELINE_INCOMPLETE`
* `BLOCKED_CONNECTION`
* `UNSUPPORTED`
* `FAIL`

## PASS

Use only when:

* Approved scope is confirmed.
* Exactly one Test 07 root exists.
* Exactly one fixture root exists.
* Baseline was captured before styling.
* All supported requested styles were applied precisely.
* Every style-only Rem preserved exact plain text.
* Exactly one designated control Rem changed plain text.
* The control replacement is exact.
* Hierarchy and order remain unchanged.
* Formula control remains unchanged.
* No style bleeds into siblings.
* Concept and descriptor types are verified.
* Bullet visibility is verified.
* Unsupported capabilities are reported honestly.
* No mutation occurs outside scope.
* The Markdown report is created and verified.
* Final adjusted score is at least 85.

## PASS_WITH_WARNINGS

Use when:

* Plain-text and hierarchy invariants pass.
* Most styling requirements succeed.
* One property such as whole-Rem highlight or bullet visibility is genuinely unsupported.
* A supported color uses an equivalent standard value.
* Minor metadata or latency limitations remain.
* No false styling claim occurs.

## PARTIAL

Use when:

* The fixture remains safe and usable.
* Some styling requirements fail or cannot be verified.
* One accidental text or property defect remains.
* Rich-text readback is incomplete.
* No scope violation or deliberate false claim occurs.

## BLOCKED_SCOPE_MISMATCH

Use when the approved root cannot be confirmed.

## BLOCKED_BASELINE_INCOMPLETE

Use when a reliable baseline cannot be created or captured.

## BLOCKED_CONNECTION

Use when connection failure prevents safe mutation or verification.

## UNSUPPORTED

Use when the plugin cannot perform or expose enough style and property operations to conduct the experiment.

## FAIL

Use when:

* Scope is violated.
* Multiple style-only Rems change text.
* The fixture is rebuilt instead of styled.
* Hierarchy is damaged.
* A duplicate fixture or styled target is created.
* Plain text alone is falsely used as evidence of styling.
* A false success claim is made.
* Old notes are modified.
* Deletion is performed.
* The final artifact is not trustworthy.

---

# 30. Final recommendation

Choose exactly one:

* `PROCEED_TO_TEST_08`
* `PROCEED_WITH_CAUTION`
* `REPEAT_TEST_07`
* `REPAIR_SPAN_FORMATTING`
* `REPAIR_REM_PROPERTY_SUPPORT`
* `REPAIR_RICH_TEXT_READBACK`
* `CORRECT_REMNOTE_SCOPE`
* `DO_NOT_PROCEED`

Base the recommendation on the strongest limiting factor.

---

# 31. Artifact manifest

Include:

| Artifact        | Type          | Parent/location          | ID or path  | Verified |
| --------------- | ------------- | ------------------------ | ----------- | -------- |
| Test 07 root    | RemNote root  | Plugin Test              | Live Rem ID | Yes/No   |
| Styling fixture | Rem hierarchy | Test 07 root             | Live Rem ID | Yes/No   |
| Test 07 report  | Markdown file | Local artifact workspace | File path   | Yes/No   |

State explicitly:

* No report was created inside RemNote.
* No existing old RemNote note was modified.
* No Rem was deleted.
* No Rem was moved or reordered.
* No external academic source was used.
* No artifact outside the Test 07 root was changed.
* No plain text changed except the designated replacement-control Rem.

---

# 32. Report-integrity declaration

End the report with:

> I confirm that this report distinguishes style-only mutation, Rem-property mutation, read-only controls, and full rich-text replacement; includes the complete user-provided Test 07 prompt; records the complete before-and-after plain-text state; does not infer styling from plain text alone; reports unsupported capabilities honestly; does not expose authentication secrets; and accurately records every unintended text, hierarchy, formula, sibling, type, bullet, or scope change.

Then include:

* Report generated at
* Report filename
* File verification result
* Approved-root ID
* Test-root ID
* Fixture-root ID
* Fixture Rems compared
* Style-only Rems expected unchanged
* Style-only Rems actually unchanged
* Expected replacement count
* Correct replacement count
* Unexpected text changes
* Hierarchy changes
* Formula-control defects
* Span requirements passed
* Rem-property requirements passed
* Unsupported requirements
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

# 33. Final chat response

After creating and verifying the RemNote artifact and local report, respond with:

**Test 07 verdict:** `[VERDICT]`
**Fixture root:** `[TITLE]`
**Fixture Rem ID:** `[REM ID]`
**Style-only Rems unchanged:** `[OBSERVED]/[EXPECTED]`
**Intentional replacements correct:** `[OBSERVED]/1`
**Span-style requirements passed:** `[OBSERVED]/5`
**Rem-property requirements passed:** `[OBSERVED]/5`
**Unexpected plain-text changes:** `[COUNT]`
**Hierarchy changes:** `[COUNT]`
**Formula-control defects:** `[COUNT]`
**Unsupported requirements:** `[COUNT]`
**Repairs performed:** `[COUNT]`
**ChatGPT Agent Score:** `[SCORE]/100`
**Plugin Capability Score:** `[SCORE]/100`
**Final Artifact Score:** `[SCORE]/100`
**Weighted overall score:** `[SCORE]/100`
**Recommendation:** `[RECOMMENDATION]`
**Report:** `[Download the complete Markdown report](working-file-link)`

Do not paste the complete report into the final response unless local file creation failed.

Do not claim completion until both the live RemNote artifact and the local Markdown report have been verified.

Begin RemNote MCP Test 07 now.

~~~~~~

## Section 3 — Test configuration

| Field | Value |
|---|---|
| Test number | 07 |
| Test name | Precision Styling and Targeted Formatting |
| Difficulty | Advanced |
| Run type | Main Run |
| Approved root | Plugin Test |
| Expected approved-root ID | `OjLcSppWfIH0cpPoh` |
| Observed approved-root ID | `OjLcSppWfIH0cpPoh` |
| Test-root title | RemNote MCP Test 07 — Precision Styling — 2026-07-12 — Run 01 |
| Test-root ID | `OPlgmZmfQeA58db5B` |
| Fixture-root title | Precision Styling Fixture — Radioactive Measurement |
| Fixture-root ID | `XuMZ886J8I7Gh6SDf` |
| Style-only targets | 10 requested categories; 9 supported categories completed; heading category unsupported |
| Full replacement targets | 1 completed |
| Deletion | Forbidden; 0 performed |
| Movement and reordering | Forbidden; 0 performed |
| External sources | Forbidden; 0 used |
| Run number | Run 01 |

## Section 4 — Starting conditions and scope confirmation

- **Bridge state:** Reachable; one active plugin connection; initial sync complete.
- **Plugin state:** Connected.
- **Focused Rem:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Selection:** `Plugin Test` only (`OjLcSppWfIH0cpPoh`).
- **Permission mode:** `full_control_delete_approval`.
- **Permission scope:** `workspace_allowed`.
- **Tool profile:** `developer`.
- **SDK version:** `0.0.46`.
- **Branch:** `fix/remnote-mcp-mass-note-creation-stability`.
- **Commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`.
- **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`.
- **Observed approved-root ID:** `OjLcSppWfIH0cpPoh`.
- **Breadcrumb:** `Plugin Test` only.
- **Initial approved-root child count:** 7.
- **Collision search:** No exact Test 07 title among direct children or scoped results.
- **Scope verdict:** `PASS`.
- **Initial warnings:** Two duplicate status reads were avoidable; no mutation resulted.

## Section 5 — Test-root and fixture creation

| Item | Evidence |
|---|---|
| Selected run | Run 01; no exact collision |
| Test-root title | `RemNote MCP Test 07 — Precision Styling — 2026-07-12 — Run 01` |
| Test-root ID | `OPlgmZmfQeA58db5B` |
| Test-root parent | `OjLcSppWfIH0cpPoh` |
| Test-root operation ID | `c0a88f52-dec1-4b75-a263-c6343a34538d` |
| Test-root idempotency key | `test07-run01-root-20260712` |
| Approved-root child count | 7 → 8 |
| Test-root breadcrumb | Plugin Test → Test 07 root |
| Fixture title | `Precision Styling Fixture — Radioactive Measurement` |
| Fixture ID | `XuMZ886J8I7Gh6SDf` |
| Fixture parent | `OPlgmZmfQeA58db5B` |
| Fixture operation ID | `319dbe0c-6327-4c27-a81d-49e8a064e593` |
| Fixture idempotency key | `test07-run01-fixture-20260712-v2` |
| Test-root child count | 0 → 1 |
| Fixture breadcrumb | Plugin Test → Test 07 root → fixture |
| Duplicate root check | Exactly one Test 07 root |
| Duplicate fixture check | Exactly one fixture root |
| First fixture attempt | Client schema rejected before execution; zero mutation; key not reused |
| Baseline repair | Both bullet controls restored to visible, then reread |
| Creation readback verdict | PASS |

## Section 6 — Baseline hierarchy

### Planned and observed hierarchy

```text
Precision Styling Fixture — Radioactive Measurement
├── 1. Core Definition
│   ├── Decay constant λ is the probability per unit time that an undecayed nucleus will decay.
│   └── A larger decay constant corresponds to a faster decay process.
├── 2. Measurement Statement
│   ├── The measured activity was 245 ± 7 Bq during the first interval.
│   └── Background correction must be applied before interpretation.
├── 3. Formula Preservation
│   ├── Activity follows the exponential relationship:
│   └── A(t)=A₀e^(−λt)
├── 4. Whole-Rem Emphasis
│   ├── Signal quality depends on detector stability and counting time.
│   └── Important: preserve every word in this sentence.
├── 5. Terminology Pair
│   └── Activity
│       └── The number of nuclear decays per unit time.
├── 6. Bullet Visibility Control
│   ├── Visible reference bullet
│   └── Hidden-bullet target
└── 7. Rich-Text Replacement Control
    └── Initial control sentence: Detector response is stable.
```

- **Observed hierarchy:** Exact match.
- **Node count:** 21 including fixture root.
- **Descendant count:** 20 excluding fixture root.
- **Direct sections:** 7.
- **Section order:** Exact 1 → 7.
- **Formula representation:** One separate formula-bearing Rem containing plain rich text `A(t)=A₀e^(−λt)`; no math node was introduced.
- **Unexpected baseline styling:** None after the two bullet-control neutralization repairs.
- **Unexpected cards:** No actual cards; global analysis card-like count 0 and target rich reads `hasCards=false`.
- **Benchmark discrepancy:** Prompt states 15 descendants, but exact tree contains 20. Classified as evaluator/benchmark defect.
- **Baseline readiness verdict:** `PASS`.

## Section 7 — Complete baseline snapshot

Snapshot timing: after narrow baseline preparation and before any preview or styling mutation.

| Label | Rem ID | Parent ID | Position | Plain text | Rich-text summary | Heading level | Rem type | Bullet visible | Text color | Highlight | Normalized text SHA-256 |
|---|---|---|---:|---|---|---|---|---|---|---|---|
| Fixture root | `XuMZ886J8I7Gh6SDf` | `OPlgmZmfQeA58db5B` | 0 | Precision Styling Fixture — Radioactive Measurement | Single unstyled text span | normal | normal | No | None detected | None detected | `13652f2ca7cdc9a526b962b70debf130a065b6b976d3a916df4876733f004e1c` |
| 1. Core Definition | `WcyZeS8vDCjFLVBn1` | `XuMZ886J8I7Gh6SDf` | 0 | 1. Core Definition | Single unstyled text span | normal | normal | No | None detected | None detected | `315bbda36152a83f24e764084a0c47d78cff3ab446aa094058c86b54f5813afd` |
| Core definition sentence | `cYfhP3gZHO3eZ47Dv` | `WcyZeS8vDCjFLVBn1` | 0 | Decay constant λ is the probability per unit time that an undecayed nucleus will decay. | Single unstyled text span | normal | normal | No | None detected | None detected | `0892dfc10b49b9b4141e766292e31c2aac2243b184c976122ee517a3ead0d738` |
| Faster-decay sentence | `yzK8rQDNid0k5mMse` | `WcyZeS8vDCjFLVBn1` | 1 | A larger decay constant corresponds to a faster decay process. | Single unstyled text span | normal | normal | No | None detected | None detected | `9dbd8c30f0770cee9a7a34f715b0259c73cccdb27f830c928f8b47d76b3c58a0` |
| 2. Measurement Statement | `6EnZasZITVV8GqxM4` | `XuMZ886J8I7Gh6SDf` | 1 | 2. Measurement Statement | Per-Rem span array NOT RETURNED; global analysis found no colored/highlighted spans | normal (global 21-node analysis) | NOT RETURNED | NOT RETURNED | None detected | None detected | `33815e990e8dd94c44bc053a4b177ed6c061d44f63e8a09c64f63f48d88a5164` |
| Measurement sentence | `jT7mRca4GaMZHsXDk` | `6EnZasZITVV8GqxM4` | 0 | The measured activity was 245 ± 7 Bq during the first interval. | Single unstyled text span | normal | normal | No | None detected | None detected | `24df6a362693a237c0ae8e83658ed9adfa300a03eeaaacceea963b4a753772b6` |
| Background sentence | `DgeGfq4dLUYscXxID` | `6EnZasZITVV8GqxM4` | 1 | Background correction must be applied before interpretation. | Single unstyled text span | normal | normal | No | None detected | None detected | `900de763d17bb1dc23df38e1f8961f01d02264116762401d9de47adeb3412cdb` |
| 3. Formula Preservation | `yBJTxYbQy2gu7OuZu` | `XuMZ886J8I7Gh6SDf` | 2 | 3. Formula Preservation | Per-Rem span array NOT RETURNED; global analysis found no colored/highlighted spans | normal (global 21-node analysis) | NOT RETURNED | NOT RETURNED | None detected | None detected | `7b4ab4ccff99d1464d43ecabf6f421854dad42a10fbf18f32ad67fe083606548` |
| Formula introduction | `32ImurJoUzcSRl5Y2` | `yBJTxYbQy2gu7OuZu` | 0 | Activity follows the exponential relationship: | Per-Rem span array NOT RETURNED; global analysis found no colored/highlighted spans | normal (global 21-node analysis) | NOT RETURNED | NOT RETURNED | None detected | None detected | `3039e249bc237061cd8fd1d853ed6afee8e63d013fe1249cf6bab2c4e72f4d88` |
| Formula Rem | `wjfNM8Hbm9yRAyePz` | `yBJTxYbQy2gu7OuZu` | 1 | A(t)=A₀e^(−λt) | Single unstyled text span; formula stored as plain rich text | normal | normal | No | None detected | None detected | `9349e63519c985a3193349f3146f60bad091b0d776f820e6e6c7409439129166` |
| 4. Whole-Rem Emphasis | `KynFbIYOjfO0Tz7Jr` | `XuMZ886J8I7Gh6SDf` | 3 | 4. Whole-Rem Emphasis | Per-Rem span array NOT RETURNED; global analysis found no colored/highlighted spans | normal (global 21-node analysis) | NOT RETURNED | NOT RETURNED | None detected | None detected | `6e547af5a1f9fbf6b3b2faa969ace03a59cd9f41257ece0f79d64c0f56e12806` |
| Signal-quality sentence | `j2qIAZphqgi9f5GhD` | `KynFbIYOjfO0Tz7Jr` | 0 | Signal quality depends on detector stability and counting time. | Single unstyled text span | normal | normal | No | None detected | None detected | `723b5bbe86472b7e585316535c214e0fb5ba183d00fba6dec920c58422c7d3df` |
| Whole-highlight target | `u4bEz14GD4bEv94d2` | `KynFbIYOjfO0Tz7Jr` | 1 | Important: preserve every word in this sentence. | Single unstyled text span | normal | normal | No | None detected | None detected | `c773b3a6198b8e834a80b137a73b2146add69650bf2ca29f925a8e38e6b97d25` |
| 5. Terminology Pair | `ifw7PeXOKc9WdzpTP` | `XuMZ886J8I7Gh6SDf` | 4 | 5. Terminology Pair | Per-Rem span array NOT RETURNED; global analysis found no colored/highlighted spans | normal (global 21-node analysis) | NOT RETURNED | NOT RETURNED | None detected | None detected | `c7c20ef4492b7fffa969a0f0dcf3a3d72d420f2ad041419e3b8cc56095cc643f` |
| Concept target | `O6DXOjldNycIxLgjS` | `ifw7PeXOKc9WdzpTP` | 0 | Activity | Single unstyled text span | normal | normal | No | None detected | None detected | `38da1505ca8373288489495101b14f24ac95078f520ad64df18272aa6054f750` |
| Descriptor target | `6DWZ7RWnboPAN2FT5` | `O6DXOjldNycIxLgjS` | 0 | The number of nuclear decays per unit time. | Single unstyled text span | normal | normal | No | None detected | None detected | `d50aa877be83aea20519ff8c031a703222b970f42e37e8b919b2b3e156e65975` |
| 6. Bullet Visibility Control | `WltqcyMN416c0L9mk` | `XuMZ886J8I7Gh6SDf` | 5 | 6. Bullet Visibility Control | Per-Rem span array NOT RETURNED; global analysis found no colored/highlighted spans | normal (global 21-node analysis) | NOT RETURNED | NOT RETURNED | None detected | None detected | `9fffa55ce9994cd15f29206a697b81c2c7d9b67d5f89ed59a886cc80a1b3c0bb` |
| Visible reference bullet | `WSrSj2ZpnEJ4BAnhk` | `WltqcyMN416c0L9mk` | 0 | Visible reference bullet | Single unstyled text span | normal | normal | Yes | None detected | None detected | `8d59b555ebdb978de0332be9ecef1f014d9fb07777f26addf9e8e1d972936516` |
| Hidden-bullet target | `CakEV8rXooKJDCBzI` | `WltqcyMN416c0L9mk` | 1 | Hidden-bullet target | Single unstyled text span | normal | normal | Yes | None detected | None detected | `9a3af0d790c54e970b9f933ead1f76ce1664c9a2813a329b7b7f54126adaa424` |
| 7. Rich-Text Replacement Control | `KqkmBb63KVbYkhJ9L` | `XuMZ886J8I7Gh6SDf` | 6 | 7. Rich-Text Replacement Control | Single unstyled text span | normal | normal | No | None detected | None detected | `de4b6542a62d5b4e77b6476c602b33c5f2a366244d0725576006c170b1633be9` |
| Replacement-control target | `x1Axw4EpHE2MTtySh` | `KqkmBb63KVbYkhJ9L` | 0 | Initial control sentence: Detector response is stable. | Single unstyled text span | normal | normal | No | None detected | None detected | `bfefd338cbe46facacc5f6a8d7d88134085fc17c1ce6ba636535d93fcf0256de` |

### Combined baseline text

```text
Precision Styling Fixture — Radioactive Measurement
1. Core Definition
Decay constant λ is the probability per unit time that an undecayed nucleus will decay.
A larger decay constant corresponds to a faster decay process.
2. Measurement Statement
The measured activity was 245 ± 7 Bq during the first interval.
Background correction must be applied before interpretation.
3. Formula Preservation
Activity follows the exponential relationship:
A(t)=A₀e^(−λt)
4. Whole-Rem Emphasis
Signal quality depends on detector stability and counting time.
Important: preserve every word in this sentence.
5. Terminology Pair
Activity
The number of nuclear decays per unit time.
6. Bullet Visibility Control
Visible reference bullet
Hidden-bullet target
7. Rich-Text Replacement Control
Initial control sentence: Detector response is stable.
```

- **Combined normalized baseline SHA-256:** `793fb7adde38e68d53ed65a3aa7c91448c17546feca7a4f1dca6b8e64853e669`
- **Direct-child order manifest:** `WcyZeS8vDCjFLVBn1 → 6EnZasZITVV8GqxM4 → yBJTxYbQy2gu7OuZu → KynFbIYOjfO0Tz7Jr → ifw7PeXOKc9WdzpTP → WltqcyMN416c0L9mk → KqkmBb63KVbYkhJ9L`
- **Parent-child manifest:** Included in the table and hierarchy.
- **Unsupported/not individually returned fields:** Marked `NOT RETURNED`; no defaults were invented.

## Section 8 — Operation-classification matrix

| Requirement | Target | Operation class | Plain-text change expected? |
|---|---|---|---|
| Heading levels | Fixture root and seven sections | `REM_PROPERTY_ONLY` | No |
| Bold phrase | Core definition sentence | `STYLE_ONLY` | No |
| Italic phrase | Faster-decay sentence | `STYLE_ONLY` | No |
| Red text | Measurement value | `STYLE_ONLY` | No |
| Yellow highlight | Background phrase | `STYLE_ONLY` | No |
| Formula preservation | Formula Rem | `READ_ONLY_CONTROL` | No |
| Whole-Rem highlight | Important sentence | `STYLE_ONLY` — plugin represents it as one full-text highlight span | No |
| Concept type | Activity | `REM_PROPERTY_ONLY` | No |
| Descriptor type | Definition child | `REM_PROPERTY_ONLY` | No |
| Bullet visibility | Hidden-bullet target | `REM_PROPERTY_ONLY` | No |
| Rich-text replacement | Control sentence | `FULL_RICH_TEXT_REPLACEMENT` | Yes — exactly one Rem |

The plugin-specific difference is whole-Rem highlighting: it is implemented and read back as one green span covering the complete Rem text, so this report classifies it as `STYLE_ONLY` with semantic whole-target equivalence.

## Section 9 — Mutation plan and preview

| Requirement | Live target ID(s) | Selected capability | Preview/validation | Safer-route rationale |
|---|---|---|---|---|
| Heading levels | Fixture root + 7 section IDs | `apply_style_plan` heading operations | Dry-run passed; actual preflight later reported SDK unsupported | Avoided rebuilding or metadata pollution |
| Bold span | `cYfhP3gZHO3eZ47Dv` | `apply_style_plan` `bold_span` | Exact-text selector dry-run | Preserves every unaffected segment |
| Italic span | `yzK8rQDNid0k5mMse` | `italic_span` | Exact selector; period excluded | No full replacement |
| Red text | `jT7mRca4GaMZHsXDk` | `text_color_span` | Exact selector `245 ± 7 Bq` | No sentence-wide color |
| Yellow highlight | `DgeGfq4dLUYscXxID` | `text_highlight_span` | Exact selector | No whole-Rem substitution |
| Formula control | `wjfNM8Hbm9yRAyePz` | Read only | Baseline rich snapshot | No mutation |
| Whole-Rem emphasis | `u4bEz14GD4bEv94d2` | `whole_rem_highlight` | Dry-run; exact target ID | Full target only; sibling excluded |
| Concept | `O6DXOjldNycIxLgjS` | `apply_remnote_command make_concept` | Dry-run | Direct property operation |
| Descriptor | `6DWZ7RWnboPAN2FT5` | `make_descriptor` | Dry-run | Direct property operation |
| Bullet visibility | `CakEV8rXooKJDCBzI` | `hide_bullet` | Dry-run; visible sibling reread | No fixture-wide workaround |
| Full replacement | `x1Axw4EpHE2MTtySh` | `update_rem_rich` | Guarded plain-text preview plus manual three-span plan | Only operation allowed to change text |

All target IDs and texts were confirmed. No preview targeted an old note or unrelated sibling. Broad design templates, reimport, reconstruction, duplicate creation, and full replacement for ordinary styling were rejected as unsafe alternatives.

## Section 10 — Chronological operation log

| # | Phase | Requirement | Tool or capability | Target | Status | Operation ID | Idempotency key | Latency | Warning/error |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Preflight | Bridge status | `get_bridge_status` | `Bridge/plugin` | **PASS** | `status-mrhxbinl` | `—` | NOT RETURNED | One active plugin connection; initial sync complete. |
| 2 | Preflight | Plugin status | `get_plugin_status` | `Plugin` | **PASS** | `b17569d9-aaaa-4e36-90a6-37bf98aa9642` | `—` | 60 ms | Connected; full-control permission mode. |
| 3 | Preflight | Repeated plugin status | `get_plugin_status` | `Plugin` | **PASS** | `931764ef-ce86-4d3f-953c-e8c544340ea3` | `—` | 33 ms | Avoidable duplicate read; no mutation. |
| 4 | Preflight | Repeated plugin status | `get_plugin_status` | `Plugin` | **PASS** | `f2632e8d-b42f-404b-ac41-4f9f491f1d0a` | `—` | 40 ms | Avoidable duplicate read; no mutation. |
| 5 | Scope | Focused Rem | `get_focused_rem` | `Plugin Test` | **PASS** | `cf0d867f-8cf6-48d2-8c44-8929f6562c6d` | `—` | 36 ms | Expected title and ID. |
| 6 | Scope | Selection | `get_current_selection` | `Plugin Test` | **PASS** | `8ec0f269-5ec7-4791-955e-827c869cbd8a` | `—` | 31 ms | Focused and selected ID matched approved root. |
| 7 | Scope | Approved breadcrumb | `get_rem_breadcrumbs` | `OjLcSppWfIH0cpPoh` | **PASS** | `fede73e0-7223-4da4-ba2c-1d9509757dd3` | `—` | 340 ms | Clean root breadcrumb. |
| 8 | Scope | Initial child count | `get_children` | `OjLcSppWfIH0cpPoh` | **PASS** | `dc121590-9387-454d-b750-913787e31fdf` | `—` | 60 ms | 7 direct children. |
| 9 | Collision | Run-title collision search | `search_rems` | `OjLcSppWfIH0cpPoh` | **PASS** | `1dc94847-6873-47ee-958f-58bcd03ef420` | `—` | 465 ms | No exact Test 07 title collision. |
| 10 | Creation | Test root | `create_rem` | `OjLcSppWfIH0cpPoh` | **PASS** | `c0a88f52-dec1-4b75-a263-c6343a34538d` | `test07-run01-root-20260712` | 58 ms | Created exactly one child. |
| 11 | Creation | Test-root breadcrumb | `get_rem_breadcrumbs` | `OPlgmZmfQeA58db5B` | **PASS** | `4787003a-9e26-4246-88d1-d7993b26bcad` | `—` | 40 ms | Correct placement proved. |
| 12 | Creation | Approved-root recount | `get_children` | `OjLcSppWfIH0cpPoh` | **PASS** | `e867cbbe-8077-478d-a4d5-90f3ef386945` | `—` | 103 ms | 8 children; exactly one Test 07 root. |
| 13 | Creation | Fixture payload validation | `create_rem_tree` | `OPlgmZmfQeA58db5B` | **CLIENT_SCHEMA_REJECTED** | `NOT APPLICABLE` | `test07-run01-fixture-20260712` | NOT APPLICABLE | Used `text` instead of required `title`; rejected before tool execution; zero mutation. |
| 14 | Creation | Fixture tree | `create_rem_tree` | `OPlgmZmfQeA58db5B` | **PASS** | `319dbe0c-6327-4c27-a81d-49e8a064e593` | `test07-run01-fixture-20260712-v2` | 439 ms | 21 Rems created; no fallback. |
| 15 | Baseline | Full hierarchy | `get_rem_tree` | `XuMZ886J8I7Gh6SDf` | **PASS** | `54e54e2b-019d-42f1-9439-eb32af122efd` | `—` | 167 ms | Exact 21-node tree. |
| 16 | Baseline | Global neutral design | `analyze_note_design` | `XuMZ886J8I7Gh6SDf` | **PASS** | `043a0556-8f9a-4701-a40d-7adbacf18fd3` | `—` | 238 ms | All headings normal; no colors/highlights/cards. |
| 17 | Baseline | Fixture root rich | `get_rem_rich` | `XuMZ886J8I7Gh6SDf` | **PASS** | `9968e948-14d4-4711-9233-a3e6ac591f8c` | `—` | 289 ms | Neutral root property snapshot. |
| 18 | Baseline | Section 1 rich | `get_rem_rich` | `WcyZeS8vDCjFLVBn1` | **PASS** | `5dc61df8-3f9e-4fb3-b48a-2a5e306254b6` | `—` | 63 ms | Neutral section snapshot. |
| 19 | Baseline | Bold target rich | `get_rem_rich` | `cYfhP3gZHO3eZ47Dv` | **PASS** | `8b2cc8c6-33c2-4b76-9d99-540d7de52b7a` | `—` | 42 ms | One unstyled span. |
| 20 | Baseline | Italic target rich | `get_rem_rich` | `yzK8rQDNid0k5mMse` | **PASS** | `470089f3-cf6f-436c-936c-cebf03b8e769` | `—` | 163 ms | One unstyled span. |
| 21 | Baseline | Color target rich | `get_rem_rich` | `jT7mRca4GaMZHsXDk` | **PASS** | `8c662bf7-a527-47cb-971c-b28a3878b6a6` | `—` | 45 ms | One unstyled span. |
| 22 | Baseline | Phrase-highlight target rich | `get_rem_rich` | `DgeGfq4dLUYscXxID` | **PASS** | `dcfb5315-080e-4a03-8934-666aa29b90b8` | `—` | 47 ms | One unstyled span. |
| 23 | Baseline | Formula control rich | `get_rem_rich` | `wjfNM8Hbm9yRAyePz` | **PASS** | `192cdc2d-5bf0-4907-ac3c-a4d17541a129` | `—` | 39 ms | Exact plain-rich formula control. |
| 24 | Baseline | Signal sibling rich | `get_rem_rich` | `j2qIAZphqgi9f5GhD` | **PASS** | `7a8c7230-f30f-48f7-8d02-03ff80ab8d26` | `—` | 41 ms | Neutral sibling. |
| 25 | Baseline | Whole-highlight target rich | `get_rem_rich` | `u4bEz14GD4bEv94d2` | **PASS** | `dfd7b693-f355-4766-b03d-8cd960897b22` | `—` | 41 ms | Neutral target. |
| 26 | Baseline | Concept target rich | `get_rem_rich` | `O6DXOjldNycIxLgjS` | **PASS** | `f57abbf5-547c-435b-9410-9f28baa7e466` | `—` | 82 ms | Type normal; child retained; no cards. |
| 27 | Baseline | Descriptor target rich | `get_rem_rich` | `6DWZ7RWnboPAN2FT5` | **PASS** | `5466a3f8-b451-4df8-ad7c-94750ba56814` | `—` | 126 ms | Type normal; no cards. |
| 28 | Baseline | Visible bullet initial rich | `get_rem_rich` | `WSrSj2ZpnEJ4BAnhk` | **PASS** | `3a148fac-3b5d-44b7-96d6-d97a62490bbb` | `—` | 83 ms | Creator default had hideBullet=true. |
| 29 | Baseline | Hidden target initial rich | `get_rem_rich` | `CakEV8rXooKJDCBzI` | **PASS** | `79442de3-613f-4b79-aa42-594d3089b324` | `—` | 110 ms | Creator default had hideBullet=true. |
| 30 | Baseline | Section 7 rich | `get_rem_rich` | `KqkmBb63KVbYkhJ9L` | **PASS** | `3a694b3e-aaa1-4d59-90f6-b7c6bf41f0d6` | `—` | 44 ms | Neutral heading and one child. |
| 31 | Baseline | Replacement target rich | `get_rem_rich` | `x1Axw4EpHE2MTtySh` | **PASS** | `ddd4238f-b1d6-4564-b9cd-179a17e77725` | `—` | 74 ms | Exact initial text; one unstyled span. |
| 32 | Scope | Fixture breadcrumb | `get_rem_breadcrumbs` | `XuMZ886J8I7Gh6SDf` | **PASS** | `00a6f3c0-a28e-47a0-b163-9a2c9503b588` | `—` | 51 ms | Approved root → Test 07 root → fixture. |
| 33 | Baseline | Fixture uniqueness | `get_children` | `OPlgmZmfQeA58db5B` | **PASS** | `5e9080e5-7954-4e53-bdd5-5a9e0888efbf` | `—` | 193 ms | Exactly one fixture root. |
| 34 | Baseline repair | Visible bullet neutralization | `set_hide_bullet` | `WSrSj2ZpnEJ4BAnhk` | **PASS** | `319c53dd-a889-4692-b10d-2cf76e321b54` | `—` | 79 ms | Set visible; text/order unchanged. |
| 35 | Baseline repair | Hidden-target neutralization | `set_hide_bullet` | `CakEV8rXooKJDCBzI` | **PASS** | `6f2213e6-4110-485c-a951-fdc57cc067a7` | `—` | 61 ms | Set visible before styling; text/order unchanged. |
| 36 | Baseline repair | Visible bullet readback | `get_rem_rich` | `WSrSj2ZpnEJ4BAnhk` | **PASS** | `f49c32f7-c2f6-4b76-a93c-0fd92bffd3e8` | `—` | 234 ms | hideBullet=false. |
| 37 | Baseline repair | Hidden target readback | `get_rem_rich` | `CakEV8rXooKJDCBzI` | **PASS** | `7898e9a8-afe4-40a7-b959-918a35a2037a` | `—` | 48 ms | hideBullet=false. |
| 38 | Preview | Heading/span/highlight plan | `apply_style_plan` | `XuMZ886J8I7Gh6SDf` | **PASS** | `1bdb6316-9da1-4757-ac23-09b9cb739fc0` | `test07-run01-style-plan-preview-20260712` | 64 ms | 13 operations validated; no mutation. |
| 39 | Preview | Concept | `apply_remnote_command` | `O6DXOjldNycIxLgjS` | **PASS** | `a06a7cf9-5e81-4dde-8429-4c46b87f0f8b` | `test07-run01-concept-preview-20260712` | 48 ms | Dry run. |
| 40 | Preview | Descriptor | `apply_remnote_command` | `6DWZ7RWnboPAN2FT5` | **PASS** | `51881a2a-cee5-452f-81b0-62f75de03dd1` | `test07-run01-descriptor-preview-20260712` | 211 ms | Dry run. |
| 41 | Preview | Bullet visibility | `apply_remnote_command` | `CakEV8rXooKJDCBzI` | **PASS** | `7fafa908-bea0-400e-bda3-0ee417ce2ee2` | `test07-run01-hide-bullet-preview-20260712` | 69 ms | Dry run. |
| 42 | Preview | Replacement plain text | `update_rem` | `x1Axw4EpHE2MTtySh` | **PASS** | `b3177f8e-a92a-40e0-9e7c-6a30f79049c6` | `test07-run01-control-replacement-preview-20260712` | 155 ms | Exact guarded text preview; no mutation. |
| 43 | Mutation | Full style plan | `apply_style_plan` | `XuMZ886J8I7Gh6SDf` | **PARTIAL** | `695be2e6-3031-4f62-afe7-0ad14f3ca4d7` | `test07-run01-style-plan-20260712` | 40 ms | Stopped at first heading; SDK_UNSUPPORTED; zero subsequent operations. |
| 44 | Mutation | Supported style plan | `apply_style_plan` | `XuMZ886J8I7Gh6SDf` | **PASS** | `0b77370e-1875-4249-bdc9-a39c9e5c8f68` | `test07-run01-supported-style-plan-20260712` | 176 ms | Five exact style operations applied. |
| 45 | Verification | Bold target | `get_rem_rich` | `cYfhP3gZHO3eZ47Dv` | **PASS** | `8f48024f-c1e6-4147-9119-eb10ff4f992b` | `—` | 164 ms | Exact bold boundary. |
| 46 | Verification | Italic target | `get_rem_rich` | `yzK8rQDNid0k5mMse` | **PASS** | `384cc4ad-7619-4a66-b440-2ea2ec0e3bec` | `—` | 79 ms | Exact italic boundary; period unstyled. |
| 47 | Verification | Red target | `get_rem_rich` | `jT7mRca4GaMZHsXDk` | **PASS** | `e89c914f-2291-4fe3-873c-bcc74eea7656` | `—` | 54 ms | Exact red boundary. |
| 48 | Verification | Yellow target | `get_rem_rich` | `DgeGfq4dLUYscXxID` | **PASS** | `6cca7ab7-8336-4faa-ab5b-4cd054c11d37` | `—` | 199 ms | Exact yellow boundary. |
| 49 | Verification | Whole-highlight target | `get_rem_rich` | `u4bEz14GD4bEv94d2` | **PASS** | `1a22b8e2-aad2-4749-b8be-1f52cb313cf0` | `—` | 53 ms | Single full-text green-highlight span. |
| 50 | Verification | Whole-highlight sibling | `get_rem_rich` | `j2qIAZphqgi9f5GhD` | **PASS** | `fbf8adea-8149-4dd9-b7ea-f794b356b755` | `—` | 53 ms | Unstyled and unchanged. |
| 51 | Mutation | Concept type | `apply_remnote_command` | `O6DXOjldNycIxLgjS` | **PASS** | `f92c00fc-7135-4469-9ced-6dc379a6f44b` | `test07-run01-concept-20260712` | 88 ms | Text/child order unchanged. |
| 52 | Verification | Concept type readback | `get_rem_rich` | `O6DXOjldNycIxLgjS` | **PASS** | `036b3412-9028-4f04-ab9d-fa866ae946fe` | `—` | 67 ms | remType=concept; no cards. |
| 53 | Mutation | Descriptor type | `apply_remnote_command` | `6DWZ7RWnboPAN2FT5` | **PASS** | `2251e518-2fa8-4317-945b-645413755997` | `test07-run01-descriptor-20260712` | 50 ms | Text unchanged. |
| 54 | Verification | Descriptor type readback | `get_rem_rich` | `6DWZ7RWnboPAN2FT5` | **PASS** | `05b337f9-07e6-42ce-8269-27e0c600ec91` | `—` | 49 ms | remType=descriptor; no cards. |
| 55 | Mutation | Hide target bullet | `apply_remnote_command` | `CakEV8rXooKJDCBzI` | **PASS** | `1573fbc1-4e80-484a-a4bb-493fc8de436c` | `test07-run01-hide-bullet-20260712` | 81 ms | Text/order unchanged. |
| 56 | Verification | Hidden target readback | `get_rem_rich` | `CakEV8rXooKJDCBzI` | **PASS** | `28b6cbd9-4157-4861-a0fa-7e9ca58dab04` | `—` | 57 ms | hideBullet=true. |
| 57 | Verification | Visible control readback | `get_rem_rich` | `WSrSj2ZpnEJ4BAnhk` | **PASS** | `8fd7cc61-9261-4cd0-b826-1ab567c73b8b` | `—` | 80 ms | hideBullet=false. |
| 58 | Mutation | Full rich replacement | `update_rem_rich` | `x1Axw4EpHE2MTtySh` | **FAIL_AFTER_PARTIAL_EXECUTION** | `d96ec925-1067-4c5d-b98d-bc89d9822805` | `test07-run01-control-replacement-20260712` | 71 ms | Plugin misclassified expected text change as style-only; mutation had completed. |
| 59 | Recovery | Replacement readback | `get_rem_rich` | `x1Axw4EpHE2MTtySh` | **PASS** | `b06b8642-64f4-4164-8e67-55625277ac7e` | `—` | 54 ms | Exact new text and exact bold span; no retry required. |
| 60 | Final verification | Full final hierarchy | `get_rem_tree` | `XuMZ886J8I7Gh6SDf` | **PASS** | `b3b36bf0-8087-43bb-839d-93f227af1590` | `—` | 201 ms | Same 21 IDs; one expected text change. |
| 61 | Final verification | Global final design | `analyze_note_design` | `XuMZ886J8I7Gh6SDf` | **PASS** | `900a7583-2b9e-44cc-9395-7210bfa73ed5` | `—` | 87 ms | 1 red, 1 yellow, 1 green; headings normal; cards 0. |
| 62 | Final verification | Formula control | `get_rem_rich` | `wjfNM8Hbm9yRAyePz` | **PASS** | `22f4ac7a-ff72-4019-ad50-edded7700472` | `—` | 59 ms | Exact baseline rich/plain state retained. |
| 63 | Final verification | Expected design map | `verify_note_design` | `XuMZ886J8I7Gh6SDf` | **PASS** | `73328486-7fa7-4bce-b066-809c7f569155` | `—` | 151 ms | No mismatches or unsupported checks for supplied expectations. |
| 64 | Final verification | Card-set audit | `verify_card_set` | `XuMZ886J8I7Gh6SDf` | **VERIFIER_DEFECT** | `93bb9050-14ab-4c4d-b747-54d350ed569f` | `—` | 109 ms | Reports cardCount=0 and no cards, but flags ordinary Rems due practice flag. |
| 65 | Final verification | Section order | `get_children` | `XuMZ886J8I7Gh6SDf` | **PASS** | `53784747-fb2f-4325-afba-2e7994254810` | `—` | 322 ms | Exactly seven sections in original order. |
| 66 | Final verification | Fixture uniqueness | `get_children` | `OPlgmZmfQeA58db5B` | **PASS** | `9278813e-8c22-48d2-b085-91a200aaeef6` | `—` | 54 ms | Exactly one fixture root. |
| 67 | Final verification | Approved-root recount | `get_children` | `OjLcSppWfIH0cpPoh` | **PASS** | `e22ff3a8-bb08-465a-b036-651e0d49d1cd` | `—` | 115 ms | Exactly one Test 07 root; child count remains 8. |
| 68 | Final verification | Selection stability | `get_current_selection` | `OjLcSppWfIH0cpPoh` | **PASS** | `3aae2158-ae1b-46f8-9967-8913bb53b9b7` | `—` | 105 ms | Focus and selection unchanged. |
| 69 | Sibling audit | Section 7 heading | `get_rem_rich` | `KqkmBb63KVbYkhJ9L` | **PASS** | `7e7e51cd-35b8-481b-b141-fc07c60d764b` | `—` | 71 ms | Heading text/rich style unchanged; control remains sole child. |
| 70 | Sibling audit | Terminology section | `get_rem_rich` | `ifw7PeXOKc9WdzpTP` | **PASS** | `634020ea-a546-4cc5-9b04-f792f8c8e42d` | `—` | 59 ms | Section remains normal and unchanged. |

## Section 11 — Plain-text invariant results

| Rem ID | Label | Before text | After text | Change expected? | Exact outcome | Status |
|---|---|---|---|---|---|---|
| `XuMZ886J8I7Gh6SDf` | Fixture root | Precision Styling Fixture — Radioactive Measurement | Precision Styling Fixture — Radioactive Measurement | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `WcyZeS8vDCjFLVBn1` | 1. Core Definition | 1. Core Definition | 1. Core Definition | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `cYfhP3gZHO3eZ47Dv` | Core definition sentence | Decay constant λ is the probability per unit time that an undecayed nucleus will decay. | Decay constant λ is the probability per unit time that an undecayed nucleus will decay. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `yzK8rQDNid0k5mMse` | Faster-decay sentence | A larger decay constant corresponds to a faster decay process. | A larger decay constant corresponds to a faster decay process. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `6EnZasZITVV8GqxM4` | 2. Measurement Statement | 2. Measurement Statement | 2. Measurement Statement | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `jT7mRca4GaMZHsXDk` | Measurement sentence | The measured activity was 245 ± 7 Bq during the first interval. | The measured activity was 245 ± 7 Bq during the first interval. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `DgeGfq4dLUYscXxID` | Background sentence | Background correction must be applied before interpretation. | Background correction must be applied before interpretation. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `yBJTxYbQy2gu7OuZu` | 3. Formula Preservation | 3. Formula Preservation | 3. Formula Preservation | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `32ImurJoUzcSRl5Y2` | Formula introduction | Activity follows the exponential relationship: | Activity follows the exponential relationship: | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `wjfNM8Hbm9yRAyePz` | Formula Rem | A(t)=A₀e^(−λt) | A(t)=A₀e^(−λt) | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `KynFbIYOjfO0Tz7Jr` | 4. Whole-Rem Emphasis | 4. Whole-Rem Emphasis | 4. Whole-Rem Emphasis | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `j2qIAZphqgi9f5GhD` | Signal-quality sentence | Signal quality depends on detector stability and counting time. | Signal quality depends on detector stability and counting time. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `u4bEz14GD4bEv94d2` | Whole-highlight target | Important: preserve every word in this sentence. | Important: preserve every word in this sentence. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `ifw7PeXOKc9WdzpTP` | 5. Terminology Pair | 5. Terminology Pair | 5. Terminology Pair | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `O6DXOjldNycIxLgjS` | Concept target | Activity | Activity | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `6DWZ7RWnboPAN2FT5` | Descriptor target | The number of nuclear decays per unit time. | The number of nuclear decays per unit time. | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `WltqcyMN416c0L9mk` | 6. Bullet Visibility Control | 6. Bullet Visibility Control | 6. Bullet Visibility Control | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `WSrSj2ZpnEJ4BAnhk` | Visible reference bullet | Visible reference bullet | Visible reference bullet | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `CakEV8rXooKJDCBzI` | Hidden-bullet target | Hidden-bullet target | Hidden-bullet target | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `KqkmBb63KVbYkhJ9L` | 7. Rich-Text Replacement Control | 7. Rich-Text Replacement Control | 7. Rich-Text Replacement Control | No | Exact | `UNCHANGED_AS_REQUIRED` |
| `x1Axw4EpHE2MTtySh` | Replacement-control target | Initial control sentence: Detector response is stable. | Updated control sentence: Detector response remained stable for 10 minutes. | Yes | Exact | `CHANGED_AS_REQUIRED` |

- **Total Rems compared:** 21.
- **Expected unchanged Rems:** 20.
- **Actually unchanged Rems:** 20.
- **Expected changed Rems:** 1.
- **Correctly changed Rems:** 1.
- **Unexpectedly changed Rems:** 0.
- **Missing expected changes:** 0.
- **Baseline combined hash:** `793fb7adde38e68d53ed65a3aa7c91448c17546feca7a4f1dca6b8e64853e669`.
- **Observed final combined hash:** `429e06049b23177ed1ad6bee36e83044033e42ef622f2cdd6035de6900551349`.
- **Expected final combined hash:** `429e06049b23177ed1ad6bee36e83044033e42ef622f2cdd6035de6900551349`.
- **Plain-text invariant verdict:** `PASS`.

### Expected and observed final text

```text
Precision Styling Fixture — Radioactive Measurement
1. Core Definition
Decay constant λ is the probability per unit time that an undecayed nucleus will decay.
A larger decay constant corresponds to a faster decay process.
2. Measurement Statement
The measured activity was 245 ± 7 Bq during the first interval.
Background correction must be applied before interpretation.
3. Formula Preservation
Activity follows the exponential relationship:
A(t)=A₀e^(−λt)
4. Whole-Rem Emphasis
Signal quality depends on detector stability and counting time.
Important: preserve every word in this sentence.
5. Terminology Pair
Activity
The number of nuclear decays per unit time.
6. Bullet Visibility Control
Visible reference bullet
Hidden-bullet target
7. Rich-Text Replacement Control
Updated control sentence: Detector response remained stable for 10 minutes.
```

The final representation equals the baseline representation with only the old control sentence replaced by the required new control sentence.

## Section 12 — Hierarchy invariant results

| Rem ID | Label | Before parent | After parent | Before position | After position | Expected unchanged | Status |
|---|---|---|---|---:|---:|---|---|
| `XuMZ886J8I7Gh6SDf` | Fixture root | `OPlgmZmfQeA58db5B` | `OPlgmZmfQeA58db5B` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `WcyZeS8vDCjFLVBn1` | 1. Core Definition | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `cYfhP3gZHO3eZ47Dv` | Core definition sentence | `WcyZeS8vDCjFLVBn1` | `WcyZeS8vDCjFLVBn1` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `yzK8rQDNid0k5mMse` | Faster-decay sentence | `WcyZeS8vDCjFLVBn1` | `WcyZeS8vDCjFLVBn1` | 1 | 1 | Yes | `UNCHANGED_AS_REQUIRED` |
| `6EnZasZITVV8GqxM4` | 2. Measurement Statement | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 1 | 1 | Yes | `UNCHANGED_AS_REQUIRED` |
| `jT7mRca4GaMZHsXDk` | Measurement sentence | `6EnZasZITVV8GqxM4` | `6EnZasZITVV8GqxM4` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `DgeGfq4dLUYscXxID` | Background sentence | `6EnZasZITVV8GqxM4` | `6EnZasZITVV8GqxM4` | 1 | 1 | Yes | `UNCHANGED_AS_REQUIRED` |
| `yBJTxYbQy2gu7OuZu` | 3. Formula Preservation | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 2 | 2 | Yes | `UNCHANGED_AS_REQUIRED` |
| `32ImurJoUzcSRl5Y2` | Formula introduction | `yBJTxYbQy2gu7OuZu` | `yBJTxYbQy2gu7OuZu` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `wjfNM8Hbm9yRAyePz` | Formula Rem | `yBJTxYbQy2gu7OuZu` | `yBJTxYbQy2gu7OuZu` | 1 | 1 | Yes | `UNCHANGED_AS_REQUIRED` |
| `KynFbIYOjfO0Tz7Jr` | 4. Whole-Rem Emphasis | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 3 | 3 | Yes | `UNCHANGED_AS_REQUIRED` |
| `j2qIAZphqgi9f5GhD` | Signal-quality sentence | `KynFbIYOjfO0Tz7Jr` | `KynFbIYOjfO0Tz7Jr` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `u4bEz14GD4bEv94d2` | Whole-highlight target | `KynFbIYOjfO0Tz7Jr` | `KynFbIYOjfO0Tz7Jr` | 1 | 1 | Yes | `UNCHANGED_AS_REQUIRED` |
| `ifw7PeXOKc9WdzpTP` | 5. Terminology Pair | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 4 | 4 | Yes | `UNCHANGED_AS_REQUIRED` |
| `O6DXOjldNycIxLgjS` | Concept target | `ifw7PeXOKc9WdzpTP` | `ifw7PeXOKc9WdzpTP` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `6DWZ7RWnboPAN2FT5` | Descriptor target | `O6DXOjldNycIxLgjS` | `O6DXOjldNycIxLgjS` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `WltqcyMN416c0L9mk` | 6. Bullet Visibility Control | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 5 | 5 | Yes | `UNCHANGED_AS_REQUIRED` |
| `WSrSj2ZpnEJ4BAnhk` | Visible reference bullet | `WltqcyMN416c0L9mk` | `WltqcyMN416c0L9mk` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |
| `CakEV8rXooKJDCBzI` | Hidden-bullet target | `WltqcyMN416c0L9mk` | `WltqcyMN416c0L9mk` | 1 | 1 | Yes | `UNCHANGED_AS_REQUIRED` |
| `KqkmBb63KVbYkhJ9L` | 7. Rich-Text Replacement Control | `XuMZ886J8I7Gh6SDf` | `XuMZ886J8I7Gh6SDf` | 6 | 6 | Yes | `UNCHANGED_AS_REQUIRED` |
| `x1Axw4EpHE2MTtySh` | Replacement-control target | `KqkmBb63KVbYkhJ9L` | `KqkmBb63KVbYkhJ9L` | 0 | 0 | Yes | `UNCHANGED_AS_REQUIRED` |

- **Fixture-root ID stability:** PASS.
- **Direct-section count:** 7 before and after.
- **Section-order stability:** PASS.
- **Parent-child stability:** PASS.
- **Duplicate Rems:** 0.
- **Missing Rems:** 0.
- **Unintended movements/reordering:** 0.
- **Control Rem original position:** retained at position 0 under section 7.
- **Hierarchy invariant verdict:** `PASS`.

## Section 13 — Heading-level results

| Rem | Rem ID | Expected heading role | Observed property | Plain text unchanged | Status |
|---|---|---|---|---|---|
| Fixture root | `XuMZ886J8I7Gh6SDf` | Highest suitable heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 1. Core Definition | `WcyZeS8vDCjFLVBn1` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 2. Measurement Statement | `6EnZasZITVV8GqxM4` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 3. Formula Preservation | `yBJTxYbQy2gu7OuZu` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 4. Whole-Rem Emphasis | `KynFbIYOjfO0Tz7Jr` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 5. Terminology Pair | `ifw7PeXOKc9WdzpTP` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 6. Bullet Visibility Control | `WltqcyMN416c0L9mk` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |
| 7. Rich-Text Replacement Control | `KqkmBb63KVbYkhJ9L` | Shared section heading | `normal` | Yes | `PROPERTY_UNSUPPORTED` |

The actual mutation stopped before any heading change. The plugin explicitly disabled existing-Rem heading mutation to prevent visible child pollution. No descendant heading pollution occurred. **Heading verdict: `PROPERTY_UNSUPPORTED`, safely handled.**

## Section 14 — Phrase-level styling results

| Target phrase | Rem ID | Requested style | Observed style | Exact start boundary | Exact end boundary | Plain text unchanged | Adjacent text unaffected? | Status |
|---|---|---|---|---|---|---|---|---|
| `Decay constant` | `cYfhP3gZHO3eZ47Dv` | Bold | Bold exact text | Yes — 0:14 | Yes | Yes | `EXACT_STYLE_MATCH` |
| `faster decay process` | `yzK8rQDNid0k5mMse` | Italic | Italic exact text | Yes — 41:61 | Yes | Yes; final period unstyled | `EXACT_STYLE_MATCH` |
| `245 ± 7 Bq` | `jT7mRca4GaMZHsXDk` | Red text | `red` rich style; operation normalized to `Red` | Yes — 26:36 | Yes | Yes | `EXACT_STYLE_MATCH` |
| `Background correction` | `DgeGfq4dLUYscXxID` | Yellow highlight | `yellow` rich highlight; operation normalized to `Yellow` | Yes — 0:21 | Yes | Yes | `EXACT_STYLE_MATCH` |
| `10 minutes` | `x1Axw4EpHE2MTtySh` | Bold in replacement | Bold exact text | Yes — exact middle span | Yes | Yes; period unbolded | `EXACT_STYLE_MATCH` |

## Section 15 — Whole-Rem highlight result

- **Target Rem ID:** `u4bEz14GD4bEv94d2`.
- **Requested highlight:** Green whole-Rem emphasis.
- **Observed representation:** One rich-text span containing the complete 48-character Rem text with `highlight=green`; operation normalized color to `Green`.
- **Complete target affected:** Yes.
- **Target text unchanged:** Yes.
- **Sibling unaffected:** Yes; `j2qIAZphqgi9f5GhD` remains one unstyled text span.
- **Unsupported fallback:** None; no phrase-only subset was used.
- **Verdict:** `SEMANTIC_STYLE_MATCH` because the plugin exposes the result as a complete full-text span rather than a distinct whole-Rem metadata field.

## Section 16 — Concept and descriptor result

| Property | Concept target | Descriptor target |
|---|---|---|
| Rem ID | `O6DXOjldNycIxLgjS` | `6DWZ7RWnboPAN2FT5` |
| Before type | normal | normal |
| After type | concept | descriptor |
| Parent | `ifw7PeXOKc9WdzpTP` | `O6DXOjldNycIxLgjS` |
| Before text | Activity | The number of nuclear decays per unit time. |
| After text | Activity | The number of nuclear decays per unit time. |
| Child order | Descriptor child retained at index 0 | No children |
| Direct card metadata | `hasCards=false` | `hasCards=false` |
| Unrelated type changes | None observed | None observed |

**Verdict:** `EXACT_STYLE_MATCH`. Type evidence comes from direct `remType` readback, not hierarchy inference.

## Section 17 — Bullet-visibility result

| Rem | Rem ID | Before visibility | After visibility | Expected | Plain text unchanged | Status |
|---|---|---|---|---|---|---|
| Visible reference bullet | `WSrSj2ZpnEJ4BAnhk` | Visible (`hideBullet=false`) | Visible (`hideBullet=false`) | Visible | Yes | `EXACT_STYLE_MATCH` |
| Hidden-bullet target | `CakEV8rXooKJDCBzI` | Visible (`hideBullet=false`) | Hidden (`hideBullet=true`) | Hidden | Yes | `EXACT_STYLE_MATCH` |

Their order remained 0 then 1. No fixture-wide hide operation was used. No unrelated bullet-visibility change was requested or inferred.

## Section 18 — Formula-preservation control

| Property | Before | After | Status |
|---|---|---|---|
| Plain text | `A(t)=A₀e^(−λt)` | `A(t)=A₀e^(−λt)` | PASS |
| Rich representation | One unstyled text span | One unstyled text span | PASS |
| Parent ID | `yBJTxYbQy2gu7OuZu` | `yBJTxYbQy2gu7OuZu` | PASS |
| Position | 1 | 1 | PASS |
| Subscript zero | `₀` present | `₀` present | PASS |
| Negative exponent | `−` and exponent notation intact | Intact | PASS |
| Lambda | `λ` present | `λ` present | PASS |

**Collateral-damage verdict:** none. The formula stayed under `3. Formula Preservation` with the same ID and source representation.

## Section 19 — Full rich-text replacement control

| Property | Before | Expected after | Observed after | Status |
|---|---|---|---|---|
| Rem ID | `x1Axw4EpHE2MTtySh` | Same | `x1Axw4EpHE2MTtySh` | PASS |
| Parent ID | `KqkmBb63KVbYkhJ9L` | Same | `KqkmBb63KVbYkhJ9L` | PASS |
| Position | 0 | Same | 0 | PASS |
| Plain text | `Initial control sentence: Detector response is stable.` | `Updated control sentence: Detector response remained stable for 10 minutes.` | Exact expected text | PASS |
| Bold span | None | `10 minutes` | Exact `10 minutes` only | PASS |
| Old text count | 1 | 0 | 0 | PASS |
| New text count | 0 | 1 | 1 | PASS |
| Duplicate Rem count | 0 | 0 | 0 | PASS |

This text change is expected because the operation was classified as `FULL_RICH_TEXT_REPLACEMENT`; it does not violate the style-only invariant. The plugin returned a false failure after applying it, but immediate independent readback proved exact completion. No blind retry occurred.

## Section 20 — Sibling-isolation audit

| Styled target | Control sibling | Target change present | Control sibling unchanged | Status |
|---|---|---|---|---|
| Bold sentence | Faster-decay sentence | Yes, exact bold | Yes; only its own exact italic target present | PASS |
| Red-value sentence | Background-correction sentence | Yes, exact red phrase | Yes; only its own exact yellow phrase present | PASS |
| Whole-highlight sentence | Signal-quality sentence | Yes, full-text green span | Yes; sibling unstyled | PASS |
| Hidden-bullet target | Visible reference bullet | Yes, hidden | Yes, visible | PASS |
| Control sentence | Section-7 heading | Yes, exact replacement | Yes; heading text and rich style unchanged | PASS |
| Concept parent | Terminology section heading | Yes, concept type | Yes; section remains normal and unchanged | PASS |

No formatting bleed was detected.

## Section 21 — Final style matrix

| Label | Rem ID | Heading level | Rem type | Bullet visible | Bold spans | Italic spans | Text-color spans | Highlight spans | Whole-Rem highlight |
|---|---|---|---|---|---|---|---|---|---|
| Fixture root | `XuMZ886J8I7Gh6SDf` | normal | normal | No | — | — | — | — | — |
| 1. Core Definition | `WcyZeS8vDCjFLVBn1` | normal | normal | No | — | — | — | — | — |
| Core definition sentence | `cYfhP3gZHO3eZ47Dv` | normal | normal | No | Decay constant | — | — | — | — |
| Faster-decay sentence | `yzK8rQDNid0k5mMse` | normal | normal | No | — | faster decay process | — | — | — |
| 2. Measurement Statement | `6EnZasZITVV8GqxM4` | normal | NOT RETURNED | NOT RETURNED | — | — | — | — | — |
| Measurement sentence | `jT7mRca4GaMZHsXDk` | normal | normal | No | — | — | 245 ± 7 Bq → red | — | — |
| Background sentence | `DgeGfq4dLUYscXxID` | normal | normal | No | — | — | — | Background correction → yellow | — |
| 3. Formula Preservation | `yBJTxYbQy2gu7OuZu` | normal | NOT RETURNED | NOT RETURNED | — | — | — | — | — |
| Formula introduction | `32ImurJoUzcSRl5Y2` | normal | NOT RETURNED | NOT RETURNED | — | — | — | — | — |
| Formula Rem | `wjfNM8Hbm9yRAyePz` | normal | normal | No | — | — | — | — | — |
| 4. Whole-Rem Emphasis | `KynFbIYOjfO0Tz7Jr` | normal | NOT RETURNED | NOT RETURNED | — | — | — | — | — |
| Signal-quality sentence | `j2qIAZphqgi9f5GhD` | normal | normal | No | — | — | — | — | — |
| Whole-highlight target | `u4bEz14GD4bEv94d2` | normal | normal | No | — | — | — | Full text → green | Green represented as full-span rich highlight |
| 5. Terminology Pair | `ifw7PeXOKc9WdzpTP` | normal | normal | No | — | — | — | — | — |
| Concept target | `O6DXOjldNycIxLgjS` | normal | concept | No | — | — | — | — | — |
| Descriptor target | `6DWZ7RWnboPAN2FT5` | normal | descriptor | No | — | — | — | — | — |
| 6. Bullet Visibility Control | `WltqcyMN416c0L9mk` | normal | NOT RETURNED | NOT RETURNED | — | — | — | — | — |
| Visible reference bullet | `WSrSj2ZpnEJ4BAnhk` | normal | normal | Yes | — | — | — | — | — |
| Hidden-bullet target | `CakEV8rXooKJDCBzI` | normal | normal | No | — | — | — | — | — |
| 7. Rich-Text Replacement Control | `KqkmBb63KVbYkhJ9L` | normal | normal | No | — | — | — | — | — |
| Replacement-control target | `x1Axw4EpHE2MTtySh` | normal | normal | No | 10 minutes | — | — | — | — |

## Section 22 — Precision assessment

| Requirement | Classification | Evidence | Limitation |
|---|---|---|---|
| Heading levels | `PROPERTY_UNSUPPORTED` | Actual mutation stopped before any heading change; final global analysis shows all 21 headings normal | Existing-Rem heading mutation disabled to prevent child pollution |
| Bold phrase | `EXACT_STYLE_MATCH` | Exact rich span `Decay constant` | None |
| Italic phrase | `EXACT_STYLE_MATCH` | Exact rich span; period excluded | None |
| Text color | `EXACT_STYLE_MATCH` | Exact red phrase `245 ± 7 Bq` | Normalized display value `Red` |
| Phrase highlight | `EXACT_STYLE_MATCH` | Exact yellow phrase `Background correction` | Normalized display value `Yellow` |
| Formula preservation | `EXACT_STYLE_MATCH` | Baseline/final plain and rich state identical | Formula is intentionally stored as plain rich text, not a math node |
| Whole-Rem highlight | `SEMANTIC_STYLE_MATCH` | One green highlight span covers all 48 target characters; sibling unaffected | Global analyzer categorizes it as a highlight span rather than a separate whole-Rem property |
| Concept type | `EXACT_STYLE_MATCH` | `remType=concept` and same child | None |
| Descriptor type | `EXACT_STYLE_MATCH` | `remType=descriptor` and same parent | None |
| Bullet visibility | `EXACT_STYLE_MATCH` | Visible control false/hidden target true for `hideBullet` | Baseline neutralization was required because creator initially hid both |
| Full replacement | `EXACT_STYLE_MATCH` | Same Rem ID; exact new text; exact bold span | Tool returned a false failure after successful partial execution |

## Section 23 — Defects and recovery

| Defect | Target | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
|---|---|---|---|---|---|---|---|
| Fixture schema used `text` instead of `title` | Fixture payload | Client schema validation | ChatGPT tool-selection failure | Payload key mismatch | Correct payload; new idempotency key | Fixture created once; no partial write | Full tree verified |
| Exact hierarchy count conflicts with stated 15 descendants | Benchmark | Manual/source count and live tree | Evaluator or benchmark defect | Exact tree has 20 descendants | Follow exact hierarchy; document discrepancy | No artifact repair needed | Live 21-node tree exact |
| Both bullet controls initially hidden | Two control Rems | Baseline property readback | Fixture problem | `create_rem_tree` defaulted both to hidden | Narrowly set both visible before styling | PASS | Both reread `hideBullet=false` |
| Existing-Rem heading mutation unavailable | Fixture root + sections | Actual style-plan preflight | Unsupported SDK capability | Safety guard prevents visible child pollution | Do not bypass or rebuild | Heading requirement remains unsupported | Global final analysis shows all normal; no pollution |
| Full replacement returned false failure after applying | Control Rem | Operation error + immediate rich readback | Plugin implementation failure | Style-only invariant incorrectly enforced on designated replacement | Read before retry; retry only if absent | Exact desired state already present; no retry | Rich readback and final tree pass |
| Card verifier contradicts zero-card evidence | Fixture | `verify_card_set` | Verification-tool defect | `cardCount=0`, yet ordinary practice-enabled Rems flagged | Do not mutate without actual card evidence | No repair; avoided unnecessary card changes | Analyzer cardLike=0; direct targets `hasCards=false` |

No post-styling artifact defect required repair. The only repairs were baseline preparation of the two bullet controls.

## Section 24 — Efficiency analysis

| Operation category | Count |
|---|---:|
| Scope reads | 11, including final recount/selection and two avoidable duplicate status reads |
| Collision checks | 1 |
| Fixture-creation calls | 1 executed + 1 client-schema rejection before execution |
| Baseline reads | 20 |
| Preview calls | 5 |
| Heading-property calls | 1 grouped attempt; safely stopped as unsupported |
| Span-formatting calls | 1 grouped call containing 4 phrase operations |
| Whole-Rem-style calls | 1 operation inside the grouped supported style call |
| Type-conversion calls | 2 |
| Bullet-visibility calls | 3 mutations: 2 baseline preparation + 1 test mutation |
| Full-replacement calls | 1 actual + 1 non-mutating guarded preview |
| Verification reads | 21, including rich, tree, design, property, formula, sibling and scope checks |
| Repair calls | 2 baseline-preparation repairs; 0 post-styling repairs |
| Failed calls | 1 unsupported grouped heading plan; 1 replacement false failure; 1 contradictory card verifier; 1 client schema rejection |
| Repeated calls | 2 avoidable duplicate status reads; 0 blind write retries |
| Avoidable calls | 3: two duplicate status reads and one schema-rejected payload |
| Total meaningful RemNote operations | 70 logged entries, including one local schema rejection |

- **Slowest known operation:** `search_rems` for `Run-title collision search`, 465 ms.
- **Highest known latency:** 465 ms.
- **Total known RemNote latency:** 7360 ms; bridge-status latency was not returned.
- **Most efficient mutation route:** One five-operation targeted style plan followed by selective direct rich readback.
- **Most fragile route:** Existing-Rem heading mutation and full replacement error classification.
- **Generic replacement overused:** No.
- **Verification overhead proportional:** Yes, because rich/property evidence was available mainly per Rem and the benchmark demanded exact boundaries and sibling isolation.

## Section 25 — Safety and mutation audit

| Category | Allowed | Observed | Status |
|---|---:|---:|---|
| Test 07 roots created | 1 | 1 | PASS |
| Fixture roots created | 1 | 1 | PASS |
| Rems created outside Test 07 root | 0 | 0 | PASS |
| Existing old Rems updated | 0 | 0 | PASS |
| Rems moved | 0 | 0 | PASS |
| Rems reordered | 0 | 0 | PASS |
| Rems deleted | 0 | 0 | PASS |
| Unrequested cards created | 0 | 0 actual cards | PASS; verifier defect documented |
| Focus changes initiated | 0 | 0 | PASS |
| Selection changes initiated | 0 | 0 | PASS |
| External sources used | 0 | 0 | PASS |
| Blind retries | 0 | 0 | PASS |
| Duplicate fixture roots | 0 | 0 | PASS |
| Duplicate target Rems | 0 | 0 | PASS |
| Unexpected plain-text changes | 0 | 0 | PASS |

## Section 26 — ChatGPT Agent Score

### Task understanding — 10/10

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Understood precision-styling objective | 4 | 4 | Exact span/property targets and controls distinguished |
| Distinguished style-only from replacement | 4 | 4 | Correct classification; replacement handled as expected text change |
| Understood invariants and scope | 2 | 2 | Approved root confirmed; no out-of-scope mutation |

### Planning and decomposition — 14/15

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Created and verified neutral baseline | 4 | 4 | Complete hierarchy and target snapshot; bullet baseline repaired |
| Classified operation types correctly | 4 | 4 | Full matrix included |
| Planned exact targets and boundaries | 4 | 4 | Exact selectors/IDs and expected text behavior |
| Used preview or safe equivalent | 3 | 2 | All mutation classes previewed; initial fixture payload had a schema-key error |

### Tool selection — 15/15

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Selected property tools for property changes | 4 | 4 | Concept, descriptor, bullet and heading routes separated |
| Selected span tools for phrase styling | 4 | 4 | Targeted span plan; no ordinary full replacement |
| Selected full replacement only for control | 3 | 3 | One `update_rem_rich` control only |
| Selected suitable rich-text/property reads | 4 | 4 | Direct rich/property readback and design verifier |

### Operation sequencing — 10/10

All scope, baseline, preview, mutation, high-risk readback, full verification, and recovery order requirements were followed.

### Verification discipline — 20/20

All 21 plain texts, exact span boundaries, supported properties, type changes, hierarchy, sibling isolation, formula control, and replacement control were verified using actual RemNote state.

### Recovery and self-correction — 10/10

The schema error, bullet baseline defect, heading limitation, uncertain replacement response, and contradictory card verifier were correctly diagnosed. No unnecessary broad repair or blind retry occurred.

### Scope and safety — 10/10

All mutations remained under the Test 07 root. There was no deletion, movement, reordering, old-note mutation, focus change, or duplicate fallback.

### Efficiency — 4/5

Mutation routes were proportional, but two duplicate status reads and one schema-rejected payload were avoidable.

### Evidence-based reporting — 5/5

The report preserves IDs, operations, properties, exact rich spans, warnings, limitations, defects, scores, and caps.

**ChatGPT Agent Score: 98/100**

## Section 27 — Plugin Capability Score

| Category | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Tool availability | 10 | 9 | All required routes except safe existing-Rem heading mutation |
| Execution correctness | 15 | 15 | Fixture, identities, hierarchy and all supported mutations correct |
| Span-level precision | 25 | 25 | Five of five exact boundaries |
| Rem-property precision | 20 | 15 | Whole highlight 4, concept 4, descriptor 3, bullet 4; headings 0 |
| Content preservation | 15 | 15 | Text, hierarchy, formula and siblings preserved |
| Full rich-text replacement | 5 | 4 | Exact artifact, but tool returned false failure |
| Tool composability | 5 | 4 | Creation, styling, properties and readback composed; card verifier defective |
| Reliability and idempotency | 3 | 2 | Stable IDs and keys; false partial-failure classification |
| Performance | 1 | 1 | Practical sub-second operations |
| Safety and error quality | 1 | 0 | Heading guard was good, but replacement and card-verifier errors were misleading |

**Plugin Capability Score: 90/100**

## Section 28 — Final Artifact Score

| Category | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Plain-text integrity | 25 | 25 | 20 unchanged + 1 exact expected change |
| Span styling | 25 | 25 | Five exact span requirements |
| Rem properties | 20 | 15 | Whole highlight, concept, descriptor and bullet pass; headings unsupported |
| Hierarchy and formula preservation | 10 | 10 | Exact hierarchy/order and unchanged formula |
| Precision and isolation | 10 | 10 | No over-application or sibling bleed |
| Cleanliness | 10 | 10 | No duplicates, actual cards, raw markers, metadata pollution or unresolved accidental style |

**Final Artifact Score: 95/100**

## Section 29 — Weighted overall score

- **Agent contribution:** `0.35 × 98 = 34.30`
- **Plugin contribution:** `0.40 × 90 = 36.00`
- **Artifact contribution:** `0.25 × 95 = 23.75`
- **Raw weighted score:** `94.05/100`
- **Applied scoring cap:** None triggered.
- **Final adjusted score:** `94.05/100`
- **Rating:** Strong pass.
- **Final verdict:** `PASS_WITH_WARNINGS`.

### Required scoring-cap table

| Scoring cap | Triggered? | Evidence | Applied result |
|---|---|---|---|
| Scope violation | No | All mutations beneath Test 07 root; final approved-root recount clean | No cap |
| More than one Test 07 root | No | Exactly one direct child with Test 07 title | No cap |
| More than one fixture root | No | Test root has exactly one child | No cap |
| Approved root not live-confirmed | No | Expected and observed ID both OjLcSppWfIH0cpPoh | No cap |
| No complete baseline snapshot | No | 21-node baseline text/hierarchy plus target rich/property snapshot captured before styling | No cap |
| Styling began before baseline verification | No | Baseline repaired and reverified before dry runs/mutations | No cap |
| No preview or safe equivalent | No | Dry-run plan, property dry runs, guarded replacement preview | No cap |
| Full replacement used for ordinary styling | No | Targeted span route used for all ordinary styling | No cap |
| Fixture rebuilt to apply styling | No | Fixture created once and modified in place | No cap |
| Unexpected style-only text change | No | 20/20 unchanged nodes exact | No cap |
| Expected replacement not performed | No | Exact replacement verified on same Rem ID | No cap |
| Replacement affected another Rem | No | Only control Rem changed text | No cap |
| Hierarchy changed unexpectedly | No | All IDs, parents, positions, section order stable | No cap |
| Span over-applied | No | All five span boundaries exact | No cap |
| Styling bled into sibling | No | Six sibling-control comparisons pass | No cap |
| Formula control changed | No | Formula plain/rich/parent/position stable | No cap |
| Whole-Rem highlight falsely claimed | No | Reported accurately as a full-text green rich span / semantic equivalent | No cap |
| Concept or descriptor inferred without evidence | No | Direct `remType` readback for both | No cap |
| Bullet visibility inferred without evidence | No | Direct `hideBullet` readback for both controls | No cap |
| Unrequested cards generated | No | cardCount=0; target rich reads `hasCards=false`; analyzer cardLike=0 | No cap |
| No post-mutation verification | No | Full tree, rich reads, design map, formula, sibling and scope verification completed | No cap |
| Plain text used to claim styling | No | Rich span/property evidence collected | No cap |
| Blind retry | No | Uncertain replacement was read back and not retried | No cap |
| Duplicate styled Rem created | No | Same IDs retained; no extra fixture targets | No cap |
| False success claim | No | Heading limitation and verifier defects reported explicitly | No cap |
| Markdown report not created | No | Local file `remnote-mcp-test-07-precision-styling-report-2026-07-12-run-02.md` created and verified | No cap |
| Complete initial prompt missing | No | Full 65,241-character user prompt embedded | No cap |
| Chronological operation log missing | No | 70 meaningful entries included | No cap |

The lowest triggered cap is `NOT APPLICABLE`; no mandatory cap applies.

## Section 30 — Final recommendation

**Recommendation: `PROCEED_WITH_CAUTION`**

The fixture is safe, precise, and verified. Test 08 may proceed, but existing-Rem heading mutation should remain disabled until its SDK behavior can be validated without visible child pollution. The full-replacement invariant classifier and card verifier should also be corrected.

## Section 31 — Artifact manifest

| Artifact | Type | Parent/location | ID or path | Verified |
|---|---|---|---|---|
| Test 07 root | RemNote root | Plugin Test | `OPlgmZmfQeA58db5B` | Yes |
| Precision styling fixture | RemNote hierarchy | Test 07 root | `XuMZ886J8I7Gh6SDf` | Yes |
| Test 07 report | Markdown file | Local artifact workspace | `/mnt/data/remnote-mcp-test-07-precision-styling-report-2026-07-12-run-02.md` | Yes — exists, `.md`, nonempty, complete prompt and required sections present |

The Nuclear Physics file was not opened or used. The report was not created inside RemNote.

## Section 32 — Report-integrity declaration

> I confirm that this report distinguishes style-only mutation, Rem-property mutation, read-only controls, and full rich-text replacement; includes the complete user-provided Test 07 prompt; records the complete before-and-after plain-text and hierarchy state; uses actual rich-text/property evidence rather than plain-text inference; reports unsupported heading mutation and contradictory verifier behavior honestly; exposes no authentication secret; and records every detected text, hierarchy, formula, sibling, type, bullet, scope, duplicate, and card outcome.

- **Fixture Rems compared:** 21/21.
- **Style/property-only Rems unchanged:** 20/20 fixture nodes not designated for replacement.
- **Expected replacement:** 1/1 exact.
- **Unexpected text changes:** 0.
- **Hierarchy changes:** 0.
- **Formula-control defects:** 0.
- **Span requirements passed:** 5/5.
- **Supported Rem-property requirements passed:** 4/4 categories; headings unsupported.
- **Repair attempts:** 2 baseline preparation; 0 post-styling artifact repair.
- **Unresolved artifact defects:** Heading role remains normal because capability is unsupported.
- **Final verdict:** `PASS_WITH_WARNINGS`.
- **Recommendation:** `PROCEED_WITH_CAUTION`.
