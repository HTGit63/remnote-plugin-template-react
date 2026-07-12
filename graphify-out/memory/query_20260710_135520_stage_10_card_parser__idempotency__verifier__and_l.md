---
type: "query"
date: "2026-07-10T13:55:20.142454+00:00"
question: "Stage 10 card parser, idempotency, verifier, and live proof dependency map"
contributor: "graphify"
outcome: "useful"
source_nodes: ["cardWrites.ts", "writeCaches.ts", "verifyCardSet", "designedNoteTools.ts", "markdownImportExecutor.ts"]
---

# Q: Stage 10 card parser, idempotency, verifier, and live proof dependency map

## Answer

Expanded from original query via graph vocab: [card, cards, flashcard, cloze, marker, classification, idempotency, duplicate, verifier, verify, repair, markdown]. BFS identified cardWrites.ts as parser/create seam, writeCaches.ts as idempotency seam, designedNoteTools.verifyCardSet as verification seam, and server card tools plus protocol types as MCP output seam.

## Outcome

- Signal: useful

## Source Nodes

- cardWrites.ts
- writeCaches.ts
- verifyCardSet
- designedNoteTools.ts
- markdownImportExecutor.ts