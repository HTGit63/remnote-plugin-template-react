---
type: "query"
date: "2026-07-10T13:38:51.324689+00:00"
question: "Stage 9 Markdown, formula, and rich-text fidelity dependency map"
contributor: "graphify"
outcome: "useful"
source_nodes: ["markdown-importer.ts", "markdownImportExecutor.ts", "structuredBatch.ts", "remnoteSdkHelpers.ts", "richTextFormatting.ts", "verification.ts", "protocol-write-results.ts"]
---

# Q: Stage 9 Markdown, formula, and rich-text fidelity dependency map

## Answer

Expanded from original query via graph vocab: [markdown, importer, heading, bullet, formula, latex, span, table, code, fidelity, readback, verification]. BFS identified markdown-importer.ts as parser seam; markdownImportExecutor.ts and structuredBatch.ts as write path; remnoteSdkHelpers.ts and richTextFormatting.ts as rich-text/formula path; verification.ts and protocol-write-results.ts as proof/result path.

## Outcome

- Signal: useful

## Source Nodes

- markdown-importer.ts
- markdownImportExecutor.ts
- structuredBatch.ts
- remnoteSdkHelpers.ts
- richTextFormatting.ts
- verification.ts
- protocol-write-results.ts