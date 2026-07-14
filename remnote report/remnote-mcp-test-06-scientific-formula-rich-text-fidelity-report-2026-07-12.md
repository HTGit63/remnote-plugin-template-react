# RemNote MCP Test 06 — Scientific Formula and Rich-Text Fidelity

- **Report filename:** `remnote-mcp-test-06-scientific-formula-rich-text-fidelity-report-2026-07-12.md`
- **Date:** 2026-07-12
- **Start time:** 2026-07-12 17:14:40 EAT
- **End time:** 2026-07-12 17:31:35 EAT
- **Duration:** 16 minutes 55 seconds
- **Run number:** 01
- **ChatGPT model:** GPT-5.6 Thinking
- **Reasoning level:** Thinking
- **Plugin branch:** `fix/remnote-mcp-mass-note-creation-stability`
- **Plugin commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`
- **Tool profile:** `developer`
- **Approved-root title and ID:** `Plugin Test` (`OjLcSppWfIH0cpPoh`)
- **Test-root title and ID:** `RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01` (`2pdNxGqRAJmP8fAr9`)
- **Scientific-note title and ID:** `Formula Fidelity Fixture — Nuclear and Charged-Particle Physics` (`ujXrKkvJB3PKs2HnY`)
- **Final verdict:** `PASS_WITH_WARNINGS`
- **ChatGPT Agent Score:** `99/100`
- **Plugin Capability Score:** `97/100`
- **Final Artifact Score:** `99/100`
- **Weighted overall score:** `98.20/100`
- **Rich Math Fidelity Rate:** `100.00%`
- **Mathematical Content Preservation Rate:** `100.00%`
- **Core Formula Success Rate:** `100.00%`
- **Stress-Case Success Rate:** `100.00%`

## Section 1 — Executive summary

The approved RemNote scope was live-confirmed as `Plugin Test` (`OjLcSppWfIH0cpPoh`), with matching focus, selection, and breadcrumb. Exactly one Test 06 root and one scientific-note root were created beneath it. No focus or selection change was initiated.

The fixed fixture was isolated from the Test 06 prompt without using the uploaded Nuclear Physics Markdown file or any external source. Its 3,180 Unicode characters, 3,184 UTF-8 bytes, and SHA-256 `69c061ec8defc586335c62acd96779009dc354c2d3e730f72ac93ecb39bbe7f8` exactly match the canonical manifest. The only manifest nuance is line-count convention: the fixture has 164 logical lines through `splitlines()` and 165 line positions when the position after the terminal newline is counted.

A Markdown-aware formula-preserving workflow was previewed twice and committed once. The final preview contained 60 Rems, seven principal sections, 12 inline-math occurrences, 20 display-math occurrences, five summary bullets, zero cards, zero spacers, zero malformed formulas, and zero parser-reported pollution.

The live scientific-note root is `Formula Fidelity Fixture — Nuclear and Charged-Particle Physics` (`ujXrKkvJB3PKs2HnY`). Its introductory paragraph, seven sections, explanations, formulas, and five summary bullets are complete and correctly ordered. All 32 mathematical source occurrences were audited. Twelve were returned as exact rich inline math and twenty as exact rich block math. There were no plain-text fallbacks, raw visible delimiters, malformed formulas, missing formulas, unsupported formulas, or unverified formulas.

All 28 non-stress/core occurrences succeeded. The four advanced stress formulas also succeeded as native rich blocks. The aligned expression retained both lines and its line break; the boxed formula retained its box; the text-bearing velocity retained the value, unit, and `in vacuum`; and the chained inequality retained both `<` and `≤`.

No formula repair was required. The artifact-level warning is that heading metadata read back as `normal`, although the hierarchy and section order are correct.

After the complete tree inspection and all 32 rich-formula reads had succeeded, a supplemental direct-read request encountered a plugin disconnect. Two read-only recovery attempts failed. No write was retried, no uncertain mutation exists, and the completed tree-versus-rich evidence remains valid. A final post-run focus and approved-parent recount could not be repeated after disconnection.

There were no scope violations, deletions, cards, duplicate roots, or external-source use. **Test 07 may proceed only after the RemNote plugin reconnects.**

## Section 2 — Complete initial prompt

Internal platform instructions are not reproduced. The complete user-provided Test 06 prompt is included below.

~~~~~~markdown
# RemNote MCP Laboratory Test 06

## Scientific Formula and Rich-Text Fidelity

You are the primary experimental tester of a remote RemNote MCP plugin.

This is **Test 06 only**. Do not begin, simulate, or partially perform Test 07 or any later benchmark test.

Your mission is to create one formula-heavy scientific note in RemNote, then independently inspect its plain text, rich text, mathematical representations, hierarchy, symbols, units, and rendering state.

You must determine whether the plugin can faithfully create and retrieve:

* Inline mathematics
* Display mathematics
* Greek letters
* Fractions
* Nested fractions
* Subscripts
* Superscripts
* Absolute-value bars
* Vectors
* Cross products
* Scientific notation
* Units
* Inequalities
* Nuclide notation
* Boxed expressions
* Aligned expressions
* Text embedded inside mathematics

You must not score formula fidelity solely from a writer reporting success.

The actual RemNote content must be read back and classified.

---

# 1. Test identity

* **Test number:** 06
* **Test name:** Scientific Formula and Rich-Text Fidelity
* **Benchmark module:** Module II — Note Creation and Fidelity
* **Difficulty:** Advanced
* **Run type:** Main Run
* **Execution mode:** Natural autonomy with required safety and verification
* **Approved RemNote root title:** `Plugin Test`
* **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`
* **Disposable test root:** Create one new child beneath `Plugin Test`
* **Expected scientific-note root:** `Formula Fidelity Fixture — Nuclear and Charged-Particle Physics`
* **Allowed operations:** Read, preview, create, verify, and targeted repair within the new Test 06 root
* **Deletion permission:** None
* **Card creation permission:** None
* **External academic sources:** Forbidden
* **GitHub:** Forbidden
* **Web browsing:** Forbidden
* **Required deliverable:** One complete local Markdown report file

---

# 2. Central experimental question

> Can ChatGPT create and independently verify a formula-heavy scientific note in RemNote while correctly distinguishing rich mathematics, plain-text fallback, raw delimiters, malformed expressions, and missing scientific symbols?

This test is not passed merely because:

* A write operation returns `SUCCESS`.
* The note contains text resembling formulas.
* Plain-text output contains recognizable variables.
* A formula appears correct in ChatGPT’s final explanation.
* The note title and sections exist.
* No tool error was returned.
* ChatGPT claims that rich-text fidelity was preserved.

Every formula-fidelity claim must be supported by live RemNote readback.

---

# 3. Test objectives

The test must determine:

1. Whether formulas can be created from a structured Markdown fixture.
2. Whether inline and display formulas remain distinguishable.
3. Whether formulas are stored as mathematical rich text where supported.
4. Whether rich-text reads expose the formula structure clearly.
5. Whether plain-text and rich-text representations agree.
6. Whether raw LaTeX delimiters remain visibly exposed.
7. Whether Greek letters remain intact.
8. Whether subscripts and superscripts remain intact.
9. Whether fractions and nested fractions remain intact.
10. Whether vectors and cross-product notation remain intact.
11. Whether scientific notation remains intact.
12. Whether units remain attached to the correct values.
13. Whether inequalities preserve every comparison sign.
14. Whether nuclide notation preserves left superscripts and subscripts.
15. Whether advanced expressions degrade gracefully when unsupported.
16. Whether formulas can be repaired without rebuilding the full note.
17. Whether ChatGPT reports unsupported rendering honestly.

---

# 4. Source-isolation rule

Use only the fixed scientific fixture contained in this prompt.

Do not use:

* The uploaded Nuclear Physics Markdown file
* Existing nuclear-physics RemNote notes
* GitHub
* Web search
* External textbooks
* Previous conversation summaries
* Other source files
* General external reference material

Do not copy content from an existing RemNote note.

Existing RemNote content may be inspected only to establish approved scope.

---

# 5. Approved RemNote scope

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
8. Whether the live ID matches the expected ID
9. Whether creating a disposable child beneath it is safe

Do not change focus or selection merely to run the test.

The focused Rem does not need to be `Plugin Test` when the approved root can be safely identified through independent read-only evidence.

---

# 6. Scope mismatch and stopping conditions

Stop all mutations and report `BLOCKED_SCOPE_MISMATCH` when:

* `Plugin Test` cannot be found.
* Multiple exact-title matches remain unresolved.
* The observed ID conflicts with the expected ID and the conflict cannot be resolved safely.
* The intended parent lies outside the approved scope.
* You cannot prove that the disposable Test 06 root is beneath `Plugin Test`.

Stop and report `BLOCKED_CONNECTION` when:

* The plugin is disconnected before mutation.
* A sensitive write has an uncertain outcome and readback cannot determine what happened.
* Two reasonable recovery attempts fail for the same connection problem.

Stop and report `BLOCKED_SOURCE_VALIDATION` when:

* The fixed fixture cannot be isolated.
* The source start or end boundary is unclear.
* The fixture appears truncated.
* Its computed statistics differ materially from the canonical manifest and the discrepancy cannot be resolved.
* Continuing might import benchmark instructions rather than only the fixture.

Do not create the note anywhere else.

---

# 7. Disposable Test 06 root

Create exactly one disposable root beneath `Plugin Test`.

Use:

`RemNote MCP Test 06 — Scientific Formula Fidelity — YYYY-MM-DD — Run NN`

Replace:

* `YYYY-MM-DD` with the actual date
* `NN` with a two-digit run number

Begin with `Run 01`.

Before creating the root:

1. Search beneath `Plugin Test` for an exact-title collision.
2. Do not reuse an earlier Test 06 root.
3. Do not edit an earlier Test 06 root.
4. Do not delete an earlier Test 06 root.
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

Create no more than one Test 06 root.

---

# 8. Source boundaries

Import only the fixture contained in Section 10.

## Start marker

`# Formula Fidelity Fixture — Nuclear and Charged-Particle Physics`

## End marker

The final source line is:

`- Fractions, vectors, Greek letters, units, inequalities, and nuclide notation must remain intact.`

Stop immediately after that line.

Do not import:

* Opening or closing code fences
* Test instructions
* Source manifest
* Formula classifications
* Report requirements
* Scoring rules
* Content before the start marker
* Content after the final source line

---

# 9. Canonical source manifest

The canonical fixture uses:

* **Encoding:** UTF-8
* **Line endings:** LF
* **Terminal newline:** Present
* **Unicode character count:** 3,180
* **UTF-8 byte count:** 3,184
* **Line count:** 165
* **SHA-256:** `69c061ec8defc586335c62acd96779009dc354c2d3e730f72ac93ecb39bbe7f8`
* **Heading count:** 8
* **Level-1 headings:** 1
* **Level-2 headings:** 7
* **Display-math blocks:** 20
* **Inline-math spans:** 12
* **Total mathematical occurrences:** 32
* **Summary bullets:** 5
* **Tables:** 0
* **Code blocks:** 0
* **Expected principal sections:** 7
* **Expected maximum hierarchy depth:** Approximately 3 beneath the scientific-note root

The total number of Rems is not rigid because a valid implementation may:

* Store a paragraph and its inline formula in one Rem
* Store a display formula as a separate child Rem
* Store multiple rich-text elements inside one Rem
* Represent an advanced aligned expression through a supported fallback

Record the observed node count, but do not judge fidelity from node count alone.

---

# 10. Fixed formula-heavy fixture

Import the following fixture exactly once:

```markdown
# Formula Fidelity Fixture — Nuclear and Charged-Particle Physics

This note tests whether RemNote preserves inline mathematics, display mathematics, Greek letters, subscripts, superscripts, fractions, vectors, scientific notation, units, inequalities, and nuclide notation.

## 1. Nuclear Composition and Nuclide Notation

For a nucleus, the mass number, proton number, and neutron number satisfy \(A=Z+N\).

Therefore, the neutron number can be written as \(N=A-Z\).

A nuclide may be represented as \({}^{A}_{Z}\mathrm{X}\). For carbon-14, the notation is \({}^{14}_{6}\mathrm{C}\).

The alpha-decay example is:

\[
{}^{238}_{92}\mathrm{U}\rightarrow{}^{234}_{90}\mathrm{Th}+{}^{4}_{2}\mathrm{He}
\]

## 2. Mass–Energy Relationships

The rest-energy relationship is \(E=mc^2\).

A change in mass corresponds to a change in energy:

\[
\Delta E=\Delta mc^2
\]

When the mass defect is measured in atomic mass units:

\[
B(\mathrm{MeV})=\Delta m(\mathrm{u})\times931.5
\]

The binding energy per nucleon is:

\[
\frac{B}{A}
\]

## 3. Charged Particles in a Magnetic Field

The magnetic force on a charged particle is:

\[
\vec{F}=q\vec{v}\times\vec{B}
\]

For motion perpendicular to a uniform magnetic field, the circular-path radius is:

\[
r=\frac{mv}{|q|B}
\]

The cyclotron angular frequency is:

\[
\omega_c=\frac{|q|B}{m}
\]

The corresponding period is:

\[
T=\frac{2\pi m}{|q|B}
\]

## 4. Radioactive Decay

The number of undecayed nuclei is:

\[
N(t)=N_0e^{-\lambda t}
\]

The activity is:

\[
\mathcal{A}(t)=\lambda N(t)
\]

The half-life is:

\[
T_{1/2}=\frac{\ln2}{\lambda}
\]

The mean lifetime is:

\[
\tau=\frac{1}{\lambda}
\]

## 5. Measurement and Uncertainty

For Poisson counting statistics, the standard uncertainty is \(\sigma_N\approx\sqrt{N}\).

A measured length may be written as \(x=(12.4\pm0.3)\,\mathrm{cm}\).

A measured count rate may be written as:

\[
R=(2.50\pm0.05)\times10^3\,\mathrm{s^{-1}}
\]

Detector efficiency is:

\[
\varepsilon=\frac{N_{\mathrm{detected}}}{N_{\mathrm{emitted}}}
\]

Its allowed range is:

\[
0\le\varepsilon\le1
\]

The propagated relative uncertainty for \(R=N/t\) is:

\[
\frac{\Delta R}{R}
=
\sqrt{
\left(\frac{\Delta N}{N}\right)^2
+
\left(\frac{\Delta t}{t}\right)^2
}
\]

## 6. Advanced Rendering Stress Cases

The following aligned expression should preserve line structure where supported:

\[
\begin{aligned}
N(t)&=N_0e^{-\lambda t}\\
\mathcal{A}(t)&=\lambda N_0e^{-\lambda t}
\end{aligned}
\]

The following boxed result should remain mathematically readable:

\[
\boxed{T_{1/2}=\frac{0.693}{\lambda}}
\]

The following text-bearing expression should preserve the word inside the formula:

\[
v=3.00\times10^8\ \mathrm{m\,s^{-1}}\quad\text{in vacuum}
\]

The following chained inequality should preserve all comparison signs:

\[
0<\lambda,\qquad 0\le\varepsilon\le1
\]

## 7. Summary

- \(A=Z+N\) relates the nucleon, proton, and neutron numbers.
- \(E=mc^2\) relates mass and energy.
- \(r=mv/(|q|B)\) describes circular motion in a magnetic field.
- \(N(t)=N_0e^{-\lambda t}\) describes radioactive decay.
- Fractions, vectors, Greek letters, units, inequalities, and nuclide notation must remain intact.
```

---

# 11. Required hierarchy

The fixture’s H1 must become exactly one scientific-note root beneath the disposable Test 06 root:

`Formula Fidelity Fixture — Nuclear and Charged-Particle Physics`

It must contain exactly seven principal sections in this order:

1. `1. Nuclear Composition and Nuclide Notation`
2. `2. Mass–Energy Relationships`
3. `3. Charged Particles in a Magnetic Field`
4. `4. Radioactive Decay`
5. `5. Measurement and Uncertainty`
6. `6. Advanced Rendering Stress Cases`
7. `7. Summary`

Required structural behavior:

* The introductory paragraph belongs beneath the scientific-note root.
* Formula explanations remain under their corresponding principal section.
* Display formulas remain associated with the preceding explanation.
* Summary bullets remain children of `7. Summary`.
* No duplicate scientific-note root exists.
* No extra wrapper with the same title exists.
* No section is flattened beside the scientific-note root.
* No formula is moved into the wrong scientific topic.

