try {
  const preference = window.localStorage.getItem("chromaforge-theme");
  if (preference === "light" || preference === "dark") {
    document.documentElement.dataset.theme = preference;
  }
} catch {
  // System preference remains the fallback when browser storage is unavailable.
}
