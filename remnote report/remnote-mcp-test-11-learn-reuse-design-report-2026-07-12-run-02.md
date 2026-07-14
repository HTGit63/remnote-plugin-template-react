# RemNote MCP Test 11 — Learn, Save, and Reuse a Note Design

- **Report filename:** `remnote-mcp-test-11-learn-reuse-design-report-2026-07-12-run-02.md`
- **Date:** 2026-07-12
- **Start time:** 22:24:17 EAT
- **End time:** 22:35:36 EAT
- **Duration:** 00:11:19
- **Run number:** 03
- **ChatGPT model:** GPT-5.6 Thinking
- **Reasoning level:** Thinking
- **Plugin branch:** `fix/remnote-mcp-mass-note-creation-stability`
- **Plugin commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`
- **Tool profile:** `developer`
- **Approved-root title and ID:** `Plugin Test` — `OjLcSppWfIH0cpPoh`
- **Test-root title and ID:** `RemNote MCP Test 11 — Learn and Reuse Design — 2026-07-12 — Run 03` — `l6pQxh3FR85GChnKD`
- **Reference title and ID:** `Reference Design — Radioactive Decay` — `toZOr998mVMBvqjEs`
- **Target title and ID:** `Designed Lesson — Chemical Equilibrium` — `DleGlFGldXczOYpEU`
- **Template name and ID:** `Test 11 — Clean Science Lesson Design — 2026-07-12 — Run 03` — `design-test-11-clean-science-lesson-design-2026-07-12-run-03`
- **Template lifecycle classification:** `TEMPLATE_SAVED_AND_RETRIEVED`
- **Design-transfer classification:** `PARTIAL_DESIGN_TRANSFER`
- **Content-isolation classification:** `CONTENT_ISOLATED`
- **Reference-preservation classification:** `REFERENCE_UNCHANGED`
- **Final verdict:** `PARTIAL`
- **ChatGPT Agent Score:** 91/100
- **Plugin Capability Score:** 68/100
- **Final Artifact Score:** 79/100
- **Weighted overall score:** 78.80/100
- **Reusable Design Rule Transfer Rate:** 46.15%
- **Target Content Fidelity Rate:** 100.00%
- **Reference Preservation Rate:** 100.00%
- **Card Pattern Transfer Rate:** 0.00%
- **Content Leakage Rate:** 0.00%
- **Content-Specific Exception Rejection Rate:** 100.00%

## Section 1 — Executive summary

Scope was live-confirmed. Run 03 was selected because Runs 01 and 02 already existed. A clean 37-Rem reference was created and verified. Safe phrase styling, hidden bullets, formula/answer emphasis, and two concept/descriptor pairs were applied. Existing-Rem heading mutation was explicitly rejected as unsupported to prevent visible `Size → H1/H2/H3` metadata pollution; native section spacing was likewise excluded.

The built-in analyzer ignored the supplied reference ID and returned the focused approved root. Its output was rejected. Reusable rules were instead classified from the independently verified reference snapshot. A unique Run 03 template was saved, retrieved exactly once, previewed against the exact chemistry fixture, and used explicitly in target creation.

The creator produced a redundant outer title wrapper. The wrapper was renamed and the intact 39-node chemistry lesson was promoted directly under the Test 11 root without deletion or rebuilding. Target content, hierarchy, order, and all nine formula strings were exact. No radioactive-decay content or purple exception leaked. The reference retained all 37 IDs, text, hierarchy, and order.

Visual/card transfer remained incomplete: target heading roles, callout colors, formula/answer highlights, and functional concept/descriptor types were not reliably transferred or verified. The design verifier also imposed H1/H3/spacer defaults inconsistent with the stored Run 03 rules. Test 12 was not started.

## Section 2 — Complete initial prompt

> Internal platform instructions are not reproduced. The complete user-provided Test 11 prompt is included below.

`````text
# RemNote MCP Laboratory Test 11

## Learn, Save, and Reuse a Note Design

You are the primary experimental tester of a remote RemNote MCP plugin.

This is **Test 11 only**. Do not begin, simulate, or partially perform Test 12 or any later benchmark test.

Your mission is to create one polished reference lesson, analyze its design language, save the reusable design as a template, confirm that the template can be retrieved, preview its application to a different academic subject, create a new designed lesson, and verify that the new lesson inherits the reference design without copying its subject matter.

You must independently:

1. Confirm the approved RemNote scope.
2. Create one disposable Test 11 root.
3. Create and verify one styled reference lesson.
4. Analyze the reference note’s reusable design rules.
5. Separate reusable design from content-specific exceptions.
6. Save the reusable design as a named template.
7. List or retrieve saved templates and confirm the new template exists exactly once.
8. Preview the template against a chemistry lesson fixture.
9. Create the chemistry lesson using the saved design.
10. Verify its hierarchy, content, formulas, formatting, spacing, worked-example pattern, and card pattern.
11. Verify that no radioactive-decay content leaked into the chemistry lesson.
12. Verify that the reference lesson remained unchanged.
13. Repair only confirmed defects.
14. Create one complete local Markdown laboratory report.

This experiment tests design transfer—not content duplication.

---

# 1. Test identity

* **Test number:** 11
* **Test name:** Learn, Save, and Reuse a Note Design
* **Benchmark module:** Module IV — Reusable Learning Systems
* **Difficulty:** Advanced
* **Run type:** Main Run
* **Execution mode:** Natural autonomy with required template lifecycle and verification
* **Approved RemNote root title:** `Plugin Test`
* **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`
* **Disposable test root:** Create one new child beneath `Plugin Test`
* **Reference lesson title:** `Reference Design — Radioactive Decay`
* **Target lesson title:** `Designed Lesson — Chemical Equilibrium`
* **Template-name pattern:**
  `Test 11 — Clean Science Lesson Design — YYYY-MM-DD — Run NN`
* **Allowed operations:** Read, create, style, analyze design, save template, list templates, preview design, create designed note, verify, and targeted repair within the Test 11 scope
* **Deletion permission:** None
* **Movement or reordering of completed reference content:** None
* **External academic sources:** Forbidden
* **GitHub:** Forbidden
* **Web browsing:** Forbidden
* **Required deliverable:** One complete local Markdown report file

---

# 2. Central experimental question

> Can ChatGPT learn the reusable design logic of a high-quality RemNote lesson and apply that design appropriately to a different subject without copying the original content or altering the reference note?

This test is not passed merely because:

* A template-save tool reports success.
* A template name appears in a response.
* The chemistry lesson contains similar section titles.
* The chemistry lesson is manually styled to resemble the reference.
* Radioactive-decay text is copied and then partially replaced.
* The target content is correct but the design differs substantially.
* The target design looks similar but formulas, cards, or worked-example structure are broken.
* ChatGPT claims that the template was reused without retrieving or verifying it.
* The reference lesson changes during template extraction.
* A subject-specific reference highlight is incorrectly treated as a reusable rule.

The live RemNote artifact and template lifecycle must support the result.

---

# 3. Primary objectives

The test must determine whether ChatGPT and the plugin can:

1. Inspect a reference note deeply enough to understand its design.
2. Distinguish design rules from academic content.
3. Identify heading patterns.
4. Identify spacing patterns.
5. Identify phrase-level and whole-Rem emphasis patterns.
6. Identify formula-placement patterns.
7. Identify worked-example organization.
8. Identify summary organization.
9. Identify a simple card-design pattern.
10. Save a reusable design template.
11. Retrieve or list the saved template.
12. Preview the template against new content.
13. Create a designed note through the saved design workflow.
14. Preserve target content accurately.
15. Prevent source-content leakage.
16. Preserve the reference lesson unchanged.
17. Verify the resulting design instead of trusting creation success.
18. Repair only confirmed target-design defects.

---

# 4. Approved RemNote scope

All RemNote note mutations must occur beneath the live-confirmed Rem titled exactly:

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

Do not change focus or selection merely to run the test.

The focused Rem does not have to be `Plugin Test` when the approved root can be safely resolved through verified identity evidence.

---

# 5. Scope mismatch and stopping conditions

Stop all note mutations and report `BLOCKED_SCOPE_MISMATCH` when:

* `Plugin Test` cannot be found.
* Multiple exact-title matches remain unresolved.
* The observed ID conflicts with the expected ID and cannot be resolved safely.
* The intended Test 11 root lies outside the approved scope.
* You cannot prove that the disposable Test 11 root is beneath `Plugin Test`.

Stop and report `BLOCKED_CONNECTION` when:

* The plugin is disconnected before a sensitive mutation.
* A template-save or designed-note creation operation has an uncertain outcome and readback cannot resolve it.
* Two reasonable recovery attempts fail for the same connection problem.

Stop and report `BLOCKED_REFERENCE_INCOMPLETE` when:

* The reference lesson cannot be created completely.
* The reference design cannot be read with enough detail to analyze it.
* The reference note’s text and design state cannot be captured.
* Continuing would make template-learning claims unreliable.

Stop and report `UNSUPPORTED_DESIGN_REUSE` when:

* No design-analysis capability or safe equivalent exists.
* No reusable-template save capability exists.
* Saved templates cannot be retrieved or listed.
* No template preview or designed-note creation workflow exists.
* The only available method is manually rebuilding and restyling the target note.

Do not claim template reuse when the target was only manually styled.

---

# 6. Disposable Test 11 root

Create exactly one disposable root beneath `Plugin Test`.

Use:

`RemNote MCP Test 11 — Learn and Reuse Design — YYYY-MM-DD — Run NN`

Replace:

* `YYYY-MM-DD` with the actual date
* `NN` with a two-digit run number

Begin with `Run 01`.

Before creation:

1. Search beneath `Plugin Test` for an exact-title collision.
2. Do not reuse an earlier Test 11 root.
3. Do not edit an earlier Test 11 root.
4. Do not delete an earlier Test 11 root.
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

Create no more than one Test 11 root.

---

# 7. Test 11 artifacts

The experiment should produce these primary artifacts:

1. One Test 11 root
2. One styled reference lesson
3. One saved design template
4. One target chemistry lesson created using the saved design
5. One local Markdown report

Do not create:

* A second reference lesson
* A second target lesson
* A duplicate template with the same exact name
* A manual copy of the reference lesson
* A second target created merely because the first target has a defect

---

# 8. Reference lesson fixture

Create exactly one reference lesson beneath the Test 11 root.

Title:

`Reference Design — Radioactive Decay`

Use the exact content and hierarchy below.

```text
Reference Design — Radioactive Decay
├── 1. Overview
│   ├── Radioactive decay is a spontaneous transformation of an unstable nucleus.
│   └── Carbon-14 is one example of a radioactive nuclide.
├── 2. Key Concepts
│   ├── Statistical Nature
│   │   └── The exact decay time of one nucleus cannot normally be predicted.
│   ├── Decay Constant
│   │   └── The decay constant λ is the probability per nucleus per unit time.
│   └── Key idea: A large population follows a predictable exponential law.
├── 3. Key Formula
│   ├── The number of undecayed nuclei after time t is:
│   └── N(t)=N₀e^(−λt)
├── 4. Worked Example
│   ├── Problem
│   │   └── A sample initially contains 800 undecayed nuclei and has a half-life of 5 hours. Determine the number remaining after 15 hours.
│   ├── Given
│   │   ├── N₀=800
│   │   ├── T₁/₂=5 h
│   │   └── t=15 h
│   ├── Formula
│   │   └── N=N₀(1/2)^(t/T₁/₂)
│   ├── Substitution
│   │   └── N=800(1/2)^(15/5)=800(1/2)³
│   └── Answer
│       └── N=100 undecayed nuclei
├── 5. Common Pitfall
│   └── Warning: Half-life does not mean that every nucleus decays after the same fixed time.
├── 6. Summary
│   ├── Radioactive decay is spontaneous and statistical.
│   ├── The decay law is exponential.
│   └── A larger decay constant corresponds to a shorter half-life.
└── 7. Review Cards
    ├── Half-life
    │   └── The time required for the number of undecayed nuclei to fall to one-half of its initial value.
    └── Decay constant λ
        └── The probability per nucleus per unit time.
