# Password Crack Meter: Project Brief

## 1. What we are building

A polished Wrench Wise website for PC and mobile. A visitor types a password and instantly sees how long it would take to crack, why, and a stronger password to use. Nothing typed ever leaves the device.

**Who it is for:** students and working people who may never have written code.

**Already done and tested for you:** the password engine, the common password list, all the words on the site (`js/copy.js`) and the settings (`config.js`). Your job is everything the visitor sees and touches.

**Time target:** 1 hour in total. Keep it simple and finish it properly.

When there is a trade-off, follow this order:
1. The privacy promise is true. Nothing is stored or sent.
2. It looks professional and feels instant on a phone.
3. Every number is exactly right.
4. It runs smoothly on a mid-range Android phone.
5. The DSA section teaches clearly.
6. The Wrench Wise CTA works in one tap.
7. It is easy to upgrade.
8. Everything else.

---

## 2. Hard rules

1. **Code.** Plain HTML, CSS and JavaScript (ES modules). No frameworks, libraries, CDNs, npm packages or web fonts. The only image files are the logo, the link preview image and app icons. Draw everything else with inline SVG and CSS.
2. **Locked files.** Never edit `js/engine/`, `tools/`, `vercel.json` or `package.json`. Change `js/copy.js` and `config.js` only if I ask, except `siteUrl` in Phase 4. At the start of every phase, run `node tools/verify.mjs`. It must end with `RESULT: ALL PASS`. If you think a locked file is wrong, stop and tell me.
3. **Nothing leaves the device.** No backend, database, API calls, accounts or forms. No GA4, Meta Pixel or any other outside script, because an outside script on this page could read what is typed. Normal links to wrench-wise.com and WhatsApp are fine.
4. **The password stays in the input box.** Hold it only in the input and in local variables while analysing. Never put it in storage, the URL, a global variable, a share message, a log, an error message, the page title or an `aria-live` message. Clear the input on `pagehide`.
5. **The input.** Exactly: `<input id="password" type="password" autocomplete="off" spellcheck="false" autocapitalize="off" autocorrect="off" maxlength="128" data-1p-ignore data-lpignore="true">`, with a real `<label>`. No `name` and no `<form>` around it. Its text is at least 16px so phones do not zoom in.
6. **Privacy lock.** Put this as the first tag in `<head>`, after the charset:
   `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; manifest-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'">`
   This means no inline scripts, no `<style>` tags, no `style=""` attributes and no `onclick=""` in HTML. Setting `element.style` from JavaScript is fine. Use `meta` tags for link previews, with no canonical `link` tag.
7. **One source for every number.** Every time, level, token and count on screen comes straight from `analyze()` or `suggest()`. Never recalculate or reformat one anywhere else. The level never changes when the attacker changes, and the engine already handles this.
8. **Storage.** `localStorage` may hold only `pcm-theme`. `sessionStorage` may hold only `pcm-intro-seen`. Use them only in `js/store.js` and `js/theme-init.js`, wrapped in try and catch. The site must work when storage is blocked.
9. **Tone.** Calm and helpful. Never mock the visitor. Never promise a job or a result. Never use these where a user can see them: stupid, dumb, idiot, loser, useless, pathetic, terrible, guarantee, placement, salary, lakh, "get hired", "seats left", "100% safe", unhackable, "military grade", or any countdown to buy.
10. **Words.** All text comes from `js/copy.js` through `t()`. Program names always use the full name from `config.js`. No emojis. No em dashes.
11. **Safety.** Never use `innerHTML` or `insertAdjacentHTML`. Use `textContent`. No `console` output.
12. **No overlap.** Nothing overlaps, clips or scrolls sideways at 320, 360, 390, 768, 1280 or 1440 px wide. The longest headline, "Cracked in more than a trillion years.", must wrap cleanly.
13. **No placeholder look.** No grey boxes, lorem ipsum, stock icons or unfinished sections. Remove any debug panel before Phase 4 ends.

---

## 3. Keep it easy to upgrade

- The engine has no page code. Pages call `analyze()` and `suggest()`.
- All words are in `js/copy.js`. All settings are in `config.js`.
- Each `config.features` switch set to `false` hides that feature with no errors.
- Each section has its own file and render function. A new section means one new file and one line in `main.js`.
- Colours, spacing and timing live only in `styles/tokens.css`.

---

## 4. Tech setup and file structure

