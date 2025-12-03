(function (global) {
  function renderAboutSheet() {
    const container = document.getElementById("settings-about-body");
    if (!container) return;

    const t = global.i18n ? global.i18n.t : (key) => key;
    const version = global.APP_VERSION || "0.2.0";

    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section__title">Calchas</h3>
        <p class="settings-section__text">
          Version ${version}
        </p>
        <p class="settings-section__text">
          Diese App nutzt Open-Meteo, BrightSky, NOAA Alerts und weitere
          Quellen für umfassende Wetterdaten.
        </p>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">Rechtliches</h3>
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

  global.AboutSheet = { renderAboutSheet };
})(window);
