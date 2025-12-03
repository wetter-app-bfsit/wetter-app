import "../../i18n/helper.js";

(function (global) {
  function renderPrivacySheet() {
    const container = document.getElementById("settings-privacy-body");
    if (!container) return;

    const t = global.i18n ? global.i18n.t : (key) => key;

    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section__title">${t("settings.privacy.title")}</h3>
        <h4 class="settings-section__subtitle">${t(
          "settings.privacy.storedDataTitle"
        )}</h4>
        <p class="settings-section__text">${t(
          "settings.privacy.storedDataIntro"
        )}</p>
        <ul class="settings-list">
          <li class="settings-section__text">${t(
            "settings.privacy.storedFavorites"
          )}</li>
          <li class="settings-section__text">${t(
            "settings.privacy.storedSettings"
          )}</li>
          <li class="settings-section__text">${t(
            "settings.privacy.storedCache"
          )}</li>
        </ul>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">${t(
          "settings.privacy.apisTitle"
        )}</h3>
        <p class="settings-section__text">${t("settings.privacy.apisIntro")}</p>
        <ul class="settings-list">
          <li class="settings-section__text">Open-Meteo</li>
          <li class="settings-section__text">BrightSky</li>
          <li class="settings-section__text">NOAA Alerts</li>
          <li class="settings-section__text">OpenStreetMap / Leaflet</li>
        </ul>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">Links</h3>
        <ul class="settings-links">
          <li><a href="legal/privacy.html" target="_blank">${t(
            "settings.privacy.privacyLink"
          )}</a></li>
          <li><a href="legal/terms.html" target="_blank">${t(
            "settings.privacy.termsLink"
          )}</a></li>
        </ul>
      </div>
    `;
  }

  global.PrivacyApiInfoSheet = { renderPrivacySheet };
})(window);
