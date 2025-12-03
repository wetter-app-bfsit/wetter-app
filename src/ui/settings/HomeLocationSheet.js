(function (global) {
  function renderHomeSheet(appState) {
    const container = document.getElementById("settings-home-body");
    if (!container) return;

    const t = global.i18n ? global.i18n.t : (key) => key;

    const home = appState.homeLocation || appState.home || null;
    const favorites = appState.favorites || [];

    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section__title">${t("settings.home.title")}</h3>
        <p class="settings-section__text">
          ${home ? home.city : t("settings.home.noHome")}
        </p>
        <button type="button" class="settings-secondary-btn" id="home-clear-btn" ${
          home ? "" : "disabled"
        }>
          ${t("settings.home.clear")}
        </button>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">${t(
          "settings.home.favoritesTitle"
        )}</h3>
        <div class="settings-list">
          ${
            favorites.length === 0
              ? `<p class="settings-section__text">${t(
                  "settings.home.noFavorites"
                )}</p>`
              : favorites
                  .map(
                    (fav, idx) => `
              <button
                type="button"
                class="settings-list-item"
                data-fav-index="${idx}"
              >
                ${fav.city}
              </button>`
                  )
                  .join("")
          }
        </div>
      </div>
    `;

    const clearBtn = document.getElementById("home-clear-btn");
    if (clearBtn && home && appState.clearHomeLocation) {
      clearBtn.addEventListener("click", () => {
        appState.clearHomeLocation();
        renderHomeSheet(appState);
      });
    }

    container.querySelectorAll("[data-fav-index]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-fav-index"), 10);
        const fav = favorites[idx];
        if (!fav || !appState.setHomeLocation) return;
        appState.setHomeLocation(fav.city, fav.coords);
        renderHomeSheet(appState);
      });
    });
  }

  global.HomeLocationSheet = { renderHomeSheet };
})(window);
