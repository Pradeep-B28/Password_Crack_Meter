// LOCKED. Do not edit. Password analysis only: no DOM, no network, no storage.
// The password is only ever held in local variables while analyze() runs.
import { COMMON_LIST, LOCAL_WORDS } from "./common-list.js";

const WORDS = new Set([...COMMON_LIST, ...LOCAL_WORDS]);
export const LIST_SIZE = WORDS.size;

export const ATTACKERS = [
  { id: "fast", label: "Stolen database, fast hash", guessesPerSecond: 1e10 },
  { id: "slow", label: "Stolen database, slow hash", guessesPerSecond: 1e4 },
  { id: "online", label: "Website login with limits", guessesPerSecond: 100 / 3600 }
];
export const DEFAULT_SPEED = 1e10;

export const LEVELS = ["Very weak", "Weak", "Fair", "Strong", "Very strong"];
export const MAX_INPUT = 128;

const MIN_WORD = 4;
const MAX_WORD = 24;
const SWAPS = { "@": "a", "4": "a", "0": "o", "1": "i", "!": "i", "3": "e", "$": "s", "5": "s", "7": "t" };
const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm", "1234567890"];
const SYMBOLS = " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
const DATE_RE = /^(0[1-9]|[12]\d|3[01])[-/.]?(0[1-9]|1[0-2])[-/.]?((19|20)\d\d|\d\d)/;
const YEAR_RE = /^(19[5-9]\d|20[0-3]\d)/;
const PHONE_RE = /^(?:\+?91)?[6-9]\d{9}(?!\d)/;

// How many characters an attacker has to try for each position.
export function poolSize(chars) {
  let lower = false, upper = false, digit = false, symbol = false, other = false;
  for (const c of chars) {
    if (c >= "a" && c <= "z") lower = true;
    else if (c >= "A" && c <= "Z") upper = true;
    else if (c >= "0" && c <= "9") digit = true;
    else if (SYMBOLS.includes(c)) symbol = true;
    else other = true;
  }
  return (lower ? 26 : 0) + (upper ? 26 : 0) + (digit ? 10 : 0) + (symbol ? 33 : 0) + (other ? 100 : 0);
}

function findSequence(lower, i) {
  const code = (k) => lower[k].codePointAt(0);
  const sameClass = (a, b) =>
    (a >= 48 && a <= 57 && b >= 48 && b <= 57) || (a >= 97 && a <= 122 && b >= 97 && b <= 122);
  if (i + 2 >= lower.length) return null;
  const step = code(i + 1) - code(i);
  if ((step !== 1 && step !== -1) || !sameClass(code(i), code(i + 1))) return null;
  let end = i + 1;
  while (end + 1 < lower.length && code(end + 1) - code(end) === step && sameClass(code(end), code(end + 1))) end++;
  const len = end - i + 1;
  return len >= 3 ? { type: "sequence", len, log: 2 } : null;
}

function findKeyboard(lower, i) {
  let best = 0;
  for (const row of ROWS) {
    for (const r of [row, [...row].reverse().join("")]) {
      const at = r.indexOf(lower[i]);
      if (at < 0) continue;
      let len = 1;
      while (i + len < lower.length && at + len < r.length && r[at + len] === lower[i + len]) len++;
      if (len > best) best = len;
    }
  }
  return best >= 3 ? { type: "keyboard", len: best, log: 2 } : null;
}

function findRepeat(lower, i, pool) {
  const n = lower.length;
  let best = null;
  for (let u = 1; u <= Math.min(8, Math.floor((n - i) / 2) || 1); u++) {
    let total = u;
    while (i + total < n && lower[i + total] === lower[i + total - u]) total++;
    const repeats = Math.floor(total / u);
    total = repeats * u;
    const enough = u === 1 ? total >= 3 : repeats >= 2;
    if (enough && (!best || total > best.len)) {
      best = { type: "repeat", len: total, log: u * Math.log10(pool) + 1 };
    }
  }
  return best;
}

