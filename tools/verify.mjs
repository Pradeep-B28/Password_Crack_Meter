// LOCKED. Run with: node tools/verify.mjs
// Must end with RESULT: ALL PASS at the start of every phase and before deploy.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash, webcrypto } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
if (!globalThis.crypto) globalThis.crypto = webcrypto;

const { analyze, suggest, LIST_SIZE, MAX_INPUT } = await import("../js/engine/meter.js");
const { CONFIG } = await import("../config.js");
const { COPY, t } = await import("../js/copy.js");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let fails = 0, passes = 0;
const check = (ok, name) => {
  if (ok) passes++;
  else { fails++; console.log("FAIL  " + name); }
};
const read = (p) => readFileSync(join(ROOT, p), "utf8");

// 1. Locked files have not changed. Line endings are ignored so Windows is fine.
const HASHES = {
  "js/engine/meter.js": "d1962e2fd5f1242beee00089bff32fc1c8c48918f74f71706121cf3935e4ed02",
  "js/engine/common-list.js": "f22a39c872f650acc5d466f2a6e506d1cf90e5bc6593bfa746e6eedd88ef30ff",
  "vercel.json": "ba4d7641ff1671722cefdaea29f7ce12d5341129eb068f2b324259f5e03cca85"
};
for (const [file, hash] of Object.entries(HASHES)) {
  const now = createHash("sha256").update(read(file).replace(/\r/g, "")).digest("hex");
  check(now === hash, `Locked file was changed: ${file}`);
}

// 2. Exact results. [password, time, level, token types]
const CASES = [
  ["123456", "instantly", 0, ["common"]],
  ["password123", "instantly", 0, ["common"]],
  ["P@ssw0rd", "instantly", 0, ["common"]],
  ["25061998", "instantly", 0, ["date"]],
  ["9876543210", "instantly", 0, ["sequence"]],
  ["aaaaaaaa", "instantly", 0, ["repeat"]],
  ["Rahul123", "instantly", 0, ["word", "sequence"]],
  ["rahul@123", "0.03 seconds", 0, ["word", "random", "sequence"]],
  ["Chennai@2024", "0.04 seconds", 0, ["word", "random", "year"]],
  ["rahul143", "0.2 seconds", 0, ["word", "random"]],
  ["9840123456", "0.4 seconds", 0, ["phone"]],
  ["Rahul143", "0.9 seconds", 0, ["word", "random"]],
  ["Tiger#7k", "3 seconds", 1, ["word", "random"]],
  ["kX7#qL", "1 minute", 1, ["random"]],
  ["aB3$xY9!", "8 days", 2, ["random"]],
  ["correcthorsebatterystaple", "6 years", 3, ["word", "word", "word", "word"]],
  ["Kx7#qLm2vP9$", "2 million years", 4, ["random"]],
  ["mQ7$vL2!xR9@pZ4&", "more than a trillion years", 4, ["random"]]
];
for (const [pw, label, level, types] of CASES) {
  const r = analyze(pw);
  check(r.label === label, `${pw}: time is "${r.label}", expected "${label}"`);
  check(r.level === level, `${pw}: level is ${r.level}, expected ${level}`);
  check(r.tokens.map((x) => x.type).join() === types.join(), `${pw}: tokens are ${r.tokens.map((x) => x.type)}`);
}
check(analyze("Chennai@2024").headline === "Cracked in 0.04 seconds.", "headline wording");
check(analyze("123456").headline === "Cracked instantly.", "instant headline wording");
check(analyze("").empty === true, "empty input");
check(LIST_SIZE === 37080, `list size is ${LIST_SIZE}`);

// 3. A slower attacker changes the time but never the level.
check(analyze("password123", 1e4).label === "4 seconds", "slow hash time");
check(analyze("password123", 100 / 3600).label === "15 days", "online time");
check(analyze("password123", 100 / 3600).level === 0, "online level stays very weak");

// 4. Every sample in config works and no sample is empty.
check(CONFIG.samples.length >= 3, "samples exist");
for (const s of CONFIG.samples) check(analyze(s).reasons.length > 0, `sample ${s} has reasons`);

// 5. 2,000 random inputs: nothing breaks and every result can be explained.
const ALPHA = "abcdefgXYZ0123456789!@#$ qwerty தமிழ்😀";
const chars = Array.from(ALPHA);
let seed = 42;
const rnd = (n) => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % n;
for (let i = 0; i < 2000; i++) {
  let s = "";
  for (let k = 1 + rnd(60); k > 0; k--) s += chars[rnd(chars.length)];
  const r = analyze(s);
  check(r.tokens.map((x) => x.text).join("") === Array.from(s).slice(0, MAX_INPUT).join(""), `tokens rebuild the input: ${s}`);
  check(Number.isFinite(r.log10Seconds) && r.label.length > 0, `finite result: ${s}`);
  check(r.reasons.length >= 1 && r.reasons.length <= 4, `1 to 4 reasons: ${s}`);
}
check(Array.from(analyze("a".repeat(500)).tokens.map((x) => x.text).join("")).length === MAX_INPUT, "long input is capped");