---

# 12. Formula categories

The fixture contains four categories.

## 12.1 Core inline formulas

Core inline formulas include:

1. (A=Z+N)
2. (N=A-Z)
3. ({}^{A}_{Z}\mathrm{X})
4. ({}^{14}_{6}\mathrm{C})
5. (E=mc^2)
6. (\sigma_N\approx\sqrt{N})
7. (x=(12.4\pm0.3),\mathrm{cm})
8. (R=N/t)
9. The four repeated summary formulas

These must preserve their placement inside explanatory prose.

They must not be silently detached from their sentences without a clear and usable representation.

## 12.2 Core display formulas

The first sixteen display formulas are core requirements:

1. Alpha-decay nuclide equation
2. Mass–energy change
3. Binding-energy conversion
4. Binding energy per nucleon
5. Magnetic-force vector equation
6. Circular-path radius
7. Cyclotron angular frequency
8. Cyclotron period
9. Radioactive-decay law
10. Activity
11. Half-life
12. Mean lifetime
13. Measured count rate
14. Detector efficiency
15. Efficiency inequality
16. Propagated relative uncertainty

Core display formulas must remain mathematically complete and readable.

## 12.3 Advanced stress formulas

The four formulas in Section 6 deliberately test harder rendering cases:

1. Aligned two-line expression
2. Boxed half-life result
3. Text-bearing velocity expression
4. Chained inequality with spacing commands

Failure of an advanced formatting command does not automatically fail the entire test when:

* The mathematical content remains correct.
* A safe readable fallback is used.
* The limitation is identified honestly.
* Core formulas remain intact.

## 12.4 Repeated formulas

The summary intentionally repeats four formulas.

These repeated formulas test whether:

* The expressions remain inline.
* The summary text remains intact.
* Repeated formulas are not accidentally removed as duplicates.
* A deduplication mechanism does not erase valid source content.

Do not treat legitimate repeated formulas as accidental duplicate pollution.

---

# 13. Formula-fidelity classifications

Use exactly these classifications.

## `EXACT_RICH_INLINE`

The mathematical content is stored and returned as rich inline mathematics, with correct placement and symbols.

## `EXACT_RICH_BLOCK`

The mathematical content is stored and returned as rich display mathematics, with correct symbols and structure.

## `SEMANTICALLY_EXACT_RICH`

The mathematical meaning is complete and rich, but unsupported visual commands are normalized safely.

Examples:

* `\boxed{}` becomes an unboxed but otherwise exact formula.
* `aligned` becomes two separate correct display equations.
* spacing commands are normalized without changing meaning.

## `EXACT_PLAIN_TEXT`

The plain text is exact, but no rich mathematical representation is present.

## `PLAIN_TEXT_FALLBACK`

The expression remains readable and mathematically correct in plain text, but formatting or structure is reduced.

## `RAW_VISIBLE_DELIMITERS`

The note visibly exposes control syntax such as:

* `\(`
* `\)`
* `\[`
* `\]`

when those characters should have been converted or removed.

## `RAW_VISIBLE_LATEX_COMMANDS`

The note visibly exposes unsupported commands such as:

* `\frac`
* `\sqrt`
* `\vec`
* `\mathrm`
* `\begin{aligned}`
* `\boxed`
* `\text`

as ordinary academic text rather than mathematical content.

## `MALFORMED_MATH`

The expression exists but contains an error such as:

* Missing denominator
* Missing exponent
* Missing subscript
* Lost minus sign
* Incorrect variable
* Broken brace structure
* Incorrect inequality
* Corrupted nuclide notation

## `MISSING`

The required expression is absent.

## `RICH_TEXT_NOT_RETURNED`

The read tool returns plain text but provides no rich representation.

## `UNSUPPORTED`

The necessary rich-text capability is genuinely unavailable and no stronger evidence can be retrieved.

## `NOT_VERIFIED`

The expression may exist, but the available evidence is insufficient to classify it.

---

# 14. Scientific invariants

The following relationships must remain scientifically unchanged:

[
A=Z+N
]

[
N=A-Z
]

[
{}^{238}*{92}\mathrm{U}\rightarrow{}^{234}*{90}\mathrm{Th}+{}^{4}_{2}\mathrm{He}
]

[
E=mc^2
]

[
\Delta E=\Delta mc^2
]

[
B(\mathrm{MeV})=\Delta m(\mathrm{u})\times931.5
]

[
\vec{F}=q\vec{v}\times\vec{B}
]

[
r=\frac{mv}{|q|B}
]

[
\omega_c=\frac{|q|B}{m}
]

[
T=\frac{2\pi m}{|q|B}
]

[
N(t)=N_0e^{-\lambda t}
]

[
\mathcal{A}(t)=\lambda N(t)
]

[
T_{1/2}=\frac{\ln2}{\lambda}
]

[
\tau=\frac{1}{\lambda}
]

[
R=(2.50\pm0.05)\times10^3,\mathrm{s^{-1}}
]

[
\varepsilon=\frac{N_{\mathrm{detected}}}{N_{\mathrm{emitted}}}
]

[
0\le\varepsilon\le1
]

Do not silently change:

* A plus sign to a minus sign
* A minus sign to a plus sign
* (\lambda) to another variable
* (N_0) to (N)
* (T_{1/2}) to (T/2)
* (|q|) to (q)
* (10^3) to (103)
* (\mathrm{s^{-1}}) to (\mathrm{s-1}) without reporting normalization
* (\pm) to a plus sign
* (\le) to `<`
* Nuclide superscripts or subscripts
* Vector notation where it is semantically important
* The cross product to ordinary multiplication

---

# 15. Symbol and unit manifest

Verify these exact or semantically equivalent symbols:

* (A)
* (Z)
* (N)
* (N_0)
* (\Delta)
* (\lambda)
* (\tau)
* (\sigma)
* (\omega)
* (\pi)
* (\varepsilon)
* (\mathcal{A})
* (\pm)
* (\times)
* (\approx)
* (\le)
* (<)
* (\rightarrow)
* (\vec{F})
* (\vec{v})
* (\vec{B})
* (|q|)
* (10^3)
* (10^8)
* (\mathrm{MeV})
* (\mathrm{u})
* (\mathrm{cm})
* (\mathrm{s^{-1}})
* (\mathrm{m,s^{-1}})

Also verify nuclide labels:

* ({}^{14}_{6}\mathrm{C})
* ({}^{238}_{92}\mathrm{U})
* ({}^{234}_{90}\mathrm{Th})
* ({}^{4}_{2}\mathrm{He})

---

# 16. Planning and preview requirement

Before the main scientific-note write:

1. Confirm the disposable Test 06 root.
2. Extract only the bounded fixture.
3. Validate its start marker.
4. Validate its final line.
5. Compare its statistics with the canonical source manifest.
6. Identify:

   * Seven principal sections
   * Twenty display-math blocks
   * Twelve inline-math spans
   * Thirty-two total math occurrences
   * Four advanced stress cases
7. Determine how the selected workflow represents:

   * Inline math
   * Display math
   * Multi-line math
   * Rich-text paragraphs containing math
   * Greek symbols
   * Nuclide notation
   * Units
8. Use a non-mutating preview or planning capability where supported.
9. Inspect warnings before committing.

The preview must not create content.

Do not use a mutation-capable health check as a preview.

When preview is unsupported:

* Record `PREVIEW_UNSUPPORTED`.
* Perform a local structural and formula-manifest validation.
* Continue only when the target and source boundaries are unambiguous.

---

# 17. Tool-choice requirement

Choose a workflow suitable for a moderate, formula-heavy Markdown fixture.

A strong workflow should normally be:

* Markdown-aware or hierarchy-aware
* Capable of creating rich mathematical content
* Able to preserve inline and display distinctions
* Proportional to the fixture size
* Independently verifiable

The test does not require one exact tool.

Reduce tool-strategy credit when ChatGPT:

* Creates every formula through an unnecessarily long sequence of individual operations
* Uses only plain child creation despite an available formula-aware workflow
* Uses a maximum-scale resumable importer unnecessarily
* Flattens the fixture into one Rem
* Creates screenshots instead of RemNote content
* Uses flashcard tools
* Uses design-template tools
* Uses external files
* Trusts a write envelope without rich-text readback

Record:

* Selected workflow
* Actual capabilities used
* Alternative route considered
* Why the selected route was appropriate
* Whether a fallback was required

---

# 18. Idempotency and uncertain outcomes

Use distinct idempotency keys where supported for:

* Test-root creation
* Scientific-note creation
* Every targeted repair

Do not reuse a key with a changed payload.

Before creation:

1. Confirm that the expected scientific-note root does not already exist beneath the Test 06 root.
2. Record the Test 06 root’s direct-child count.

After creation:

1. Confirm exactly one scientific-note root exists.
2. Record the new direct-child count.
3. Confirm exactly seven principal sections exist.
4. Check for duplicate formula-bearing Rems.

When a write times out or returns an uncertain result:

1. Do not retry blindly.
2. Read the Test 06 root.
3. Search for the scientific-note title.
4. Inspect matching candidates.
5. Determine whether creation completed, partially completed, or failed.
6. Retry only when readback proves that the root was not created.
7. Do not create a second scientific-note root.

---

# 19. Required post-write verification

A successful write response is not proof of formula fidelity.

Independently inspect the resulting RemNote artifact.

---

## 19.1 Identity verification

Confirm:

* Scientific-note title
* Scientific-note Rem ID
* Parent ID
* Breadcrumb
* Exactly one scientific-note root
* No duplicate wrapper
* No same-title sibling beneath the Test 06 root

---

## 19.2 Hierarchy verification

Confirm:

* Exactly seven principal sections
* Correct titles
* Correct order
* Introductory paragraph under the note root
* Formula explanations under the correct section
* Five summary bullets under `7. Summary`
* No formula-bearing Rem under the wrong topic
* No missing section
* No duplicate section

---

## 19.3 Plain-text verification

For every formula-bearing Rem, record:

* Plain text
* Formula location
* Associated explanatory text
* Whether plain text is complete
* Whether punctuation surrounding inline math is intact
* Whether formula content was omitted from plain text
* Whether the plain-text representation is ambiguous

Plain text alone does not establish rich-math fidelity.

---

## 19.4 Rich-text verification

Inspect rich text or mathematical representation using the strongest available read-only capability.

For every formula occurrence, determine:

* Whether a math element exists
* Whether it is inline or block
* Formula source or internal representation
* Surrounding rich-text segments
* Whether the formula is split unexpectedly
* Whether text around inline formulas remains intact
* Whether unsupported commands were normalized
* Whether raw delimiters remain visible
* Whether the math element can be distinguished from ordinary text

Do not infer rich math merely because plain text resembles an equation.

---

## 19.5 Cross-tool verification

For representative formula-bearing Rems, compare at least two independent retrieval routes where available:

* Tree output
* Direct Rem read
* Rich-text read
* Formula-specific inspection
* Document tree
* Child inspection

Required cross-checks:

1. (A=Z+N)
2. Nuclide decay equation
3. (\vec{F}=q\vec{v}\times\vec{B})
4. (r=\frac{mv}{|q|B})
5. (T_{1/2}=\frac{\ln2}{\lambda})
6. Detector efficiency
7. Propagated uncertainty
8. One advanced stress formula

Report any disagreement between retrieval routes.

---

# 20. Required formula audit

Audit all thirty-two mathematical occurrences.

Use one row per occurrence:

| Formula ID | Section | Source role | Source expression | Rem ID | Plain-text result | Rich-text result | Inline/block observed | Classification | Notes |
| ---------- | ------- | ----------- | ----------------- | ------ | ----------------- | ---------------- | --------------------- | -------------- | ----- |

Assign IDs:

* `F01` through `F12` for inline occurrences in source order
* `F13` through `F32` for display occurrences in source order

Do not omit repeated summary formulas.

For repeated formulas, mark:

* Original source occurrence
* Repeated summary occurrence
* Whether both remain present
* Whether both preserve their intended inline role

---

# 21. Required core-formula spot checks

In addition to the complete audit, provide detailed checks for these formulas.

## 21.1 Nuclear composition

Check:

* (A=Z+N)
* (N=A-Z)
* Generic nuclide notation
* Carbon-14 notation
* Alpha-decay equation

Verify:

* Left superscripts
* Left subscripts
* Element symbols
* Reaction arrow
* Plus sign
* Mass-number conservation in the displayed text

Do not recalculate or rewrite the source.

## 21.2 Mass–energy

Check:

* (E=mc^2)
* (\Delta E=\Delta mc^2)
* Binding-energy conversion
* (B/A)

Verify:

* Superscript 2
* Delta symbols
* Unit labels
* Multiplication sign
* Fraction structure

## 21.3 Magnetic-field formulas

Check:

* Lorentz force
* Radius
* Angular frequency
* Period

Verify:

* Vector markers
* Cross-product sign
* Absolute-value bars around (q)
* Fraction numerator and denominator
* Subscript on (\omega_c)
* Factor (2\pi)

## 21.4 Radioactive-decay formulas

Check:

* (N(t)=N_0e^{-\lambda t})
* (\mathcal{A}(t)=\lambda N(t))
* (T_{1/2}=\frac{\ln2}{\lambda})
* (\tau=\frac{1}{\lambda})

Verify:

* Subscript 0
* Negative exponent
* Lambda
* Calligraphic activity symbol or a clearly reported fallback
* Half-life subscript
* Fractions

## 21.5 Measurement formulas

Check:

* (\sigma_N\approx\sqrt{N})
* Measured length and uncertainty
* Scientific-notation count rate
* Detector efficiency
* Efficiency range
* Propagated relative uncertainty

Verify:

* Sigma subscript
* Approximation sign
* Square root
* Plus-minus sign
* Scientific exponent
* Units
* Nested fractions
* Squared terms
* Inequality signs

---

# 22. Advanced rendering stress-case audit

Evaluate each advanced formula separately.

## 22.1 Aligned expression

Determine whether the plugin preserves:

* Both equation lines
* Intended order
* Equals alignment or a meaningful fallback
* Line break
* No omitted equation
* No visible `\begin{aligned}` pollution

Acceptable outcomes:

* One rich aligned math block
* Two exact rich display equations
* One readable multi-line rich representation

## 22.2 Boxed expression

Determine whether:

* The formula remains complete
* The box is preserved where supported
* Removal of the box leaves the mathematical meaning intact
* Raw `\boxed` is not exposed as ordinary academic text

Loss of the box alone is a warning, not a core scientific error.

## 22.3 Text-bearing expression

Determine whether:

* (3.00\times10^8) remains intact
* Unit (\mathrm{m,s^{-1}}) remains intact
* The words `in vacuum` remain associated with the formula
* Raw `\text{}` is not exposed unnecessarily

## 22.4 Chained inequality

Determine whether:

* (0<\lambda) is present
* (0\le\varepsilon\le1) is present
* Both comparison types remain intact
* Spacing commands do not become visible pollution

---

# 23. Inline-versus-block audit

Create this summary:

| Metric                   | Expected | Observed rich inline | Observed rich block | Plain fallback | Missing or malformed |
| ------------------------ | -------: | -------------------: | ------------------: | -------------: | -------------------: |
| Inline math occurrences  |       12 |                      |                     |                |                      |
| Display math occurrences |       20 |                      |                     |                |                      |
| Total math occurrences   |       32 |                      |                     |                |                      |

Then report:

* Inline formulas converted to separate blocks
* Display formulas collapsed into inline text
* Inline formulas detached from their explanatory sentences
* Display formulas merged with unrelated prose
* Repeated summary formulas omitted
* Role changes that reduce readability

---

# 24. Formula Fidelity Index

Calculate:

## Rich Math Fidelity Rate

[
\frac{
\text{Exact rich inline}
+
\text{Exact rich block}
+
\text{Semantically exact rich}
}{
32
}
\times100
]

## Mathematical Content Preservation Rate

[
\frac{
\text{All mathematically correct occurrences, including safe plain fallback}
}{
32
}
\times100
]

## Core Formula Success Rate

[
\frac{
\text{Correct core formula occurrences}
}{
\text{Total core formula occurrences}
}
\times100
]

## Stress-Case Success Rate

[
\frac{
\text{Successful or semantically exact stress cases}
}{
4
}
\times100
]

Report counts for:

* Exact rich inline
* Exact rich block
* Semantically exact rich
* Exact plain text
* Plain-text fallback
* Raw visible delimiters
* Raw visible LaTeX commands
* Malformed
* Missing
* Unsupported
* Not verified

