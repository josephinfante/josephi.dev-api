# josephi.dev-portfolio (API)

Backend API for josephi.dev, built with Bun + Express.  
It serves SSE presence data, GitHub contributions data, and background integrations (music ingest and Steam polling).

## Requirements

- Bun (v1.3.7+ recommended)
- A PostgreSQL database
- A Redis instance

## Setup

```bash
cp .env.example .env
bun install
```

Then fill in `.env` with valid values.

## Environment Variables

Required variables:

- `NODE_ENV` (`development` or `production`)
- `PORT`
- `DB_URL`
- `DB_SSL` (`true` or `false`)
- `REDIS_URL`
- `MUSIC_WS_TOKEN`
- `STEAM_KEY`
- `STEAM_ID`
- `GITHUB_TOKEN`

Optional variables:

- `ACCEPTED_ORIGINS` (comma-separated CORS allowlist)
- `LOG_LEVEL` (`debug`, `info`, `warn`, `error`)
- `APP_VERSION`

## Scripts

```bash
# Run in development
bun run dev

# Build for production
bun run build

# Start built app
bun run start

# Format codebase
bun run format
```

## API Endpoints

- `GET /presence/stream` - SSE stream for presence updates
- `GET /github/contributions` - GitHub contributions data

## Browser Extension (`extension/`)

This repository includes a browser extension in `extension/` (for YouTube Music integration).

To use it:

1. Open your browser extensions page (`chrome://extensions` in Chrome/Brave).
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select the local `extension/` folder.

### WebSocket Configuration

In `extension/content.js`, update the WebSocket URL to match your API server origin and your token:

```js
const socket = new WebSocket('ws://localhost:3001/ws/music?token=mi_token_ultra_secreto');
```

- Replace `ws://localhost:3001` with your server origin:
- Local: `ws://localhost:<port>`
- Hosted: `wss://your-domain.com`
- Replace `mi_token_ultra_secreto` with your generated token.

Important:

- The token used by the extension must be exactly the same as `MUSIC_WS_TOKEN` in your `.env`.
- If the extension token and `MUSIC_WS_TOKEN` do not match, the server will reject the messages sent by the extension.
