# RemNote OpenAI Connector

A RemNote plugin that adds an OpenAI-powered right-sidebar tool for generating, summarizing, rewriting, expanding, and cleaning notes.

## Local Setup

1. Run `npm install`
2. Run `npm run dev`
3. In RemNote open `Settings -> Plugins -> Build`
4. Use `Develop from localhost`
5. Enter `http://localhost:8080`
6. Enable the plugin
7. Open plugin settings and add your `OpenAI API Key`

## How It Works

- The plugin adds an `OpenAI` tab to the right sidebar.
- You can generate notes from a topic or transform the currently focused Rem.
- AI output is previewed before you create, append, or replace content.
- Delete remains protected by an explicit confirmation dialog.
- The `Open ChatGPT` button opens [ChatGPT](https://chatgpt.com/) and copies the current prompt or note context.

## Notes

- Do not enter `/manifest.json` in RemNote. Use `http://localhost:8080` only.
- The plugin uses the API key stored in RemNote settings at runtime.
- `npm run dev` now uses plain webpack watch + static file serving. No hot-refresh overlay, no React refresh, less RemNote sandbox breakage.

## Project Docs

- `ARCHITECTURE.md`
- `SAFETY.md`
- `NEXT_STEPS.md`
