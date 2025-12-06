/**
 * HomeLocationSheet.js - Heimatort-Verwaltung
 * Design inspiriert von WeatherMaster App
 */
(function (global) {
  function renderHomeSheet(appState) {
    const container = document.getElementById("settings-home-body");
    if (!container) return;

    const t = global.i18n
      ? global.i18n.t
      : (key) => {
          const fallbacks = {
            "settings.home.title": "Aktueller Heimatort",
            "settings.home.noHome": "Nicht gesetzt",
            "settings.home.clear": "Zurücksetzen",
            "settings.home.favoritesTitle": "Favoriten",
            "settings.home.noFavorites": "Keine Favoriten gespeichert",
            "settings.home.setAsHome": "Als Heimatort setzen",
          };
          return fallbacks[key] || key;
        };

    const home = appState.homeLocation || appState.home || null;
    const favorites = appState.favorites || [];

    container.innerHTML = `
      <div class="home-settings">
        <div class="home-section">
          <h3 class="home-section__title">${t("settings.home.title")}</h3>
          <div class="home-current">
            <span class="home-current__icon">📍</span>
            <span class="home-current__text">${
              home
                ? `${home.city}${home.country ? ", " + home.country : ""}`
                : t("settings.home.noHome")
            }</span>
          </div>
          <button type="button" class="home-clear-btn" id="home-clear-btn" ${
            home ? "" : "disabled"
          }>
            ${t("settings.home.clear")}
          </button>
        </div>

        <div class="home-section">
          <h3 class="home-section__title">${t(
            "settings.home.favoritesTitle"
          )}</h3>
          <div class="home-favorites">
            ${
              favorites.length === 0
                ? `<p class="home-section__empty">${t(
                    "settings.home.noFavorites"
                  )}</p>`
                : favorites
                    .map(
                      (fav, idx) => `
                  <button
                    type="button"
                    class="home-favorite-item"
                    data-fav-index="${idx}"
                  >
                    <span class="home-favorite-item__icon">⭐</span>
                    <span class="home-favorite-item__text">${fav.city}</span>
                    <span class="home-favorite-item__action">${t(
                      "settings.home.setAsHome"
                    )}</span>
                  </button>`
                    )
                    .join("")
            }
          </div>
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
        appState.setHomeLocation(fav.city, fav.coords, {
          country: fav.country,
          countryCode: fav.countryCode,
        });
        renderHomeSheet(appState);
      });
    });
  }

  global.HomeLocationSheet = { renderHomeSheet };
})(window);
