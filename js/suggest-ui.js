import { suggest } from "./engine/meter.js";
import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { prefersReducedMotion } from "./motion.js";

const SCRAMBLE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?";
let currentSuggestedPassword = "";
let copyTimeout = null;
let scrambleRaf = null;

export function initSuggestUI() {
  const generateBtn = document.getElementById("generate-btn");
  const copyBtn = document.getElementById("copy-suggest-btn");
  const passDisplay = document.getElementById("suggest-password-display");
  const timeDisplay = document.getElementById("suggest-time-display");
  const noteDisplay = document.getElementById("suggest-note-display");
  const resultContainer = document.getElementById("suggest-result-wrap");

  if (!generateBtn || !passDisplay || !resultContainer) return;

  if (noteDisplay) {
    noteDisplay.textContent = COPY.suggest.note;
  }

  generateBtn.addEventListener("click", () => {
    generatePassword();
  });

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      copyPassword();
    });
  }
}

function generatePassword() {
  const generateBtn = document.getElementById("generate-btn");
  const passDisplay = document.getElementById("suggest-password-display");
  const timeDisplay = document.getElementById("suggest-time-display");
  const resultContainer = document.getElementById("suggest-result-wrap");
  const copyBtn = document.getElementById("copy-suggest-btn");

  if (!passDisplay || !resultContainer) return;

  const len = CONFIG.suggestLength || 16;
  const { password, result } = suggest(len);
  currentSuggestedPassword = password;

  // Reveal result block
  resultContainer.classList.remove("hidden");

  // Update generate button label
  if (generateBtn) {
    generateBtn.textContent = COPY.suggest.again;
  }

  // Reset copy button state if active
  if (copyBtn) {
    resetCopyButton(copyBtn);
  }

  if (prefersReducedMotion()) {
    passDisplay.textContent = password;
    if (timeDisplay) {
      timeDisplay.textContent = t("suggest.time", { time: result.label });
    }
    return;
  }

  // 400 ms scramble animation settling left to right
  if (scrambleRaf) cancelAnimationFrame(scrambleRaf);

  const duration = 400;
  const startTime = performance.now();
  const totalChars = password.length;

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      passDisplay.textContent = password;
      if (timeDisplay) {
        timeDisplay.textContent = t("suggest.time", { time: result.label });
      }
      scrambleRaf = null;
      return;
    }

    // Number of characters settled so far
    const settledCount = Math.floor(progress * totalChars);
    let display = "";

    // Settled characters come from the generated password
    for (let i = 0; i < settledCount; i++) {
      display += password[i];
    }

    // Unsettled characters are random noise, NOT using the engine password
    for (let i = settledCount; i < totalChars; i++) {
      const rndIdx = Math.floor(Math.random() * SCRAMBLE_CHARS.length);
      display += SCRAMBLE_CHARS[rndIdx];
    }

    passDisplay.textContent = display;
    scrambleRaf = requestAnimationFrame(frame);
  }

  scrambleRaf = requestAnimationFrame(frame);
}

function copyPassword() {
  if (!currentSuggestedPassword) return;

  const copyBtn = document.getElementById("copy-suggest-btn");
  if (!copyBtn) return;

  const textToCopy = currentSuggestedPassword;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      onCopiedSuccess(copyBtn);
    }).catch(() => {
      fallbackCopy(textToCopy, copyBtn);
    });
  } else {
    fallbackCopy(textToCopy, copyBtn);
  }
}

function fallbackCopy(text, btn) {
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    onCopiedSuccess(btn);
  } catch {}
}

function onCopiedSuccess(btn) {
  const labelEl = btn.querySelector(".copy-btn-label");
  const copyIcon = btn.querySelector(".copy-icon-clipboard");
  const tickIcon = btn.querySelector(".copy-icon-check");

  if (labelEl) labelEl.textContent = COPY.suggest.copied;
  if (copyIcon) copyIcon.classList.add("hidden");
  if (tickIcon) tickIcon.classList.remove("hidden");
  btn.classList.add("btn-copied");

  if (copyTimeout) clearTimeout(copyTimeout);
  copyTimeout = setTimeout(() => {
    resetCopyButton(btn);
  }, 1500);
}

function resetCopyButton(btn) {
  if (copyTimeout) {
    clearTimeout(copyTimeout);
    copyTimeout = null;
  }
  const labelEl = btn.querySelector(".copy-btn-label");
  const copyIcon = btn.querySelector(".copy-icon-clipboard");
  const tickIcon = btn.querySelector(".copy-icon-check");

  if (labelEl) labelEl.textContent = COPY.suggest.copy;
  if (copyIcon) copyIcon.classList.remove("hidden");
  if (tickIcon) tickIcon.classList.add("hidden");
  btn.classList.remove("btn-copied");
}
