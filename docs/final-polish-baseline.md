# Final Polish Baseline

Generated: 2026-05-17
Branch: `release/final-polish`
Baseline tag: `pre-final-polish-working-tools`
Baseline commit: `7aa531b`

## Scope

Phase 1 freeze only. No runtime behavior change made before this note.

Pre-existing dirty file before Phase 1 work:

```text
README.md
```

## Tool Registry

Source registry:

```text
toolRegistryVersion: 2026-05-15.2
mcpDiscoveryVersion: mcp-discovery-2026-05-15.2
publicToolCount: 47
hidden legacy delete tools:
  delete_rem
  delete_focused_rem
  delete_selected_rem
```

Default discovery keeps hidden legacy delete tools out of the public MCP tool list.

## Validation

```text
npm run check-types: pass
npm run validate: pass
npm run build: pass with existing webpack asset-size warnings for bridge-status bundles
npm run server:build: pass
npm run server:smoke: pass
npm run bridge:live-test: failed/unavailable, fetch failed against http://127.0.0.1:47392/mcp because no live companion server/plugin loop was reachable
git diff --check: pass
```

## Phase 1 Verdict

```text
branch exists: yes
baseline tag exists: yes
tool count recorded: yes
hidden delete tools confirmed hidden: yes
server smoke test passes: yes
live test recorded or marked skipped/unavailable: yes, unavailable
no behavior change made yet: yes
```
