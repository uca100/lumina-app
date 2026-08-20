# Lumina

Personal inspiration capture app — classify quotes, lessons, advice, and more with Google Gemini.

## AI setup (Gemini)

1. Open [Google AI Studio → API keys](https://aistudio.google.com/apikey)
2. Create an API key
3. On the server, edit `/usr/local/lumina/.env.local`:
   ```bash
   GEMINI_API_KEY=your_key_here
   ```
4. Restart: `sudo systemctl restart lumina`

Health check: `GET /lumina/api/ai/status` (cached ~60s). The home page shows an error banner when AI is down.

See also `.env.example` and the **Integrations** page in the app.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3009](http://localhost:3009) (or your configured port).

## Deploy

```bash
./deploy.sh
```

Builds, rsyncs to pi5 `/usr/local/lumina`, installs deps, and restarts the systemd service. `.env.local` is not overwritten.
