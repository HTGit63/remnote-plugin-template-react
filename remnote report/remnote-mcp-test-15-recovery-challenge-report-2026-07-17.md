# RemNote MCP Test 15 — Controlled Recovery Challenge — 2026-07-17

## Recovery identity

- Approved root: `OjLcSppWfIH0cpPoh`
- Test 15 Run 01 root: `ud8LrqymXrkl0m3SS`
- Existing module: `7xJiCOPRFqeUsBcNx`
- Existing Review Cards: `xk3W8l6t85iktsIfj`
- Existing controlled target: `MUnFduvjwOg0kiG9R`
- Recovery verdict: `RECOVERY_PASS_WITH_WARNINGS`
- Mutations during recovery: 0
- Confirmed defects: 0
- False/already-correct reports: 8

## Investigation table

| Reported issue | Before evidence | Classification | Repair required | Result |
| --- | --- | --- | --- | --- |
| Capacitance may be `C=V/Q` | Direct child `axgSTodLqVORWgFoy` is `C=\\frac{Q}{V}`; scoped wrong-form search returned 0 | `FALSE_ALARM` | No | Left unchanged |
| Energy may be `U=CV²` | Rich target read is `U=1/2 CV²` with blue emphasis; wrong-form search returned 0 | `ALREADY_CORRECT` | No | Left unchanged |
| Principal scalar may appear twice | Potential-section direct read contains exactly one `Key idea: Electric potential is a scalar.` principal statement | `FALSE_ALARM` | No | Left unchanged |
| Example 2 charge may be `2.12×10⁻¹⁰ C` | Complete branch shows answer `Q=2.12×10⁻⁹ C`; wrong-value search returned 0 | `FALSE_ALARM` | No | Left unchanged |
| MC01 metadata may be missing | Card ID present; one exact `Answer:` child and four `Choice:` children | `FALSE_ALARM` | No | Left unchanged |
| CL02 may expose braces or not function | Rich read has one cloze span on `no work`, a native cloze card ID, and no visible braces | `FALSE_ALARM` | No | Left unchanged |
| Common Pitfalls may follow Summary | Direct module order places section 9 before section 10 | `FALSE_ALARM` | No | Left unchanged |
| Rough-block label may remain | Scoped `Rough Block` and `Correction memo` searches returned 0 | `FALSE_ALARM` | No | Left unchanged |

The twelve explicit cards reverified `PASS` under operation `d97a2463-dc59-4167-8756-bccc04083082`. The aggregate returned a thirteenth native `Size` descriptor; this is the known deployed property-record warning and was not repaired as content. No second root, module, Review Cards section, replacement deck, duplicate correction, or deletion was created.
