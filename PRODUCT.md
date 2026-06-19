# RemnoteMCP Product Contract

RemnoteMCP is a controlled MCP bridge for reading and writing a user's RemNote knowledge base from ChatGPT.

Primary user goal: bulk import faithful Markdown notes into RemNote without exposing dangerous tools, corrupting style, hanging verifiers, or faking live proof.

Core product guarantees:

- Default tool profile is `mass_note_writer`.
- The default public writer is `create_or_replace_note_from_markdown`.
- Broad writer, design, card, debug, repair, replace, and delete tools are hidden from the default profile.
- Every tool result uses a standard envelope with status, operation ID, target, mutation arrays, verification, timing, warnings, and error details.
- Live proof is separate from local registry/build proof.
- Local disconnected mode reports local bridge truth; it must not masquerade as hosted pairing state.
- Destructive cleanup is gated by dry run, exact target guards, and optional current-session creation proof.

Non-goals:

- No fake hosted user, fake plugin success, or dummy fallback note state.
- No delete outside a disposable test root.
- No broad architecture rewrite while completing the mass-note stability plan.