```

---

# 9. Reference design specification

Apply the following design to the reference lesson.

Where a requested visual property is genuinely unsupported, preserve the content and report the limitation.

## 9.1 Title design

* The reference lesson root must use the strongest suitable document-title or heading role.
* Its bullet should be hidden where supported.
* Its plain text must remain exact.

## 9.2 Major-section design

All seven direct sections must:

* Use one consistent section-heading level beneath the title
* Use the same supported heading text color
* Prefer the plugin’s standard dark-blue or blue heading color
* Hide heading bullets where supported
* Preserve exact plain text

Descendants must not accidentally receive the same section-heading level.

## 9.3 Spacing pattern

Use one consistent supported spacing treatment between major sections.

Acceptable implementations include:

* Native spacer elements
* A saved design spacing property
* Section-level spacing metadata
* Another non-polluting supported representation

Do not create visible placeholder text such as:

* `Spacer`
* `---`
* `***`
* Empty Markdown headings

Do not create large numbers of empty ordinary Rems.

## 9.4 Key-idea pattern

Target:

`Key idea: A large population follows a predictable exponential law.`

Apply:

* Bold to exactly `Key idea:`
* A supported yellow phrase highlight to exactly `Key idea:`

Do not highlight the complete sentence.

## 9.5 Key-formula pattern

The formula:

`N(t)=N₀e^(−λt)`

must:

* Remain under `3. Key Formula`
* Be visually separated from the explanatory sentence
* Use a supported rich-math or formula representation where available
* Receive the design’s standard formula emphasis, preferably a light-blue whole-Rem highlight or equivalent
* Preserve the subscript zero, negative exponent, and lambda

## 9.6 Worked-example pattern

Under `4. Worked Example`:

* `Problem`
* `Given`
* `Formula`
* `Substitution`
* `Answer`

must share one consistent subheading treatment.

The final answer:

`N=100 undecayed nuclei`

must receive the design’s positive-result emphasis, preferably a green whole-Rem highlight or equivalent.

The internal order must remain:

1. Problem
2. Given
3. Formula
4. Substitution
5. Answer

## 9.7 Warning pattern

Target:

`Warning: Half-life does not mean that every nucleus decays after the same fixed time.`

Apply:

* Bold to exactly `Warning:`
* A supported red text color or red phrase highlight to exactly `Warning:`

Do not color the entire sentence unless phrase-level styling is unsupported and the fallback is reported.

## 9.8 Summary pattern

Under `6. Summary`:

* Preserve exactly three concise summary children.
* Use ordinary visible bullets.
* Do not convert summary points into headings.
* Do not turn the summary into cards.

## 9.9 Review-card pattern

Under `7. Review Cards`:

* Convert `Half-life` into a concept-type Rem.
* Convert its definition child into a descriptor-type Rem.
* Convert `Decay constant λ` into a concept-type Rem.
* Convert its definition child into a descriptor-type Rem.
* Preserve exact text and hierarchy.
* Create exactly two concept/descriptor pairs.
* Do not create extra cloze, multiple-choice, or ordinary basic cards.

## 9.10 Content-specific exception

Apply a supported purple text color to exactly:

`Carbon-14`

inside:

`Carbon-14 is one example of a radioactive nuclide.`

This purple phrase is a **content-specific exception**.

It is not part of the reusable design language.

The saved template must not generalize the purple phrase treatment to the target lesson.

---

# 10. Reference verification gate

Before analyzing or saving the design, independently verify:

1. Reference-root title and ID
2. Parent ID and breadcrumb
3. Exactly seven direct sections
4. Correct section order
5. Complete hierarchy
6. Exact plain text
7. Title role
8. Major-section heading roles
9. Heading color
10. Heading bullet visibility
11. Spacing representation
12. Key-idea phrase boundaries
13. Formula representation and emphasis
14. Worked-example structure
15. Final-answer emphasis
16. Warning phrase boundaries
17. Summary structure
18. Concept and descriptor types
19. Card metadata where returned
20. Purple `Carbon-14` exception
21. No duplicate reference root
22. No raw formatting markers
23. No metadata pollution
24. No unintended cards

Do not begin template analysis until the reference is complete enough to serve as a reliable design source.

---

# 11. Reference baseline snapshot

Create a complete snapshot of the reference lesson.

Use:

| Label | Rem ID | Parent ID | Position | Plain text | Heading role | Text color | Highlight | Bullet visible | Rem type | Card metadata |
| ----- | ------ | --------- | -------: | ---------- | ------------ | ---------- | --------- | -------------- | -------- | ------------- |

Also record:

* Complete Rem ID set
* Parent-child manifest
* Child-order manifest
* Plain-text hash where practical
* Design-property manifest
* Formula state
* Card-state manifest
* Reference-tree node count

This snapshot will be used to prove that template extraction did not modify the reference.

---

# 12. Design analysis requirement

Analyze the reference note and separate its properties into three categories.

## 12.1 Reusable design rules

The reusable design should include:

1. Strong document-title treatment
2. Uniform major-section heading treatment
3. Consistent major-section spacing
4. Yellow emphasized `Key idea:` label
5. Light-blue or equivalent formula emphasis
6. Formula placed directly beneath its explanation
7. Worked-example subheading sequence:

   * Problem
   * Given
   * Formula
   * Substitution
   * Answer
8. Green or equivalent positive-result emphasis
9. Red emphasized `Warning:` label
10. Ordinary visible summary bullets
11. Concept/descriptor review-card pattern
12. No unnecessary decorative styling on ordinary explanation Rems

## 12.2 Subject-specific content

The following content must not enter the reusable design:

* Radioactive decay
* Carbon-14
* Half-life values
* Decay constant definitions
* Nuclear formulas
* Worked-example numbers
* Nuclear summary statements
* Radioactive-decay card text

## 12.3 Content-specific style exception

The purple styling on:

`Carbon-14`

must be classified as:

`CONTENT_SPECIFIC_EXCEPTION`

It must not become a reusable template rule.

---

# 13. Design-analysis output

Create a design analysis table:

| Reference property | Observed value | Classification | Include in template? | Rationale |
| ------------------ | -------------- | -------------- | -------------------- | --------- |

Classification values:

* `REUSABLE_DESIGN_RULE`
* `SUBJECT_CONTENT`
* `CONTENT_SPECIFIC_EXCEPTION`
* `UNSUPPORTED_PROPERTY`
* `AMBIGUOUS`
* `NOT_VERIFIED`

The analysis must cover:

* Title role
* Section heading role
* Heading color
* Bullet visibility
* Section spacing
* Key-idea styling
* Formula placement
* Formula emphasis
* Worked-example subheadings
* Answer emphasis
* Warning styling
* Summary bullets
* Concept/descriptor card pattern
* Purple Carbon-14 styling
* All scientific text

Do not save the template until ambiguous design properties have been resolved or clearly excluded.

---

# 14. Template naming and collision control

Use the template-name pattern:

`Test 11 — Clean Science Lesson Design — YYYY-MM-DD — Run NN`

Begin with the same run number used for the Test 11 root where practical.

Before saving:

1. List or search existing templates.
2. Check for an exact-name collision.
3. Do not overwrite an earlier template.
4. Select the first unused run number if a collision exists.
5. Record the existing-template count.
6. Record any similarly named templates.
7. Confirm the selected name is unique.

The template should contain only reusable design rules.

---

# 15. Template save requirement

Save exactly one reusable template derived from the verified reference lesson.

Record:

* Template name
* Template ID
* Source reference Rem ID
* Template-save operation ID
* Idempotency key where supported
* Included design rules
* Excluded subject content
* Excluded content-specific exception
* Warnings
* Latency
* Template scope or availability

Do not save:

* The complete reference content as a reusable lesson
* Radioactive-decay prose
* Nuclear formulas
* Carbon-14 styling as a general rule
* Reference-specific card fronts and backs
* Reference Rem IDs as target-content dependencies

---

# 16. Template retrieval and listing requirement

After saving:

1. List or retrieve available templates.
2. Confirm the saved template appears exactly once.
3. Confirm its exact name.
4. Confirm its template ID.
5. Confirm its source or metadata where available.
6. Confirm that no unintended duplicate template was created.
7. Inspect its design-rule summary where supported.

A save response alone is insufficient.

Classify the result:

* `TEMPLATE_SAVED_AND_RETRIEVED`
* `TEMPLATE_SAVED_NOT_RETRIEVABLE`
* `DUPLICATE_TEMPLATE_CREATED`
* `TEMPLATE_SAVE_FAILED`
* `TEMPLATE_METADATA_INCOMPLETE`
* `TEMPLATE_NOT_VERIFIED`

---

# 17. Target chemistry source fixture

Create the target lesson from the exact content below.

Title:

`Designed Lesson — Chemical Equilibrium`

Required hierarchy:

```text
Designed Lesson — Chemical Equilibrium
├── 1. Overview
│   ├── Chemical equilibrium is the dynamic state in which forward and reverse reactions occur at equal rates.
│   └── The concentrations of reactants and products remain constant at equilibrium even though molecular reactions continue.
├── 2. Key Concepts
│   ├── Dynamic Equilibrium
│   │   └── Forward and reverse reactions continue while their rates remain equal.
│   ├── Equilibrium Constant
│   │   └── The equilibrium constant expresses the relationship between equilibrium concentrations.
│   ├── Reaction Quotient
│   │   └── The reaction quotient has the same form as the equilibrium expression but may be evaluated away from equilibrium.
│   └── Key idea: Equilibrium is dynamic rather than static.
├── 3. Key Formula
│   ├── For aA+bB⇌cC+dD, the concentration equilibrium constant is:
│   └── Kc=[C]^c[D]^d/([A]^a[B]^b)
├── 4. Worked Example
│   ├── Problem
│   │   └── For N₂+3H₂⇌2NH₃, the equilibrium concentrations are [N₂]=0.50 M, [H₂]=0.30 M, and [NH₃]=0.20 M. Calculate Kc.
│   ├── Given
│   │   ├── [N₂]=0.50 M
│   │   ├── [H₂]=0.30 M
│   │   └── [NH₃]=0.20 M
│   ├── Formula
│   │   └── Kc=[NH₃]²/([N₂][H₂]³)
│   ├── Substitution
│   │   └── Kc=(0.20)²/[(0.50)(0.30)³]
│   └── Answer
│       └── Kc≈2.96
├── 5. Common Pitfall
│   └── Warning: Do not use stoichiometric coefficients as concentration values.
├── 6. Summary
│   ├── Equilibrium is dynamic because both reaction directions continue.
│   ├── The equilibrium constant is calculated from equilibrium concentrations.
│   └── The value of Kc describes the equilibrium composition for a specified reaction and temperature.
└── 7. Review Cards
    ├── Dynamic equilibrium
    │   └── A state in which forward and reverse reaction rates are equal.
    └── Equilibrium constant Kc
        └── The ratio of product concentration terms to reactant concentration terms, each raised to its stoichiometric coefficient.
