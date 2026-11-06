import { CONFIG } from "../config.js";

export function getProgramUrl() {
  const base = CONFIG.program.page || CONFIG.website;
  const url = new URL(base);
  if (CONFIG.utm) {
    if (CONFIG.utm.source) url.searchParams.set("utm_source", CONFIG.utm.source);
    if (CONFIG.utm.medium) url.searchParams.set("utm_medium", CONFIG.utm.medium);
    if (CONFIG.utm.campaign) url.searchParams.set("utm_campaign", CONFIG.utm.campaign);
  }
  return url.toString();
}

export function getWhatsAppUrl() {
  if (!CONFIG.salesWhatsApp) return "";
  const text = CONFIG.whatsAppText.replace("{program}", CONFIG.program.name);
  return `https://wa.me/${CONFIG.salesWhatsApp}?text=${encodeURIComponent(text)}`;
}

export function getShareUrl(timeString) {
  const pageUrl = CONFIG.siteUrl || window.location.href.split("?")[0];
  const text = CONFIG.shareText
    .replace("{time}", timeString)
    .replace("{url}", pageUrl);
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
