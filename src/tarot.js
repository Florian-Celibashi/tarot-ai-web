const tarotDeck = require("./tarotDeck");

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

const courtRankElements = {
  Page: "Earth",
  Knight: "Fire",
  Queen: "Water",
  King: "Air"
};

const minorArcanaPattern =
  /^(Ace|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Page|Knight|Queen|King) of (Wands|Cups|Swords|Pentacles)$/;

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

  const minorMatch = typeof card === "string" ? card.match(minorArcanaPattern) : null;
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
  const decan = minorArcanaDecans[suit]?.[rank];

  const details = {
    arcana: "Minor Arcana",
    number: rankNumber[rank],
    rank,
    suit,
    element: suitElements[suit],
    planet: decan?.planet || suitPlanets[suit],
    zodiac: decan?.zodiac || suitZodiacTriplicity[suit],
    keywords: "N/A"
  };

  if (courtRankElements[rank]) {
    details.courtElement = courtRankElements[rank];
  }

  return details;
}

function drawRandomCard(excludedCards = [], random = Math.random) {
  const excludedSet = new Set(excludedCards);
  const availableCards = tarotDeck.filter((card) => !excludedSet.has(card));
  if (!availableCards.length) {
    return null;
  }

  const value = Number(random());
  const boundedValue = Number.isFinite(value) ? Math.min(Math.max(value, 0), 0.9999999999999999) : 0;
  return availableCards[Math.floor(boundedValue * availableCards.length)];
}

function getTarotImageFilename(card) {
  const majorIndex = majorArcana.indexOf(card);
  if (majorIndex >= 0) {
    return `m${String(majorIndex).padStart(2, "0")}.jpg`;
  }

  const minorMatch = typeof card === "string" ? card.match(minorArcanaPattern) : null;
  if (!minorMatch) {
    return null;
  }

  const rank = minorMatch[1];
  const suit = minorMatch[2];
  return `${suitPrefix[suit]}${String(rankNumber[rank]).padStart(2, "0")}.jpg`;
}

function getTarotImageUrl(card) {
  const filename = getTarotImageFilename(card);
  return filename ? `${riderWaiteBaseUrl}${filename}` : null;
}

module.exports = {
  drawRandomCard,
  getCardDetails,
  getTarotImageFilename,
  getTarotImageUrl,
  majorArcana,
  riderWaiteBaseUrl
};
