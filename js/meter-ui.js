import { analyze, ATTACKERS, DEFAULT_SPEED } from "./engine/meter.js";
import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { prefersReducedMotion } from "./motion.js";

let selectedAttackerId = "fast";
let prevLevel = null;
let prevReasonSignature = "";
let prevTokenSignature = "";
let ariaTimer = null;
let sampleTypingTimer = null;

function getAttackerSpeed(id) {
  const found = ATTACKERS.find((a) => a.id === id);
  return found ? found.guessesPerSecond : DEFAULT_SPEED;
}

export function initMeterUI() {
  const input = document.getElementById("password");
  const toggleBtn = document.getElementById("toggle-password");
  const clearBtn = document.getElementById("clear-password");
  const wrapper = document.getElementById("input-wrapper");
  const emptyState = document.getElementById("result-empty");
  const activeContent = document.getElementById("result-active");
  const resultCard = document.getElementById("result-card");

  if (!input || !emptyState || !activeContent) return;

  setupAttackerPicker();
  setupSampleChipsTyping();

  let rafId = null;
  input.addEventListener("input", () => {
    if (clearBtn) {
      if (input.value.length > 0) {
        clearBtn.classList.remove("hidden");
      } else {
        clearBtn.classList.add("hidden");
      }
    }
    if (sampleTypingTimer && !input.dataset.typingSample) {
      clearInterval(sampleTypingTimer);
      sampleTypingTimer = null;
    }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      runAnalysis();
    });
  });

  // Clear button click triggers re-analysis to empty state
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (sampleTypingTimer) {
        clearInterval(sampleTypingTimer);
        sampleTypingTimer = null;
      }
      input.value = "";
      clearBtn.classList.add("hidden");
      input.focus();
      runAnalysis();
    });
  }

  // Toggle eye visibility
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggleBtn.classList.toggle("eye-slashed", !isPassword);
      const label = isPassword ? COPY.input.hide : COPY.input.show;
      toggleBtn.setAttribute("aria-label", label);
      toggleBtn.setAttribute("title", label);
      updateTokenDisplay();
    });
  }

  // Focus styling for mobile
  input.addEventListener("focus", () => {
    document.body.classList.add("input-focused");
  });

  input.addEventListener("blur", () => {
    document.body.classList.remove("input-focused");
  });

  // Strict Rule 4: Clear the input on pagehide
  window.addEventListener("pagehide", () => {
    input.value = "";
    runAnalysis();
  });

  // Initial check (in case browser restored value)
  runAnalysis();
}

function runAnalysis() {
  const input = document.getElementById("password");
  const emptyState = document.getElementById("result-empty");
  const activeContent = document.getElementById("result-active");
  const resultCard = document.getElementById("result-card");
  const wrapper = document.getElementById("input-wrapper");

  if (!input || !emptyState || !activeContent) return;

  const pw = input.value;

  if (pw.length === 0) {
    emptyState.classList.remove("hidden");
    activeContent.classList.add("hidden");
    if (resultCard) {
      resultCard.classList.add("empty");
      resultCard.classList.remove("card-nudge");
    }
    if (wrapper) {
      wrapper.className = "input-wrapper";
    }
    prevLevel = null;
    prevReasonSignature = "";
    prevTokenSignature = "";
    clearAriaLive();
    return;
  }

  emptyState.classList.add("hidden");
  activeContent.classList.remove("hidden");
  if (resultCard) resultCard.classList.remove("empty");

  const speed = getAttackerSpeed(selectedAttackerId);
  const result = analyze(pw, speed);

  // Update input glow color
  if (wrapper) {
    wrapper.className = `input-wrapper lv-${result.level}`;
  }

  // Check card nudge when dropping to level 0 (Very weak)
  if (resultCard && !prefersReducedMotion()) {
    if (prevLevel !== null && prevLevel > 0 && result.level === 0) {
      resultCard.classList.remove("card-nudge");
      void resultCard.offsetWidth; // force reflow
      resultCard.classList.add("card-nudge");
    }
  }
  prevLevel = result.level;

  renderResult(result);
  scheduleAriaLive(result);
}

function renderResult(result) {
  renderHeadline(result.headline);
  renderLock(result.level);
  renderMeter(result.level, result.levelName);
  renderReasons(result.reasons);
  renderTokens(result.tokens);
  updateAttackerNote();
}

function renderHeadline(headlineText) {
  const headlineEl = document.getElementById("result-headline");
  if (!headlineEl) return;

  if (headlineEl.textContent !== headlineText) {
    headlineEl.textContent = headlineText;
    if (!prefersReducedMotion()) {
      headlineEl.classList.remove("headline-swap");
      void headlineEl.offsetWidth;
      headlineEl.classList.add("headline-swap");
    }
  }
}

