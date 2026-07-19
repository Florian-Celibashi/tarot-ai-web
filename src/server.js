const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const OpenAI = require("openai");

const tarotDeck = require("./tarotDeck");
const {
  drawRandomCard,
  getCardDetails,
  getTarotImageUrl
} = require("./tarot");

const port = process.env.PORT || 3000;
const defaultModel = process.env.OPENAI_MODEL || "gpt-5.4";
const maxQuestionLength = 1_000;
const maxCompletionTokens = 1_200;

function getConfiguredOpenAIClient() {
  const rawApiKey = (process.env.OPENAI_API_KEY || "").trim();
  const apiKey = rawApiKey.startsWith("your_openai_api_key") ? "" : rawApiKey;
  return apiKey ? new OpenAI({ apiKey }) : null;
}

function extractTextContent(content) {
  if (typeof content === "string") {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return "";
  }

  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }

      if (typeof part?.text === "string") {
        return part.text;
      }

      if (typeof part?.content === "string") {
        return part.content;
      }

      return "";
    })
    .join("")
    .trim();
}

function normalizeExcludedCards(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map((card) => String(card).trim()))]
    .filter((card) => tarotDeck.includes(card))
    .slice(0, tarotDeck.length);
}

function setSecurityHeaders(_req, res, next) {
  res.set({
    "Content-Security-Policy": [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://raw.githubusercontent.com",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'"
    ].join("; "),
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff"
  });
  next();
}

function createApp({
  openaiClient = getConfiguredOpenAIClient(),
  model = defaultModel,
  random = Math.random,
  logger = console
} = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(setSecurityHeaders);
  app.use(express.json({ limit: "16kb", strict: true }));
  app.use(express.static(path.join(__dirname, "public")));

  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      aiConfigured: Boolean(openaiClient)
    });
  });

  app.post("/api/reading", async (req, res) => {
    const question = typeof req.body?.question === "string" ? req.body.question.trim() : "";
    const excludedCards = normalizeExcludedCards(req.body?.excludedCards);

    if (!question) {
      return res.status(400).json({ error: "Please enter a question first." });
    }

    if (question.length > maxQuestionLength) {
      return res.status(400).json({
        error: `Keep the question under ${maxQuestionLength.toLocaleString("en-US")} characters.`
      });
    }

    if (!openaiClient) {
      return res.status(503).json({
        error: "The reading service is not configured. Add OPENAI_API_KEY on the server."
      });
    }

    const card = drawRandomCard(excludedCards, random);
    if (!card) {
      return res.status(409).json({
        error: "All 78 cards have already been drawn in this session. Refresh to start a new reading."
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are a tarot reader. Interpret the drawn card naturally for the user's question. " +
          "Keep it grounded and balanced in length, usually around 90 to 170 words. " +
          "Present tarot as a reflection tool, not medical, legal, financial, or mental-health advice."
      },
      {
        role: "user",
        content: [`Question: ${question}`, `Drawn card: ${card}`].join("\n\n")
      }
    ];

    try {
      const completion = await openaiClient.chat.completions.create({
        model,
        messages,
        max_completion_tokens: maxCompletionTokens,
        reasoning_effort: "medium"
      });

      const interpretation = extractTextContent(completion.choices?.[0]?.message?.content);
      return res.json({
        card,
        cardImageUrl: getTarotImageUrl(card),
        cardDetails: getCardDetails(card),
        interpretation: interpretation || "Please ask again and I will pull a clearer interpretation."
      });
    } catch (error) {
      const statusCode = Number(error?.status) || 500;
      logger.error("OpenAI request failed", {
        name: error?.name || "Error",
        status: statusCode
      });

      const safeMessage =
        statusCode === 429
          ? "The reading service is busy. Please try again shortly."
          : "The reading service is temporarily unavailable. Please try again later.";

      return res.status(statusCode === 429 ? 429 : 502).json({ error: safeMessage });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  app.use((error, _req, res, _next) => {
    if (error?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body is too large." });
    }

    if (error instanceof SyntaxError && error?.status === 400) {
      return res.status(400).json({ error: "Request body must be valid JSON." });
    }

    logger.error("Unhandled request error", { name: error?.name || "Error" });
    return res.status(500).json({ error: "Unexpected server error." });
  });

  return app;
}

const app = createApp();

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Tarot app running on http://localhost:${port}`);
  });
}

module.exports = app;
module.exports.createApp = createApp;
module.exports.extractTextContent = extractTextContent;
module.exports.normalizeExcludedCards = normalizeExcludedCards;
