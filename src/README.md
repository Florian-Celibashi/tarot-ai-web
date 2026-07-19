# Developer quickstart

The project overview, architecture, scope, and security model live in the
[repository README](../README.md).

```bash
npm ci
npm test          # deterministic; no API key required
cp .env.example .env
npm start
```

The server and `/api/health` run without an OpenAI key. A configured
`OPENAI_API_KEY` is required only to generate a reading through `/api/reading`.
