// Every setting lives here. Change values here, never in other files.

export const CONFIG = {
  version: "1.0.0",

  // The live address. Set in Phase 4 (deploy). Used for the share link and link previews.
  siteUrl: "https://password-check-iota.vercel.app",

  // Sales WhatsApp: digits only, country code first. Empty hides the WhatsApp button.
  salesWhatsApp: "",
  whatsAppText: "Hi, I tried the Password Crack Meter. I want to know more about the {program}.",

  // Share text. {time} is the crack time. The password itself is never shared.
  shareText: "A password I tested would be cracked in {time}. Test yours, nothing leaves your device: {url}",

  // The program the CTA sells. Always use the full name. page is its page on wrench-wise.com, or "" for the main site.
  program: {
    name: "Certification Program in AI-Powered Software Engineering & DSA",
    page: ""
  },

  website: "https://wrench-wise.com",
  utm: { source: "password-crack-meter", medium: "web-project", campaign: "password-crack-meter" },

  // Sample chips under the input. Every result is checked in tools/verify.mjs.
  samples: ["password123", "Chennai@2024", "Rahul143", "aB3$xY9!", "Kx7#qLm2vP9$"],

  suggestLength: 16,
  typeSampleMs: 55, // typing speed when a sample chip is tapped
  loaderMs: 800,    // the loader never runs longer than this

  // Switches. false hides the feature completely, with no errors.
  features: {
    darkTheme: true,
    attackerPicker: true,
    tokenStrip: true,
    underTheHood: true,
    share: true
  }
};
