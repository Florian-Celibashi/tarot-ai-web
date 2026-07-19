const assert = require("node:assert/strict");
const { describe, it } = require("node:test");
const request = require("supertest");

const tarotDeck = require("../tarotDeck");
const {
  createApp,
  extractTextContent,
  normalizeExcludedCards
} = require("../server");

const silentLogger = {
  error() {}
};

function createMockOpenAI({ content = "A grounded interpretation.", error } = {}) {
  const calls = [];
  const client = {
    chat: {
      completions: {
        async create(payload) {
          calls.push(payload);
          if (error) {
            throw error;
          }

          return {
            choices: [{ message: { content } }]
          };
        }
      }
    }
  };

  return { calls, client };
}

describe("content normalization", () => {
  it("extracts text from supported model response shapes", () => {
    assert.equal(extractTextContent("  answer  "), "answer");
    assert.equal(
      extractTextContent(["First ", { text: "second" }, { content: " third" }, {}]),
      "First second third"
    );
    assert.equal(extractTextContent(null), "");
  });

  it("keeps at most 78 unique canonical exclusions", () => {
    const noisy = [" The Fool ", "The Fool", "invalid", ...tarotDeck, ...tarotDeck];
    const normalized = normalizeExcludedCards(noisy);

    assert.equal(normalized.length, 78);
    assert.equal(normalized[0], "The Fool");
    assert.equal(normalized.includes("invalid"), false);
    assert.deepEqual(normalizeExcludedCards("The Fool"), []);
  });
});

describe("HTTP API", () => {
  it("reports health without requiring an API key", async () => {
    const app = createApp({ openaiClient: null, logger: silentLogger });
    const response = await request(app).get("/api/health").expect(200);

    assert.deepEqual(response.body, { status: "ok", aiConfigured: false });
    assert.equal(response.headers["cache-control"], "no-store");
  });

  it("serves an accessible product shell and restrictive headers", async () => {
    const app = createApp({ openaiClient: null, logger: silentLogger });
    const response = await request(app).get("/").expect(200);

    assert.match(response.text, /Ask a question\. Draw one card\./);
    assert.match(response.headers["content-security-policy"], /default-src 'self'/);
    assert.equal(response.headers["x-content-type-options"], "nosniff");
    assert.equal(response.headers["x-powered-by"], undefined);
  });

  it("rejects missing, blank, and non-string questions", async (t) => {
    const app = createApp({ openaiClient: null, logger: silentLogger });

    for (const body of [{}, { question: "   " }, { question: { text: "no" } }]) {
      await t.test(JSON.stringify(body), async () => {
        const response = await request(app).post("/api/reading").send(body).expect(400);
        assert.equal(response.body.error, "Please enter a question first.");
      });
    }
  });

  it("rejects questions over 1,000 characters", async () => {
    const app = createApp({ openaiClient: null, logger: silentLogger });
    const response = await request(app)
      .post("/api/reading")
      .send({ question: "x".repeat(1_001) })
      .expect(400);

    assert.match(response.body.error, /1,000 characters/);
  });

  it("returns a clear service status when AI is not configured", async () => {
    const app = createApp({ openaiClient: null, logger: silentLogger });
    const response = await request(app)
      .post("/api/reading")
      .send({ question: "What should I notice?" })
      .expect(503);

    assert.match(response.body.error, /not configured/);
    assert.doesNotMatch(JSON.stringify(response.body), /sk-/);
  });

  it("builds a deterministic one-turn reading response", async () => {
    const mock = createMockOpenAI({
      content: [{ text: "  Notice the invitation to begin.  " }]
    });
    const app = createApp({
      openaiClient: mock.client,
      model: "test-model",
      random: () => 0,
      logger: silentLogger
    });

    const response = await request(app)
      .post("/api/reading")
      .send({ question: "  What should I notice?  ", excludedCards: ["The Fool"] })
      .expect(200);

    assert.equal(response.body.card, "The Magician");
    assert.equal(response.body.cardDetails.arcana, "Major Arcana");
    assert.match(response.body.cardImageUrl, /m01\.jpg$/);
    assert.equal(response.body.interpretation, "Notice the invitation to begin.");
    assert.equal(mock.calls.length, 1);
    assert.equal(mock.calls[0].model, "test-model");
    assert.equal(mock.calls[0].max_completion_tokens, 1_200);
    assert.equal(mock.calls[0].reasoning_effort, "medium");
    assert.equal("temperature" in mock.calls[0], false);
    assert.equal(mock.calls[0].messages.length, 2);
    assert.match(mock.calls[0].messages[1].content, /Question: What should I notice\?/);
    assert.match(mock.calls[0].messages[1].content, /Drawn card: The Magician/);
  });

  it("does not call the model after all cards are excluded", async () => {
    const mock = createMockOpenAI();
    const app = createApp({ openaiClient: mock.client, logger: silentLogger });

    const response = await request(app)
      .post("/api/reading")
      .send({ question: "What now?", excludedCards: tarotDeck })
      .expect(409);

    assert.match(response.body.error, /All 78 cards/);
    assert.equal(mock.calls.length, 0);
  });

  it("maps rate limits to a retryable, non-sensitive response", async () => {
    const upstream = Object.assign(new Error("internal provider detail"), { status: 429 });
    const mock = createMockOpenAI({ error: upstream });
    const app = createApp({ openaiClient: mock.client, logger: silentLogger });

    const response = await request(app)
      .post("/api/reading")
      .send({ question: "What now?" })
      .expect(429);

    assert.match(response.body.error, /busy/);
    assert.doesNotMatch(JSON.stringify(response.body), /internal provider detail/);
  });

  it("maps other provider errors to a non-sensitive gateway response", async () => {
    const upstream = Object.assign(new Error("secret upstream detail"), { status: 401 });
    const mock = createMockOpenAI({ error: upstream });
    const app = createApp({ openaiClient: mock.client, logger: silentLogger });

    const response = await request(app)
      .post("/api/reading")
      .send({ question: "What now?" })
      .expect(502);

    assert.match(response.body.error, /temporarily unavailable/);
    assert.doesNotMatch(JSON.stringify(response.body), /secret upstream detail/);
  });

  it("rejects malformed and oversized JSON bodies", async (t) => {
    const app = createApp({ openaiClient: null, logger: silentLogger });

    await t.test("malformed JSON", async () => {
      const response = await request(app)
        .post("/api/reading")
        .set("Content-Type", "application/json")
        .send('{"question":')
        .expect(400);
      assert.equal(response.body.error, "Request body must be valid JSON.");
    });

    await t.test("oversized JSON", async () => {
      const response = await request(app)
        .post("/api/reading")
        .send({ question: "x".repeat(20_000) })
        .expect(413);
      assert.equal(response.body.error, "Request body is too large.");
    });
  });

  it("keeps unknown API routes separate from the browser fallback", async () => {
    const app = createApp({ openaiClient: null, logger: silentLogger });

    const apiResponse = await request(app).get("/api/missing").expect(404);
    assert.equal(apiResponse.body.error, "API route not found.");

    const browserResponse = await request(app).get("/reading/anything").expect(200);
    assert.match(browserResponse.text, /Tarot AI Terminal/);
  });
});
