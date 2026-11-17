# Getting started

QRCODE produces two kinds of QR codes:

- **Static codes** contain their content (a URL, Wi-Fi credentials, a contact card) directly in the pattern. They are generated on your device by [`@qrcode/core`](./core), need no server and never expire.
- **Dynamic codes** contain a short link to a QRCODE server, such as `https://qr.example.com/r/menu`. The server redirects each scan to the current destination, so you can change it after printing and view scan statistics.

```text
Static:   QR code ──────────────► https://example.com

Dynamic:  QR code ──► /r/menu ──► current destination (editable)
                         │
                         └─► anonymous scan record
```

## Choosing a component

| Goal | Component |
| --- | --- |
| Create a code without an account | The QR Studio (`/studio` in the web app) |
| Generate codes in a JavaScript application | [`@qrcode/core`](./core) |
| Render codes in React | [`@qrcode/react`](./react) |
| Generate codes from a terminal or script | [`QRCODE` CLI](./cli) |
| Run dynamic codes, analytics and the API | [QRCODE server with Docker](./docker) |
| Automate a QRCODE server | [REST API](./api) or [`@qrcode/sdk`](./sdk) |

## Hosted Studio

A static build of the Studio is published on GitHub Pages at <https://github.com/Clyvora/QRCODE/>. It is the same application with server features turned off: codes are generated and exported locally, but dynamic codes, accounts and analytics are not available. For those, run a QRCODE server. See [GitHub Pages](./github-pages) for how the deployment works.

## Quick examples

Generate an SVG in Node.js or the browser:

```bash
npm install @qrcode/core
```

```js
import { generateQR } from "@qrcode/core";

const svg = await generateQR({ data: "https://example.com", format: "svg" });
```

Generate codes from the terminal:

```bash
npx @qrcode/cli generate https://example.com            # preview in the terminal
npx @qrcode/cli wifi --ssid Cafe --password espresso -o wifi.png
```

Run the full platform:

```bash
git clone https://github.com/Clyvora/QRCODE.git
cd QRCODE
docker compose up -d
```

Open <http://localhost> and register. The first account becomes the administrator. Dynamic codes are created from the dashboard.

## Design constraints

- No paid APIs, cloud services or proprietary QR services are used.
- Static code content is never sent to a server.
- There are no ads or third-party scripts.
- Analytics never store IP addresses or full user-agent strings.

## Next steps

- [Installation](./installation): installing each component.
- [Architecture](./architecture): how the components fit together.
- [Self-hosting](./self-hosting): configuration reference for production.
