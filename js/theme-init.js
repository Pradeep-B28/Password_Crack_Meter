// Runs before first paint to apply stored theme and skip intro if already seen.
(function () {
  try {
    var saved = localStorage.getItem("pcm-theme");
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = saved === "dark" || (!saved && prefersDark);
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }

    var introSeen = sessionStorage.getItem("pcm-intro-seen");
    var prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (introSeen === "1" || prefersReduced) {
      document.documentElement.classList.add("no-intro");
    }
  } catch (e) {}
})();