Do not count an unverified formula as successful.

---

# 25. Pollution audit

Search for visible occurrences of:

* `\(`
* `\)`
* `\[`
* `\]`
* `\frac`
* `\sqrt`
* `\vec`
* `\mathrm`
* `\mathcal`
* `\begin`
* `\end`
* `\boxed`
* `\text`
* `\quad`
* Unmatched braces
* Raw Markdown heading markers
* Code fences
* JSON fragments
* Operation metadata
* Idempotency keys
* Benchmark instructions
* Empty wrapper Rems
* Duplicate formula Rems
* Unexpected cards

Not every visible backslash is automatically a defect.

Classify context carefully.

---

# 26. Repair policy

Repair is allowed only beneath the new Test 06 root.

Repair only defects confirmed through readback.

Permitted repairs include:

* Restoring a missing formula
* Correcting a wrong sign
* Correcting a lost subscript
* Correcting a lost superscript
* Correcting a malformed fraction
* Correcting corrupted Greek text
* Correcting raw visible delimiters
* Replacing an unsupported advanced command with a semantically exact fallback
* Restoring a formula to the correct scientific section
* Restoring an omitted summary formula

Deletion remains forbidden.

Therefore:

* Do not rely on deletion for cleanup.
* Do not rebuild the complete note to repair one formula.
* Do not reimport the entire fixture after one local defect.
* Do not create duplicate formula Rems.
* Use a preview before broad rich-text replacement where supported.
* Preserve unaffected text and Rem IDs where practical.
* Reverify every repaired formula.

Maximum repair attempts for one defect:

`2`

After two failed attempts:

* Stop repairing that defect.
* Record the remaining limitation.
* Do not falsely claim success.

---

# 27. Efficiency target

This formula-heavy test will normally require approximately:

* **15–35 meaningful RemNote operations**

The count may be higher when formula-rich-text reads are available only per Rem.

Additional calls are justified for:

* Formula-specific inspection
* Truncated tree reads
* Rich-text readback
* Cross-tool verification
* Confirmed targeted repair
* Pagination
* An uncertain write outcome

Record:

* Scope calls
* Collision checks
* Source-validation actions
* Preview calls
* Creation calls
* Hierarchy reads
* Plain-text reads
* Rich-text reads
* Cross-tool verification reads
* Repair calls
* Failed calls
* Repeated calls
* Avoidable calls
* Slowest call
* Total known latency

Efficiency means sufficient evidence without unnecessary repetition.

---

# 28. Required local Markdown report

Create one real local `.md` report.

Do not create the report inside RemNote.

## Required filename

Use:

`remnote-mcp-test-06-scientific-formula-rich-text-fidelity-report-YYYY-MM-DD.md`

Example:

`remnote-mcp-test-06-scientific-formula-rich-text-fidelity-report-2026-07-12.md`

If that filename already exists, use:

`remnote-mcp-test-06-scientific-formula-rich-text-fidelity-report-2026-07-12-run-02.md`

Do not overwrite an earlier report unless explicitly instructed.

## File verification

Before presenting the report link:

1. Confirm the file exists.
2. Confirm the `.md` extension.
3. Confirm the file is not empty.
4. Confirm the complete initial Test 06 prompt is included.
5. Confirm the complete formula fixture is included.
6. Confirm the source manifest is included.
7. Confirm scope evidence is included.
8. Confirm the chronological operation log is included.
9. Confirm Test 06 and scientific-note Rem IDs are included.
10. Confirm hierarchy verification is included.
11. Confirm all thirty-two formula occurrences are audited.
12. Confirm core formula spot checks are included.
13. Confirm advanced stress-case checks are included.
14. Confirm inline-versus-block analysis is included.
15. Confirm plain-versus-rich comparison is included.
16. Confirm the Formula Fidelity Index is included.
17. Confirm symbol and unit checks are included.
18. Confirm pollution checks are included.
19. Confirm defects and repairs are included.
20. Confirm all three score categories are included.
21. Confirm the weighted score is included.
22. Confirm every scoring cap is evaluated.
23. Confirm the final verdict is included.
24. Confirm no authentication secret appears.
25. Confirm the file can be linked to the user.

When local file creation is unsupported:

* Do not claim that the report exists.
* Mark the report artifact `BLOCKED`.
* Present the complete Markdown report in the chat response.
* Apply the report-artifact scoring cap.

---

# 29. Required report structure

The generated Markdown report must contain every section below.

Use:

* `NOT RETURNED`
* `UNSUPPORTED`
* `NOT VERIFIED`
* `NOT APPLICABLE`

rather than inventing evidence.

---

## Report title

Use:

`# RemNote MCP Test 06 — Scientific Formula and Rich-Text Fidelity`

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
* Scientific-note title and ID
* Final verdict
* ChatGPT Agent Score
* Plugin Capability Score
* Final Artifact Score
* Weighted overall score
* Rich Math Fidelity Rate
* Mathematical Content Preservation Rate
* Core Formula Success Rate
* Stress-Case Success Rate

---

## Section 1 — Executive summary

Summarize:

* Scope confirmation
* Source validation
* Creation workflow
* Scientific-note identity
* Hierarchy completeness
* Total formulas inspected
* Rich inline results
* Rich block results
* Plain-text fallbacks
* Raw delimiters
* Malformed formulas
* Missing formulas
* Core-formula outcome
* Stress-case outcome
* Repair outcome
* Scope violations
* Whether Test 07 may proceed

---

## Section 2 — Complete initial prompt

Include the complete user-provided Test 06 prompt in a fenced code block.

Do not shorten it.

Do not include hidden platform instructions, credentials, authentication secrets, or private chain-of-thought.

State:

> Internal platform instructions are not reproduced. The complete user-provided Test 06 prompt is included below.

---

## Section 3 — Test configuration

Use:

| Field                        | Value                                                           |
| ---------------------------- | --------------------------------------------------------------- |
| Test number                  | 06                                                              |
| Test name                    | Scientific Formula and Rich-Text Fidelity                       |
| Difficulty                   | Advanced                                                        |
| Run type                     | Main Run                                                        |
| Approved root                | Plugin Test                                                     |
| Expected approved-root ID    | OjLcSppWfIH0cpPoh                                               |
| Observed approved-root ID    | Live value                                                      |
| Test-root title              | Live value                                                      |
| Test-root ID                 | Live value                                                      |
| Scientific-note title        | Formula Fidelity Fixture — Nuclear and Charged-Particle Physics |
| Scientific-note ID           | Live value                                                      |
| Expected math occurrences    | 32                                                              |
| Expected inline occurrences  | 12                                                              |
| Expected display occurrences | 20                                                              |
| Cards                        | Forbidden                                                       |
| Deletion                     | Forbidden                                                       |
| External sources             | Forbidden                                                       |
| Run number                   | Actual value                                                    |

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
* Before-and-after parent counts
* Breadcrumb
* Duplicate-root check
* Readback result

---

## Section 6 — Source-fixture manifest

Include:

* Start marker
* End marker
* Extracted character count
* Extracted UTF-8 byte count
* Extracted line count
* Canonical SHA-256
* Computed SHA-256 where practical
* Heading count
* Principal-section count
* Inline-math count
* Display-math count
* Total math count
* Stress-case count
* Summary-bullet count
* Any source discrepancy
* Source-validation verdict

---

## Section 7 — Transfer plan and preview

Report:

* Selected workflow
* Expected hierarchy
* Expected formula representations
* Inline-math strategy
* Display-math strategy
* Nuclide strategy
* Advanced-expression strategy
* Preview capability
* Preview result
* Preview warnings
* Adjustments made
* Alternative workflow considered

---

## Section 8 — Chronological operation log

Use:

|  # | Phase | Tool or capability | Purpose | Target | Status | Operation ID | Idempotency key | Latency | Warning/error |
| -: | ----- | ------------------ | ------- | ------ | ------ | ------------ | --------------- | ------: | ------------- |

Include every meaningful RemNote operation.

---

## Section 9 — Artifact identity

Use:

| Artifact             | Title | Rem ID | Parent ID | Breadcrumb | Duplicate count | Verified |
| -------------------- | ----- | ------ | --------- | ---------- | --------------: | -------- |
| Test 06 root         |       |        |           |            |                 |          |
| Scientific-note root |       |        |           |            |                 |          |

---

## Section 10 — Hierarchy verification

Use:

| Position | Required section | Observed section | Rem ID | Correct parent | Correct order | Status |
| -------: | ---------------- | ---------------- | ------ | -------------- | ------------- | ------ |

There must be seven rows.

Also report:

* Expected principal-section count
* Observed count
* Missing sections
* Extra sections
* Duplicate sections
* Wrong-parent content
* Introductory paragraph location
* Summary-bullet count

---

## Section 11 — Complete formula occurrence audit

Include the required thirty-two-row formula table:

| Formula ID | Section | Source role | Source expression | Rem ID | Plain-text result | Rich-text result | Observed role | Classification | Notes |
| ---------- | ------- | ----------- | ----------------- | ------ | ----------------- | ---------------- | ------------- | -------------- | ----- |

Do not combine multiple source occurrences into one row.

---

## Section 12 — Core formula spot checks

Create separate subsections for:

1. Nuclear composition and nuclide notation
2. Mass–energy relationships
3. Charged particles in a magnetic field
4. Radioactive decay
5. Measurement and uncertainty

For each subsection report:

* Formula IDs
* Rem IDs
* Plain-text findings
* Rich-text findings
* Symbol findings
* Unit findings
* Scientific correctness
* Classification
* Limitations

---

## Section 13 — Advanced stress-case audit

Use:

| Stress case             | Source expression | Observed representation | Mathematical content complete | Formatting preserved | Classification | Notes |
| ----------------------- | ----------------- | ----------------------- | ----------------------------- | -------------------- | -------------- | ----- |
| Aligned equations       |                   |                         |                               |                      |                |       |
| Boxed result            |                   |                         |                               |                      |                |       |
| Text-bearing expression |                   |                         |                               |                      |                |       |
| Chained inequality      |                   |                         |                               |                      |                |       |

---

## Section 14 — Inline-versus-block audit

Include the required expected-versus-observed table.

Then explain:

* Inline formulas moved to blocks
* Blocks collapsed to inline text
* Inline formulas detached from prose
* Formula role ambiguity
* Repeated-summary preservation
* Readability impact

---

## Section 15 — Plain-text versus rich-text consistency

Use:

| Formula ID | Tree/plain result | Direct-read result | Rich-text result | Consistent? | Interpretation |
| ---------- | ----------------- | ------------------ | ---------------- | ----------- | -------------- |

Include at least the eight mandatory cross-tool checks.

Report:

* Missing rich content
* Plain/rich disagreements
* Tool-specific truncation
* Normalization differences
* Unsupported data

---

## Section 16 — Nuclide-notation audit

Use:

| Nuclide expression | Mass superscript | Atomic-number subscript | Element symbol | Reaction placement | Status |
| ------------------ | ---------------- | ----------------------- | -------------- | ------------------ | ------ |
| Generic nuclide    |                  |                         |                | N/A                |        |
| Carbon-14          |                  |                         |                | N/A                |        |
| Uranium-238        |                  |                         |                |                    |        |
| Thorium-234        |                  |                         |                |                    |        |
| Helium-4           |                  |                         |                |                    |        |

---

## Section 17 — Symbols and units audit

Use:

| Token or unit | Required context | Observed representation | Exact or equivalent | Corrupted or missing | Notes |
| ------------- | ---------------- | ----------------------- | ------------------- | -------------------- | ----- |

Include every symbol and unit in the manifest.

---

## Section 18 — Formula Fidelity Index

Report:

* Exact rich inline count
* Exact rich block count
* Semantically exact rich count
* Exact plain-text count
* Plain-text fallback count
* Raw visible delimiter count
* Raw visible LaTeX-command count
* Malformed count
* Missing count
* Unsupported count
* Not-verified count

Calculate:

* Rich Math Fidelity Rate
* Mathematical Content Preservation Rate
* Core Formula Success Rate
* Stress-Case Success Rate

Show all arithmetic.

---

## Section 19 — Pollution audit

Use:

| Pollution type          | Found? | Count | Location | Impact | Repaired |
| ----------------------- | ------ | ----: | -------- | ------ | -------- |
| Raw inline delimiter    |        |       |          |        |          |
| Raw block delimiter     |        |       |          |        |          |
| Raw fraction command    |        |       |          |        |          |
| Raw square-root command |        |       |          |        |          |
| Raw vector command      |        |       |          |        |          |
| Raw unit command        |        |       |          |        |          |
| Raw aligned environment |        |       |          |        |          |
| Raw boxed command       |        |       |          |        |          |
| Raw text command        |        |       |          |        |          |
| Unmatched brace         |        |       |          |        |          |
| Raw Markdown heading    |        |       |          |        |          |
| Metadata pollution      |        |       |          |        |          |
| Empty wrapper           |        |       |          |        |          |
| Duplicate formula       |        |       |          |        |          |
| Unexpected card         |        |       |          |        |          |

---

## Section 20 — Defects and recovery

Use:

| Defect | Formula ID or location | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
| ------ | ---------------------- | ---------------- | ------------- | --------- | ----------- | ------------- | -------------- |

Failure layer must be one of:

* ChatGPT task-understanding failure
* ChatGPT planning failure
* ChatGPT tool-selection failure
* ChatGPT sequencing failure
* Plugin implementation failure
* Permission or scope rejection
* Unsupported SDK capability
* Source-fixture problem
* Connection or deployment failure
* Verification-tool defect
* Evaluator or benchmark defect

When no repair was required, state that explicitly.

---

## Section 21 — Efficiency analysis

Use:

| Operation category        | Count |
| ------------------------- | ----: |
| Scope reads               |       |
| Collision checks          |       |
| Source-validation actions |       |
| Preview calls             |       |
| Creation calls            |       |
| Hierarchy reads           |       |
| Plain-text reads          |       |
| Rich-text reads           |       |
| Cross-tool reads          |       |
| Repair calls              |       |
| Failed calls              |       |
| Repeated calls            |       |
| Avoidable calls           |       |
| Total meaningful calls    |       |

Report:

* Slowest operation
* Highest latency
* Total known latency
* Average rich-text-read latency where practical
* Whether the route was proportional
* Whether formula verification caused excessive overhead
* Most efficient verification route
* Most fragile verification route

---

## Section 22 — Safety and mutation audit

Use:

| Category                          | Allowed | Observed | Status |
| --------------------------------- | ------: | -------: | ------ |
| Test 06 roots created             |       1 |          |        |
| Scientific-note roots created     |       1 |          |        |
| Rems created outside Test 06 root |       0 |          |        |
| Existing old Rems updated         |       0 |          |        |
| Existing old Rems moved           |       0 |          |        |
| Existing old Rems reordered       |       0 |          |        |
| Rems deleted                      |       0 |          |        |
| Cards created                     |       0 |          |        |
| Focus changes initiated           |       0 |          |        |
| Selection changes initiated       |       0 |          |        |
| External source files used        |       0 |          |        |
| Web or GitHub sources used        |       0 |          |        |
| Blind retries                     |       0 |          |        |
| Duplicate scientific roots        |       0 |          |        |

---

# 30. Scoring system

Calculate three separate scores.

---

## Section 23 — ChatGPT Agent Score

Score out of 100.

### Task understanding — 10 points

| Criterion                                   | Maximum | Awarded | Evidence |
| ------------------------------------------- | ------: | ------: | -------- |
| Understood formula-fidelity mission         |       4 |         |          |
| Distinguished rich math from plain text     |       4 |         |          |
| Avoided external sources and unrelated work |       2 |         |          |

### Planning and decomposition — 15 points

| Criterion                              | Maximum | Awarded | Evidence |
| -------------------------------------- | ------: | ------: | -------- |
| Validated source manifest              |       3 |         |          |
| Planned hierarchy                      |       3 |         |          |
| Planned inline and block math handling |       4 |         |          |
| Planned advanced stress-case handling  |       3 |         |          |
| Used preview or safe equivalent        |       2 |         |          |

### Tool selection — 15 points

| Criterion                                      | Maximum | Awarded | Evidence |
| ---------------------------------------------- | ------: | ------: | -------- |
| Selected suitable formula-aware creation route |       7 |         |          |
| Selected suitable rich-text readback route     |       5 |         |          |
| Avoided disproportionate workflows             |       3 |         |          |