function findRegex(chars, i, re, type, log) {
  const m = re.exec(chars.slice(i, i + 16).join(""));
  return m ? { type, len: m[0].length, log } : null;
}

function findWord(lower, clean, i, st) {
  const max = Math.min(MAX_WORD, lower.length - i);
  for (let len = max; len >= MIN_WORD; len--) {
    const plain = lower.slice(i, i + len).join("");
    st.lookups++;
    if (WORDS.has(plain)) return { type: "word", len, log: Math.log10(LIST_SIZE), swapped: false };
    const cleaned = clean.slice(i, i + len).join("");
    if (cleaned !== plain) {
      st.lookups++;
      if (WORDS.has(cleaned)) return { type: "word", len, log: Math.log10(LIST_SIZE), swapped: true };
    }
  }
  return null;
}

// Greedy scan, left to right. Longest match wins. On a tie, the cheapest wins.
function scan(chars, pool, st) {
  const lower = chars.map((c) => c.toLowerCase());
  const clean = lower.map((c) => SWAPS[c] ?? c);
  const tokens = [];
  let i = 0;
  while (i < chars.length) {
    const found = [
      findSequence(lower, i),
      findKeyboard(lower, i),
      findRepeat(lower, i, pool),
      findRegex(chars, i, YEAR_RE, "year", 2),
      findRegex(chars, i, DATE_RE, "date", Math.log10(36500)),
      findRegex(chars, i, PHONE_RE, "phone", Math.log10(4e9)),
      findWord(lower, clean, i, st)
    ].filter(Boolean);
    let pick = null;
    for (const f of found) {
      if (!pick || f.len > pick.len || (f.len === pick.len && f.log < pick.log)) pick = f;
    }
    if (pick) {
      tokens.push({ ...pick, text: chars.slice(i, i + pick.len).join("") });
      i += pick.len;
    } else {
      const last = tokens[tokens.length - 1];
      if (last && last.type === "random") {
        last.text += chars[i];
        last.len += 1;
        last.log += Math.log10(pool);
      } else {
        tokens.push({ type: "random", text: chars[i], len: 1, log: Math.log10(pool) });
      }
      i += 1;
    }
  }
  return tokens;
}

// Turns a log10 number of seconds into words. No rounding happens anywhere else.
export function formatTime(logSeconds) {
  if (logSeconds < -2) return "instantly";
  const s = Math.pow(10, Math.min(logSeconds, 300));
  if (s < 1) {
    const v = Number(s.toPrecision(1));
    if (v < 1) return `${v} seconds`;
  }
  const units = [
    ["second", 1, 60],
    ["minute", 60, 60],
    ["hour", 3600, 24],
    ["day", 86400, 30.44],
    ["month", 2629800, 12],
    ["year", 31557600, 1000]
  ];
  for (const [name, secs, max] of units) {
    const n = Math.round(s / secs);
    if (n < max) return `${Math.max(n, 1)} ${name}${Math.max(n, 1) === 1 ? "" : "s"}`;
  }
  const years = s / 31557600;
  for (const [name, size] of [["thousand", 1e3], ["million", 1e6], ["billion", 1e9]]) {
    const n = Math.round(years / size);
    if (n < 1000) return `${Math.max(n, 1)} ${name} years`;
  }
  return "more than a trillion years";
}

function levelFor(logSeconds) {
  if (logSeconds < 0) return 0;
  if (logSeconds < Math.log10(86400)) return 1;
  if (logSeconds < Math.log10(31557600)) return 2;
  if (logSeconds < Math.log10(31557600 * 1000)) return 3;
  return 4;
}

