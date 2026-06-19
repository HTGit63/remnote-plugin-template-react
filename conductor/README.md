# Conductor

## Product

RemnoteMCP bridges ChatGPT and RemNote for controlled note reading, bulk Markdown import, diagnostics, and guarded cleanup.

## Current Track

`fix/remnote-mcp-mass-note-creation-stability`

Goal: complete the `Agents.md` mass-note stability stages without weakening bridge security or claiming unproven live RemNote success.

## Architecture Boundaries

- `server/src/**`: MCP server, auth, registry, diagnostics, health, bridge routing.
- `shared/bridge/**`: SDK-free protocol, schemas, Markdown importer.
- `src/remnote/**`: RemNote plugin SDK read/write implementation.
- Server code must not import plugin SDK modules.

## Verification

Required local gates:

- `npm run check-types`
- `npm run validate`
- `npm run server:build`
- `npm run server:smoke`
- `npm run server:test:tool-profile`
- `npm run server:mass-note-audit`

Live gates need a running RemNote plugin socket and disposable test parent. Missing plugin access is `PLATFORM_BLOCKED` or gated, not pass.
