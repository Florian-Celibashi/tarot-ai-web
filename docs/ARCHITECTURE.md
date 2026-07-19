# Architecture

Tarot AI Terminal separates product interaction, tarot logic, and model inference so each boundary can be reasoned about and tested independently.

## Components

### Browser UI (`src/public`)

- Captures a question through a type-anywhere interaction.
- Maintains an in-memory `Set` of cards drawn in the current page session.
- Sends the question and exclusions to the server.
- Escapes all model text before applying a deliberately small bold/newline formatter.
- Renders the card image, structured metadata, interpretation, and recoverable error states.

There is no browser persistence, authentication, account data, or analytics in the current implementation.

### Express API (`src/server.js`)

- Serves static assets and a JSON API from one process.
- Limits JSON bodies to 16 KB and questions to 1,000 characters.
- Caps each model completion at 1,200 tokens.
- Filters exclusions against the canonical deck and caps normalized results to 78 cards.
- Keeps the OpenAI credential server-side.
- Applies a restrictive Content Security Policy and additional browser security headers.
- Converts upstream failures into stable, non-sensitive error responses.

The app factory accepts an injected AI client and random-number source. Production uses the configured OpenAI client and `Math.random`; tests use deterministic local substitutes.

### Tarot domain (`src/tarot.js`, `src/tarotDeck.js`)

The domain module owns:

- the canonical 78-card deck;
- selection from the remaining cards;
- Major and Minor Arcana metadata;
- Rider–Waite filename and URL mapping.

These functions have no network or environment dependency.

### Model adapter

Each reading sends exactly two messages: a fixed system instruction and one user message containing the current question and application-selected card. No previous questions, generated interpretations, rolling summaries, or hidden memory are sent.

## Request lifecycle

1. The browser validates that a non-empty question exists.
2. The API repeats validation at the trust boundary.
3. The API normalizes valid excluded cards.
4. The domain module selects one available card.
5. The API submits the current question and selected card to OpenAI.
6. The server returns a structured response; the browser safely renders it and records the card locally.

## Deliberate tradeoffs

- **Client-owned exclusions:** simple and privacy-friendly, but not authoritative against a modified client. Duplicate prevention is a UX guarantee within the standard browser flow, not a security control.
- **In-process random draw:** suitable for a reflective experience, not for gambling, cryptography, or auditable randomness.
- **No database:** reduces data retention and operational complexity, but readings disappear on refresh.
- **External card images:** keeps the repository small, but availability depends on a third-party GitHub-hosted dataset.
- **Single-turn inference:** makes data flow explicit and bounded; follow-up memory would require a separate consent, privacy, retention, and evaluation design.

## Verification seams

The test suite exercises the full deck, metadata/image mapping, deterministic exclusions, request validation, success payload construction, model failure mapping, security headers, health reporting, and SPA/API routing without an API key or network access.