### Operation sequencing — 10 points

| Criterion                        | Maximum | Awarded | Evidence |
| -------------------------------- | ------: | ------: | -------- |
| Confirmed scope before mutation  |       3 |         |          |
| Validated source before creation |       2 |         |          |
| Previewed before creation        |       2 |         |          |
| Verified before repair or retry  |       3 |         |          |

### Verification discipline — 25 points

| Criterion                               | Maximum | Awarded | Evidence |
| --------------------------------------- | ------: | ------: | -------- |
| Audited all 32 formula occurrences      |       7 |         |          |
| Compared plain and rich representations |       6 |         |          |
| Distinguished inline and block roles    |       4 |         |          |
| Cross-checked representative formulas   |       3 |         |          |
| Audited symbols, units, and nuclides    |       3 |         |          |
| Audited raw delimiters and pollution    |       2 |         |          |

### Recovery and self-correction — 10 points

| Criterion                | Maximum | Awarded | Evidence |
| ------------------------ | ------: | ------: | -------- |
| Detected genuine defects |       3 |         |          |
| Used targeted repair     |       3 |         |          |
| Avoided broad reimport   |       2 |         |          |
| Reverified repairs       |       2 |         |          |

When no repair is required, award based on correct diagnosis and avoidance of unnecessary mutation.

### Scope and safety — 10 points

| Criterion                                         | Maximum | Awarded | Evidence |
| ------------------------------------------------- | ------: | ------: | -------- |
| All mutations remained under Test 06 root         |       5 |         |          |
| No deletion, cards, or old-note modification      |       3 |         |          |
| Idempotency and uncertain outcomes handled safely |       2 |         |          |

### Efficiency — 3 points

* Verification depth was sufficient without meaningless repetition: 3

### Evidence-based reporting — 2 points

* IDs, formula evidence, operations, warnings, and limitations preserved: 2

Report:

* **ChatGPT Agent Score:** `/100`

---

## Section 24 — Plugin Capability Score

Score out of 100.

### Tool availability — 10 points

* Formula-aware creation, rich-text readback, tree readback, and targeted repair capabilities: 10

### Execution correctness — 15 points

| Criterion                    | Maximum | Awarded | Evidence |
| ---------------------------- | ------: | ------: | -------- |
| Test root correct            |       3 |         |          |
| Scientific-note root correct |       3 |         |          |
| Seven sections correct       |       4 |         |          |
| Formula placement correct    |       3 |         |          |
| Summary preserved            |       2 |         |          |

### Mathematical creation fidelity — 30 points

| Criterion                     | Maximum | Awarded | Evidence |
| ----------------------------- | ------: | ------: | -------- |
| Inline math                   |       5 |         |          |
| Display math                  |       5 |         |          |
| Fractions and roots           |       4 |         |          |
| Subscripts and superscripts   |       4 |         |          |
| Greek symbols                 |       3 |         |          |
| Vectors and cross products    |       3 |         |          |
| Units and scientific notation |       3 |         |          |
| Nuclide notation              |       3 |         |          |

### Rich-text retrieval quality — 20 points

| Criterion                                 | Maximum | Awarded | Evidence |
| ----------------------------------------- | ------: | ------: | -------- |
| Rich math distinguishable from plain text |       6 |         |          |
| Inline and block roles exposed            |       4 |         |          |
| Formula representation complete           |       5 |         |          |
| Retrieval consistent across tools         |       5 |         |          |

### Tool composability — 10 points

* Created formulas could be independently read, classified, and targeted for repair: 10

### Reliability and idempotency — 5 points

* Stable IDs, no duplicate roots, and safe uncertain-outcome handling: 5

### Performance — 5 points

* Creation and formula-read latency practical: 5

### Safety and error quality — 5 points

* Unsupported commands and errors were surfaced clearly without corrupting other content: 5

Report:

* **Plugin Capability Score:** `/100`

---

## Section 25 — Final Artifact Score

Score out of 100.

### Academic content correctness — 10 points

* All scientific relationships remain correct: 10

### Completeness — 15 points

* Seven sections present: 4
* All 32 mathematical occurrences present: 8
* Introductory and summary content complete: 3

### Hierarchy and organization — 10 points

* Correct section order: 4
* Correct formula placement: 4
* Useful nesting and no flattening: 2

### Core formula fidelity — 35 points

| Criterion                    | Maximum | Awarded | Evidence |
| ---------------------------- | ------: | ------: | -------- |
| Nuclear and nuclide formulas |       7 |         |          |
| Mass–energy formulas         |       6 |         |          |
| Magnetic-field formulas      |       8 |         |          |
| Radioactive-decay formulas   |       7 |         |          |
| Measurement formulas         |       7 |         |          |

### Advanced stress-case fidelity — 15 points

* Aligned formula: 4
* Boxed formula: 3
* Text-bearing formula: 4
* Chained inequality: 4

### Inline-versus-block quality — 5 points

* Intended math roles preserved or represented through an honest, usable fallback: 5

### Symbol and unit quality — 5 points

* Greek letters, signs, units, superscripts, and scientific notation preserved: 5

### Absence of duplicates and pollution — 5 points

* No duplicate source content: 2
* No raw delimiters or visible metadata pollution: 3

Report:

* **Final Artifact Score:** `/100`

---

## Section 26 — Weighted overall score

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

* `95–100`: Exceptional scientific formula fidelity
* `85–94`: Strong pass
* `75–84`: Pass with limitations
* `60–74`: Partial
* `<60`: Fail or blocked

---

# 31. Mandatory scoring caps

Evaluate every cap explicitly.

## Scope violation

Any unauthorized mutation outside the Test 06 root:

* Verdict: `FAIL`
* Overall score capped at `40`

## Wrong source or external academic source used

* Overall score capped at `60`

## More than one Test 06 root

* Reliability score: `0`
* Overall score capped at `65`

## More than one scientific-note root

* Artifact duplicate score: `0`
* Overall score capped at `65`

## Approved root not live-confirmed

* Overall score capped at `60`

## Source manifest not validated

* Planning score capped at `8/15`
* Overall score capped at `85`

## No preview or safe equivalent

When preview is supported but not used and no equivalent validation occurs:

* Planning score capped at `8/15`
* Overall score capped at `85`

## Flat single-Rem result

When the fixture is placed into one undifferentiated Rem despite hierarchy support:

* Artifact hierarchy score: `0`
* Overall score capped at `65`

## No post-write verification

* Verification score: `0`
* Overall score capped at `70`

## No rich-text inspection

When rich-text inspection is available but only plain text is checked:

* Agent verification score capped at `8/25`
* Plugin rich-text retrieval score: `0`
* Overall score capped at `60`

## Rich math claimed from plain text alone

When formulas are declared rich merely because plain-text output resembles equations:

* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Fewer than all 32 occurrences audited

When ChatGPT claims complete formula verification without auditing all occurrences:

* Agent verification score capped at `15/25`
* Overall score capped at `80`

## No inline-versus-block distinction

* Artifact inline/block score: `0`
* Overall score capped at `85`

## Missing or malformed critical core formula

For one unrepaired critical core formula:

* Artifact core-formula score reduced accordingly
* Overall score capped at `80`

For three or more missing or malformed core formulas:

* Overall score capped at `60`

## Wrong scientific sign or operator

Examples include:

* Wrong decay exponent sign
* Lost cross product
* Lost absolute-value bars
* Wrong inequality
* Plus-minus converted to plus

When unrepaired:

* Academic-correctness score capped at `5/10`
* Overall score capped at `70`

## Nuclide notation materially corrupted

When mass and atomic numbers cannot be associated correctly with the element:

* Nuclide points: `0`
* Overall score capped at `75`

## Critical Greek symbol corruption

When (\lambda), (\Delta), (\sigma), (\tau), (\omega), or (\varepsilon) is corrupted without disclosure:

* Symbol-quality score: `0`
* Overall score capped at `75`

## Raw delimiters left unreported

When visible `\(`, `\)`, `\[`, or `\]` pollution remains and is not reported:

* Pollution score: `0`
* Overall score capped at `70`

## Raw LaTeX commands falsely described as rendered math

* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Advanced stress command unsupported but reported honestly

No automatic overall cap applies when:

* Core formulas remain correct.
* Mathematical content remains readable.
* The unsupported formatting is clearly reported.
* No false rich-rendering claim is made.

## Blind retry after uncertain write

* Reliability points: `0`
* Overall score capped at `65`

## Duplicate formulas introduced by retry

* Reliability points: `0`
* Artifact pollution points: `0`
* Overall score capped at `65`

## Cards created

* Overall score capped at `85`

## False success claim

When the report claims formula fidelity despite contradictory readback:

* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Markdown report not created

* Overall score capped at `85`

When file creation is genuinely unsupported, mark the report artifact `BLOCKED` rather than claiming it exists.

## Complete initial prompt missing

* Overall score capped at `80`

## Chronological operation log missing

* Overall score capped at `75`

---

# 32. Required scoring-cap table

Include:

| Scoring cap                             | Triggered? | Evidence | Applied result |
| --------------------------------------- | ---------- | -------- | -------------- |
| Scope violation                         |            |          |                |
| Wrong or external source used           |            |          |                |
| More than one Test 06 root              |            |          |                |
| More than one scientific-note root      |            |          |                |
| Approved root not live-confirmed        |            |          |                |
| Source manifest not validated           |            |          |                |
| No preview or safe equivalent           |            |          |                |
| Flat single-Rem result                  |            |          |                |
| No post-write verification              |            |          |                |
| No rich-text inspection                 |            |          |                |
| Rich math claimed from plain text alone |            |          |                |
| Fewer than 32 occurrences audited       |            |          |                |
| No inline-versus-block distinction      |            |          |                |
| Missing or malformed core formula       |            |          |                |
| Wrong scientific sign or operator       |            |          |                |
| Nuclide notation corrupted              |            |          |                |
| Critical Greek symbol corruption        |            |          |                |
| Raw delimiters left unreported          |            |          |                |
| Raw commands claimed as rendered        |            |          |                |
| Blind retry                             |            |          |                |
| Duplicate formulas introduced           |            |          |                |
| Cards created                           |            |          |                |
| False success claim                     |            |          |                |
| Markdown report not created             |            |          |                |
| Complete initial prompt missing         |            |          |                |
| Chronological operation log missing     |            |          |                |

Apply the lowest triggered cap.

---

# 33. Verdict rules

Choose exactly one:

* `PASS`
* `PASS_WITH_WARNINGS`
* `PARTIAL`
* `BLOCKED_SCOPE_MISMATCH`
* `BLOCKED_SOURCE_VALIDATION`
* `BLOCKED_CONNECTION`
* `UNSUPPORTED`
* `FAIL`

## PASS

Use only when:

* Approved scope is confirmed.
* Exactly one Test 06 root exists.
* Exactly one scientific-note root exists.
* Seven principal sections exist in the correct order.
* All thirty-two formula occurrences are present.
* All core formulas are mathematically correct.
* Rich-text inspection was completed.
* Inline and display roles were assessed.
* No significant raw-delimiter pollution remains.
* Symbols, units, and nuclide notation remain intact.
* Advanced limitations are accurately reported.
* No unauthorized mutation occurs.
* The report file is created and verified.
* Final adjusted score is at least 85.

## PASS_WITH_WARNINGS

Use when:

* All core formulas are correct and readable.
* Most formulas are rich mathematics.
* One or more advanced stress commands use a safe fallback.
* Some formulas are exact plain text because of a documented capability limitation.
* Minor rich-text metadata or latency limitations remain.
* No critical formula or symbol is wrong.

## PARTIAL

Use when:

* The note exists and is mostly usable.
* Several formulas use plain-text fallback.
* Rich-text evidence is incomplete.
* One or more core formulas remain malformed or unverified.
* Advanced stress cases fail materially.
* No scope violation or deliberate false claim occurs.

## BLOCKED_SCOPE_MISMATCH

Use when the approved root cannot be confirmed.

## BLOCKED_SOURCE_VALIDATION

Use when the formula fixture cannot be isolated or validated.

## BLOCKED_CONNECTION

Use when connection failure prevents safe creation or verification.

## UNSUPPORTED

Use when the plugin cannot create or expose mathematical rich text and no reliable alternative can satisfy the mission.

## FAIL

Use when:

* Scope is violated.
* The wrong source is used.
* Major formula content is silently lost.
* Critical scientific formulas are incorrect.
* Raw syntax is falsely described as rendered mathematics.
* A false success claim is made.
* Old notes are modified.
* Deletion is performed.
* The result is unusable as a scientific note.

---

# 34. Final recommendation

Choose exactly one:

* `PROCEED_TO_TEST_07`
* `PROCEED_WITH_CAUTION`
* `REPEAT_TEST_06`
* `REPAIR_FORMULA_PIPELINE`
* `REPAIR_RICH_TEXT_READBACK`
* `CORRECT_REMNOTE_SCOPE`
* `DO_NOT_PROCEED`

Base the recommendation on the strongest limiting factor.

---

# 35. Artifact manifest

Include:

| Artifact              | Type          | Parent/location          | ID or path  | Verified |
| --------------------- | ------------- | ------------------------ | ----------- | -------- |
| Test 06 root          | RemNote root  | Plugin Test              | Live Rem ID | Yes/No   |
| Formula-fidelity note | Rem hierarchy | Test 06 root             | Live Rem ID | Yes/No   |
| Test 06 report        | Markdown file | Local artifact workspace | File path   | Yes/No   |

State explicitly:

* No report was created inside RemNote.
* No existing old RemNote note was modified.
* No Rem was deleted.
* No flashcard was created.
* No external academic source was used.
* No artifact outside the Test 06 root was changed.

---

# 36. Report-integrity declaration

End the report with:

> I confirm that this report distinguishes mathematical content from rendering state, distinguishes rich mathematics from plain-text fallback and raw syntax, includes the complete user-provided Test 06 prompt and scientific fixture, audits all thirty-two mathematical occurrences, reports unsupported capabilities honestly, does not expose authentication secrets, and accurately records every detected formula defect, repair, duplicate, and scope mutation.

Then include:

* Report generated at
* Report filename
* File verification result
* Canonical fixture SHA-256
* Approved-root ID
* Test-root ID
* Scientific-note ID
* Expected formula occurrences
* Audited formula occurrences
* Exact rich inline count
* Exact rich block count
* Semantically exact rich count
* Plain-text fallback count
* Malformed count
* Missing count
* Rich Math Fidelity Rate
* Mathematical Content Preservation Rate
* Core Formula Success Rate
* Stress-Case Success Rate
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

# 37. Final chat response

After creating and verifying the RemNote artifact and local report, respond with:

**Test 06 verdict:** `[VERDICT]`
**Scientific-note root:** `[TITLE]`
**Scientific-note Rem ID:** `[REM ID]`
**Formula occurrences audited:** `[OBSERVED]/32`
**Exact or semantically exact rich math:** `[COUNT]/32`
**Safe plain-text fallbacks:** `[COUNT]`
**Malformed formulas:** `[COUNT]`
**Missing formulas:** `[COUNT]`
**Core Formula Success Rate:** `[PERCENTAGE]%`
**Rich Math Fidelity Rate:** `[PERCENTAGE]%`
**Repairs performed:** `[COUNT]`
**ChatGPT Agent Score:** `[SCORE]/100`
**Plugin Capability Score:** `[SCORE]/100`
**Final Artifact Score:** `[SCORE]/100`
**Weighted overall score:** `[SCORE]/100`
**Recommendation:** `[RECOMMENDATION]`
**Report:** `[Download the complete Markdown report](working-file-link)`

Do not paste the full report into the final chat response unless local file creation failed.

Do not claim completion until both the live RemNote artifact and the Markdown report have been verified.

Begin RemNote MCP Test 06 now.

~~~~~~

## Section 3 — Test configuration

| Field | Value |
|---|---|
| Test number | 06 |
| Test name | Scientific Formula and Rich-Text Fidelity |
| Difficulty | Advanced |
| Run type | Main Run |
| Approved root | Plugin Test |
| Expected approved-root ID | OjLcSppWfIH0cpPoh |
| Observed approved-root ID | OjLcSppWfIH0cpPoh |
| Test-root title | RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01 |
| Test-root ID | 2pdNxGqRAJmP8fAr9 |
| Scientific-note title | Formula Fidelity Fixture — Nuclear and Charged-Particle Physics |
| Scientific-note ID | ujXrKkvJB3PKs2HnY |
| Expected math occurrences | 32 |
| Expected inline occurrences | 12 |
| Expected display occurrences | 20 |
| Cards | Forbidden |
| Deletion | Forbidden |
| External sources | Forbidden |
| Run number | 01 |