```

---

# 18. Target-content invariants

The target lesson must preserve:

* Exact title
* Seven direct sections
* Correct section order
* Exact plain text
* Formula symbols
* Chemical subscripts
* Superscript coefficients in the equilibrium expression
* Reversible-reaction arrow
* Concentration brackets
* Worked-example numbers
* Final answer `Kc≈2.96`
* Exactly three summary points
* Exactly two review-card concept/descriptor pairs

Do not silently rewrite, summarize, or add unrelated chemistry content.

---

# 19. Design preview requirement

Before creating the target lesson:

1. Confirm the saved template ID.
2. Confirm the target parent is the Test 11 root.
3. Confirm the target title does not already exist.
4. Validate the target hierarchy and formulas.
5. Use the saved template to preview the proposed target design.
6. Inspect warnings and unsupported mappings.
7. Confirm subject-specific reference content is not included.
8. Confirm the purple Carbon-14 exception is not generalized.
9. Confirm the template proposes the expected:

   * Title role
   * Section heading role
   * Heading color
   * Spacing
   * Key-idea styling
   * Formula emphasis
   * Worked-example structure
   * Answer emphasis
   * Warning styling
   * Summary bullet style
   * Concept/descriptor card pattern

The preview must not create the target lesson.

When template preview is unsupported:

* Record `TEMPLATE_PREVIEW_UNSUPPORTED`.
* Do not claim a complete template lifecycle.
* Continue only when designed-note creation can still reference the saved template directly and safely.

---

# 20. Designed-note creation requirement

Create exactly one target lesson beneath the Test 11 root using the saved template.

Requirements:

* The saved template must be explicitly associated with the target creation where supported.
* The target lesson must not be created first and manually styled afterward as the primary workflow.
* Do not copy and edit the reference lesson.
* Do not clone radioactive-decay content.
* Do not create a temporary radioactive-decay duplicate.
* Do not create multiple target attempts.
* Use a unique idempotency key where supported.
* Record the creation operation ID and template ID.

Target child order beneath the Test 11 root should be:

1. `Reference Design — Radioactive Decay`
2. `Designed Lesson — Chemical Equilibrium`

Native template artifacts need not appear as ordinary RemNote children.

---

# 21. Required target design

The target chemistry lesson should inherit these reference design rules.

## 21.1 Title

* Same title-role logic as the reference
* Same bullet-visibility logic where supported
* Target title text remains exact

## 21.2 Major sections

* Same section-heading level
* Same heading color
* Same bullet-visibility logic
* Same spacing logic
* Exactly seven direct sections

## 21.3 Key idea

Target:

`Key idea: Equilibrium is dynamic rather than static.`

Expected:

* `Key idea:` bold
* `Key idea:` yellow-highlighted
* Remaining sentence ordinary
* Exact phrase boundaries

## 21.4 Formula

Target:

`Kc=[C]^c[D]^d/([A]^a[B]^b)`

Expected:

* Positioned beneath its explanatory sentence
* Same formula-emphasis pattern as the reference
* Rich formula where supported
* No raw delimiters
* No reference nuclear formula

## 21.5 Worked example

Expected subheading sequence:

1. Problem
2. Given
3. Formula
4. Substitution
5. Answer

The final answer:

`Kc≈2.96`

must use the same positive-result emphasis as the reference answer.

## 21.6 Warning

Target:

`Warning: Do not use stoichiometric coefficients as concentration values.`

Expected:

* `Warning:` emphasized using the reference warning pattern
* Exact phrase boundaries
* No radioactive-decay warning text

## 21.7 Summary

Expected:

* Three ordinary visible summary bullets
* Same summary structure as reference
* No cards generated from summary points

## 21.8 Review cards

Expected:

* Two concept/descriptor pairs
* Same concept/descriptor pattern as the reference
* Chemistry-specific front and answer text
* No radioactive-decay cards

## 21.9 Purple exception

The target should not receive arbitrary purple text merely because the reference contained purple `Carbon-14`.

Expected purple phrase count in target:

`0`

unless another purple style is independently justified by a reusable rule—which this prompt does not define.

---

# 22. Content-leakage controls

Search the target lesson for these reference-only terms:

* `radioactive`
* `decay`
* `Carbon-14`
* `half-life`
* `undecayed nuclei`
* `decay constant`
* `N(t)=N₀e^(−λt)`
* `N=100`
* `800`
* `15 hours`

Expected occurrences in target:

`0`

Do not count target metadata or report text outside the target lesson.

Also check for copied reference Rem IDs or references where retrievable.

---

# 23. Reference-preservation requirement

After:

* Design analysis
* Template save
* Template listing
* Target preview
* Target creation
* Target verification

reread the reference lesson.

Verify:

* Reference-root ID unchanged
* Every reference Rem ID unchanged
* Plain text unchanged
* Parent-child relationships unchanged
* Section order unchanged
* Formula unchanged
* Styles unchanged
* Card types unchanged
* Purple Carbon-14 exception unchanged
* No new reference children
* No deleted reference children
* No template metadata inserted as visible note content

Template extraction must not mutate the source reference.

---

# 24. Template and design classifications

Use exactly these classifications.

## Template lifecycle

* `TEMPLATE_SAVED_AND_RETRIEVED`
* `TEMPLATE_SAVED_NOT_RETRIEVABLE`
* `DUPLICATE_TEMPLATE_CREATED`
* `TEMPLATE_SAVE_FAILED`
* `TEMPLATE_PREVIEW_UNSUPPORTED`
* `DESIGNED_CREATION_UNSUPPORTED`
* `TEMPLATE_NOT_VERIFIED`

## Design transfer

* `EXACT_DESIGN_TRANSFER`
* `SEMANTICALLY_EQUIVALENT_TRANSFER`
* `PARTIAL_DESIGN_TRANSFER`
* `MANUAL_STYLE_SUBSTITUTION`
* `DESIGN_NOT_APPLIED`
* `DESIGN_NOT_VERIFIED`

## Content isolation

* `CONTENT_ISOLATED`
* `MINOR_CONTENT_LEAKAGE`
* `MAJOR_CONTENT_LEAKAGE`
* `REFERENCE_CLONED`
* `NOT_VERIFIED`

## Reference preservation

* `REFERENCE_UNCHANGED`
* `REFERENCE_STYLE_CHANGED`
* `REFERENCE_TEXT_CHANGED`
* `REFERENCE_HIERARCHY_CHANGED`
* `REFERENCE_CARD_STATE_CHANGED`
* `REFERENCE_NOT_VERIFIED`

---

# 25. Template rule verification matrix

Use:

| Reusable design rule | Reference evidence | Template evidence | Target evidence | Transfer status |
| -------------------- | ------------------ | ----------------- | --------------- | --------------- |

Include:

1. Title role
2. Section heading level
3. Heading color
4. Heading bullet visibility
5. Major-section spacing
6. Key-idea bold boundary
7. Key-idea highlight boundary
8. Formula placement
9. Formula emphasis
10. Worked-example subheading pattern
11. Positive-answer emphasis
12. Warning-label emphasis
13. Summary bullet pattern
14. Concept/descriptor card pattern
15. No ordinary-text over-decoration

---

# 26. Target-content verification

Verify the complete target hierarchy.

Use:

| Requirement | Expected parent | Observed Rem ID | Correct parent | Correct order | Exact text | Status |
| ----------- | --------------- | --------------- | -------------- | ------------- | ---------- | ------ |

Cover:

* Seven direct sections
* Three key concepts
* Key-idea statement
* Main equilibrium formula
* Problem
* Given
* Formula
* Substitution
* Answer
* Warning
* Three summary points
* Two concepts
* Two descriptors

---

# 27. Formula verification

Verify these target expressions:

1. `aA+bB⇌cC+dD`
2. `Kc=[C]^c[D]^d/([A]^a[B]^b)`
3. `N₂+3H₂⇌2NH₃`
4. `[N₂]=0.50 M`
5. `[H₂]=0.30 M`
6. `[NH₃]=0.20 M`
7. `Kc=[NH₃]²/([N₂][H₂]³)`
8. `Kc=(0.20)²/[(0.50)(0.30)³]`
9. `Kc≈2.96`

For each record:

* Rem ID
* Plain text
* Rich-text representation
* Subscripts
* Superscripts
* Reversible arrow
* Brackets
* Approximation sign
* Formula emphasis
* Parent
* Classification

Formula classifications:

* `EXACT_RICH_MATH`
* `SEMANTICALLY_EXACT_RICH_MATH`
* `EXACT_PLAIN_TEXT`
* `PLAIN_TEXT_FALLBACK`
* `MALFORMED`
* `MISSING`
* `NOT_VERIFIED`

---

# 28. Card-style verification

For both target concept/descriptor pairs, verify:

| Concept | Concept Rem ID | Descriptor | Descriptor Rem ID | Types correct | Functional card metadata | Exact content | Status |
| ------- | -------------- | ---------- | ----------------- | ------------- | ------------------------ | ------------- | ------ |

Required pairs:

1. Dynamic equilibrium
2. Equilibrium constant Kc

Confirm:

* Exactly two target concept/descriptor pairs
* No duplicate cards
* No radioactive-decay cards
* No malformed card metadata
* Target source content remains readable as notes
* No raw card markers

This is a design-pattern check, not the full card-quality benchmark of Test 13.

---

# 29. Design-transfer metrics

Calculate the following.

## Reusable Design Rule Transfer Rate

[
\frac{
\text{Reusable design rules successfully present in target}
}{
\text{Reusable design rules supported and verified in reference}
}
\times100
]

Unsupported rules should be reported separately rather than silently removed from the denominator.

## Target Content Fidelity Rate

[
\frac{
\text{Required target content items present exactly or semantically exactly}
}{
\text{Total required target content items}
}
\times100
]

## Reference Preservation Rate

[
\frac{
\text{Reference Rems preserving ID, text, parent, order, and required style}
}{
\text{Total reference Rems}
}
\times100
]

## Card Pattern Transfer Rate

[
\frac{
\text{Correct target concept/descriptor pairs}
}{
2
}
\times100
]

## Content Leakage Rate

[
\frac{
\text{Reference-only content items found in target}
}{
\text{Reference-only leakage terms checked}
}
\times100
]

The ideal Content Leakage Rate is:

`0%`

## Content-Specific Exception Rejection Rate

For the single purple Carbon-14 exception:

* `100%` when the exception is not generalized
* `0%` when an arbitrary target phrase receives purple styling because of it

---

# 30. Duplicate and pollution audit

Search for:

* Duplicate Test 11 root
* Duplicate reference lesson
* Duplicate target lesson
* Duplicate template
* Duplicate target section
* Duplicate formula
* Duplicate concept/descriptor pair
* Raw Markdown headings
* Raw rich-text markers
* Raw formula delimiters
* Template metadata displayed as note text
* Template ID displayed as academic content
* Idempotency-key pollution
* Empty wrapper Rems
* Unintended cards
* Radioactive-decay leakage
* Purple target styling
* Reference content copied into target

---

# 31. Idempotency and uncertain outcomes

Use distinct idempotency keys where supported for:

* Test-root creation
* Reference creation
* Reference styling groups
* Template save
* Target designed-note creation
* Each repair operation

Do not reuse a key with a changed payload.

If template saving has an uncertain outcome:

1. Do not save again blindly.
2. List templates.
3. Search by exact template name.
4. Inspect matching template IDs.
5. Save again only when evidence proves the first save did not occur.
6. Do not knowingly create a duplicate template.

If target creation has an uncertain outcome:

1. Do not recreate blindly.
2. Read the Test 11 root.
3. Search for the exact target title.
4. Inspect matching target candidates.
5. Determine whether creation completed, partially completed, failed, or duplicated.
6. Retry only when evidence proves the target was not created.

---

# 32. Repair policy

Repair is allowed only for artifacts created during Test 11.

Permitted repairs include:

* Correcting an incomplete reference style before template saving
* Correcting a missing target design property
* Correcting a malformed target formula
* Correcting a target card type
* Restoring the reference if template extraction altered it
* Removing content leakage through a guarded in-place correction
* Correcting spacing or heading treatment
* Correcting a mistakenly generalized purple style
* Correcting a missing target section

Deletion remains forbidden.

Do not:

* Rebuild the complete target lesson for one design defect
* Save multiple templates as repair attempts
* Create a second target lesson
* Copy the reference and replace its text
* Manually restyle the entire target while still claiming template success
* Modify unrelated old templates
* Modify artifacts outside the Test 11 root

Before repair:

1. Read current state.
2. Diagnose the exact defect.
3. Identify whether the failure belongs to:

   * Design analysis
   * Template save
   * Template retrieval
   * Template preview
   * Designed-note creation
   * Content fixture
   * Verification
4. Preview repair where supported.
5. Apply the smallest safe correction.
6. Reverify the affected rule and surrounding controls.

Maximum repair attempts for one defect:

`2`

After two failures:

* Stop repairing that defect.
* Report the limitation.
* Do not falsely claim complete design transfer.

---

# 33. Efficiency target

The test should normally require approximately:

* **18–35 meaningful RemNote operations**

Additional operations are acceptable when caused by:

* Detailed reference-style verification
* Separate template analysis and save operations
* Template listing and metadata inspection
* Target formula inspection
* Card-property inspection
* Reference-preservation readback
* A confirmed repair
* Truncation or pagination

Record:

* Scope reads
* Collision checks
* Reference-creation calls
* Reference-style calls
* Reference-verification reads
* Design-analysis calls
* Template-list calls
* Template-save calls
* Template-preview calls
* Designed-note creation calls
* Target-verification reads
* Card reads
* Formula reads
* Reference-preservation reads
* Repair calls
* Failed calls
* Repeated calls
* Avoidable calls
* Slowest operation
* Total known latency

Efficiency means a coherent template lifecycle—not merely few calls.

---

# 34. Required local Markdown report

Create one real local `.md` report.

Do not create the report inside RemNote.

## Required filename

Use:

`remnote-mcp-test-11-learn-reuse-design-report-YYYY-MM-DD.md`

Example:

`remnote-mcp-test-11-learn-reuse-design-report-2026-07-12.md`

If that filename already exists locally, use:

`remnote-mcp-test-11-learn-reuse-design-report-2026-07-12-run-02.md`

Do not overwrite an earlier report unless explicitly instructed.

## File verification

Before presenting the report:

1. Confirm the file exists.
2. Confirm the `.md` extension.
3. Confirm the file is not empty.
4. Confirm the complete initial Test 11 prompt is included.
5. Confirm the complete reference fixture is included.
6. Confirm the complete target fixture is included.
7. Confirm scope evidence is included.
8. Confirm the reference baseline snapshot is included.
9. Confirm the design-analysis matrix is included.
10. Confirm reusable and excluded rules are included.
11. Confirm template collision checks are included.
12. Confirm template save evidence is included.
13. Confirm template retrieval or listing evidence is included.
14. Confirm template preview evidence is included.
15. Confirm target creation evidence is included.
16. Confirm target hierarchy verification is included.
17. Confirm formula verification is included.
18. Confirm card-pattern verification is included.
19. Confirm content-leakage checks are included.
20. Confirm purple-exception checks are included.
21. Confirm reference-preservation verification is included.
22. Confirm design-transfer metrics are included.
23. Confirm duplicate and pollution checks are included.
24. Confirm defects and repairs are included.
25. Confirm all three score categories are included.
26. Confirm the weighted score is included.
27. Confirm every scoring cap is evaluated.
28. Confirm the final verdict is included.
29. Confirm no authentication secret appears.
30. Confirm the file can be linked to the user.

If local file creation is unsupported:

* Do not claim that the report exists.
* Mark the report artifact `BLOCKED`.
* Present the complete Markdown report in the response.
* Apply the report-artifact scoring cap.

---

# 35. Required report structure

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

`# RemNote MCP Test 11 — Learn, Save, and Reuse a Note Design`

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
* Reference title and ID
* Target title and ID
* Template name and ID
* Template lifecycle classification
* Design-transfer classification
* Content-isolation classification
* Reference-preservation classification
* Final verdict
* ChatGPT Agent Score
* Plugin Capability Score
* Final Artifact Score
* Weighted overall score
* Reusable Design Rule Transfer Rate
* Target Content Fidelity Rate
* Reference Preservation Rate
* Card Pattern Transfer Rate
* Content Leakage Rate
* Content-Specific Exception Rejection Rate

---

## Section 1 — Executive summary

Summarize:

* Scope confirmation
* Reference creation
* Reference design completeness
* Design-analysis outcome
* Template save
* Template retrieval
* Template preview
* Designed target creation
* Design-transfer result
* Target-content fidelity
* Formula fidelity
* Card-pattern fidelity
* Content leakage
* Purple-exception handling
* Reference preservation
* Repairs
* Scope violations
* Whether Test 12 may proceed

---

## Section 2 — Complete initial prompt

Include the complete user-provided Test 11 prompt in a fenced code block.

Do not shorten it.

