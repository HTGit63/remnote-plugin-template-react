# Source Inventory Audit - 2026-06-23

## Boundary

Audited source inventory excludes VCS, vendor, and build-output folders:

- `.git`
- `node_modules`
- `server/node_modules`
- `dist`
- `server/dist`
- `coverage`

## Counts

- Source files inventoried: 253
- Source folders inventoried: 45

## Top-Level Source File Distribution

| Path | Files |
| --- | ---: |
| root config/docs files | 32 |
| `.github` | 2 |
| `conductor` | 1 |
| `docs` | 30 |
| `plans` | 2 |
| `public` | 2 |
| `reports` | 15 |
| `scripts` | 2 |
| `server` | 82 |
| `shared` | 14 |
| `src` | 55 |
| `tests` | 10 |

## Notes

- This inventory is a source-boundary audit, not a line-by-line manual review of every generated or vendor file.
- The release-critical files were reviewed directly in the implementation pass: bulk planner, job store, bulk MCP tools, tool registry/policy, Markdown writer boundary, style preset layer, plugin widget header/CSS, docs, and focused tests.
