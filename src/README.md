# Tarot AI Web (Simple Version)

A minimal website where a user:
1. Opens a black full-screen UI and types directly (oversized white text appears as they type).
2. Draws one random tarot card from a standard 78-card deck.
3. Presses `Enter` to send the question + drawn card to OpenAI.
4. Sees each turn appended in order (question, then card + AI interpretation), so multiple entries read like a feed.
5. Sees the classic Rider-Waite tarot card image on the right side of each AI response.
6. Gets a short, direct interpretation tied to the exact question.
7. Sees card metadata (arcana, number, element, planet, zodiac) shown above each interpretation.

## Run locally

```bash
cd tarot-ai-web
npm install
cp .env.example .env
# Put your real key in .env (do not keep the placeholder value)
npm start
```

Open: `http://localhost:3000`

## Environment variables

- `OPENAI_API_KEY` (required)
- `OPENAI_MODEL` (optional, default: `gpt-5.4`)
- `OPENAI_TEMPERATURE` (optional, default: `1`)
- `PORT` (optional, default: `3000`)
