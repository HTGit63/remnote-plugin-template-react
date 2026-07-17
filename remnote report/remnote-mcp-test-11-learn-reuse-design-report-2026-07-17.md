# RemNote MCP Test 11 — Learn and Reuse Design — 2026-07-17

## Verdict

`PASS_WITH_WARNINGS` across two independent live runs.

| Run | Root | Reference | Target | Template | Result |
| --- | --- | --- | --- | --- | --- |
| 01 | `ULl5YjWeiwqjNBvh9` | `7bFwrcOFLe6x7IwYh` | `NbVoUlg1EQdrJaHnU` | `design-test-11-clean-science-lesson-design-2026-07-17-run-01` | Direct hierarchy, role styles, summary bullets, formula, warning, answer, and Concept/Descriptor pairs passed. |
| 02 | `sXTWaFg3F9XIyZBSl` | `pwRROIyjk0yeUqHhx` | `hbrZT0NrzKFTHGfs9` | `design-test-11-clean-science-lesson-design-2026-07-17-run-02` | Safely resumed after disconnect; target created once and verified by direct property/rich readback. |

Run 02 did not recreate its root or reference. Its completed 43-node reference was read first, then exactly one template and one target were created. Reference and target remained separate and the reference was unchanged.

Warnings are deployed-tooling findings, not missing academic content: native `Size` property records polluted generic analysis/verifier counts, formula classification was broader than the dedicated principal-formula role, and the generic verifier did not fully model direct Concept -> Descriptor pairs. Local TDD filters native properties, narrows the classifier, recognizes the pair hierarchy, and preserves mismatch evidence as a structured semantic result. Those fixes require deployment/reload for live proof.
