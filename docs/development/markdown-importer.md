# Markdown Importer & AST Parser Guide

The Markdown Importer allows users to translate raw Markdown documents directly into fully-structured, styled RemNote note trees using the `create_or_replace_note_from_markdown` tool.

---

## Architecture Flow

```text
Markdown Source
  -> shared/bridge/markdown-importer.ts (AST Parser)
  -> JSON AST Representation
  -> JSON RPC Bridge Message
  -> src/remnote/write/markdownImportExecutor.ts (Write engine)
  -> RemNote DB (via SDK calls)
```

---

## 1. The AST Parser (`shared/bridge/markdown-importer.ts`)

The parser is pure JavaScript/TypeScript and has no external dependencies. It processes the markdown source sequentially into a structured Abstract Syntax Tree (AST).

### Supported AST Nodes:
* **Headers**: `H1`, `H2`, `H3`, `H4` (defined by leading `#`).
* **Paragraphs**: Normal text blocks, blockquotes, and bold/italic markup.
* **List Elements**: Nested bullet lists and ordered numbered lists.
* **Math Elements**: Inline formulas (`$formula$`) and block math equations (`$$equation$$`).
* **Code Blocks**: Multiline syntax blocks (fenced with backticks).
* **Tables**: Grid layouts parsed and converted to readable text tables.
* **Spacers**: Multiple blank lines mapped to spacing placeholders.

---

## 2. High-Fidelity Source Verification

To ensure no content is dropped during the import transaction, the system computes and returns a **Fidelity Verification Report** containing:

1. **Element Counts**: The parser counts structural elements in the source markdown.
   * `headingCount`, `paragraphCount`, `bulletCount`, `mathCount`, `codeCount`, `tableCount`.
2. **Pollution Safeguards**: It verifies that formatting helper Rems (e.g. `H1`, `H2`, `H3`, `normal`, `Size`) are not accidentally generated in the active document workspace.
3. **Fidelity Matches**: Compares expected snippets to verify the write operation wrote all text fragments exactly in order.

---

## 3. Transaction Rollbacks & Atomicity

Long markdown imports are executed inside an atomic transaction wrapper. If a parsing validation error or formatting pollution is detected:

* **Rollback Mode**: The system triggers a delete operation targeting all Rem IDs created during the current batch to restore the database to its pre-import state.
* **Execution Evidence**: The response includes `rollbackStatus` (`'completed'`, `'failed'`, or `'not_attempted'`) along with partial execution footprints:
  ```json
  {
    "ok": false,
    "error": {
      "code": "IMPORT_FIDELITY_FAILED",
      "message": "Fidelity check failed: paragraph count mismatch",
      "details": {
        "partialExecution": {
          "createdRemIds": ["rem_a", "rem_b"],
          "rollbackStatus": "completed"
        }
      }
    }
  }
  ```

---

## 4. Run Importer Tests

You can verify parser and import behavior using the following test scripts:

```bash
# Verify parser rules, tokenizing, and elements extraction
npm run server:test:markdown-importer

# Verify that source elements match write outputs exactly
npm run server:test:source-fidelity

# Benchmark the speed and size limits of large imports
npm run server:test:performance
```
