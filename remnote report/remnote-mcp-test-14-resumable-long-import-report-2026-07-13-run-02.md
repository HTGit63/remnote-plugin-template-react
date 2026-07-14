# RemNote MCP Test 14 — Adapted Six-Batch Resumable Nuclear Physics Import

- **Generated:** 2026-07-13 19:46:07 EAT
- **Verdict:** `BLOCKED_JOB_STATE`
- **Connection:** `CONNECTED_AND_SYNCED`
- **Approved root:** `Plugin Test` (`OjLcSppWfIH0cpPoh`)
- **Test root:** `zYWFdK4no5ETVMs05`
- **Import root:** `nIgYWCmJ1qfBTNCWq`
- **Chapter root:** `WyyqejA9lJtMPYgrO`
- **Plan ID:** `plan:fnv1a32:00963bdd`
- **Job ID:** `test14-adapted-nuclear-ch1-run01-20260713`
- **Durability:** `persistent`
- **Native chunks:** 55
- **Logical batches:** 6
- **Native chunks verified:** 5/55
- **Logical batches completed:** 0/6
- **Chapter Two leakage:** 0
- **Agent score:** 92/100
- **Plugin score:** 42/100
- **Artifact score:** 29/100
- **Adjusted weighted score:** 50.0/100

## Executive summary

The refreshed connection worked and the plugin created one persistent resumable import job. The exact Nuclear Physics Chapter One source was planned through the direct text planner because every connector-backed file route remained broken. The planner preserved the source hierarchy as 55 native microchunks; the user-authorized six chunks were represented as six logical execution batches over the same job.

Native chunks 1–5 were written and job-verified. Native chunk 6 (`Classification of nuclides`) exists in the live tree and its supplied normalized text hash matches the source, but its persistent chunk record lost all created/updated Rem IDs. One verification attempt and one supported same-job resume could not reconcile it. Continuing would repeatedly target chunk 6 and risk unsafe replay. The run therefore stopped under the benchmark's job-state safety rule.

The partial artifact also contains three nested copies of the `1.1` title, malformed classification nesting, and visible dash pollution. No replacement job, deletion, or Chapter Two content was introduced.

## Complete strict Test 14 prompt

```markdown
# RemNote MCP Laboratory Test 14

## Resumable Bounded Long-Note Import

You are the primary experimental tester of a remote RemNote MCP plugin.

This is **Test 14 only**. Do not begin, simulate, or partially perform Test 15 or any optional limit laboratory.

Your mission is to import one precisely bounded long Markdown chapter into RemNote using a resumable multi-chunk workflow.

The experiment must prove that ChatGPT and the plugin can:

1. Confirm the approved RemNote scope.
2. Validate a fixed source fixture.
3. Identify exact start and stop boundaries.
4. Plan the import before writing.
5. Divide the bounded source into deterministic chunks.
6. Create exactly one resumable import job.
7. Execute only the first half of the chunks.
8. Stop intentionally.
9. Inspect and record durable job progress.
10. Verify the partially imported artifact.
11. Resume the same job rather than start a replacement job.
12. Execute only the remaining chunks.
13. Verify that completed chunks were not duplicated.
14. Verify that the bounded chapter is complete.
15. Verify that Chapter Two was not imported.
16. Verify hierarchy, text, formulas, table content, order, and uniqueness.
17. Diagnose and repair only confirmed import defects.
18. Create one complete local Markdown laboratory report.

Do not replace this resumable workflow with a single untracked bulk write.

---

# 1. Test identity

* **Test number:** 14
* **Test name:** Resumable Bounded Long-Note Import
* **Benchmark module:** Module V — Scale and Maximum Potential
* **Difficulty:** Limit
* **Run type:** Main Run
* **Required total runs:** Two independent runs
* **Execution mode:** Workflow-constrained resumable import
* **Approved RemNote root title:** `Plugin Test`
* **Expected approved-root ID:** `OjLcSppWfIH0cpPoh`
* **Disposable test root:** Create one new child beneath `Plugin Test`
* **Expected imported lesson title:**
  `Chapter One: Mechanical Waves and Sound`
* **Planned import chunks:** `4`
* **Required midpoint stop:** After chunks 1 and 2
* **Required resume:** Continue chunks 3 and 4 through the same job
* **Allowed operations:** Read, validate source, plan import, create one import job, execute bounded chunks, inspect progress, resume, verify, and perform targeted repair within the new Test 14 root
* **Deletion permission:** None
* **Movement or reordering permission after successful import:** None except targeted repair of a confirmed import defect
* **Card creation permission:** None
* **Design-template use:** None
* **External academic sources:** Forbidden
* **GitHub:** Forbidden
* **Web browsing:** Forbidden
* **Required deliverable:** One complete local Markdown report

---

# 2. Central experimental question

> Can ChatGPT orchestrate a resumable bounded import that survives a deliberate midpoint interruption, preserves job state, resumes without duplication, and imports exactly the requested source region?

This test is not passed merely because:

* The final chapter appears somewhere in RemNote.
* A bulk writer reports success.
* The full source is imported in one call.
* A second import job recreates the missing half.
* The chapter is rebuilt after the pause.
* Completed chunks are rerun and duplicate content.
* Chapter Two is imported and later hidden.
* The final hierarchy looks plausible but source lines are missing.
* ChatGPT reports completion without inspecting the job and final tree.
* The job reports completion while the artifact remains incomplete.
* A duplicate-free result is inferred from title counts alone.
* Plain text exists but formulas or the table are malformed.

The live job state and final RemNote artifact must support the result.

---

# 3. Primary objectives

The experiment must determine whether ChatGPT and the plugin can:

1. Validate source boundaries before import.
2. Calculate or confirm source statistics.
3. Produce a deterministic import plan.
4. Respect a start marker and stop marker.
5. Create a persistent import job.
6. Execute bounded chunks in order.
7. Record chunk operation IDs and state.
8. Stop safely after an intentional partial import.
9. Retrieve the existing import job.
10. Distinguish completed, pending, failed, and uncertain chunks.
11. Resume without restarting.
12. Avoid replaying completed chunks.
13. Preserve chunk ordering.
14. Preserve hierarchy across chunk boundaries.
15. Preserve formulas and Unicode.
16. Preserve table content.
17. Prevent Chapter Two leakage.
18. Detect missing or duplicated source units.
19. Handle uncertain outcomes without blind retry.
20. Verify source fidelity independently.
21. Report durability or persistence limitations honestly.

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

Do not change focus or selection merely to run the test.

The focused Rem does not have to be `Plugin Test` when the approved root can be safely addressed through verified identity evidence.

---

# 5. Scope and execution stopping conditions

Stop all mutations and report `BLOCKED_SCOPE_MISMATCH` when:

* `Plugin Test` cannot be found.
* Multiple exact-title matches remain unresolved.
* The observed approved-root ID conflicts with the expected ID and cannot be resolved safely.
* The Test 14 root would be created outside the approved scope.
* You cannot prove that the Test 14 root is beneath `Plugin Test`.

Stop and report `BLOCKED_SOURCE_VALIDATION` when:

* The exact start marker cannot be found once.
* The exact stop marker cannot be found once.
* The stop marker appears before the start marker.
* Source boundaries remain ambiguous.
* The bounded source differs materially from the supplied fixture.
* The four required chunk boundaries cannot be established safely.

Stop and report `BLOCKED_CONNECTION` when:

* The plugin disconnects before a sensitive write.
* A chunk outcome is uncertain and job state plus artifact readback cannot resolve it.
* Two reasonable recovery attempts fail for the same connection problem.

Stop and report `BLOCKED_JOB_STATE` when:

* The created job cannot be retrieved after the midpoint stop.
* The plugin cannot distinguish completed and pending chunks.
* Resuming would require guessing which chunks ran.
* Continuing could duplicate completed content.

Stop and report `UNSUPPORTED_RESUMABLE_IMPORT` when:

* No durable resumable import workflow exists.
* Only one-shot bulk creation is available.
* No persistent job or equivalent progress state can be read.
* Resume requires starting an unrelated replacement import.
* Chunk completion cannot be verified safely.

Do not substitute a one-shot import while claiming resumability.

---

# 6. Disposable Test 14 root

Create exactly one disposable root beneath `Plugin Test`.

Use:

`RemNote MCP Test 14 — Resumable Long Import — YYYY-MM-DD — Run NN`

Replace:

* `YYYY-MM-DD` with the actual date
* `NN` with a two-digit run number

Begin with `Run 01`.

Before creation:

1. Search beneath `Plugin Test` for an exact-title collision.
2. Do not reuse an earlier Test 14 root.
3. Do not modify an earlier Test 14 root.
4. Do not delete an earlier Test 14 root.
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

Create no more than one Test 14 root.

---

# 7. Authoritative source fixture

Use only the Markdown fixture supplied below.

Do not use:

* Existing physics notes
* Uploaded `.rem` files
* Textbooks
* GitHub
* Web search
* Previous Test 14 artifacts
* Previous conversation summaries
* External files

The source contains a requested chapter followed by a deliberately excluded second chapter.

The full fixture must be treated as immutable source data.

```markdown
# Chapter One: Mechanical Waves and Sound

Mechanical waves transfer energy through an oscillating material medium without transporting the medium as a whole over long distances.

This chapter develops wave quantities, the wave equation, superposition, standing waves, sound intensity, and the Doppler effect.

## 1.1 Foundations and Wave Parameters

### 1.1.1 Core Ideas

- A mechanical wave requires a material medium.
- A transverse wave has particle displacement perpendicular to the direction of propagation.
- A longitudinal wave has particle displacement parallel to the direction of propagation.
- A pulse is a single disturbance.
- A periodic wave repeats at regular time intervals.
- Wave speed depends on properties of the medium.

### 1.1.2 Quantities and Relationships

- Amplitude is the maximum displacement from equilibrium.
- Wavelength λ is the shortest distance between points in the same phase.
- Frequency f is the number of complete oscillations per second.
- Period T is the time for one complete oscillation.
- The relation between period and frequency is T=1/f.
- The angular frequency is ω=2πf.
- The wave-speed relation is v=fλ.
- The SI unit of frequency is hertz, Hz.
- The SI unit of wavelength is metre, m.
- The SI unit of wave speed is metre per second, m s⁻¹.

### 1.1.3 Worked Example — Basic Wave Speed

- Problem: A water wave has frequency 4.0 Hz and wavelength 0.75 m. Determine its speed.
- Given: f=4.0 Hz and λ=0.75 m.
- Formula: v=fλ.
- Substitution: v=(4.0)(0.75).
- Answer: v=3.0 m s⁻¹.

## 1.2 Wave Equation and Superposition

### 1.2.1 Travelling-Wave Description

- A sinusoidal travelling wave may be written as y(x,t)=A sin(kx−ωt+φ).
- The wave number is k=2π/λ.
- The phase constant φ determines the initial phase.
- A point of constant phase satisfies kx−ωt+φ=constant.
- The propagation speed is v=ω/k.
- Replacing x with −x reverses the propagation direction.
- The sign of the time term indicates the direction of travel when the spatial term is fixed.

### 1.2.2 Superposition and Interference

- The principle of superposition states that overlapping displacements add algebraically.
- Constructive interference occurs when displacements reinforce one another.
- Destructive interference occurs when displacements oppose one another.
- Complete destructive interference requires equal amplitudes and opposite phase.
- A phase difference of 2π corresponds to one complete cycle.
- A phase difference of π corresponds to half a cycle.
- Interference does not permanently change the individual waves.
- After overlap, ideal waves continue with their original shapes and velocities.

### 1.2.3 Worked Example — Phase Difference

- Problem: Two points on a wave are separated by one quarter of a wavelength. Determine their phase difference.
- Given: Δx=λ/4.
- Formula: Δφ=2πΔx/λ.
- Substitution: Δφ=2π(λ/4)/λ.
- Answer: Δφ=π/2 rad.

## 1.3 Standing Waves and Resonance

### 1.3.1 Standing-Wave Structure

- A standing wave forms from two waves of equal frequency and amplitude travelling in opposite directions.
- A node is a point of zero displacement.
- An antinode is a point of maximum displacement.
- Adjacent nodes are separated by λ/2.
- A node and the nearest antinode are separated by λ/4.
- Energy is not transported continuously along an ideal standing-wave pattern.
- The allowed patterns depend on boundary conditions.

### 1.3.2 Strings and Air Columns

- For a string fixed at both ends, the allowed wavelengths satisfy λ_n=2L/n.
- The corresponding frequencies are f_n=nv/(2L).
- For an open pipe, the harmonic frequencies also satisfy f_n=nv/(2L).
- For a pipe closed at one end, only odd harmonics occur.
- For a closed pipe, the allowed frequencies are f_n=nv/(4L), where n=1,3,5,...
- Increasing tension increases wave speed on a stretched string.
- For a string of linear density μ under tension F, the speed is v=√(F/μ).

### 1.3.3 Resonance Table

| System | Fundamental wavelength | Fundamental frequency |
|---|---|---|
| String fixed at both ends | 2L | v/(2L) |
| Open pipe | 2L | v/(2L) |
| Pipe closed at one end | 4L | v/(4L) |

- Resonance occurs when a driving frequency matches a natural frequency.
- At resonance, energy transfer from the driver is especially effective.
- Damping limits the amplitude of a real resonant system.

## 1.4 Sound, Intensity, Doppler Effect, and Summary

### 1.4.1 Sound Intensity and Level

- Sound in air is a longitudinal pressure wave.
- Sound intensity is power per unit area.
- For isotropic spreading, intensity is I=P/(4πr²).
- The inverse-square law gives I∝1/r².
- Sound intensity level is β=10 log₁₀(I/I₀).
- The reference intensity is I₀=1.0×10⁻¹² W m⁻².
- An increase of 10 dB corresponds to a tenfold increase in intensity.
- An increase of 3 dB corresponds approximately to a doubling of intensity.

### 1.4.2 Doppler Effect

- The Doppler effect is the observed frequency change caused by relative motion between source and observer.
- For a stationary observer and a source moving toward the observer, f'=fv/(v−v_s).
- For a stationary observer and a source moving away, f'=fv/(v+v_s).
- A source moving toward an observer produces a higher observed frequency.
- A source moving away from an observer produces a lower observed frequency.
- The wave speed is determined by the medium, not by the source speed.
- Sign conventions must be checked before substituting values.

### 1.4.3 Worked Example — Sound Intensity

- Problem: A small source radiates 2.0 W uniformly. Determine the intensity at 4.0 m.
- Given: P=2.0 W and r=4.0 m.
- Formula: I=P/(4πr²).
- Substitution: I=2.0/[4π(4.0)²].
- Answer: I≈9.95×10⁻³ W m⁻².

### 1.4.4 Chapter Summary

- Mechanical waves require a medium and transfer energy.
- The basic wave relation is v=fλ.
- Superposition explains constructive and destructive interference.
- Standing-wave patterns are fixed by boundary conditions.
- Resonance occurs when a driving frequency matches a natural frequency.
- Sound intensity follows an inverse-square law for isotropic spreading.
- The Doppler effect changes observed frequency when source and observer move relative to one another.

# Chapter Two: Electromagnetic Waves

This chapter is outside the Test 14 import boundary and must not be imported.

## 2.1 Boundary Sentinel

- Electromagnetic waves do not require a material medium.
- The speed of light in vacuum is c=3.00×10⁸ m s⁻¹.
- TEST14-CHAPTER-TWO-SENTINEL
```

---

# 8. Full-source manifest

The complete source fixture has:

| Property                                  |                                                     Required value |
| ----------------------------------------- | -----------------------------------------------------------------: |
| Unicode characters                        |                                                              6,432 |
| UTF-8 bytes                               |                                                              6,532 |
| Physical lines                            |                                                                153 |
| H1 headings                               |                                                                  2 |
| H2 headings                               |                                                                  5 |
| H3 headings                               |                                                                 13 |
| Bullet lines                              |                                                                 88 |
| Table rows including header and separator |                                                                  5 |
| SHA-256                                   | `eea8d99e0ed42514f08cbc2a4ad0924e1c9468eadfc20334b92336215730a094` |

Use UTF-8, LF line endings, and a terminal newline.

When the environment normalizes line endings or Unicode:

* Record the observed normalized manifest.
* Explain the normalization.
* Do not silently replace the supplied values.

---

# 9. Required import boundary

## Start marker

Include the exact line:

`# Chapter One: Mechanical Waves and Sound`

## Stop marker

Stop immediately before the exact line:

`# Chapter Two: Electromagnetic Waves`

The stop marker and everything after it are excluded.

Expected start-marker count:

`1`

Expected stop-marker count:

`1`

The imported artifact must not include:

* `Chapter Two: Electromagnetic Waves`
* `2.1 Boundary Sentinel`
* `Electromagnetic waves do not require a material medium.`
* `c=3.00×10⁸ m s⁻¹`
* `TEST14-CHAPTER-TWO-SENTINEL`

Do not import Chapter Two and then remove it.

Boundary exclusion must happen during source planning.

---

# 10. Bounded Chapter One manifest

The exact bounded source region includes the start marker and ends immediately before the stop marker.

| Property                         |                                                     Required value |
| -------------------------------- | -----------------------------------------------------------------: |
| Unicode characters               |                                                              6,149 |
| UTF-8 bytes                      |                                                              6,243 |
| Physical lines                   |                                                                144 |
| H1 headings                      |                                                                  1 |
| H2 headings                      |                                                                  4 |
| H3 headings                      |                                                                 13 |
| Bullet lines                     |                                                                 85 |
| Table rows including separator   |                                                                  5 |
| Canonical content units          |                                                                109 |
| Formula-bearing lines            |                                                                 31 |
| Worked examples                  |                                                                  3 |
| Tables                           |                                                                  1 |
| Code blocks                      |                                                                  0 |
| Card candidates                  |                                                                  0 |
| Maximum intended hierarchy depth |                                                                  4 |
| SHA-256                          | `2947ffedf423608e66a1d8bdbd9f963bd26b52065277b0b772b1ec56384e6d32` |

## Canonical content-unit rule

A canonical content unit is:

* One heading
* One paragraph
* One bullet
* One table header or data row

The Markdown table separator row is not a canonical academic content unit.

A plugin may represent the table or formulas differently in RemNote.

Record both:

* Canonical source units
* Actual created Rem count

Do not claim missing content merely because the Rem count differs when the semantic content is complete.

---

# 11. Deterministic four-chunk plan

Use exactly four logical source chunks.

Do not allow the importer to merge all four chunks into one write.

Do not split a subsection across chunks.

---

## Chunk 1 — Foundations and Wave Parameters

Includes:

* Chapter One H1
* Two introductory paragraphs
* Complete `1.1 Foundations and Wave Parameters` section

Manifest:

| Property                |                                                              Value |
| ----------------------- | -----------------------------------------------------------------: |
| Unicode characters      |                                                              1,533 |
| UTF-8 bytes             |                                                              1,547 |
| Physical lines          |                                                                 38 |
| Canonical content units |                                                                 28 |
| H2 headings             |                                                                  1 |
| H3 headings             |                                                                  3 |
| Bullet lines            |                                                                 21 |
| SHA-256                 | `d04ef40f91d5c9017b6e685efef68f64b24366cf49848c256fcf689185039c5a` |

---

## Chunk 2 — Wave Equation and Superposition

Includes the complete:

`1.2 Wave Equation and Superposition`

Manifest:

| Property                |                                                              Value |
| ----------------------- | -----------------------------------------------------------------: |
| Unicode characters      |                                                              1,353 |
| UTF-8 bytes             |                                                              1,386 |
| Physical lines          |                                                                 31 |
| Canonical content units |                                                                 24 |
| H2 headings             |                                                                  1 |
| H3 headings             |                                                                  3 |
| Bullet lines            |                                                                 20 |
| SHA-256                 | `c40150ebad967160dae38f00ff8eb4bd5bcaba632b4921c3bcccb0e4359e6b12` |

---

## Chunk 3 — Standing Waves and Resonance

Includes the complete:

`1.3 Standing Waves and Resonance`

Manifest:

| Property                   |                                                              Value |
| -------------------------- | -----------------------------------------------------------------: |
| Unicode characters         |                                                              1,431 |
| UTF-8 bytes                |                                                              1,438 |
| Physical lines             |                                                                 34 |
| Canonical content units    |                                                                 25 |
| H2 headings                |                                                                  1 |
| H3 headings                |                                                                  3 |
| Bullet lines               |                                                                 17 |
| Table header and data rows |                                                                  4 |
| SHA-256                    | `89959498142dfde30dede0fc5510167703f3cb235225203ba74c6e5c834d7f17` |

The Markdown table separator is present in the source but is not counted as an academic unit.

---

## Chunk 4 — Sound, Doppler Effect, and Summary

Includes the complete:

`1.4 Sound, Intensity, Doppler Effect, and Summary`

Manifest:

| Property                |                                                              Value |
| ----------------------- | -----------------------------------------------------------------: |
| Unicode characters      |                                                              1,832 |
| UTF-8 bytes             |                                                              1,872 |
| Physical lines          |                                                                 41 |
| Canonical content units |                                                                 32 |
| H2 headings             |                                                                  1 |
| H3 headings             |                                                                  4 |
| Bullet lines            |                                                                 27 |
| SHA-256                 | `2c98f1819a0324b29901639a3b920ac16fd4e56ed6eeaacc8706add30cb16b67` |

---

# 12. Source validation gate

Before creating an import job:

1. Confirm the start marker appears exactly once.
2. Confirm the stop marker appears exactly once.
3. Confirm the start precedes the stop.
4. Extract only the bounded Chapter One region.
5. Validate the bounded character count.
6. Validate the bounded byte count where possible.
7. Validate the bounded line count.
8. Validate the four H2 chunk boundaries.
9. Validate each chunk title.
10. Validate chunk order.
11. Validate chunk hashes where possible.
12. Validate the combined bounded hash where possible.
13. Confirm Chapter Two is excluded from all chunk payloads.
14. Confirm no chunk is empty.
15. Confirm no H3 subsection crosses a chunk boundary.
16. Confirm total canonical units equal 109.

Stop before mutation when the source cannot be validated reliably.

---

# 13. Import-target requirements

The import must create exactly one chapter root beneath the Test 14 root:

`Chapter One: Mechanical Waves and Sound`

Expected final direct-child order:

1. Introductory paragraph 1
2. Introductory paragraph 2
3. `1.1 Foundations and Wave Parameters`
4. `1.2 Wave Equation and Superposition`
5. `1.3 Standing Waves and Resonance`
6. `1.4 Sound, Intensity, Doppler Effect, and Summary`

A plugin may represent the introductory paragraphs through an equivalent supported hierarchy.

The following are forbidden:

* A second chapter root
* A wrapper named `Imported content`
* A wrapper named `Chunk 1`
* Visible job metadata
* Chunk identifiers displayed as academic content
* Separate roots for the four chunks
* Chapter Two content
* Duplicate section roots

---

# 14. Import planning requirement

Before starting the job, produce an explicit import plan containing:

* Approved target-root ID
* Test 14 root ID
* Source start marker
* Source stop marker
* Bounded source hash
* Planned chapter-root title
* Four chunk titles
* Chunk indexes
* Chunk hashes
* Expected canonical units per chunk
* Expected hierarchy anchors
* Expected section order
* Formula inventory
* Table inventory
* Midpoint stop after chunk 2
* Pending chunks after stop
* Resume strategy
* Idempotency strategy
* Uncertain-outcome strategy
* Final verification strategy

Use a non-mutating plan or preview capability where supported.

The preview must not create Rems or an import job.

---

# 15. Job creation requirement

Create exactly one resumable import job.

Record:

* Job ID
* Job title or label
* Target parent ID
* Intended chapter-root title
* Source-boundary metadata
* Planned chunk count
* Job creation operation ID
* Idempotency key
* Creation timestamp
* Initial job state
* Initial completed-chunk count
* Initial pending-chunk count
* Initial failed-chunk count
* Persistence or durability metadata
* Warnings
* Latency

Expected initial state:

* Planned chunks: `4`
* Completed chunks: `0`
* Pending chunks: `4`
* Failed chunks: `0`

Do not create the job twice when its creation response is uncertain.

Search or list jobs first.

---

# 16. Chunk execution rules

For every chunk:

1. Confirm the existing job ID.
2. Confirm the expected next chunk index.
3. Confirm the chunk has not completed.
4. Confirm the chunk hash.
5. Confirm the target chapter or anchor.
6. Use a unique chunk idempotency key where supported.
7. Execute only that chunk.
8. Inspect the chunk response.
9. Retrieve job progress.
10. Read the newly created branch.
11. Confirm source-unit coverage.
12. Confirm no later chunk was imported.
13. Confirm no duplicate prior chunk exists.

Do not submit multiple unknown chunks after an uncertain result.

Resolve the current chunk first.

---

# 17. Phase A — Execute chunk 1

Execute only Chunk 1.

Expected result:

* Chapter root created exactly once
* Two introductory paragraphs present
* Section 1.1 complete
* Section 1.2 absent
* Section 1.3 absent
* Section 1.4 absent
* Chapter Two absent
* Job progress shows one completed chunk

Immediately verify:

* Job ID unchanged
* Chunk 1 status
* Chunk 1 operation ID
* Chapter-root ID
* Section 1.1 ID
* Canonical-unit coverage
* Formulas in Chunk 1
* No duplicate root
* No visible chunk metadata

---

# 18. Phase B — Execute chunk 2

Execute only Chunk 2.

Expected result:

* Section 1.2 appended beneath the same chapter root
* Section 1.1 remains unchanged
* Section 1.3 absent
* Section 1.4 absent
* Chapter Two absent
* Job progress shows two completed chunks

Immediately verify:

* Job ID unchanged
* Chapter-root ID unchanged
* Chunk 1 remains complete
* Chunk 2 complete
* Chunk 1 is not duplicated
* Section 1.2 hierarchy complete
* Section order is correct
* Formula-bearing lines preserved

---

# 19. Mandatory midpoint stop

After Chunk 2:

**Stop all import execution.**

Do not execute chunks 3 or 4 until the midpoint inspection is complete.

The midpoint stop is a required experimental phase, not an error.

Record:

* Stop timestamp
* Job ID
* Job state
* Completed chunks
* Pending chunks
* Failed chunks
* Chapter-root ID
* Imported section IDs
* Current Rem count
* Canonical units represented
* Last successful operation ID
* Last completed chunk
* Next expected chunk
* Whether progress is durable
* Whether the job can be retrieved independently

Expected midpoint job state:

| State                | Expected |
| -------------------- | -------: |
| Planned chunks       |        4 |
| Completed chunks     |        2 |
| Pending chunks       |        2 |
| Failed chunks        |        0 |
| Last completed chunk |        2 |
| Next expected chunk  |        3 |

---

# 20. Mandatory midpoint artifact verification

At the midpoint, independently read the imported tree.

Expected present:

* Chapter root
* Two introductory paragraphs
* Complete Section 1.1
* Complete Section 1.2

Expected absent:

* Section 1.3
* Section 1.4
* Chapter Two title
* Boundary sentinel
* Any duplicate Section 1.1 or 1.2

Create a midpoint table:

| Expected item | Expected state | Observed state | Count | Status |
| ------------- | -------------- | -------------- | ----: | ------ |

Also verify:

* Source order
* Formula content
* No visible Markdown control pollution
* No job metadata pollution
* No missing completed-chunk content
* No content from pending chunks

Do not resume until midpoint state is trustworthy.

---

# 21. Job persistence inspection

After the intentional stop, retrieve the job again through an independent job-status or job-listing route where available.

Record:

* Retrieved job ID
* Job state
* Completed-chunk list
* Pending-chunk list
* Failed-chunk list
* Chunk operation IDs
* Target chapter-root ID
* Last update timestamp
* Resume token or cursor where returned
* Persistence mechanism where returned
* Whether state survived the stop
* Any discrepancy from the prior status

Classify durability:

* `DURABLE_STATE_CONFIRMED`
* `STATE_RETRIEVED_WITH_LIMITATIONS`
* `IN_MEMORY_STATE_ONLY`
* `STATE_LOST`
* `STATE_NOT_VERIFIED`

Do not claim durable resumability when state exists only in the immediate response and cannot be retrieved.

---

# 22. Resume decision gate

Before resuming:

1. Reconfirm the same job ID.
2. Reconfirm the same target chapter-root ID.
3. Reconfirm chunks 1 and 2 are complete.
4. Reconfirm chunks 3 and 4 are pending.
5. Reconfirm no failed or uncertain chunk exists.
6. Reconfirm the chapter root contains no chunk 3 or 4 content.
7. Reconfirm Chapter Two remains absent.
8. Reconfirm the next expected chunk is 3.

Stop and report `BLOCKED_JOB_STATE` when any of these cannot be established safely.

---

# 23. Phase C — Resume with chunk 3

Resume the existing job.

Do not create a new job.

Execute only Chunk 3.

Expected result:

* Section 1.3 appears once
* Resonance table is represented completely
* Sections 1.1 and 1.2 remain unchanged
* Section 1.4 remains absent
* Chapter Two remains absent
* Completed chunks become 3
* Pending chunks become 1

Verify:

* Existing job ID
* Existing chapter-root ID
* Section 1.3 ID
* Table header and three data rows
* Formula-bearing content
* No duplicate earlier section
* No duplicate chunk 3 content

---

# 24. Phase D — Resume with chunk 4

Execute only Chunk 4 through the same job.

Expected result:

* Section 1.4 appears once
* Complete chapter summary appears
* Sections 1.1–1.3 remain unchanged
* Chapter Two remains absent
* All four chunks are complete
* No chunks remain pending
* Job reaches a terminal completed state

Expected final job state:

| State             |  Expected |
| ----------------- | --------: |
| Planned chunks    |         4 |
| Completed chunks  |         4 |
| Pending chunks    |         0 |
| Failed chunks     |         0 |
| Duplicated chunks |         0 |
| Job state         | Completed |

---

# 25. Resume-continuity requirements

The completed import must use:

* One Test 14 root
* One chapter root
* One import job
* Four planned chunks
* Four unique chunk indexes
* Four completed chunk records
* No replacement job
* No reset job
* No replayed completed chunk
* No duplicate section

Record the relationship among:

* Job ID
* Chapter-root ID
* Chunk indexes
* Chunk operation IDs
* Chunk idempotency keys
* Created or appended Rem IDs

---

# 26. Uncertain chunk outcomes

When a chunk returns a timeout, disconnection, or uncertain outcome:

1. Do not immediately resubmit it.
2. Retrieve the import job.
3. Inspect the chunk status.
4. Read the target chapter.
5. Search for the chunk’s unique section root.
6. Compare expected canonical units with observed units.
7. Determine whether the chunk:

   * Completed
   * Partially completed
   * Failed
   * Was duplicated
   * Remains uncertain
8. Retry only when job and artifact evidence prove that the chunk did not complete.
9. Do not rerun completed chunks.
10. Stop when job state and artifact state conflict and cannot be reconciled.

Classify:

* `CHUNK_COMPLETED`
* `CHUNK_PARTIAL`
* `CHUNK_FAILED`
* `CHUNK_DUPLICATED`
* `CHUNK_OUTCOME_UNCERTAIN`
* `CHUNK_NOT_ATTEMPTED`

---

# 27. Final hierarchy verification

Read the complete chapter tree.

Verify:

* One chapter root
* Two introductory paragraphs
* Four H2 sections
* Thirteen H3 subsections
* Correct H2 order
* Correct H3 order
* Complete worked examples
* Complete table
* Complete chapter summary
* No Chapter Two material
* No duplicate section
* No empty chunk wrapper
* No misplaced section

