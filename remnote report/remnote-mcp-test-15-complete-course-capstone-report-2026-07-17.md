# RemNote MCP Test 15 — Complete Course Capstone — 2026-07-17

## Verdict

`PASS_WITH_WARNINGS` across three independent live runs.

| Metric | Run 01 | Run 02 | Run 03 |
| --- | --- | --- | --- |
| Test root | `ud8LrqymXrkl0m3SS` | `rne4NnlxsxAH0ICGm` | `vWzfylPf3wDotD89u` |
| Module | `7xJiCOPRFqeUsBcNx` | `ln5t9ztZUmcq51cLu` | `rOPjFkMg1dWhSk6VC` |
| Review Cards | `xk3W8l6t85iktsIfj` | `4onwlQgp0IjIpLjVa` | `mMEQphu0vt4g9gP0j` |
| Controlled target | `MUnFduvjwOg0kiG9R` | `jYNOf3gEhoJVocTQL` | `IVc3prwz81YggIosN` |
| Planned/created module nodes | 160/160 | 160/160 | 160/160 |
| Ordered academic sections | 11/11 | 11/11 | 11/11 |
| Requested functional cards | 12/12 | 12/12 | 12/12 |
| Controlled defect detected | YES | YES | YES |
| Same-ID repair | PASS | PASS | PASS |
| Final formula | `U=1/2 CV²`, blue | `U=1/2 CV²`, blue | `U=1/2 CV²`, blue |

Each run used a dry-run plan before creation. The module contained 26 math blocks, three complete worked examples, five warnings, seven ordered summary points, and five card-family groups. The twelve exact requested cards covered basic, concept, descriptor, cloze, multiple-choice, and list-answer families. Baseline and final aggregate verification returned `PASS`; deployed counts reported thirteen cards because the native `Size → H3` property record was interpreted as a descriptor, while all twelve explicit expectations passed with zero issues.

The controlled lifecycle was identical in all runs: prove baseline; preview `U=1/2 CV²` to `U=CV²`; apply guarded defect; independently read the defect; preview guarded repair; repair on the same ID; restore blue rich emphasis; verify parent, sibling order, child order, and card set. No module was rebuilt.

Source/prompt validation found 9,180 bytes with SHA-256 `bf79b421...05a`, 14 rough blocks, two correction memos, three worked examples, twelve card candidates, and two source occurrences of the controlled scalar. No rough-block label or correction memo remained in any polished module.
