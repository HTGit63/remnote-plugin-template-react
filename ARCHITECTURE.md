# Architecture

## Current MVP Layering
This plugin is the actual functional access layer bridging your knowledge base (KB) with OpenAI. Because RemNote’s API is primarily accessed through the local plugin SDK natively inside the web or desktop client, a traditional remote server cannot directly fetch your KB securely. Therefore, the architecture embeds the "connector" pattern directly inside this plugin.

1. **RemNote Access Layer (`src/widgets/connector.tsx` & RemNote SDK)**: Grabs the selected Rem, handles appending content, and replaces nodes.
2. **OpenAI Layer (`src/services/openai.ts`)**: Pure abstraction for fetching completion text.

## Future Automation Paths (The "ChatGPT App" Model)
Because the SDK provides a web-hook or socket abstraction via JavaScript, we set up `src/services/automation.ts` to show how future tasks could be polled. 
In the future, one could run a local Python or Node server (e.g. an MCP connector), which pushes messages to this running plugin queue via WebSockets, allowing your RemNote app instance to autonomously run background edits synchronized from a calendar or script.

## Why this approach?
- Avoids leaking full KB data to a third-party server by pulling only what is focused/selected directly to OpenAI from your client.
- Respects the RemNote extension abstraction (if RemNote introduces a server-to-server API, this logic simply shifts from the JS plugin client to the server).
