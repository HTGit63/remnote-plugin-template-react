# RemNote MCP Test 13 — Flashcard Lifecycle — 2026-07-17

## Verdict

`PASS_WITH_WARNINGS` after an exact independent rerun.

| Metric | Run 01 | Run 02 |
| --- | --- | --- |
| Root | `9e91QOcqeZY465R1N` | `GMNfzaCUSFYIaFPMP` |
| Academic source | `jXaVHSt5uprhY6wxP` | `AsU4t3i9G1itbSjcb` |
| Markdown source | `TCcYL0Wv4m8iD7Qa0` | `V5YuXIdVojzmFXXLQ` |
| Collection | `pzox7Oe3BTvDt6uQv` | `zn2p8dTjStMuZoqWv` |
| Initial preview | 13/14 | 13/14 |
| Recovered preview | 14/14 | 14/14 |
| Functional cards | 14/14 | 14/14 |
| Source preservation | PASS | PASS |
| M06 count | 1 | 1 |
| Aggregate verifier | PASS | PASS, operation `065827b2-a4e6-4091-85f3-674fcf2fba1e` |

Run 01's plugin operations passed, but post-run review found operator fixture deviations in formula spacing, the Major Stages hierarchy, and E08 punctuation. Run 02 rebuilt the fixture exactly in a new independent root, then all fourteen creator calls returned `PASS` with immediate verification.

The recovery challenge was read-only. Run 01 allegations 1–4 and 6 were false; allegation 5 correctly identified the operator-created source mismatch. The Run 02 control classified all six allegations as false/already-correct, retained 14/14 verifier `PASS` (`1e70abcb-fc89-44a0-a54f-260152f3a9b8`), and performed zero mutations.
