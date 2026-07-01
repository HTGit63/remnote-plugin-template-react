# Render Deployment

Use `render.yaml`.

```text
rootDir: server
buildCommand: npm ci && npm run build
startCommand: npm start
```

Hosted pairing is intentionally enabled with:

```text
REMNOTE_BRIDGE_DEPLOYMENT_MODE=public_hosted_oauth
REMNOTE_BRIDGE_ENABLE_HOSTED_PAIRING=1
```

Allowed browser origins include ChatGPT and both bare/www RemNote origins.

Before deploy:

```bash
npm run server:build
npm run server:test:boundaries
cd server
npm install
npm run build
```

Production secrets required:

```text
SESSION_SECRET
ADMIN_DEBUG_SECRET
DATABASE_URL
PUBLIC_BASE_URL
MCP_SERVER_URL
OAUTH_ISSUER
REMNOTE_CODEX_TOKEN optional Codex bearer token
```