Do not include hidden platform instructions, credentials, authentication secrets, or private chain-of-thought.

State:

> Internal platform instructions are not reproduced. The complete user-provided Test 11 prompt is included below.

---

## Section 3 — Test configuration

Use:

| Field                     | Value                                  |
| ------------------------- | -------------------------------------- |
| Test number               | 11                                     |
| Test name                 | Learn, Save, and Reuse a Note Design   |
| Difficulty                | Advanced                               |
| Run type                  | Main Run                               |
| Approved root             | Plugin Test                            |
| Expected approved-root ID | OjLcSppWfIH0cpPoh                      |
| Observed approved-root ID | Live value                             |
| Test-root title           | Live value                             |
| Test-root ID              | Live value                             |
| Reference title           | Reference Design — Radioactive Decay   |
| Reference ID              | Live value                             |
| Target title              | Designed Lesson — Chemical Equilibrium |
| Target ID                 | Live value                             |
| Template name             | Live value                             |
| Template ID               | Live value                             |
| Deletion                  | Forbidden                              |
| External sources          | Forbidden                              |

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

## Section 5 — Test-root creation

Report:

* Selected run number
* Test-root title
* Test-root ID
* Parent ID
* Idempotency key
* Operation ID
* Parent count before and after
* Breadcrumb
* Duplicate check
* Readback verdict

---

## Section 6 — Reference creation and styling

Report:

* Reference-root title and ID
* Creation route
* Styling route
* Operation IDs
* Idempotency keys
* Node count
* Direct-section count
* Formula count
* Card-pair count
* Spacing representation
* Unsupported style properties
* Creation verdict

---

## Section 7 — Complete reference baseline snapshot

Include the complete reference snapshot.

Also include:

* Reference Rem ID set
* Parent-child manifest
* Child-order manifest
* Plain-text hash
* Formula state
* Card state
* Design-property manifest

---

## Section 8 — Reference design verification

Use:

| Reference rule | Expected | Observed | Evidence | Status |
| -------------- | -------- | -------- | -------- | ------ |

Include all reusable rules and the purple exception.

---

## Section 9 — Design analysis

Include the complete classification table.

Report:

* Reusable rules
* Subject content excluded
* Content-specific exception excluded
* Unsupported properties
* Ambiguous properties
* Final analysis verdict

---

## Section 10 — Template collision and naming analysis

Report:

* Initial template list
* Similar names
* Exact-name collision
* Selected template name
* Selected run number
* Pre-save template count
* Collision-resolution result

---

## Section 11 — Template save result

Report:

* Template name
* Template ID
* Source reference ID
* Included rules
* Excluded content
* Excluded purple exception
* Operation ID
* Idempotency key
* Latency
* Warnings
* Save classification

---

## Section 12 — Template retrieval and listing

Use:

| Template name | Template ID | Occurrences | Source or metadata | Verified |
| ------------- | ----------- | ----------: | ------------------ | -------- |

Report:

* Post-save template count
* Exact-name occurrence count
* Duplicate-template status
* Template lifecycle classification

---

## Section 13 — Target-content validation

Report:

* Target title
* Seven direct sections
* Content-item count
* Formula inventory
* Card-pair inventory
* Worked-example result
* Reference-only terms absent before creation
* Target-fixture readiness verdict

---

## Section 14 — Template preview

Report:

* Template ID
* Target parent ID
* Target-title collision check
* Preview operation
* Previewed design rules
* Unsupported mappings
* Content leakage in preview
* Purple-style generalization
* Warnings
* Preview verdict

---

## Section 15 — Target designed-note creation

Report:

* Target title and ID
* Parent ID
* Template ID used
* Operation ID
* Idempotency key
* Child count before and after
* Duplicate-target check
* Creation warnings
* Readback result

---

## Section 16 — Target hierarchy and content verification

Include:

* Required target hierarchy
* Observed target hierarchy
* Complete requirement matrix
* Missing items
* Extra items
* Wrong-parent items
* Wrong-order items
* Text differences
* Target Content Fidelity Rate

---

## Section 17 — Design-rule transfer verification

Include the complete template-rule matrix.

Report:

* Rules transferred exactly
* Rules transferred semantically
* Rules missing
* Rules unsupported
* Rules over-applied
* Manual styling substitutions
* Reusable Design Rule Transfer Rate
* Design-transfer classification

---

## Section 18 — Formula verification

Include the complete nine-expression formula table.

Report:

* Subscript defects
* Superscript defects
* Arrow defects
* Bracket defects
* Approximation-sign defects
* Formula-emphasis defects
* Raw delimiter pollution
* Rich-text limitations

---

## Section 19 — Worked-example pattern verification

Use:

| Component    | Expected order | Observed position | Style matches reference pattern | Content correct | Status |
| ------------ | -------------: | ----------------: | ------------------------------- | --------------- | ------ |
| Problem      |              1 |                   |                                 |                 |        |
| Given        |              2 |                   |                                 |                 |        |
| Formula      |              3 |                   |                                 |                 |        |
| Substitution |              4 |                   |                                 |                 |        |
| Answer       |              5 |                   |                                 |                 |        |

Also verify:

* Final answer
* Positive-result emphasis
* No radioactive-decay values
* No copied reference problem

---

## Section 20 — Card-pattern verification

Include the complete card-pair table.

Report:

* Expected concept pairs
* Observed concept pairs
* Functional card metadata
* Duplicate cards
* Reference-card leakage
* Card Pattern Transfer Rate

---

## Section 21 — Content-isolation and exception audit

Use:

| Reference-only term or style | Expected target count | Observed count | Status |
| ---------------------------- | --------------------: | -------------: | ------ |
| radioactive                  |                     0 |                |        |
| decay                        |                     0 |                |        |
| Carbon-14                    |                     0 |                |        |
| half-life                    |                     0 |                |        |
| undecayed nuclei             |                     0 |                |        |
| decay constant               |                     0 |                |        |
| reference nuclear formula    |                     0 |                |        |
| N=100                        |                     0 |                |        |
| 800                          |                     0 |                |        |
| 15 hours                     |                     0 |                |        |
| purple target phrase         |                     0 |                |        |

Report:

* Content Leakage Rate
* Exception Rejection Rate
* Content-isolation classification

---

## Section 22 — Reference-preservation audit

Use:

| Reference Rem | Rem ID before | Rem ID after | Text preserved | Parent preserved | Order preserved | Style preserved | Card state preserved | Status |
| ------------- | ------------- | ------------ | -------------- | ---------------- | --------------- | --------------- | -------------------- | ------ |

Report:

* Total reference Rems
* IDs preserved
* Text preserved
* Hierarchy preserved
* Styles preserved
* Card states preserved
* New reference children
* Missing reference children
* Reference Preservation Rate
* Reference-preservation classification

---

## Section 23 — Duplicate and pollution audit

Use:

| Defect type                 | Found? | Count | Location | Impact | Repaired |
| --------------------------- | ------ | ----: | -------- | ------ | -------- |
| Duplicate Test 11 root      |        |       |          |        |          |
| Duplicate reference lesson  |        |       |          |        |          |
| Duplicate target lesson     |        |       |          |        |          |
| Duplicate template          |        |       |          |        |          |
| Duplicate target section    |        |       |          |        |          |
| Duplicate formula           |        |       |          |        |          |
| Duplicate card pair         |        |       |          |        |          |
| Raw Markdown marker         |        |       |          |        |          |
| Raw math delimiter          |        |       |          |        |          |
| Template metadata pollution |        |       |          |        |          |
| Idempotency-key pollution   |        |       |          |        |          |
| Empty wrapper               |        |       |          |        |          |
| Reference-content leakage   |        |       |          |        |          |
| Purple-style leakage        |        |       |          |        |          |
| Unintended card             |        |       |          |        |          |

---

## Section 24 — Design-transfer metrics

Show every calculation for:

* Reusable Design Rule Transfer Rate
* Target Content Fidelity Rate
* Reference Preservation Rate
* Card Pattern Transfer Rate
* Content Leakage Rate
* Content-Specific Exception Rejection Rate

---

## Section 25 — Defects and recovery

Use:

| Defect | Artifact or rule | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
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

## Section 26 — Efficiency analysis

Use:

| Operation category           | Count |
| ---------------------------- | ----: |
| Scope reads                  |       |
| Collision checks             |       |
| Reference-creation calls     |       |
| Reference-style calls        |       |
| Reference-verification reads |       |
| Design-analysis calls        |       |
| Template-list calls          |       |
| Template-save calls          |       |
| Template-preview calls       |       |
| Designed-note creation calls |       |
| Target-verification reads    |       |
| Formula reads                |       |
| Card reads                   |       |
| Reference-preservation reads |       |
| Repair calls                 |       |
| Failed calls                 |       |
| Repeated calls               |       |
| Avoidable calls              |       |
| Total meaningful calls       |       |

Report:

* Slowest operation
* Highest latency
* Total known latency
* Most effective design capability
* Most fragile design capability
* Whether target styling was template-driven
* Whether manual styling was overused
* Whether verification overhead was proportional

---

## Section 27 — Safety and mutation audit

Use:

| Category                                        | Allowed | Observed | Status |
| ----------------------------------------------- | ------: | -------: | ------ |
| Test 11 roots created                           |       1 |          |        |
| Reference lessons created                       |       1 |          |        |
| Target lessons created                          |       1 |          |        |
| Templates saved                                 |       1 |          |        |
| Duplicate templates                             |       0 |          |        |
| Old RemNote notes modified                      |       0 |          |        |
| Rems created outside Test 11 root               |       0 |          |        |
| Reference text changes after verification       |       0 |          |        |
| Reference hierarchy changes after verification  |       0 |          |        |
| Reference style changes after verification      |       0 |          |        |
| Reference card-state changes after verification |       0 |          |        |
| Deletions                                       |       0 |          |        |
| Reference content copied into target            |       0 |          |        |
| Purple exception generalized                    |       0 |          |        |
| Blind retries                                   |       0 |          |        |
| External sources used                           |       0 |          |        |

---

# 36. Scoring system

Calculate three separate scores.

---

## Section 28 — ChatGPT Agent Score

Score out of 100.

### Task understanding — 10 points

| Criterion                             | Maximum | Awarded | Evidence |
| ------------------------------------- | ------: | ------: | -------- |
| Understood design-reuse mission       |       4 |         |          |
| Distinguished design from content     |       4 |         |          |
| Recognized content-specific exception |       2 |         |          |

### Planning and decomposition — 15 points

| Criterion                                   | Maximum | Awarded | Evidence |
| ------------------------------------------- | ------: | ------: | -------- |
| Created and verified reference              |       4 |         |          |
| Classified reusable and excluded properties |       4 |         |          |
| Planned template lifecycle                  |       3 |         |          |
| Validated target fixture                    |       2 |         |          |
| Used design preview or safe equivalent      |       2 |         |          |

### Tool selection — 15 points

| Criterion                                | Maximum | Awarded | Evidence |
| ---------------------------------------- | ------: | ------: | -------- |
| Used suitable design-analysis capability |       4 |         |          |
| Used reusable template save and listing  |       4 |         |          |
| Used designed-note creation              |       4 |         |          |
| Selected suitable design verification    |       3 |         |          |

### Operation sequencing — 15 points

| Criterion                               | Maximum | Awarded | Evidence |
| --------------------------------------- | ------: | ------: | -------- |
| Confirmed scope before mutation         |       2 |         |          |
| Verified reference before analysis      |       3 |         |          |
| Analyzed before saving template         |       3 |         |          |
| Retrieved template before application   |       2 |         |          |
| Previewed before target creation        |       2 |         |          |
| Verified target and reference afterward |       3 |         |          |

### Verification discipline — 15 points

| Criterion                            | Maximum | Awarded | Evidence |
| ------------------------------------ | ------: | ------: | -------- |
| Verified template lifecycle          |       3 |         |          |
| Verified all design rules            |       4 |         |          |
| Verified target content and formulas |       3 |         |          |
| Verified cards and content isolation |       3 |         |          |
| Verified reference preservation      |       2 |         |          |

### Recovery and self-correction — 10 points

| Criterion                           | Maximum | Awarded | Evidence |
| ----------------------------------- | ------: | ------: | -------- |
| Detected actual transfer defects    |       3 |         |          |
| Diagnosed lifecycle layer correctly |       3 |         |          |
| Used targeted repair                |       2 |         |          |
| Reverified repairs                  |       2 |         |          |

When no repair was required, award based on correct diagnosis and avoidance of unnecessary mutation.

### Scope and safety — 10 points

| Criterion                                       | Maximum | Awarded | Evidence |
| ----------------------------------------------- | ------: | ------: | -------- |
| All note mutations remained within Test 11 root |       4 |         |          |
| Reference remained unchanged                    |       3 |         |          |
| No deletion, duplicate template, or blind retry |       3 |         |          |

### Efficiency — 5 points

* Used a coherent template lifecycle without excessive manual restyling: 5

### Evidence-based reporting — 5 points

* IDs, template evidence, design rules, operations, latency, and limitations were recorded: 5

Report:

* **ChatGPT Agent Score:** `/100`

---

## Section 29 — Plugin Capability Score

Score out of 100.

### Tool availability — 10 points

* Design analysis, template save/list, preview, designed creation, and verification capabilities: 10

### Reference-design analysis — 15 points

