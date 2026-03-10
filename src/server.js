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
const model = process.env.OPENAI_MODEL || "gpt-5.4";
const openai = apiKey ? new OpenAI({ apiKey }) : null;
const riderWaiteBaseUrl = "https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards/";
const temperature = 1;

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

const suitElements = {
  Wands: "Fire",
  Cups: "Water",
  Swords: "Air",
  Pentacles: "Earth"
};

const suitPlanets = {
  Wands: "Mars",
  Cups: "Moon",
  Swords: "Mercury",
  Pentacles: "Venus"
};

const suitZodiacTriplicity = {
  Wands: "Aries/Leo/Sagittarius",
  Cups: "Cancer/Scorpio/Pisces",
  Swords: "Gemini/Libra/Aquarius",
  Pentacles: "Taurus/Virgo/Capricorn"
};

const majorArcanaAstrology = {
  "The Fool": { element: "Air", planet: "Uranus", zodiac: "Aquarius" },
  "The Magician": { element: "Air", planet: "Mercury", zodiac: "Gemini/Virgo" },
  "The High Priestess": { element: "Water", planet: "Moon", zodiac: "Cancer" },
  "The Empress": { element: "Earth", planet: "Venus", zodiac: "Taurus/Libra" },
  "The Emperor": { element: "Fire", planet: "Mars", zodiac: "Aries" },
  "The Hierophant": { element: "Earth", planet: "Venus", zodiac: "Taurus" },
  "The Lovers": { element: "Air", planet: "Mercury", zodiac: "Gemini" },
  "The Chariot": { element: "Water", planet: "Moon", zodiac: "Cancer" },
  Strength: { element: "Fire", planet: "Sun", zodiac: "Leo" },
  "The Hermit": { element: "Earth", planet: "Mercury", zodiac: "Virgo" },
  "Wheel of Fortune": { element: "Fire", planet: "Jupiter", zodiac: "Sagittarius" },
  Justice: { element: "Air", planet: "Venus", zodiac: "Libra" },
  "The Hanged Man": { element: "Water", planet: "Neptune", zodiac: "Pisces" },
  Death: { element: "Water", planet: "Pluto", zodiac: "Scorpio" },
  Temperance: { element: "Fire", planet: "Jupiter", zodiac: "Sagittarius" },
  "The Devil": { element: "Earth", planet: "Saturn", zodiac: "Capricorn" },
  "The Tower": { element: "Fire", planet: "Mars", zodiac: "Aries" },
  "The Star": { element: "Air", planet: "Uranus", zodiac: "Aquarius" },
  "The Moon": { element: "Water", planet: "Neptune", zodiac: "Pisces" },
  "The Sun": { element: "Fire", planet: "Sun", zodiac: "Leo" },
  Judgement: { element: "Fire", planet: "Pluto", zodiac: "Scorpio" },
  "The World": { element: "Earth", planet: "Saturn", zodiac: "Capricorn" }
};

const minorArcanaDecans = {
  Wands: {
    Two: { planet: "Mars", zodiac: "Aries" },
    Three: { planet: "Sun", zodiac: "Aries" },
    Four: { planet: "Venus", zodiac: "Aries" },
    Five: { planet: "Saturn", zodiac: "Leo" },
    Six: { planet: "Jupiter", zodiac: "Leo" },
    Seven: { planet: "Mars", zodiac: "Leo" },
    Eight: { planet: "Mercury", zodiac: "Sagittarius" },
    Nine: { planet: "Moon", zodiac: "Sagittarius" },
    Ten: { planet: "Saturn", zodiac: "Sagittarius" }
  },
  Cups: {
    Two: { planet: "Venus", zodiac: "Cancer" },
    Three: { planet: "Mercury", zodiac: "Cancer" },
    Four: { planet: "Moon", zodiac: "Cancer" },
    Five: { planet: "Mars", zodiac: "Scorpio" },
    Six: { planet: "Sun", zodiac: "Scorpio" },
    Seven: { planet: "Venus", zodiac: "Scorpio" },
    Eight: { planet: "Saturn", zodiac: "Pisces" },
    Nine: { planet: "Jupiter", zodiac: "Pisces" },
    Ten: { planet: "Mars", zodiac: "Pisces" }
  },
  Swords: {
    Two: { planet: "Moon", zodiac: "Libra" },
    Three: { planet: "Saturn", zodiac: "Libra" },
    Four: { planet: "Jupiter", zodiac: "Libra" },
    Five: { planet: "Venus", zodiac: "Aquarius" },
    Six: { planet: "Mercury", zodiac: "Aquarius" },
    Seven: { planet: "Moon", zodiac: "Aquarius" },
    Eight: { planet: "Jupiter", zodiac: "Gemini" },
    Nine: { planet: "Mars", zodiac: "Gemini" },
    Ten: { planet: "Sun", zodiac: "Gemini" }
  },
  Pentacles: {
    Two: { planet: "Jupiter", zodiac: "Capricorn" },
    Three: { planet: "Mars", zodiac: "Capricorn" },
    Four: { planet: "Sun", zodiac: "Capricorn" },
    Five: { planet: "Mercury", zodiac: "Taurus" },
    Six: { planet: "Moon", zodiac: "Taurus" },
    Seven: { planet: "Saturn", zodiac: "Taurus" },
    Eight: { planet: "Sun", zodiac: "Virgo" },
    Nine: { planet: "Venus", zodiac: "Virgo" },
    Ten: { planet: "Mercury", zodiac: "Virgo" }
  }
};

const courtRankPlanets = {
  Page: "Earth",
  Knight: "Mars",
  Queen: "Moon",
  King: "Mercury"
};

function getCardDetails(card) {
  const majorIndex = majorArcana.indexOf(card);
  if (majorIndex >= 0) {
    const majorMeta = majorArcanaAstrology[card] || {};
    return {
      arcana: "Major Arcana",
      number: majorIndex,
      element: majorMeta.element || "N/A",
      planet: majorMeta.planet || "N/A",
      zodiac: majorMeta.zodiac || "N/A",
      keywords: "N/A"
    };
  }

  const minorMatch = card.match(
    /^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Wands|Cups|Swords|Pentacles)$/
  );
  if (!minorMatch) {
    return {
      arcana: "Unknown",
      number: "N/A",
      element: "N/A",
      planet: "N/A",
      zodiac: "N/A",
      keywords: "N/A"
    };
  }

  const rank = minorMatch[1];
  const suit = minorMatch[2];
  const numericValue = rankNumber[rank] || "N/A";
  const decan = minorArcanaDecans[suit]?.[rank];

  return {
    arcana: "Minor Arcana",
    number: numericValue,
    rank,
    suit,
    element: suitElements[suit] || "N/A",
    planet: decan?.planet || courtRankPlanets[rank] || suitPlanets[suit] || "N/A",
    zodiac: decan?.zodiac || suitZodiacTriplicity[suit] || "N/A",
    keywords: "N/A"
  };
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
  const cardDetails = getCardDetails(card);
  const messages = [
    {
      role: "system",
      content:
        "You are a tarot reader. Interpret the drawn card naturally for the user's question. Keep it balanced in length, usually around 90 to 170 words."
    }
  ];

  messages.push({
    role: "user",
    content: [
      `Question: ${question}`,
      `Drawn card: ${card}`
    ].join("\n\n")
  });

  try {
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      reasoning_effort: "medium"
    });

    const interpretation = extractTextContent(completion.choices?.[0]?.message?.content);
    return res.json({
      card,
      cardImageUrl,
      cardDetails,
      interpretation: interpretation || "Please ask again and I will pull a clearer interpretation."
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
