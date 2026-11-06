// Safe storage helper. Only pcm-theme and pcm-intro-seen are allowed.

export function getStoredTheme() {
  try {
    return localStorage.getItem("pcm-theme");
  } catch {
    return null;
  }
}

export function setStoredTheme(theme) {
  try {
    if (theme) {
      localStorage.setItem("pcm-theme", theme);
    } else {
      localStorage.removeItem("pcm-theme");
    }
  } catch {}
}

export function isIntroSeen() {
  try {
    return sessionStorage.getItem("pcm-intro-seen") === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem("pcm-intro-seen", "1");
  } catch {}
}
