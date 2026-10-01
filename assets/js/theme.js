(() => {
  const key = "visualizers-theme";
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem(key);
    root.dataset.theme = saved === "dark" ? "dark" : "light";
  } catch {
    root.dataset.theme = "light";
  }

  function updateToggle() {
    const light = root.dataset.theme === "light";
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.textContent = light ? "☾ 다크 모드" : "☀ 라이트 모드";
      button.setAttribute("aria-label", light ? "다크 모드로 전환" : "라이트 모드로 전환");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-theme-toggle]").forEach(button => {
      button.addEventListener("click", () => {
        root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
        try { localStorage.setItem(key, root.dataset.theme); } catch { /* 저장이 불가능해도 현재 페이지에서는 전환 */ }
        updateToggle();
      });
    });
    updateToggle();
  });

  window.addEventListener("storage", event => {
    if (event.key !== key) return;
    root.dataset.theme = event.newValue === "dark" ? "dark" : "light";
    updateToggle();
  });
})();