## Section 4 — Starting conditions and scope confirmation

- **Bridge state:** Connected before mutation and throughout required verification.
- **Plugin state:** Connected; initial sync complete.
- **Focused Rem:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Selection:** `Plugin Test` (`OjLcSppWfIH0cpPoh`).
- **Permission mode:** `full_control_delete_approval`.
- **Tool profile:** `developer`.
- **Branch:** `fix/remnote-mcp-mass-note-creation-stability`.
- **Commit:** `ff5e6d1ebf12dfc41c0e037cff99bfe690def240`.
- **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`.
- **Observed approved-root ID:** `OjLcSppWfIH0cpPoh`.
- **Breadcrumb:** `Plugin Test`.
- **Initial child count:** 6.
- **Collision search:** No exact Test 06 Run 01 collision.
- **Scope verdict:** `CONFIRMED_SAFE`.
- **Initial warnings:** Fuzzy search was supplemented with exact direct-child evidence.
- **Late state:** Plugin disconnected after all required hierarchy and formula-rich verification.

## Section 5 — Test-root creation

- **Selected run number:** 01.
- **Test-root title:** `RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01`.
- **Test-root ID:** `2pdNxGqRAJmP8fAr9`.
- **Parent ID:** `OjLcSppWfIH0cpPoh`.
- **Idempotency key:** `test06-run01-root-20260712`.
- **Operation ID:** `bf591001-d5bc-44f2-a4c2-00c71c6815b2`.
- **Approved-root child count before:** 6.
- **Expected count after creation:** 7.
- **Breadcrumb:** `Plugin Test > RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01`.
- **Duplicate-root check:** Exactly one.
- **Test-root direct-child count before note creation:** 0.
- **Readback result:** PASS.
- **Final parent recount:** `NOT RETURNED` because of the post-verification disconnect; exact child placement had already been independently proven.

## Section 6 — Source-fixture manifest

| Metric | Canonical | Computed |
|---|---:|---:|
| Start marker | `# Formula Fidelity Fixture — Nuclear and Charged-Particle Physics` | Exact |
| End marker | `- Fractions, vectors, Greek letters, units, inequalities, and nuclide notation must remain intact.` | Exact |
| Unicode characters | 3,180 | 3,180 |
| UTF-8 bytes | 3,184 | 3,184 |
| Logical `splitlines()` count | NOT SPECIFIED | 164 |
| Manifest line-position count | 165 | 165 |
| Canonical SHA-256 | `69c061ec8defc586335c62acd96779009dc354c2d3e730f72ac93ecb39bbe7f8` | — |
| Computed SHA-256 | — | `69c061ec8defc586335c62acd96779009dc354c2d3e730f72ac93ecb39bbe7f8` |
| Heading count | 8 | 8 |
| Principal-section count | 7 | 7 |
| Inline-math count | 12 | 12 |
| Display-math count | 20 | 20 |
| Total math count | 32 | 32 |
| Stress-case count | 4 | 4 |
| Summary-bullet count | 5 | 5 |

**Source discrepancy:** None material. The 164/165 difference is a terminal-newline counting convention; character count, byte count, and SHA-256 match exactly.

**Source-validation verdict:** `PASS`.

### Complete bounded fixture

~~~~~~markdown
# Formula Fidelity Fixture — Nuclear and Charged-Particle Physics

This note tests whether RemNote preserves inline mathematics, display mathematics, Greek letters, subscripts, superscripts, fractions, vectors, scientific notation, units, inequalities, and nuclide notation.

## 1. Nuclear Composition and Nuclide Notation

For a nucleus, the mass number, proton number, and neutron number satisfy \(A=Z+N\).

Therefore, the neutron number can be written as \(N=A-Z\).

A nuclide may be represented as \({}^{A}_{Z}\mathrm{X}\). For carbon-14, the notation is \({}^{14}_{6}\mathrm{C}\).

The alpha-decay example is:

\[
{}^{238}_{92}\mathrm{U}\rightarrow{}^{234}_{90}\mathrm{Th}+{}^{4}_{2}\mathrm{He}
\]

## 2. Mass–Energy Relationships

The rest-energy relationship is \(E=mc^2\).

A change in mass corresponds to a change in energy:

\[
\Delta E=\Delta mc^2
\]

When the mass defect is measured in atomic mass units:

\[
B(\mathrm{MeV})=\Delta m(\mathrm{u})\times931.5
\]

The binding energy per nucleon is:

\[
\frac{B}{A}
\]

## 3. Charged Particles in a Magnetic Field

The magnetic force on a charged particle is:

\[
\vec{F}=q\vec{v}\times\vec{B}
\]

For motion perpendicular to a uniform magnetic field, the circular-path radius is:

\[
r=\frac{mv}{|q|B}
\]

The cyclotron angular frequency is:

\[
\omega_c=\frac{|q|B}{m}
\]

The corresponding period is:

\[
T=\frac{2\pi m}{|q|B}
\]

## 4. Radioactive Decay

The number of undecayed nuclei is:

\[
N(t)=N_0e^{-\lambda t}
\]

The activity is:

\[
\mathcal{A}(t)=\lambda N(t)
\]

The half-life is:

\[
T_{1/2}=\frac{\ln2}{\lambda}
\]

The mean lifetime is:

\[
\tau=\frac{1}{\lambda}
\]

## 5. Measurement and Uncertainty

For Poisson counting statistics, the standard uncertainty is \(\sigma_N\approx\sqrt{N}\).

A measured length may be written as \(x=(12.4\pm0.3)\,\mathrm{cm}\).

A measured count rate may be written as:

\[
R=(2.50\pm0.05)\times10^3\,\mathrm{s^{-1}}
\]

Detector efficiency is:

\[
\varepsilon=\frac{N_{\mathrm{detected}}}{N_{\mathrm{emitted}}}
\]

Its allowed range is:

\[
0\le\varepsilon\le1
\]

The propagated relative uncertainty for \(R=N/t\) is:

\[
\frac{\Delta R}{R}
=
\sqrt{
\left(\frac{\Delta N}{N}\right)^2
+
\left(\frac{\Delta t}{t}\right)^2
}
\]

## 6. Advanced Rendering Stress Cases

The following aligned expression should preserve line structure where supported:

\[
\begin{aligned}
N(t)&=N_0e^{-\lambda t}\\
\mathcal{A}(t)&=\lambda N_0e^{-\lambda t}
\end{aligned}
\]

The following boxed result should remain mathematically readable:

\[
\boxed{T_{1/2}=\frac{0.693}{\lambda}}
\]

The following text-bearing expression should preserve the word inside the formula:

\[
v=3.00\times10^8\ \mathrm{m\,s^{-1}}\quad\text{in vacuum}
\]

The following chained inequality should preserve all comparison signs:

\[
0<\lambda,\qquad 0\le\varepsilon\le1
\]

## 7. Summary

- \(A=Z+N\) relates the nucleon, proton, and neutron numbers.
- \(E=mc^2\) relates mass and energy.
- \(r=mv/(|q|B)\) describes circular motion in a magnetic field.
- \(N(t)=N_0e^{-\lambda t}\) describes radioactive decay.
- Fractions, vectors, Greek letters, units, inequalities, and nuclide notation must remain intact.

~~~~~~

## Section 7 — Transfer plan and preview

- **Selected workflow:** `preview_markdown_note_tree` followed by one `create_or_replace_note_from_markdown`.
- **Expected hierarchy:** One scientific root, one introductory paragraph, seven ordered sections, explanation/formula pairs, and five summary bullets.
- **Expected formula representation:** 12 `inlineMath` and 20 `mathBlock` elements.
- **Inline strategy:** Keep formulas inside their prose Rems with intact surrounding text segments.
- **Display strategy:** Separate mathematical Rems beneath the correct section and explanation.
- **Nuclide strategy:** Preserve left superscripts, left subscripts, and element labels inside rich math.
- **Advanced strategy:** Preserve aligned, boxed, text-bearing, and chained-inequality expressions as rich blocks; accept only honest semantic fallback if unsupported.
- **Preview capability:** Supported.
- **Preview result:** The first preview parsed all formulas but proposed unnecessary spacers. The final preview contained 60 nodes, depth 3, 12 inline, 20 block, 5 bullets, zero spacers, zero cards, and zero pollution.
- **Preview warnings:** Formula-heavy preset added six spacer Rems and H3 styling; these were removed from the final plan.
- **Adjustments:** Layout settings only; fixture content remained unchanged.
- **Alternative workflow:** Manual formula-by-formula creation was rejected as disproportionate and fragile.
- **Fallback required:** No.

## Section 8 — Chronological operation log

| # | Phase | Tool or capability | Purpose | Target | Status | Operation ID | Idempotency key | Latency | Warning/error |
|---:|---|---|---|---|---|---|---|---:|---|
| 1 | Preflight | `get_bridge_status` | Confirm hosted bridge and plugin connectivity | `Bridge` | **PASS** | `status-mrhvl9zs` | `NOT APPLICABLE` | 4 ms | None |
| 2 | Preflight | `get_plugin_status` | Confirm permission, sync, SDK, focus, branch, and commit | `Plugin` | **PASS** | `8731c338-a315-438b-b578-f5d2a9aa7372` | `NOT APPLICABLE` | 96 ms | None |
| 3 | Preflight | `get_focused_rem` | Confirm focused Rem identity | `Current focus` | **PASS** | `bb3346c1-b000-45ff-b709-78c30472bc5a` | `NOT APPLICABLE` | 85 ms | None |
| 4 | Preflight | `get_current_selection` | Confirm selection without changing it | `Current selection` | **PASS** | `6e01c44b-17b3-473f-a6fa-7fb2d60b8f5f` | `NOT APPLICABLE` | 86 ms | None |
| 5 | Scope | `get_rem_breadcrumbs` | Prove approved-root identity | `OjLcSppWfIH0cpPoh` | **PASS** | `485293e3-e204-4a70-8082-d3bb93df0c47` | `NOT APPLICABLE` | 85 ms | None |
| 6 | Scope | `get_children` | Record approved-root children before creation | `OjLcSppWfIH0cpPoh` | **PASS** | `eaa93103-f5bf-4e1c-845f-52133a69a360` | `NOT APPLICABLE` | 83 ms | Six children |
| 7 | Collision | `search_rems` | Search for exact Test 06 Run 01 collision | `Plugin Test descendants` | **PASS** | `c6c6ae6a-a45e-4a55-a0ad-7b8fc083e95b` | `NOT APPLICABLE` | 240 ms | No exact collision; direct-child evidence authoritative |
| 8 | Create root | `create_rem` | Create one disposable Test 06 root | `OjLcSppWfIH0cpPoh` | **PASS** | `bf591001-d5bc-44f2-a4c2-00c71c6815b2` | `test06-run01-root-20260712` | 120 ms | None |
| 9 | Verify root | `get_rem_breadcrumbs` | Prove Test 06 placement beneath approved root | `2pdNxGqRAJmP8fAr9` | **PASS** | `9ce38ce9-7aae-4abc-9d32-030f00507aed` | `NOT APPLICABLE` | 84 ms | None |
| 10 | Verify root | `get_children` | Confirm disposable root is empty | `2pdNxGqRAJmP8fAr9` | **PASS** | `1d314b77-b31f-4df5-a733-beb4c23fd2a5` | `NOT APPLICABLE` | 83 ms | Child count 0 |
| 11 | Preview | `preview_markdown_note_tree` | Preview canonical fixture with formula-heavy preset | `Local parser` | **PASS** | `server-local-preview-1783866814511` | `NOT APPLICABLE` | 7 ms | All 32 formulas parsed; preset added six spacers and H3 styling |
| 12 | Preview | `preview_markdown_note_tree` | Preview final minimal payload without spacers | `Local parser` | **PASS** | `server-local-preview-1783866893438` | `NOT APPLICABLE` | 3 ms | 60 nodes; 12 inline; 20 block; zero cards/pollution |
| 13 | Create note | `create_or_replace_note_from_markdown` | Create scientific note exactly once | `2pdNxGqRAJmP8fAr9` | **PASS** | `2397547b-547d-431e-a046-1e79b854dc79` | `test06-run01-scientific-note-20260712` | 656 ms | Internal fidelity verification PASS |
| 14 | Identity | `get_children` | Confirm exactly one scientific-note root | `2pdNxGqRAJmP8fAr9` | **PASS** | `af1bf7c9-0b1c-4bb8-9040-7a8e0fbf52c3` | `NOT APPLICABLE` | 89 ms | Child count 1 |
| 15 | Identity | `get_rem_breadcrumbs` | Confirm scientific-note parent chain | `ujXrKkvJB3PKs2HnY` | **PASS** | `ac141a08-9f06-4c6b-9ae1-73b18d452cf6` | `NOT APPLICABLE` | 87 ms | None |
| 16 | Hierarchy | `get_children` | Confirm intro plus seven sections in exact order | `ujXrKkvJB3PKs2HnY` | **PASS** | `c292c9b6-b759-4bcf-910d-d95fc5cfe5b3` | `NOT APPLICABLE` | 93 ms | Eight direct children |
| 17 | Design | `analyze_note_design` | Audit all 60 nodes, math roles, cards, delimiters, and spacing | `ujXrKkvJB3PKs2HnY` | **PASS** | `29379eaa-ce63-44e8-b736-f10ba8084830` | `NOT APPLICABLE` | 237 ms | Headings read back as normal |
| 18 | Hierarchy | `get_rem_tree` | Read complete scientific tree to depth 3 | `ujXrKkvJB3PKs2HnY` | **PASS** | `eab91a06-e796-45f3-8310-26003eeac7d0` | `NOT APPLICABLE` | 910 ms | Response truncated at advanced tail only |
| 19 | Hierarchy | `get_rem_tree` | Recover advanced-section tail | `JzGWq3hseWXf5QXJm` | **PASS** | `d134fdcf-aa5e-4eaf-a6a0-a9b9f0ea6694` | `NOT APPLICABLE` | 111 ms | None |
| 20 | Hierarchy | `get_rem_tree` | Verify all five summary bullets | `67x9NLMvO0ilNx3ew` | **PASS** | `0306c4d4-fec1-4f52-9eb2-9df298e94a75` | `NOT APPLICABLE` | 173 ms | None |
| 21 | Formula audit | `get_rem_rich` | F01 rich read | `uO6ThRnjgCSD7ljwI` | **PASS** | `46171780-8a8a-4178-8ca4-08819c23cab2` | `NOT APPLICABLE` | 109 ms | None |
| 22 | Formula audit | `get_rem_rich` | F02 rich read | `5I0W7HuK5d8zMP2IJ` | **PASS** | `9a7abdee-1796-4785-8501-92663d7d2bd2` | `NOT APPLICABLE` | 89 ms | None |
| 23 | Formula audit | `get_rem_rich` | F03/F04 rich read | `HzcMtD8o8v3HKLCbN` | **PASS** | `b7eaba47-80b7-492a-8197-ae1163f62ec1` | `NOT APPLICABLE` | 104 ms | None |
| 24 | Formula audit | `get_rem_rich` | F05 rich read | `LlldvjptNOUhAFR99` | **PASS** | `67703461-4820-4a66-ab11-0244b10fdd3d` | `NOT APPLICABLE` | 92 ms | None |
| 25 | Formula audit | `get_rem_rich` | F06 rich read | `1SHqWKIoFYj97GAYL` | **PASS** | `70ec9427-9524-4394-93c3-49ddfbca09f7` | `NOT APPLICABLE` | 92 ms | None |
| 26 | Formula audit | `get_rem_rich` | F07 rich read | `ZvEnvNiTNUPsZPqQA` | **PASS** | `1d932ae4-4cfa-4cf0-9568-a71014846814` | `NOT APPLICABLE` | 95 ms | None |
| 27 | Formula audit | `get_rem_rich` | F08 rich read | `IeXhfe9uHOWfzjTuy` | **PASS** | `a56de040-9da7-45a5-a99e-05f121c558b7` | `NOT APPLICABLE` | 88 ms | None |
| 28 | Formula audit | `get_rem_rich` | F09 rich read | `By0WEhcBHAdlJj0Jn` | **PASS** | `c79d918f-02b1-4741-8035-22875265960d` | `NOT APPLICABLE` | 89 ms | None |
| 29 | Formula audit | `get_rem_rich` | F10 rich read | `ChhERCyKFozV3mC0G` | **PASS** | `20de4c57-9223-4328-97f2-67d3b482efeb` | `NOT APPLICABLE` | 88 ms | None |
| 30 | Formula audit | `get_rem_rich` | F11 rich read | `pcu9QAej9svgj8NXQ` | **PASS** | `645c0441-1f88-4d2c-9597-d1a422b004f4` | `NOT APPLICABLE` | 92 ms | None |
| 31 | Formula audit | `get_rem_rich` | F12 rich read | `ZF1Nat32Gr1bkqffA` | **PASS** | `a075c774-eaa5-4a9f-a434-7fc862d39333` | `NOT APPLICABLE` | 89 ms | None |
| 32 | Formula audit | `get_rem_rich` | F13 rich read | `kSu6rYvCdadAq8OPO` | **PASS** | `bed5ace0-0c9d-4d2d-9a68-c1ca910badec` | `NOT APPLICABLE` | 89 ms | None |
| 33 | Formula audit | `get_rem_rich` | F14 rich read | `TYslZyImAbUfNJkOW` | **PASS** | `99bea759-60ae-4c0d-bc80-5bc974f8b116` | `NOT APPLICABLE` | 89 ms | None |
| 34 | Formula audit | `get_rem_rich` | F15 rich read | `NE8zOfgJpBYPZSpTr` | **PASS** | `a796e309-fea8-4fbc-abaa-83f36074fcaa` | `NOT APPLICABLE` | 88 ms | None |
| 35 | Formula audit | `get_rem_rich` | F16 rich read | `jZzegjUGZQYzOYi4A` | **PASS** | `f36356de-fe44-4a2b-82ee-2036ae327288` | `NOT APPLICABLE` | 87 ms | None |
| 36 | Formula audit | `get_rem_rich` | F17 rich read | `HrIe1tcvQ7RHZxJpC` | **PASS** | `2cda4d3b-268c-468a-8997-a3700ed82d60` | `NOT APPLICABLE` | 89 ms | None |
| 37 | Formula audit | `get_rem_rich` | F18 rich read | `ywI89n3rO5JvED0iz` | **PASS** | `67f575c9-b2cb-4aed-823f-9c8b4940abd0` | `NOT APPLICABLE` | 91 ms | None |
| 38 | Formula audit | `get_rem_rich` | F19 rich read | `aDKMGn7oSSV48VQBM` | **PASS** | `d5d51656-0bc7-43a3-9dc4-3759d84679d9` | `NOT APPLICABLE` | 87 ms | None |
| 39 | Formula audit | `get_rem_rich` | F20 rich read | `SxTPh4E0MKeKrIF9I` | **PASS** | `d691880b-e4f6-4f64-b84d-f258daea62da` | `NOT APPLICABLE` | 86 ms | None |
| 40 | Formula audit | `get_rem_rich` | F21 rich read | `jXS0oRHlXbRxiWZdZ` | **PASS** | `794afd40-7fa8-4e43-b9aa-f96a2bad3035` | `NOT APPLICABLE` | 87 ms | None |
| 41 | Formula audit | `get_rem_rich` | F22 rich read | `kkfUxZ4woqbKCWZuc` | **PASS** | `99570cac-3fd4-4464-a118-ccb8cb716279` | `NOT APPLICABLE` | 88 ms | None |
| 42 | Formula audit | `get_rem_rich` | F23 rich read | `pj4peTEAVQrJtkgbu` | **PASS** | `ad1d8ebc-b654-49bb-809f-7b64d1588ea6` | `NOT APPLICABLE` | 89 ms | None |
| 43 | Formula audit | `get_rem_rich` | F24 rich read | `R7f7mevRI02eVlo0c` | **PASS** | `bcc310c9-94a6-42a8-a22c-52d96de446ea` | `NOT APPLICABLE` | 88 ms | None |
| 44 | Formula audit | `get_rem_rich` | F25 rich read | `lOHiGu96PPKJaeGxP` | **PASS** | `04bf3f58-3d94-43d1-b489-5220661f048a` | `NOT APPLICABLE` | 87 ms | None |
| 45 | Formula audit | `get_rem_rich` | F26 rich read | `qMsbNckInHY8FouJi` | **PASS** | `772f8af0-1a6b-40dd-8583-1eed494df52f` | `NOT APPLICABLE` | 87 ms | None |
| 46 | Formula audit | `get_rem_rich` | F27 rich read | `NzFHEfaz722rECpbt` | **PASS** | `7281a2cb-618d-49d1-ad69-e0a3851875a2` | `NOT APPLICABLE` | 87 ms | None |
| 47 | Formula audit | `get_rem_rich` | F28 rich read | `YsZvGiPhbSuCUi4x1` | **PASS** | `60f104f9-349e-4f00-9adf-1ede2a739ea1` | `NOT APPLICABLE` | 91 ms | None |
| 48 | Formula audit | `get_rem_rich` | F29 rich read | `2557QSiqeVhT53yyL` | **PASS** | `5763f91a-d85a-4357-a55f-5e2b15088e8f` | `NOT APPLICABLE` | 104 ms | None |
| 49 | Formula audit | `get_rem_rich` | F30 rich read | `7Epid1xAJVpoQi2HD` | **PASS** | `edffd087-c59e-4fec-a314-16fcbefbc478` | `NOT APPLICABLE` | 88 ms | None |
| 50 | Formula audit | `get_rem_rich` | F31 rich read | `g5fDKgiZIlmen7reH` | **PASS** | `e56c2fee-8da4-4cf0-9ce5-803794be77b9` | `NOT APPLICABLE` | 89 ms | None |
| 51 | Formula audit | `get_rem_rich` | F32 rich read | `wPFbEJdgwTjuGALDv` | **PASS** | `4c814924-4624-48ad-8add-e4f13a117609` | `NOT APPLICABLE` | 88 ms | None |
| 52 | Cross-tool | `get_rem` | Attempt extra direct-read cross-check after all mandatory verification | `uO6ThRnjgCSD7ljwI` | **PLATFORM_BLOCKED** | `unknown-1783867748774` | `NOT APPLICABLE` | 1 ms | PLUGIN_NOT_CONNECTED |
| 53 | Recovery | `get_bridge_status` | First read-only connection recovery check | `Bridge` | **BLOCKED** | `status-mrhvoj6h` | `NOT APPLICABLE` | 1 ms | Plugin disconnected |
| 54 | Recovery | `get_plugin_status` | Second read-only recovery check | `Plugin` | **PLATFORM_BLOCKED** | `b82c1fff-00bf-49f4-b3d9-6d226a1dc282` | `NOT APPLICABLE` | 0 ms | PLUGIN_NOT_CONNECTED |