function buildReasons(chars, tokens, isCommon, level) {
  const has = (t) => tokens.some((x) => x.type === t);
  const out = [];
  const bad = (id, title, detail) => out.push({ id, tone: "bad", title, detail });
  const good = (id, title, detail) => out.push({ id, tone: "good", title, detail });

  if (isCommon) bad("common", "It is a very common password", "It is on the list attackers try first, so it falls in the first few guesses.");
  else if (has("word")) {
    const swapped = tokens.some((t) => t.swapped);
    bad("word", "It contains a common word or name", swapped
      ? "Swapping letters for symbols, like a for @, does not help. Attackers try those swaps automatically."
      : "Attackers try common words and names before anything random.");
  }
  if (has("phone")) bad("phone", "It looks like a phone number", "A phone number is easy to find and has a fixed shape.");
  if (has("date")) bad("date", "It contains a date", "Birthdays and anniversaries are among the first things people try.");
  if (has("year")) bad("year", "It contains a year", "Years cut thousands of combinations down to about a hundred.");
  if (has("sequence")) bad("sequence", "It contains a run like 1234 or abcd", "A run counts as far less than the same number of random characters.");
  if (has("keyboard")) bad("keyboard", "It follows a keyboard row", "Rows like qwerty look random, but attackers know them.");
  if (has("repeat")) bad("repeat", "It repeats itself", "Repeating a part adds length but almost no extra work for an attacker.");
  if (chars.length < 12) bad("short", `It has only ${chars.length} character${chars.length === 1 ? "" : "s"}`, "Every extra random character multiplies the work. Aim for 16.");
  if (chars.every((c) => c >= "0" && c <= "9")) bad("digits", "It uses only numbers", "Each position has just 10 options.");
  else if (chars.every((c) => c >= "a" && c <= "z")) bad("lower", "It uses only small letters", "Adding capitals, numbers and symbols raises the options per position from 26 to 95.");

  if (level >= 3) {
    if (chars.length >= 12) good("length", `It has ${chars.length} characters`, "Length does the most work in a strong password.");
    if (tokens.every((t) => t.type === "random")) good("random", "No common words or patterns found", "An attacker has to try combinations one by one.");
  }
  return out.slice(0, 4);
}

// The one function the website uses. Every number on screen comes from here.
export function analyze(password, guessesPerSecond = DEFAULT_SPEED) {
  const chars = Array.from(String(password ?? "")).slice(0, MAX_INPUT);
  if (chars.length === 0) return { empty: true };

  const st = { lookups: 1 };
  const pool = poolSize(chars);
  const isCommon = WORDS.has(chars.join("").toLowerCase());
  const tokens = isCommon
    ? [{ type: "common", text: chars.join(""), len: chars.length, log: Math.log10(LIST_SIZE) }]
    : scan(chars, pool, st);

  const log10Guesses = tokens.reduce((sum, t) => sum + t.log, 0);
  const log10Seconds = log10Guesses - Math.log10(guessesPerSecond);
  const label = formatTime(log10Seconds);
  // The level always uses the worst case, so choosing a slower attacker
  // can never make a weak password look strong.
  const level = levelFor(log10Guesses - Math.log10(DEFAULT_SPEED));

  return {
    empty: false,
    length: chars.length,
    pool,
    tokens,
    log10Guesses,
    log10Seconds,
    label,
    headline: label === "instantly" ? "Cracked instantly." : `Cracked in ${label}.`,
    level,
    levelName: LEVELS[level],
    reasons: buildReasons(chars, tokens, isCommon, level),
    isCommon,
    lookups: st.lookups,
    listComparisons: st.lookups * LIST_SIZE
  };
}

const UP = "ABCDEFGHJKLMNPQRSTUVWXYZ";
const LO = "abcdefghijkmnopqrstuvwxyz";
const DI = "23456789";
const SY = "!@#$%&*?-_+=";

function randInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
  return buf[0] % max;
}

// A fresh random password. It is never built from what the person typed,
// because a small edit of a weak password stays weak.
export function suggest(length = 16) {
  const all = UP + LO + DI + SY;
  for (;;) {
    const out = [UP, LO, DI, SY].map((set) => set[randInt(set.length)]);
    while (out.length < length) out.push(all[randInt(all.length)]);
    for (let i = out.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    const password = out.join("");
    const result = analyze(password);
    if (result.level === 4 && result.tokens.every((t) => t.type === "random")) return { password, result };
  }
}
