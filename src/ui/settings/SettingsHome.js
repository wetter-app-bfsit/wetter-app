import "../../i18n/helper.js";

(function (global) {
  function renderSettingsHome(appState) {
    const container = document.getElementById("settings-home-container");
    if (!container) return;

    const { t } = global.i18n || {};
    const tr = (key) => (t ? t(key) : key);

    container.innerHTML = `
      <div class="settings-home">
        ${renderCard(
          "appearance",
          "🎨",
          tr("settings.group.appearance"),
          tr("settings.subtitle.appearance"),
          "sheet-settings-theme"
        )}
        ${renderCard(
          "home",
          "📍",
          tr("settings.group.home"),
          tr("settings.subtitle.home"),
          "sheet-settings-home"
        )}
        ${renderCard(
          "units",
          "📏",
          tr("settings.group.units"),
          tr("settings.subtitle.units"),
          "sheet-settings-units"
        )}
        ${renderCard(
          "background",
          "⏱️",
          tr("settings.group.background"),
          tr("settings.subtitle.background"),
          "sheet-settings-background"
        )}
        ${renderCard(
          "models",
          "☁️",
          tr("settings.group.models"),
          tr("settings.subtitle.models"),
          "sheet-settings-models"
        )}
        ${renderCard(
          "language",
          "🌐",
          tr("settings.group.language"),
          `${tr("settings.languageLabel")}: ${
            (global.i18n &&
              global.i18n.getLanguage &&
              global.i18n.getLanguage() === "en" &&
              tr("settings.languageValueEn")) ||
            tr("settings.languageValueDe")
          }`,
          "sheet-settings-language"
        )}
        ${renderCard(
          "export",
          "📤",
          tr("settings.group.export"),
          tr("settings.subtitle.export"),
          "sheet-settings-export"
        )}
        ${renderCard(
          "import",
          "📥",
          tr("settings.group.import"),
          tr("settings.subtitle.import"),
          "sheet-settings-import"
        )}
        ${renderCard(
          "community",
          "👥",
          tr("settings.group.community"),
          tr("settings.subtitle.community"),
          "sheet-settings-community"
        )}
        ${renderCard(
          "privacy",
          "🔒",
          tr("settings.privacy.title"),
          tr("settings.subtitle.about"),
          "sheet-settings-privacy"
        )}
        ${renderCard(
          "about",
          "ℹ️",
          tr("settings.group.about"),
          tr("settings.subtitle.about"),
          "sheet-settings-about"
        )}
      </div>
    `;
  }

  function renderCard(key, icon, title, subtitle, sheetId) {
    return `
      <button
        class="settings-card"
        type="button"
        data-bottom-sheet="${sheetId}"
        data-settings-key="${key}"
      >
        <span class="settings-card__icon">${icon}</span>
        <span class="settings-card__content">
          <span class="settings-card__title">${title}</span>
          <span class="settings-card__subtitle">${subtitle}</span>
        </span>
      </button>
    `;
  }

  global.SettingsHome = {
    renderSettingsHome,
  };
})(window);