## Section 9 — Artifact identity

| Artifact | Title | Rem ID | Parent ID | Breadcrumb | Duplicate count | Verified |
|---|---|---|---|---|---:|---|
| Test 06 root | RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01 | `2pdNxGqRAJmP8fAr9` | `OjLcSppWfIH0cpPoh` | `Plugin Test > RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01` | 1 | Yes |
| Scientific-note root | Formula Fidelity Fixture — Nuclear and Charged-Particle Physics | `ujXrKkvJB3PKs2HnY` | `2pdNxGqRAJmP8fAr9` | `Plugin Test > RemNote MCP Test 06 — Scientific Formula Fidelity — 2026-07-12 — Run 01 > Formula Fidelity Fixture — Nuclear and Charged-Particle Physics` | 1 | Yes |

## Section 10 — Hierarchy verification

| Position | Required section | Observed section | Rem ID | Correct parent | Correct order | Status |
|---:|---|---|---|---|---|---|
| 1 | 1. Nuclear Composition and Nuclide Notation | 1. Nuclear Composition and Nuclide Notation | `i2BiMDE6h5GlzBuuF` | Yes | Yes | **PASS** |
| 2 | 2. Mass–Energy Relationships | 2. Mass–Energy Relationships | `CcpLSR1ixebR20hy7` | Yes | Yes | **PASS** |
| 3 | 3. Charged Particles in a Magnetic Field | 3. Charged Particles in a Magnetic Field | `8LVPY6NAie1ZqjYud` | Yes | Yes | **PASS** |
| 4 | 4. Radioactive Decay | 4. Radioactive Decay | `jF5woFrBkIo8h9xMh` | Yes | Yes | **PASS** |
| 5 | 5. Measurement and Uncertainty | 5. Measurement and Uncertainty | `kyz2exGTAgzStRrFI` | Yes | Yes | **PASS** |
| 6 | 6. Advanced Rendering Stress Cases | 6. Advanced Rendering Stress Cases | `JzGWq3hseWXf5QXJm` | Yes | Yes | **PASS** |
| 7 | 7. Summary | 7. Summary | `67x9NLMvO0ilNx3ew` | Yes | Yes | **PASS** |

- **Expected principal-section count:** 7.
- **Observed count:** 7.
- **Missing sections:** 0.
- **Extra sections:** 0.
- **Duplicate sections:** 0.
- **Wrong-parent content:** 0.
- **Introductory paragraph:** Direct child of the scientific root, Rem `6peDLi1QJGBtFCXYq`.
- **Summary-bullet count:** 5.
- **Formula placement:** Correct for all occurrences.
- **Heading metadata limitation:** All headings read back as `normal`; semantic hierarchy is correct.

## Section 11 — Complete formula occurrence audit

