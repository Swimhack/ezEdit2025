# ezEdit

ezEdit is an AI-powered legacy website editor that allows users to connect via FTP, modify content using a live Monaco code editor, and receive AI-based code suggestions for legacy site modernization.

## Setup

```sh
pnpm i
pnpm run dev -- --host 0.0.0.0 --port 5173
```

## Environment

Copy `.env.example` to `.env` and fill in your credentials:

```
FTP_HOST=
FTP_USER=
FTP_PASS=
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

## SQL (Supabase)

Run the migration in `infra/supabase/001_init.sql` to set up the `mysites` table.

## Demo

1. Start the API and web apps.
2. Connect to your FTP/SFTP server.
3. Browse, edit, preview, and refactor your legacy site with AI.

---

See `ROADMAP.md` for Phase 2 features (WordPress hooks, team collaboration).

---

🧰 MCP Quick-start

Copy .env.example to .env and add NEON_API_KEY, BRAVE_API_KEY.

Run `npm run mcp:up` (first time pull ≈ 400 MB).

Restart Cursor – it auto-detects the manifest and shows tools
► neon ► crawl4ai ► brave

Ask natural language questions, e.g.
• "List tables in the billing schema" (Neon)
• "Fetch docs for React Query useInfiniteQuery" (Crawl4AI)
• "Search web: Postgres 16 parallel vacuum" (Brave)

---

## Development server port forwarding

### 2.2  Forward the port

**Dev-container users** – add or edit the snippet below in `.devcontainer/devcontainer.json`:

```jsonc
{
  "forwardPorts": [5173],
  "portsAttributes": {
    "5173": { "label": "Vite dev", "onAutoForward": "openPreview" }
  }
}
```

VS Code / Cursor reads `forwardPorts` and sets up the tunnel automatically.

**Bare-metal Docker** – add `ports: ["5173:5173"]` (or `EXPOSE 5173`) to the relevant service in `docker-compose.yml`.

Check the "Ports" panel in Cursor. If you see `5173 → http://localhost:5173`, click the globe icon to open in Webview.

### 2.3  Fallback port test
If 5173 still gives a 502 or white screen, try an alternate port (e.g. 8080):

```bash
npm run dev -- --host 0.0.0.0 --port 8080
```

Cursor sometimes flags 5173 as "private" and fails the handshake, while 8080 works fine.

### 3 Troubleshooting matrix

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank page, no error | Server not running | `npm run dev` |
| 502 Bad Gateway | Port forwarded but server bound to 127.0.0.1 | Add `--host 0.0.0.0` |
| Port shows "Pending…" | Docker auto-forward bug (v4.30+) | Explicit forward + `--host` flag |
| Cursor Webview white screen everywhere | DNS / local network glitch | `curl localhost:5173` or change DNS to 1.1.1.1 |
| Port forwards then hangs | Remote tunnel timing out | Re-run with `--host` or pick new port |
| Vite switches to 5174, 5175… | Port in use | Hard-code the port in `vite.config.js` |

### 4 If you're inside a Dev Container or Codespace

Dev-container auto-forward sometimes breaks after Docker upgrades; pinning `--host 0.0.0.0` resolves it.

Ensure the VS Code Server finishes installing; hanging here means no port forwarding at all.

Check logs via **Command Palette → Dev Container: Show All Logs**.

### 5 Final checklist

1. `npm run dev -- --host 0.0.0.0 --port 5173` (or your chosen port) is running.
2. Port 5173 is declared in `forwardPorts` or exposed in `docker-compose.yml`.
3. The port entry appears in Cursor's **Ports** tab and status reads **Open in Browser**. 