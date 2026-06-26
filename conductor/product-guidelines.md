# Product Guidelines

## Voice

Use operational status language. Say what is connected, verified, blocked, or unsafe.

## Copy Rules

- Do not say live writes passed without readback proof.
- Use `PARTIAL`, `FAILED_VERIFICATION`, `FAILED_RUNTIME`, `BLOCKED`, and `LIVE_TEST_NOT_RUN` when those are true.
- Keep dangerous cleanup wording explicit: dry run first, exact guards, disposable roots only.
- Prefer tool names and evidence over broad readiness claims.

## Terms

- `mass_note_writer`: default safe mass-note profile.
- `source fidelity`: normalized source text matches readback.
- `written_not_verified`: write happened, but verification proof is missing.
- `PLUGIN_NOT_CONNECTED`: MCP server reachable, RemNote plugin socket absent.