// 6. Suggestions are strong, random and different each time.
const seen = new Set();
for (let i = 0; i < 300; i++) {
  const { password, result } = suggest(CONFIG.suggestLength);
  seen.add(password);
  check(Array.from(password).length === CONFIG.suggestLength, "suggestion length");
  check(result.level === 4 && result.tokens.every((x) => x.type === "random"), `suggestion strength: ${password}`);
  check(/[A-Z]/.test(password) && /[a-z]/.test(password) && /[2-9]/.test(password) && /[^A-Za-z0-9]/.test(password), `suggestion mix: ${password}`);
}
check(seen.size === 300, "suggestions do not repeat");

// 7. Copy has every token label and fills values.
for (const type of ["common", "word", "sequence", "keyboard", "repeat", "year", "date", "phone", "random"]) {
  check(!!COPY.tokens[type], `token label: ${type}`);
}
check(t("suggest.time", { time: "1 minute" }) === "Cracked in 1 minute.", "t() fills values");

// 8. Privacy and writing rules across everything built so far.
const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "tools"]);
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) => {
  const p = dir ? `${dir}/${e.name}` : e.name;
  if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
  return /\.(js|html|css|md|json)$/.test(e.name) ? [p] : [];
});
const files = walk("").filter((p) => !p.endsWith("common-list.js"));
const NEVER = [
  ["XMLHttpRequest", /XMLHttpRequest/], ["sendBeacon", /sendBeacon/], ["WebSocket", /WebSocket/],
  ["EventSource", /EventSource/], ["innerHTML", /innerHTML|outerHTML|insertAdjacentHTML/],
  ["document.write", /document\.write/], ["eval", /\beval\(/],
  ["console output", /console\.\w+\(/], ["analytics", /googletagmanager|gtag\(|fbq\(|connect\.facebook|clarity\.ms|hotjar/i],
  ["outside file", /<(script|link)[^>]+(src|href)=["']https?:/i], ["web font", /fonts\.googleapis|@import\s+url\(["']?http/i]
];
for (const file of files) {
  const body = read(file);
  const code = /\.(js|html|css)$/.test(file);
  if (code) {
    for (const [name, re] of NEVER) check(!re.test(body), `${file}: ${name} is not allowed`);
    if (file !== "js/selftest.js") check(!/\bfetch\(/.test(body), `${file}: fetch is not allowed`);
    if (file !== "js/store.js") check(!/localStorage|sessionStorage/.test(body) || file === "js/selftest.js" || file === "js/theme-init.js", `${file}: storage is only allowed in js/store.js`);
  }
  check(!/[‒-―]/.test(body), `${file}: long dash found`);
  if (!file.endsWith(".md")) check(!/(?![©®™])\p{Extended_Pictographic}/u.test(body), `${file}: emoji found`);
}
if (existsSync(join(ROOT, "js/store.js"))) {
  const keys = [...read("js/store.js").matchAll(/["'`](pcm-[\w-]+)["'`]/g)].map((m) => m[1]);
  check(keys.every((k) => k === "pcm-theme" || k === "pcm-intro-seen"), `store.js keys: ${keys}`);
}
const CSP = JSON.parse(read("vercel.json")).headers[0].headers.find((h) => h.key === "Content-Security-Policy").value;
check(CSP.includes("connect-src 'none'") && CSP.includes("script-src 'self'") && CSP.includes("form-action 'none'"), "vercel.json lock");
if (existsSync(join(ROOT, "index.html"))) {
  const html = read("index.html");
  check(/<meta[^>]+Content-Security-Policy[^>]+connect-src 'none'/i.test(html), "index.html: CSP meta tag missing");
  check(!/<form\b/i.test(html), "index.html: no form tag allowed");
  check(!/\sstyle=/i.test(html), "index.html: inline style attribute is blocked by the lock");
  check(!/<script(?![^>]*\bsrc=)[^>]*>/i.test(html), "index.html: inline script is blocked by the lock");
  check(!/<style\b/i.test(html), "index.html: style tag is blocked by the lock");
  const input = html.match(/<input[^>]+id=["']password["'][^>]*>/i)?.[0] ?? "";
  for (const need of ['type="password"', 'autocomplete="off"', 'spellcheck="false"', 'autocapitalize="off"', 'maxlength="128"']) {
    check(input.includes(need), `index.html: #password needs ${need}`);
  }
  check(!/\bname=/.test(input), "index.html: #password must have no name");
}

console.log(`${passes} checks passed, ${fails} failed (${files.length} files scanned)`);
console.log(fails ? "RESULT: FAILED" : "RESULT: ALL PASS");
process.exit(fails ? 1 : 0);