ES modules need a local server. Use `npx --yes serve .` from the project folder, or Antigravity's built-in preview. Vercel needs no build command. Set up git in Phase 1 and commit at the end of every phase.

```
password-crack-meter/
  index.html
  config.js            given
  vercel.json          given, LOCKED
  package.json         given, LOCKED
  NOTICE.txt           given, keep it
  manifest.json
  og-image.png         made in Phase 4
  assets/logo.png      I add this. If missing, show "Wrench Wise" as text
  assets/icon.svg      lock icon, drawn in code
  js/
    engine/            LOCKED. meter.js, common-list.js
    copy.js            given
    theme-init.js      plain script in head. Sets theme and intro class before first paint
    main.js            starts everything, holds UI state
    store.js           safe storage
    links.js           program, WhatsApp and share links with UTM
    meter-ui.js        input, samples, result, lock, attackers, reasons, tokens
    suggest-ui.js      generate and copy
    sections-ui.js     hood, tips, CTA, footer
    motion.js          loader, scroll reveal, reduced motion check
    selftest.js        ?test=1
  styles/
    tokens.css  base.css  components.css  motion.css
  tools/verify.mjs     LOCKED
```

**The engine**
- `analyze(password, guessesPerSecond)` returns `{ empty }`, or `{ length, pool, tokens, label, headline, level, levelName, reasons, isCommon, lookups, listComparisons, log10Guesses, log10Seconds }`.
- `tokens`: `{ type, text, len }`. `reasons`: `{ id, tone: "bad" | "good", title, detail }`. `level`: 0 to 4.
- `ATTACKERS`: 3 options with `id`, `label` and `guessesPerSecond`. `LIST_SIZE`: size of the hash set.
- `suggest(length)` returns `{ password, result }`.

---

## 5. Page layout

**Laptop (1024px and up):** centred, max width 1160px. The hero is two columns. Left: heading, input card and samples. Right: result card. Below it, full-width sections.

**Phone:** one column in this order: short heading, input card, result card. The crack time sits directly under the input, so it stays visible with the keyboard open on a 360 x 640 screen. The sub line may hide while the input has focus.

**Order of sections:** header, hero, privacy strip, suggestion, DSA section, three habits, CTA, footer. The result card holds the attacker picker, reasons and token strip.

---

## 6. Features

**A. Loader.** Shown on the first visit of a session. The logo in the centre, a lock outline drawing itself, and a thin brand gradient bar. It ends by `config.loaderMs` (never longer), fades in 250 ms, and the hero rises 12px into place. If JavaScript fails, a CSS animation still removes it by 2 seconds. No loader under reduced motion.

**B. Input.** Hidden by default, with an eye button to show or hide and a clear button. Analyse on every `input` event, inside `requestAnimationFrame`. Add a `<noscript>` line using `noScript` from the copy.

**C. Sample chips.** From `config.samples`. Tapping one reveals the input and types the sample at `config.typeSampleMs` per character, so the result changes live.

**D. Result card.** Empty state first. Then:
- The big headline from `result.headline`, at least 44px on laptop and 30px on phone, weight 800.
- A drawn SVG lock. Very weak: shackle open and a crack line draws across the body. Strong and above: shackle closes with a soft pulse.
- A 5-part meter and `levelName` as text, so colour is never the only signal.
- The `estimate` note in small text. Always visible when there is a result.

**E. Attacker picker** (`features.attackerPicker`). Three pills from `ATTACKERS`, with the note from `copy.attackers` for the selected one. Default is `fast`. Changing it animates the time only.

**F. Reasons.** Up to 4 cards from `result.reasons`, marked good or bad with a small drawn icon.

**G. Token strip** (`features.tokenStrip`). The password shown in coloured pieces, each labelled from `copy.tokens`. While the input is hidden, each piece shows dots (`len` of them), never its text.

**H. Suggestion.** The Generate button runs `suggest(config.suggestLength)`. The characters scramble for 400 ms, then settle left to right on the real password. Show its time with `suggest.time`, a Copy button and the note. Never fill it into the input by itself. The scramble must not use the engine's result until the final frame.

**I. Privacy strip.** `privacy.line`, `proofTitle`, `proof` and `advice`, with a drawn shield. This must be easy to see without scrolling on laptop, and `privacy.line` must also show inside the input card on phone.

**J. DSA section** (`features.underTheHood`). Three cards. The hash card fills `{size}` from `LIST_SIZE`, and shows `hashLive` from `lookups` and `listComparisons` once there is a result. Format counts with `toLocaleString("en-IN")`.