* Design properties discoverable: 8
* Reusable rules distinguishable from content: 7

### Template lifecycle — 20 points

* Template save: 7
* Template retrieval/listing: 5
* Stable template ID and metadata: 4
* Duplicate prevention: 4

### Designed-note creation — 20 points

* Template explicitly applied: 7
* Target hierarchy correct: 5
* Target content correct: 4
* No manual rebuild required: 4

### Design fidelity — 15 points

* Headings and spacing: 4
* Emphasis and callouts: 4
* Formula and answer styling: 3
* Worked-example pattern: 2
* Card pattern: 2

### Content isolation — 10 points

* Reference content excluded: 6
* Purple content-specific exception excluded: 4

### Tool composability — 5 points

* Analyze → save → list → preview → create → verify workflow composed successfully: 5

### Reliability and idempotency — 3 points

* Stable IDs and no duplicate artifacts: 3

### Performance — 1 point

* Template and designed-note latency practical: 1

### Safety and error quality — 1 point

* Unsupported design rules and lifecycle errors surfaced clearly: 1

Report:

* **Plugin Capability Score:** `/100`

---

## Section 30 — Final Artifact Score

Score out of 100.

### Target academic correctness — 20 points

* Chemistry concepts: 6
* Formula correctness: 6
* Worked-example calculation: 5
* Summary and review definitions: 3

### Target completeness — 15 points

* Seven sections complete: 6
* Required descendants complete: 6
* Two card pairs complete: 3

### Hierarchy and organization — 15 points

* Section order: 5
* Nested structure: 5
* Formula and worked-example placement: 5

### Design-language transfer — 25 points

* Title and headings: 5
* Spacing: 3
* Key-idea pattern: 4
* Formula emphasis: 3
* Worked-example pattern: 4
* Answer emphasis: 2
* Warning pattern: 2
* Summary and card pattern: 2

### Content isolation and appropriateness — 10 points

* No reference-content leakage: 6
* Purple exception not generalized: 4

### Reference preservation — 10 points

* Reference text, hierarchy, styles, and cards unchanged: 10

### Absence of duplicates and pollution — 5 points

* No duplicate artifacts: 3
* No visible metadata or raw control pollution: 2

Report:

* **Final Artifact Score:** `/100`

---

## Section 31 — Weighted overall score

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

* `95–100`: Exceptional reusable-design workflow
* `85–94`: Strong pass
* `75–84`: Pass with limitations
* `60–74`: Partial
* `<60`: Fail or blocked

---

# 37. Mandatory scoring caps

Evaluate every cap explicitly.

## Scope violation

Any unauthorized mutation outside the Test 11 root:

* Verdict: `FAIL`
* Overall score capped at `40`

## More than one Test 11 root

* Reliability score: `0`
* Overall score capped at `65`

## More than one reference lesson

* Artifact cleanliness score: `0`
* Overall score capped at `65`

## More than one target lesson

* Artifact cleanliness score: `0`
* Overall score capped at `65`

## Approved root not live-confirmed

* Overall score capped at `60`

## Reference not fully verified before analysis

* Planning score capped at `8/15`
* Overall score capped at `75`

## No design analysis

* ChatGPT planning and tool-selection scores substantially reduced
* Overall score capped at `70`

## Template not saved

* Plugin template-lifecycle score: `0`
* Overall score capped at `65`

## Template not retrieved or listed after save

* Template-lifecycle score capped at `10/20`
* Overall score capped at `80`

## Duplicate template created

* Reliability points: `0`
* Overall score capped at `65`

## No template preview when supported

* Planning score capped at `10/15`
* Overall score capped at `85`

## Target manually styled without template-driven creation

* Design-transfer classification: `MANUAL_STYLE_SUBSTITUTION`
* Plugin designed-note score: `0`
* Overall score capped at `65`

## Reference cloned and edited into target

* Verdict: `FAIL`
* Content-isolation score: `0`
* Overall score capped at `50`

## Major reference-content leakage

When two or more reference-only content items appear in the target:

* Content-isolation score: `0`
* Overall score capped at `60`

## Any radioactive-decay formula copied into target

* Overall score capped at `60`

## Purple content-specific exception generalized

* Content-specific-exception points: `0`
* Overall score capped at `85`

## Reference text changed

For one unresolved reference-text change:

* Reference-preservation score capped at `5/10`
* Overall score capped at `75`

For two or more:

* Verdict: `FAIL`
* Overall score capped at `55`

## Reference hierarchy changed

* Reference-preservation score: `0`
* Overall score capped at `65`

## Reference style or card state changed

* Reference-preservation points reduced
* Overall score capped at `80`

## Target section missing

For one missing direct section:

* Target completeness reduced
* Overall score capped at `80`

For two or more:

* Overall score capped at `65`

## Target worked-example order incorrect

* Worked-example design points: `0`
* Overall score capped at `85`

## Target calculation incorrect

* Target academic score substantially reduced
* Overall score capped at `75`

## Formula malformed

For the main Kc formula or final answer:

* Formula points: `0`
* Overall score capped at `75`

## Cards are plain notes rather than verified concept/descriptor pairs

* Card Pattern Transfer Rate: `0%`
* Card design points: `0`
* Overall score capped at `88`

## No target design verification

* Verification score: `0`
* Overall score capped at `70`

## Plain text alone used to claim design success

* Plugin design-fidelity score: `0`
* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Blind retry after uncertain template save or target creation

* Reliability points: `0`
* Overall score capped at `65`

## False success claim

When lifecycle, design, or isolation claims conflict with readback:

* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Markdown report not created

* Overall score capped at `85`

When local file creation is genuinely unsupported, mark the report artifact `BLOCKED` instead of fabricating it.

## Complete initial prompt missing

* Overall score capped at `80`

## Chronological operation log missing

* Overall score capped at `75`

---

# 38. Required scoring-cap table

Include:

| Scoring cap                            | Triggered? | Evidence | Applied result |
| -------------------------------------- | ---------- | -------- | -------------- |
| Scope violation                        |            |          |                |
| More than one Test 11 root             |            |          |                |
| More than one reference lesson         |            |          |                |
| More than one target lesson            |            |          |                |
| Approved root not live-confirmed       |            |          |                |
| Reference not verified before analysis |            |          |                |
| No design analysis                     |            |          |                |
| Template not saved                     |            |          |                |
| Template not retrieved or listed       |            |          |                |
| Duplicate template created             |            |          |                |
| No template preview                    |            |          |                |
| Target manually styled                 |            |          |                |
| Reference cloned into target           |            |          |                |
| Major content leakage                  |            |          |                |
| Reference formula copied into target   |            |          |                |
| Purple exception generalized           |            |          |                |
| Reference text changed                 |            |          |                |
| Reference hierarchy changed            |            |          |                |
| Reference style or card state changed  |            |          |                |
| Target section missing                 |            |          |                |
| Worked-example order incorrect         |            |          |                |
| Target calculation incorrect           |            |          |                |
| Formula malformed                      |            |          |                |
| Card pattern not functional            |            |          |                |
| No target design verification          |            |          |                |
| Plain text used to claim design        |            |          |                |
| Blind retry                            |            |          |                |
| False success claim                    |            |          |                |
| Markdown report not created            |            |          |                |
| Complete initial prompt missing        |            |          |                |
| Chronological operation log missing    |            |          |                |

Apply the lowest triggered cap.

---

# 39. Verdict rules

Choose exactly one:

* `PASS`
* `PASS_WITH_WARNINGS`
* `PARTIAL`
* `BLOCKED_SCOPE_MISMATCH`
* `BLOCKED_REFERENCE_INCOMPLETE`
* `BLOCKED_CONNECTION`
* `UNSUPPORTED_DESIGN_REUSE`
* `FAIL`

## PASS

Use only when:

* Approved scope is confirmed.
* Exactly one Test 11 root exists.
* Exactly one reference lesson exists.
* Reference design is complete and verified.
* Design analysis separates reusable rules from content.
* Purple Carbon-14 styling is classified as content-specific.
* Exactly one template is saved.
* The saved template is retrieved or listed.
* The target is previewed where supported.
* Exactly one target lesson is created using the saved template.
* Target hierarchy and content are complete.
* Supported reusable design rules transfer correctly.
* Target formulas are correct.
* Two concept/descriptor pairs are verified.
* No radioactive-decay content leaks into the target.
* Purple styling is not generalized.
* Reference lesson remains unchanged.
* No duplicate or pollution remains.
* The report is created and verified.
* Final adjusted score is at least 85.

## PASS_WITH_WARNINGS

Use when:

* The template lifecycle completes.
* Target content is complete and correct.
* Most reusable design rules transfer.
* One visual property such as native spacing, color, or whole-Rem highlight is unsupported.
* The unsupported property is reported honestly.
* No major content leakage occurs.
* Reference remains unchanged.
* No manual styling is falsely described as template-driven.

## PARTIAL

Use when:

* A template is saved and applied.
* The target is usable but some design rules do not transfer.
* Formula, card, or spacing verification is incomplete.
* A minor content-isolation or reference-preservation defect remains.
* No scope violation, cloning, or false claim occurs.

## BLOCKED_SCOPE_MISMATCH

Use when the approved root cannot be confirmed.

## BLOCKED_REFERENCE_INCOMPLETE

Use when a reliable reference design cannot be established.

## BLOCKED_CONNECTION

Use when connection failure prevents safe template lifecycle or verification.

## UNSUPPORTED_DESIGN_REUSE

Use when the plugin lacks a genuine reusable design-template workflow.

## FAIL

Use when:

* Scope is violated.
* The reference is cloned into the target.
* The target is manually restyled while claiming template reuse.
* Major radioactive-decay content leaks into the target.
* The reference is materially changed.
* Duplicate templates or target lessons are knowingly created.
* A false success claim is made.
* Old notes are modified.
* Deletion is performed.
* The result does not demonstrate reusable design transfer.

---

# 40. Final recommendation

Choose exactly one:

* `PROCEED_TO_TEST_12`
* `PROCEED_WITH_CAUTION`
* `REPEAT_TEST_11`
* `REPAIR_DESIGN_ANALYSIS`
* `REPAIR_TEMPLATE_LIFECYCLE`
* `REPAIR_DESIGNED_NOTE_CREATION`
* `REPAIR_DESIGN_VERIFICATION`
* `CORRECT_REMNOTE_SCOPE`
* `DO_NOT_PROCEED`

Base the recommendation on the strongest limiting factor.

---

# 41. Artifact manifest

Include:

| Artifact                 | Type                   | Parent/location          | ID or path       | Verified |
| ------------------------ | ---------------------- | ------------------------ | ---------------- | -------- |
| Test 11 root             | RemNote root           | Plugin Test              | Live Rem ID      | Yes/No   |
| Reference lesson         | Designed Rem hierarchy | Test 11 root             | Live Rem ID      | Yes/No   |
| Reusable design template | Template artifact      | Template storage         | Live template ID | Yes/No   |
| Target chemistry lesson  | Designed Rem hierarchy | Test 11 root             | Live Rem ID      | Yes/No   |
| Test 11 report           | Markdown file          | Local artifact workspace | File path        | Yes/No   |

State explicitly:

* No report was created inside RemNote.
* No old RemNote note was modified.
* No Rem was deleted.
* No duplicate template was intentionally created.
* No reference lesson was cloned into the target.
* No external academic source was used.
* No artifact outside the Test 11 scope was changed.

---

# 42. Report-integrity declaration

End the report with:

> I confirm that this report includes the complete user-provided Test 11 prompt, distinguishes reusable design rules from academic content and content-specific exceptions, verifies the template save and retrieval lifecycle, distinguishes template-driven creation from manual restyling, compares the reference before and after template reuse, reports content leakage and unsupported capabilities honestly, does not expose authentication secrets, and accurately records every design, formula, card, duplicate, hierarchy, and scope result.

Then include:

* Report generated at
* Report filename
* File verification result
* Approved-root ID
* Test-root ID
* Reference-root ID
* Target-root ID
* Template name
* Template ID
* Template lifecycle classification
* Design-transfer classification
* Content-isolation classification
* Reference-preservation classification
* Reusable rules expected
* Reusable rules transferred
* Target content items expected
* Target content items verified
* Target formula checks
* Target card pairs verified
* Reference Rems preserved
* Reference-only leakage items found
* Purple-exception result
* Reusable Design Rule Transfer Rate
* Target Content Fidelity Rate
* Reference Preservation Rate
* Card Pattern Transfer Rate
* Content Leakage Rate
* Content-Specific Exception Rejection Rate
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

# 43. Final chat response

After creating and verifying the reference lesson, saved template, target lesson, and local report, respond with:

**Test 11 verdict:** `[VERDICT]`
**Reference lesson:** `[TITLE]`
**Reference Rem ID:** `[REM ID]`
**Template:** `[TEMPLATE NAME]`
**Template ID:** `[TEMPLATE ID]`
**Template lifecycle:** `[CLASSIFICATION]`
**Target lesson:** `[TITLE]`
**Target Rem ID:** `[REM ID]`
**Reusable design rules transferred:** `[OBSERVED]/[SUPPORTED]`
**Design Rule Transfer Rate:** `[PERCENTAGE]%`
**Target Content Fidelity Rate:** `[PERCENTAGE]%`
**Reference Preservation Rate:** `[PERCENTAGE]%`
**Card Pattern Transfer Rate:** `[PERCENTAGE]%`
**Content Leakage Rate:** `[PERCENTAGE]%`
**Purple exception generalized:** `[YES/NO]`
**Repairs performed:** `[COUNT]`
**ChatGPT Agent Score:** `[SCORE]/100`
**Plugin Capability Score:** `[SCORE]/100`
**Final Artifact Score:** `[SCORE]/100`
**Weighted overall score:** `[SCORE]/100`
**Recommendation:** `[RECOMMENDATION]`
**Report:** `[Download the complete Markdown report](working-file-link)`

