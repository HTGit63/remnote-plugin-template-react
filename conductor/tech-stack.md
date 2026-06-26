# Tech Stack

- Language: TypeScript.
- Runtime: Node.js ESM.
- Frontend/plugin: React with RemNote plugin SDK.
- Server: MCP server under `server/src`.
- Shared protocol: `shared/bridge`.
- Tests: Vitest plus server smoke scripts with `tsx`.
- Build: root plugin build plus server TypeScript build.

## Key Modules

- `server/src/tool-policy.ts`: tool profiles, risk tiers, default profile.
- `server/src/tool-registry.ts`: registry, diagnostics, runtime/source metadata.
- `server/src/tools/*`: MCP tool registration.
- `shared/bridge/bulk-import.ts`: bulk import planner and verification model.
- `server/src/bulk-import/job-store.ts`: resumable import job state.
- `src/remnote/write/*`: RemNote write implementation and verification.

## Constraints

Server/shared modules must not import RemNote plugin SDK runtime modules. `server:test:boundaries` enforces this.