**K. Share** (`features.share`). WhatsApp link using `config.shareText`, filled only with `{time}` and `{url}`. Hidden until there is a result.

**L. CTA.** A card with `cta.title`, `cta.body` and two buttons: the program link (`program.page`, or `website`, with UTM from `config.utm`) and WhatsApp (hidden if `salesWhatsApp` is empty). No forms or gates. Links open in a new tab with `rel="noopener noreferrer"`.

**M. Theme.** Light and dark, first visit follows the device, a toggle saves `pcm-theme`.

**Nice to have, only if time allows:** `manifest.json` install support.

---

## 7. Visual style: matched to wrench-wise.com

Emerald as the main colour, teal and cyan as accents, gray text, white cards and soft emerald-to-cyan gradients. Every colour is a CSS variable in `styles/tokens.css`.

| Token | Light (default) | Dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0F172A` |
| `--bg-grad` | `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 45%, #ECFEFF 100%)` | `linear-gradient(135deg, #0F172A 0%, #1E293B 100%)` |
| `--surface` | `#FFFFFF` | `#1E293B` |
| `--surface-2` | `#F3F4F6` | `#334155` |
| `--border` | `#E5E7EB` | `#334155` |
| `--text` | `#111827` | `#F1F5F9` |
| `--text-2` | `#374151` | `#CBD5E1` |
| `--muted` | `#6B7280` | `#94A3B8` |
| `--brand` | `#059669` | `#10B981` |
| `--brand-strong` | `#047857` | `#34D399` |
| `--brand-soft` | `#D1FAE5` | `rgba(16,185,129,0.15)` |
| `--accent` | `#0891B2` | `#22D3EE` |
| `--lv-0` Very weak | `#DC2626` | `#F87171` |
| `--lv-1` Weak | `#C2410C` | `#FB923C` |
| `--lv-2` Fair | `#B45309` | `#FBBF24` |
| `--lv-3` Strong | `#0891B2` | `#22D3EE` |
| `--lv-4` Very strong | `#059669` | `#34D399` |

**Brand gradient:** `--brand-grad: linear-gradient(90deg, #059669, #0D9488, #06B6D4)`. Use it for primary buttons, the bar under the header and the CTA card's top edge.

**Fonts:** `ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Headings weight 800, letter spacing -0.01em. The password, tokens and suggestion use `ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace`. Numbers use `font-variant-numeric: tabular-nums`.

**Shapes:** buttons, pills and chips 999px. Cards 16px. Input 12px.

**Shadows** (in dark, same shapes with `rgba(0,0,0,0.40)`):
- `--shadow-sm: 0 1px 3px rgba(0,0,0,0.10), 0 1px 2px -1px rgba(0,0,0,0.10)`
- `--shadow-md: 0 4px 6px -1px rgba(0,0,0,0.10), 0 2px 4px -2px rgba(0,0,0,0.10)`
- `--shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.10), 0 4px 6px -4px rgba(0,0,0,0.10)`

**Hover effects** (only inside `@media (hover: hover)`)
- Buttons lift 2px with `--shadow-md`. Primary buttons also slide their gradient.
- Cards lift 3px with `--shadow-lg` and a soft brand border.
- Chips and pills fill with `--brand-soft`.
- Links get an underline that grows from the left.

**Micro-interactions**
- Press on any button or chip: scale to 0.97.
- Input focus: border glows in the current level's colour.
- Headline change: quick slide-up cross-fade, 140 ms.
- Meter parts fill one after another with a small overshoot.
- Lock: shackle moves and crack line draws as the level changes. The card nudges 2px once when it drops to Very weak.
- Tokens and reasons: stagger in by 40 ms, only when the set changes, not on every key press.
- Eye button: a line draws across the eye. Clear button: rotates in when there is text.
- Copy: icon turns into a tick and the label changes to `suggest.copied` for 1.5 seconds.
- Theme toggle: sun and moon rotate and swap.
- Scroll reveal: lower sections fade and rise 16px, once, with `IntersectionObserver`.

**Motion rules**
- Animate only `transform`, `opacity` and SVG `stroke-dashoffset`.
- `--ease-out: cubic-bezier(0.22, 1, 0.36, 1)`. `--ease: cubic-bezier(0.4, 0, 0.2, 1)`. Most effects 150 to 250 ms.
- Typing must never wait for an animation. New results replace running animations.
- `prefers-reduced-motion`: no loader, scramble, nudge, stagger or reveal. Plain state changes only.

**Access:** full keyboard use, visible focus rings (2px `--accent`), tap targets at least 44px, text contrast at least 4.5 to 1. One polite `aria-live` region announces only the time and level, 500 ms after typing stops.

**Meta:** `theme-color` `#FFFFFF` and `#0F172A` by media query. Title: "Password Crack Meter | Wrench Wise". Add a description and `og:` tags.

