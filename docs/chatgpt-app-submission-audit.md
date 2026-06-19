# ChatGPT App Submission Audit

Status: not ready for public App Review until a public HTTPS MCP endpoint and live RemNote sandbox proof are available.

Current submission posture:

- Default public profile: `mass_note_writer`.
- Default writer: `create_or_replace_note_from_markdown`.
- Tool annotations use explicit `readOnlyHint`, `destructiveHint`, and `openWorldHint`.
- Output schemas expose the standard response envelope.
- CSP and public hosted URLs still need deployment-specific confirmation before submission.
- Private/local use should remain in Developer Mode.

Public submission blockers:

- No current proof in this run of a reachable public HTTPS MCP endpoint.
- No current proof in this run of ChatGPT Developer Mode connecting to the deployed endpoint.
- No current live 15/50/100-node RemNote write/readback/cleanup run.
- Privacy policy, support URL, screenshots, and reviewer test steps need final deployed values.
