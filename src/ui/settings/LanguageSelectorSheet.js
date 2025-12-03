import "../../i18n/helper.js";

(function (global) {
  function renderLanguageSheet(appState) {
    const container = document.getElementById("settings-language-body");
    if (!container || !global.i18n) return;

    const current = global.i18n.getLanguage();

    container.innerHTML = `
      <div class="settings-options">
        ${option("de", "🇩🇪", "Deutsch", current)}
        ${option("en", "🇬🇧", "English", current)}
      </div>
    `;

    container.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        applyLanguage(appState, lang);
        renderLanguageSheet(appState);
        if (global.SettingsHome && global.SettingsHome.renderSettingsHome) {
          global.SettingsHome.renderSettingsHome(appState);
        }
      });
    });
  }

  function option(value, icon, title, current) {
    const active = current === value ? " settings-option--active" : "";
    return `
      <button
        type="button"
        class="settings-option${active}"
        data-lang="${value}"
      >
        <span class="settings-option__icon">${icon}</span>
        <span class="settings-option__title">${title}</span>
      </button>
    `;
  }

  function applyLanguage(appState, lang) {
    if (!appState.settings) appState.settings = {};
    appState.settings.locale = lang;
    try {
      localStorage.setItem("app-language", lang);
    } catch (e) {}
    global.i18n.setLanguage(lang);
  }

  global.LanguageSelectorSheet = { renderLanguageSheet };
})(window);