Do not paste the complete report into the final response unless local file creation failed.

Do not claim completion until the reference lesson, saved template, target lesson, and report file have all been independently verified.

Begin RemNote MCP Test 11 now.
`````

## Section 3 — Test configuration

| Field | Value |
| --- | --- |
| Test number | 11 |
| Test name | Learn, Save, and Reuse a Note Design |
| Difficulty | Advanced |
| Run type | Main Run |
| Approved root | Plugin Test |
| Expected approved-root ID | OjLcSppWfIH0cpPoh |
| Observed approved-root ID | OjLcSppWfIH0cpPoh |
| Test-root title | RemNote MCP Test 11 — Learn and Reuse Design — 2026-07-12 — Run 03 |
| Test-root ID | l6pQxh3FR85GChnKD |
| Reference title | Reference Design — Radioactive Decay |
| Reference ID | toZOr998mVMBvqjEs |
| Target title | Designed Lesson — Chemical Equilibrium |
| Target ID | DleGlFGldXczOYpEU |
| Template name | Test 11 — Clean Science Lesson Design — 2026-07-12 — Run 03 |
| Template ID | design-test-11-clean-science-lesson-design-2026-07-12-run-03 |
| Deletion | Forbidden |
| External sources | Forbidden |

## Section 4 — Starting conditions and scope confirmation

- Bridge connected with one active plugin session; initial sync complete.
- Focus and selection both resolved to `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- Permission mode: `full_control_delete_approval`; profile: `developer`.
- Initial approved-root child count: 14.
- No exact Run 03 root or template collision.
- Scope verdict: `PASS`.
- Connection remained deterministic, though several calls had multi-second forwarding latency.

## Section 5 — Test-root creation

| Field | Observed |
| --- | --- |
| Run | 03 |
| Title | RemNote MCP Test 11 — Learn and Reuse Design — 2026-07-12 — Run 03 |
| ID | l6pQxh3FR85GChnKD |
| Parent | OjLcSppWfIH0cpPoh |
| Idempotency | test11-root-20260712-run03 |
| Operation | 1543e8c8-75d6-4d53-8152-57400b787dd3 |
| Parent count before/after | 14 / 15 |
| Breadcrumb | Plugin Test → Run 03 |
| Duplicate check | No exact collision |
| Readback | PASS |

## Section 6 — Reference creation and styling

| Field | Result |
| --- | --- |
| Reference | Reference Design — Radioactive Decay / toZOr998mVMBvqjEs |
| Creation | create_rem_tree |
| Operation | ca7474b3-d5bd-4f8e-a1e0-da808ee0ee42 |
| Idempotency | test11-reference-tree-20260712-run03 |
| Nodes | 37 |
| Direct sections | 7 |
| Style route | apply_style_plan, set_hide_bullet, set_rem_type |
| Cards | 2 concept/descriptor pairs |
| Spacing | No blank/spacer Rems; native spacing unsupported |
| Heading levels | SDK_UNSUPPORTED to prevent Size pollution |
| Verdict | PASS_WITH_WARNINGS |

```text
Reference Design — Radioactive Decay
├── 1. Overview
│   ├── Radioactive decay is a spontaneous transformation of an unstable nucleus.
│   └── Carbon-14 is one example of a radioactive nuclide.
├── 2. Key Concepts
│   ├── Statistical Nature
│   │   └── The exact decay time of one nucleus cannot normally be predicted.
│   ├── Decay Constant
│   │   └── The decay constant λ is the probability per nucleus per unit time.
│   └── Key idea: A large population follows a predictable exponential law.
├── 3. Key Formula
│   ├── The number of undecayed nuclei after time t is:
│   └── N(t)=N₀e^(−λt)
├── 4. Worked Example
│   ├── Problem
│   │   └── A sample initially contains 800 undecayed nuclei and has a half-life of 5 hours. Determine the number remaining after 15 hours.
│   ├── Given
│   │   ├── N₀=800
│   │   ├── T₁/₂=5 h
│   │   └── t=15 h
│   ├── Formula
│   │   └── N=N₀(1/2)^(t/T₁/₂)
│   ├── Substitution
│   │   └── N=800(1/2)^(15/5)=800(1/2)³
│   └── Answer
│       └── N=100 undecayed nuclei
├── 5. Common Pitfall
│   └── Warning: Half-life does not mean that every nucleus decays after the same fixed time.
├── 6. Summary
│   ├── Radioactive decay is spontaneous and statistical.
│   ├── The decay law is exponential.
│   └── A larger decay constant corresponds to a shorter half-life.
└── 7. Review Cards
    ├── Half-life
    │   └── The time required for the number of undecayed nuclei to fall to one-half of its initial value.
    └── Decay constant λ
        └── The probability per nucleus per unit time.
```

## Section 7 — Complete reference baseline snapshot

| Label | Rem ID | Parent | Position | Plain text | Role/color/highlight/type |
| --- | --- | --- | --- | --- | --- |
| Root | toZOr998mVMBvqjEs | l6pQxh3FR85GChnKD | 0 | Reference Design — Radioactive Decay | normal; hidden bullet |
| Overview | uz7pVKCjtAQeGNnUA | toZOr998mVMBvqjEs | 0 | 1. Overview | normal; blue; hidden |
| Key idea | VDAhCfwGKKoodPYz3 | kK7S5dlNepqFMBMIt | 2 | Key idea: A large population follows a predictable exponential law. | bold/yellow label |
| Formula | aIyNibtZAalWHTjpb | d1NEzBjH75j4g0IU0 | 1 | N(t)=N₀e^(−λt) | blue full-text highlight |
| Answer | 42N3Jh1Z19U7vOOKO | xlR36kVeqD2KTQFMJ | 0 | N=100 undecayed nuclei | green full-text highlight |
| Warning | OFZFko3RGqfg3t8aC | dB7FxWxQqjDkgvvlb | 0 | Warning: Half-life does not mean that every nucleus decays after the same fixed time. | bold/red label |
| Purple exception | 9nWa2yWhlnLMQg3eq | uz7pVKCjtAQeGNnUA | 1 | Carbon-14 is one example of a radioactive nuclide. | purple phrase |
| Card 1 | 6k9bef0KsM5Tnm3JD / TX52CoSaWipRmUn2O | Armbj6S9z1c92KDUC | 0 | Half-life / definition | concept + descriptor |
| Card 2 | HxolTNacye1wAPjCv / 6stivDcqad332zO1H | Armbj6S9z1c92KDUC | 1 | Decay constant λ / definition | concept + descriptor |

Complete Rem ID set:

```text
toZOr998mVMBvqjEs
uz7pVKCjtAQeGNnUA
Bs0VaTzXDeFF68M6s
9nWa2yWhlnLMQg3eq
kK7S5dlNepqFMBMIt
ABcrapzliJu6UxUjD
61uK2tHfCUwzZyjuB
OeYp3ch9Isajn0u7q
P3E324PCCdKdzYKzh
VDAhCfwGKKoodPYz3
d1NEzBjH75j4g0IU0
RmGfle6PcqiKIzlYI
aIyNibtZAalWHTjpb
G2WKYs9G0nhudN3s0
pctidrDcQxUJHsPRE
CHxKzfE3tZVJf0cAy
SUMrcfu5IAwTtf50K
SHNoAAuUCfeCIUsu7
oe7zrFs4lNdAIBIhd
HApzUbY3UQNUBb8Oe
pUZeIFbEIzclwXhwD
7xib3a93oc9K1d0tR
1Xs67U53d9wAiN1Nf
AfPq1djijTZnocgW4
xlR36kVeqD2KTQFMJ
42N3Jh1Z19U7vOOKO
dB7FxWxQqjDkgvvlb
OFZFko3RGqfg3t8aC
HWFpgy0o9JIUHoCiT
6Mv0QfEAEV1MpPTYC
StB8eCcJY7Ei5BDgt
6ZI9XC1PGpwdpraY3
Armbj6S9z1c92KDUC
6k9bef0KsM5Tnm3JD
TX52CoSaWipRmUn2O
HxolTNacye1wAPjCv
6stivDcqad332zO1H
```

- Node count: 37; exact hierarchy/order; zero metadata pollution; no raw delimiters.
- Canonical fixture hash: `eb66232462b942a439354666ac0b5000d3818491ea5168ba46a3d28e55c98c6b`.

## Section 8 — Reference design verification

| Rule | Expected | Observed | Status |
| --- | --- | --- | --- |
| Title role | Strong title + hidden bullet | Normal + hidden; heading unsupported | UNSUPPORTED_PROPERTY |
| Seven sections | Exact | Exact | PASS |
| Section role | H3 | Normal; heading mutation disabled | UNSUPPORTED_PROPERTY |
| Section color/bullets | Blue/hidden | Applied to all seven | PASS |
| Spacing | Non-polluting | No spacers or blanks | UNSUPPORTED_PROPERTY |
| Key idea | Bold/yellow label | Exact | PASS |
| Formula | Separate + blue | Exact plain text + blue span | PASS |
| Worked sequence | Five ordered labels | Exact | PASS |
| Answer | Green | Exact | PASS |
| Warning | Bold/red label | Exact | PASS |
| Summary | Three ordinary bullets | Exact | PASS |
| Cards | Two concept/descriptor pairs | Exact types | PASS |
| Purple exception | Carbon-14 only | Exact | PASS |
| Pollution | None | None | PASS |

## Section 9 — Design analysis

| Property | Observed | Classification | Include? | Rationale |
| --- | --- | --- | --- | --- |
| Hidden title/section bullets | Supported | REUSABLE_DESIGN_RULE | Yes | Subject-neutral |
| Blue section labels | Supported | REUSABLE_DESIGN_RULE | Yes | Uniform |
| Heading size | Unsafe/unsupported | UNSUPPORTED_PROPERTY | No | Avoid Size metadata |
| Spacing | No safe native form | UNSUPPORTED_PROPERTY | No | Avoid blank wrappers |
| Key idea label | Bold/yellow | REUSABLE_DESIGN_RULE | Yes | Semantic |
| Formula placement/emphasis | Separate/blue | REUSABLE_DESIGN_RULE | Yes | Subject-neutral |
| Worked sequence | Five labels | REUSABLE_DESIGN_RULE | Yes | Pedagogic |
| Answer | Green | REUSABLE_DESIGN_RULE | Yes | Positive result |
| Warning | Bold/red | REUSABLE_DESIGN_RULE | Yes | Semantic |
| Summary/cards | Ordinary bullets + two pairs | REUSABLE_DESIGN_RULE | Yes | Reusable |
| Radioactive content | All prose/formulas/values | SUBJECT_CONTENT | No | Prevent leakage |
| Purple Carbon-14 | Phrase-specific | CONTENT_SPECIFIC_EXCEPTION | No | Not reusable |
| Built-in analyzer | Wrong source root | NOT_VERIFIED | No | Source-scoping defect |

Final analysis used the verified snapshot as a safe equivalent; contaminated analyzer output was excluded.

## Section 10 — Template collision and naming analysis

| Field | Result |
| --- | --- |
| Initial count | 17 |
| Similar name | Run 01 existed |
| Exact Run 03 collision | No |
| Selected name | Test 11 — Clean Science Lesson Design — 2026-07-12 — Run 03 |
| Selected run | 03 |
| Collision result | Unique |

## Section 11 — Template save result

| Field | Result |
| --- | --- |
| Name | Test 11 — Clean Science Lesson Design — 2026-07-12 — Run 03 |
| ID | design-test-11-clean-science-lesson-design-2026-07-12-run-03 |
| Source Rem | toZOr998mVMBvqjEs |
| Included | Subject-neutral supported design rules |
| Excluded | All radioactive content/IDs and purple exception |
| Operation | 5dbebe9a-801e-4bc5-840f-6c804210901b |
| Latency | 7,540 ms |
| Scope | localOnly=true |
| Classification | TEMPLATE_SAVED_AND_RETRIEVED |

## Section 12 — Template retrieval and listing

| Template name | Template ID | Occurrences | Metadata | Verified |
| --- | --- | --- | --- | --- |
| Test 11 — Clean Science Lesson Design — 2026-07-12 — Run 03 | design-test-11-clean-science-lesson-design-2026-07-12-run-03 | 1 | sourceRemId=toZOr998mVMBvqjEs; version=1 | Yes |

Post-save count: 18; duplicate count: 0; classification: `TEMPLATE_SAVED_AND_RETRIEVED`.

## Section 13 — Target-content validation

