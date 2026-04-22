# Safety Controls & Permissions

Because this connector requests **`All`** read scope and **`ReadCreateModifyDelete`** write access levels, we are exposing the entire Knowledge Base (KB) to the plugin. This is required for a general-purpose AI connector that operates on any document. However, doing so requires strict guidelines.

## Current Safeguards
- **Deliberate Deletes**: There is NO automated process or background queue currently designed to spontaneously `delete` an item. Any action attempting to call `rem.remove()` invokes a native `window.confirm()` dialog explicitly highlighting that descendants will also be erased.
- **Append Default**: Changes supplied by AI (Summarize, Rewrite) default to being appended as a child rather than replacing text. 
- **Replace Confirmation**: Similar to deleting, clicking "Replace" prompts a `window.confirm()` stating that it is a destructive overwrite behavior.

## Recommendations for Testing
1. Map out a specific document folder for experimentation (e.g. `Test KB Space`).
2. Do not use random commands on critical root nodes.
3. Be aware that deleting a top-level parent document via the `Delete` button securely removes all nested content in the knowledge graph. Always double-check your context label natively in the widget UI before confirming.
