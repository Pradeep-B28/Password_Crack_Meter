import { CONFIG } from "../config.js";
import { isIntroSeen, markIntroSeen } from "./store.js";

export function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initLoader() {
  const loader = document.getElementById("loader");
  const hero = document.getElementById("hero");
  if (!loader || !hero) return;

  if (prefersReducedMotion() || isIntroSeen()) {
    loader.classList.add("loader-done");
    hero.classList.add("hero-ready");
    return;
  }

  markIntroSeen();

  const maxMs = CONFIG.loaderMs || 800;
  window.setTimeout(() => {
    loader.classList.add("loader-done");
    hero.classList.add("hero-ready");
  }, maxMs);
}
