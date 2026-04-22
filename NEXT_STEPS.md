# Next Steps

The MVP has established a fundamental path to use OpenAI directly against targeted KB ranges. Moving forward, the plugin is architecturally prepared for these upgrades:

### Scheduled Note Generation & Calendar Source Integration
- **Concept**: Periodically sync external endpoints (like Google Calendar API) into native RemNote daily documents via `automation.ts` stubs.
- **Implementation Status**: Deferred. The data structures and `AutomationQueue` are present but not wired to an external polling interval yet.

### Remote / Background Automation 
- **Concept**: An App-like server layer where tasks are completed offline.
- **Implementation Status**: RemNote’s API architecture prioritizes the active SDK client. Until RemNote exposes a full Headless/Server API, we emulate this by treating this plugin as the "always on" desktop runner that polls an external server.

### Advanced Knowledge Base Syncing (Semantic Search)
- Enhancing AI prompts to fetch siblings or search nodes before rewriting. This involves injecting more contextual history directly into the OpenAI prompt structure.
