const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const express = require("express");
const OpenAI = require("openai");
const tarotDeck = require("./tarotDeck");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const rawApiKey = (process.env.OPENAI_API_KEY || "").trim();
const apiKey = rawApiKey.startsWith("your_openai_api_key") ? "" : rawApiKey;
const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const riderWaiteBaseUrl = "https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/";

const majorArcana = [
  "The Fool",
  "The Magician",
  "The High Priestess",
  "The Empress",
  "The Emperor",
  "The Hierophant",
  "The Lovers",
  "The Chariot",
  "Strength",
  "The Hermit",
  "Wheel of Fortune",
  "Justice",
  "The Hanged Man",
  "Death",
  "Temperance",
  "The Devil",
  "The Tower",
  "The Star",
  "The Moon",
  "The Sun",
  "Judgement",
  "The World"
];

const suitPrefix = {
  Cups: "c",
  Wands: "w",
  Swords: "s",
  Pentacles: "p"
};

const rankNumber = {
  Ace: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
  Six: 6,
  Seven: 7,
  Eight: 8,
  Nine: 9,
  Ten: 10,
  Page: 11,
  Knight: 12,
  Queen: 13,
  King: 14
};

function drawRandomCard(excludedCards = []) {
  const excludedSet = new Set(excludedCards);
  const availableCards = tarotDeck.filter((card) => !excludedSet.has(card));
  if (!availableCards.length) {
    return null;
  }

  const index = Math.floor(Math.random() * availableCards.length);
  return availableCards[index];
}

function getTarotImageFilename(card) {
  const majorIndex = majorArcana.indexOf(card);
  if (majorIndex >= 0) {
    return `m${String(majorIndex).padStart(2, "0")}.jpg`;
  }

  const minorMatch = card.match(
    /^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Wands|Cups|Swords|Pentacles)$/
  );
  if (!minorMatch) {
    return null;
  }

  const rank = minorMatch[1];
  const suit = minorMatch[2];
  const prefix = suitPrefix[suit];
  const number = rankNumber[rank];
  if (!prefix || !number) {
    return null;
  }

  return `${prefix}${String(number).padStart(2, "0")}.jpg`;
}

function getTarotImageUrl(card) {
  const filename = getTarotImageFilename(card);
  return filename ? `${riderWaiteBaseUrl}${filename}` : null;
}

app.post("/api/reading", async (req, res) => {
  const question = (req.body?.question || "").trim();
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
  const excludedCards = Array.isArray(req.body?.excludedCards)
    ? [...new Set(req.body.excludedCards.map((card) => String(card).trim()))].filter((card) =>
        tarotDeck.includes(card)
      )
    : [];

  if (!question) {
    return res.status(400).json({ error: "Please enter a question first." });
  }

  if (!openai) {
    return res.status(500).json({
      error: "OpenAI key is missing or still set to placeholder text in .env."
    });
  }

  const card = drawRandomCard(excludedCards);
  if (!card) {
    return res.status(409).json({
      error: "All 78 cards have already been drawn in this chat. Refresh to start a new reading."
    });
  }

  const cardImageUrl = getTarotImageUrl(card);
  const messages = [
    {
      role: "system",
      content:
        "You are a concise tarot interpreter in an ongoing chat. Keep continuity with previous turns when relevant. Use the newly drawn tarot card for the current answer. Keep it under 180 words."
    }
  ];

  for (const turn of history) {
    const previousQuestion = (turn?.question || "").trim();
    const previousCard = (turn?.card || "").trim();
    const previousInterpretation = (turn?.interpretation || "").trim();

    if (previousQuestion) {
      messages.push({
        role: "user",
        content: `Previous user question: ${previousQuestion}`
      });
    }

    if (previousCard || previousInterpretation) {
      messages.push({
        role: "assistant",
        content: `Previous drawn card: ${previousCard || "Unknown"}\nPrevious interpretation: ${previousInterpretation || "None"}`
      });
    }
  }

  messages.push({
    role: "user",
    content: `Current user question: ${question}\nNewly drawn tarot card: ${card}\nRespond as the next turn in this same chat.`
  });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: 0.8
    });

    const interpretation = completion.choices?.[0]?.message?.content?.trim();
    return res.json({
      card,
      cardImageUrl,
      interpretation: interpretation || "No interpretation returned."
    });
  } catch (error) {
    console.error("OpenAI request failed:", error);
    const apiError = error?.error?.message || error?.message || "Unknown OpenAI error.";
    const statusCode = error?.status || 500;
    const safeMessage =
      statusCode === 401
        ? "OpenAI rejected the API key. Update OPENAI_API_KEY in .env with a valid key."
        : `OpenAI request failed: ${apiError}`;

    return res.status(500).json({
      error: safeMessage
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Tarot app running on http://localhost:${port}`);
  });
}

module.exports = app;