function renderLock(level) {
  const shackle = document.getElementById("lock-shackle");
  const body = document.getElementById("lock-body");
  const crack = document.getElementById("lock-crack");
  const lockSvg = document.getElementById("result-lock-svg");

  if (!shackle || !body || !crack || !lockSvg) return;

  lockSvg.setAttribute("data-level", String(level));

  if (level >= 3 && !prefersReducedMotion()) {
    lockSvg.classList.remove("lock-pulse");
    void lockSvg.offsetWidth;
    lockSvg.classList.add("lock-pulse");
  } else {
    lockSvg.classList.remove("lock-pulse");
  }
}

function renderMeter(level, levelName) {
  const bars = document.querySelectorAll(".meter-bar");
  const nameEl = document.getElementById("meter-level-name");

  bars.forEach((bar, index) => {
    if (index <= level) {
      bar.classList.add("active");
      bar.setAttribute("data-active-level", String(level));
    } else {
      bar.classList.remove("active");
      bar.removeAttribute("data-active-level");
    }
  });

  if (nameEl) {
    nameEl.textContent = levelName;
    nameEl.setAttribute("data-level", String(level));
  }
}

function setupAttackerPicker() {
  const container = document.getElementById("attacker-pills");
  const section = document.getElementById("attacker-picker-section");
  if (!container || !section) return;

  if (CONFIG.features && CONFIG.features.attackerPicker === false) {
    section.classList.add("hidden");
    return;
  }

  container.textContent = "";

  const attackerLabels = {
    fast: "Fast hash",
    slow: "Slow hash",
    online: "Website limits"
  };

  for (const attacker of ATTACKERS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "attacker-pill" + (attacker.id === selectedAttackerId ? " active" : "");
    btn.textContent = attackerLabels[attacker.id] || attacker.label;
    btn.setAttribute("data-id", attacker.id);
    btn.setAttribute("title", attacker.label);

    btn.addEventListener("click", () => {
      if (selectedAttackerId === attacker.id) return;
      selectedAttackerId = attacker.id;

      container.querySelectorAll(".attacker-pill").forEach((p) => {
        p.classList.toggle("active", p.getAttribute("data-id") === selectedAttackerId);
      });

      updateAttackerNote();

      // Recalculate time with new attacker speed
      const input = document.getElementById("password");
      if (input && input.value.length > 0) {
        const speed = getAttackerSpeed(selectedAttackerId);
        const result = analyze(input.value, speed);
        renderHeadline(result.headline);
        scheduleAriaLive(result);
      }
    });

    container.appendChild(btn);
  }

  updateAttackerNote();
}

function updateAttackerNote() {
  const noteEl = document.getElementById("attacker-note");
  if (!noteEl) return;
  const noteText = COPY.attackers[selectedAttackerId] || "";
  noteEl.textContent = noteText;
}

function renderReasons(reasons) {
  const container = document.getElementById("reasons-list");
  if (!container) return;

  const currentSig = reasons.map((r) => r.id + ":" + r.tone).join("|");
  const setChanged = currentSig !== prevReasonSignature;
  prevReasonSignature = currentSig;

  if (!setChanged) {
    return;
  }

  container.textContent = "";

  reasons.forEach((reason, index) => {
    const card = document.createElement("div");
    card.className = "reason-card" + (reason.tone === "bad" ? " reason-bad" : " reason-good");
    if (!prefersReducedMotion()) {
      card.classList.add("reason-stagger");
      card.style.animationDelay = `${index * 40}ms`;
    }

    const iconWrap = document.createElement("div");
    iconWrap.className = "reason-icon-wrap";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 20 20");
    svg.setAttribute("width", "16");
    svg.setAttribute("height", "16");
    svg.setAttribute("fill", "none");

    if (reason.tone === "bad") {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "10");
      circle.setAttribute("cy", "10");
      circle.setAttribute("r", "8");
      circle.setAttribute("stroke", "currentColor");
      circle.setAttribute("stroke-width", "2");

      const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", "M10 6v5M10 13.5v.5");
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-width", "2");
      line.setAttribute("stroke-linecap", "round");

      svg.appendChild(circle);
      svg.appendChild(line);
    } else {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "10");
      circle.setAttribute("cy", "10");
      circle.setAttribute("r", "8");
      circle.setAttribute("stroke", "currentColor");
      circle.setAttribute("stroke-width", "2");

      const check = document.createElementNS("http://www.w3.org/2000/svg", "path");
      check.setAttribute("d", "M6.5 10l2.5 2.5 4.5-4.5");
      check.setAttribute("stroke", "currentColor");
      check.setAttribute("stroke-width", "2");
      check.setAttribute("stroke-linecap", "round");
      check.setAttribute("stroke-linejoin", "round");

      svg.appendChild(circle);
      svg.appendChild(check);
    }

    iconWrap.appendChild(svg);

    const textWrap = document.createElement("div");
    textWrap.className = "reason-text-wrap";

    const titleEl = document.createElement("span");
    titleEl.className = "reason-title";
    titleEl.textContent = reason.title;

    const detailEl = document.createElement("p");
    detailEl.className = "reason-detail";
    detailEl.textContent = reason.detail;

    textWrap.appendChild(titleEl);
    textWrap.appendChild(detailEl);

    card.appendChild(iconWrap);
    card.appendChild(textWrap);

    container.appendChild(card);
  });
}