---

## 8. Words

Use `js/copy.js` as it is. The engine's reasons and level names are already written. Do not add other visible text without asking me.

---

## 9. Analytics

None, on purpose (rule 3). The UTM tags on links to wrench-wise.com show visits from this project in the main site's reports.

---

## 10. Correctness

**`node tools/verify.mjs`** checks the engine, the locked files and the privacy rules across all your files. It must pass at the start of every phase and before deploy.

**`?test=1`** opens a self-test page in `js/selftest.js`, listing PASS or FAIL per line:
1. Each row below shows the exact result through the real page code.
2. Typing `TestSecret#123` into the real input leaves no trace of it in `localStorage`, `sessionStorage`, `location.href`, `document.title` or the `aria-live` region.
3. `fetch("https://wrench-wise.com/", { mode: "no-cors" })` is refused by the privacy lock.
4. Storage holds only allowed keys.
5. `document.documentElement.scrollWidth` is not larger than the window width.
6. While hidden, token pieces show dots and never the text.

| Password | Fast attacker | Level | Pieces |
|---|---|---|---|
| `password123` | instantly | Very weak | common |
| `Chennai@2024` | 0.04 seconds | Very weak | word, random, year |
| `Rahul143` | 0.9 seconds | Very weak | word, random |
| `Tiger#7k` | 3 seconds | Weak | word, random |
| `aB3$xY9!` | 8 days | Fair | random |
| `correcthorsebatterystaple` | 6 years | Strong | word x 4 |
| `Kx7#qLm2vP9$` | 2 million years | Very strong | random |

Also: `password123` shows 4 seconds on the slow attacker and 15 days on the website attacker, and stays Very weak on both.

---

## 11. Phases

Stop after every phase, give me the Phase Report, and wait for me to say "Go".

**Phase 1: Shell and loader (10 min).** Git, `index.html` with the privacy lock, tokens, themes, header, footer, loader, hero layout on laptop and phone, `store.js`, `theme-init.js`.

**Phase 2: The meter (20 min).** Input, samples, result card, lock, meter, attacker picker, reasons, token strip, with all their micro-interactions.

**Phase 3: The rest of the page (15 min).** Suggestion with scramble and copy, privacy strip, share, DSA section, habits, CTA, hover effects, scroll reveal.

**Phase 4: Finish and deploy (15 min).**
1. Build `?test=1`. Fix everything until it passes. Check all widths in rule 12 and both themes. Check reduced motion.
2. Make `og-image.png` (1200 x 630, Wrench Wise colours, the line "Cracked in 0.9 seconds.", no real password shown).
3. Help me push the folder to GitHub. I will give you my empty repository URL.
4. Deploy on Vercel as a static site with no build command.
5. Set `config.siteUrl`, `og:url` and `og:image` to the live address, then redeploy.
6. Give click-by-click steps for anything I must do myself.
7. Confirm the live site works on a phone-sized screen and that `?test=1` passes live. Confirm the page still works with the network off after loading.
8. Tag the release `v1.0.0`, push the tag and give me the live link.

---

## 12. Phase Report format

- **What I built** (3 to 5 bullets)
- **How to check it** (click steps)
- **Screenshots** (phone and laptop)
- **verify.mjs result**
- **Not working or cut,** explained in plain words
- **Time used** against the target

---

## 13. If something keeps breaking

- If the same bug survives two fix attempts, stop. Explain it in plain words and give me options. Do not keep looping.
- If I say "Park it", move that feature to a "Parked" list in the Phase Report and continue.
- If time runs short, park in this order:
  1. `manifest.json` install support
  2. The share button
  3. Scroll reveal
  4. The suggestion's scramble (keep the suggestion)
  5. The attacker picker (keep the fast attacker)

**Never park:**
- Every rule in Section 2, above all the privacy lock and rule 4
- The loader, hover effects and core micro-interactions (lock, meter, headline, copy)
- The result card, reasons and token strip
- Phone and laptop layouts, light and dark themes
- Wrench Wise branding and the CTA
- `verify.mjs`, `?test=1` and deployment
