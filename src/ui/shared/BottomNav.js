(function (global) {
  let currentView = "home";

  function setActive(viewId) {
    currentView = viewId;
    const buttons = document.querySelectorAll("[data-nav-target]");
    buttons.forEach((btn) => {
      const target = btn.getAttribute("data-nav-target");
      btn.classList.toggle("bottom-nav__button--active", target === viewId);
    });

    const sections = document.querySelectorAll("[data-view]");
    sections.forEach((section) => {
      const id = section.getAttribute("data-view");
      section.hidden = id !== viewId;
    });

    const scrollContainer = document.querySelector(".app-main-views");
    if (scrollContainer && typeof scrollContainer.scrollTo === "function") {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function initBottomNav() {
    const container = document.getElementById("bottom-nav");
    if (!container) return;

    container.addEventListener("click", (event) => {
      const target = event.target.closest("[data-nav-target]");
      if (!target) return;
      const viewId = target.getAttribute("data-nav-target");
      if (!viewId) return;
      setActive(viewId);
    });

    // initial
    setActive(currentView);
  }

  global.BottomNav = { initBottomNav, setActive };
})(window);