Use:

| Expected source unit or branch | Expected parent | Observed ID | Correct order | Complete | Duplicate-free | Status |
| ------------------------------ | --------------- | ----------- | ------------- | -------- | -------------- | ------ |

---

# 28. Canonical content-unit audit

Audit all 109 canonical source units.

Assign canonical IDs:

`U001` through `U109`

The IDs belong only in the report.

Do not insert them into RemNote.

Use:

| Unit ID | Source type | Source text or description | Expected parent | Observed Rem or representation | Fidelity status |
| ------- | ----------- | -------------------------- | --------------- | ------------------------------ | --------------- |

Fidelity classifications:

* `EXACT`
* `SEMANTICALLY_EXACT`
* `STRUCTURALLY_EQUIVALENT`
* `PLAIN_TEXT_FALLBACK`
* `MALFORMED`
* `MISSING`
* `DUPLICATED`
* `OUT_OF_ORDER`
* `NOT_VERIFIED`

Every canonical unit must be accounted for.

---

# 29. Formula fidelity audit

Audit all 31 formula-bearing lines.

At minimum, inspect these critical formulas individually:

1. `T=1/f`
2. `ω=2πf`
3. `v=fλ`
4. `y(x,t)=A sin(kx−ωt+φ)`
5. `k=2π/λ`
6. `v=ω/k`
7. `Δφ=2πΔx/λ`
8. `Δφ=π/2 rad`
9. `λ_n=2L/n`
10. `f_n=nv/(2L)`
11. `f_n=nv/(4L)`
12. `v=√(F/μ)`
13. `I=P/(4πr²)`
14. `I∝1/r²`
15. `β=10 log₁₀(I/I₀)`
16. `I₀=1.0×10⁻¹² W m⁻²`
17. `f'=fv/(v−v_s)`
18. `f'=fv/(v+v_s)`
19. `I≈9.95×10⁻³ W m⁻²`

Use:

| Formula | Source chunk | Observed representation | Symbols preserved | Units preserved | Classification |
| ------- | -----------: | ----------------------- | ----------------- | --------------- | -------------- |

Classifications:

* `EXACT_RICH_MATH`
* `SEMANTICALLY_EXACT_RICH_MATH`
* `EXACT_PLAIN_TEXT`
* `PLAIN_TEXT_FALLBACK`
* `RAW_VISIBLE_DELIMITERS`
* `MALFORMED`
* `MISSING`
* `NOT_VERIFIED`

Do not infer formula fidelity from surrounding text.

---

# 30. Table fidelity audit

Required table:

| System                    | Fundamental wavelength | Fundamental frequency |
| ------------------------- | ---------------------- | --------------------- |
| String fixed at both ends | 2L                     | v/(2L)                |
| Open pipe                 | 2L                     | v/(2L)                |
| Pipe closed at one end    | 4L                     | v/(4L)                |

Verify:

* Header labels
* Three systems
* Wavelength values
* Frequency values
* Row associations
* Row order
* No missing cells
* No duplicated row
* No visible separator syntax
* Usable RemNote representation

An equivalent nested hierarchy is acceptable when native tables are unsupported.

Classify:

* `EXACT_TABLE`
* `STRUCTURALLY_EQUIVALENT_TABLE`
* `PLAIN_TEXT_TABLE_FALLBACK`
* `MALFORMED_TABLE`
* `MISSING_TABLE`
* `NOT_VERIFIED`

---

# 31. Chapter Two exclusion audit

Search the complete Test 14 artifact for:

* `Chapter Two`
* `Electromagnetic Waves`
* `2.1 Boundary Sentinel`
* `Electromagnetic waves do not require a material medium.`
* `c=3.00×10⁸ m s⁻¹`
* `TEST14-CHAPTER-TWO-SENTINEL`

Expected count for every item:

`0`

Use:

| Excluded item | Expected count | Observed count | Location | Status |
| ------------- | -------------: | -------------: | -------- | ------ |

Classify boundary result:

* `BOUNDARY_EXACT`
* `BOUNDARY_LEAKAGE`
* `START_CONTENT_MISSING`
* `STOP_MARKER_IMPORTED`
* `BOUNDARY_NOT_VERIFIED`

---

# 32. Duplicate audit

Search for duplicates of:

* Chapter root
* Each H2 section
* Each H3 subsection
* Each worked-example component
* Table header
* Table rows
* Summary bullets
* Formula-bearing lines
* Introductory paragraphs

Distinguish legitimate repeated formulas such as `v=fλ` from duplicated imported source units.

Classify:

* `EXACT_DUPLICATE`
* `REPLAY_DUPLICATE`
* `LEGITIMATE_REPETITION`
* `NOT_DUPLICATED`
* `NOT_VERIFIED`

A repeated formula is legitimate when it appears in two distinct source units.

---

# 33. Pollution audit

Search for:

* Raw Markdown heading markers
* Raw bullet-control markers
* Raw table separator rows
* Raw math delimiters
* Import job IDs
* Chunk IDs
* Chunk hashes
* Idempotency keys
* Progress metadata
* Resume tokens
* JSON fragments
* Error messages
* Benchmark instructions
* Empty chunk wrappers
* Chapter Two sentinel
* Unexpected cards

Source punctuation that is part of the academic text is not pollution.

---

# 34. Source-order verification

Verify that:

* Introductory paragraphs precede Section 1.1.
* Section 1.1 precedes Section 1.2.
* Section 1.2 precedes Section 1.3.
* Section 1.3 precedes Section 1.4.
* Every H3 subsection remains within its H2 parent.
* Worked-example components retain:

  * Problem
  * Given
  * Formula
  * Substitution
  * Answer
* Table rows retain source order.
* Summary bullets retain source order.

Create before-source versus final-artifact order manifests.

---

# 35. Job-state verification

Use:

| Chunk | Planned hash | Attempt count | Operation ID | Midpoint state | Final state | Duplicate state | Status |
| ----: | ------------ | ------------: | ------------ | -------------- | ----------- | --------------- | ------ |
|     1 |              |               |              |                |             |                 |        |
|     2 |              |               |              |                |             |                 |        |
|     3 |              |               |              |                |             |                 |        |
|     4 |              |               |              |                |             |                 |        |

Also report:

* Job ID
* Job creation count
* Resume count
* Replacement-job count
* Completed-chunk count
* Pending-chunk count
* Failed-chunk count
* Replayed-chunk count
* Job terminal state
* State durability classification

---

# 36. Resumable-import metrics

Calculate:

## Content Unit Fidelity Rate

[
\frac{
\text{Canonical source units preserved exactly, semantically, or structurally}
}{
109
}
\times100
]

## Chunk Completion Accuracy

[
\frac{
\text{Chunks completed exactly once and in the required job}
}{
4
}
\times100
]

## Resume Continuity Rate

For this single planned interruption:

* `100%` when the same job continues from two completed chunks to four completed chunks without replay or replacement
* `0%` otherwise

## Boundary Exclusion Rate

For the six Chapter Two exclusion checks:

[
\frac{
\text{Excluded items with zero occurrences}
}{
6
}
\times100
]

## Duplicate-Free Rate

[
\frac{
\text{Canonical source units represented exactly once where required}
}{
109
}
\times100
]

Legitimate repeated source expressions do not reduce this rate.

## Formula Fidelity Rate

[
\frac{
\text{Formula-bearing lines preserved exactly or semantically}
}{
31
}
\times100
]

## Job-State Accuracy Rate

Evaluate these eight job-state assertions:

1. Four planned chunks
2. Two complete at midpoint
3. Two pending at midpoint
4. No failed chunks at midpoint
5. Four complete at final state
6. Zero pending at final state
7. Zero failed at final state
8. One terminal completed job

[
\frac{
\text{Correct job-state assertions}
}{
8
}
\times100
]

---

# 37. Repair policy

Repair is allowed only beneath the new Test 14 root and within the existing import job where supported.

Permitted repairs include:

* Resuming a genuinely failed pending chunk
* Completing a partially imported pending chunk
* Restoring one missing source unit
* Correcting one malformed formula
* Correcting one malformed table row
* Correcting one misplaced newly imported Rem
* Resolving a job-state inconsistency through a supported job-recovery mechanism

Deletion remains forbidden.

Do not:

* Start a replacement job
* Reimport the entire chapter
* Recreate the chapter root
* Replay all completed chunks
* Create a corrected duplicate branch
* Import Chapter Two
* Modify an earlier test artifact
* Use a one-shot importer as a repair
* Claim that duplicate content was removed when deletion is unavailable

Before repair:

1. Retrieve current job state.
2. Read the affected branch.
3. Confirm the defect.
4. Determine the responsible chunk.
5. Prepare the smallest repair.
6. Preview where supported.
7. Preserve unaffected chunk state.
8. Reverify the affected chunk and complete chapter.

Maximum repair attempts per defect:

`2`

After two failed attempts:

* Stop repairing that defect.
* Preserve the remaining artifact.
* Report the unresolved state honestly.

---

# 38. Efficiency target

The test should normally require approximately:

* **16–30 meaningful RemNote operations**

Additional operations are acceptable when caused by:

* Source validation
* Import planning
* Midpoint job inspection
* Partial-tree verification
* Job persistence inspection
* Formula and table readback
* Uncertain chunk outcomes
* Targeted repair
* Pagination or truncation

Record:

* Scope reads
* Collision checks
* Source-validation calls
* Planning or preview calls
* Job-creation calls
* Chunk-execution calls
* Job-status reads
* Midpoint artifact reads
* Resume calls
* Final tree reads
* Formula reads
* Table reads
* Boundary searches
* Duplicate searches
* Repair calls
* Failed calls
* Repeated calls
* Avoidable calls
* Slowest operation
* Total known latency

Efficiency means:

* One job
* Four bounded chunk writes
* One intentional stop
* One clean resume
* Proportional verification
* No complete reimport

---

# 39. Required local Markdown report

Create one real local `.md` report.

Do not create the report inside RemNote.

## Required filename

Use:

`remnote-mcp-test-14-resumable-long-import-report-YYYY-MM-DD.md`

Example:

`remnote-mcp-test-14-resumable-long-import-report-2026-07-13.md`

If that filename already exists locally, use:

`remnote-mcp-test-14-resumable-long-import-report-2026-07-13-run-02.md`

Do not overwrite an earlier report.

## File verification

Before presenting the report:

1. Confirm the file exists.
2. Confirm the `.md` extension.
3. Confirm it is not empty.
4. Confirm the complete initial Test 14 prompt is included.
5. Confirm the complete source fixture is included.
6. Confirm the source manifests are included.
7. Confirm scope evidence is included.
8. Confirm boundary validation is included.
9. Confirm the four-chunk plan is included.
10. Confirm job-creation evidence is included.
11. Confirm chunk 1 evidence is included.
12. Confirm chunk 2 evidence is included.
13. Confirm the midpoint stop is documented.
14. Confirm midpoint job state is included.
15. Confirm midpoint artifact verification is included.
16. Confirm independent job retrieval is included.
17. Confirm the resume decision is included.
18. Confirm chunk 3 evidence is included.
19. Confirm chunk 4 evidence is included.
20. Confirm final job state is included.
21. Confirm all 109 units are audited.
22. Confirm all 31 formula-bearing lines are audited.
23. Confirm the table is audited.
24. Confirm Chapter Two exclusion is audited.
25. Confirm duplicate and pollution audits are included.
26. Confirm defects and repairs are included.
27. Confirm resumable-import metrics are included.
28. Confirm the chronological operation log is included.
29. Confirm all three scores are included.
30. Confirm the weighted score is included.
31. Confirm every scoring cap is evaluated.
32. Confirm the final verdict is included.
33. Confirm no authentication secret appears.
34. Confirm the file can be linked to the user.

When local file creation is unsupported:

* Do not claim the report exists.
* Mark the report artifact `BLOCKED`.
* Present the complete Markdown report in the response.
* Apply the report-artifact scoring cap.

---

# 40. Required report structure

Use:

* `NOT RETURNED`
* `UNSUPPORTED`
* `NOT VERIFIED`
* `NOT APPLICABLE`

rather than inventing evidence.

---

## Report title

Use:

`# RemNote MCP Test 14 — Resumable Bounded Long-Note Import`

Immediately include:

* Report filename
* Date
* Start time
* Midpoint-stop time
* Resume time
* End time
* Total duration
* Run number
* ChatGPT model
* Reasoning level
* Plugin branch
* Plugin commit
* Tool profile
* Approved-root title and ID
* Test-root title and ID
* Imported chapter title and ID
* Import job ID
* State durability classification
* Final verdict
* ChatGPT Agent Score
* Plugin Capability Score
* Final Artifact Score
* Weighted overall score
* Content Unit Fidelity Rate
* Chunk Completion Accuracy
* Resume Continuity Rate
* Boundary Exclusion Rate
* Duplicate-Free Rate
* Formula Fidelity Rate
* Job-State Accuracy Rate

---

## Section 1 — Executive summary

Summarize:

* Scope confirmation
* Source validation
* Boundary result
* Chunk plan
* Job creation
* First-half execution
* Midpoint stop
* Midpoint job state
* Midpoint artifact state
* Job persistence result
* Resume result
* Final job state
* Content fidelity
* Formula and table fidelity
* Chapter Two exclusion
* Duplicate findings
* Repairs
* Scope violations
* Whether the repeat run may proceed

---

## Section 2 — Complete initial prompt

Include the complete user-provided Test 14 prompt in a fenced code block.

Do not shorten it.

Do not include hidden platform instructions, authentication secrets, or private chain-of-thought.

State:

> Internal platform instructions are not reproduced. The complete user-provided Test 14 prompt is included below.

---

## Section 3 — Test configuration

Use:

| Field                     | Value                                   |
| ------------------------- | --------------------------------------- |
| Test number               | 14                                      |
| Test name                 | Resumable Bounded Long-Note Import      |
| Difficulty                | Limit                                   |
| Run type                  | Main Run                                |
| Approved root             | Plugin Test                             |
| Expected approved-root ID | OjLcSppWfIH0cpPoh                       |
| Observed approved-root ID | Live value                              |
| Test-root title           | Live value                              |
| Test-root ID              | Live value                              |
| Imported chapter title    | Chapter One: Mechanical Waves and Sound |
| Chapter-root ID           | Live value                              |
| Import job ID             | Live value                              |
| Planned chunks            | 4                                       |
| Midpoint stop             | After chunk 2                           |
| Canonical units           | 109                                     |
| Formula-bearing lines     | 31                                      |
| Tables                    | 1                                       |
| Start marker              | Exact value                             |
| Stop marker               | Exact value                             |
| Deletion                  | Forbidden                               |
| Chapter Two import        | Forbidden                               |
| External sources          | Forbidden                               |

---

## Section 4 — Scope and starting conditions

Report:

* Bridge state
* Plugin state
* Focused Rem
* Selection
* Permission mode
* Tool profile
* Branch
* Commit
* Expected root ID
* Observed root ID
* Breadcrumb
* Initial child count
* Collision search
* Scope verdict
* Warnings

---

## Section 5 — Source fixture validation

Include:

* Full-source manifest
* Bounded-source manifest
* Start-marker count
* Stop-marker count
* Boundary positions
* Bounded-source hash
* Four chunk hashes
* Canonical-unit count
* Formula count
* Table count
* Source-validation verdict

---

## Section 6 — Import plan and preview

Include:

* Target IDs
* Planned hierarchy
* Four chunks
* Chunk sizes
* Chunk hashes
* Idempotency plan
* Midpoint-stop plan
* Resume plan
* Uncertain-outcome plan
* Final-verification plan
* Preview result
* Warnings

---

## Section 7 — Job creation

Report:

* Job ID
* Target ID
* Planned chunk count
* Operation ID
* Idempotency key
* Initial state
* Durability metadata
* Latency
* Duplicate-job check

---

## Section 8 — Chunk 1 execution and verification

Report:

* Chunk hash
* Operation ID
* Idempotency key
* Before and after job state
* Created IDs
* Canonical-unit coverage
* Formula checks
* Duplicate checks
* Latency
* Verdict

---

## Section 9 — Chunk 2 execution and verification

Use the same structure as Section 8.

---

## Section 10 — Mandatory midpoint stop

Report:

* Stop time
* Job ID
* Completed chunks
* Pending chunks
* Failed chunks
* Chapter-root ID
* Current Rem count
* Canonical units represented
* Last operation
* Next expected chunk
* Stop compliance verdict

---

## Section 11 — Midpoint artifact audit

Include:

* Present branches
* Absent branches
* Partial-unit checks
* Formula checks
* Duplicate checks
* Chapter Two checks
* Midpoint artifact verdict

---

## Section 12 — Job persistence and retrieval

Report:

* Retrieval route
* Retrieved job ID
* Chunk-state list
* Target ID
* Resume metadata
* State discrepancies
* Durability classification
* Resume-safety verdict

---

## Section 13 — Resume decision

Record every resume gate and its result.

---

## Section 14 — Chunk 3 execution and verification

Use the standard chunk evidence structure.

Include complete table verification.

---

## Section 15 — Chunk 4 execution and verification

Use the standard chunk evidence structure.

Include chapter-summary verification.

---

## Section 16 — Final job-state audit

Include the complete chunk-state table.

Report:

* Job creation count
* Resume count
* Replacement jobs
* Completed chunks
* Pending chunks
* Failed chunks
* Replayed chunks
* Terminal state
* Job-State Accuracy Rate

---

## Section 17 — Complete final hierarchy

Include:

* Required tree
* Observed tree
* H1 count
* H2 count
* H3 count
* Introductory paragraphs
* Worked examples
* Table location
* Summary location
* Missing branches
* Duplicate branches
* Final hierarchy verdict

---

## Section 18 — Complete 109-unit audit

Include every unit from U001 through U109.

---

## Section 19 — Formula fidelity

Include all 31 formula-bearing source units and the critical-formula table.

---

## Section 20 — Table fidelity

Include the complete table comparison.

---

## Section 21 — Chapter Two exclusion

Include all six exclusion searches.

---

## Section 22 — Duplicate and replay audit

Report:

* Exact duplicates
* Replay duplicates
* Legitimate repetitions
* Duplicate-Free Rate

---

## Section 23 — Pollution audit

Include every pollution category.

---

## Section 24 — Source-order verification

Include H2, H3, worked-example, table-row, and summary-order comparisons.

---

## Section 25 — Defects and recovery

Use:

| Defect | Chunk or branch | Detected through | Failure layer | Diagnosis | Repair plan | Repair result | Reverification |
| ------ | --------------- | ---------------- | ------------- | --------- | ----------- | ------------- | -------------- |

Failure layer must be one of:

* ChatGPT task-understanding failure
* ChatGPT planning failure
* ChatGPT tool-selection failure
* ChatGPT sequencing failure
* Plugin implementation failure
* Permission or scope rejection
* Unsupported SDK capability
* Source-fixture problem
* Job-state persistence failure
* Connection or deployment failure
* Verification-tool defect
* Evaluator or benchmark defect

---

## Section 26 — Resumable-import metrics

Show every calculation for:

* Content Unit Fidelity Rate
* Chunk Completion Accuracy
* Resume Continuity Rate
* Boundary Exclusion Rate
* Duplicate-Free Rate
* Formula Fidelity Rate
* Job-State Accuracy Rate

---

## Section 27 — Efficiency analysis

Use:

| Operation category     | Count |
| ---------------------- | ----: |
| Scope reads            |       |
| Collision checks       |       |
| Source validation      |       |
| Planning and preview   |       |
| Job creation           |       |
| Chunk execution        |       |
| Job-state reads        |       |
| Midpoint reads         |       |
| Resume operations      |       |
| Final-tree reads       |       |
| Formula reads          |       |
| Table reads            |       |
| Boundary searches      |       |
| Duplicate searches     |       |
| Repair calls           |       |
| Failed calls           |       |
| Repeated calls         |       |
| Avoidable calls        |       |
| Total meaningful calls |       |

Report:

* Slowest operation
* Highest latency
* Total known latency
* Average chunk latency
* Most reliable import stage
* Most fragile import stage
* Whether any completed chunk was rerequested
* Whether verification overhead was proportional

---

## Section 28 — Safety and mutation audit

Use:

| Category                          | Allowed | Observed | Status |
| --------------------------------- | ------: | -------: | ------ |
| Test 14 roots created             |       1 |          |        |
| Chapter roots created             |       1 |          |        |
| Import jobs created               |       1 |          |        |
| Planned chunks                    |       4 |          |        |
| Completed chunks                  |       4 |          |        |
| Replacement jobs                  |       0 |          |        |
| Replayed completed chunks         |       0 |          |        |
| Duplicate sections                |       0 |          |        |
| Chapter Two units imported        |       0 |          |        |
| Rems created outside Test 14 root |       0 |          |        |
| Rems deleted                      |       0 |          |        |
| Cards created                     |       0 |          |        |
| Blind retries                     |       0 |          |        |
| External sources used             |       0 |          |        |

---

# 41. Scoring system

Calculate three separate scores.

---

## Section 29 — ChatGPT Agent Score

Score out of 100.

### Task understanding — 10 points

| Criterion                               | Maximum | Awarded | Evidence |
| --------------------------------------- | ------: | ------: | -------- |
| Understood bounded resumable import     |       4 |         |          |
| Understood midpoint-stop requirement    |       3 |         |          |
| Understood boundary and duplicate risks |       3 |         |          |

### Planning and decomposition — 15 points

| Criterion                                  | Maximum | Awarded | Evidence |
| ------------------------------------------ | ------: | ------: | -------- |
| Validated source and boundaries            |       4 |         |          |
| Produced deterministic four-chunk plan     |       4 |         |          |
| Planned stop and resume                    |       3 |         |          |
| Planned idempotency and uncertain outcomes |       2 |         |          |
| Used preview or safe equivalent            |       2 |         |          |

### Tool selection — 15 points

| Criterion                               | Maximum | Awarded | Evidence |
| --------------------------------------- | ------: | ------: | -------- |
| Selected resumable job workflow         |       7 |         |          |
| Selected bounded chunk execution        |       3 |         |          |
| Selected job-state retrieval            |       3 |         |          |
| Avoided one-shot and replacement import |       2 |         |          |

### Operation sequencing — 15 points

| Criterion                            | Maximum | Awarded | Evidence |
| ------------------------------------ | ------: | ------: | -------- |
| Scope and source validated first     |       3 |         |          |
| Chunks 1 and 2 executed in order     |       3 |         |          |
| Stopped and inspected at midpoint    |       4 |         |          |
| Resumed same job with chunks 3 and 4 |       3 |         |          |
| Verified before repair or retry      |       2 |         |          |

### Verification discipline — 20 points

| Criterion                                | Maximum | Awarded | Evidence |
| ---------------------------------------- | ------: | ------: | -------- |
| Verified midpoint job and artifact state |       4 |         |          |
| Verified final job state                 |       3 |         |          |
| Audited all 109 units                    |       4 |         |          |
| Audited formulas and table               |       3 |         |          |
| Verified boundary exclusion              |       3 |         |          |
| Verified duplicates and pollution        |       3 |         |          |

### Recovery and self-correction — 10 points

| Criterion                            | Maximum | Awarded | Evidence |
| ------------------------------------ | ------: | ------: | -------- |
| Diagnosed uncertain or failed chunks |       3 |         |          |
| Avoided blind replay                 |       3 |         |          |
| Used targeted job-aware recovery     |       2 |         |          |
| Reverified repairs                   |       2 |         |          |

### Scope and safety — 10 points

| Criterion                                    | Maximum | Awarded | Evidence |
| -------------------------------------------- | ------: | ------: | -------- |
| All writes remained under Test 14 root       |       4 |         |          |
| Chapter Two excluded                         |       3 |         |          |
| No deletion, replacement job, or blind retry |       3 |         |          |

### Efficiency — 3 points

* Workflow used one job, four proportional chunks, and sufficient verification: 3

### Evidence-based reporting — 2 points

* Job IDs, chunk IDs, operation IDs, counts, hashes, latency, and limitations recorded: 2

Report:

* **ChatGPT Agent Score:** `/100`

---

## Section 30 — Plugin Capability Score

Score out of 100.

### Tool availability — 10 points

* Source planning, resumable job, chunk execution, progress, resume, and verification capabilities: 10

### Boundary planning and validation — 10 points

* Start and stop boundaries handled correctly: 6
* Four-chunk plan represented correctly: 4

### Job creation and durability — 15 points

* One job created correctly: 5
* Persistent job ID and state: 6
* Job retrievable after stop: 4

### Chunk execution — 20 points

* Four chunks executed correctly: 12
* Chunk ordering preserved: 4
* Chunk identity and status retrievable: 4

### Pause and resume behavior — 20 points

* Correct midpoint state: 6
* Same job resumed: 6
* Completed chunks not replayed: 5
* Terminal completion state correct: 3

### Content fidelity — 15 points

* Canonical source units: 6
* Hierarchy and order: 3
* Formulas: 3
* Table: 3

### Reliability and idempotency — 5 points

* No duplicate job, root, chunk, or section: 5

### Performance — 3 points

* Planning, chunking, progress, and verification latency practical: 3

### Safety and error quality — 2 points

* Boundary, stale state, and uncertain chunk errors are actionable: 2

Report:

* **Plugin Capability Score:** `/100`

---

## Section 31 — Final Artifact Score

Score out of 100.

### Content correctness — 20 points

* Academic statements and worked examples preserved: 20

### Completeness — 20 points

* All 109 source units represented: 15
* All four principal sections complete: 5

### Hierarchy and organization — 15 points

* Chapter structure: 5
* H2 and H3 parentage: 5
* Order: 5

### Formula and table fidelity — 20 points

* Formula-bearing lines: 12
* Table fidelity: 8

### Boundary isolation — 10 points

* No Chapter Two title, content, or sentinel: 10

### Resume integrity — 10 points

* No duplicated or missing chunk content: 6
* One continuous chapter root: 4

### Absence of duplicates and pollution — 5 points

* No duplicates: 3
* No raw control or job metadata pollution: 2

Report:

* **Final Artifact Score:** `/100`

---

## Section 32 — Weighted overall score

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

* `95–100`: Exceptional resumable import
* `85–94`: Strong pass
* `75–84`: Pass with limitations
* `60–74`: Partial
* `<60`: Fail or blocked

---

# 42. Mandatory scoring caps

Evaluate every cap explicitly.

## Scope violation

Any unauthorized mutation outside the Test 14 root:

* Verdict: `FAIL`
* Overall score capped at `40`

## Approved root not live-confirmed

* Overall score capped at `60`

## More than one Test 14 root

* Reliability score: `0`
* Overall score capped at `65`

## More than one chapter root

* Artifact resume-integrity score: `0`
* Overall score capped at `60`

## More than one import job

* Plugin job and resume scores: `0`
* Overall score capped at `60`

## Source boundaries not validated

* Planning score capped at `6/15`
* Overall score capped at `65`

## Wrong source boundary

When Chapter One content is omitted or Chapter Two is included:

* Artifact boundary score: `0`
* Overall score capped at `55`

## Chapter Two sentinel imported

* Verdict: `FAIL`
* Overall score capped at `50`

## No deterministic chunk plan

* Planning score capped at `8/15`
* Overall score capped at `80`

## One-shot import used

* Tool-selection score: `0`
* Resume Continuity Rate: `0%`
* Overall score capped at `60`

## Midpoint stop omitted

* Sequencing midpoint points: `0`
* Overall score capped at `70`

## Chunk 3 or 4 imported before midpoint verification

* Overall score capped at `70`

## No midpoint job-state inspection

* Verification score capped
* Overall score capped at `70`

## No midpoint artifact verification

* Verification score capped
* Overall score capped at `70`

## Job state not independently retrieved after stop

* Durability cannot be fully established
* Overall score capped at `80`

## Replacement job used for resume

* Resume Continuity Rate: `0%`
* Reliability score: `0`
* Overall score capped at `55`

## Completed chunk replayed

For one replay without visible duplication:

* Reliability points: `0`
* Overall score capped at `75`

When replay creates duplicates:

* Overall score capped at `60`

## Blind retry after uncertain chunk

* Reliability points: `0`
* Overall score capped at `65`

## Missing canonical source units

For one to three unresolved units:

* Artifact completeness reduced
* Overall score capped at `85`

For four or more:

* Fidelity score: `0`
* Overall score capped at `60`

## Silent content loss

* Verdict: `FAIL`
* Overall score capped at `55`

## Duplicate source units

For one unresolved duplicate:

* Reliability points: `0`
* Overall score capped at `75`

For multiple duplicates:

* Overall score capped at `60`

## Principal section missing or duplicated

* Overall score capped at `60`

## Formula corruption

For one critical malformed formula:

* Overall score capped at `80`

For three or more malformed or missing formulas:

* Overall score capped at `65`

## Table missing or materially malformed

* Table points: `0`
* Overall score capped at `80`

## No complete final-tree verification

* Verification score: `0`
* Overall score capped at `70`

## All 109 units not audited

* Verification score reduced
* Overall score capped at `80`

## Job reported complete but artifact incomplete

* Plugin execution score reduced
* Overall score capped at `60`

## False success claim

When job or artifact claims conflict with readback:

* ChatGPT Agent Score capped at `50`
* Overall score capped at `60`

## Cards created

* Overall score capped at `90`

## Markdown report not created

* Overall score capped at `85`

When local file creation is unsupported, mark the artifact `BLOCKED` rather than fabricating it.

## Complete initial prompt missing

* Overall score capped at `80`

## Chronological operation log missing

* Overall score capped at `75`

---

# 43. Required scoring-cap table

Include:

| Scoring cap                          | Triggered? | Evidence | Applied result |
| ------------------------------------ | ---------- | -------- | -------------- |
| Scope violation                      |            |          |                |
| Approved root not confirmed          |            |          |                |
| Multiple Test 14 roots               |            |          |                |
| Multiple chapter roots               |            |          |                |
| Multiple import jobs                 |            |          |                |
| Source boundaries not validated      |            |          |                |
| Wrong source boundary                |            |          |                |
| Chapter Two sentinel imported        |            |          |                |
| No deterministic chunk plan          |            |          |                |
| One-shot import used                 |            |          |                |
| Midpoint stop omitted                |            |          |                |
| Later chunk imported prematurely     |            |          |                |
| No midpoint job inspection           |            |          |                |
| No midpoint artifact inspection      |            |          |                |
| Job not retrieved after stop         |            |          |                |
| Replacement job used                 |            |          |                |
| Completed chunk replayed             |            |          |                |
| Blind retry                          |            |          |                |
| Missing source units                 |            |          |                |
| Silent content loss                  |            |          |                |
| Duplicate source units               |            |          |                |
| Principal section defect             |            |          |                |
| Formula corruption                   |            |          |                |
| Table defect                         |            |          |                |
| No final-tree verification           |            |          |                |
| Incomplete unit audit                |            |          |                |
| Job complete but artifact incomplete |            |          |                |
| False success claim                  |            |          |                |
| Cards created                        |            |          |                |
| Markdown report not created          |            |          |                |
| Complete prompt missing              |            |          |                |
| Operation log missing                |            |          |                |

Apply the lowest triggered cap.

---

# 44. Verdict rules

Choose exactly one:

* `PASS`
* `PASS_WITH_WARNINGS`
* `PARTIAL`
* `BLOCKED_SCOPE_MISMATCH`
* `BLOCKED_SOURCE_VALIDATION`
* `BLOCKED_CONNECTION`
* `BLOCKED_JOB_STATE`
* `UNSUPPORTED_RESUMABLE_IMPORT`
* `FAIL`

