# Tarot AI Terminal

[![CI](https://github.com/Florian-Celibashi/tarot-ai-web/actions/workflows/ci.yml/badge.svg)](https://github.com/Florian-Celibashi/tarot-ai-web/actions/workflows/ci.yml)

A terminal-inspired creative AI experience that pairs a structured 78-card tarot domain model with question-specific OpenAI interpretations. The project explores how interface design, symbolic data, and generative text can work together as one coherent product—not just an API demo.

## What it demonstrates

- **Product-minded AI integration:** the model interprets a card selected by application logic; it does not choose or invent the draw.
- **Testable domain logic:** exclusions, metadata, and Rider–Waite image mapping are isolated, while card selection accepts an injected random source for deterministic tests.
- **Intentional interaction design:** type-anywhere input, oversized typography, a chronological reading feed, responsive card layouts, and explicit loading/error states.
- **Safer server boundaries:** the API key stays server-side; requests are size-bounded and validated; model errors are mapped to non-sensitive client messages.
- **Engineering hygiene:** automated linting, API/domain tests, dependency auditing, Dependabot, and Node 20/22 CI.

## Product scope

A user types a question, receives one non-repeating card from the standard 78-card deck, and sees:

1. the selected card and Rider–Waite image;
2. structured arcana, elemental, planetary, and zodiac metadata;
3. a concise interpretation grounded in that question.

Card exclusions live in the current page session and are sent with each request. The current implementation is deliberately **single-turn**: it does not claim conversation memory, accounts, saved readings, or server-side persistence.

## Architecture

```text
Browser UI
  ├─ keeps the session's drawn-card set
  ├─ renders escaped model output
  └─ POST /api/reading
           │
           ▼
Express API ── validates input and exclusions
  ├─ tarot.js ── testable card draw, metadata, image mapping
  └─ OpenAI adapter ── one question + one application-selected card
           │
           ▼
Structured JSON response ── card + metadata + interpretation
```

See [Architecture](docs/ARCHITECTURE.md) for boundaries, tradeoffs, and the request lifecycle.

## Run locally

Requirements: Node.js 20 or newer.

```bash
cd src
npm ci
cp .env.example .env
npm start
```

Open `http://localhost:3000`.

Tests, linting, and the health endpoint do **not** require an API key:

```bash
npm run check
npm audit --omit=dev
curl http://localhost:3000/api/health
```

To generate readings, set `OPENAI_API_KEY` in `src/.env`. `OPENAI_MODEL` is optional and defaults to `gpt-5.4`; overrides must support the Chat Completions `reasoning_effort` and `max_completion_tokens` parameters used by the adapter. Never commit `.env` or paste credentials into issues, logs, screenshots, or client-side code.

## API contract

`POST /api/reading`

```json
{
  "question": "What should I pay attention to this week?",
  "excludedCards": ["The Fool", "Ace of Cups"]
}
```

The response contains `card`, `cardImageUrl`, structured `cardDetails`, and `interpretation`. Invalid input, exhausted decks, missing server configuration, rate limits, and upstream failures return distinct HTTP statuses with safe JSON errors.

## Repository map

```text
.github/                 CI and dependency update automation
docs/ARCHITECTURE.md     System boundaries and design decisions
src/public/              Dependency-free browser interface
src/server.js            Express API and OpenAI adapter
src/tarot.js             Tarot domain utilities with injected randomness
src/tarotDeck.js         Canonical 78-card deck
src/test/                Deterministic domain and API tests
SECURITY.md              Key handling and security posture
```

## Responsible use

Tarot AI Terminal is designed for reflection and creative exploration. It is not a substitute for medical, legal, financial, or mental-health advice. Model output is generated text and can be wrong.

The former public demo linked from the original hackathon page is currently unavailable, so this repository is the authoritative, locally verifiable implementation.

Card imagery is loaded from the open-source [`metabismuth/tarot-json`](https://github.com/metabismuth/tarot-json) dataset.
