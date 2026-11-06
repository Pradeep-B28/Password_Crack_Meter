// Self-test suite triggered via ?test=1

export async function runSelfTest() {
  const overlay = document.createElement("div");
  overlay.id = "selftest-overlay";
  overlay.className = "selftest-overlay";

  const container = document.createElement("div");
  container.className = "selftest-modal card";

  const header = document.createElement("div");
  header.className = "selftest-header";

  const title = document.createElement("h2");
  title.className = "selftest-title";
  title.textContent = "Self-Test Suite (?test=1)";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "btn-icon";
  closeBtn.setAttribute("aria-label", "Close self test");
  closeBtn.textContent = "✕";
  closeBtn.addEventListener("click", () => {
    overlay.remove();
  });

  header.appendChild(title);
  header.appendChild(closeBtn);
  container.appendChild(header);

  const statusEl = document.createElement("div");
  statusEl.className = "selftest-status";
  statusEl.textContent = "Running tests...";
  container.appendChild(statusEl);

  const list = document.createElement("div");
  list.className = "selftest-list";
  container.appendChild(list);

  overlay.appendChild(container);
  document.body.appendChild(overlay);

  const results = [];
  const addResult = (ok, name, detail = "") => {
    results.push({ ok, name, detail });
    const row = document.createElement("div");
    row.className = "selftest-row " + (ok ? "pass" : "fail");

    const badge = document.createElement("span");
    badge.className = "selftest-badge";
    badge.textContent = ok ? "PASS" : "FAIL";

    const label = document.createElement("span");
    label.className = "selftest-label";
    label.textContent = name;

    row.appendChild(badge);
    row.appendChild(label);

    if (detail && !ok) {
      const d = document.createElement("p");
      d.className = "selftest-detail";
      d.textContent = detail;
      row.appendChild(d);
    }

    list.appendChild(row);
  };

  const input = document.getElementById("password");
  const clearBtn = document.getElementById("clear-password");
  const toggleBtn = document.getElementById("toggle-password");
  const headlineEl = document.getElementById("result-headline");
  const levelNameEl = document.getElementById("meter-level-name");
  const pills = document.querySelectorAll(".attacker-pill");

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const setInputValue = async (val, attackerIndex = 0) => {
    if (pills && pills[attackerIndex]) {
      pills[attackerIndex].click();
    }
    input.value = val;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await wait(80);
  };

  // Test 1: Real page code test cases
  const CASES = [
    { pw: "password123", attacker: 0, label: "Cracked instantly.", level: "Very weak", tokens: ["common"] },
    { pw: "password123", attacker: 1, label: "Cracked in 4 seconds.", level: "Very weak" },
    { pw: "password123", attacker: 2, label: "Cracked in 15 days.", level: "Very weak" },
    { pw: "Chennai@2024", attacker: 0, label: "Cracked in 0.04 seconds.", level: "Very weak", tokens: ["word", "random", "year"] },
    { pw: "Rahul143", attacker: 0, label: "Cracked in 0.9 seconds.", level: "Very weak", tokens: ["word", "random"] },
    { pw: "Tiger#7k", attacker: 0, label: "Cracked in 3 seconds.", level: "Weak", tokens: ["word", "random"] },
    { pw: "aB3$xY9!", attacker: 0, label: "Cracked in 8 days.", level: "Fair", tokens: ["random"] },
    { pw: "correcthorsebatterystaple", attacker: 0, label: "Cracked in 6 years.", level: "Strong", tokens: ["word", "word", "word", "word"] },
    { pw: "Kx7#qLm2vP9$", attacker: 0, label: "Cracked in 2 million years.", level: "Very strong", tokens: ["random"] }
  ];

  for (const c of CASES) {
    await setInputValue(c.pw, c.attacker);
    const gotHeadline = headlineEl?.textContent || "";
    const gotLevel = levelNameEl?.textContent || "";
    const headlineOk = gotHeadline === c.label;
    const levelOk = gotLevel === c.level;

    let tokensOk = true;
    if (c.tokens) {
      const gotTokens = [...document.querySelectorAll(".token-piece")].map((p) => {
        const cls = [...p.classList].find((cl) => cl.startsWith("token-") && cl !== "token-piece" && cl !== "token-stagger");
        return cls ? cls.replace("token-", "") : "";
      });
      tokensOk = gotTokens.join(",") === c.tokens.join(",");
    }

    const ok = headlineOk && levelOk && tokensOk;
    const detail = `Expected: ${c.label} (${c.level}). Got: ${gotHeadline} (${gotLevel})`;
    addResult(ok, `1. Engine Case: ${c.pw} (attacker ${c.attacker})`, detail);
  }

  // Restore fast attacker
  if (pills && pills[0]) pills[0].click();

  // Test 2: Leak test
  const secret = "TestSecret#123";
  await setInputValue(secret, 0);
  await wait(600); // Wait for aria-live debounce

  let leakedInStorage = false;
  try {
    const ls = JSON.stringify(localStorage);
    const ss = JSON.stringify(sessionStorage);
    leakedInStorage = ls.includes(secret) || ss.includes(secret);
  } catch {}

  const leakedInUrl = window.location.href.includes(secret);
  const leakedInTitle = document.title.includes(secret);
  const liveEl = document.getElementById("sr-live");
  const leakedInAria = liveEl ? liveEl.textContent.includes(secret) : false;

  const noLeaks = !leakedInStorage && !leakedInUrl && !leakedInTitle && !leakedInAria;
  addResult(noLeaks, "2. Password Leak Check: No trace in storage, URL, title or aria-live");

  // Test 3: Privacy Lock test (CSP block)
  let cspBlocked = false;
  try {
    await fetch("https://wrench-wise.com/", { mode: "no-cors" });
    cspBlocked = false;
  } catch {
    cspBlocked = true;
  }
  addResult(cspBlocked, "3. Privacy Lock: Network fetch refused by Content Security Policy");

  // Test 4: Storage key check
  let validKeys = true;
  try {
    const allowedLocal = new Set(["pcm-theme"]);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!allowedLocal.has(k)) validKeys = false;
    }
    const allowedSession = new Set(["pcm-intro-seen"]);
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!allowedSession.has(k)) validKeys = false;
    }
  } catch {}
  addResult(validKeys, "4. Storage Keys: localStorage/sessionStorage hold only permitted keys");

  // Test 5: No horizontal overflow
  const noScroll = document.documentElement.scrollWidth <= window.innerWidth;
  addResult(noScroll, "5. Layout Width: No horizontal scroll (scrollWidth <= window width)");

  // Test 6: While hidden, token pieces show dots and never text
  if (input.type !== "password") {
    if (toggleBtn) toggleBtn.click();
  }
  await setInputValue("SecretHiddenToken987", 0);
  await wait(100);

  const tokenValues = [...document.querySelectorAll(".token-value")].map((el) => el.textContent);
  const allDots = tokenValues.length > 0 && tokenValues.every((val) => /^•+$/.test(val));
  const noSecretText = !tokenValues.some((val) => val.includes("SecretHiddenToken987"));
  const concealOk = allDots && noSecretText;
  addResult(concealOk, "6. Token Concealment: Token pieces show dots and never text while hidden");

  // Clear input
  input.value = "";
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // Final summary
  const totalFails = results.filter((r) => !r.ok).length;
  const totalPasses = results.filter((r) => r.ok).length;
  statusEl.textContent = totalFails === 0
    ? `RESULT: ALL PASS (${totalPasses}/${results.length} checks passed)`
    : `RESULT: FAILED (${totalFails} failed, ${totalPasses} passed)`;
  statusEl.className = "selftest-status " + (totalFails === 0 ? "status-pass" : "status-fail");
}