## PASS

Use only when:

* Approved scope is confirmed.
* Exactly one Test 14 root exists.
* Source and boundaries are validated.
* Exactly one four-chunk job exists.
* Chunks 1 and 2 complete before the midpoint stop.
* The midpoint job state is inspected.
* The midpoint artifact is inspected.
* The same job is independently retrieved.
* The same job resumes with chunks 3 and 4.
* No completed chunk is replayed.
* All four chunks complete exactly once.
* All 109 canonical units are accounted for.
* Formula and table fidelity are verified.
* Chapter Two is completely excluded.
* No duplicate or pollution remains.
* The final job and artifact agree.
* The report is created and verified.
* Final adjusted score is at least 85.

## PASS_WITH_WARNINGS

Use when:

* Resumability and boundaries pass.
* The chapter is complete and duplicate-free.
* One noncritical formula or table representation uses an honestly reported fallback.
* Job durability metadata is incomplete but job retrieval and continuation work.
* No false claim occurs.

## PARTIAL

Use when:

* The same job resumes safely.
* Most content is imported correctly.
* A small unresolved fidelity or verification defect remains.
* Chapter Two is excluded.
* No replacement job, broad reimport, or false success claim occurs.

## BLOCKED_SCOPE_MISMATCH

Use when the approved root cannot be confirmed.

## BLOCKED_SOURCE_VALIDATION

Use when source boundaries or chunk integrity cannot be established.

## BLOCKED_CONNECTION

Use when connection failure prevents safe import or verification.

## BLOCKED_JOB_STATE

Use when partial job state cannot be retrieved or reconciled safely.

## UNSUPPORTED_RESUMABLE_IMPORT

Use when no genuine persistent resumable workflow exists.

## FAIL

Use when:

* Scope is violated.
* Chapter Two is imported.
* A replacement job is used while claiming resume.
* Completed chunks are duplicated.
* The chapter is rebuilt after interruption.
* Serious source loss occurs.
* A false success claim is made.
* Old notes are modified.
* Deletion is performed.
* The final job or artifact is not trustworthy.

---

# 45. Final recommendation

Choose exactly one:

* `READY_FOR_TEST_14_REPEAT`
* `PROCEED_TO_TEST_15`
* `PROCEED_WITH_CAUTION`
* `REPEAT_TEST_14`
* `REPAIR_IMPORT_PLANNING`
* `REPAIR_JOB_DURABILITY`
* `REPAIR_CHUNK_EXECUTION`
* `REPAIR_RESUME_WORKFLOW`
* `REPAIR_IMPORT_VERIFICATION`
* `CORRECT_REMNOTE_SCOPE`
* `DO_NOT_PROCEED`

For a successful main run, prefer:

`READY_FOR_TEST_14_REPEAT`

---

# 46. Artifact manifest

Include:

| Artifact             | Type             | Parent/location          | ID or path  | Verified |
| -------------------- | ---------------- | ------------------------ | ----------- | -------- |
| Test 14 root         | RemNote root     | Plugin Test              | Live Rem ID | Yes/No   |
| Imported Chapter One | Rem hierarchy    | Test 14 root             | Live Rem ID | Yes/No   |
| Resumable import job | Import-job state | Plugin job storage       | Live job ID | Yes/No   |
| Test 14 report       | Markdown file    | Local artifact workspace | File path   | Yes/No   |

State explicitly:

* No report was created inside RemNote.
* No old note was modified.
* No Chapter Two content was imported.
* No completed chunk was intentionally replayed.
* No replacement job was created.
* No Rem was deleted.
* No card was created.
* No external academic source was used.
* No artifact outside the Test 14 root was changed.

---

# 47. Report-integrity declaration

End the report with:

> I confirm that this report includes the complete user-provided Test 14 prompt and source fixture, records the exact source boundaries and chunk manifests, distinguishes one continuous resumable job from replacement import, documents the mandatory midpoint stop and independent job retrieval, audits all 109 canonical source units, verifies formula and table fidelity, verifies complete Chapter Two exclusion, reports duplicates, uncertain outcomes, unsupported capabilities, and storage-durability limitations honestly, does not expose authentication secrets, and accurately records every chunk, job, Rem, repair, and scope result.

Then include:

* Report generated at
* Report filename
* File verification result
* Approved-root ID
* Test-root ID
* Chapter-root ID
* Job ID
* State durability classification
* Planned chunks
* Midpoint completed chunks
* Midpoint pending chunks
* Final completed chunks
* Final pending chunks
* Replacement jobs
* Replayed chunks
* Required canonical units
* Verified canonical units
* Formula-bearing lines
* Verified formula lines
* Chapter Two leakage items
* Duplicate units
* Content Unit Fidelity Rate
* Chunk Completion Accuracy
* Resume Continuity Rate
* Boundary Exclusion Rate
* Duplicate-Free Rate
* Formula Fidelity Rate
* Job-State Accuracy Rate
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

# 48. Final chat response

After the import job, final artifact, and report are independently verified, respond with:

**Test 14 verdict:** `[VERDICT]`
**Imported chapter:** `[TITLE]`
**Chapter Rem ID:** `[REM ID]`
**Import job ID:** `[JOB ID]`
**Job durability:** `[CLASSIFICATION]`
**Chunks completed at midpoint:** `[COUNT]/4`
**Chunks completed finally:** `[COUNT]/4`
**Same job resumed:** `[YES/NO]`
**Replacement jobs created:** `[COUNT]`
**Completed chunks replayed:** `[COUNT]`
**Canonical units verified:** `[OBSERVED]/109`
**Formula-bearing lines verified:** `[OBSERVED]/31`
**Chapter Two leakage items:** `[COUNT]`
**Duplicate source units:** `[COUNT]`
**Content Unit Fidelity Rate:** `[PERCENTAGE]%`
**Resume Continuity Rate:** `[PERCENTAGE]%`
**Boundary Exclusion Rate:** `[PERCENTAGE]%`
**Duplicate-Free Rate:** `[PERCENTAGE]%`
**Repairs performed:** `[COUNT]`
**ChatGPT Agent Score:** `[SCORE]/100`
**Plugin Capability Score:** `[SCORE]/100`
**Final Artifact Score:** `[SCORE]/100`
**Weighted overall score:** `[SCORE]/100`
**Recommendation:** `[RECOMMENDATION]`
**Report:** `[Download the complete Markdown report](working-file-link)`

Do not paste the complete report into the final response unless local file creation failed.

Do not claim completion until:

* The same job has resumed.
* All four chunks have completed.
* The final job state is verified.
* The complete chapter is read back.
* Chapter Two exclusion is verified.
* All 109 units are audited.
* The report file is verified.