```text
Designed Lesson — Chemical Equilibrium
├── 1. Overview
│   ├── Chemical equilibrium is the dynamic state in which forward and reverse reactions occur at equal rates.
│   └── The concentrations of reactants and products remain constant at equilibrium even though molecular reactions continue.
├── 2. Key Concepts
│   ├── Dynamic Equilibrium
│   │   └── Forward and reverse reactions continue while their rates remain equal.
│   ├── Equilibrium Constant
│   │   └── The equilibrium constant expresses the relationship between equilibrium concentrations.
│   ├── Reaction Quotient
│   │   └── The reaction quotient has the same form as the equilibrium expression but may be evaluated away from equilibrium.
│   └── Key idea: Equilibrium is dynamic rather than static.
├── 3. Key Formula
│   ├── For aA+bB⇌cC+dD, the concentration equilibrium constant is:
│   └── Kc=[C]^c[D]^d/([A]^a[B]^b)
├── 4. Worked Example
│   ├── Problem
│   │   └── For N₂+3H₂⇌2NH₃, the equilibrium concentrations are [N₂]=0.50 M, [H₂]=0.30 M, and [NH₃]=0.20 M. Calculate Kc.
│   ├── Given
│   │   ├── [N₂]=0.50 M
│   │   ├── [H₂]=0.30 M
│   │   └── [NH₃]=0.20 M
│   ├── Formula
│   │   └── Kc=[NH₃]²/([N₂][H₂]³)
│   ├── Substitution
│   │   └── Kc=(0.20)²/[(0.50)(0.30)³]
│   └── Answer
│       └── Kc≈2.96
├── 5. Common Pitfall
│   └── Warning: Do not use stoichiometric coefficients as concentration values.
├── 6. Summary
│   ├── Equilibrium is dynamic because both reaction directions continue.
│   ├── The equilibrium constant is calculated from equilibrium concentrations.
│   └── The value of Kc describes the equilibrium composition for a specified reaction and temperature.
└── 7. Review Cards
    ├── Dynamic equilibrium
    │   └── A state in which forward and reverse reaction rates are equal.
    └── Equilibrium constant Kc
        └── The ratio of product concentration terms to reactant concentration terms, each raised to its stoichiometric coefficient.
```

- Seven direct sections; 39 required Rem nodes; nine formula strings; two card pairs; final result `Kc≈2.96`; no source-only terms in fixture. Readiness: `PASS`.

## Section 14 — Template preview

| Field | Result |
| --- | --- |
| Template | design-test-11-clean-science-lesson-design-2026-07-12-run-03 |
| Parent | l6pQxh3FR85GChnKD |
| Target collision | None |
| Operation | fb0f808c-3131-419b-8c88-09ce4efb5887 |
| Preview | Stored Run 03 rules; exact content |
| Unsupported | Heading mutation/native spacing excluded |
| Leakage | None |
| Purple generalization | None |
| Warnings | None |
| Verdict | PASS |

## Section 15 — Target designed-note creation

| Field | Result |
| --- | --- |
| Target | Designed Lesson — Chemical Equilibrium / DleGlFGldXczOYpEU |
| Parent | l6pQxh3FR85GChnKD |
| Template | design-test-11-clean-science-lesson-design-2026-07-12-run-03 |
| Operation | 0772858a-c7b1-49ce-ad92-14801da7e10f |
| Idempotency | test11-target-designed-create-20260712-run03 |
| Creation verification | No missing/extra snippets or structure mismatches |
| Defect | Redundant outer title wrapper |
| Repair | Rename wrapper and promote intact target |
| Repair operations | 93b7556c-5f82-4e9c-a6ed-531401957a65; a3e5ce26-3bcc-43ea-87a9-fc02e3336af6 |
| Final readback | Exact 39-node target |

## Section 16 — Target hierarchy and content verification

```text
Designed Lesson — Chemical Equilibrium
├── 1. Overview
│   ├── Chemical equilibrium is the dynamic state in which forward and reverse reactions occur at equal rates.
│   └── The concentrations of reactants and products remain constant at equilibrium even though molecular reactions continue.
├── 2. Key Concepts
│   ├── Dynamic Equilibrium
│   │   └── Forward and reverse reactions continue while their rates remain equal.
│   ├── Equilibrium Constant
│   │   └── The equilibrium constant expresses the relationship between equilibrium concentrations.
│   ├── Reaction Quotient
│   │   └── The reaction quotient has the same form as the equilibrium expression but may be evaluated away from equilibrium.
│   └── Key idea: Equilibrium is dynamic rather than static.
├── 3. Key Formula
│   ├── For aA+bB⇌cC+dD, the concentration equilibrium constant is:
│   └── Kc=[C]^c[D]^d/([A]^a[B]^b)
├── 4. Worked Example
│   ├── Problem
│   │   └── For N₂+3H₂⇌2NH₃, the equilibrium concentrations are [N₂]=0.50 M, [H₂]=0.30 M, and [NH₃]=0.20 M. Calculate Kc.
│   ├── Given
│   │   ├── [N₂]=0.50 M
│   │   ├── [H₂]=0.30 M
│   │   └── [NH₃]=0.20 M
│   ├── Formula
│   │   └── Kc=[NH₃]²/([N₂][H₂]³)
│   ├── Substitution
│   │   └── Kc=(0.20)²/[(0.50)(0.30)³]
│   └── Answer
│       └── Kc≈2.96
├── 5. Common Pitfall
│   └── Warning: Do not use stoichiometric coefficients as concentration values.
├── 6. Summary
│   ├── Equilibrium is dynamic because both reaction directions continue.
│   ├── The equilibrium constant is calculated from equilibrium concentrations.
│   └── The value of Kc describes the equilibrium composition for a specified reaction and temperature.
└── 7. Review Cards
    ├── Dynamic equilibrium
    │   └── A state in which forward and reverse reaction rates are equal.
    └── Equilibrium constant Kc
        └── The ratio of product concentration terms to reactant concentration terms, each raised to its stoichiometric coefficient.
```

| Requirement | Observed ID | Parent/order/text | Status |
| --- | --- | --- | --- |
| 1. Overview | uQzLNYwcAnQSoSs08 | Exact | PASS |
| 2. Key Concepts | pPxnNvCfAsQpAsthM | Exact | PASS |
| 3. Key Formula | B7RnlP8jK6sMLY1ux | Exact | PASS |
| 4. Worked Example | GsOJz77NXhlIert8L | Exact | PASS |
| 5. Common Pitfall | 4anrqybaKucwhv2ci | Exact | PASS |
| 6. Summary | 9VdaRJI2Gshd6R9sS | Exact | PASS |
| 7. Review Cards | 6W0Tkz236vVvt5hvw | Exact | PASS |
| Key idea | JBqVRlBcWxTbYJCEr | Exact | PASS |
| Main formula | Uqy0S9dfsDRjQhI9I | Exact | PASS |
| Worked sequence | nWrt1wQqIMO5EfiXw → 9RcHNdq0blGuaPeYr | Exact | PASS |
| Warning | Djebyk6OB0jW7x0EI | Exact | PASS |
| Summary | 3 children | Exact | PASS |
| Card text pairs | GuG62ETQBN5jza9fQ/GXO0tVgR4CKCih0d7 | Exact text; types unverified | PARTIAL |

Missing/extra/wrong-parent/wrong-order/text differences: 0 after repair. Target fidelity: **39/39 = 100.00%**.

## Section 17 — Design-rule transfer verification

| Rule | Reference | Template | Target | Status |
| --- | --- | --- | --- | --- |
| Title role | Normal/hidden | normal | Normal; bullet not independently verified | SEMANTICALLY_EQUIVALENT |
| Section level | Normal; H3 unsupported | normal | Normal | EXACT |
| Heading color | Blue | aggregate blue=7 | Not verified | NOT_VERIFIED |
| Heading bullets | Hidden | description | Not verified | NOT_VERIFIED |
| Spacing | No spacers | 0 spacers | No spacers | EXACT |
| Key idea boundaries | Bold/yellow | aggregate | Not verified | NOT_VERIFIED |
| Formula placement | Separate | rule true | Separate | EXACT |
| Formula emphasis | Blue | aggregate | Not verified | NOT_VERIFIED |
| Worked sequence | Five labels | stored labels | Exact | EXACT |
| Answer emphasis | Green | aggregate | Not verified | NOT_VERIFIED |
| Warning emphasis | Red/bold | aggregate | Not verified | NOT_VERIFIED |
| Summary | Three ordinary bullets | description | Exact | EXACT |
| Cards | Two typed pairs | cardLike=2 | Plain hierarchy only | MISSING |
| No over-decoration | Ordinary text | principle | Observed | EXACT |

Transferred: 6 of 13 supported/verified rules = **46.15%**. Unsupported heading size and native spacing were separately excluded. No manual target restyling occurred. Classification: `PARTIAL_DESIGN_TRANSFER`.

## Section 18 — Formula verification

| Expression | Rem ID | Plain/rich/symbol state | Emphasis | Classification |
| --- | --- | --- | --- | --- |
| aA+bB⇌cC+dD | Jz1GmlrT6qYfQ4CM6 | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| Kc=[C]^c[D]^d/([A]^a[B]^b) | Uqy0S9dfsDRjQhI9I | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| N₂+3H₂⇌2NH₃ | sm7pxkAU1Yckqq0eG | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| [N₂]=0.50 M | OSkUXvnRKHJrQ6y8M | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| [H₂]=0.30 M | KWjfGj9CaZy9OTyiM | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| [NH₃]=0.20 M | el7peKUILMAL7JRRh | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| Kc=[NH₃]²/([N₂][H₂]³) | LIfHDRvMZeTg3qS7h | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| Kc=(0.20)²/[(0.50)(0.30)³] | ysj2XwZYXnIAsshgM | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |
| Kc≈2.96 | E3NA1kMEowKZ5JcoQ | Exact plain text; subscripts/superscripts/arrows/brackets/signs preserved | Not verified | EXACT_PLAIN_TEXT |

All nine expressions exact; no raw delimiters; rich math and formula-emphasis transfer not verified.

## Section 19 — Worked-example pattern verification

| Component | Expected | Observed | Style match | Content | Status |
| --- | --- | --- | --- | --- | --- |
| Problem | 1 | 1 | Structural only; style unverified | Correct | PASS_WITH_STYLE_LIMITATION |
| Given | 2 | 2 | Structural only; style unverified | Correct | PASS_WITH_STYLE_LIMITATION |
| Formula | 3 | 3 | Structural only; style unverified | Correct | PASS_WITH_STYLE_LIMITATION |
| Substitution | 4 | 4 | Structural only; style unverified | Correct | PASS_WITH_STYLE_LIMITATION |
| Answer | 5 | 5 | Structural only; style unverified | Correct | PASS_WITH_STYLE_LIMITATION |

Final answer exact; no copied reference values/problem.

## Section 20 — Card-pattern verification

| Concept | Concept ID | Descriptor | Descriptor ID | Types | Metadata | Content | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dynamic equilibrium | GuG62ETQBN5jza9fQ | A state in which forward and reverse reaction rates are equal. | wDpIP7z5RbLceZeRm | Not verified | Not returned | Exact | PLAIN_NOTES |
| Equilibrium constant Kc | GXO0tVgR4CKCih0d7 | The ratio of product concentration terms to reactant concentration terms, each raised to its stoichiometric coefficient. | oPZIlF3xGnNc7XLb7 | Not verified | Not returned | Exact | PLAIN_NOTES |

Text pairs 2/2; functional pairs 0/2; Card Pattern Transfer Rate **0.00%**.

## Section 21 — Content-isolation and exception audit

| Term/style | Expected | Observed | Status |
| --- | --- | --- | --- |
| radioactive | 0 | 0 | PASS |
| decay | 0 | 0 | PASS |
| Carbon-14 | 0 | 0 | PASS |
| half-life | 0 | 0 | PASS |
| undecayed nuclei | 0 | 0 | PASS |
| decay constant | 0 | 0 | PASS |
| reference nuclear formula | 0 | 0 | PASS |
| N=100 | 0 | 0 | PASS |
| 800 | 0 | 0 | PASS |
| 15 hours | 0 | 0 | PASS |
| purple target phrase | 0 | 0 | PASS |

Leakage Rate **0.00%**; Exception Rejection **100.00%**; `CONTENT_ISOLATED`.

## Section 22 — Reference-preservation audit

| Reference Rem | Before | After | Text | Parent | Order | Style | Cards | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| All 37 Rems | 37-ID baseline | Same IDs | Preserved | Preserved | Preserved | No post-baseline mutation | No post-baseline mutation | REFERENCE_UNCHANGED |

Reference Preservation Rate **37/37 = 100.00%**; no new or missing children.

## Section 23 — Duplicate and pollution audit

| Defect | Found | Count | Location | Impact | Repaired |
| --- | --- | --- | --- | --- | --- |
| Duplicate root | No | 0 | — | — | N/A |
| Duplicate reference | No | 0 | — | — | N/A |
| Duplicate target | No | 0 | — | Outer title renamed | Yes |
| Duplicate template | No | 0 | — | — | N/A |
| Duplicate sections/formulas/cards | No | 0 | Target | — | N/A |
| Raw Markdown/math markers | No | 0 | Both notes | — | N/A |
| Template metadata pollution | Yes | 1 | Run 03 root | Empty helper container | Partially; renamed/emptied |
| Idempotency pollution | No | 0 | — | — | N/A |
| Empty wrapper | Yes | 1 | 73NaSLI3BlQysjPpj | Visual extra artifact | Deletion forbidden |
| Reference leakage | No | 0 | Target | — | N/A |
| Purple leakage | No | 0 | Target | — | N/A |
| Unintended card | No | 0 | Target | Card transfer missing, not extra | N/A |

