const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const tarotDeck = require("../tarotDeck");
const {
  drawRandomCard,
  getCardDetails,
  getTarotImageFilename,
  getTarotImageUrl,
  riderWaiteBaseUrl
} = require("../tarot");

describe("tarot domain", () => {
  it("contains one canonical copy of all 78 cards", () => {
    assert.equal(tarotDeck.length, 78);
    assert.equal(new Set(tarotDeck).size, 78);
    assert.equal(tarotDeck[0], "The Fool");
    assert.equal(tarotDeck.at(-1), "King of Pentacles");
  });

  it("returns structured Major Arcana metadata", () => {
    assert.deepEqual(getCardDetails("The Fool"), {
      arcana: "Major Arcana",
      number: 0,
      element: "Air",
      planet: "Uranus",
      zodiac: "Aquarius",
      keywords: "N/A"
    });
  });

  it("returns decan metadata for numbered Minor Arcana", () => {
    assert.deepEqual(getCardDetails("Two of Wands"), {
      arcana: "Minor Arcana",
      number: 2,
      rank: "Two",
      suit: "Wands",
      element: "Fire",
      planet: "Mars",
      zodiac: "Aries",
      keywords: "N/A"
    });
  });

  it("falls back to court-rank and suit metadata", () => {
    assert.deepEqual(getCardDetails("Queen of Cups"), {
      arcana: "Minor Arcana",
      number: 13,
      rank: "Queen",
      suit: "Cups",
      element: "Water",
      planet: "Moon",
      zodiac: "Cancer/Scorpio/Pisces",
      keywords: "N/A",
      courtElement: "Water"
    });
  });

  it("keeps a Page's court element separate from its planetary correspondence", () => {
    assert.deepEqual(getCardDetails("Page of Wands"), {
      arcana: "Minor Arcana",
      number: 11,
      rank: "Page",
      suit: "Wands",
      element: "Fire",
      planet: "Mars",
      zodiac: "Aries/Leo/Sagittarius",
      keywords: "N/A",
      courtElement: "Earth"
    });
  });

  it("returns an explicit unknown shape for invalid cards", () => {
    assert.deepEqual(getCardDetails("Not a card"), {
      arcana: "Unknown",
      number: "N/A",
      element: "N/A",
      planet: "N/A",
      zodiac: "N/A",
      keywords: "N/A"
    });
  });

  it("maps Major and Minor Arcana to Rider-Waite filenames", () => {
    assert.equal(getTarotImageFilename("The Fool"), "m00.jpg");
    assert.equal(getTarotImageFilename("The World"), "m21.jpg");
    assert.equal(getTarotImageFilename("Ace of Cups"), "c01.jpg");
    assert.equal(getTarotImageFilename("King of Pentacles"), "p14.jpg");
    assert.equal(getTarotImageFilename("Not a card"), null);
    assert.equal(getTarotImageUrl("Ace of Cups"), `${riderWaiteBaseUrl}c01.jpg`);
  });

  it("draws deterministically from only the available cards", () => {
    assert.equal(drawRandomCard([], () => 0), "The Fool");
    assert.equal(drawRandomCard([], () => 1), "King of Pentacles");
    assert.equal(drawRandomCard(["The Fool", "The Magician"], () => 0), "The High Priestess");
  });

  it("returns null when the deck is exhausted", () => {
    assert.equal(drawRandomCard(tarotDeck, () => 0.5), null);
  });

  it("handles a non-finite injected random value predictably", () => {
    assert.equal(drawRandomCard([], () => Number.NaN), "The Fool");
  });
});
