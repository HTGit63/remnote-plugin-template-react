# RemnoteMCP Design Contract

This pass changes MCP behavior, not the visible RemNote widget layout.

Interface rules:

- Keep the RemNote sidebar quiet and operational.
- Keep dangerous and developer actions behind Advanced or explicit profile gates.
- Show mode truth directly: local token mode, hosted OAuth mode, plugin connected/disconnected, selected tool profile, and pending approval.
- Do not display success copy for unverified live writes.
- Prefer compact status rows, tool health summaries, and copy-debug actions over marketing text.

The mass-note default profile is a design decision: the user should see and receive the safest bulk-note path first, with broader writer/design/card tools available only after deliberate profile escalation.