## Section 24 — Design-transfer metrics

- Reusable Design Rule Transfer Rate = 6/13 = **46.15%**
- Target Content Fidelity Rate = 39/39 = **100.00%**
- Reference Preservation Rate = 37/37 = **100.00%**
- Card Pattern Transfer Rate = 0/2 = **0.00%**
- Content Leakage Rate = 0/11 = **0.00%**
- Content-Specific Exception Rejection Rate = **100.00%**

## Section 25 — Defects and recovery

| Defect | Artifact | Detected | Failure layer | Diagnosis | Repair | Result | Reverification |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Heading mutation unsafe | Reference styles | Style plan | Unsupported SDK capability | Risk of Size metadata | Exclude rule | No pollution | Full tree clean |
| Analyzer wrong source | Design analysis | Analyzer response | Plugin implementation failure | Ignored reference ID | Use verified snapshot | Explicit rules saved | Template source correct |
| Highlight verifier mismatch | Formula/answer | Verifier | Verification-tool defect | Full spans not exposed as wholeRem metadata | Normalize spans | PASS | Text/children unchanged |
| Redundant wrapper | Target hierarchy | Creation plan/readback | Plugin implementation failure | Duplicate outer title | Rename + move intact target | PASS | Exact breadcrumb/order |
| Verifier wrong defaults | Target design | Design verifier | Verification-tool defect | Demanded H1/H3/spacers not stored | Do not apply unsafe repair | Recorded | Independent tree verification |
| Card types missing | Target cards | Readback/creation metadata | Plugin implementation failure | Aggregate template rule not instantiated | No manual whole-target restyle | Unresolved | Rate 0% |

## Section 26 — Efficiency analysis

| Category | Count |
| --- | --- |
| Scope reads | 6 |
| Collision checks | 1 |
| Reference creation | 2 |
| Reference style | 13 |
| Reference verification | 3 |
| Design analysis | 1 |
| Template list | 2 |
| Template save | 1 |
| Template preview | 1 |
| Designed creation | 1 |
| Target verification | 3 |
| Formula reads | 0 |
| Card reads | 0 |
| Reference preservation | 1 |
| Repair calls | 3 |
| Failed calls | 5 |
| Repeated calls | 0 |
| Avoidable calls | 3 |
| Total meaningful calls | 38 |

Slowest: preview 14,949 ms; known bridge latency ≈105 s. Best capability: save/list and content fidelity. Fragile: analyzer/style mapping/verifier. Template-associated target creation: yes. Manual target styling: no.

## Section 27 — Safety and mutation audit

| Category | Allowed | Observed | Status |
| --- | --- | --- | --- |
| Test roots | 1 | 1 | PASS |
| References | 1 | 1 | PASS |
| Targets | 1 | 1 | PASS |
| Templates | 1 | 1 | PASS |
| Duplicate templates | 0 | 0 | PASS |
| Old notes modified | 0 | 0 | PASS |
| Outside-scope Rems | 0 | 0 | PASS |
| Reference text/hierarchy/style/card changes after baseline | 0 | 0 | PASS |
| Deletions | 0 | 0 | PASS |
| Reference content copied | 0 | 0 | PASS |
| Purple generalized | 0 | 0 | PASS |
| Blind retries | 0 | 0 | PASS |
| External sources | 0 | 0 | PASS |

## Section 28 — ChatGPT Agent Score

| Category | Max | Awarded | Evidence |
| --- | --- | --- | --- |
| Task understanding | 10 | 10 | Design/content/exception separated |
| Planning | 15 | 14 | Full lifecycle; minor schema mistakes |
| Tool selection | 15 | 14 | Genuine lifecycle tools |
| Sequencing | 15 | 15 | Correct gates/order |
| Verification | 15 | 13 | Strong tree/reference checks; incomplete rich target checks |
| Recovery | 10 | 10 | Minimal repairs; no rebuild |
| Safety | 10 | 10 | Scope/deletion/idempotency safe |
| Efficiency | 5 | 2 | Latency and avoidable schema calls |
| Reporting | 5 | 3 | Complete evidence; some properties not returned |

**ChatGPT Agent Score: 91/100**

## Section 29 — Plugin Capability Score

| Category | Max | Awarded | Evidence |
| --- | --- | --- | --- |
| Availability | 10 | 10 | All lifecycle tools |
| Reference analysis | 15 | 5 | Wrong source |
| Template lifecycle | 20 | 20 | Save/retrieve exact |
| Designed creation | 20 | 13 | Exact content; wrapper/style defects |
| Design fidelity | 15 | 5 | Structure only |
| Isolation | 10 | 10 | No leakage |
| Composability | 5 | 2 | Analyzer/verifier defects |
| Reliability | 3 | 2 | Stable IDs; helper artifact |
| Performance | 1 | 0 | Multi-second forwarding |
| Safety/error | 1 | 1 | Unsupported heading surfaced |

**Plugin Capability Score: 68/100**

## Section 30 — Final Artifact Score

| Category | Max | Awarded | Evidence |
| --- | --- | --- | --- |
| Academic correctness | 20 | 20 | Exact chemistry/formulas/result |
| Completeness | 15 | 12 | All content; cards nonfunctional |
| Hierarchy | 15 | 15 | Exact after repair |
| Design transfer | 25 | 10 | Structural, not visual/card |
| Isolation | 10 | 10 | Zero leakage/purple |
| Reference preservation | 10 | 10 | 37/37 |
| Cleanliness | 5 | 2 | One empty helper container |

**Final Artifact Score: 79/100**

## Section 31 — Weighted overall score

- Agent: 0.35 × 91 = 31.85
- Plugin: 0.40 × 68 = 27.20
- Artifact: 0.25 × 79 = 19.75
- Raw weighted score: **78.80/100**
- Applied cap: card pattern not functional → cap 88; raw score lower.
- Final adjusted score: **78.80/100** (`Pass with limitations`).

## Section 32 — Mandatory scoring-cap table

| Cap | Triggered | Evidence | Applied |
| --- | --- | --- | --- |
| Scope violation | No | All Run 03 | None |
| More than one Test 11 root | No | One Run 03 | None |
| More than one reference | No | One | None |
| More than one target | No | One exact target; helper renamed | None |
| Approved root not confirmed | No | Exact ID | None |
| Reference not verified before analysis | No | Verified first | None |
| No design analysis | No | Safe-equivalent matrix after analyzer defect | None |
| Template not saved | No | Saved | None |
| Template not retrieved | No | Exact once | None |
| Duplicate template | No | 0 | None |
| No preview | No | Previewed | None |
| Target manually styled | No | None | None |
| Reference cloned | No | Direct chemistry source | None |
| Major leakage | No | 0/11 | None |
| Reference formula copied | No | 0 | None |
| Purple generalized | No | 0 | None |
| Reference changed | No | 37/37 | None |
| Target section missing | No | 7/7 | None |
| Worked order wrong | No | Exact | None |
| Calculation wrong | No | Exact | None |
| Formula malformed | No | 9/9 | None |
| Card pattern not functional | Yes | Plain hierarchy only | Cap 88 |
| No target design verification | No | Verifier run; defects recorded | None |
| Plain text used to claim design success | No | Partial verdict | None |
| Blind retry | No | 0 | None |
| False success | No | Partial matches evidence | None |
| Report missing | No | This file | None |
| Prompt missing | No | Included | None |
| Operation log missing | No | Included | None |

## Section 33 — Chronological operation log

| # | Tool | Operation ID | Status |
| --- | --- | --- | --- |
| 1 | get_bridge_status | status-mri6m717 | PASS |
| 2 | get_plugin_status | 4d799b5a-dd91-477c-b612-64054798063d | PASS |
| 3 | get_focused_rem | 58e62878-1f69-4c3c-bc0f-0e94bf2aa9fb | PASS |
| 4 | get_current_selection | a7791297-b0de-4dd0-ad26-c5231c636949 | PASS |
| 5 | get_children | 699189b9-8c81-4f15-aac5-220354e89e23 | PASS |
| 6 | list templates | c96b4b03-be67-481c-92ec-5fc8e3fcb2cc | PASS |
| 7 | search collision | a0978b2a-2d32-4726-a7e0-463e9f7c3f30 | PASS |
| 8 | create root | 1543e8c8-75d6-4d53-8152-57400b787dd3 | PASS |
| 9 | create reference | ca7474b3-d5bd-4f8e-a1e0-da808ee0ee42 | PASS |
| 10 | style reference | f62d078f-79a2-4a19-a9a9-d5944bf116a6 | PARTIAL heading unsupported |
| 11 | reference tree | 90cb8339-3fef-4f53-9b64-3fff2f4f3d8b | PASS |
| 12 | reference verify | e38a1e45-62d9-438e-aec8-c59a346ac12f | Highlight metadata mismatch |
| 13 | normalize highlights | 8634e67a-38f0-4747-87fe-c476961b829b | PASS |
| 14 | analyze design | 95da7162-3aae-4bb4-a17f-de734cec344e | WRONG SOURCE |
| 15 | save template | 5dbebe9a-801e-4bc5-840f-6c804210901b | PASS |
| 16 | retrieve template | a9bbb2b0-32e8-4ad0-9538-4bf0c9f68564 | PASS |
| 17 | preview | fb0f808c-3131-419b-8c88-09ce4efb5887 | PASS |
| 18 | create target | 0772858a-c7b1-49ce-ad92-14801da7e10f | PASS with wrapper |
| 19 | rename wrapper | 93b7556c-5f82-4e9c-a6ed-531401957a65 | PASS |
| 20 | promote target | a3e5ce26-3bcc-43ea-87a9-fc02e3336af6 | PASS |
| 21 | verify design | 6b815282-036c-4e0b-bfbf-493ac7fbe5b0 | FAIL wrong defaults |
| 22 | target tree | b1e63c2a-6741-431c-8065-e00d07ff6255 | PASS |
| 23 | root children | 52d8fe7f-7ee2-41db-a692-b04de52f86cb | PASS |
| 24 | reference reread | 96098014-0554-47d7-9dcb-4d80f6de76db | PASS |

## Section 34 — Verdict and recommendation

- **Final verdict:** `PARTIAL`
- **Recommendation:** `REPAIR_DESIGNED_NOTE_CREATION`

The lifecycle completed and content/isolation/reference preservation were excellent. The limiting factor is incomplete visual/card rule instantiation, plus redundant-wrapper behavior and verifier defaults that conflict with the stored template.

## Section 35 — Artifact manifest

| Artifact | Type | Location | ID/path | Verified |
| --- | --- | --- | --- | --- |
| Test root | RemNote root | Plugin Test | l6pQxh3FR85GChnKD | Yes |
| Reference | Designed hierarchy | Test root | toZOr998mVMBvqjEs | Yes |
| Template | Template artifact | Plugin local storage | design-test-11-clean-science-lesson-design-2026-07-12-run-03 | Yes |
| Target | Designed hierarchy | Test root | DleGlFGldXczOYpEU | Yes |
| Helper container | Empty artifact | Test root | 73NaSLI3BlQysjPpj | Yes; pollution |
| Report | Markdown | Local workspace | /mnt/data/remnote-mcp-test-11-learn-reuse-design-report-2026-07-12-run-02.md | Yes |

No report inside RemNote; no old note modified; no deletion; no duplicate template intentionally created; no reference clone; no external source; no outside-scope change.

## Section 36 — Report-integrity declaration

> I confirm that this report includes the complete user-provided Test 11 prompt, distinguishes reusable design rules from academic content and content-specific exceptions, verifies the template save and retrieval lifecycle, distinguishes template-driven creation from manual restyling, compares the reference before and after template reuse, reports content leakage and unsupported capabilities honestly, does not expose authentication secrets, and accurately records every design, formula, card, duplicate, hierarchy, and scope result.

| Field | Value |
| --- | --- |
| Generated at | 2026-07-12T22:41:50+03:00 |
| Filename | remnote-mcp-test-11-learn-reuse-design-report-2026-07-12-run-02.md |
| Approved root | OjLcSppWfIH0cpPoh |
| Test root | l6pQxh3FR85GChnKD |
| Reference | toZOr998mVMBvqjEs |
| Target | DleGlFGldXczOYpEU |
| Template | design-test-11-clean-science-lesson-design-2026-07-12-run-03 |
| Lifecycle | TEMPLATE_SAVED_AND_RETRIEVED |
| Design transfer | PARTIAL_DESIGN_TRANSFER |
| Isolation | CONTENT_ISOLATED |
| Reference | REFERENCE_UNCHANGED |
| Rules | 6/13 |
| Target items | 39/39 |
| Formula checks | 9/9 |
| Functional cards | 0/2 |
| Reference Rems | 37/37 |
| Leakage | 0 |
| Purple | Not generalized |
| Rule rate | 46.15% |
| Content rate | 100% |
| Reference rate | 100% |
| Card rate | 0% |
| Leakage rate | 0% |
| Exception rate | 100% |
| Repairs | 3 |
| Unresolved | Style mapping, card types, helper container |
| Agent | 91 |
| Plugin | 68 |
| Artifact | 79 |
| Weighted | 78.80 |
| Verdict | PARTIAL |
| Recommendation | REPAIR_DESIGNED_NOTE_CREATION |