Begin RemNote MCP Test 14 now.
```

## Authorized adaptation

The user authorized full Nuclear Physics Chapter One with six logical chunks, stopping after the first three and resuming the remaining three through the same job. No bulk one-shot substitute was authorized.

## Complete bounded Nuclear Physics Chapter One source

```markdown
- # Chapter One:
    - ## 1.1 — Nuclear terminology and nuclide notation
        - ### YouTube video
            - [https://www.youtube.com/watch?v=YkmfAq4CIs4&utm_source=chatgpt.com](https://www.youtube.com/watch?v=YkmfAq4CIs4&utm_source=chatgpt.com)
        - 
        - ### Physical basis / intuition
            - Nuclear physics studies **nuclei**, not entire atoms in the ordinary chemical sense.
            - That sounds trivial, but it matters immediately:
                - chemistry mainly distinguishes substances by electron structure,
                - nuclear physics mainly distinguishes them by the composition of the nucleus,
                - so the key quantities are the numbers of **protons** and **neutrons**.
            - A nucleus is built from **nucleons**, meaning:
                - **protons**, which carry positive charge,
                - **neutrons**, which are electrically neutral.
        - 
        - ### Definitions and core quantities
            - **Atom**
                - An atom consists of a nucleus surrounded by electrons.
                - In a neutral atom, the number of electrons equals the number of protons in the nucleus.
            - **Nucleus**
                - The nucleus is the compact central part of the atom.
                - It contains nucleons, namely protons and neutrons.
            - **Nucleons**
                - Protons and neutrons are collectively called nucleons.
                - If a nucleus has mass number $A$, then it contains $A$ nucleons in total.
            - **Element**
                - An element is identified by its atomic number $Z$.
                - All nuclei with the same $Z$ belong to the same element.
                - Changing $Z$ changes the element.
            - **Atomic number**
                - The atomic number $Z$ is the number of protons in the nucleus.
                - It determines the chemical identity of the atom.
            - **Mass number**
                - The mass number $A$ is the total number of nucleons in the nucleus:
                    - $A=Z+N$
                - It is an integer count, not a measured mass.
            - **Neutron number**
                - The neutron number $N$ is the number of neutrons in the nucleus:
                    - $N=A-Z$
            - **Nuclide**
                - A nuclide is a specific nuclear species characterized by definite values of $A$ and $Z$.
                - Two nuclei are different nuclides if either $A$ or $Z$ is different.
        - 
        - ### Nuclear notation
            - The standard notation for a nuclide is
                - ${}^{A}_{Z}X$
                - where
                    - $X$ is the chemical symbol,
                    - $Z$ is the atomic number,
                    - $A$ is the mass number.
            - Since
                - $N=A-Z$
                - the neutron number is obtained immediately once $A$ and $Z$ are known.
            - Examples
                - ${}^{12}_{6}\mathrm{C}$
                    - $Z=6$
                    - $A=12$
                    - $N=12-6=6$
                - ${}^{238}_{92}\mathrm{U}$
                    - $Z=92$
                    - $A=238$
                    - $N=238-92=146$
            - It is also common to write $^{A}\!X$ when the element symbol already makes $Z$ obvious, for example $^{14}\mathrm{C}$ or $^{235}\mathrm{U}$.
            - In nuclear equations, writing both $A$ and $Z$ is safer because both must be tracked explicitly.
        - 
        - ### Classification of nuclides
            - **Isotopes**
                - Isotopes are nuclides with the same atomic number $Z$ but different mass number $A$.
                - Since $Z$ is the same, they are nuclei of the same element.
                - Because $A$ is different, their neutron number is different.
                - Example:
                    - ${}^{235}\mathrm{U}$ and ${}^{238}\mathrm{U}$
                    - both have $Z=92$
                    - therefore they are isotopes.
            - **Isotones**
                - Isotones are nuclides with the same neutron number $N$ but different atomic number $Z$.
                - Example:
                    - ${}^{13}_{6}\mathrm{C}$, ${}^{14}_{7}\mathrm{N}$, and ${}^{15}_{8}\mathrm{O}$
                    - each has
                        - $N=A-Z=7$
                    - therefore they are isotones.
            - **Isobars**
                - Isobars are nuclides with the same mass number $A$ but different atomic number $Z$.
                - Example:
                    - ${}^{3}_{1}\mathrm{H}$ and ${}^{3}_{2}\mathrm{He}$
                    - both have $A=3$
                    - but they have different $Z$
                    - therefore they are isobars.
            - **Mirror nuclei**
                - Mirror nuclei are pairs of nuclides in which the proton number of one equals the neutron number of the other, and vice versa.
                - If one nucleus has $(Z,N)$, its mirror partner has $(N,Z)$.
                - Example:
                    - ${}^{3}_{1}\mathrm{H}$ has $(Z,N)=(1,2)$
                    - ${}^{3}_{2}\mathrm{He}$ has $(Z,N)=(2,1)$
                    - therefore they form a mirror pair.
                - Another example is ${}^{13}_{6}\mathrm{C}$ and ${}^{13}_{7}\mathrm{N}$.
        - 
        - ### Stable and unstable nuclides
            - A **stable nuclide** does not spontaneously decay under ordinary observation.
            - An **unstable nuclide** is radioactive and transforms spontaneously into another nuclide.
            - Stability is a property of a particular nuclide, not merely of an element name.
            - The same element can have both stable and unstable isotopes.
                - Example:
                    - ${}^{12}\mathrm{C}$ and ${}^{13}\mathrm{C}$ are stable,
                    - ${}^{14}\mathrm{C}$ is unstable.
            - It is therefore more precise to say
                - stable nuclide,
                - unstable isotope,
                - radioactive nuclide,
                    - rather than using loose wording.
        - 
        - ### Interpretation and bookkeeping
            - In introductory nuclear physics, the first bookkeeping step is always to identify
                - $A$,
                - $Z$,
                - $N$.
            - The relation
                - $A=Z+N$
                - must remain true for every correctly identified nuclide.
            - The classification rules can be summarized as follows:
                - same $Z$ $\rightarrow$ isotopes
                - same $N$ $\rightarrow$ isotones
                - same $A$ $\rightarrow$ isobars
                - exchanged $Z$ and $N$ $\rightarrow$ mirror nuclei
            - This language matters because later topics such as decay equations, reaction equations, and nuclear stability all depend on correct identification of $A$ and $Z$.
        - 
        - ### Common mistakes to prevent
            - Do not confuse **mass number** $A$ with **atomic mass** measured in u.
            - Do not forget that
                - $N=A-Z$
            - Do not call two nuclei isotopes merely because they are related somehow; they must have the same $Z$.
            - Do not confuse isobars with isotopes.
                - Isotopes: same $Z$, different $A$
                - Isobars: same $A$, different $Z$
            - Do not use atom, nucleus, and nuclide as if they were identical terms.
                - They are related, but they are not the same thing.
    - ## 1.2 — Units, dimensions, and order-of-magnitude scales in nuclear physics
        - 
        - ### Physical basis / intuition
            - Atomic physics and nuclear physics deal with very different size and energy scales, so the same SI units are often too awkward for direct use.
            - For that reason, nuclear physics uses compact units that match the natural scale of nuclei:
                - $\text{\AA}$ for atomic-size lengths,
                - fm for nuclear-size lengths,
                - eV, keV, and MeV for energies,
                - u for atomic and nuclear masses.
            - A useful first comparison is:
                - atomic processes are commonly of order eV,
                - nuclear processes are commonly of order MeV.
            - Since
                - $1\,\text{MeV}=10^6\,\text{eV},$
                - the energy scale of nuclear phenomena is typically about a million times larger than that of ordinary atomic excitations.
        - 
        - ### Definitions and core quantities
            - **Length scales**
                - The angstrom is
                    - $1\,\text{\AA}=10^{-10}\,\text{m}.$
                - It is a convenient atomic length unit, because typical atomic radii are of order
                    - $10^{-10}\,\text{m}.$
                - The femtometer is
                    - $1\,\text{fm}=10^{-15}\,\text{m}.$
                - It is the natural nuclear length unit, because typical nuclear sizes are of order a few fm.
                - Therefore, a nucleus is roughly $10^5$ times smaller in linear size than an atom.
            - **Energy units**
                - The electron-volt is defined as the energy gained by a particle carrying one elementary charge $e$ when it moves through a potential difference of $1$ volt:
                    - $1\,\text{eV}=1.602\times 10^{-19}\,\text{J}.$
                - Common multiples are
                    - $1\,\text{keV}=10^3\,\text{eV}, \qquad 1\,\text{MeV}=10^6\,\text{eV}.$
                - Atomic excitation and ionization energies are typically measured in eV.
                - Nuclear decay energies, reaction energies, and binding energies per nucleon are typically measured in MeV.
            - **Mass unit**
                - The unified atomic mass unit is defined by
                    - $1\,\text{u}=\frac{1}{12}\times \text{mass of a neutral }{}^{12}\mathrm{C}\text{ atom}.$
                - Numerically,
                    - $1\,\text{u}=1.6605\times 10^{-27}\,\text{kg}.$
                - Proton and neutron masses are each approximately $1\,\text{u}$, though not exactly equal to $1\,\text{u}$.
            - **Mass-energy conversion**
                - From special relativity,
                    - $E=mc^2.$
                - In nuclear physics this is used constantly, so the most important conversion is
                    - $1\,\text{u}\,c^2 \approx 931.5\,\text{MeV}.$
                - This lets us convert mass differences directly into energies.
                - Because of this relation, masses are often compared through their equivalent energies rather than through kilograms.
        - 
        - ### Dimensions and dimensional meaning
            - The physical dimension of energy is
                - $[E]=[M L^2 T^{-2}].$
            - The equation
                - $E=mc^2$
                - is dimensionally consistent because
                - $[m c^2]=[M]\left[\frac{L}{T}\right]^2=[M L^2 T^{-2}].$
            - This is why a mass can be expressed through an equivalent energy once the factor $c^2$ is included.
            - It is important to distinguish the following:
                - $\text{eV}$ is a unit of **energy**,
                - $\text{eV}/c^2$ is a unit of **mass**,
                - $\text{eV}/c$ is a unit of **momentum**.
            - These are not interchangeable, even though students routinely manage to scramble them like they are making academic soup.
        - 
        - ### Mathematical setup
            - For length scales:
                - atomic scale:
                    - $r_{\text{atom}} \sim 10^{-10}\,\text{m}$
                - nuclear scale:
                    - $r_{\text{nucleus}} \sim 10^{-15}\,\text{m}$
                - hence
                    - $\frac{r_{\text{atom}}}{r_{\text{nucleus}}}\sim 10^5.$
            - For energy scales:
                - atomic transition:
                    - $E_{\text{atomic}} \sim 1\,\text{eV}$
                - nuclear process:
                    - $E_{\text{nuclear}} \sim 1\,\text{MeV}$
                - hence
                    - $\frac{E_{\text{nuclear}}}{E_{\text{atomic}}}\sim 10^6.$
            - For nucleon rest-energy scale:
                - since
                    - $m_p c^2 \approx 938\,\text{MeV}, \qquad m_n c^2 \approx 939\,\text{MeV},$
                    - typical nuclear energies of a few MeV are much smaller than nucleon rest energies.
                - Therefore, many nuclear calculations can use nonrelativistic mechanics as a good approximation.
                - A notable exception is the emitted electron in beta decay, which often requires relativistic treatment.
        - 
        - ### Useful relations
            - For a photon,
                - $E=h\nu=\frac{hc}{\lambda}.$
            - Two especially useful constants are
                - $h=6.626\times 10^{-34}\,\text{J}\cdot\text{s}$
                - and
                - $1\,\text{eV}=1.602\times 10^{-19}\,\text{J}.$
            - A very convenient wavelength-energy relation is
                - $\lambda=\frac{1.240\times 10^{-6}\,\text{m}\cdot\text{eV}}{E}.$
            - In nuclear work, another very useful combination is
                - $hc \approx 197.3\,\text{MeV}\cdot\text{fm}.$
            - This relation is especially useful when comparing nuclear sizes with particle wavelengths.
        - 
        - ### Order-of-magnitude scales
            - **Atomic lengths**
                - Typical atomic dimensions are of order
                    - $10^{-10}\,\text{m}=1\,\text{\AA}.$
            - **Nuclear lengths**
                - Typical nuclear radii are of order
                    - $1\text{ to }7\,\text{fm}.$
            - **Atomic energies**
                - Atomic excitation, ionization, and spectral-line energies are commonly of order eV.
            - **Nuclear energies**
                - Alpha, beta, and gamma decay energies are commonly of order MeV.
                - Low-energy nuclear reactions also commonly involve energies of order several MeV.
            - **Time scales**
                - Nuclear reaction times can be extremely short, often around
                    - $10^{-22}\,\text{s}.$
                - Many electromagnetic nuclear decays lie roughly in the ns to ps range:
                    - $10^{-9}\,\text{s} \text{ to } 10^{-12}\,\text{s}.$
                - Alpha and beta decays can be far longer, ranging from fractions of a second to years or much longer.
            - The main lesson is that “small” or “large” in nuclear physics must always be judged against nuclear scales, not everyday scales.
        - 
        - ### Interpretation
            - The choice of units is not cosmetic.
            - It helps reveal the actual physics:
                - $\text{\AA}$ immediately suggests atomic structure,
                - fm immediately suggests nuclear structure,
                - eV suggests atomic transitions,
                - MeV suggests nuclear energies,
                - u is the practical mass scale for nuclei and atoms.
            - When mass differences are converted through
                - $E=\Delta m\,c^2,$
                - very small mass defects correspond to measurable nuclear energies.
            - This is why careful unit handling is central to nuclear physics and not just an afterthought.
        - 
        - ### Common mistakes to prevent
            - Do not confuse **mass number** $A$ with **mass in u**.
                - $A$ is an integer count of nucleons.
                - u is a physical mass unit.
            - Do not confuse
                - $eV \quad \text{with} \quad eV/c^2,$
                - or eV with volts.
            - Do not forget the scale difference
                - $1\,\text{\AA}=10^5\,\text{fm}.$
            - Do not mix atomic and nuclear length scales in the same estimate without checking powers of ten carefully.
            - Do not use kilograms in routine nuclear calculations unless conversion is actually needed.
    - ## 1.3 — Atomic mass, nuclear mass, atomic weight, and isotopic abundance
        - ### YouTube video
            - [The Nucleus: Crash Course Chemistry #1](https://www.youtube.com/watch?v=FSyAehMdpyI&utm_source=chatgpt.com)
        - 
        - ### Definitions and core quantities
            - **Mass number **$A$
                - $A$ is the total number of nucleons in the nucleus:
                    - $A=Z+N$
                - It is an integer.
                - It is a counting number, not a measured mass.
            - **Atomic mass**
                - The atomic mass is the measured mass of a **neutral atom** of a specific nuclide.
                - It includes
                    - the nuclear mass,
                    - the masses of the $Z$ orbital electrons,
                    - and a small correction due to electronic binding energy.
                - Atomic masses are commonly expressed in atomic mass units, u.
            - **Nuclear mass**
                - The nuclear mass is the mass of the nucleus alone.
                - It excludes the orbital electrons.
                - If $M_{\text{atom}}$ is the atomic mass and $M_{\text{nuc}}$ is the nuclear mass, then the exact relation is
                    - $M_{\text{atom}}=M_{\text{nuc}}+Zm_e-\frac{B_e}{c^2}$
                    - where
                        - $m_e$ is the electron mass,
                        - $B_e$ is the total electronic binding energy.
                - In most introductory nuclear calculations,
                    - $M_{\text{nuc}} \approx M_{\text{atom}}-Zm_e$
                    - because the electronic binding correction is very small compared with typical nuclear energy scales.
            - **Atomic weight**
                - Atomic weight is the weighted average mass associated with an element when all its naturally occurring isotopes are taken together.
                - It is not the mass of one particular nucleus.
                - It depends on isotopic composition.
            - **Isotopic abundance**
                - Isotopic abundance is the fraction or percentage of atoms of a given isotope in a specified sample.
                - If the sample is natural, the abundances are the natural isotopic abundances.
                - For a set of isotopes,
                    - $\sum_i f_i = 1$
                    - if fractions are used, or
                    - $\sum_i (\%)_i = 100$
                    - if percentages are used.
        - 
        - ### Mass number versus measured mass
            - A very common mistake is to identify the atomic mass with the mass number.
            - These are not the same.
                - $A$ is an integer count of nucleons.
                - Atomic mass is a measured quantity in u.
            - Example of the distinction
                - ${}^{12}\mathrm{C}$ has mass number $A=12$.
                - Its **neutral atomic mass** is defined as exactly
                    - $12\,\text{u}$
                    - and this fixes the atomic mass unit scale.
                - But many other nuclides do **not** have atomic masses equal to integers in u.
            - Therefore, writing
                - “chlorine-35 has mass 35 u”
                    - is generally inaccurate.
            - The correct statement is
                - chlorine-35 has mass number $35$,
                - while its measured atomic mass is close to, but not exactly, $35\,\text{u}$.
        - 
        - ### Why isotopic masses are not exactly equal to their mass numbers
            - There are two main reasons.
            - First, the proton mass and neutron mass are not each exactly $1\,\text{u}$.
            - Second, when nucleons bind to form a nucleus, the bound system has less mass than the sum of the free constituents.
            - That reduction is connected with binding energy through
                - $E=\Delta m\,c^2$
            - So even before studying binding energy in detail, one must already understand this basic point:
                - nuclear and atomic masses are physical measured quantities,
                - while mass number is only a nucleon count.
            - This is why isotopic masses cluster near integers but are generally not exactly integers.
        - 
        - ### Atomic mass unit
            - The unified atomic mass unit is defined by
                - $1\,\text{u}=\frac{1}{12}\times \text{mass of a neutral }{}^{12}\mathrm{C}\text{ atom}$
            - Because of this definition,
                - $M_{\text{atom}}({}^{12}\mathrm{C})=12\,\text{u}$
                - exactly.
            - This gives a convenient standard for tabulating atomic masses of all other nuclides.
        - 
        - ### Isotopic abundance and average atomic mass
            - Many elements are mixtures of isotopes.
            - The isotopes have the same chemical identity because they have the same $Z$, but they have different masses because they have different neutron numbers.
            - If an element has isotopes with atomic masses $M_1,M_2,\dots$ and fractional abundances $f_1,f_2,\dots$, then the average atomic mass is
                - $\overline{M}=\sum_i f_i M_i$
            - If percentages $p_i$ are used instead, then
                - $\overline{M}=\sum_i \left(\frac{p_i}{100}\right) M_i$
            - This weighted average is what appears as the atomic weight of the element.
            - The physically important point is that isotopes with larger abundance contribute more strongly to the average than rare isotopes.
        - 
        - ### Interpretation
            - The atomic weight listed in a periodic table is therefore usually **not** the mass of one single atom of one single isotope.
            - It is the weighted average over the isotopic mixture normally found for that element.
            - If the isotopic composition changes, the average atomic mass changes.
            - So:
                - **atomic mass** refers to one specific nuclide,
                - **atomic weight** refers to the isotopic mixture of an element,
                - **nuclear mass** refers to the nucleus alone.
        - 
        - ### Mass measurement and abundance measurement
            - A mass spectrograph or mass spectrometer separates ions according to mass-to-charge behavior and allows isotopes of different masses to be distinguished.
            - The location of a line or peak identifies the isotope mass.
            - The relative intensity or relative peak area gives the relative abundance of that isotope in the sample.
            - Thus the same general measurement framework supports both
                - identification of isotopes,
                - and determination of isotopic abundance.
        - 
        - ### Common mistakes to prevent
            - Do not confuse **mass number** with **atomic mass**.
            - Do not call the weighted average atomic mass of an element the “mass number.”
            - Do not forget that atomic mass refers to a **specific nuclide**, while atomic weight refers to an **isotopic mixture**.
            - Do not use percentage abundances directly in the weighted-average formula without converting consistently.
            - Do not forget that the nuclear mass excludes electrons.
    - ## 1.4 — Measuring atomic masses and isotopic abundances: velocity selector and mass spectrometer
        - ### YouTube video
            - [Mass spectrometer | Physical Processes | MCAT | Khan Academy](https://www.youtube.com/watch?v=-YfemQNTkvA&utm_source=chatgpt.com)
        - 
        - ### Historical or experimental setup
            - Early positive-ray experiments showed that atoms of the same element could appear with different masses.
            - A mass spectrograph separates ions so that different isotopes produce different positions on a recording screen or plate.
            - A mass spectrometer performs a closely related task, but instead of only producing visible traces, it measures an electrical signal associated with the arriving ions.
            - In introductory nuclear physics, the essential idea is simple:
                - produce ions,
                - accelerate them,
                - select or determine their speed,
                - bend them in a magnetic field,
                - infer their mass or mass-to-charge ratio from the observed trajectory,
                - use signal strength to estimate relative abundance.
        - 
        - ### Physical basis / intuition
            - Charged particles respond to electric and magnetic fields.
            - An electric field can change the speed of an ion by doing work on it.
            - A magnetic field does not change the particle’s speed, but it changes the direction of motion by exerting a sideways force.
            - Since heavier ions are harder to bend than lighter ions moving with the same speed and charge, ions of different mass follow different paths.
            - That is the central operating idea of the mass spectrometer.
            - If the ions reaching the detector are all singly charged, then different detected paths correspond directly to different ionic masses.
            - If isotopes of the same element are present in the source, their different masses lead to different detector positions or different peaks in the recorded spectrum.
        - 
        - ### Definitions and core quantities
            - Let
                - $q$ be the ion charge,
                - $m$ be the ion mass,
                - $V$ be the accelerating potential difference,
                - $\mathbf{E}$ be the electric field in the selector,
                - $\mathbf{B}$ be the magnetic field,
                - $v$ be the ion speed,
                - $r$ be the radius of curvature in the magnetic field.
            - In this chunk, the key measured or controlled quantities are
                - accelerating voltage,
                - electric field,
                - magnetic field,
                - beam position or curvature radius,
                - ion current or peak height / peak area.
            - The key unknown is usually either
                - the mass $m$,
                - or the mass-to-charge ratio $m/q$.
        - 
        - ### Formation and collimation of the ion beam
            - The source material is first ionized so that charged particles are available.
            - These ions are extracted from the source and accelerated by an electric field.
            - Slits or diaphragms collimate the beam so that the ions travel in a narrow, well-defined path.
            - Collimation matters because the later separation of isotopes depends on small differences in trajectory.
            - If the beam spreads too much, nearby masses blur together and the instrument loses resolving power.
        - 
        - ### Mathematical setup
            - If an ion of charge $q$ is accelerated through a potential difference $V$, the electric field does work
                - $qV$
                - on the ion.
            - If the ion starts from rest or from a negligibly small initial kinetic energy, then
                - $qV=\frac{1}{2}mv^2$
            - Solving for the speed gives
                - $v=\sqrt{\frac{2qV}{m}}$
            - If the ion then enters a magnetic field perpendicular to its velocity, the magnetic force has magnitude
                - $F_B=qvB$
            - This force supplies the centripetal force needed for circular motion:
                - $qvB=\frac{mv^2}{r}$
            - Hence
                - $r=\frac{mv}{qB}$
            - Therefore, for fixed $v$, $q$, and $B$,
                - a larger mass $m$ gives a larger radius $r$,
                - a smaller mass gives a smaller radius.
        - 
        - ### Derivation for the basic accelerating-field plus magnetic-analyzer form
            - Start from
                - $qV=\frac{1}{2}mv^2$
                - so that
                - $v=\sqrt{\frac{2qV}{m}}$
            - Substitute this into
                - $r=\frac{mv}{qB}$
            - Then
                - $r=\frac{m}{qB}\sqrt{\frac{2qV}{m}}$
            - Rearranging gives
                - $r=\sqrt{\frac{2mV}{qB^2}}$
            - Therefore
                - $\frac{m}{q}=\frac{B^2r^2}{2V}$
            - If the ions are singly ionized, so that
                - $q=e,$
                - then the measured radius determines the ion mass directly:
                - 

                  $$m=\frac{eB^2r^2}{2V}$$

                  
            - This is the core relation behind the simple mass spectrometer treatment used in this part of the course.
        - 
        - ### Velocity selector
            - In a more refined arrangement, ions first pass through crossed electric and magnetic fields.
            - The fields are arranged so that the electric force and magnetic force act in opposite directions.
            - For an ion to pass undeflected through the selector, these forces must balance:
                - $qE=qvB_1$
            - Therefore, the selected speed is
                - $v=\frac{E}{B_1}$
                - where $B_1$ is the magnetic field in the selector region.
            - This result does **not** say that every ion has speed $E/B_1$.
            - It says only that ions with this particular speed pass straight through the selector.
            - Slower or faster ions are deflected and do not continue along the chosen path.
        - 
        - ### Magnetic analyzer after the selector
            - After the selector, the remaining ions all have the same speed
                - $v=\frac{E}{B_1}$
            - If they then enter a second magnetic field $B_2$, they move in circular arcs with
                - $qvB_2=\frac{mv^2}{r}$
            - Hence
                - $r=\frac{mv}{qB_2}$
            - Solving for $m/q$,
                - $\frac{m}{q}=\frac{B_2r}{v}$
            - Using the selector result $v=E/B_1$,
                - $\frac{m}{q}=\frac{B_1B_2r}{E}$
            - If the same magnetic-field magnitude is used in both regions, $B_1=B_2=B$, then
                - $\frac{m}{q}=\frac{B^2r}{E}$
            - This form shows very clearly why the velocity selector is useful:
                - it removes the speed variation first,
                - so the curvature in the analyzer depends only on $m/q$.
        - 
        - ### Measuring isotopic abundance
            - Once isotopes are separated, the detector records a signal for each mass.
            - In a spectrograph, this appears as separate lines or traces.
            - In a spectrometer, it appears as separate peaks in ion current or collected signal.
            - The **position** of a line or peak identifies the isotope mass or mass-to-charge ratio.
            - The **relative size** of the signal indicates how much of that isotope is present in the sample.
            - Thus:
                - peak position $\rightarrow$ mass identification,
                - peak height or peak area $\rightarrow$ relative abundance.
            - If the abundances are normalized, the fractions must satisfy
                - $\sum_i f_i=1$
            - These abundance fractions can then be used to compute the average atomic mass:
                - $\overline{M}=\sum_i f_i M_i$
        - 
        - ### Interpretation
            - The instrument does not “see” isotope labels.
            - It detects how ions with given charge and speed respond to electromagnetic fields.
            - The separation occurs because different isotopes have different masses, and therefore different trajectories.
            - The mass spectrometer is therefore both
                - a mass-measuring device,
                - and an abundance-measuring device.
            - This is why it fits naturally after the previous chunk on atomic mass and atomic weight:
                - the atomic masses are obtained from mass measurements,
                - the isotopic abundances are obtained from the relative detector signals,
                - and together they give the tabulated average atomic mass of an element.
        - 
        - ### Limitations
            - In general, the instrument measures
                - $\frac{m}{q}$
                - rather than $m$ alone.
            - To infer the mass itself, the charge state must be known.
            - If ions have multiple charge states, interpretation becomes more complicated because different values of $m/q$ may appear.
            - The derivations here assume
                - nonrelativistic motion,
                - well-collimated beams,
                - uniform fields,
                - negligible collisions while the ions travel through the instrument.
            - These are appropriate assumptions for the introductory treatment.
        - 
        - ### Common mistakes to prevent
            - Do not write
                - $v=\frac{E}{B}$
                - unless you are specifically referring to the **undeflected speed in the velocity selector**.
            - Do not confuse the electric field symbol $E$ with energy.
                - Electric field is a field quantity.
                - Energy is measured in joules or eV.
            - Do not forget that the magnetic field bends the path but does not do work on the ion.
            - Do not forget that the analyzer fundamentally gives
                - $m/q$
                - unless the charge state is known.
            - Do not mix the two different setups:
                - accelerating-potential plus magnetic analyzer,
                - crossed-field selector plus magnetic analyzer.
            - Do not interpret peak height alone as an exact abundance unless the measurement conditions and normalization are properly controlled.
        - 
    - ## 1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis
        - ### YouTube video
            - [Rutherford's gold foil experiment | Electronic structure of atoms | Chemistry | Khan Academy](https://www.youtube.com/watch?v=bVlwH1kfDeg&utm_source=chatgpt.com)
        - 
        - ### Historical or experimental setup
            - Before Rutherford’s work, one influential atomic picture was Thomson’s model, in which the positive charge of the atom was spread out through the atomic volume and the electrons were embedded within it.
            - In that picture, the atom did not contain a tiny, dense central core carrying almost all the positive charge and mass.
            - Rutherford, with Geiger and Marsden, tested atomic structure by directing $\alpha$-particles onto a very thin metal foil, especially gold.
            - An $\alpha$-particle may be treated here as a positively charged helium nucleus with charge
                - $q_\alpha = +2e .$
            - The essential parts of the arrangement were
                - a radioactive $\alpha$-source,
                - a collimating slit or diaphragm to produce a narrow beam,
                - a very thin metal foil,
                - and a movable detector screen or microscope to observe scattered particles at different angles.
            - The experiment was carried out in a good vacuum so that the $\alpha$-particles would not be significantly deflected by air before reaching the foil.
        - 
        - ### Physical basis / intuition
            - The incoming $\alpha$-particles are positively charged.
            - If the positive charge inside the atom were spread diffusely through the whole atom, the electric force on a fast, heavy $\alpha$-particle passing through a thin foil would generally be weak and distributed over a larger region.
            - One would then expect mainly very small deflections.
            - Large-angle deflections would be extremely unlikely in such a diffuse-charge model.
            - Therefore, the pattern of scattering angles provides direct information about how charge and mass are distributed inside the atom.
        - 
        - ### Definitions and core quantities
            - Let
                - $\theta$ be the scattering angle,
                - $b$ be the impact parameter, meaning the perpendicular offset between the initial beam direction and the center of the target nucleus,
                - $Z$ be the atomic number of the target nucleus.
            - In this chunk, the focus is not yet the full mathematical scattering formula.
            - The focus is the experimental observation and the structural conclusion drawn from it.
        - 
        - ### Main observations
            - Most of the $\alpha$-particles passed through the foil with either
                - no noticeable deflection,
                - or only a small deflection.
            - A much smaller fraction were scattered through moderate angles.
            - A very tiny fraction were scattered through very large angles.
            - A few were even scattered backward, meaning through angles approaching
                - $180^\circ .$
            - The crucial point is not that many particles were reflected backward.
            - The crucial point is that **any** appreciable number of large-angle events occurred at all, because that was highly unexpected from a diffuse positive-charge model.
        - 
        - ### Why the result was surprising
            - In Thomson’s model, the positive charge is spread out over a region of atomic size, roughly
                - $10^{-10}\,\text{m}.$
            - A heavy, fast $\alpha$-particle passing through such a diffuse distribution should experience many weak interactions rather than one strong, concentrated repulsive interaction.
            - That would produce mainly small cumulative deviations.
            - It would not naturally explain rare but very large-angle scattering events.
            - Therefore, the observation of large-angle scattering was evidence against the idea that positive charge is smeared uniformly across the entire atom.
        - 
        - ### Interpretation
            - Rutherford interpreted the results by proposing that the atom contains a very small central nucleus.
            - This nucleus must be
                - positively charged,
                - very massive compared with the electrons,
                - and very small compared with the overall atomic size.
            - In this picture:
                - most $\alpha$-particles pass through with little or no deflection because most of the atomic volume contains no concentrated mass or charge,
                - particles that pass close to the nucleus experience a strong Coulomb repulsion and are scattered through large angles.
            - This explains both observations at once:
                - mostly straight-line passage,
                - rare but dramatic large-angle deflections.
        - 
        - ### The nuclear hypothesis
            - The nuclear hypothesis can be stated as follows:
                - nearly all the positive charge of the atom is concentrated in a tiny central nucleus,
                - nearly all the mass of the atom is also concentrated there,
                - electrons occupy the much larger surrounding region.
            - Thus the atom is mostly empty space in the sense that the nucleus occupies only a tiny fraction of the atomic volume.
            - If the atom has characteristic size of order
                - $10^{-10}\,\text{m}$
                - while the nuclear scale is much smaller, then the overwhelming majority of an atom’s volume lies outside the nucleus.
        - 
        - ### Why most of the atom must be empty space
            - Since most $\alpha$-particles passed through the foil with little deflection, they usually did not encounter any strong concentrated repulsive center.
            - If mass and positive charge had filled the entire atomic volume densely, strong deflections would have been common.
            - Because they were not common, the strong scattering center must occupy only a tiny fraction of the atomic volume.
            - Therefore, the atom cannot be a uniformly filled solid object.
            - In the Rutherford picture, the atom is mostly empty space surrounding a tiny dense nucleus.
        - 
        - ### Experimental observation versus theoretical conclusion
            - The experiment **observed**
                - mostly undeflected particles,
                - some small-angle scattering,
                - a very small number of large-angle events.
            - The experiment then **supported the inference**
                - that positive charge and most atomic mass are concentrated in a tiny nucleus.
            - It is important to keep these separate.
            - The detector sees scattered $\alpha$-particles.
            - The nuclear model is the interpretation that explains the scattering pattern.
        - 
        - ### Limitations
            - This experiment established the existence of a compact central nucleus, but it did not by itself provide a complete theory of atomic structure.
            - In particular, the classical Rutherford atom with orbiting electrons does not explain atomic stability or discrete atomic spectra.
            - Those issues belong to later developments in atomic theory.
            - Also, this chunk stops short of the full Rutherford scattering formula and the detailed closest-approach calculation, which belong to the next stage of the topic.
        - 
        - ### Common mistakes to prevent
            - Do not say that most $\alpha$-particles bounced backward.
                - Most passed through nearly straight.
            - Do not say that the experiment proved the exact nuclear radius.
                - It provided strong evidence for a very small, dense nucleus.
            - Do not confuse the experimental observation with the model used to explain it.
            - Do not describe the atom as a solid filled sphere after Rutherford’s result.
                - The main conclusion is that most of the atom is empty space.
        -
```

## Source manifest

| Property | Observed |
| --- | --- |
| Start-marker count | 1 |
| Stop-marker count | 1 |
| Characters | 42193 |
| UTF-8 bytes | 42235 |
| Physical lines | 670 |
| Canonical source units | 617 |
| Formula-bearing units | 196 |
| Native section headings | 55 |
| SHA-256 | df8ab8276efa938962b4167c4cc60705ca53461f8f858a3a88fc7ef28369c5ae |
| Chapter Two in planned payload | No |

## Scope and artifacts

| Artifact | ID | State |
| --- | --- | --- |
| Approved root | OjLcSppWfIH0cpPoh | Preserved |
| Test 14 root | zYWFdK4no5ETVMs05 | Created once |
| Import root | nIgYWCmJ1qfBTNCWq | Created once |
| Chapter root | WyyqejA9lJtMPYgrO | Created once |
| Plan | plan:fnv1a32:00963bdd | Persisted |
| Job | test14-adapted-nuclear-ch1-run01-20260713 | Persistent partial |

## Six logical-batch plan

| Stage | Native range | Final state | Completion |
| --- | --- | --- | --- |
| Logical batch 1 | Native chunks 1–10 | Started; blocked at native chunk 6 | Incomplete |
| Logical batch 2 | Native chunks 11–20 | Not started | 0/10 |
| Logical batch 3 | Native chunks 21–30 | Not started | 0/10 |
| Mandatory midpoint | After batch 3 | Not reached | Not applicable |
| Logical batch 4 | Native chunks 31–40 | Not started | 0/10 |
| Logical batch 5 | Native chunks 41–50 | Not started | 0/10 |
| Logical batch 6 | Native chunks 51–55 | Not started | 0/5 |

## Native microchunk manifest

| Native chunk | Logical batch | Source line | Title | State |
| --- | --- | --- | --- | --- |
| 1 | 1 | 2 | 1.1 — Nuclear terminology and nuclide notation | VERIFIED |
| 2 | 1 | 3 | YouTube video | VERIFIED |
| 3 | 1 | 6 | Physical basis / intuition | VERIFIED |
| 4 | 1 | 16 | Definitions and core quantities | VERIFIED |
| 5 | 1 | 44 | Nuclear notation | VERIFIED |
| 6 | 1 | 66 | Classification of nuclides | PARTIAL / BLOCKED |
| 7 | 1 | 98 | Stable and unstable nuclides | PENDING |
| 8 | 1 | 112 | Interpretation and bookkeeping | PENDING |
| 9 | 1 | 127 | Common mistakes to prevent | PENDING |
| 10 | 1 | 137 | 1.2 — Units, dimensions, and order-of-magnitude scales in nuclear physics | PENDING |
| 11 | 2 | 139 | Physical basis / intuition | PENDING |
| 12 | 2 | 153 | Definitions and core quantities | PENDING |
| 13 | 2 | 184 | Dimensions and dimensional meaning | PENDING |
| 14 | 2 | 198 | Mathematical setup | PENDING |
| 15 | 2 | 220 | Useful relations | PENDING |
| 16 | 2 | 233 | Order-of-magnitude scales | PENDING |
| 17 | 2 | 253 | Interpretation | PENDING |
| 18 | 2 | 266 | Common mistakes to prevent | PENDING |
| 19 | 2 | 277 | 1.3 — Atomic mass, nuclear mass, atomic weight, and isotopic abundance | PENDING |
| 20 | 2 | 278 | YouTube video | PENDING |
| 21 | 3 | 281 | Definitions and core quantities | PENDING |
| 22 | 3 | 318 | Mass number versus measured mass | PENDING |
| 23 | 3 | 336 | Why isotopic masses are not exactly equal to their mass numbers | PENDING |
| 24 | 3 | 347 | Atomic mass unit | PENDING |
| 25 | 3 | 355 | Isotopic abundance and average atomic mass | PENDING |
| 26 | 3 | 365 | Interpretation | PENDING |
| 27 | 3 | 374 | Mass measurement and abundance measurement | PENDING |
| 28 | 3 | 382 | Common mistakes to prevent | PENDING |
| 29 | 3 | 388 | 1.4 — Measuring atomic masses and isotopic abundances: velocity selector and mass spectrometer | PENDING |
| 30 | 3 | 389 | YouTube video | PENDING |
| 31 | 4 | 392 | Historical or experimental setup | PENDING |
| 32 | 4 | 404 | Physical basis / intuition | PENDING |
| 33 | 4 | 413 | Definitions and core quantities | PENDING |
| 34 | 4 | 432 | Formation and collimation of the ion beam | PENDING |
| 35 | 4 | 439 | Mathematical setup | PENDING |
| 36 | 4 | 457 | Derivation for the basic accelerating-field plus magnetic-analyzer form | PENDING |
| 37 | 4 | 480 | Velocity selector | PENDING |
| 38 | 4 | 492 | Magnetic analyzer after the selector | PENDING |
| 39 | 4 | 509 | Measuring isotopic abundance | PENDING |
| 40 | 4 | 523 | Interpretation | PENDING |
| 41 | 5 | 535 | Limitations | PENDING |
| 42 | 5 | 548 | Common mistakes to prevent | PENDING |
| 43 | 5 | 564 | 1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis | PENDING |
| 44 | 5 | 565 | YouTube video | PENDING |
| 45 | 5 | 568 | Historical or experimental setup | PENDING |
| 46 | 5 | 581 | Physical basis / intuition | PENDING |
| 47 | 5 | 588 | Definitions and core quantities | PENDING |
| 48 | 5 | 596 | Main observations | PENDING |
| 49 | 5 | 607 | Why the result was surprising | PENDING |
| 50 | 5 | 615 | Interpretation | PENDING |
| 51 | 6 | 628 | The nuclear hypothesis | PENDING |
| 52 | 6 | 638 | Why most of the atom must be empty space | PENDING |
| 53 | 6 | 645 | Experimental observation versus theoretical conclusion | PENDING |
| 54 | 6 | 656 | Limitations | PENDING |
| 55 | 6 | 662 | Common mistakes to prevent | PENDING |

## Job-state audit

| Chunk | Section | Final state | Attempts | Operation evidence | Duplicate state |
| --- | --- | --- | --- | --- | --- |
| 1 | 1.1 | verified | 1 | run_note_import_job_step-mrjfv953 | No |
| 2 | YouTube video | verified | 2 | resume_note_import_job-mrjfw8fn + verify_note_import_job-mrjfx6nc | No |
| 3 | Physical basis / intuition | verified | 1 | run_note_import_job_step-mrjfz2cz + verify_note_import_job-mrjg1hgf | No |
| 4 | Definitions and core quantities | verified | 1 | run_note_import_job_step-mrjg269u + verify_note_import_job-mrjg2hp4 | No |
| 5 | Nuclear notation | verified | 1 | run_note_import_job_step-mrjg3e7j + verify_note_import_job-mrjg3tro | No |
| 6 | Classification of nuclides | partial / blocked | 2 | run_note_import_job_step-mrjg401c + resume_note_import_job-mrjg4y8f | No replacement branch |
| 7–55 | Remaining branches | pending | 0 | Not attempted | No |

- Job created: `2026-07-13T16:30:32.237Z`
- Last update: `2026-07-13T16:38:15.357Z`
- Verified native chunks: 5
- Partial/failed native chunks: 1
- Pending native chunks: 49
- Job terminal state: `partial`
- Midpoint reached: No
- Replacement jobs: 0
- Replayed verified chunks: 0

## Chronological operation log

| # | Phase | Tool | Purpose | Status | Operation ID | Result |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Connection | get_bridge_status | Confirm refreshed bridge | PASS | status-mrjfk0yu | Connected |
| 2 | Connection | get_plugin_status | Confirm focus/sync | PASS | 3930efda-2a1b-42ac-843c-e2e560ca8ced | Plugin Test focused |
| 3 | Scope | get_children | Read approved-root children | PASS | 5e9d9c54-3ce3-47cc-8669-983afa913bc2 | 16 children |
| 4 | Collision | search_rems | Find Test 14 collision | PASS | ffa23994-5b93-41b3-8fff-a7eafcf534d7 | None |
| 5 | Create | create_rem | Create one Test 14 root | PASS | 30527c2f-0e51-46e8-af4c-fd33ec189a15 | zYWFdK4no5ETVMs05 |
| 6 | Planning | plan_note_import_from_file | Mounted-path route | REJECTED | NOT RETURNED | Connector rewrite failure |
| 7 | Planning | plan_note_import_from_file | Designated file route | FAIL | plan_note_import_from_file-mrjfohgv | Invalid IP address |
| 8 | Planning | plan_note_import_from_file | file:// route | REJECTED | NOT RETURNED | Connector rewrite failure |
| 9 | Planning | plan_note_import_from_file | Direct local path | FAIL | plan_note_import_from_file-mrjfpc5y | OAuth local path forbidden |
| 10 | Planning | plan_note_import_from_file | Uploaded file ID | FAIL | plan_note_import_from_file-mrjfpka0 | Invalid IP address |
| 11 | Planning | plan_note_import | Exact bounded text plan | PASS | plan_note_import-mrjfu0bc | 55 native chunks |
| 12 | Job | start_note_import_job | Create persistent job | PASS | start_note_import_job-mrjfv0yk | One persistent job |
| 13 | Execution | run_note_import_job_step | Start batch 1 | PARTIAL | run_note_import_job_step-mrjfv953 | Chunk 1 passed; link normalization stop |
| 14 | Status | get_note_import_job_status | Inspect first partial state | PASS | get_note_import_job_status-mrjfvgs2 | Persistent state |
| 15 | Readback | get_rem_tree | Inspect initial artifact | PASS | 139f1102-8df0-44bb-9246-99b0812197f4 | Duplicate 1.1 chain found |
| 16 | Resume preview | resume_note_import_job | Preview same-job retry | PASS | resume_note_import_job-mrjfw32k | Same pending chunk |
| 17 | Resume | resume_note_import_job | Retry link chunk | PARTIAL | resume_note_import_job-mrjfw8fn | No duplicate branch |
| 18 | Readback | get_rem_rich | Inspect URL Rem | PASS | 7a5ee4a2-506a-45d4-8604-b2a23ff3f27f | Link preserved |
| 19 | Repair preview | update_rem | Preview URL cleanup | PASS | 4aed98b1-b23b-4eb6-ac6b-b07ccb4fd52e | In-place |
| 20 | Repair | update_rem | Remove visible URL dash | PASS | 8fdd8d6a-f715-40a9-b664-c8b0eed0d7d5 | Same Rem ID |
| 21 | Verify | verify_note_import_job | Close YouTube chunk | PASS | verify_note_import_job-mrjfx6nc | Chunk verified |
| 22 | Execution | run_note_import_job_step | Write physical basis | PARTIAL | run_note_import_job_step-mrjfz2cz | Markdown normalization mismatch |
| 23 | Readback | get_rem_tree | Inspect physical basis | PASS | b3fab5af-6a74-4cfd-9b02-cf829a250721 | Content present |
| 24 | Readback | get_rem_rich | Inspect first child | PASS | d19c6a94-c649-4efa-b257-7edd3e858c2d | Dash/bold defect |
| 25 | Verify | verify_note_import_job | Close physical basis | PASS | verify_note_import_job-mrjg1hgf | Chunk verified |
| 26 | Execution | run_note_import_job_step | Write definitions | PARTIAL | run_note_import_job_step-mrjg269u | Normalization mismatch |
| 27 | Verify | verify_note_import_job | Close definitions | PASS | verify_note_import_job-mrjg2hp4 | Chunk verified |
| 28 | Execution | run_note_import_job_step | Write nuclear notation | PARTIAL | run_note_import_job_step-mrjg3e7j | Math normalization mismatch |
| 29 | Verify | verify_note_import_job | Close nuclear notation | PASS | verify_note_import_job-mrjg3tro | Chunk verified |
| 30 | Execution | run_note_import_job_step | Attempt classification | FAIL/PARTIAL | run_note_import_job_step-mrjg401c | Live content; IDs lost |
| 31 | Readback | get_rem_tree | Inspect classification | PASS | 34e16373-cd33-40a3-b777-fc2b4ad34b7e | Malformed hierarchy |
| 32 | Readback | get_rem_tree | Inspect isotone subtree | PASS | 601ad7a2-4556-4a2f-9379-5d7d5c7fe99c | Content exists |
| 33 | Verify | verify_note_import_job | Reconcile classification | FAIL | verify_note_import_job-mrjg4opx | Hash matches; IDs missing |
| 34 | Resume | resume_note_import_job | Second/final attempt | PARTIAL | resume_note_import_job-mrjg4y8f | Same metadata defect |
| 35 | Status | get_note_import_job_status | Freeze partial state | PASS | get_note_import_job_status-mrjg5eka | 5 verified, 1 partial, 49 pending |
| 36 | Scope audit | get_children | Verify one import root | PASS | 038fd4de-4e69-4d1c-8fea-3996be4a92eb | Exactly one |
| 37 | Hierarchy audit | get_children | Read chapter children | PASS | 093963ec-a979-400b-88fd-f931f75d5108 | Six branches |
| 38 | Boundary | search_rems | Search Chapter Two | PASS | 35ad2efb-d062-46ec-984f-2933672b2156 | 0 |
| 39 | Boundary | search_rems | Search Chapter Two title | PASS | 0e44971b-2496-4a8c-abb6-5ad956f0892a | 0 |
| 40 | Duplicate | search_rems | Count exact 1.1 title | PASS | 0d79c92e-afe0-4150-ae87-53190b96d2fa | 3 |
| 41 | Boundary | search_rems | Search exact 2.1 title | PASS | 0d3640bb-9504-4a7f-85e8-f62f0950ade2 | 0 |
| 42 | Boundary | search_rems | Search Chapter Two opening | PASS | 15a08a54-678d-4a40-8073-71a111c0773f | 0 |
| 43 | Boundary | search_rems | Search exact 2.2 title | PASS | f739c459-e09d-4463-83ee-d45cdbc04d66 | 0 |
| 44 | Boundary | search_rems | Search exact 2.3 title | PASS | 9118e43f-0ad0-49b4-adeb-90e2425bbb06 | 0 |
| 45 | Boundary | search_rems | Search 2.10 opening | PASS | a8dddc26-afba-41f4-8ad9-616d011ac2d8 | 0 |
| 46 | Connection | get_plugin_status | Final checkpoint | PASS | 1364ff5a-fc5c-4972-a9df-a60e3648ade4 | Connected |

## Partial hierarchy

```text
Plugin Test
└── RemNote MCP Test 14 — Resumable Long Import — 2026-07-13 — Run 01
    └── Chapter One
        └── Chapter One — Nuclear Physics
            ├── 1.1 — Nuclear terminology and nuclide notation
            │   └── 1.1 — Nuclear terminology and nuclide notation
            │       └── 1.1 — Nuclear terminology and nuclide notation
            ├── YouTube video
            ├── Physical basis / intuition
            ├── Definitions and core quantities
            ├── Nuclear notation
            └── Classification of nuclides
```

| Check | Expected | Observed | Status |
| --- | --- | --- | --- |
| Test-root import roots | 1 | 1 | PASS |
| Chapter roots | 1 | 1 | PASS |
| Chapter direct branches at stop | 6 | 6 | PASS FOR PARTIAL STATE |
| Exact 1.1 title occurrences | 1 | 3 | FAIL — TWO DUPLICATES |
| Chapter Two content | 0 | 0 | PASS |

## Complete canonical source-unit audit

Canonical source units in the five job-verified branches: **60**.  
Plugin-estimated created Rem-like units for those chunks: **56**.  
These differ because canonical source units and actual Rem representations are distinct measurements.

| Unit ID | Line | Type | Branch | Source text | Observed representation | Fidelity |
| --- | --- | --- | --- | --- | --- | --- |
| U001 | 1 | H1 | Chapter One | # Chapter One: | Not created | MISSING — IMPORT NOT REACHED |
| U002 | 2 | H2 | 1.1 — Nuclear terminology and nuclide notation | ## 1.1 — Nuclear terminology and nuclide notation | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U003 | 3 | H3 | YouTube video | ### YouTube video | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U004 | 4 | CONTENT | YouTube video | [https://www.youtube.com/watch?v=YkmfAq4CIs4&utm_source=chatgpt.com](https://www.youtube.com/watch?v=YkmfAq4CIs4&utm_source=chatgpt.com) | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U005 | 6 | H3 | Physical basis / intuition | ### Physical basis / intuition | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U006 | 7 | CONTENT | Physical basis / intuition | Nuclear physics studies **nuclei**, not entire atoms in the ordinary chemical sense. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U007 | 8 | CONTENT | Physical basis / intuition | That sounds trivial, but it matters immediately: | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U008 | 9 | CONTENT | Physical basis / intuition | chemistry mainly distinguishes substances by electron structure, | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U009 | 10 | CONTENT | Physical basis / intuition | nuclear physics mainly distinguishes them by the composition of the nucleus, | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U010 | 11 | CONTENT | Physical basis / intuition | so the key quantities are the numbers of **protons** and **neutrons**. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U011 | 12 | CONTENT | Physical basis / intuition | A nucleus is built from **nucleons**, meaning: | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U012 | 13 | CONTENT | Physical basis / intuition | **protons**, which carry positive charge, | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U013 | 14 | CONTENT | Physical basis / intuition | **neutrons**, which are electrically neutral. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U014 | 16 | H3 | Definitions and core quantities | ### Definitions and core quantities | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U015 | 17 | CONTENT | Definitions and core quantities | **Atom** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U016 | 18 | CONTENT | Definitions and core quantities | An atom consists of a nucleus surrounded by electrons. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U017 | 19 | CONTENT | Definitions and core quantities | In a neutral atom, the number of electrons equals the number of protons in the nucleus. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U018 | 20 | CONTENT | Definitions and core quantities | **Nucleus** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U019 | 21 | CONTENT | Definitions and core quantities | The nucleus is the compact central part of the atom. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U020 | 22 | CONTENT | Definitions and core quantities | It contains nucleons, namely protons and neutrons. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U021 | 23 | CONTENT | Definitions and core quantities | **Nucleons** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U022 | 24 | CONTENT | Definitions and core quantities | Protons and neutrons are collectively called nucleons. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U023 | 25 | CONTENT | Definitions and core quantities | If a nucleus has mass number $A$, then it contains $A$ nucleons in total. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U024 | 26 | CONTENT | Definitions and core quantities | **Element** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U025 | 27 | CONTENT | Definitions and core quantities | An element is identified by its atomic number $Z$. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U026 | 28 | CONTENT | Definitions and core quantities | All nuclei with the same $Z$ belong to the same element. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U027 | 29 | CONTENT | Definitions and core quantities | Changing $Z$ changes the element. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U028 | 30 | CONTENT | Definitions and core quantities | **Atomic number** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U029 | 31 | CONTENT | Definitions and core quantities | The atomic number $Z$ is the number of protons in the nucleus. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U030 | 32 | CONTENT | Definitions and core quantities | It determines the chemical identity of the atom. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U031 | 33 | CONTENT | Definitions and core quantities | **Mass number** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U032 | 34 | CONTENT | Definitions and core quantities | The mass number $A$ is the total number of nucleons in the nucleus: | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U033 | 35 | CONTENT | Definitions and core quantities | $A=Z+N$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U034 | 36 | CONTENT | Definitions and core quantities | It is an integer count, not a measured mass. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U035 | 37 | CONTENT | Definitions and core quantities | **Neutron number** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U036 | 38 | CONTENT | Definitions and core quantities | The neutron number $N$ is the number of neutrons in the nucleus: | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U037 | 39 | CONTENT | Definitions and core quantities | $N=A-Z$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U038 | 40 | CONTENT | Definitions and core quantities | **Nuclide** | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U039 | 41 | CONTENT | Definitions and core quantities | A nuclide is a specific nuclear species characterized by definite values of $A$ and $Z$. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U040 | 42 | CONTENT | Definitions and core quantities | Two nuclei are different nuclides if either $A$ or $Z$ is different. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U041 | 44 | H3 | Nuclear notation | ### Nuclear notation | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U042 | 45 | CONTENT | Nuclear notation | The standard notation for a nuclide is | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U043 | 46 | CONTENT | Nuclear notation | ${}^{A}_{Z}X$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U044 | 47 | CONTENT | Nuclear notation | where | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U045 | 48 | CONTENT | Nuclear notation | $X$ is the chemical symbol, | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U046 | 49 | CONTENT | Nuclear notation | $Z$ is the atomic number, | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U047 | 50 | CONTENT | Nuclear notation | $A$ is the mass number. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U048 | 51 | CONTENT | Nuclear notation | Since | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U049 | 52 | CONTENT | Nuclear notation | $N=A-Z$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U050 | 53 | CONTENT | Nuclear notation | the neutron number is obtained immediately once $A$ and $Z$ are known. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U051 | 54 | CONTENT | Nuclear notation | Examples | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U052 | 55 | CONTENT | Nuclear notation | ${}^{12}_{6}\mathrm{C}$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U053 | 56 | CONTENT | Nuclear notation | $Z=6$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U054 | 57 | CONTENT | Nuclear notation | $A=12$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U055 | 58 | CONTENT | Nuclear notation | $N=12-6=6$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U056 | 59 | CONTENT | Nuclear notation | ${}^{238}_{92}\mathrm{U}$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U057 | 60 | CONTENT | Nuclear notation | $Z=92$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U058 | 61 | CONTENT | Nuclear notation | $A=238$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U059 | 62 | CONTENT | Nuclear notation | $N=238-92=146$ | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U060 | 63 | CONTENT | Nuclear notation | It is also common to write $^{A}\!X$ when the element symbol already makes $Z$ obvious, for example $^{14}\mathrm{C}$ or $^{235}\mathrm{U}$. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U061 | 64 | CONTENT | Nuclear notation | In nuclear equations, writing both $A$ and $Z$ is safer because both must be tracked explicitly. | Represented in a job-verified native chunk | SEMANTICALLY_EXACT / JOB_VERIFIED |
| U062 | 66 | H3 | Classification of nuclides | ### Classification of nuclides | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U063 | 67 | CONTENT | Classification of nuclides | **Isotopes** | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U064 | 68 | CONTENT | Classification of nuclides | Isotopes are nuclides with the same atomic number $Z$ but different mass number $A$. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U065 | 69 | CONTENT | Classification of nuclides | Since $Z$ is the same, they are nuclei of the same element. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U066 | 70 | CONTENT | Classification of nuclides | Because $A$ is different, their neutron number is different. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U067 | 71 | CONTENT | Classification of nuclides | Example: | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U068 | 72 | CONTENT | Classification of nuclides | ${}^{235}\mathrm{U}$ and ${}^{238}\mathrm{U}$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U069 | 73 | CONTENT | Classification of nuclides | both have $Z=92$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U070 | 74 | CONTENT | Classification of nuclides | therefore they are isotopes. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U071 | 75 | CONTENT | Classification of nuclides | **Isotones** | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U072 | 76 | CONTENT | Classification of nuclides | Isotones are nuclides with the same neutron number $N$ but different atomic number $Z$. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U073 | 77 | CONTENT | Classification of nuclides | Example: | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U074 | 78 | CONTENT | Classification of nuclides | ${}^{13}_{6}\mathrm{C}$, ${}^{14}_{7}\mathrm{N}$, and ${}^{15}_{8}\mathrm{O}$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U075 | 79 | CONTENT | Classification of nuclides | each has | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U076 | 80 | CONTENT | Classification of nuclides | $N=A-Z=7$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U077 | 81 | CONTENT | Classification of nuclides | therefore they are isotones. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U078 | 82 | CONTENT | Classification of nuclides | **Isobars** | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U079 | 83 | CONTENT | Classification of nuclides | Isobars are nuclides with the same mass number $A$ but different atomic number $Z$. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U080 | 84 | CONTENT | Classification of nuclides | Example: | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U081 | 85 | CONTENT | Classification of nuclides | ${}^{3}_{1}\mathrm{H}$ and ${}^{3}_{2}\mathrm{He}$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U082 | 86 | CONTENT | Classification of nuclides | both have $A=3$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U083 | 87 | CONTENT | Classification of nuclides | but they have different $Z$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U084 | 88 | CONTENT | Classification of nuclides | therefore they are isobars. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U085 | 89 | CONTENT | Classification of nuclides | **Mirror nuclei** | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U086 | 90 | CONTENT | Classification of nuclides | Mirror nuclei are pairs of nuclides in which the proton number of one equals the neutron number of the other, and vice versa. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U087 | 91 | CONTENT | Classification of nuclides | If one nucleus has $(Z,N)$, its mirror partner has $(N,Z)$. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U088 | 92 | CONTENT | Classification of nuclides | Example: | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U089 | 93 | CONTENT | Classification of nuclides | ${}^{3}_{1}\mathrm{H}$ has $(Z,N)=(1,2)$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U090 | 94 | CONTENT | Classification of nuclides | ${}^{3}_{2}\mathrm{He}$ has $(Z,N)=(2,1)$ | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U091 | 95 | CONTENT | Classification of nuclides | therefore they form a mirror pair. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U092 | 96 | CONTENT | Classification of nuclides | Another example is ${}^{13}_{6}\mathrm{C}$ and ${}^{13}_{7}\mathrm{N}$. | Live content exists, but persistent chunk metadata is unreconciled | NOT_VERIFIED — JOB-STATE DEFECT |
| U093 | 98 | H3 | Stable and unstable nuclides | ### Stable and unstable nuclides | Not created | MISSING — IMPORT NOT REACHED |
| U094 | 99 | CONTENT | Stable and unstable nuclides | A **stable nuclide** does not spontaneously decay under ordinary observation. | Not created | MISSING — IMPORT NOT REACHED |
| U095 | 100 | CONTENT | Stable and unstable nuclides | An **unstable nuclide** is radioactive and transforms spontaneously into another nuclide. | Not created | MISSING — IMPORT NOT REACHED |
| U096 | 101 | CONTENT | Stable and unstable nuclides | Stability is a property of a particular nuclide, not merely of an element name. | Not created | MISSING — IMPORT NOT REACHED |
| U097 | 102 | CONTENT | Stable and unstable nuclides | The same element can have both stable and unstable isotopes. | Not created | MISSING — IMPORT NOT REACHED |
| U098 | 103 | CONTENT | Stable and unstable nuclides | Example: | Not created | MISSING — IMPORT NOT REACHED |
| U099 | 104 | CONTENT | Stable and unstable nuclides | ${}^{12}\mathrm{C}$ and ${}^{13}\mathrm{C}$ are stable, | Not created | MISSING — IMPORT NOT REACHED |
| U100 | 105 | CONTENT | Stable and unstable nuclides | ${}^{14}\mathrm{C}$ is unstable. | Not created | MISSING — IMPORT NOT REACHED |
| U101 | 106 | CONTENT | Stable and unstable nuclides | It is therefore more precise to say | Not created | MISSING — IMPORT NOT REACHED |
| U102 | 107 | CONTENT | Stable and unstable nuclides | stable nuclide, | Not created | MISSING — IMPORT NOT REACHED |
| U103 | 108 | CONTENT | Stable and unstable nuclides | unstable isotope, | Not created | MISSING — IMPORT NOT REACHED |
| U104 | 109 | CONTENT | Stable and unstable nuclides | radioactive nuclide, | Not created | MISSING — IMPORT NOT REACHED |
| U105 | 110 | CONTENT | Stable and unstable nuclides | rather than using loose wording. | Not created | MISSING — IMPORT NOT REACHED |
| U106 | 112 | H3 | Interpretation and bookkeeping | ### Interpretation and bookkeeping | Not created | MISSING — IMPORT NOT REACHED |
| U107 | 113 | CONTENT | Interpretation and bookkeeping | In introductory nuclear physics, the first bookkeeping step is always to identify | Not created | MISSING — IMPORT NOT REACHED |
| U108 | 114 | CONTENT | Interpretation and bookkeeping | $A$, | Not created | MISSING — IMPORT NOT REACHED |
| U109 | 115 | CONTENT | Interpretation and bookkeeping | $Z$, | Not created | MISSING — IMPORT NOT REACHED |
| U110 | 116 | CONTENT | Interpretation and bookkeeping | $N$. | Not created | MISSING — IMPORT NOT REACHED |
| U111 | 117 | CONTENT | Interpretation and bookkeeping | The relation | Not created | MISSING — IMPORT NOT REACHED |
| U112 | 118 | CONTENT | Interpretation and bookkeeping | $A=Z+N$ | Not created | MISSING — IMPORT NOT REACHED |
| U113 | 119 | CONTENT | Interpretation and bookkeeping | must remain true for every correctly identified nuclide. | Not created | MISSING — IMPORT NOT REACHED |
| U114 | 120 | CONTENT | Interpretation and bookkeeping | The classification rules can be summarized as follows: | Not created | MISSING — IMPORT NOT REACHED |
| U115 | 121 | CONTENT | Interpretation and bookkeeping | same $Z$ $\rightarrow$ isotopes | Not created | MISSING — IMPORT NOT REACHED |
| U116 | 122 | CONTENT | Interpretation and bookkeeping | same $N$ $\rightarrow$ isotones | Not created | MISSING — IMPORT NOT REACHED |
| U117 | 123 | CONTENT | Interpretation and bookkeeping | same $A$ $\rightarrow$ isobars | Not created | MISSING — IMPORT NOT REACHED |
| U118 | 124 | CONTENT | Interpretation and bookkeeping | exchanged $Z$ and $N$ $\rightarrow$ mirror nuclei | Not created | MISSING — IMPORT NOT REACHED |
| U119 | 125 | CONTENT | Interpretation and bookkeeping | This language matters because later topics such as decay equations, reaction equations, and nuclear stability all depend on correct identification of $A$ and $Z$. | Not created | MISSING — IMPORT NOT REACHED |
| U120 | 127 | H3 | Common mistakes to prevent | ### Common mistakes to prevent | Not created | MISSING — IMPORT NOT REACHED |
| U121 | 128 | CONTENT | Common mistakes to prevent | Do not confuse **mass number** $A$ with **atomic mass** measured in u. | Not created | MISSING — IMPORT NOT REACHED |
| U122 | 129 | CONTENT | Common mistakes to prevent | Do not forget that | Not created | MISSING — IMPORT NOT REACHED |
| U123 | 130 | CONTENT | Common mistakes to prevent | $N=A-Z$ | Not created | MISSING — IMPORT NOT REACHED |
| U124 | 131 | CONTENT | Common mistakes to prevent | Do not call two nuclei isotopes merely because they are related somehow; they must have the same $Z$. | Not created | MISSING — IMPORT NOT REACHED |
| U125 | 132 | CONTENT | Common mistakes to prevent | Do not confuse isobars with isotopes. | Not created | MISSING — IMPORT NOT REACHED |
| U126 | 133 | CONTENT | Common mistakes to prevent | Isotopes: same $Z$, different $A$ | Not created | MISSING — IMPORT NOT REACHED |
| U127 | 134 | CONTENT | Common mistakes to prevent | Isobars: same $A$, different $Z$ | Not created | MISSING — IMPORT NOT REACHED |
| U128 | 135 | CONTENT | Common mistakes to prevent | Do not use atom, nucleus, and nuclide as if they were identical terms. | Not created | MISSING — IMPORT NOT REACHED |
| U129 | 136 | CONTENT | Common mistakes to prevent | They are related, but they are not the same thing. | Not created | MISSING — IMPORT NOT REACHED |
| U130 | 137 | H2 | 1.2 — Units, dimensions, and order-of-magnitude scales in nuclear physics | ## 1.2 — Units, dimensions, and order-of-magnitude scales in nuclear physics | Not created | MISSING — IMPORT NOT REACHED |
| U131 | 139 | H3 | Physical basis / intuition | ### Physical basis / intuition | Not created | MISSING — IMPORT NOT REACHED |
| U132 | 140 | CONTENT | Physical basis / intuition | Atomic physics and nuclear physics deal with very different size and energy scales, so the same SI units are often too awkward for direct use. | Not created | MISSING — IMPORT NOT REACHED |
| U133 | 141 | CONTENT | Physical basis / intuition | For that reason, nuclear physics uses compact units that match the natural scale of nuclei: | Not created | MISSING — IMPORT NOT REACHED |
| U134 | 142 | CONTENT | Physical basis / intuition | $\text{\AA}$ for atomic-size lengths, | Not created | MISSING — IMPORT NOT REACHED |
| U135 | 143 | CONTENT | Physical basis / intuition | fm for nuclear-size lengths, | Not created | MISSING — IMPORT NOT REACHED |
| U136 | 144 | CONTENT | Physical basis / intuition | eV, keV, and MeV for energies, | Not created | MISSING — IMPORT NOT REACHED |
| U137 | 145 | CONTENT | Physical basis / intuition | u for atomic and nuclear masses. | Not created | MISSING — IMPORT NOT REACHED |
| U138 | 146 | CONTENT | Physical basis / intuition | A useful first comparison is: | Not created | MISSING — IMPORT NOT REACHED |
| U139 | 147 | CONTENT | Physical basis / intuition | atomic processes are commonly of order eV, | Not created | MISSING — IMPORT NOT REACHED |
| U140 | 148 | CONTENT | Physical basis / intuition | nuclear processes are commonly of order MeV. | Not created | MISSING — IMPORT NOT REACHED |
| U141 | 149 | CONTENT | Physical basis / intuition | Since | Not created | MISSING — IMPORT NOT REACHED |
| U142 | 150 | CONTENT | Physical basis / intuition | $1\,\text{MeV}=10^6\,\text{eV},$ | Not created | MISSING — IMPORT NOT REACHED |
| U143 | 151 | CONTENT | Physical basis / intuition | the energy scale of nuclear phenomena is typically about a million times larger than that of ordinary atomic excitations. | Not created | MISSING — IMPORT NOT REACHED |
| U144 | 153 | H3 | Definitions and core quantities | ### Definitions and core quantities | Not created | MISSING — IMPORT NOT REACHED |
| U145 | 154 | CONTENT | Definitions and core quantities | **Length scales** | Not created | MISSING — IMPORT NOT REACHED |
| U146 | 155 | CONTENT | Definitions and core quantities | The angstrom is | Not created | MISSING — IMPORT NOT REACHED |
| U147 | 156 | CONTENT | Definitions and core quantities | $1\,\text{\AA}=10^{-10}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U148 | 157 | CONTENT | Definitions and core quantities | It is a convenient atomic length unit, because typical atomic radii are of order | Not created | MISSING — IMPORT NOT REACHED |
| U149 | 158 | CONTENT | Definitions and core quantities | $10^{-10}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U150 | 159 | CONTENT | Definitions and core quantities | The femtometer is | Not created | MISSING — IMPORT NOT REACHED |
| U151 | 160 | CONTENT | Definitions and core quantities | $1\,\text{fm}=10^{-15}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U152 | 161 | CONTENT | Definitions and core quantities | It is the natural nuclear length unit, because typical nuclear sizes are of order a few fm. | Not created | MISSING — IMPORT NOT REACHED |
| U153 | 162 | CONTENT | Definitions and core quantities | Therefore, a nucleus is roughly $10^5$ times smaller in linear size than an atom. | Not created | MISSING — IMPORT NOT REACHED |
| U154 | 163 | CONTENT | Definitions and core quantities | **Energy units** | Not created | MISSING — IMPORT NOT REACHED |
| U155 | 164 | CONTENT | Definitions and core quantities | The electron-volt is defined as the energy gained by a particle carrying one elementary charge $e$ when it moves through a potential difference of $1$ volt: | Not created | MISSING — IMPORT NOT REACHED |
| U156 | 165 | CONTENT | Definitions and core quantities | $1\,\text{eV}=1.602\times 10^{-19}\,\text{J}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U157 | 166 | CONTENT | Definitions and core quantities | Common multiples are | Not created | MISSING — IMPORT NOT REACHED |
| U158 | 167 | CONTENT | Definitions and core quantities | $1\,\text{keV}=10^3\,\text{eV}, \qquad 1\,\text{MeV}=10^6\,\text{eV}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U159 | 168 | CONTENT | Definitions and core quantities | Atomic excitation and ionization energies are typically measured in eV. | Not created | MISSING — IMPORT NOT REACHED |
| U160 | 169 | CONTENT | Definitions and core quantities | Nuclear decay energies, reaction energies, and binding energies per nucleon are typically measured in MeV. | Not created | MISSING — IMPORT NOT REACHED |
| U161 | 170 | CONTENT | Definitions and core quantities | **Mass unit** | Not created | MISSING — IMPORT NOT REACHED |
| U162 | 171 | CONTENT | Definitions and core quantities | The unified atomic mass unit is defined by | Not created | MISSING — IMPORT NOT REACHED |
| U163 | 172 | CONTENT | Definitions and core quantities | $1\,\text{u}=\frac{1}{12}\times \text{mass of a neutral }{}^{12}\mathrm{C}\text{ atom}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U164 | 173 | CONTENT | Definitions and core quantities | Numerically, | Not created | MISSING — IMPORT NOT REACHED |
| U165 | 174 | CONTENT | Definitions and core quantities | $1\,\text{u}=1.6605\times 10^{-27}\,\text{kg}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U166 | 175 | CONTENT | Definitions and core quantities | Proton and neutron masses are each approximately $1\,\text{u}$, though not exactly equal to $1\,\text{u}$. | Not created | MISSING — IMPORT NOT REACHED |
| U167 | 176 | CONTENT | Definitions and core quantities | **Mass-energy conversion** | Not created | MISSING — IMPORT NOT REACHED |
| U168 | 177 | CONTENT | Definitions and core quantities | From special relativity, | Not created | MISSING — IMPORT NOT REACHED |
| U169 | 178 | CONTENT | Definitions and core quantities | $E=mc^2.$ | Not created | MISSING — IMPORT NOT REACHED |
| U170 | 179 | CONTENT | Definitions and core quantities | In nuclear physics this is used constantly, so the most important conversion is | Not created | MISSING — IMPORT NOT REACHED |
| U171 | 180 | CONTENT | Definitions and core quantities | $1\,\text{u}\,c^2 \approx 931.5\,\text{MeV}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U172 | 181 | CONTENT | Definitions and core quantities | This lets us convert mass differences directly into energies. | Not created | MISSING — IMPORT NOT REACHED |
| U173 | 182 | CONTENT | Definitions and core quantities | Because of this relation, masses are often compared through their equivalent energies rather than through kilograms. | Not created | MISSING — IMPORT NOT REACHED |
| U174 | 184 | H3 | Dimensions and dimensional meaning | ### Dimensions and dimensional meaning | Not created | MISSING — IMPORT NOT REACHED |
| U175 | 185 | CONTENT | Dimensions and dimensional meaning | The physical dimension of energy is | Not created | MISSING — IMPORT NOT REACHED |
| U176 | 186 | CONTENT | Dimensions and dimensional meaning | $[E]=[M L^2 T^{-2}].$ | Not created | MISSING — IMPORT NOT REACHED |
| U177 | 187 | CONTENT | Dimensions and dimensional meaning | The equation | Not created | MISSING — IMPORT NOT REACHED |
| U178 | 188 | CONTENT | Dimensions and dimensional meaning | $E=mc^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U179 | 189 | CONTENT | Dimensions and dimensional meaning | is dimensionally consistent because | Not created | MISSING — IMPORT NOT REACHED |
| U180 | 190 | CONTENT | Dimensions and dimensional meaning | $[m c^2]=[M]\left[\frac{L}{T}\right]^2=[M L^2 T^{-2}].$ | Not created | MISSING — IMPORT NOT REACHED |
| U181 | 191 | CONTENT | Dimensions and dimensional meaning | This is why a mass can be expressed through an equivalent energy once the factor $c^2$ is included. | Not created | MISSING — IMPORT NOT REACHED |
| U182 | 192 | CONTENT | Dimensions and dimensional meaning | It is important to distinguish the following: | Not created | MISSING — IMPORT NOT REACHED |
| U183 | 193 | CONTENT | Dimensions and dimensional meaning | $\text{eV}$ is a unit of **energy**, | Not created | MISSING — IMPORT NOT REACHED |
| U184 | 194 | CONTENT | Dimensions and dimensional meaning | $\text{eV}/c^2$ is a unit of **mass**, | Not created | MISSING — IMPORT NOT REACHED |
| U185 | 195 | CONTENT | Dimensions and dimensional meaning | $\text{eV}/c$ is a unit of **momentum**. | Not created | MISSING — IMPORT NOT REACHED |
| U186 | 196 | CONTENT | Dimensions and dimensional meaning | These are not interchangeable, even though students routinely manage to scramble them like they are making academic soup. | Not created | MISSING — IMPORT NOT REACHED |
| U187 | 198 | H3 | Mathematical setup | ### Mathematical setup | Not created | MISSING — IMPORT NOT REACHED |
| U188 | 199 | CONTENT | Mathematical setup | For length scales: | Not created | MISSING — IMPORT NOT REACHED |
| U189 | 200 | CONTENT | Mathematical setup | atomic scale: | Not created | MISSING — IMPORT NOT REACHED |
| U190 | 201 | CONTENT | Mathematical setup | $r_{\text{atom}} \sim 10^{-10}\,\text{m}$ | Not created | MISSING — IMPORT NOT REACHED |
| U191 | 202 | CONTENT | Mathematical setup | nuclear scale: | Not created | MISSING — IMPORT NOT REACHED |
| U192 | 203 | CONTENT | Mathematical setup | $r_{\text{nucleus}} \sim 10^{-15}\,\text{m}$ | Not created | MISSING — IMPORT NOT REACHED |
| U193 | 204 | CONTENT | Mathematical setup | hence | Not created | MISSING — IMPORT NOT REACHED |
| U194 | 205 | CONTENT | Mathematical setup | $\frac{r_{\text{atom}}}{r_{\text{nucleus}}}\sim 10^5.$ | Not created | MISSING — IMPORT NOT REACHED |
| U195 | 206 | CONTENT | Mathematical setup | For energy scales: | Not created | MISSING — IMPORT NOT REACHED |
| U196 | 207 | CONTENT | Mathematical setup | atomic transition: | Not created | MISSING — IMPORT NOT REACHED |
| U197 | 208 | CONTENT | Mathematical setup | $E_{\text{atomic}} \sim 1\,\text{eV}$ | Not created | MISSING — IMPORT NOT REACHED |
| U198 | 209 | CONTENT | Mathematical setup | nuclear process: | Not created | MISSING — IMPORT NOT REACHED |
| U199 | 210 | CONTENT | Mathematical setup | $E_{\text{nuclear}} \sim 1\,\text{MeV}$ | Not created | MISSING — IMPORT NOT REACHED |
| U200 | 211 | CONTENT | Mathematical setup | hence | Not created | MISSING — IMPORT NOT REACHED |
| U201 | 212 | CONTENT | Mathematical setup | $\frac{E_{\text{nuclear}}}{E_{\text{atomic}}}\sim 10^6.$ | Not created | MISSING — IMPORT NOT REACHED |
| U202 | 213 | CONTENT | Mathematical setup | For nucleon rest-energy scale: | Not created | MISSING — IMPORT NOT REACHED |
| U203 | 214 | CONTENT | Mathematical setup | since | Not created | MISSING — IMPORT NOT REACHED |
| U204 | 215 | CONTENT | Mathematical setup | $m_p c^2 \approx 938\,\text{MeV}, \qquad m_n c^2 \approx 939\,\text{MeV},$ | Not created | MISSING — IMPORT NOT REACHED |
| U205 | 216 | CONTENT | Mathematical setup | typical nuclear energies of a few MeV are much smaller than nucleon rest energies. | Not created | MISSING — IMPORT NOT REACHED |
| U206 | 217 | CONTENT | Mathematical setup | Therefore, many nuclear calculations can use nonrelativistic mechanics as a good approximation. | Not created | MISSING — IMPORT NOT REACHED |
| U207 | 218 | CONTENT | Mathematical setup | A notable exception is the emitted electron in beta decay, which often requires relativistic treatment. | Not created | MISSING — IMPORT NOT REACHED |
| U208 | 220 | H3 | Useful relations | ### Useful relations | Not created | MISSING — IMPORT NOT REACHED |
| U209 | 221 | CONTENT | Useful relations | For a photon, | Not created | MISSING — IMPORT NOT REACHED |
| U210 | 222 | CONTENT | Useful relations | $E=h\nu=\frac{hc}{\lambda}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U211 | 223 | CONTENT | Useful relations | Two especially useful constants are | Not created | MISSING — IMPORT NOT REACHED |
| U212 | 224 | CONTENT | Useful relations | $h=6.626\times 10^{-34}\,\text{J}\cdot\text{s}$ | Not created | MISSING — IMPORT NOT REACHED |
| U213 | 225 | CONTENT | Useful relations | and | Not created | MISSING — IMPORT NOT REACHED |
| U214 | 226 | CONTENT | Useful relations | $1\,\text{eV}=1.602\times 10^{-19}\,\text{J}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U215 | 227 | CONTENT | Useful relations | A very convenient wavelength-energy relation is | Not created | MISSING — IMPORT NOT REACHED |
| U216 | 228 | CONTENT | Useful relations | $\lambda=\frac{1.240\times 10^{-6}\,\text{m}\cdot\text{eV}}{E}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U217 | 229 | CONTENT | Useful relations | In nuclear work, another very useful combination is | Not created | MISSING — IMPORT NOT REACHED |
| U218 | 230 | CONTENT | Useful relations | $hc \approx 197.3\,\text{MeV}\cdot\text{fm}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U219 | 231 | CONTENT | Useful relations | This relation is especially useful when comparing nuclear sizes with particle wavelengths. | Not created | MISSING — IMPORT NOT REACHED |
| U220 | 233 | H3 | Order-of-magnitude scales | ### Order-of-magnitude scales | Not created | MISSING — IMPORT NOT REACHED |
| U221 | 234 | CONTENT | Order-of-magnitude scales | **Atomic lengths** | Not created | MISSING — IMPORT NOT REACHED |
| U222 | 235 | CONTENT | Order-of-magnitude scales | Typical atomic dimensions are of order | Not created | MISSING — IMPORT NOT REACHED |
| U223 | 236 | CONTENT | Order-of-magnitude scales | $10^{-10}\,\text{m}=1\,\text{\AA}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U224 | 237 | CONTENT | Order-of-magnitude scales | **Nuclear lengths** | Not created | MISSING — IMPORT NOT REACHED |
| U225 | 238 | CONTENT | Order-of-magnitude scales | Typical nuclear radii are of order | Not created | MISSING — IMPORT NOT REACHED |
| U226 | 239 | CONTENT | Order-of-magnitude scales | $1\text{ to }7\,\text{fm}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U227 | 240 | CONTENT | Order-of-magnitude scales | **Atomic energies** | Not created | MISSING — IMPORT NOT REACHED |
| U228 | 241 | CONTENT | Order-of-magnitude scales | Atomic excitation, ionization, and spectral-line energies are commonly of order eV. | Not created | MISSING — IMPORT NOT REACHED |
| U229 | 242 | CONTENT | Order-of-magnitude scales | **Nuclear energies** | Not created | MISSING — IMPORT NOT REACHED |
| U230 | 243 | CONTENT | Order-of-magnitude scales | Alpha, beta, and gamma decay energies are commonly of order MeV. | Not created | MISSING — IMPORT NOT REACHED |
| U231 | 244 | CONTENT | Order-of-magnitude scales | Low-energy nuclear reactions also commonly involve energies of order several MeV. | Not created | MISSING — IMPORT NOT REACHED |
| U232 | 245 | CONTENT | Order-of-magnitude scales | **Time scales** | Not created | MISSING — IMPORT NOT REACHED |
| U233 | 246 | CONTENT | Order-of-magnitude scales | Nuclear reaction times can be extremely short, often around | Not created | MISSING — IMPORT NOT REACHED |
| U234 | 247 | CONTENT | Order-of-magnitude scales | $10^{-22}\,\text{s}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U235 | 248 | CONTENT | Order-of-magnitude scales | Many electromagnetic nuclear decays lie roughly in the ns to ps range: | Not created | MISSING — IMPORT NOT REACHED |
| U236 | 249 | CONTENT | Order-of-magnitude scales | $10^{-9}\,\text{s} \text{ to } 10^{-12}\,\text{s}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U237 | 250 | CONTENT | Order-of-magnitude scales | Alpha and beta decays can be far longer, ranging from fractions of a second to years or much longer. | Not created | MISSING — IMPORT NOT REACHED |
| U238 | 251 | CONTENT | Order-of-magnitude scales | The main lesson is that “small” or “large” in nuclear physics must always be judged against nuclear scales, not everyday scales. | Not created | MISSING — IMPORT NOT REACHED |
| U239 | 253 | H3 | Interpretation | ### Interpretation | Not created | MISSING — IMPORT NOT REACHED |
| U240 | 254 | CONTENT | Interpretation | The choice of units is not cosmetic. | Not created | MISSING — IMPORT NOT REACHED |
| U241 | 255 | CONTENT | Interpretation | It helps reveal the actual physics: | Not created | MISSING — IMPORT NOT REACHED |
| U242 | 256 | CONTENT | Interpretation | $\text{\AA}$ immediately suggests atomic structure, | Not created | MISSING — IMPORT NOT REACHED |
| U243 | 257 | CONTENT | Interpretation | fm immediately suggests nuclear structure, | Not created | MISSING — IMPORT NOT REACHED |
| U244 | 258 | CONTENT | Interpretation | eV suggests atomic transitions, | Not created | MISSING — IMPORT NOT REACHED |
| U245 | 259 | CONTENT | Interpretation | MeV suggests nuclear energies, | Not created | MISSING — IMPORT NOT REACHED |
| U246 | 260 | CONTENT | Interpretation | u is the practical mass scale for nuclei and atoms. | Not created | MISSING — IMPORT NOT REACHED |
| U247 | 261 | CONTENT | Interpretation | When mass differences are converted through | Not created | MISSING — IMPORT NOT REACHED |
| U248 | 262 | CONTENT | Interpretation | $E=\Delta m\,c^2,$ | Not created | MISSING — IMPORT NOT REACHED |
| U249 | 263 | CONTENT | Interpretation | very small mass defects correspond to measurable nuclear energies. | Not created | MISSING — IMPORT NOT REACHED |
| U250 | 264 | CONTENT | Interpretation | This is why careful unit handling is central to nuclear physics and not just an afterthought. | Not created | MISSING — IMPORT NOT REACHED |
| U251 | 266 | H3 | Common mistakes to prevent | ### Common mistakes to prevent | Not created | MISSING — IMPORT NOT REACHED |
| U252 | 267 | CONTENT | Common mistakes to prevent | Do not confuse **mass number** $A$ with **mass in u**. | Not created | MISSING — IMPORT NOT REACHED |
| U253 | 268 | CONTENT | Common mistakes to prevent | $A$ is an integer count of nucleons. | Not created | MISSING — IMPORT NOT REACHED |
| U254 | 269 | CONTENT | Common mistakes to prevent | u is a physical mass unit. | Not created | MISSING — IMPORT NOT REACHED |
| U255 | 270 | CONTENT | Common mistakes to prevent | Do not confuse | Not created | MISSING — IMPORT NOT REACHED |
| U256 | 271 | CONTENT | Common mistakes to prevent | $eV \quad \text{with} \quad eV/c^2,$ | Not created | MISSING — IMPORT NOT REACHED |
| U257 | 272 | CONTENT | Common mistakes to prevent | or eV with volts. | Not created | MISSING — IMPORT NOT REACHED |
| U258 | 273 | CONTENT | Common mistakes to prevent | Do not forget the scale difference | Not created | MISSING — IMPORT NOT REACHED |
| U259 | 274 | CONTENT | Common mistakes to prevent | $1\,\text{\AA}=10^5\,\text{fm}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U260 | 275 | CONTENT | Common mistakes to prevent | Do not mix atomic and nuclear length scales in the same estimate without checking powers of ten carefully. | Not created | MISSING — IMPORT NOT REACHED |
| U261 | 276 | CONTENT | Common mistakes to prevent | Do not use kilograms in routine nuclear calculations unless conversion is actually needed. | Not created | MISSING — IMPORT NOT REACHED |
| U262 | 277 | H2 | 1.3 — Atomic mass, nuclear mass, atomic weight, and isotopic abundance | ## 1.3 — Atomic mass, nuclear mass, atomic weight, and isotopic abundance | Not created | MISSING — IMPORT NOT REACHED |
| U263 | 278 | H3 | YouTube video | ### YouTube video | Not created | MISSING — IMPORT NOT REACHED |
| U264 | 279 | CONTENT | YouTube video | [The Nucleus: Crash Course Chemistry #1](https://www.youtube.com/watch?v=FSyAehMdpyI&utm_source=chatgpt.com) | Not created | MISSING — IMPORT NOT REACHED |
| U265 | 281 | H3 | Definitions and core quantities | ### Definitions and core quantities | Not created | MISSING — IMPORT NOT REACHED |
| U266 | 282 | CONTENT | Definitions and core quantities | **Mass number **$A$ | Not created | MISSING — IMPORT NOT REACHED |
| U267 | 283 | CONTENT | Definitions and core quantities | $A$ is the total number of nucleons in the nucleus: | Not created | MISSING — IMPORT NOT REACHED |
| U268 | 284 | CONTENT | Definitions and core quantities | $A=Z+N$ | Not created | MISSING — IMPORT NOT REACHED |
| U269 | 285 | CONTENT | Definitions and core quantities | It is an integer. | Not created | MISSING — IMPORT NOT REACHED |
| U270 | 286 | CONTENT | Definitions and core quantities | It is a counting number, not a measured mass. | Not created | MISSING — IMPORT NOT REACHED |
| U271 | 287 | CONTENT | Definitions and core quantities | **Atomic mass** | Not created | MISSING — IMPORT NOT REACHED |
| U272 | 288 | CONTENT | Definitions and core quantities | The atomic mass is the measured mass of a **neutral atom** of a specific nuclide. | Not created | MISSING — IMPORT NOT REACHED |
| U273 | 289 | CONTENT | Definitions and core quantities | It includes | Not created | MISSING — IMPORT NOT REACHED |
| U274 | 290 | CONTENT | Definitions and core quantities | the nuclear mass, | Not created | MISSING — IMPORT NOT REACHED |
| U275 | 291 | CONTENT | Definitions and core quantities | the masses of the $Z$ orbital electrons, | Not created | MISSING — IMPORT NOT REACHED |
| U276 | 292 | CONTENT | Definitions and core quantities | and a small correction due to electronic binding energy. | Not created | MISSING — IMPORT NOT REACHED |
| U277 | 293 | CONTENT | Definitions and core quantities | Atomic masses are commonly expressed in atomic mass units, u. | Not created | MISSING — IMPORT NOT REACHED |
| U278 | 294 | CONTENT | Definitions and core quantities | **Nuclear mass** | Not created | MISSING — IMPORT NOT REACHED |
| U279 | 295 | CONTENT | Definitions and core quantities | The nuclear mass is the mass of the nucleus alone. | Not created | MISSING — IMPORT NOT REACHED |
| U280 | 296 | CONTENT | Definitions and core quantities | It excludes the orbital electrons. | Not created | MISSING — IMPORT NOT REACHED |
| U281 | 297 | CONTENT | Definitions and core quantities | If $M_{\text{atom}}$ is the atomic mass and $M_{\text{nuc}}$ is the nuclear mass, then the exact relation is | Not created | MISSING — IMPORT NOT REACHED |
| U282 | 298 | CONTENT | Definitions and core quantities | $M_{\text{atom}}=M_{\text{nuc}}+Zm_e-\frac{B_e}{c^2}$ | Not created | MISSING — IMPORT NOT REACHED |
| U283 | 299 | CONTENT | Definitions and core quantities | where | Not created | MISSING — IMPORT NOT REACHED |
| U284 | 300 | CONTENT | Definitions and core quantities | $m_e$ is the electron mass, | Not created | MISSING — IMPORT NOT REACHED |
| U285 | 301 | CONTENT | Definitions and core quantities | $B_e$ is the total electronic binding energy. | Not created | MISSING — IMPORT NOT REACHED |
| U286 | 302 | CONTENT | Definitions and core quantities | In most introductory nuclear calculations, | Not created | MISSING — IMPORT NOT REACHED |
| U287 | 303 | CONTENT | Definitions and core quantities | $M_{\text{nuc}} \approx M_{\text{atom}}-Zm_e$ | Not created | MISSING — IMPORT NOT REACHED |
| U288 | 304 | CONTENT | Definitions and core quantities | because the electronic binding correction is very small compared with typical nuclear energy scales. | Not created | MISSING — IMPORT NOT REACHED |
| U289 | 305 | CONTENT | Definitions and core quantities | **Atomic weight** | Not created | MISSING — IMPORT NOT REACHED |
| U290 | 306 | CONTENT | Definitions and core quantities | Atomic weight is the weighted average mass associated with an element when all its naturally occurring isotopes are taken together. | Not created | MISSING — IMPORT NOT REACHED |
| U291 | 307 | CONTENT | Definitions and core quantities | It is not the mass of one particular nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U292 | 308 | CONTENT | Definitions and core quantities | It depends on isotopic composition. | Not created | MISSING — IMPORT NOT REACHED |
| U293 | 309 | CONTENT | Definitions and core quantities | **Isotopic abundance** | Not created | MISSING — IMPORT NOT REACHED |
| U294 | 310 | CONTENT | Definitions and core quantities | Isotopic abundance is the fraction or percentage of atoms of a given isotope in a specified sample. | Not created | MISSING — IMPORT NOT REACHED |
| U295 | 311 | CONTENT | Definitions and core quantities | If the sample is natural, the abundances are the natural isotopic abundances. | Not created | MISSING — IMPORT NOT REACHED |
| U296 | 312 | CONTENT | Definitions and core quantities | For a set of isotopes, | Not created | MISSING — IMPORT NOT REACHED |
| U297 | 313 | CONTENT | Definitions and core quantities | $\sum_i f_i = 1$ | Not created | MISSING — IMPORT NOT REACHED |
| U298 | 314 | CONTENT | Definitions and core quantities | if fractions are used, or | Not created | MISSING — IMPORT NOT REACHED |
| U299 | 315 | CONTENT | Definitions and core quantities | $\sum_i (\%)_i = 100$ | Not created | MISSING — IMPORT NOT REACHED |
| U300 | 316 | CONTENT | Definitions and core quantities | if percentages are used. | Not created | MISSING — IMPORT NOT REACHED |
| U301 | 318 | H3 | Mass number versus measured mass | ### Mass number versus measured mass | Not created | MISSING — IMPORT NOT REACHED |
| U302 | 319 | CONTENT | Mass number versus measured mass | A very common mistake is to identify the atomic mass with the mass number. | Not created | MISSING — IMPORT NOT REACHED |
| U303 | 320 | CONTENT | Mass number versus measured mass | These are not the same. | Not created | MISSING — IMPORT NOT REACHED |
| U304 | 321 | CONTENT | Mass number versus measured mass | $A$ is an integer count of nucleons. | Not created | MISSING — IMPORT NOT REACHED |
| U305 | 322 | CONTENT | Mass number versus measured mass | Atomic mass is a measured quantity in u. | Not created | MISSING — IMPORT NOT REACHED |
| U306 | 323 | CONTENT | Mass number versus measured mass | Example of the distinction | Not created | MISSING — IMPORT NOT REACHED |
| U307 | 324 | CONTENT | Mass number versus measured mass | ${}^{12}\mathrm{C}$ has mass number $A=12$. | Not created | MISSING — IMPORT NOT REACHED |
| U308 | 325 | CONTENT | Mass number versus measured mass | Its **neutral atomic mass** is defined as exactly | Not created | MISSING — IMPORT NOT REACHED |
| U309 | 326 | CONTENT | Mass number versus measured mass | $12\,\text{u}$ | Not created | MISSING — IMPORT NOT REACHED |
| U310 | 327 | CONTENT | Mass number versus measured mass | and this fixes the atomic mass unit scale. | Not created | MISSING — IMPORT NOT REACHED |
| U311 | 328 | CONTENT | Mass number versus measured mass | But many other nuclides do **not** have atomic masses equal to integers in u. | Not created | MISSING — IMPORT NOT REACHED |
| U312 | 329 | CONTENT | Mass number versus measured mass | Therefore, writing | Not created | MISSING — IMPORT NOT REACHED |
| U313 | 330 | CONTENT | Mass number versus measured mass | “chlorine-35 has mass 35 u” | Not created | MISSING — IMPORT NOT REACHED |
| U314 | 331 | CONTENT | Mass number versus measured mass | is generally inaccurate. | Not created | MISSING — IMPORT NOT REACHED |
| U315 | 332 | CONTENT | Mass number versus measured mass | The correct statement is | Not created | MISSING — IMPORT NOT REACHED |
| U316 | 333 | CONTENT | Mass number versus measured mass | chlorine-35 has mass number $35$, | Not created | MISSING — IMPORT NOT REACHED |
| U317 | 334 | CONTENT | Mass number versus measured mass | while its measured atomic mass is close to, but not exactly, $35\,\text{u}$. | Not created | MISSING — IMPORT NOT REACHED |
| U318 | 336 | H3 | Why isotopic masses are not exactly equal to their mass numbers | ### Why isotopic masses are not exactly equal to their mass numbers | Not created | MISSING — IMPORT NOT REACHED |
| U319 | 337 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | There are two main reasons. | Not created | MISSING — IMPORT NOT REACHED |
| U320 | 338 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | First, the proton mass and neutron mass are not each exactly $1\,\text{u}$. | Not created | MISSING — IMPORT NOT REACHED |
| U321 | 339 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | Second, when nucleons bind to form a nucleus, the bound system has less mass than the sum of the free constituents. | Not created | MISSING — IMPORT NOT REACHED |
| U322 | 340 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | That reduction is connected with binding energy through | Not created | MISSING — IMPORT NOT REACHED |
| U323 | 341 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | $E=\Delta m\,c^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U324 | 342 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | So even before studying binding energy in detail, one must already understand this basic point: | Not created | MISSING — IMPORT NOT REACHED |
| U325 | 343 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | nuclear and atomic masses are physical measured quantities, | Not created | MISSING — IMPORT NOT REACHED |
| U326 | 344 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | while mass number is only a nucleon count. | Not created | MISSING — IMPORT NOT REACHED |
| U327 | 345 | CONTENT | Why isotopic masses are not exactly equal to their mass numbers | This is why isotopic masses cluster near integers but are generally not exactly integers. | Not created | MISSING — IMPORT NOT REACHED |
| U328 | 347 | H3 | Atomic mass unit | ### Atomic mass unit | Not created | MISSING — IMPORT NOT REACHED |
| U329 | 348 | CONTENT | Atomic mass unit | The unified atomic mass unit is defined by | Not created | MISSING — IMPORT NOT REACHED |
| U330 | 349 | CONTENT | Atomic mass unit | $1\,\text{u}=\frac{1}{12}\times \text{mass of a neutral }{}^{12}\mathrm{C}\text{ atom}$ | Not created | MISSING — IMPORT NOT REACHED |
| U331 | 350 | CONTENT | Atomic mass unit | Because of this definition, | Not created | MISSING — IMPORT NOT REACHED |
| U332 | 351 | CONTENT | Atomic mass unit | $M_{\text{atom}}({}^{12}\mathrm{C})=12\,\text{u}$ | Not created | MISSING — IMPORT NOT REACHED |
| U333 | 352 | CONTENT | Atomic mass unit | exactly. | Not created | MISSING — IMPORT NOT REACHED |
| U334 | 353 | CONTENT | Atomic mass unit | This gives a convenient standard for tabulating atomic masses of all other nuclides. | Not created | MISSING — IMPORT NOT REACHED |
| U335 | 355 | H3 | Isotopic abundance and average atomic mass | ### Isotopic abundance and average atomic mass | Not created | MISSING — IMPORT NOT REACHED |
| U336 | 356 | CONTENT | Isotopic abundance and average atomic mass | Many elements are mixtures of isotopes. | Not created | MISSING — IMPORT NOT REACHED |
| U337 | 357 | CONTENT | Isotopic abundance and average atomic mass | The isotopes have the same chemical identity because they have the same $Z$, but they have different masses because they have different neutron numbers. | Not created | MISSING — IMPORT NOT REACHED |
| U338 | 358 | CONTENT | Isotopic abundance and average atomic mass | If an element has isotopes with atomic masses $M_1,M_2,\dots$ and fractional abundances $f_1,f_2,\dots$, then the average atomic mass is | Not created | MISSING — IMPORT NOT REACHED |
| U339 | 359 | CONTENT | Isotopic abundance and average atomic mass | $\overline{M}=\sum_i f_i M_i$ | Not created | MISSING — IMPORT NOT REACHED |
| U340 | 360 | CONTENT | Isotopic abundance and average atomic mass | If percentages $p_i$ are used instead, then | Not created | MISSING — IMPORT NOT REACHED |
| U341 | 361 | CONTENT | Isotopic abundance and average atomic mass | $\overline{M}=\sum_i \left(\frac{p_i}{100}\right) M_i$ | Not created | MISSING — IMPORT NOT REACHED |
| U342 | 362 | CONTENT | Isotopic abundance and average atomic mass | This weighted average is what appears as the atomic weight of the element. | Not created | MISSING — IMPORT NOT REACHED |
| U343 | 363 | CONTENT | Isotopic abundance and average atomic mass | The physically important point is that isotopes with larger abundance contribute more strongly to the average than rare isotopes. | Not created | MISSING — IMPORT NOT REACHED |
| U344 | 365 | H3 | Interpretation | ### Interpretation | Not created | MISSING — IMPORT NOT REACHED |
| U345 | 366 | CONTENT | Interpretation | The atomic weight listed in a periodic table is therefore usually **not** the mass of one single atom of one single isotope. | Not created | MISSING — IMPORT NOT REACHED |
| U346 | 367 | CONTENT | Interpretation | It is the weighted average over the isotopic mixture normally found for that element. | Not created | MISSING — IMPORT NOT REACHED |
| U347 | 368 | CONTENT | Interpretation | If the isotopic composition changes, the average atomic mass changes. | Not created | MISSING — IMPORT NOT REACHED |
| U348 | 369 | CONTENT | Interpretation | So: | Not created | MISSING — IMPORT NOT REACHED |
| U349 | 370 | CONTENT | Interpretation | **atomic mass** refers to one specific nuclide, | Not created | MISSING — IMPORT NOT REACHED |
| U350 | 371 | CONTENT | Interpretation | **atomic weight** refers to the isotopic mixture of an element, | Not created | MISSING — IMPORT NOT REACHED |
| U351 | 372 | CONTENT | Interpretation | **nuclear mass** refers to the nucleus alone. | Not created | MISSING — IMPORT NOT REACHED |
| U352 | 374 | H3 | Mass measurement and abundance measurement | ### Mass measurement and abundance measurement | Not created | MISSING — IMPORT NOT REACHED |
| U353 | 375 | CONTENT | Mass measurement and abundance measurement | A mass spectrograph or mass spectrometer separates ions according to mass-to-charge behavior and allows isotopes of different masses to be distinguished. | Not created | MISSING — IMPORT NOT REACHED |
| U354 | 376 | CONTENT | Mass measurement and abundance measurement | The location of a line or peak identifies the isotope mass. | Not created | MISSING — IMPORT NOT REACHED |
| U355 | 377 | CONTENT | Mass measurement and abundance measurement | The relative intensity or relative peak area gives the relative abundance of that isotope in the sample. | Not created | MISSING — IMPORT NOT REACHED |
| U356 | 378 | CONTENT | Mass measurement and abundance measurement | Thus the same general measurement framework supports both | Not created | MISSING — IMPORT NOT REACHED |
| U357 | 379 | CONTENT | Mass measurement and abundance measurement | identification of isotopes, | Not created | MISSING — IMPORT NOT REACHED |
| U358 | 380 | CONTENT | Mass measurement and abundance measurement | and determination of isotopic abundance. | Not created | MISSING — IMPORT NOT REACHED |
| U359 | 382 | H3 | Common mistakes to prevent | ### Common mistakes to prevent | Not created | MISSING — IMPORT NOT REACHED |
| U360 | 383 | CONTENT | Common mistakes to prevent | Do not confuse **mass number** with **atomic mass**. | Not created | MISSING — IMPORT NOT REACHED |
| U361 | 384 | CONTENT | Common mistakes to prevent | Do not call the weighted average atomic mass of an element the “mass number.” | Not created | MISSING — IMPORT NOT REACHED |
| U362 | 385 | CONTENT | Common mistakes to prevent | Do not forget that atomic mass refers to a **specific nuclide**, while atomic weight refers to an **isotopic mixture**. | Not created | MISSING — IMPORT NOT REACHED |
| U363 | 386 | CONTENT | Common mistakes to prevent | Do not use percentage abundances directly in the weighted-average formula without converting consistently. | Not created | MISSING — IMPORT NOT REACHED |
| U364 | 387 | CONTENT | Common mistakes to prevent | Do not forget that the nuclear mass excludes electrons. | Not created | MISSING — IMPORT NOT REACHED |
| U365 | 388 | H2 | 1.4 — Measuring atomic masses and isotopic abundances: velocity selector and mass spectrometer | ## 1.4 — Measuring atomic masses and isotopic abundances: velocity selector and mass spectrometer | Not created | MISSING — IMPORT NOT REACHED |
| U366 | 389 | H3 | YouTube video | ### YouTube video | Not created | MISSING — IMPORT NOT REACHED |
| U367 | 390 | CONTENT | YouTube video | [Mass spectrometer \| Physical Processes \| MCAT \| Khan Academy](https://www.youtube.com/watch?v=-YfemQNTkvA&utm_source=chatgpt.com) | Not created | MISSING — IMPORT NOT REACHED |
| U368 | 392 | H3 | Historical or experimental setup | ### Historical or experimental setup | Not created | MISSING — IMPORT NOT REACHED |
| U369 | 393 | CONTENT | Historical or experimental setup | Early positive-ray experiments showed that atoms of the same element could appear with different masses. | Not created | MISSING — IMPORT NOT REACHED |
| U370 | 394 | CONTENT | Historical or experimental setup | A mass spectrograph separates ions so that different isotopes produce different positions on a recording screen or plate. | Not created | MISSING — IMPORT NOT REACHED |
| U371 | 395 | CONTENT | Historical or experimental setup | A mass spectrometer performs a closely related task, but instead of only producing visible traces, it measures an electrical signal associated with the arriving ions. | Not created | MISSING — IMPORT NOT REACHED |
| U372 | 396 | CONTENT | Historical or experimental setup | In introductory nuclear physics, the essential idea is simple: | Not created | MISSING — IMPORT NOT REACHED |
| U373 | 397 | CONTENT | Historical or experimental setup | produce ions, | Not created | MISSING — IMPORT NOT REACHED |
| U374 | 398 | CONTENT | Historical or experimental setup | accelerate them, | Not created | MISSING — IMPORT NOT REACHED |
| U375 | 399 | CONTENT | Historical or experimental setup | select or determine their speed, | Not created | MISSING — IMPORT NOT REACHED |
| U376 | 400 | CONTENT | Historical or experimental setup | bend them in a magnetic field, | Not created | MISSING — IMPORT NOT REACHED |
| U377 | 401 | CONTENT | Historical or experimental setup | infer their mass or mass-to-charge ratio from the observed trajectory, | Not created | MISSING — IMPORT NOT REACHED |
| U378 | 402 | CONTENT | Historical or experimental setup | use signal strength to estimate relative abundance. | Not created | MISSING — IMPORT NOT REACHED |
| U379 | 404 | H3 | Physical basis / intuition | ### Physical basis / intuition | Not created | MISSING — IMPORT NOT REACHED |
| U380 | 405 | CONTENT | Physical basis / intuition | Charged particles respond to electric and magnetic fields. | Not created | MISSING — IMPORT NOT REACHED |
| U381 | 406 | CONTENT | Physical basis / intuition | An electric field can change the speed of an ion by doing work on it. | Not created | MISSING — IMPORT NOT REACHED |
| U382 | 407 | CONTENT | Physical basis / intuition | A magnetic field does not change the particle’s speed, but it changes the direction of motion by exerting a sideways force. | Not created | MISSING — IMPORT NOT REACHED |
| U383 | 408 | CONTENT | Physical basis / intuition | Since heavier ions are harder to bend than lighter ions moving with the same speed and charge, ions of different mass follow different paths. | Not created | MISSING — IMPORT NOT REACHED |
| U384 | 409 | CONTENT | Physical basis / intuition | That is the central operating idea of the mass spectrometer. | Not created | MISSING — IMPORT NOT REACHED |
| U385 | 410 | CONTENT | Physical basis / intuition | If the ions reaching the detector are all singly charged, then different detected paths correspond directly to different ionic masses. | Not created | MISSING — IMPORT NOT REACHED |
| U386 | 411 | CONTENT | Physical basis / intuition | If isotopes of the same element are present in the source, their different masses lead to different detector positions or different peaks in the recorded spectrum. | Not created | MISSING — IMPORT NOT REACHED |
| U387 | 413 | H3 | Definitions and core quantities | ### Definitions and core quantities | Not created | MISSING — IMPORT NOT REACHED |
| U388 | 414 | CONTENT | Definitions and core quantities | Let | Not created | MISSING — IMPORT NOT REACHED |
| U389 | 415 | CONTENT | Definitions and core quantities | $q$ be the ion charge, | Not created | MISSING — IMPORT NOT REACHED |
| U390 | 416 | CONTENT | Definitions and core quantities | $m$ be the ion mass, | Not created | MISSING — IMPORT NOT REACHED |
| U391 | 417 | CONTENT | Definitions and core quantities | $V$ be the accelerating potential difference, | Not created | MISSING — IMPORT NOT REACHED |
| U392 | 418 | CONTENT | Definitions and core quantities | $\mathbf{E}$ be the electric field in the selector, | Not created | MISSING — IMPORT NOT REACHED |
| U393 | 419 | CONTENT | Definitions and core quantities | $\mathbf{B}$ be the magnetic field, | Not created | MISSING — IMPORT NOT REACHED |
| U394 | 420 | CONTENT | Definitions and core quantities | $v$ be the ion speed, | Not created | MISSING — IMPORT NOT REACHED |
| U395 | 421 | CONTENT | Definitions and core quantities | $r$ be the radius of curvature in the magnetic field. | Not created | MISSING — IMPORT NOT REACHED |
| U396 | 422 | CONTENT | Definitions and core quantities | In this chunk, the key measured or controlled quantities are | Not created | MISSING — IMPORT NOT REACHED |
| U397 | 423 | CONTENT | Definitions and core quantities | accelerating voltage, | Not created | MISSING — IMPORT NOT REACHED |
| U398 | 424 | CONTENT | Definitions and core quantities | electric field, | Not created | MISSING — IMPORT NOT REACHED |
| U399 | 425 | CONTENT | Definitions and core quantities | magnetic field, | Not created | MISSING — IMPORT NOT REACHED |
| U400 | 426 | CONTENT | Definitions and core quantities | beam position or curvature radius, | Not created | MISSING — IMPORT NOT REACHED |
| U401 | 427 | CONTENT | Definitions and core quantities | ion current or peak height / peak area. | Not created | MISSING — IMPORT NOT REACHED |
| U402 | 428 | CONTENT | Definitions and core quantities | The key unknown is usually either | Not created | MISSING — IMPORT NOT REACHED |
| U403 | 429 | CONTENT | Definitions and core quantities | the mass $m$, | Not created | MISSING — IMPORT NOT REACHED |
| U404 | 430 | CONTENT | Definitions and core quantities | or the mass-to-charge ratio $m/q$. | Not created | MISSING — IMPORT NOT REACHED |
| U405 | 432 | H3 | Formation and collimation of the ion beam | ### Formation and collimation of the ion beam | Not created | MISSING — IMPORT NOT REACHED |
| U406 | 433 | CONTENT | Formation and collimation of the ion beam | The source material is first ionized so that charged particles are available. | Not created | MISSING — IMPORT NOT REACHED |
| U407 | 434 | CONTENT | Formation and collimation of the ion beam | These ions are extracted from the source and accelerated by an electric field. | Not created | MISSING — IMPORT NOT REACHED |
| U408 | 435 | CONTENT | Formation and collimation of the ion beam | Slits or diaphragms collimate the beam so that the ions travel in a narrow, well-defined path. | Not created | MISSING — IMPORT NOT REACHED |
| U409 | 436 | CONTENT | Formation and collimation of the ion beam | Collimation matters because the later separation of isotopes depends on small differences in trajectory. | Not created | MISSING — IMPORT NOT REACHED |
| U410 | 437 | CONTENT | Formation and collimation of the ion beam | If the beam spreads too much, nearby masses blur together and the instrument loses resolving power. | Not created | MISSING — IMPORT NOT REACHED |
| U411 | 439 | H3 | Mathematical setup | ### Mathematical setup | Not created | MISSING — IMPORT NOT REACHED |
| U412 | 440 | CONTENT | Mathematical setup | If an ion of charge $q$ is accelerated through a potential difference $V$, the electric field does work | Not created | MISSING — IMPORT NOT REACHED |
| U413 | 441 | CONTENT | Mathematical setup | $qV$ | Not created | MISSING — IMPORT NOT REACHED |
| U414 | 442 | CONTENT | Mathematical setup | on the ion. | Not created | MISSING — IMPORT NOT REACHED |
| U415 | 443 | CONTENT | Mathematical setup | If the ion starts from rest or from a negligibly small initial kinetic energy, then | Not created | MISSING — IMPORT NOT REACHED |
| U416 | 444 | CONTENT | Mathematical setup | $qV=\frac{1}{2}mv^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U417 | 445 | CONTENT | Mathematical setup | Solving for the speed gives | Not created | MISSING — IMPORT NOT REACHED |
| U418 | 446 | CONTENT | Mathematical setup | $v=\sqrt{\frac{2qV}{m}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U419 | 447 | CONTENT | Mathematical setup | If the ion then enters a magnetic field perpendicular to its velocity, the magnetic force has magnitude | Not created | MISSING — IMPORT NOT REACHED |
| U420 | 448 | CONTENT | Mathematical setup | $F_B=qvB$ | Not created | MISSING — IMPORT NOT REACHED |
| U421 | 449 | CONTENT | Mathematical setup | This force supplies the centripetal force needed for circular motion: | Not created | MISSING — IMPORT NOT REACHED |
| U422 | 450 | CONTENT | Mathematical setup | $qvB=\frac{mv^2}{r}$ | Not created | MISSING — IMPORT NOT REACHED |
| U423 | 451 | CONTENT | Mathematical setup | Hence | Not created | MISSING — IMPORT NOT REACHED |
| U424 | 452 | CONTENT | Mathematical setup | $r=\frac{mv}{qB}$ | Not created | MISSING — IMPORT NOT REACHED |
| U425 | 453 | CONTENT | Mathematical setup | Therefore, for fixed $v$, $q$, and $B$, | Not created | MISSING — IMPORT NOT REACHED |
| U426 | 454 | CONTENT | Mathematical setup | a larger mass $m$ gives a larger radius $r$, | Not created | MISSING — IMPORT NOT REACHED |
| U427 | 455 | CONTENT | Mathematical setup | a smaller mass gives a smaller radius. | Not created | MISSING — IMPORT NOT REACHED |
| U428 | 457 | H3 | Derivation for the basic accelerating-field plus magnetic-analyzer form | ### Derivation for the basic accelerating-field plus magnetic-analyzer form | Not created | MISSING — IMPORT NOT REACHED |
| U429 | 458 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | Start from | Not created | MISSING — IMPORT NOT REACHED |
| U430 | 459 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $qV=\frac{1}{2}mv^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U431 | 460 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | so that | Not created | MISSING — IMPORT NOT REACHED |
| U432 | 461 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $v=\sqrt{\frac{2qV}{m}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U433 | 462 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | Substitute this into | Not created | MISSING — IMPORT NOT REACHED |
| U434 | 463 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $r=\frac{mv}{qB}$ | Not created | MISSING — IMPORT NOT REACHED |
| U435 | 464 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | Then | Not created | MISSING — IMPORT NOT REACHED |
| U436 | 465 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $r=\frac{m}{qB}\sqrt{\frac{2qV}{m}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U437 | 466 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | Rearranging gives | Not created | MISSING — IMPORT NOT REACHED |
| U438 | 467 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $r=\sqrt{\frac{2mV}{qB^2}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U439 | 468 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | Therefore | Not created | MISSING — IMPORT NOT REACHED |
| U440 | 469 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $\frac{m}{q}=\frac{B^2r^2}{2V}$ | Not created | MISSING — IMPORT NOT REACHED |
| U441 | 470 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | If the ions are singly ionized, so that | Not created | MISSING — IMPORT NOT REACHED |
| U442 | 471 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | $q=e,$ | Not created | MISSING — IMPORT NOT REACHED |
| U443 | 472 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | then the measured radius determines the ion mass directly: | Not created | MISSING — IMPORT NOT REACHED |
| U444 | 478 | CONTENT | Derivation for the basic accelerating-field plus magnetic-analyzer form | This is the core relation behind the simple mass spectrometer treatment used in this part of the course. | Not created | MISSING — IMPORT NOT REACHED |
| U445 | 480 | H3 | Velocity selector | ### Velocity selector | Not created | MISSING — IMPORT NOT REACHED |
| U446 | 481 | CONTENT | Velocity selector | In a more refined arrangement, ions first pass through crossed electric and magnetic fields. | Not created | MISSING — IMPORT NOT REACHED |
| U447 | 482 | CONTENT | Velocity selector | The fields are arranged so that the electric force and magnetic force act in opposite directions. | Not created | MISSING — IMPORT NOT REACHED |
| U448 | 483 | CONTENT | Velocity selector | For an ion to pass undeflected through the selector, these forces must balance: | Not created | MISSING — IMPORT NOT REACHED |
| U449 | 484 | CONTENT | Velocity selector | $qE=qvB_1$ | Not created | MISSING — IMPORT NOT REACHED |
| U450 | 485 | CONTENT | Velocity selector | Therefore, the selected speed is | Not created | MISSING — IMPORT NOT REACHED |
| U451 | 486 | CONTENT | Velocity selector | $v=\frac{E}{B_1}$ | Not created | MISSING — IMPORT NOT REACHED |
| U452 | 487 | CONTENT | Velocity selector | where $B_1$ is the magnetic field in the selector region. | Not created | MISSING — IMPORT NOT REACHED |
| U453 | 488 | CONTENT | Velocity selector | This result does **not** say that every ion has speed $E/B_1$. | Not created | MISSING — IMPORT NOT REACHED |
| U454 | 489 | CONTENT | Velocity selector | It says only that ions with this particular speed pass straight through the selector. | Not created | MISSING — IMPORT NOT REACHED |
| U455 | 490 | CONTENT | Velocity selector | Slower or faster ions are deflected and do not continue along the chosen path. | Not created | MISSING — IMPORT NOT REACHED |
| U456 | 492 | H3 | Magnetic analyzer after the selector | ### Magnetic analyzer after the selector | Not created | MISSING — IMPORT NOT REACHED |
| U457 | 493 | CONTENT | Magnetic analyzer after the selector | After the selector, the remaining ions all have the same speed | Not created | MISSING — IMPORT NOT REACHED |
| U458 | 494 | CONTENT | Magnetic analyzer after the selector | $v=\frac{E}{B_1}$ | Not created | MISSING — IMPORT NOT REACHED |
| U459 | 495 | CONTENT | Magnetic analyzer after the selector | If they then enter a second magnetic field $B_2$, they move in circular arcs with | Not created | MISSING — IMPORT NOT REACHED |
| U460 | 496 | CONTENT | Magnetic analyzer after the selector | $qvB_2=\frac{mv^2}{r}$ | Not created | MISSING — IMPORT NOT REACHED |
| U461 | 497 | CONTENT | Magnetic analyzer after the selector | Hence | Not created | MISSING — IMPORT NOT REACHED |
| U462 | 498 | CONTENT | Magnetic analyzer after the selector | $r=\frac{mv}{qB_2}$ | Not created | MISSING — IMPORT NOT REACHED |
| U463 | 499 | CONTENT | Magnetic analyzer after the selector | Solving for $m/q$, | Not created | MISSING — IMPORT NOT REACHED |
| U464 | 500 | CONTENT | Magnetic analyzer after the selector | $\frac{m}{q}=\frac{B_2r}{v}$ | Not created | MISSING — IMPORT NOT REACHED |
| U465 | 501 | CONTENT | Magnetic analyzer after the selector | Using the selector result $v=E/B_1$, | Not created | MISSING — IMPORT NOT REACHED |
| U466 | 502 | CONTENT | Magnetic analyzer after the selector | $\frac{m}{q}=\frac{B_1B_2r}{E}$ | Not created | MISSING — IMPORT NOT REACHED |
| U467 | 503 | CONTENT | Magnetic analyzer after the selector | If the same magnetic-field magnitude is used in both regions, $B_1=B_2=B$, then | Not created | MISSING — IMPORT NOT REACHED |
| U468 | 504 | CONTENT | Magnetic analyzer after the selector | $\frac{m}{q}=\frac{B^2r}{E}$ | Not created | MISSING — IMPORT NOT REACHED |
| U469 | 505 | CONTENT | Magnetic analyzer after the selector | This form shows very clearly why the velocity selector is useful: | Not created | MISSING — IMPORT NOT REACHED |
| U470 | 506 | CONTENT | Magnetic analyzer after the selector | it removes the speed variation first, | Not created | MISSING — IMPORT NOT REACHED |
| U471 | 507 | CONTENT | Magnetic analyzer after the selector | so the curvature in the analyzer depends only on $m/q$. | Not created | MISSING — IMPORT NOT REACHED |
| U472 | 509 | H3 | Measuring isotopic abundance | ### Measuring isotopic abundance | Not created | MISSING — IMPORT NOT REACHED |
| U473 | 510 | CONTENT | Measuring isotopic abundance | Once isotopes are separated, the detector records a signal for each mass. | Not created | MISSING — IMPORT NOT REACHED |
| U474 | 511 | CONTENT | Measuring isotopic abundance | In a spectrograph, this appears as separate lines or traces. | Not created | MISSING — IMPORT NOT REACHED |
| U475 | 512 | CONTENT | Measuring isotopic abundance | In a spectrometer, it appears as separate peaks in ion current or collected signal. | Not created | MISSING — IMPORT NOT REACHED |
| U476 | 513 | CONTENT | Measuring isotopic abundance | The **position** of a line or peak identifies the isotope mass or mass-to-charge ratio. | Not created | MISSING — IMPORT NOT REACHED |
| U477 | 514 | CONTENT | Measuring isotopic abundance | The **relative size** of the signal indicates how much of that isotope is present in the sample. | Not created | MISSING — IMPORT NOT REACHED |
| U478 | 515 | CONTENT | Measuring isotopic abundance | Thus: | Not created | MISSING — IMPORT NOT REACHED |
| U479 | 516 | CONTENT | Measuring isotopic abundance | peak position $\rightarrow$ mass identification, | Not created | MISSING — IMPORT NOT REACHED |
| U480 | 517 | CONTENT | Measuring isotopic abundance | peak height or peak area $\rightarrow$ relative abundance. | Not created | MISSING — IMPORT NOT REACHED |
| U481 | 518 | CONTENT | Measuring isotopic abundance | If the abundances are normalized, the fractions must satisfy | Not created | MISSING — IMPORT NOT REACHED |
| U482 | 519 | CONTENT | Measuring isotopic abundance | $\sum_i f_i=1$ | Not created | MISSING — IMPORT NOT REACHED |
| U483 | 520 | CONTENT | Measuring isotopic abundance | These abundance fractions can then be used to compute the average atomic mass: | Not created | MISSING — IMPORT NOT REACHED |
| U484 | 521 | CONTENT | Measuring isotopic abundance | $\overline{M}=\sum_i f_i M_i$ | Not created | MISSING — IMPORT NOT REACHED |
| U485 | 523 | H3 | Interpretation | ### Interpretation | Not created | MISSING — IMPORT NOT REACHED |
| U486 | 524 | CONTENT | Interpretation | The instrument does not “see” isotope labels. | Not created | MISSING — IMPORT NOT REACHED |
| U487 | 525 | CONTENT | Interpretation | It detects how ions with given charge and speed respond to electromagnetic fields. | Not created | MISSING — IMPORT NOT REACHED |
| U488 | 526 | CONTENT | Interpretation | The separation occurs because different isotopes have different masses, and therefore different trajectories. | Not created | MISSING — IMPORT NOT REACHED |
| U489 | 527 | CONTENT | Interpretation | The mass spectrometer is therefore both | Not created | MISSING — IMPORT NOT REACHED |
| U490 | 528 | CONTENT | Interpretation | a mass-measuring device, | Not created | MISSING — IMPORT NOT REACHED |
| U491 | 529 | CONTENT | Interpretation | and an abundance-measuring device. | Not created | MISSING — IMPORT NOT REACHED |
| U492 | 530 | CONTENT | Interpretation | This is why it fits naturally after the previous chunk on atomic mass and atomic weight: | Not created | MISSING — IMPORT NOT REACHED |
| U493 | 531 | CONTENT | Interpretation | the atomic masses are obtained from mass measurements, | Not created | MISSING — IMPORT NOT REACHED |
| U494 | 532 | CONTENT | Interpretation | the isotopic abundances are obtained from the relative detector signals, | Not created | MISSING — IMPORT NOT REACHED |
| U495 | 533 | CONTENT | Interpretation | and together they give the tabulated average atomic mass of an element. | Not created | MISSING — IMPORT NOT REACHED |
| U496 | 535 | H3 | Limitations | ### Limitations | Not created | MISSING — IMPORT NOT REACHED |
| U497 | 536 | CONTENT | Limitations | In general, the instrument measures | Not created | MISSING — IMPORT NOT REACHED |
| U498 | 537 | CONTENT | Limitations | $\frac{m}{q}$ | Not created | MISSING — IMPORT NOT REACHED |
| U499 | 538 | CONTENT | Limitations | rather than $m$ alone. | Not created | MISSING — IMPORT NOT REACHED |
| U500 | 539 | CONTENT | Limitations | To infer the mass itself, the charge state must be known. | Not created | MISSING — IMPORT NOT REACHED |
| U501 | 540 | CONTENT | Limitations | If ions have multiple charge states, interpretation becomes more complicated because different values of $m/q$ may appear. | Not created | MISSING — IMPORT NOT REACHED |
| U502 | 541 | CONTENT | Limitations | The derivations here assume | Not created | MISSING — IMPORT NOT REACHED |
| U503 | 542 | CONTENT | Limitations | nonrelativistic motion, | Not created | MISSING — IMPORT NOT REACHED |
| U504 | 543 | CONTENT | Limitations | well-collimated beams, | Not created | MISSING — IMPORT NOT REACHED |
| U505 | 544 | CONTENT | Limitations | uniform fields, | Not created | MISSING — IMPORT NOT REACHED |
| U506 | 545 | CONTENT | Limitations | negligible collisions while the ions travel through the instrument. | Not created | MISSING — IMPORT NOT REACHED |
| U507 | 546 | CONTENT | Limitations | These are appropriate assumptions for the introductory treatment. | Not created | MISSING — IMPORT NOT REACHED |
| U508 | 548 | H3 | Common mistakes to prevent | ### Common mistakes to prevent | Not created | MISSING — IMPORT NOT REACHED |
| U509 | 549 | CONTENT | Common mistakes to prevent | Do not write | Not created | MISSING — IMPORT NOT REACHED |
| U510 | 550 | CONTENT | Common mistakes to prevent | $v=\frac{E}{B}$ | Not created | MISSING — IMPORT NOT REACHED |
| U511 | 551 | CONTENT | Common mistakes to prevent | unless you are specifically referring to the **undeflected speed in the velocity selector**. | Not created | MISSING — IMPORT NOT REACHED |
| U512 | 552 | CONTENT | Common mistakes to prevent | Do not confuse the electric field symbol $E$ with energy. | Not created | MISSING — IMPORT NOT REACHED |
| U513 | 553 | CONTENT | Common mistakes to prevent | Electric field is a field quantity. | Not created | MISSING — IMPORT NOT REACHED |
| U514 | 554 | CONTENT | Common mistakes to prevent | Energy is measured in joules or eV. | Not created | MISSING — IMPORT NOT REACHED |
| U515 | 555 | CONTENT | Common mistakes to prevent | Do not forget that the magnetic field bends the path but does not do work on the ion. | Not created | MISSING — IMPORT NOT REACHED |
| U516 | 556 | CONTENT | Common mistakes to prevent | Do not forget that the analyzer fundamentally gives | Not created | MISSING — IMPORT NOT REACHED |
| U517 | 557 | CONTENT | Common mistakes to prevent | $m/q$ | Not created | MISSING — IMPORT NOT REACHED |
| U518 | 558 | CONTENT | Common mistakes to prevent | unless the charge state is known. | Not created | MISSING — IMPORT NOT REACHED |
| U519 | 559 | CONTENT | Common mistakes to prevent | Do not mix the two different setups: | Not created | MISSING — IMPORT NOT REACHED |
| U520 | 560 | CONTENT | Common mistakes to prevent | accelerating-potential plus magnetic analyzer, | Not created | MISSING — IMPORT NOT REACHED |
| U521 | 561 | CONTENT | Common mistakes to prevent | crossed-field selector plus magnetic analyzer. | Not created | MISSING — IMPORT NOT REACHED |
| U522 | 562 | CONTENT | Common mistakes to prevent | Do not interpret peak height alone as an exact abundance unless the measurement conditions and normalization are properly controlled. | Not created | MISSING — IMPORT NOT REACHED |
| U523 | 564 | H2 | 1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis | ## 1.5 — Rutherford alpha scattering experiment and the nuclear hypothesis | Not created | MISSING — IMPORT NOT REACHED |
| U524 | 565 | H3 | YouTube video | ### YouTube video | Not created | MISSING — IMPORT NOT REACHED |
| U525 | 566 | CONTENT | YouTube video | [Rutherford's gold foil experiment \| Electronic structure of atoms \| Chemistry \| Khan Academy](https://www.youtube.com/watch?v=bVlwH1kfDeg&utm_source=chatgpt.com) | Not created | MISSING — IMPORT NOT REACHED |
| U526 | 568 | H3 | Historical or experimental setup | ### Historical or experimental setup | Not created | MISSING — IMPORT NOT REACHED |
| U527 | 569 | CONTENT | Historical or experimental setup | Before Rutherford’s work, one influential atomic picture was Thomson’s model, in which the positive charge of the atom was spread out through the atomic volume and the electrons were embedded within it. | Not created | MISSING — IMPORT NOT REACHED |
| U528 | 570 | CONTENT | Historical or experimental setup | In that picture, the atom did not contain a tiny, dense central core carrying almost all the positive charge and mass. | Not created | MISSING — IMPORT NOT REACHED |
| U529 | 571 | CONTENT | Historical or experimental setup | Rutherford, with Geiger and Marsden, tested atomic structure by directing $\alpha$-particles onto a very thin metal foil, especially gold. | Not created | MISSING — IMPORT NOT REACHED |
| U530 | 572 | CONTENT | Historical or experimental setup | An $\alpha$-particle may be treated here as a positively charged helium nucleus with charge | Not created | MISSING — IMPORT NOT REACHED |
| U531 | 573 | CONTENT | Historical or experimental setup | $q_\alpha = +2e .$ | Not created | MISSING — IMPORT NOT REACHED |
| U532 | 574 | CONTENT | Historical or experimental setup | The essential parts of the arrangement were | Not created | MISSING — IMPORT NOT REACHED |
| U533 | 575 | CONTENT | Historical or experimental setup | a radioactive $\alpha$-source, | Not created | MISSING — IMPORT NOT REACHED |
| U534 | 576 | CONTENT | Historical or experimental setup | a collimating slit or diaphragm to produce a narrow beam, | Not created | MISSING — IMPORT NOT REACHED |
| U535 | 577 | CONTENT | Historical or experimental setup | a very thin metal foil, | Not created | MISSING — IMPORT NOT REACHED |
| U536 | 578 | CONTENT | Historical or experimental setup | and a movable detector screen or microscope to observe scattered particles at different angles. | Not created | MISSING — IMPORT NOT REACHED |
| U537 | 579 | CONTENT | Historical or experimental setup | The experiment was carried out in a good vacuum so that the $\alpha$-particles would not be significantly deflected by air before reaching the foil. | Not created | MISSING — IMPORT NOT REACHED |
| U538 | 581 | H3 | Physical basis / intuition | ### Physical basis / intuition | Not created | MISSING — IMPORT NOT REACHED |
| U539 | 582 | CONTENT | Physical basis / intuition | The incoming $\alpha$-particles are positively charged. | Not created | MISSING — IMPORT NOT REACHED |
| U540 | 583 | CONTENT | Physical basis / intuition | If the positive charge inside the atom were spread diffusely through the whole atom, the electric force on a fast, heavy $\alpha$-particle passing through a thin foil would generally be weak and distributed over a larger region. | Not created | MISSING — IMPORT NOT REACHED |
| U541 | 584 | CONTENT | Physical basis / intuition | One would then expect mainly very small deflections. | Not created | MISSING — IMPORT NOT REACHED |
| U542 | 585 | CONTENT | Physical basis / intuition | Large-angle deflections would be extremely unlikely in such a diffuse-charge model. | Not created | MISSING — IMPORT NOT REACHED |
| U543 | 586 | CONTENT | Physical basis / intuition | Therefore, the pattern of scattering angles provides direct information about how charge and mass are distributed inside the atom. | Not created | MISSING — IMPORT NOT REACHED |
| U544 | 588 | H3 | Definitions and core quantities | ### Definitions and core quantities | Not created | MISSING — IMPORT NOT REACHED |
| U545 | 589 | CONTENT | Definitions and core quantities | Let | Not created | MISSING — IMPORT NOT REACHED |
| U546 | 590 | CONTENT | Definitions and core quantities | $\theta$ be the scattering angle, | Not created | MISSING — IMPORT NOT REACHED |
| U547 | 591 | CONTENT | Definitions and core quantities | $b$ be the impact parameter, meaning the perpendicular offset between the initial beam direction and the center of the target nucleus, | Not created | MISSING — IMPORT NOT REACHED |
| U548 | 592 | CONTENT | Definitions and core quantities | $Z$ be the atomic number of the target nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U549 | 593 | CONTENT | Definitions and core quantities | In this chunk, the focus is not yet the full mathematical scattering formula. | Not created | MISSING — IMPORT NOT REACHED |
| U550 | 594 | CONTENT | Definitions and core quantities | The focus is the experimental observation and the structural conclusion drawn from it. | Not created | MISSING — IMPORT NOT REACHED |
| U551 | 596 | H3 | Main observations | ### Main observations | Not created | MISSING — IMPORT NOT REACHED |
| U552 | 597 | CONTENT | Main observations | Most of the $\alpha$-particles passed through the foil with either | Not created | MISSING — IMPORT NOT REACHED |
| U553 | 598 | CONTENT | Main observations | no noticeable deflection, | Not created | MISSING — IMPORT NOT REACHED |
| U554 | 599 | CONTENT | Main observations | or only a small deflection. | Not created | MISSING — IMPORT NOT REACHED |
| U555 | 600 | CONTENT | Main observations | A much smaller fraction were scattered through moderate angles. | Not created | MISSING — IMPORT NOT REACHED |
| U556 | 601 | CONTENT | Main observations | A very tiny fraction were scattered through very large angles. | Not created | MISSING — IMPORT NOT REACHED |
| U557 | 602 | CONTENT | Main observations | A few were even scattered backward, meaning through angles approaching | Not created | MISSING — IMPORT NOT REACHED |
| U558 | 603 | CONTENT | Main observations | $180^\circ .$ | Not created | MISSING — IMPORT NOT REACHED |
| U559 | 604 | CONTENT | Main observations | The crucial point is not that many particles were reflected backward. | Not created | MISSING — IMPORT NOT REACHED |
| U560 | 605 | CONTENT | Main observations | The crucial point is that **any** appreciable number of large-angle events occurred at all, because that was highly unexpected from a diffuse positive-charge model. | Not created | MISSING — IMPORT NOT REACHED |
| U561 | 607 | H3 | Why the result was surprising | ### Why the result was surprising | Not created | MISSING — IMPORT NOT REACHED |
| U562 | 608 | CONTENT | Why the result was surprising | In Thomson’s model, the positive charge is spread out over a region of atomic size, roughly | Not created | MISSING — IMPORT NOT REACHED |
| U563 | 609 | CONTENT | Why the result was surprising | $10^{-10}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U564 | 610 | CONTENT | Why the result was surprising | A heavy, fast $\alpha$-particle passing through such a diffuse distribution should experience many weak interactions rather than one strong, concentrated repulsive interaction. | Not created | MISSING — IMPORT NOT REACHED |
| U565 | 611 | CONTENT | Why the result was surprising | That would produce mainly small cumulative deviations. | Not created | MISSING — IMPORT NOT REACHED |
| U566 | 612 | CONTENT | Why the result was surprising | It would not naturally explain rare but very large-angle scattering events. | Not created | MISSING — IMPORT NOT REACHED |
| U567 | 613 | CONTENT | Why the result was surprising | Therefore, the observation of large-angle scattering was evidence against the idea that positive charge is smeared uniformly across the entire atom. | Not created | MISSING — IMPORT NOT REACHED |
| U568 | 615 | H3 | Interpretation | ### Interpretation | Not created | MISSING — IMPORT NOT REACHED |
| U569 | 616 | CONTENT | Interpretation | Rutherford interpreted the results by proposing that the atom contains a very small central nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U570 | 617 | CONTENT | Interpretation | This nucleus must be | Not created | MISSING — IMPORT NOT REACHED |
| U571 | 618 | CONTENT | Interpretation | positively charged, | Not created | MISSING — IMPORT NOT REACHED |
| U572 | 619 | CONTENT | Interpretation | very massive compared with the electrons, | Not created | MISSING — IMPORT NOT REACHED |
| U573 | 620 | CONTENT | Interpretation | and very small compared with the overall atomic size. | Not created | MISSING — IMPORT NOT REACHED |
| U574 | 621 | CONTENT | Interpretation | In this picture: | Not created | MISSING — IMPORT NOT REACHED |
| U575 | 622 | CONTENT | Interpretation | most $\alpha$-particles pass through with little or no deflection because most of the atomic volume contains no concentrated mass or charge, | Not created | MISSING — IMPORT NOT REACHED |
| U576 | 623 | CONTENT | Interpretation | particles that pass close to the nucleus experience a strong Coulomb repulsion and are scattered through large angles. | Not created | MISSING — IMPORT NOT REACHED |
| U577 | 624 | CONTENT | Interpretation | This explains both observations at once: | Not created | MISSING — IMPORT NOT REACHED |
| U578 | 625 | CONTENT | Interpretation | mostly straight-line passage, | Not created | MISSING — IMPORT NOT REACHED |
| U579 | 626 | CONTENT | Interpretation | rare but dramatic large-angle deflections. | Not created | MISSING — IMPORT NOT REACHED |
| U580 | 628 | H3 | The nuclear hypothesis | ### The nuclear hypothesis | Not created | MISSING — IMPORT NOT REACHED |
| U581 | 629 | CONTENT | The nuclear hypothesis | The nuclear hypothesis can be stated as follows: | Not created | MISSING — IMPORT NOT REACHED |
| U582 | 630 | CONTENT | The nuclear hypothesis | nearly all the positive charge of the atom is concentrated in a tiny central nucleus, | Not created | MISSING — IMPORT NOT REACHED |
| U583 | 631 | CONTENT | The nuclear hypothesis | nearly all the mass of the atom is also concentrated there, | Not created | MISSING — IMPORT NOT REACHED |
| U584 | 632 | CONTENT | The nuclear hypothesis | electrons occupy the much larger surrounding region. | Not created | MISSING — IMPORT NOT REACHED |
| U585 | 633 | CONTENT | The nuclear hypothesis | Thus the atom is mostly empty space in the sense that the nucleus occupies only a tiny fraction of the atomic volume. | Not created | MISSING — IMPORT NOT REACHED |
| U586 | 634 | CONTENT | The nuclear hypothesis | If the atom has characteristic size of order | Not created | MISSING — IMPORT NOT REACHED |
| U587 | 635 | CONTENT | The nuclear hypothesis | $10^{-10}\,\text{m}$ | Not created | MISSING — IMPORT NOT REACHED |
| U588 | 636 | CONTENT | The nuclear hypothesis | while the nuclear scale is much smaller, then the overwhelming majority of an atom’s volume lies outside the nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U589 | 638 | H3 | Why most of the atom must be empty space | ### Why most of the atom must be empty space | Not created | MISSING — IMPORT NOT REACHED |
| U590 | 639 | CONTENT | Why most of the atom must be empty space | Since most $\alpha$-particles passed through the foil with little deflection, they usually did not encounter any strong concentrated repulsive center. | Not created | MISSING — IMPORT NOT REACHED |
| U591 | 640 | CONTENT | Why most of the atom must be empty space | If mass and positive charge had filled the entire atomic volume densely, strong deflections would have been common. | Not created | MISSING — IMPORT NOT REACHED |
| U592 | 641 | CONTENT | Why most of the atom must be empty space | Because they were not common, the strong scattering center must occupy only a tiny fraction of the atomic volume. | Not created | MISSING — IMPORT NOT REACHED |
| U593 | 642 | CONTENT | Why most of the atom must be empty space | Therefore, the atom cannot be a uniformly filled solid object. | Not created | MISSING — IMPORT NOT REACHED |
| U594 | 643 | CONTENT | Why most of the atom must be empty space | In the Rutherford picture, the atom is mostly empty space surrounding a tiny dense nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U595 | 645 | H3 | Experimental observation versus theoretical conclusion | ### Experimental observation versus theoretical conclusion | Not created | MISSING — IMPORT NOT REACHED |
| U596 | 646 | CONTENT | Experimental observation versus theoretical conclusion | The experiment **observed** | Not created | MISSING — IMPORT NOT REACHED |
| U597 | 647 | CONTENT | Experimental observation versus theoretical conclusion | mostly undeflected particles, | Not created | MISSING — IMPORT NOT REACHED |
| U598 | 648 | CONTENT | Experimental observation versus theoretical conclusion | some small-angle scattering, | Not created | MISSING — IMPORT NOT REACHED |
| U599 | 649 | CONTENT | Experimental observation versus theoretical conclusion | a very small number of large-angle events. | Not created | MISSING — IMPORT NOT REACHED |
| U600 | 650 | CONTENT | Experimental observation versus theoretical conclusion | The experiment then **supported the inference** | Not created | MISSING — IMPORT NOT REACHED |
| U601 | 651 | CONTENT | Experimental observation versus theoretical conclusion | that positive charge and most atomic mass are concentrated in a tiny nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U602 | 652 | CONTENT | Experimental observation versus theoretical conclusion | It is important to keep these separate. | Not created | MISSING — IMPORT NOT REACHED |
| U603 | 653 | CONTENT | Experimental observation versus theoretical conclusion | The detector sees scattered $\alpha$-particles. | Not created | MISSING — IMPORT NOT REACHED |
| U604 | 654 | CONTENT | Experimental observation versus theoretical conclusion | The nuclear model is the interpretation that explains the scattering pattern. | Not created | MISSING — IMPORT NOT REACHED |
| U605 | 656 | H3 | Limitations | ### Limitations | Not created | MISSING — IMPORT NOT REACHED |
| U606 | 657 | CONTENT | Limitations | This experiment established the existence of a compact central nucleus, but it did not by itself provide a complete theory of atomic structure. | Not created | MISSING — IMPORT NOT REACHED |
| U607 | 658 | CONTENT | Limitations | In particular, the classical Rutherford atom with orbiting electrons does not explain atomic stability or discrete atomic spectra. | Not created | MISSING — IMPORT NOT REACHED |
| U608 | 659 | CONTENT | Limitations | Those issues belong to later developments in atomic theory. | Not created | MISSING — IMPORT NOT REACHED |
| U609 | 660 | CONTENT | Limitations | Also, this chunk stops short of the full Rutherford scattering formula and the detailed closest-approach calculation, which belong to the next stage of the topic. | Not created | MISSING — IMPORT NOT REACHED |
| U610 | 662 | H3 | Common mistakes to prevent | ### Common mistakes to prevent | Not created | MISSING — IMPORT NOT REACHED |
| U611 | 663 | CONTENT | Common mistakes to prevent | Do not say that most $\alpha$-particles bounced backward. | Not created | MISSING — IMPORT NOT REACHED |
| U612 | 664 | CONTENT | Common mistakes to prevent | Most passed through nearly straight. | Not created | MISSING — IMPORT NOT REACHED |
| U613 | 665 | CONTENT | Common mistakes to prevent | Do not say that the experiment proved the exact nuclear radius. | Not created | MISSING — IMPORT NOT REACHED |
| U614 | 666 | CONTENT | Common mistakes to prevent | It provided strong evidence for a very small, dense nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U615 | 667 | CONTENT | Common mistakes to prevent | Do not confuse the experimental observation with the model used to explain it. | Not created | MISSING — IMPORT NOT REACHED |
| U616 | 668 | CONTENT | Common mistakes to prevent | Do not describe the atom as a solid filled sphere after Rutherford’s result. | Not created | MISSING — IMPORT NOT REACHED |
| U617 | 669 | CONTENT | Common mistakes to prevent | The main conclusion is that most of the atom is empty space. | Not created | MISSING — IMPORT NOT REACHED |

## Formula fidelity audit

- Verified-branch formula-bearing units: 27/196
- Partial chunk-6 formula-bearing units: 16
- Rich-math representations independently verified: 0
- Overall classification: `PLAIN_TEXT_FALLBACK_OR_NOT_VERIFIED`

| Unit ID | Line | Branch | Source text | Observed representation | Classification |
| --- | --- | --- | --- | --- | --- |
| U023 | 25 | Definitions and core quantities | If a nucleus has mass number $A$, then it contains $A$ nucleons in total. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U025 | 27 | Definitions and core quantities | An element is identified by its atomic number $Z$. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U026 | 28 | Definitions and core quantities | All nuclei with the same $Z$ belong to the same element. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U027 | 29 | Definitions and core quantities | Changing $Z$ changes the element. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U029 | 31 | Definitions and core quantities | The atomic number $Z$ is the number of protons in the nucleus. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U032 | 34 | Definitions and core quantities | The mass number $A$ is the total number of nucleons in the nucleus: | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U033 | 35 | Definitions and core quantities | $A=Z+N$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U036 | 38 | Definitions and core quantities | The neutron number $N$ is the number of neutrons in the nucleus: | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U037 | 39 | Definitions and core quantities | $N=A-Z$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U039 | 41 | Definitions and core quantities | A nuclide is a specific nuclear species characterized by definite values of $A$ and $Z$. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U040 | 42 | Definitions and core quantities | Two nuclei are different nuclides if either $A$ or $Z$ is different. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U043 | 46 | Nuclear notation | ${}^{A}_{Z}X$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U045 | 48 | Nuclear notation | $X$ is the chemical symbol, | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U046 | 49 | Nuclear notation | $Z$ is the atomic number, | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U047 | 50 | Nuclear notation | $A$ is the mass number. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U049 | 52 | Nuclear notation | $N=A-Z$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U050 | 53 | Nuclear notation | the neutron number is obtained immediately once $A$ and $Z$ are known. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U052 | 55 | Nuclear notation | ${}^{12}_{6}\mathrm{C}$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U053 | 56 | Nuclear notation | $Z=6$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U054 | 57 | Nuclear notation | $A=12$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U055 | 58 | Nuclear notation | $N=12-6=6$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U056 | 59 | Nuclear notation | ${}^{238}_{92}\mathrm{U}$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U057 | 60 | Nuclear notation | $Z=92$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U058 | 61 | Nuclear notation | $A=238$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U059 | 62 | Nuclear notation | $N=238-92=146$ | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U060 | 63 | Nuclear notation | It is also common to write $^{A}\!X$ when the element symbol already makes $Z$ obvious, for example $^{14}\mathrm{C}$ or $^{235}\mathrm{U}$. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U061 | 64 | Nuclear notation | In nuclear equations, writing both $A$ and $Z$ is safer because both must be tracked explicitly. | Rendered/plain-text representation present | PLAIN_TEXT_FALLBACK — normalized text verified; rich math not independently verified |
| U064 | 68 | Classification of nuclides | Isotopes are nuclides with the same atomic number $Z$ but different mass number $A$. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U065 | 69 | Classification of nuclides | Since $Z$ is the same, they are nuclei of the same element. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U066 | 70 | Classification of nuclides | Because $A$ is different, their neutron number is different. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U068 | 72 | Classification of nuclides | ${}^{235}\mathrm{U}$ and ${}^{238}\mathrm{U}$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U069 | 73 | Classification of nuclides | both have $Z=92$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U072 | 76 | Classification of nuclides | Isotones are nuclides with the same neutron number $N$ but different atomic number $Z$. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U074 | 78 | Classification of nuclides | ${}^{13}_{6}\mathrm{C}$, ${}^{14}_{7}\mathrm{N}$, and ${}^{15}_{8}\mathrm{O}$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U076 | 80 | Classification of nuclides | $N=A-Z=7$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U079 | 83 | Classification of nuclides | Isobars are nuclides with the same mass number $A$ but different atomic number $Z$. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U081 | 85 | Classification of nuclides | ${}^{3}_{1}\mathrm{H}$ and ${}^{3}_{2}\mathrm{He}$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U082 | 86 | Classification of nuclides | both have $A=3$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U083 | 87 | Classification of nuclides | but they have different $Z$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U087 | 91 | Classification of nuclides | If one nucleus has $(Z,N)$, its mirror partner has $(N,Z)$. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U089 | 93 | Classification of nuclides | ${}^{3}_{1}\mathrm{H}$ has $(Z,N)=(1,2)$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U090 | 94 | Classification of nuclides | ${}^{3}_{2}\mathrm{He}$ has $(Z,N)=(2,1)$ | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U092 | 96 | Classification of nuclides | Another example is ${}^{13}_{6}\mathrm{C}$ and ${}^{13}_{7}\mathrm{N}$. | Live partial branch | NOT_VERIFIED — JOB-STATE DEFECT |
| U099 | 104 | Stable and unstable nuclides | ${}^{12}\mathrm{C}$ and ${}^{13}\mathrm{C}$ are stable, | Not created | MISSING — IMPORT NOT REACHED |
| U100 | 105 | Stable and unstable nuclides | ${}^{14}\mathrm{C}$ is unstable. | Not created | MISSING — IMPORT NOT REACHED |
| U108 | 114 | Interpretation and bookkeeping | $A$, | Not created | MISSING — IMPORT NOT REACHED |
| U109 | 115 | Interpretation and bookkeeping | $Z$, | Not created | MISSING — IMPORT NOT REACHED |
| U110 | 116 | Interpretation and bookkeeping | $N$. | Not created | MISSING — IMPORT NOT REACHED |
| U112 | 118 | Interpretation and bookkeeping | $A=Z+N$ | Not created | MISSING — IMPORT NOT REACHED |
| U115 | 121 | Interpretation and bookkeeping | same $Z$ $\rightarrow$ isotopes | Not created | MISSING — IMPORT NOT REACHED |
| U116 | 122 | Interpretation and bookkeeping | same $N$ $\rightarrow$ isotones | Not created | MISSING — IMPORT NOT REACHED |
| U117 | 123 | Interpretation and bookkeeping | same $A$ $\rightarrow$ isobars | Not created | MISSING — IMPORT NOT REACHED |
| U118 | 124 | Interpretation and bookkeeping | exchanged $Z$ and $N$ $\rightarrow$ mirror nuclei | Not created | MISSING — IMPORT NOT REACHED |
| U119 | 125 | Interpretation and bookkeeping | This language matters because later topics such as decay equations, reaction equations, and nuclear stability all depend on correct identification of $A$ and $Z$. | Not created | MISSING — IMPORT NOT REACHED |
| U121 | 128 | Common mistakes to prevent | Do not confuse **mass number** $A$ with **atomic mass** measured in u. | Not created | MISSING — IMPORT NOT REACHED |
| U123 | 130 | Common mistakes to prevent | $N=A-Z$ | Not created | MISSING — IMPORT NOT REACHED |
| U124 | 131 | Common mistakes to prevent | Do not call two nuclei isotopes merely because they are related somehow; they must have the same $Z$. | Not created | MISSING — IMPORT NOT REACHED |
| U126 | 133 | Common mistakes to prevent | Isotopes: same $Z$, different $A$ | Not created | MISSING — IMPORT NOT REACHED |
| U127 | 134 | Common mistakes to prevent | Isobars: same $A$, different $Z$ | Not created | MISSING — IMPORT NOT REACHED |
| U134 | 142 | Physical basis / intuition | $\text{\AA}$ for atomic-size lengths, | Not created | MISSING — IMPORT NOT REACHED |
| U142 | 150 | Physical basis / intuition | $1\,\text{MeV}=10^6\,\text{eV},$ | Not created | MISSING — IMPORT NOT REACHED |
| U147 | 156 | Definitions and core quantities | $1\,\text{\AA}=10^{-10}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U149 | 158 | Definitions and core quantities | $10^{-10}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U151 | 160 | Definitions and core quantities | $1\,\text{fm}=10^{-15}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U153 | 162 | Definitions and core quantities | Therefore, a nucleus is roughly $10^5$ times smaller in linear size than an atom. | Not created | MISSING — IMPORT NOT REACHED |
| U155 | 164 | Definitions and core quantities | The electron-volt is defined as the energy gained by a particle carrying one elementary charge $e$ when it moves through a potential difference of $1$ volt: | Not created | MISSING — IMPORT NOT REACHED |
| U156 | 165 | Definitions and core quantities | $1\,\text{eV}=1.602\times 10^{-19}\,\text{J}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U158 | 167 | Definitions and core quantities | $1\,\text{keV}=10^3\,\text{eV}, \qquad 1\,\text{MeV}=10^6\,\text{eV}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U163 | 172 | Definitions and core quantities | $1\,\text{u}=\frac{1}{12}\times \text{mass of a neutral }{}^{12}\mathrm{C}\text{ atom}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U165 | 174 | Definitions and core quantities | $1\,\text{u}=1.6605\times 10^{-27}\,\text{kg}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U166 | 175 | Definitions and core quantities | Proton and neutron masses are each approximately $1\,\text{u}$, though not exactly equal to $1\,\text{u}$. | Not created | MISSING — IMPORT NOT REACHED |
| U169 | 178 | Definitions and core quantities | $E=mc^2.$ | Not created | MISSING — IMPORT NOT REACHED |
| U171 | 180 | Definitions and core quantities | $1\,\text{u}\,c^2 \approx 931.5\,\text{MeV}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U176 | 186 | Dimensions and dimensional meaning | $[E]=[M L^2 T^{-2}].$ | Not created | MISSING — IMPORT NOT REACHED |
| U178 | 188 | Dimensions and dimensional meaning | $E=mc^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U180 | 190 | Dimensions and dimensional meaning | $[m c^2]=[M]\left[\frac{L}{T}\right]^2=[M L^2 T^{-2}].$ | Not created | MISSING — IMPORT NOT REACHED |
| U181 | 191 | Dimensions and dimensional meaning | This is why a mass can be expressed through an equivalent energy once the factor $c^2$ is included. | Not created | MISSING — IMPORT NOT REACHED |
| U183 | 193 | Dimensions and dimensional meaning | $\text{eV}$ is a unit of **energy**, | Not created | MISSING — IMPORT NOT REACHED |
| U184 | 194 | Dimensions and dimensional meaning | $\text{eV}/c^2$ is a unit of **mass**, | Not created | MISSING — IMPORT NOT REACHED |
| U185 | 195 | Dimensions and dimensional meaning | $\text{eV}/c$ is a unit of **momentum**. | Not created | MISSING — IMPORT NOT REACHED |
| U190 | 201 | Mathematical setup | $r_{\text{atom}} \sim 10^{-10}\,\text{m}$ | Not created | MISSING — IMPORT NOT REACHED |
| U192 | 203 | Mathematical setup | $r_{\text{nucleus}} \sim 10^{-15}\,\text{m}$ | Not created | MISSING — IMPORT NOT REACHED |
| U194 | 205 | Mathematical setup | $\frac{r_{\text{atom}}}{r_{\text{nucleus}}}\sim 10^5.$ | Not created | MISSING — IMPORT NOT REACHED |
| U197 | 208 | Mathematical setup | $E_{\text{atomic}} \sim 1\,\text{eV}$ | Not created | MISSING — IMPORT NOT REACHED |
| U199 | 210 | Mathematical setup | $E_{\text{nuclear}} \sim 1\,\text{MeV}$ | Not created | MISSING — IMPORT NOT REACHED |
| U201 | 212 | Mathematical setup | $\frac{E_{\text{nuclear}}}{E_{\text{atomic}}}\sim 10^6.$ | Not created | MISSING — IMPORT NOT REACHED |
| U204 | 215 | Mathematical setup | $m_p c^2 \approx 938\,\text{MeV}, \qquad m_n c^2 \approx 939\,\text{MeV},$ | Not created | MISSING — IMPORT NOT REACHED |
| U210 | 222 | Useful relations | $E=h\nu=\frac{hc}{\lambda}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U212 | 224 | Useful relations | $h=6.626\times 10^{-34}\,\text{J}\cdot\text{s}$ | Not created | MISSING — IMPORT NOT REACHED |
| U214 | 226 | Useful relations | $1\,\text{eV}=1.602\times 10^{-19}\,\text{J}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U216 | 228 | Useful relations | $\lambda=\frac{1.240\times 10^{-6}\,\text{m}\cdot\text{eV}}{E}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U218 | 230 | Useful relations | $hc \approx 197.3\,\text{MeV}\cdot\text{fm}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U223 | 236 | Order-of-magnitude scales | $10^{-10}\,\text{m}=1\,\text{\AA}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U226 | 239 | Order-of-magnitude scales | $1\text{ to }7\,\text{fm}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U234 | 247 | Order-of-magnitude scales | $10^{-22}\,\text{s}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U236 | 249 | Order-of-magnitude scales | $10^{-9}\,\text{s} \text{ to } 10^{-12}\,\text{s}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U242 | 256 | Interpretation | $\text{\AA}$ immediately suggests atomic structure, | Not created | MISSING — IMPORT NOT REACHED |
| U248 | 262 | Interpretation | $E=\Delta m\,c^2,$ | Not created | MISSING — IMPORT NOT REACHED |
| U252 | 267 | Common mistakes to prevent | Do not confuse **mass number** $A$ with **mass in u**. | Not created | MISSING — IMPORT NOT REACHED |
| U253 | 268 | Common mistakes to prevent | $A$ is an integer count of nucleons. | Not created | MISSING — IMPORT NOT REACHED |
| U256 | 271 | Common mistakes to prevent | $eV \quad \text{with} \quad eV/c^2,$ | Not created | MISSING — IMPORT NOT REACHED |
| U259 | 274 | Common mistakes to prevent | $1\,\text{\AA}=10^5\,\text{fm}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U266 | 282 | Definitions and core quantities | **Mass number **$A$ | Not created | MISSING — IMPORT NOT REACHED |
| U267 | 283 | Definitions and core quantities | $A$ is the total number of nucleons in the nucleus: | Not created | MISSING — IMPORT NOT REACHED |
| U268 | 284 | Definitions and core quantities | $A=Z+N$ | Not created | MISSING — IMPORT NOT REACHED |
| U275 | 291 | Definitions and core quantities | the masses of the $Z$ orbital electrons, | Not created | MISSING — IMPORT NOT REACHED |
| U281 | 297 | Definitions and core quantities | If $M_{\text{atom}}$ is the atomic mass and $M_{\text{nuc}}$ is the nuclear mass, then the exact relation is | Not created | MISSING — IMPORT NOT REACHED |
| U282 | 298 | Definitions and core quantities | $M_{\text{atom}}=M_{\text{nuc}}+Zm_e-\frac{B_e}{c^2}$ | Not created | MISSING — IMPORT NOT REACHED |
| U284 | 300 | Definitions and core quantities | $m_e$ is the electron mass, | Not created | MISSING — IMPORT NOT REACHED |
| U285 | 301 | Definitions and core quantities | $B_e$ is the total electronic binding energy. | Not created | MISSING — IMPORT NOT REACHED |
| U287 | 303 | Definitions and core quantities | $M_{\text{nuc}} \approx M_{\text{atom}}-Zm_e$ | Not created | MISSING — IMPORT NOT REACHED |
| U297 | 313 | Definitions and core quantities | $\sum_i f_i = 1$ | Not created | MISSING — IMPORT NOT REACHED |
| U299 | 315 | Definitions and core quantities | $\sum_i (\%)_i = 100$ | Not created | MISSING — IMPORT NOT REACHED |
| U304 | 321 | Mass number versus measured mass | $A$ is an integer count of nucleons. | Not created | MISSING — IMPORT NOT REACHED |
| U307 | 324 | Mass number versus measured mass | ${}^{12}\mathrm{C}$ has mass number $A=12$. | Not created | MISSING — IMPORT NOT REACHED |
| U309 | 326 | Mass number versus measured mass | $12\,\text{u}$ | Not created | MISSING — IMPORT NOT REACHED |
| U316 | 333 | Mass number versus measured mass | chlorine-35 has mass number $35$, | Not created | MISSING — IMPORT NOT REACHED |
| U317 | 334 | Mass number versus measured mass | while its measured atomic mass is close to, but not exactly, $35\,\text{u}$. | Not created | MISSING — IMPORT NOT REACHED |
| U320 | 338 | Why isotopic masses are not exactly equal to their mass numbers | First, the proton mass and neutron mass are not each exactly $1\,\text{u}$. | Not created | MISSING — IMPORT NOT REACHED |
| U323 | 341 | Why isotopic masses are not exactly equal to their mass numbers | $E=\Delta m\,c^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U330 | 349 | Atomic mass unit | $1\,\text{u}=\frac{1}{12}\times \text{mass of a neutral }{}^{12}\mathrm{C}\text{ atom}$ | Not created | MISSING — IMPORT NOT REACHED |
| U332 | 351 | Atomic mass unit | $M_{\text{atom}}({}^{12}\mathrm{C})=12\,\text{u}$ | Not created | MISSING — IMPORT NOT REACHED |
| U337 | 357 | Isotopic abundance and average atomic mass | The isotopes have the same chemical identity because they have the same $Z$, but they have different masses because they have different neutron numbers. | Not created | MISSING — IMPORT NOT REACHED |
| U338 | 358 | Isotopic abundance and average atomic mass | If an element has isotopes with atomic masses $M_1,M_2,\dots$ and fractional abundances $f_1,f_2,\dots$, then the average atomic mass is | Not created | MISSING — IMPORT NOT REACHED |
| U339 | 359 | Isotopic abundance and average atomic mass | $\overline{M}=\sum_i f_i M_i$ | Not created | MISSING — IMPORT NOT REACHED |
| U340 | 360 | Isotopic abundance and average atomic mass | If percentages $p_i$ are used instead, then | Not created | MISSING — IMPORT NOT REACHED |
| U341 | 361 | Isotopic abundance and average atomic mass | $\overline{M}=\sum_i \left(\frac{p_i}{100}\right) M_i$ | Not created | MISSING — IMPORT NOT REACHED |
| U389 | 415 | Definitions and core quantities | $q$ be the ion charge, | Not created | MISSING — IMPORT NOT REACHED |
| U390 | 416 | Definitions and core quantities | $m$ be the ion mass, | Not created | MISSING — IMPORT NOT REACHED |
| U391 | 417 | Definitions and core quantities | $V$ be the accelerating potential difference, | Not created | MISSING — IMPORT NOT REACHED |
| U392 | 418 | Definitions and core quantities | $\mathbf{E}$ be the electric field in the selector, | Not created | MISSING — IMPORT NOT REACHED |
| U393 | 419 | Definitions and core quantities | $\mathbf{B}$ be the magnetic field, | Not created | MISSING — IMPORT NOT REACHED |
| U394 | 420 | Definitions and core quantities | $v$ be the ion speed, | Not created | MISSING — IMPORT NOT REACHED |
| U395 | 421 | Definitions and core quantities | $r$ be the radius of curvature in the magnetic field. | Not created | MISSING — IMPORT NOT REACHED |
| U403 | 429 | Definitions and core quantities | the mass $m$, | Not created | MISSING — IMPORT NOT REACHED |
| U404 | 430 | Definitions and core quantities | or the mass-to-charge ratio $m/q$. | Not created | MISSING — IMPORT NOT REACHED |
| U412 | 440 | Mathematical setup | If an ion of charge $q$ is accelerated through a potential difference $V$, the electric field does work | Not created | MISSING — IMPORT NOT REACHED |
| U413 | 441 | Mathematical setup | $qV$ | Not created | MISSING — IMPORT NOT REACHED |
| U416 | 444 | Mathematical setup | $qV=\frac{1}{2}mv^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U418 | 446 | Mathematical setup | $v=\sqrt{\frac{2qV}{m}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U420 | 448 | Mathematical setup | $F_B=qvB$ | Not created | MISSING — IMPORT NOT REACHED |
| U422 | 450 | Mathematical setup | $qvB=\frac{mv^2}{r}$ | Not created | MISSING — IMPORT NOT REACHED |
| U424 | 452 | Mathematical setup | $r=\frac{mv}{qB}$ | Not created | MISSING — IMPORT NOT REACHED |
| U425 | 453 | Mathematical setup | Therefore, for fixed $v$, $q$, and $B$, | Not created | MISSING — IMPORT NOT REACHED |
| U426 | 454 | Mathematical setup | a larger mass $m$ gives a larger radius $r$, | Not created | MISSING — IMPORT NOT REACHED |
| U430 | 459 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $qV=\frac{1}{2}mv^2$ | Not created | MISSING — IMPORT NOT REACHED |
| U432 | 461 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $v=\sqrt{\frac{2qV}{m}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U434 | 463 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $r=\frac{mv}{qB}$ | Not created | MISSING — IMPORT NOT REACHED |
| U436 | 465 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $r=\frac{m}{qB}\sqrt{\frac{2qV}{m}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U438 | 467 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $r=\sqrt{\frac{2mV}{qB^2}}$ | Not created | MISSING — IMPORT NOT REACHED |
| U440 | 469 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $\frac{m}{q}=\frac{B^2r^2}{2V}$ | Not created | MISSING — IMPORT NOT REACHED |
| U442 | 471 | Derivation for the basic accelerating-field plus magnetic-analyzer form | $q=e,$ | Not created | MISSING — IMPORT NOT REACHED |
| U449 | 484 | Velocity selector | $qE=qvB_1$ | Not created | MISSING — IMPORT NOT REACHED |
| U451 | 486 | Velocity selector | $v=\frac{E}{B_1}$ | Not created | MISSING — IMPORT NOT REACHED |
| U452 | 487 | Velocity selector | where $B_1$ is the magnetic field in the selector region. | Not created | MISSING — IMPORT NOT REACHED |
| U453 | 488 | Velocity selector | This result does **not** say that every ion has speed $E/B_1$. | Not created | MISSING — IMPORT NOT REACHED |
| U458 | 494 | Magnetic analyzer after the selector | $v=\frac{E}{B_1}$ | Not created | MISSING — IMPORT NOT REACHED |
| U459 | 495 | Magnetic analyzer after the selector | If they then enter a second magnetic field $B_2$, they move in circular arcs with | Not created | MISSING — IMPORT NOT REACHED |
| U460 | 496 | Magnetic analyzer after the selector | $qvB_2=\frac{mv^2}{r}$ | Not created | MISSING — IMPORT NOT REACHED |
| U462 | 498 | Magnetic analyzer after the selector | $r=\frac{mv}{qB_2}$ | Not created | MISSING — IMPORT NOT REACHED |
| U463 | 499 | Magnetic analyzer after the selector | Solving for $m/q$, | Not created | MISSING — IMPORT NOT REACHED |
| U464 | 500 | Magnetic analyzer after the selector | $\frac{m}{q}=\frac{B_2r}{v}$ | Not created | MISSING — IMPORT NOT REACHED |
| U465 | 501 | Magnetic analyzer after the selector | Using the selector result $v=E/B_1$, | Not created | MISSING — IMPORT NOT REACHED |
| U466 | 502 | Magnetic analyzer after the selector | $\frac{m}{q}=\frac{B_1B_2r}{E}$ | Not created | MISSING — IMPORT NOT REACHED |
| U467 | 503 | Magnetic analyzer after the selector | If the same magnetic-field magnitude is used in both regions, $B_1=B_2=B$, then | Not created | MISSING — IMPORT NOT REACHED |
| U468 | 504 | Magnetic analyzer after the selector | $\frac{m}{q}=\frac{B^2r}{E}$ | Not created | MISSING — IMPORT NOT REACHED |
| U471 | 507 | Magnetic analyzer after the selector | so the curvature in the analyzer depends only on $m/q$. | Not created | MISSING — IMPORT NOT REACHED |
| U479 | 516 | Measuring isotopic abundance | peak position $\rightarrow$ mass identification, | Not created | MISSING — IMPORT NOT REACHED |
| U480 | 517 | Measuring isotopic abundance | peak height or peak area $\rightarrow$ relative abundance. | Not created | MISSING — IMPORT NOT REACHED |
| U482 | 519 | Measuring isotopic abundance | $\sum_i f_i=1$ | Not created | MISSING — IMPORT NOT REACHED |
| U484 | 521 | Measuring isotopic abundance | $\overline{M}=\sum_i f_i M_i$ | Not created | MISSING — IMPORT NOT REACHED |
| U498 | 537 | Limitations | $\frac{m}{q}$ | Not created | MISSING — IMPORT NOT REACHED |
| U499 | 538 | Limitations | rather than $m$ alone. | Not created | MISSING — IMPORT NOT REACHED |
| U501 | 540 | Limitations | If ions have multiple charge states, interpretation becomes more complicated because different values of $m/q$ may appear. | Not created | MISSING — IMPORT NOT REACHED |
| U510 | 550 | Common mistakes to prevent | $v=\frac{E}{B}$ | Not created | MISSING — IMPORT NOT REACHED |
| U512 | 552 | Common mistakes to prevent | Do not confuse the electric field symbol $E$ with energy. | Not created | MISSING — IMPORT NOT REACHED |
| U517 | 557 | Common mistakes to prevent | $m/q$ | Not created | MISSING — IMPORT NOT REACHED |
| U529 | 571 | Historical or experimental setup | Rutherford, with Geiger and Marsden, tested atomic structure by directing $\alpha$-particles onto a very thin metal foil, especially gold. | Not created | MISSING — IMPORT NOT REACHED |
| U530 | 572 | Historical or experimental setup | An $\alpha$-particle may be treated here as a positively charged helium nucleus with charge | Not created | MISSING — IMPORT NOT REACHED |
| U531 | 573 | Historical or experimental setup | $q_\alpha = +2e .$ | Not created | MISSING — IMPORT NOT REACHED |
| U533 | 575 | Historical or experimental setup | a radioactive $\alpha$-source, | Not created | MISSING — IMPORT NOT REACHED |
| U537 | 579 | Historical or experimental setup | The experiment was carried out in a good vacuum so that the $\alpha$-particles would not be significantly deflected by air before reaching the foil. | Not created | MISSING — IMPORT NOT REACHED |
| U539 | 582 | Physical basis / intuition | The incoming $\alpha$-particles are positively charged. | Not created | MISSING — IMPORT NOT REACHED |
| U540 | 583 | Physical basis / intuition | If the positive charge inside the atom were spread diffusely through the whole atom, the electric force on a fast, heavy $\alpha$-particle passing through a thin foil would generally be weak and distributed over a larger region. | Not created | MISSING — IMPORT NOT REACHED |
| U546 | 590 | Definitions and core quantities | $\theta$ be the scattering angle, | Not created | MISSING — IMPORT NOT REACHED |
| U547 | 591 | Definitions and core quantities | $b$ be the impact parameter, meaning the perpendicular offset between the initial beam direction and the center of the target nucleus, | Not created | MISSING — IMPORT NOT REACHED |
| U548 | 592 | Definitions and core quantities | $Z$ be the atomic number of the target nucleus. | Not created | MISSING — IMPORT NOT REACHED |
| U552 | 597 | Main observations | Most of the $\alpha$-particles passed through the foil with either | Not created | MISSING — IMPORT NOT REACHED |
| U558 | 603 | Main observations | $180^\circ .$ | Not created | MISSING — IMPORT NOT REACHED |
| U563 | 609 | Why the result was surprising | $10^{-10}\,\text{m}.$ | Not created | MISSING — IMPORT NOT REACHED |
| U564 | 610 | Why the result was surprising | A heavy, fast $\alpha$-particle passing through such a diffuse distribution should experience many weak interactions rather than one strong, concentrated repulsive interaction. | Not created | MISSING — IMPORT NOT REACHED |
| U575 | 622 | Interpretation | most $\alpha$-particles pass through with little or no deflection because most of the atomic volume contains no concentrated mass or charge, | Not created | MISSING — IMPORT NOT REACHED |
| U587 | 635 | The nuclear hypothesis | $10^{-10}\,\text{m}$ | Not created | MISSING — IMPORT NOT REACHED |
| U590 | 639 | Why most of the atom must be empty space | Since most $\alpha$-particles passed through the foil with little deflection, they usually did not encounter any strong concentrated repulsive center. | Not created | MISSING — IMPORT NOT REACHED |
| U603 | 653 | Experimental observation versus theoretical conclusion | The detector sees scattered $\alpha$-particles. | Not created | MISSING — IMPORT NOT REACHED |
| U611 | 663 | Common mistakes to prevent | Do not say that most $\alpha$-particles bounced backward. | Not created | MISSING — IMPORT NOT REACHED |

## Chapter Two exclusion

| Excluded item | Expected | Observed | Status |
| --- | --- | --- | --- |
| Chapter Two | 0 | 0 | PASS |
| Historical background and the nuclear hypothesis | 0 | 0 | PASS |
| 2.1 — Historical background and the nuclear hypothesis | 0 | 0 | PASS |
| Chapter Two opening sentence | 0 | 0 | PASS |
| 2.2 — Rutherford alpha-scattering experiment: setup and observations | 0 | 0 | PASS |
| 2.3 title and 2.10 opening sentence | 0 | 0 | PASS |

**Boundary classification:** `BOUNDARY_EXACT_FOR_EXECUTED_PARTIAL_IMPORT`

## Duplicate and pollution audit

| Issue | Observed | Classification |
| --- | --- | --- |
| Test 14 roots | 1 | NOT_DUPLICATED |
| Import roots | 1 | NOT_DUPLICATED |
| Chapter roots | 1 | NOT_DUPLICATED |
| Persistent jobs | 1 | NOT_DUPLICATED |
| Exact 1.1 title Rems | 3 | EXACT_DUPLICATE — TWO EXTRAS |
| Replacement classification branch | 0 | NOT_DUPLICATED |
| Leading dash on repaired URL | 0 | REPAIRED |
| Leading dashes on other first body Rems | Present | UNRESOLVED |
| Visible job IDs/chunk hashes | 0 | PASS |
| Chapter Two content | 0 | PASS |
| Cards | 0 | PASS |

## Defects and recovery

| Defect | Classification | Evidence | Repair plan | Result |
| --- | --- | --- | --- | --- |
| File-reference ingestion | CONFIRMED | All file routes fail before planning. | Used exact hash-verified sourceText planner. | Text plan succeeded; file route unresolved. |
| 55 native chunks instead of six | CONFIRMED LIMITATION | Planner atomized every H2/H3 branch. | Mapped them to six logical batches. | Adaptation valid, but execution blocked in batch 1. |
| Rendered-Markdown verification mismatch | CONFIRMED | Links, bold and math delimiters trigger false fidelity failures. | Direct readback and exact-text reconciliation. | Chunks 2–5 closed. |
| Visible dash pollution | CONFIRMED | Some first child Rems retain `- `. | One in-place URL cleanup. | Other dash pollution remains. |
| Nested duplicate 1.1 titles | CONFIRMED | Three exact title Rems in a nested chain. | Deletion/reordering forbidden. | Two duplicates unresolved. |
| Chunk-6 ID tracking lost | CONFIRMED | Live text hash matches, but created/updated IDs are empty. | One verify plus one same-job resume. | Unresolved after two attempts. |
| Classification hierarchy malformed | CONFIRMED | Isotones/Isobars/Mirror nuclei nested under Isotopes. | Would require movement/reconstruction. | Unresolved. |

## Metrics

- **Canonical Content Unit Fidelity Rate:** 60/617 = 9.7%
- **Plugin-estimated verified Rem-like units:** 56
- **Live but not job-verified canonical units:** 31
- **Native Chunk Completion Accuracy:** 5/55 = 9.1%
- **Logical Batch Completion Accuracy:** 0/6 = 0.0%
- **Resume Continuity Rate:** 0.0%
- **Boundary Exclusion Rate:** 6/6 = 100.0%
- **Formula Fidelity Rate at plain-text/semantic level:** 27/196 = 13.8%
- **Duplicate-Free Rate:** Reduced by two duplicate section-heading Rems
- **Job-State Accuracy:** Partial; durable state is readable, but chunk 6 cannot be reconciled

## Safety audit

| Safety item | Allowed | Observed | Status |
| --- | --- | --- | --- |
| Test 14 roots | 1 | 1 | PASS |
| Import roots | 1 | 1 | PASS |
| Chapter roots | 1 | 1 | PASS |
| Persistent jobs | 1 | 1 | PASS |
| Replacement jobs | 0 | 0 | PASS |
| Deletes | 0 | 0 | PASS |
| Cards | 0 | 0 | PASS |
| Chapter Two units | 0 | 0 | PASS |
| Writes outside Test 14 root | 0 | 0 | PASS |
| Chunk-6 repair attempts | 2 | 2 | PASS — LIMIT REACHED |
| Unsafe continuation | 0 | 0 | PASS |

## ChatGPT Agent Score

| Category | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Task understanding | 10 | 10 | Correct six-batch adaptation; no one-shot import |
| Planning/decomposition | 15 | 14 | Exact source and logical batch mapping |
| Tool selection | 15 | 14 | Persistent plan/job/status/resume/verify workflow |
| Sequencing | 15 | 14 | Safe ordered execution and stop |
| Verification discipline | 20 | 19 | Live tree, state, duplicate and boundary audits |
| Recovery | 10 | 9 | Four chunks reconciled; stopped after two failed attempts |
| Scope/safety | 10 | 10 | One root/job; no deletion or replacement |
| Efficiency | 3 | 1 | High overhead from verifier defects |
| Reporting | 2 | 1 | Comprehensive blocked-run evidence |

**Agent Score:** 92/100

## Plugin Capability Score

| Category | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Tool availability | 10 | 8 | Persistent tools callable |
| Source ingestion | 10 | 2 | Text works; file routes fail |
| Planning correctness | 15 | 8 | Complete plan but 55 microchunks |
| Job durability | 15 | 12 | Persistent state repeatedly retrieved |
| Chunk execution | 20 | 6 | Five closed; sixth stuck |
| Resume continuity | 15 | 4 | Same job reused but cannot advance |
| Content/hierarchy fidelity | 10 | 2 | Duplicates, dash pollution, malformed nesting |
| Verification quality | 3 | 0 | False failures and unreconciled matching hash |
| Safety/error quality | 2 | 0 | Safe but not actionable |

**Plugin Score:** 42/100

## Final Artifact Score

| Category | Maximum | Awarded | Evidence |
| --- | --- | --- | --- |
| Content correctness | 20 | 8 | First five chunks represented |
| Completeness | 20 | 2 | 60/617 canonical units job-verified |
| Hierarchy | 15 | 3 | One chapter root; duplicate/malformed branches |
| Formula fidelity | 20 | 3 | 27/196 reached; rich math unverified |
| Boundary isolation | 10 | 10 | Six exclusions pass |
| Resume integrity | 10 | 3 | One persistent job; midpoint not reached |
| Duplicates/pollution | 5 | 0 | Two duplicate headings and dash pollution |

**Artifact Score:** 29/100

## Weighted score and caps

- Agent contribution: 32.20
- Plugin contribution: 16.80
- Artifact contribution: 7.25
- Raw weighted score: 56.2/100
- Adjusted score: 50.0/100

| Cap | Triggered | Evidence | Result |
| --- | --- | --- | --- |
| Scope violation | No | All writes under Test 14 root | None |
| Second Test 14 root | No | One root | None |
| Replacement job | No | One persistent job | None |
| One-shot import | No | Resumable workflow used | None |
| Chapter Two leakage | No | Six checks zero | None |
| Blind retry | No | Read state/artifact first | None |
| More than two repairs | No | Stopped after two chunk-6 attempts | None |
| Duplicate section branch | Yes | Three exact 1.1 titles | Max 50 |
| Missing source units | Yes | 557/617 not job-verified | Max 60 |
| Midpoint/resume incomplete | Yes | Batch 1 incomplete | Max 55 |
| False success claim | No | Verdict BLOCKED_JOB_STATE | None |
| Report missing | No | This report | None |

## Final verdict

**`BLOCKED_JOB_STATE`**

The connection is healthy and persistent storage works. The run cannot safely continue because chunk 6 has live content but no durable created/updated Rem IDs. The verifier cannot close it, and the runner cannot advance without targeting that same unresolved chunk again.

## Recommendation

**`REPAIR_IMPORT_CHUNK_ID_TRACKING_AND_MARKDOWN_NORMALIZATION_THEN_REPEAT_TEST_14`**

Required fixes:

1. Persist created/updated Rem IDs even when post-write verification fails.
2. Allow live readback to reconcile a partial chunk's IDs.
3. Normalize links, emphasis, and math before plain-text comparison.
4. Strip literal leading bullet prefixes.
5. Prevent duplicate nested section-title Rems.
6. Preserve sibling relationships inside classification lists.
7. Allow a hash-matching partial chunk to close without replay.

Do not proceed to Test 15 from this artifact.

## Artifact manifest

| Artifact | ID/path | Final state |
| --- | --- | --- |
| Earlier blocked-validation report | /mnt/data/remnote-mcp-test-14-resumable-long-import-report-2026-07-13.md | Preserved |
| Adapted run report | /mnt/data/remnote-mcp-test-14-resumable-long-import-report-2026-07-13-run-02.md | Created |
| Test 14 root | zYWFdK4no5ETVMs05 | Partial |
| Import root | nIgYWCmJ1qfBTNCWq | Partial |
| Chapter root | WyyqejA9lJtMPYgrO | Partial |
| Plan | plan:fnv1a32:00963bdd | Persisted |
| Job | test14-adapted-nuclear-ch1-run01-20260713 | Persistent partial |

## Integrity declaration

> This report includes the complete strict Test 14 prompt, complete bounded Nuclear Physics Chapter One source, six-logical-batch adaptation, all 55 native chunks, all 617 canonical units, all 196 formula-bearing units, scope evidence, persistent plan/job evidence, operation chronology, repair attempts, partial hierarchy, duplicate and boundary audits, scores, caps, and the blocked verdict. It does not claim completion, midpoint success, rich-math fidelity, or source coverage that did not occur. No authentication secret is included.
