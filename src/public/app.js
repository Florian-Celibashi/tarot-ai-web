const screen = document.getElementById("screen");
const captureInput = document.getElementById("capture-input");
const timeline = document.getElementById("timeline");
const typedText = document.getElementById("typed-text");
const statusText = document.getElementById("status");
let isLoading = false;
const conversationHistory = [];
const drawnCards = new Set();
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

function syncTypedText() {
  typedText.textContent = captureInput.value;
}

function getCardImageUrl(cardName) {
  if (!cardName) {
    return null;
  }

  const majorIndex = majorArcana.indexOf(cardName);
  if (majorIndex >= 0) {
    return `${riderWaiteBaseUrl}m${String(majorIndex).padStart(2, "0")}.jpg`;
  }

  const minorMatch = cardName.match(
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

  return `${riderWaiteBaseUrl}${prefix}${String(number).padStart(2, "0")}.jpg`;
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

function addUserEntry(question) {
  const userEntry = document.createElement("div");
  userEntry.className = "entry user-entry reveal";
  userEntry.textContent = question;
  timeline.appendChild(userEntry);
}

function addAiEntryPlaceholder() {
  const aiEntry = document.createElement("div");
  aiEntry.className = "entry ai-entry reveal";

  const copy = document.createElement("div");
  copy.className = "ai-copy";

  const card = document.createElement("div");
  card.className = "ai-card";
  card.textContent = "Drawing card...";

  const text = document.createElement("p");
  text.className = "ai-text";

  copy.append(card, text);

  const visual = document.createElement("aside");
  visual.className = "ai-visual";

  const image = document.createElement("img");
  image.className = "ai-card-image";
  image.alt = "Tarot card image";
  image.loading = "lazy";
  image.referrerPolicy = "no-referrer";
  image.style.visibility = "hidden";
  visual.append(image);

  aiEntry.append(copy, visual);
  timeline.appendChild(aiEntry);
  return { card, text, image };
}

async function submitQuestion() {
  const question = captureInput.value.trim();
  if (!question || isLoading) {
    return;
  }

  isLoading = true;
  statusText.textContent = "";

  addUserEntry(question);
  const aiEntry = addAiEntryPlaceholder();
  captureInput.value = "";
  syncTypedText();
  scrollToBottom();

  try {
    const response = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        history: conversationHistory.slice(-8),
        excludedCards: Array.from(drawnCards)
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    aiEntry.card.textContent = data.card;
    aiEntry.text.textContent = data.interpretation;
    const cardImageUrl = data.cardImageUrl || getCardImageUrl(data.card);
    if (cardImageUrl) {
      aiEntry.image.src = cardImageUrl;
      aiEntry.image.alt = `${data.card} tarot card`;
      aiEntry.image.style.visibility = "visible";
    } else {
      aiEntry.image.remove();
    }

    conversationHistory.push({
      question,
      card: data.card,
      interpretation: data.interpretation
    });
    drawnCards.add(data.card);
  } catch (error) {
    aiEntry.card.textContent = "Error";
    aiEntry.text.textContent = error.message;
    aiEntry.image.remove();
  } finally {
    isLoading = false;
    scrollToBottom();
    captureInput.focus();
  }
}

captureInput.addEventListener("input", syncTypedText);

captureInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    submitQuestion();
  }
});

document.addEventListener("click", () => {
  captureInput.focus();
});

window.addEventListener("load", () => {
  captureInput.focus();
  syncTypedText();
});

screen.addEventListener("touchstart", () => {
  captureInput.focus();
});
