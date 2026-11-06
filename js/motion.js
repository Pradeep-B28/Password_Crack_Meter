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

export function initScrollReveal() {
  const elements = document.querySelectorAll(".reveal-on-scroll");
  if (!elements.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    elements.forEach((el) => el.classList.add("revealed"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );

  elements.forEach((el) => observer.observe(el));
}