function renderTokens(tokens) {
  const container = document.getElementById("tokens-list");
  const section = document.getElementById("tokens-section");
  if (!container || !section) return;

  if (CONFIG.features && CONFIG.features.tokenStrip === false) {
    section.classList.add("hidden");
    return;
  }

  const input = document.getElementById("password");
  const isHidden = input ? input.type === "password" : true;

  const currentSig = tokens.map((t) => t.type + ":" + t.len).join("|") + ":" + (isHidden ? "dots" : "text");
  const setChanged = currentSig !== prevTokenSignature;
  prevTokenSignature = currentSig;

  if (!setChanged) {
    return;
  }

  container.textContent = "";

  tokens.forEach((token, index) => {
    const piece = document.createElement("div");
    piece.className = `token-piece token-${token.type}`;
    if (!prefersReducedMotion()) {
      piece.classList.add("token-stagger");
      piece.style.animationDelay = `${index * 40}ms`;
    }

    const label = document.createElement("span");
    label.className = "token-label";
    label.textContent = COPY.tokens[token.type] || token.type;

    const value = document.createElement("span");
    value.className = "token-value";
    // Crucial privacy rule: while input is hidden, show dots and NEVER text
    value.textContent = isHidden ? "•".repeat(token.len) : token.text;

    piece.appendChild(label);
    piece.appendChild(value);
    container.appendChild(piece);
  });
}

function updateTokenDisplay() {
  const input = document.getElementById("password");
  if (!input || input.value.length === 0) return;
  const speed = getAttackerSpeed(selectedAttackerId);
  const result = analyze(input.value, speed);
  renderTokens(result.tokens);
}

function setupSampleChipsTyping() {
  const container = document.getElementById("sample-chips");
  const input = document.getElementById("password");
  const clearBtn = document.getElementById("clear-password");
  const toggleBtn = document.getElementById("toggle-password");
  if (!container || !input || !CONFIG.samples) return;

  container.textContent = "";

  for (const sample of CONFIG.samples) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = sample;

    btn.addEventListener("click", () => {
      if (sampleTypingTimer) {
        clearInterval(sampleTypingTimer);
        sampleTypingTimer = null;
      }

      // Reveal the input as required by the brief
      input.type = "text";
      if (toggleBtn) {
        toggleBtn.classList.add("eye-slashed");
        toggleBtn.setAttribute("aria-label", COPY.input.hide);
        toggleBtn.setAttribute("title", COPY.input.hide);
      }

      input.value = "";
      input.dataset.typingSample = "true";
      if (clearBtn) clearBtn.classList.remove("hidden");

      let charIndex = 0;
      const speedMs = CONFIG.typeSampleMs || 55;

      sampleTypingTimer = setInterval(() => {
        if (charIndex < sample.length) {
          input.value += sample[charIndex];
          charIndex++;
          runAnalysis();
        } else {
          clearInterval(sampleTypingTimer);
          sampleTypingTimer = null;
          delete input.dataset.typingSample;
        }
      }, speedMs);
    });

    container.appendChild(btn);
  }
}

function scheduleAriaLive(result) {
  clearAriaLive();
  const liveEl = document.getElementById("sr-live");
  if (!liveEl) return;

  // Strict Rule 4: Announce ONLY the time and level. Never the password!
  ariaTimer = window.setTimeout(() => {
    liveEl.textContent = `${result.headline} ${result.levelName}.`;
  }, 500);
}

function clearAriaLive() {
  if (ariaTimer) {
    clearTimeout(ariaTimer);
    ariaTimer = null;
  }
  const liveEl = document.getElementById("sr-live");
  if (liveEl) liveEl.textContent = "";
}