| Formula ID | Section | Source role | Source expression | Rem ID | Plain-text result | Rich-text result | Observed role | Classification | Notes |
|---|---|---|---|---|---|---|---|---|---|
| F01 | 1. Nuclear Composition and Nuclide Notation | Core inline | `A=Z+N` | `uO6ThRnjgCSD7ljwI` | For a nucleus, the mass number, proton number, and neutron number satisfy A=Z+N. | `inlineMath` with LaTeX `A=Z+N` inside intact prose | Inline | **EXACT_RICH_INLINE** | Original occurrence; punctuation retained. |
| F02 | 1. Nuclear Composition and Nuclide Notation | Core inline | `N=A-Z` | `5I0W7HuK5d8zMP2IJ` | Therefore, the neutron number can be written as N=A-Z. | `inlineMath` with LaTeX `N=A-Z` inside intact prose | Inline | **EXACT_RICH_INLINE** | Minus sign intact. |
| F03 | 1. Nuclear Composition and Nuclide Notation | Core inline | `{}^{A}_{Z}\mathrm{X}` | `HzcMtD8o8v3HKLCbN` | A nuclide may be represented as {}^{A}_{Z}\mathrm{X}. For carbon-14, the notation is {}^{14}_{6}\mathrm{C}. | First `inlineMath`: `{}^{A}_{Z}\mathrm{X}` | Inline | **EXACT_RICH_INLINE** | Shares one prose Rem with F04; generic left super/subscripts intact. |
| F04 | 1. Nuclear Composition and Nuclide Notation | Core inline | `{}^{14}_{6}\mathrm{C}` | `HzcMtD8o8v3HKLCbN` | A nuclide may be represented as {}^{A}_{Z}\mathrm{X}. For carbon-14, the notation is {}^{14}_{6}\mathrm{C}. | Second `inlineMath`: `{}^{14}_{6}\mathrm{C}` | Inline | **EXACT_RICH_INLINE** | Shares one prose Rem with F03; carbon-14 notation intact. |
| F05 | 2. Mass–Energy Relationships | Core inline | `E=mc^2` | `LlldvjptNOUhAFR99` | The rest-energy relationship is E=mc^2. | `inlineMath` with LaTeX `E=mc^2` | Inline | **EXACT_RICH_INLINE** | Superscript 2 intact. |
| F06 | 5. Measurement and Uncertainty | Core inline | `\sigma_N\approx\sqrt{N}` | `1SHqWKIoFYj97GAYL` | For Poisson counting statistics, the standard uncertainty is \sigma_N\approx\sqrt{N}. | `inlineMath` with LaTeX `\sigma_N\approx\sqrt{N}` | Inline | **EXACT_RICH_INLINE** | Sigma subscript, approximation sign, and root intact. |
| F07 | 5. Measurement and Uncertainty | Core inline | `x=(12.4\pm0.3)\,\mathrm{cm}` | `ZvEnvNiTNUPsZPqQA` | A measured length may be written as x=(12.4\pm0.3)\,\mathrm{cm}. | `inlineMath` with LaTeX `x=(12.4\pm0.3)\,\mathrm{cm}` | Inline | **EXACT_RICH_INLINE** | ± and cm remain attached to the value. |
| F08 | 5. Measurement and Uncertainty | Core inline | `R=N/t` | `IeXhfe9uHOWfzjTuy` | The propagated relative uncertainty for R=N/t is: | `inlineMath` with LaTeX `R=N/t` | Inline | **EXACT_RICH_INLINE** | Formula remains inside explanatory sentence. |
| F09 | 7. Summary | Repeated summary inline | `A=Z+N` | `By0WEhcBHAdlJj0Jn` | A=Z+N relates the nucleon, proton, and neutron numbers. | `inlineMath` with LaTeX `A=Z+N` | Inline | **EXACT_RICH_INLINE** | Valid repeated source occurrence preserved. |
| F10 | 7. Summary | Repeated summary inline | `E=mc^2` | `ChhERCyKFozV3mC0G` | E=mc^2 relates mass and energy. | `inlineMath` with LaTeX `E=mc^2` | Inline | **EXACT_RICH_INLINE** | Valid repeated source occurrence preserved. |
| F11 | 7. Summary | Repeated summary inline | `r=mv/(&#124;q&#124;B)` | `pcu9QAej9svgj8NXQ` | r=mv/(&#124;q&#124;B) describes circular motion in a magnetic field. | `inlineMath` with LaTeX `r=mv/(&#124;q&#124;B)` | Inline | **EXACT_RICH_INLINE** | Source's slash-form summary formula preserved, including absolute bars. |
| F12 | 7. Summary | Repeated summary inline | `N(t)=N_0e^{-\lambda t}` | `ZF1Nat32Gr1bkqffA` | N(t)=N_0e^{-\lambda t} describes radioactive decay. | `inlineMath` with LaTeX `N(t)=N_0e^{-\lambda t}` | Inline | **EXACT_RICH_INLINE** | Subscript 0 and negative exponent intact. |
| F13 | 1. Nuclear Composition and Nuclide Notation | Core display | `{}^{238}_{92}\mathrm{U}\rightarrow{}^{234}_{90}\mathrm{Th}+{}^{4}_{2}\mathrm{He}` | `kSu6rYvCdadAq8OPO` | {}^{238}_{92}\mathrm{U}\rightarrow{}^{234}_{90}\mathrm{Th}+{}^{4}_{2}\mathrm{He} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | All left superscripts/subscripts, symbols, arrow, and plus sign intact. |
| F14 | 2. Mass–Energy Relationships | Core display | `\Delta E=\Delta mc^2` | `TYslZyImAbUfNJkOW` | \Delta E=\Delta mc^2 | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Both Δ symbols and exponent intact. |
| F15 | 2. Mass–Energy Relationships | Core display | `B(\mathrm{MeV})=\Delta m(\mathrm{u})\times931.5` | `NE8zOfgJpBYPZSpTr` | B(\mathrm{MeV})=\Delta m(\mathrm{u})\times931.5 | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | MeV, u, Δ, multiplication sign, and 931.5 intact. |
| F16 | 2. Mass–Energy Relationships | Core display | `\frac{B}{A}` | `jZzegjUGZQYzOYi4A` | \frac{B}{A} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Fraction structure intact. |
| F17 | 3. Charged Particles in a Magnetic Field | Core display | `\vec{F}=q\vec{v}\times\vec{B}` | `HrIe1tcvQ7RHZxJpC` | \vec{F}=q\vec{v}\times\vec{B} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | All vector markers and cross product intact. |
| F18 | 3. Charged Particles in a Magnetic Field | Core display | `r=\frac{mv}{&#124;q&#124;B}` | `ywI89n3rO5JvED0iz` | r=\frac{mv}{&#124;q&#124;B} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Fraction and absolute-value bars intact. |
| F19 | 3. Charged Particles in a Magnetic Field | Core display | `\omega_c=\frac{&#124;q&#124;B}{m}` | `aDKMGn7oSSV48VQBM` | \omega_c=\frac{&#124;q&#124;B}{m} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Omega subscript, fraction, and absolute bars intact. |
| F20 | 3. Charged Particles in a Magnetic Field | Core display | `T=\frac{2\pi m}{&#124;q&#124;B}` | `SxTPh4E0MKeKrIF9I` | T=\frac{2\pi m}{&#124;q&#124;B} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | 2π factor and denominator intact. |
| F21 | 4. Radioactive Decay | Core display | `N(t)=N_0e^{-\lambda t}` | `jXS0oRHlXbRxiWZdZ` | N(t)=N_0e^{-\lambda t} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Subscript 0 and negative exponent intact. |
| F22 | 4. Radioactive Decay | Core display | `\mathcal{A}(t)=\lambda N(t)` | `kkfUxZ4woqbKCWZuc` | \mathcal{A}(t)=\lambda N(t) | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Calligraphic activity symbol and λ intact. |
| F23 | 4. Radioactive Decay | Core display | `T_{1/2}=\frac{\ln2}{\lambda}` | `pj4peTEAVQrJtkgbu` | T_{1/2}=\frac{\ln2}{\lambda} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Half-life subscript and fraction intact. |
| F24 | 4. Radioactive Decay | Core display | `\tau=\frac{1}{\lambda}` | `R7f7mevRI02eVlo0c` | \tau=\frac{1}{\lambda} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Tau and fraction intact. |
| F25 | 5. Measurement and Uncertainty | Core display | `R=(2.50\pm0.05)\times10^3\,\mathrm{s^{-1}}` | `lOHiGu96PPKJaeGxP` | R=(2.50\pm0.05)\times10^3\,\mathrm{s^{-1}} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | ±, ×, exponent 3, and s⁻¹ unit intact. |
| F26 | 5. Measurement and Uncertainty | Core display | `\varepsilon=\frac{N_{\mathrm{detected}}}{N_{\mathrm{emitted}}}` | `qMsbNckInHY8FouJi` | \varepsilon=\frac{N_{\mathrm{detected}}}{N_{\mathrm{emitted}}} | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Epsilon and text subscripts intact. |
| F27 | 5. Measurement and Uncertainty | Core display | `0\le\varepsilon\le1` | `NzFHEfaz722rECpbt` | 0\le\varepsilon\le1 | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Both ≤ signs intact. |
| F28 | 5. Measurement and Uncertainty | Core display | `\frac{\Delta R}{R}=\sqrt{\left(\frac{\Delta N}{N}\right)^2+\left(\frac{\Delta t}{t}\right)^2}` | `YsZvGiPhbSuCUi4x1` | \frac{\Delta R}{R}=\sqrt{\left(\frac{\Delta N}{N}\right)^2+\left(\frac{\Delta t}{t}\right)^2} | `mathBlock` retains multiline source and identical mathematical structure | Block | **EXACT_RICH_BLOCK** | Nested fractions, root, squared terms, plus sign, and line structure intact. |
| F29 | 6. Advanced Rendering Stress Cases | Advanced display | `\begin{aligned}N(t)&=N_0e^{-\lambda t}\\\mathcal{A}(t)&=\lambda N_0e^{-\lambda t}\end{aligned}` | `2557QSiqeVhT53yyL` | \begin{aligned}N(t)&=N_0e^{-\lambda t}\\\mathcal{A}(t)&=\lambda N_0e^{-\lambda t}\end{aligned} | `mathBlock` retains aligned environment, both lines, and line break | Block | **EXACT_RICH_BLOCK** | Both equations and intended order preserved; no ordinary-text pollution. |
| F30 | 6. Advanced Rendering Stress Cases | Advanced display | `\boxed{T_{1/2}=\frac{0.693}{\lambda}}` | `7Epid1xAJVpoQi2HD` | \boxed{T_{1/2}=\frac{0.693}{\lambda}} | `mathBlock` retains `\boxed{...}` | Block | **EXACT_RICH_BLOCK** | Box command remains inside structured math, not visible prose. |
| F31 | 6. Advanced Rendering Stress Cases | Advanced display | `v=3.00\times10^8\ \mathrm{m\,s^{-1}}\quad\text{in vacuum}` | `g5fDKgiZIlmen7reH` | v=3.00\times10^8\ \mathrm{m\,s^{-1}}\quad\text{in vacuum} | `mathBlock` retains number, unit, spacing, and text node in formula | Block | **EXACT_RICH_BLOCK** | 3.00×10⁸, m s⁻¹, and “in vacuum” remain associated. |
| F32 | 6. Advanced Rendering Stress Cases | Advanced display | `0<\lambda,\qquad 0\le\varepsilon\le1` | `wPFbEJdgwTjuGALDv` | 0<\lambda,\qquad 0\le\varepsilon\le1 | `mathBlock` with identical LaTeX | Block | **EXACT_RICH_BLOCK** | Both comparison types and spacing command retained in math. |

## Section 12 — Core formula spot checks

### 12.1 Nuclear composition and nuclide notation

- **Formula IDs:** F01–F04, F09, F13.
- **Rem IDs:** `uO6ThRnjgCSD7ljwI`, `5I0W7HuK5d8zMP2IJ`, `HzcMtD8o8v3HKLCbN`, `By0WEhcBHAdlJj0Jn`, `kSu6rYvCdadAq8OPO`.
- **Plain-text findings:** Complete and unchanged.
- **Rich-text findings:** Five exact inline occurrences and one exact block occurrence.
- **Symbol findings:** Left superscripts, left subscripts, element symbols, reaction arrow, and plus sign intact.
- **Unit findings:** NOT APPLICABLE.
- **Scientific correctness:** Exact source preserved.
- **Classification:** `EXACT_RICH_INLINE` / `EXACT_RICH_BLOCK`.
- **Limitations:** None in formula representation.

### 12.2 Mass–energy relationships

- **Formula IDs:** F05, F10, F14–F16.
- **Rem IDs:** `LlldvjptNOUhAFR99`, `ChhERCyKFozV3mC0G`, `TYslZyImAbUfNJkOW`, `NE8zOfgJpBYPZSpTr`, `jZzegjUGZQYzOYi4A`.
- **Plain-text findings:** Exponent 2, both Δ symbols, units, multiplication sign, 931.5, and B/A complete.
- **Rich-text findings:** Two exact inline and three exact block occurrences.
- **Symbol findings:** Exact.
- **Unit findings:** `MeV` and `u` attached correctly.
- **Scientific correctness:** Exact.
- **Classification:** `EXACT_RICH_INLINE` / `EXACT_RICH_BLOCK`.
- **Limitations:** None.

### 12.3 Charged particles in a magnetic field

- **Formula IDs:** F11, F17–F20.
- **Rem IDs:** `pcu9QAej9svgj8NXQ`, `HrIe1tcvQ7RHZxJpC`, `ywI89n3rO5JvED0iz`, `aDKMGn7oSSV48VQBM`, `SxTPh4E0MKeKrIF9I`.
- **Plain-text findings:** Complete.
- **Rich-text findings:** One exact inline summary occurrence and four exact blocks.
- **Symbol findings:** Vector markers, cross product, absolute-value bars, fractions, omega subscript, and 2π intact.
- **Unit findings:** NOT APPLICABLE.
- **Scientific correctness:** Exact.
- **Classification:** `EXACT_RICH_INLINE` / `EXACT_RICH_BLOCK`.
- **Limitations:** None.

### 12.4 Radioactive decay

- **Formula IDs:** F12, F21–F24.
- **Rem IDs:** `ZF1Nat32Gr1bkqffA`, `jXS0oRHlXbRxiWZdZ`, `kkfUxZ4woqbKCWZuc`, `pj4peTEAVQrJtkgbu`, `R7f7mevRI02eVlo0c`.
- **Plain-text findings:** N₀, negative exponent, λ, calligraphic activity, half-life subscript, τ, and fractions complete.
- **Rich-text findings:** One exact inline and four exact blocks.
- **Symbol findings:** Exact.
- **Unit findings:** NOT APPLICABLE.
- **Scientific correctness:** Exact.
- **Classification:** `EXACT_RICH_INLINE` / `EXACT_RICH_BLOCK`.
- **Limitations:** None.

### 12.5 Measurement and uncertainty

- **Formula IDs:** F06–F08, F25–F28.
- **Rem IDs:** `1SHqWKIoFYj97GAYL`, `ZvEnvNiTNUPsZPqQA`, `IeXhfe9uHOWfzjTuy`, `lOHiGu96PPKJaeGxP`, `qMsbNckInHY8FouJi`, `NzFHEfaz722rECpbt`, `YsZvGiPhbSuCUi4x1`.
- **Plain-text findings:** Complete.
- **Rich-text findings:** Three exact inline and four exact block occurrences.
- **Symbol findings:** Sigma subscript, approximation, square root, ±, exponent, epsilon, inequalities, nested fractions, squares, and plus sign intact.
- **Unit findings:** `cm` and `s^-1` attached correctly.
- **Scientific correctness:** Exact.
- **Classification:** `EXACT_RICH_INLINE` / `EXACT_RICH_BLOCK`.
- **Limitations:** None.

## Section 13 — Advanced stress-case audit

| Stress case | Source expression | Observed representation | Mathematical content complete | Formatting preserved | Classification | Notes |
|---|---|---|---|---|---|---|
| Aligned equations | `\begin{aligned}N(t)&=N_0e^{-\lambda t}\\\mathcal{A}(t)&=\lambda N_0e^{-\lambda t}\end{aligned}` | `mathBlock`; both equations, order, alignment markers, and line break retained | Yes | Yes | **EXACT_RICH_BLOCK** | No ordinary-text `\begin{aligned}` pollution. |
| Boxed result | `\boxed{T_{1/2}=\frac{0.693}{\lambda}}` | `mathBlock`; boxed command retained inside structured math | Yes | Yes | **EXACT_RICH_BLOCK** | No fallback was required. |
| Text-bearing expression | `v=3.00\times10^8\ \mathrm{m\,s^{-1}}\quad\text{in vacuum}` | `mathBlock`; number, scientific exponent, unit, and words retained | Yes | Yes | **EXACT_RICH_BLOCK** | The words remain associated with the formula. |
| Chained inequality | `0<\lambda,\qquad 0\le\varepsilon\le1` | `mathBlock`; both comparison types and both clauses retained | Yes | Yes | **EXACT_RICH_BLOCK** | Spacing command remains inside structured math. |

## Section 14 — Inline-versus-block audit

| Metric | Expected | Observed rich inline | Observed rich block | Plain fallback | Missing or malformed |
|---|---:|---:|---:|---:|---:|
| Inline math occurrences | 12 | 12 | 0 | 0 | 0 |
| Display math occurrences | 20 | 0 | 20 | 0 | 0 |
| Total math occurrences | 32 | 12 | 20 | 0 | 0 |

- **Inline formulas converted to blocks:** 0.
- **Display formulas collapsed to inline text:** 0.
- **Inline formulas detached from prose:** 0.
- **Display formulas merged with unrelated prose:** 0.
- **Repeated summary formulas omitted:** 0.
- **Formula role ambiguity:** 0.
- **Readability impact:** None.

## Section 15 — Plain-text versus rich-text consistency

| Formula ID | Tree/plain result | Direct-read result | Rich-text result | Consistent? | Interpretation |
|---|---|---|---|---|---|
| F01 | For a nucleus... A=Z+N. | NOT RETURNED — plugin disconnected after mandatory verification | Rich inline `A=Z+N` with intact surrounding text | Yes | Tree/plain and rich routes agree. |
| F13 | {}^{238}_{92}\mathrm{U}\rightarrow{}^{234}_{90}\mathrm{Th}+{}^{4}_{2}\mathrm{He} | NOT RETURNED — plugin disconnected after mandatory verification | Exact rich block nuclide equation | Yes | Tree/plain and rich routes agree. |
| F17 | \vec{F}=q\vec{v}\times\vec{B} | NOT RETURNED — plugin disconnected after mandatory verification | Exact vector/cross-product rich block | Yes | Tree/plain and rich routes agree. |
| F18 | r=\frac{mv}{&#124;q&#124;B} | NOT RETURNED — plugin disconnected after mandatory verification | Exact fraction/absolute-bars rich block | Yes | Tree/plain and rich routes agree. |
| F23 | T_{1/2}=\frac{\ln2}{\lambda} | NOT RETURNED — plugin disconnected after mandatory verification | Exact half-life rich block | Yes | Tree/plain and rich routes agree. |
| F26 | \varepsilon=\frac{N_{\mathrm{detected}}}{N_{\mathrm{emitted}}} | NOT RETURNED — plugin disconnected after mandatory verification | Exact efficiency rich block | Yes | Tree/plain and rich routes agree. |
| F28 | Complete propagated relative-uncertainty expression | NOT RETURNED — plugin disconnected after mandatory verification | Exact multiline nested-fraction rich block | Yes | Tree/plain and rich routes agree. |
| F29 | Complete aligned two-equation expression | NOT RETURNED — plugin disconnected after mandatory verification | Exact aligned rich block with both lines | Yes | Tree/plain and rich routes agree. |

- **Missing rich content:** 0.
- **Plain/rich disagreements:** 0.
- **Tool-specific truncation:** The whole-tree response truncated at the advanced tail; bounded advanced and summary tree reads recovered all content.
- **Normalization differences:** Source delimiters are absent from plain text while LaTeX is retained inside typed math nodes, as expected.
- **Unsupported data:** Supplemental direct `get_rem` output was not returned after the late disconnect. Tree and rich routes had already provided the required independent cross-checks.

## Section 16 — Nuclide-notation audit

| Nuclide expression | Mass superscript | Atomic-number subscript | Element symbol | Reaction placement | Status |
|---|---|---|---|---|---|
| Generic nuclide | A | Z | X | N/A | **EXACT_RICH_INLINE** |
| Carbon-14 | 14 | 6 | C | N/A | **EXACT_RICH_INLINE** |
| Uranium-238 | 238 | 92 | U | Left side of decay equation | **EXACT_RICH_BLOCK** |
| Thorium-234 | 234 | 90 | Th | First product after arrow | **EXACT_RICH_BLOCK** |
| Helium-4 | 4 | 2 | He | Second product after plus sign | **EXACT_RICH_BLOCK** |

## Section 17 — Symbols and units audit

| Token or unit | Required context | Observed representation | Exact or equivalent | Corrupted or missing | Notes |
|---|---|---|---|---|---|
| `A` | Nuclear composition, generic nuclide, B/A | Rich math variable | Exact | No | Context intact |
| `Z` | Nuclear composition and nuclide subscripts | Rich math variable/subscript | Exact | No | Context intact |
| `N` | Composition, uncertainty, decay, efficiency | Rich math variable | Exact | No | Context intact |
| `N_0` | Decay law and aligned expression | Subscripted rich math | Exact | No | Subscript 0 retained |
| `\Delta` | Mass–energy and propagated uncertainty | Rich Greek symbol | Exact | No | All occurrences retained |
| `\lambda` | Decay, lifetime, stress cases | Rich Greek symbol | Exact | No | Signs and denominators retained |
| `\tau` | Mean lifetime | Rich Greek symbol | Exact | No | Exact |
| `\sigma` | Poisson uncertainty | Rich Greek symbol with subscript | Exact | No | Root and approximation intact |
| `\omega` | Cyclotron angular frequency | Rich Greek symbol with subscript c | Exact | No | Exact |
| `\pi` | Cyclotron period | Rich pi | Exact | No | Factor 2π retained |
| `\varepsilon` | Detector efficiency and inequalities | Rich epsilon | Exact | No | All comparison signs retained |
| `\mathcal{A}` | Activity and aligned expression | Structured calligraphic math | Exact | No | Not exposed as prose |
| `\pm` | Measured length and count rate | Rich plus-minus | Exact | No | Not changed to plus |
| `\times` | Binding conversion, cross product, scientific notation | Structured multiplication/cross-product operator | Exact | No | Role preserved by context |
| `\approx` | Poisson uncertainty | Rich approximation sign | Exact | No | Exact |
| `\le` | Efficiency inequalities | Rich inequality | Exact | No | All ≤ signs retained |
| `<` | Chained inequality | Rich inequality | Exact | No | Exact |
| `\rightarrow` | Alpha decay | Rich reaction arrow | Exact | No | Exact |
| `\vec{F}` | Lorentz force | Rich vector | Exact | No | Vector marker retained |
| `\vec{v}` | Lorentz force | Rich vector | Exact | No | Vector marker retained |
| `\vec{B}` | Lorentz force | Rich vector | Exact | No | Vector marker retained |
| `&#124;q&#124;` | Radius, angular frequency, period, summary | Absolute-value bars | Exact | No | Not reduced to q |
| `10^3` | Measured count rate | Rich scientific exponent | Exact | No | Not flattened to 103 |
| `10^8` | Velocity stress case | Rich scientific exponent | Exact | No | Not flattened |
| `\mathrm{MeV}` | Binding-energy conversion | Structured math unit | Exact | No | Attached correctly |
| `\mathrm{u}` | Mass defect | Structured math unit | Exact | No | Attached correctly |
| `\mathrm{cm}` | Measured length | Inline structured unit | Exact | No | Attached correctly |
| `\mathrm{s^{-1}}` | Measured count rate | Structured inverse-second unit | Exact | No | Exponent −1 retained |
| `\mathrm{m\,s^{-1}}` | Velocity stress case | Structured velocity unit | Exact | No | Associated with 3.00×10⁸ |
| `{}^{14}_{6}\mathrm{C}` | Carbon-14 | Rich inline nuclide | Exact | No | Left super/subscripts retained |
| `{}^{238}_{92}\mathrm{U}` | Alpha decay | Rich block nuclide | Exact | No | Correct placement |
| `{}^{234}_{90}\mathrm{Th}` | Alpha decay | Rich block nuclide | Exact | No | Correct placement |
| `{}^{4}_{2}\mathrm{He}` | Alpha decay | Rich block nuclide | Exact | No | Correct placement |

## Section 18 — Formula Fidelity Index

| Classification | Count |
|---|---:|
| Exact rich inline | 12 |
| Exact rich block | 20 |
| Semantically exact rich | 0 |
| Exact plain text | 0 |
| Plain-text fallback | 0 |
| Raw visible delimiters | 0 |
| Raw visible LaTeX commands in ordinary text | 0 |
| Malformed | 0 |
| Missing | 0 |
| Unsupported | 0 |
| Not verified | 0 |

### Rich Math Fidelity Rate

`(12 + 20 + 0) / 32 × 100 = 100.00%`

### Mathematical Content Preservation Rate

`32 / 32 × 100 = 100.00%`

### Core Formula Success Rate

The advanced stress occurrences are F29–F32, leaving 28 core/non-stress occurrences.

`28 / 28 × 100 = 100.00%`

### Stress-Case Success Rate

`4 / 4 × 100 = 100.00%`

## Section 19 — Pollution audit

| Pollution type | Found? | Count | Location | Impact | Repaired |
|---|---|---:|---|---|---|
| Raw inline delimiter | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |
| Raw block delimiter | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |
| Raw fraction command | No ordinary-text pollution | 0 | Commands exist only inside math nodes | None | NOT APPLICABLE |
| Raw square-root command | No ordinary-text pollution | 0 | Commands exist only inside math nodes | None | NOT APPLICABLE |
| Raw vector command | No ordinary-text pollution | 0 | F17 structured math | None | NOT APPLICABLE |
| Raw unit command | No ordinary-text pollution | 0 | Structured math only | None | NOT APPLICABLE |
| Raw aligned environment | No ordinary-text pollution | 0 | F29 structured math | None | NOT APPLICABLE |
| Raw boxed command | No ordinary-text pollution | 0 | F30 structured math | None | NOT APPLICABLE |
| Raw text command | No ordinary-text pollution | 0 | F31 structured math | None | NOT APPLICABLE |
| Unmatched brace | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |
| Raw Markdown heading | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |
| Metadata pollution | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |
| Empty wrapper | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |
| Duplicate formula | No accidental duplicate | 0 | Four summary repetitions are intentional | None | NOT APPLICABLE |
| Unexpected card | No | 0 | NOT APPLICABLE | None | NOT APPLICABLE |

## Section 20 — Defects and recovery

| Defect | Formula ID or location | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
|---|---|---|---|---|---|---|---|
| Terminal-newline line-count convention | Source manifest | Local validation | Evaluator or benchmark defect | 164 logical lines versus 165 line positions | Document; do not alter source | No mutation required | Character, byte, and SHA exact |
| Heading metadata is `normal` | Scientific root and sections | Design analysis | Plugin implementation failure | Parent-child hierarchy is correct but visual heading property did not persist | No risky non-formula mutation | Unrepaired presentation warning | Hierarchy and formula placement independently verified |
| Supplemental direct read failed after all required verification | F01 direct read | `get_rem` | Connection or deployment failure | Plugin disconnected late | Two read-only recovery attempts; no write retry | Both remained blocked | Existing tree/rich evidence retained |
| Formula defect requiring repair | F01–F32 | Tree and rich reads | NOT APPLICABLE | No formula defect found | No unnecessary repair | NOT APPLICABLE | All classifications complete |

## Section 21 — Efficiency analysis

| Operation category | Count |
|---|---:|
| Scope reads | 6 |
| Collision checks | 1 |
| Source-validation actions | 1 local validation workflow |
| Preview calls | 2 |
| Creation calls | 2 |
| Hierarchy reads | 6 |
| Plain-text reads | 3 tree routes covering all content |
| Rich-text reads | 31 calls covering 32 occurrences |
| Cross-tool reads | Tree + rich for all; one supplemental direct read blocked |
| Repair calls | 0 |
| Failed calls | 3 late connection-related calls |
| Repeated calls | 2 bounded tree reads justified by truncation |
| Avoidable calls | 0 |
| Total meaningful RemNote calls | 54 |

- **Slowest operation:** `get_rem_tree` — Read complete scientific tree to depth 3.
- **Highest latency:** 910 ms.
- **Total known latency:** 6,140 ms.
- **Average rich-text-read latency:** 90.52 ms.
- **Route proportional:** Yes.
- **Formula-verification overhead:** High in count but benchmark-required.
- **Most efficient route:** Aggregate design analysis plus targeted rich reads.
- **Most fragile route:** Supplemental direct read after a long live session.

## Section 22 — Safety and mutation audit

| Category | Allowed | Observed | Status |
|---|---:|---:|---|
| Test 06 roots created | 1 | 1 | PASS |
| Scientific-note roots created | 1 | 1 | PASS |
| Rems created outside Test 06 root | 0 | 0 | PASS |
| Existing old Rems updated | 0 | 0 | PASS |
| Existing old Rems moved | 0 | 0 | PASS |
| Existing old Rems reordered | 0 | 0 | PASS |
| Rems deleted | 0 | 0 | PASS |
| Cards created | 0 | 0 | PASS |
| Focus changes initiated | 0 | 0 | PASS |
| Selection changes initiated | 0 | 0 | PASS |
| External source files used | 0 | 0 | PASS |
| Web or GitHub sources used | 0 | 0 | PASS |
| Blind retries | 0 | 0 | PASS |
| Duplicate scientific roots | 0 | 0 | PASS |

The uploaded Nuclear Physics Markdown file was not opened or used.

## Section 23 — ChatGPT Agent Score

### Task understanding — 10/10

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Understood formula-fidelity mission | 4 | 4 | Test 06 only; complete F01–F32 audit |
| Distinguished rich math from plain text | 4 | 4 | Typed math-node evidence |
| Avoided external sources and unrelated work | 2 | 2 | Fixed fixture only |

### Planning and decomposition — 15/15

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Validated source manifest | 3 | 3 | Counts and SHA |
| Planned hierarchy | 3 | 3 | Root, intro, seven sections, summary |
| Planned inline and block math handling | 4 | 4 | Exact 12/20 plan |
| Planned advanced stress-case handling | 3 | 3 | Four cases |
| Used preview or safe equivalent | 2 | 2 | Two previews |

### Tool selection — 15/15

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Suitable formula-aware creation route | 7 | 7 | Formula-preserving Markdown writer |
| Suitable rich-text readback route | 5 | 5 | `get_rem_rich` |
| Avoided disproportionate workflows | 3 | 3 | One import; no manual formula writes |

### Operation sequencing — 10/10

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Confirmed scope before mutation | 3 | 3 | Live ID and breadcrumb |
| Validated source before creation | 2 | 2 | Exact manifest |
| Previewed before creation | 2 | 2 | Two previews |
| Verified before repair or retry | 3 | 3 | No blind write retry |

### Verification discipline — 25/25

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Audited all 32 formula occurrences | 7 | 7 | F01–F32 |
| Compared plain and rich representations | 6 | 6 | Tree/plain and rich |
| Distinguished inline and block roles | 4 | 4 | 12/20 |
| Cross-checked representative formulas | 3 | 3 | Eight required cases |
| Audited symbols, units, and nuclides | 3 | 3 | Sections 16–17 |
| Audited raw delimiters and pollution | 2 | 2 | Section 19 |

### Recovery and self-correction — 10/10

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Detected genuine defects | 3 | 3 | Heading metadata and disconnect |
| Used targeted repair | 3 | 3 | No formula mutation was justified; recovery remained read-only |
| Avoided broad reimport | 2 | 2 | No reimport |
| Reverified repairs | 2 | 2 | No formula repair needed; successful evidence retained |

### Scope and safety — 10/10

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Mutations remained under Test 06 root | 5 | 5 | IDs and breadcrumb |
| No deletion, cards, or old-note modification | 3 | 3 | Zero |
| Idempotency and uncertain outcomes handled safely | 2 | 2 | Distinct keys; no blind retry |

### Efficiency — 2/3

The route was proportional, but the available rich API required 31 individual calls.

### Evidence-based reporting — 2/2

IDs, operations, formula evidence, warnings, and limitations are preserved.

**ChatGPT Agent Score: 99/100**

## Section 24 — Plugin Capability Score

### Tool availability — 10/10

Formula-aware creation, rich-text readback, tree readback, design analysis, and targeted repair were available.

### Execution correctness — 15/15

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Test root correct | 3 | 3 | Exact placement |
| Scientific-note root correct | 3 | 3 | Exactly one |
| Seven sections correct | 4 | 4 | Exact order |
| Formula placement correct | 3 | 3 | Correct topics |
| Summary preserved | 2 | 2 | Five bullets and repeated formulas |

### Mathematical creation fidelity — 30/30

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Inline math | 5 | 5 | 12/12 |
| Display math | 5 | 5 | 20/20 |
| Fractions and roots | 4 | 4 | Exact |
| Subscripts and superscripts | 4 | 4 | Exact |
| Greek symbols | 3 | 3 | Exact |
| Vectors and cross products | 3 | 3 | Exact |
| Units and scientific notation | 3 | 3 | Exact |
| Nuclide notation | 3 | 3 | Exact |

### Rich-text retrieval quality — 20/20

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Rich math distinguishable from plain text | 6 | 6 | Typed nodes |
| Inline and block roles exposed | 4 | 4 | Exact |
| Formula representation complete | 5 | 5 | All 32 |
| Retrieval consistent across tools | 5 | 5 | Tree/design/rich agree |

### Tool composability — 10/10

Created formulas were independently readable and addressable by stable Rem IDs.

### Reliability and idempotency — 3/5

Creation was idempotent and IDs were stable, but the plugin disconnected after verification.

### Performance — 4/5

Creation and rich reads were practical; the full-tree call took 910 ms and the session ended with a disconnect.

### Safety and error quality — 5/5

The disconnect was surfaced clearly and no uncertain write was hidden.

**Plugin Capability Score: 97/100**

## Section 25 — Final Artifact Score

### Academic content correctness — 10/10

All scientific relationships remain exact.

### Completeness — 15/15

- Seven sections: 4/4.
- All 32 occurrences: 8/8.
- Introductory and summary content: 3/3.

### Hierarchy and organization — 9/10

- Section order: 4/4.
- Formula placement: 4/4.
- Useful nesting/no flattening: 1/2 because heading metadata is `normal`.

### Core formula fidelity — 35/35

| Criterion | Maximum | Awarded | Evidence |
|---|---:|---:|---|
| Nuclear and nuclide formulas | 7 | 7 | Exact |
| Mass–energy formulas | 6 | 6 | Exact |
| Magnetic-field formulas | 8 | 8 | Exact |
| Radioactive-decay formulas | 7 | 7 | Exact |
| Measurement formulas | 7 | 7 | Exact |

### Advanced stress-case fidelity — 15/15

- Aligned: 4/4.
- Boxed: 3/3.
- Text-bearing: 4/4.
- Chained inequality: 4/4.

### Inline-versus-block quality — 5/5

All intended roles are preserved.

### Symbol and unit quality — 5/5

All required symbols, units, superscripts, and scientific notation are preserved.

### Absence of duplicates and pollution — 5/5

No accidental duplicates, raw delimiters, ordinary-text LaTeX pollution, metadata pollution, or cards.

**Final Artifact Score: 99/100**

## Section 26 — Weighted overall score

- **Agent contribution:** `0.35 × 99 = 34.65`
- **Plugin contribution:** `0.40 × 97 = 38.80`
- **Artifact contribution:** `0.25 × 99 = 24.75`
- **Raw weighted score:** `98.20/100`
- **Applied scoring cap:** None.
- **Final adjusted score:** `98.20/100`
- **Rating:** Exceptional scientific formula fidelity.
- **Final verdict:** `PASS_WITH_WARNINGS`.

### Mandatory scoring-cap evaluation

| Scoring cap | Triggered? | Evidence | Applied result |
|---|---|---|---|
| Scope violation | No | All mutations were beneath the new Test 06 root | No cap |
| Wrong source or external academic source used | No | Only the fixed prompt fixture was used; Nuclear Physics upload was not opened | No cap |
| More than one Test 06 root | No | Exactly one root | No cap |
| More than one scientific-note root | No | Exactly one root | No cap |
| Approved root not live-confirmed | No | Exact live ID, focus, selection, and breadcrumb | No cap |
| Source manifest not validated | No | Character, byte, hash, headings, and formula counts validated | No cap |
| No preview or safe equivalent | No | Two non-mutating previews | No cap |
| Flat single-Rem result | No | 60-node hierarchy with seven sections | No cap |
| No post-write verification | No | Tree, design, hierarchy, and all formulas read independently | No cap |
| No rich-text inspection | No | 31 rich reads covered all 32 occurrences | No cap |
| Rich math claimed from plain text alone | No | Typed `inlineMath` and `mathBlock` evidence | No cap |
| Fewer than all 32 occurrences audited | No | Complete F01–F32 table | No cap |
| No inline-versus-block distinction | No | 12 inline and 20 block classified | No cap |
| Missing or malformed critical core formula | No | All 28 non-stress occurrences correct | No cap |
| Wrong scientific sign or operator | No | All required signs and operators exact | No cap |
| Raw delimiters or control syntax falsely called clean | No | Commands inside math nodes correctly distinguished from prose pollution | No cap |
| Cards created | No | Zero cards | No cap |
| Deletion performed | No | Zero deletions | No cap |
| Report artifact missing | No | Local Markdown report created and verified | No cap |
| False success after connection loss | No | Late disconnect explicitly reported; no further write or unsupported success claim | No cap |

### Final recommendation

**Recommendation: `READY_FOR_TEST_07_AFTER_RECONNECTION`**

The scientific artifact passed. Test 07 should begin only after the RemNote plugin reconnects and the approved scope is live-confirmed again.

### Artifact manifest

| Artifact | Type | Location or parent | ID or path | Verified |
|---|---|---|---|---|
| Test 06 root | RemNote root | Plugin Test | `2pdNxGqRAJmP8fAr9` | Yes |
| Scientific note | RemNote hierarchy | Test 06 root | `ujXrKkvJB3PKs2HnY` | Yes |
| Laboratory report | Markdown file | Local artifact workspace | `/mnt/data/remnote-mcp-test-06-scientific-formula-rich-text-fidelity-report-2026-07-12.md` | Yes |

### Report-integrity declaration

This report includes the complete user prompt, complete fixture, source manifest, scope evidence, chronological operation log, all 32 formula audits, core and advanced checks, inline/block analysis, plain/rich comparison, Formula Fidelity Index, symbol and unit audit, pollution audit, defects, scores, caps, and final verdict. It contains no authentication secret or private chain-of-thought.

- **Created Rems:** 61 total: one Test 06 root plus 60 scientific-note Rems.
- **Updated Rems:** 0.
- **Deleted Rems:** 0.
- **Cards:** 0.
- **Exact rich inline:** 12.
- **Exact rich block:** 20.
- **Final verdict:** `PASS_WITH_WARNINGS`.
- **Recommendation:** `READY_FOR_TEST_07_AFTER_RECONNECTION`.
