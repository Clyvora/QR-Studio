# Installation

QRCODE is a monorepo of components that can be used independently. Install only the parts you need.

## npm packages

| Package | Install | Requirements |
| --- | --- | --- |
| [`@qrcode/core`](./core) | `npm install @qrcode/core` | Node.js 18+ or a modern browser |
| [`@qrcode/react`](./react) | `npm install @qrcode/react` | React 17+ |
| [`@qrcode/cli`](./cli) | `npm install -g @qrcode/cli` | Node.js 18+ |
| [`@qrcode/sdk`](./sdk) | `npm install @qrcode/sdk` | Any runtime with `fetch` (Node.js 18+, Deno, Bun, browsers) |

All packages are ES modules with TypeScript definitions and require no build step. `@qrcode/core` has no runtime dependencies.

## QRCODE server

The server is a single Go binary. It provides the REST API, the redirect service for dynamic codes, analytics and, optionally, the web app.

### Docker (recommended)

```bash
git clone https://github.com/Clyvora/QRCODE.git
cd QRCODE
docker compose up -d        # PostgreSQL + QRCODE on http://localhost
```

[Docker](./docker) covers the SQLite variant, HTTPS with Caddy, backups and upgrades.

### From source

Requires Go 1.26+ and Node.js 20+.

```bash
git clone https://github.com/Clyvora/QRCODE.git
cd QRCODE
npm install
npm run build                           # builds apps/web into apps/web/dist

cd apps/api
go build -o QRCODE .                   # static binary, cgo not required
QRCODE_WEB_DIR=../web/dist ./QRCODE   # http://localhost:8080
```

Without configuration, the server stores data in SQLite at `./data/QRCODE.db` and listens on `:8080`. All settings are environment variables; see [Self-hosting](./self-hosting#configuration).

Command-line flags:

```bash
./QRCODE -version   # print the version
./QRCODE -migrate   # apply database migrations and exit
```

### First account

The first account registered on a new server becomes the administrator, even when registration is closed. To create it without the browser, set `QRCODE_ADMIN_EMAIL` and `QRCODE_ADMIN_PASSWORD` before the first start.

## Web app on a static host

The Studio works without a server. Build `apps/web` and upload `apps/web/dist` to any static host:

```bash
npm install
VITE_STATIC_ONLY=true npm run build
```

`VITE_STATIC_ONLY=true` disables all server features. Without it, the app looks for a server at `/api/v1` and hides the dashboard if none responds. Set `VITE_BASE` when the app is served from a subdirectory (for example `VITE_BASE=/QRCODE/`). The app uses client-side routing, so configure the host to serve `index.html` for unknown paths. [GitHub Pages](./github-pages) describes a working setup.
