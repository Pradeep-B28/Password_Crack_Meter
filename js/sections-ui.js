import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { LIST_SIZE } from "./engine/meter.js";
import { getProgramUrl, getWhatsAppUrl } from "./links.js";

export function initSectionsUI() {
  setupDSASection();
  setupCTASection();
}

function setupDSASection() {
  const dsaSection = document.getElementById("dsa-section");
  if (!dsaSection) return;

  if (CONFIG.features && CONFIG.features.underTheHood === false) {
    dsaSection.classList.add("hidden");
    return;
  }

  const hashTextEl = document.getElementById("dsa-hash-text");
  if (hashTextEl) {
    hashTextEl.textContent = t("hood.hash", {
      size: LIST_SIZE.toLocaleString("en-IN")
    });
  }

  const patternTextEl = document.getElementById("dsa-pattern-text");
  if (patternTextEl) {
    patternTextEl.textContent = COPY.hood.pattern;
  }

  const mathTextEl = document.getElementById("dsa-math-text");
  if (mathTextEl) {
    mathTextEl.textContent = COPY.hood.math;
  }
}

export function updateDSALive(result) {
  const liveEl = document.getElementById("dsa-hash-live");
  if (!liveEl) return;

  if (!result || result.empty) {
    liveEl.textContent = "";
    liveEl.classList.add("hidden");
    return;
  }

  liveEl.textContent = t("hood.hashLive", {
    lookups: result.lookups.toLocaleString("en-IN"),
    comparisons: result.listComparisons.toLocaleString("en-IN")
  });
  liveEl.classList.remove("hidden");
}

function setupCTASection() {
  const exploreBtn = document.getElementById("cta-explore-btn");
  const whatsAppBtn = document.getElementById("cta-whatsapp-btn");
  const bodyEl = document.getElementById("cta-body-text");

  if (bodyEl) {
    bodyEl.textContent = t("cta.body", {
      program: CONFIG.program.name
    });
  }

  if (exploreBtn) {
    exploreBtn.href = getProgramUrl();
    exploreBtn.setAttribute("target", "_blank");
    exploreBtn.setAttribute("rel", "noopener noreferrer");
  }

  if (whatsAppBtn) {
    const waUrl = getWhatsAppUrl();
    if (waUrl && CONFIG.salesWhatsApp) {
      whatsAppBtn.href = waUrl;
      whatsAppBtn.setAttribute("target", "_blank");
      whatsAppBtn.setAttribute("rel", "noopener noreferrer");
      whatsAppBtn.classList.remove("hidden");
    } else {
      whatsAppBtn.classList.add("hidden");
    }
  }
}
