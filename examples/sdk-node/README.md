# Node.js SDK: dynamic codes and analytics

Uses [`@qrcode/sdk`](../../packages/sdk) to create a dynamic QR code on your own QRCODE server,
render it locally with `@qrcode/core`, change its destination, read analytics and list all codes.

1. Start a QRCODE server (for example `docker compose up -d` in the repository root).
2. Sign in and create an API key under **Dashboard → API keys**.
3. Run:

```bash
cd examples/sdk-node
npm install
QRCODE_URL=http://localhost QRCODE_API_KEY=qrf_your_key node index.js
```

On Windows PowerShell:

```powershell
$env:QRCODE_URL="http://localhost"; $env:QRCODE_API_KEY="qrf_your_key"; node index.js
```
