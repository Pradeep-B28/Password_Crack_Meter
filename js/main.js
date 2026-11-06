import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { getStoredTheme, setStoredTheme } from "./store.js";
import { initLoader, initScrollReveal } from "./motion.js";
import { initMeterUI } from "./meter-ui.js";
import { initSuggestUI } from "./suggest-ui.js";
import { initSectionsUI } from "./sections-ui.js";

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

function init() {
  initLoader();
  setupTheme();
  setupLogoFallback();
  initMeterUI();
  initSuggestUI();
  initSectionsUI();
  initScrollReveal();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
