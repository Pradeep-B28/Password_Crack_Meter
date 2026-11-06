import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { getStoredTheme, setStoredTheme } from "./store.js";
import { initLoader } from "./motion.js";

function setupTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  if (CONFIG.features && CONFIG.features.darkTheme === false) {
    toggleBtn.classList.add("hidden");
    return;
  }

  toggleBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.contains("dark");
    if (isDark) {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      setStoredTheme("light");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      setStoredTheme("dark");
    }
  });
}

function setupLogoFallback() {
  const img = document.getElementById("header-logo");
  const fallback = document.getElementById("brand-fallback");
  if (img && fallback) {
    img.addEventListener("error", () => {
      img.classList.add("hidden");
      fallback.classList.remove("brand-name-fallback");
    });
  }
}

function setupInputControls() {
  const input = document.getElementById("password");
  const toggleBtn = document.getElementById("toggle-password");
  const clearBtn = document.getElementById("clear-password");
  if (!input || !toggleBtn || !clearBtn) return;

  toggleBtn.addEventListener("click", () => {
    const isPassword = input.type === "password";
    input.type = isPassword ? "text" : "password";
    toggleBtn.classList.toggle("eye-slashed", !isPassword);
    const label = isPassword ? COPY.input.hide : COPY.input.show;
    toggleBtn.setAttribute("aria-label", label);
    toggleBtn.setAttribute("title", label);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.add("hidden");
    input.focus();
  });

  input.addEventListener("input", () => {
    if (input.value.length > 0) {
      clearBtn.classList.remove("hidden");
    } else {
      clearBtn.classList.add("hidden");
    }
  });

  input.addEventListener("focus", () => {
    document.body.classList.add("input-focused");
  });

  input.addEventListener("blur", () => {
    document.body.classList.remove("input-focused");
  });

  window.addEventListener("pagehide", () => {
    input.value = "";
  });
}

function renderSampleChips() {
  const container = document.getElementById("sample-chips");
  const input = document.getElementById("password");
  const clearBtn = document.getElementById("clear-password");
  if (!container || !CONFIG.samples) return;

  container.textContent = "";

  for (const sample of CONFIG.samples) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = sample;
    btn.addEventListener("click", () => {
      if (input) {
        input.value = sample;
        if (clearBtn) clearBtn.classList.remove("hidden");
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    container.appendChild(btn);
  }
}

function init() {
  initLoader();
  setupTheme();
  setupLogoFallback();
  setupInputControls();
  renderSampleChips();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
