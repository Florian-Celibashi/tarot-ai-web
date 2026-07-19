const screen = document.getElementById("screen");
const captureInput = document.getElementById("capture-input");
const timeline = document.getElementById("timeline");
const typedText = document.getElementById("typed-text");
const statusText = document.getElementById("status");
let isLoading = false;
const drawnCards = new Set();

function syncTypedText() {
  typedText.textContent = captureInput.value;
  screen.classList.toggle("is-composing", Boolean(captureInput.value));
}

function formatCardDetails(details) {
  if (!details) {
    return "";
  }

  const parts = [
    details.arcana ? `Arcana: ${details.arcana}` : null,
    details.element ? `Element: ${details.element}` : null,
    details.courtElement ? `Court element: ${details.courtElement}` : null,
    details.planet ? `Planet: ${details.planet}` : null,
    details.zodiac ? `Zodiac: ${details.zodiac}` : null
  ].filter(Boolean);

  return parts.join(" | ");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBasicMarkdown(text) {
  const safe = escapeHtml(text);
  return safe.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
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
  screen.setAttribute("aria-busy", "true");
  statusText.textContent = "Drawing a card and interpreting it…";

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
        excludedCards: Array.from(drawnCards)
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    aiEntry.card.textContent = data.card;
    const detailLine = formatCardDetails(data.cardDetails);
    const fullText = detailLine ? `${detailLine}\n\n${data.interpretation}` : data.interpretation;
    aiEntry.text.innerHTML = renderBasicMarkdown(fullText);
    const cardImageUrl = data.cardImageUrl;
    if (cardImageUrl) {
      aiEntry.image.src = cardImageUrl;
      aiEntry.image.alt = `${data.card} tarot card`;
      aiEntry.image.style.visibility = "visible";
    } else {
      aiEntry.image.remove();
    }

    drawnCards.add(data.card);
  } catch (error) {
    aiEntry.card.textContent = "Error";
    aiEntry.text.textContent = error.message || "The reading could not be completed.";
    aiEntry.image.remove();
  } finally {
    isLoading = false;
    screen.removeAttribute("aria-busy");
    statusText.textContent = "";
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
