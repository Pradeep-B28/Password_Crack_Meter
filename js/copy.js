// All words on the site. Do not reword unless I ask. Use t("hero.title") to read one.
// {name} parts are filled in by t(key, { name: value }).

export const COPY = {
  brand: "Wrench Wise",
  hero: {
    eyebrow: "Free password check",
    title: "How fast would your password fall?",
    sub: "Type a password. See how long it would take to crack, why, and what to use instead."
  },
  input: {
    label: "Password to test",
    placeholder: "Type a password",
    show: "Show password",
    hide: "Hide password",
    clear: "Clear",
    samples: "Or try a sample"
  },
  privacy: {
    line: "Nothing you type is stored or sent. It all runs on your device.",
    proofTitle: "Check it yourself",
    proof: "Load this page, turn on airplane mode, and it still works. The page is also locked so that it cannot send anything out.",
    advice: "Still, test something similar instead of a password you really use. That is a good habit on any site."
  },
  result: {
    empty: "Start typing to see the result.",
    label: "Time to crack",
    strength: "Strength",
    estimate: "This is an estimate. Real attacks differ, and a password that has already leaked can fall at once, whatever it looks like."
  },
  attackers: {
    heading: "Who is guessing?",
    fast: "A stolen password file with weak protection. 10 billion guesses a second.",
    slow: "A stolen password file with strong protection. 10,000 guesses a second.",
    online: "Guessing on a website that limits attempts. 100 guesses an hour."
  },
  why: { heading: "Why this result" },
  tokens: {
    heading: "How an attacker reads it",
    common: "Common password",
    word: "Common word",
    sequence: "Run",
    keyboard: "Keyboard row",
    repeat: "Repeat",
    year: "Year",
    date: "Date",
    phone: "Phone number",
    random: "Random"
  },
  suggest: {
    heading: "A stronger password",
    generate: "Generate",
    again: "Generate another",
    copy: "Copy",
    copied: "Copied",
    time: "Cracked in {time}.",
    note: "Made on your device and not saved anywhere. Keep it in a password manager."
  },
  share: { button: "Share on WhatsApp" },
  hood: {
    heading: "The DSA behind this page",
    hashTitle: "Hash set",
    hash: "{size} common passwords and words sit in a hash set, so each check takes about the same time however long the list is.",
    hashLive: "This password needed {lookups} lookups. Scanning a plain list could take up to {comparisons} comparisons.",
    patternTitle: "Pattern checks",
    pattern: "The page walks through the password once, left to right, and spots words, runs, keyboard rows, repeats, years, dates and phone numbers.",
    mathTitle: "Guess maths",
    math: "Each piece gets a guess count. Multiply them, divide by guesses per second, and you get the time."
  },
  tips: {
    heading: "Three habits that help",
    one: "Use 16 or more characters.",
    two: "Never reuse a password.",
    three: "Use a password manager and turn on two-step login."
  },
  cta: {
    title: "Want to build tools like this?",
    body: "This page is built with a hash set, pattern checks and plain JavaScript. Learn these skills step by step in the {program}.",
    button: "Explore the program",
    whatsApp: "Talk to us on WhatsApp"
  },
  footer: {
    built: "Built by Wrench Wise",
    privacy: "Nothing you type here is stored or sent."
  },
  noScript: "This page needs JavaScript to run."
};

export function t(key, values = {}) {
  const found = key.split(".").reduce((node, part) => node?.[part], COPY);
  if (typeof found !== "string") return "";
  return found.replace(/\{(\w+)\}/g, (all, name) => values[name] ?? all);
}
