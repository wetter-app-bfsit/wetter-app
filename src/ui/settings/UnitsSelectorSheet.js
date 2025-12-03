(function (global) {
  function renderUnitsSheet(appState) {
    const container = document.getElementById("settings-units-body");
    if (!container) return;

    const t = global.i18n ? global.i18n.t : (key) => key;

    const settings = appState.settings || {};
    const units = settings.units || {
      temp: "C",
      wind: "kmh",
      pressure: "hPa",
      precip: "mm",
      aqi: "eu",
    };

    container.innerHTML = `
      <div class="settings-section">
        <h3 class="settings-section__title">${t(
          "settings.units.tempTitle"
        )}</h3>
        <div class="settings-options">
          ${unitOption("temp", "C", "°C", units.temp)}
          ${unitOption("temp", "F", "°F", units.temp)}
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">${t(
          "settings.units.windTitle"
        )}</h3>
        <div class="settings-options">
          ${unitOption("wind", "kmh", "km/h", units.wind)}
          ${unitOption("wind", "ms", "m/s", units.wind)}
          ${unitOption("wind", "mph", "mph", units.wind)}
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">${t(
          "settings.units.pressureTitle"
        )}</h3>
        <div class="settings-options">
          ${unitOption(
            "pressure",
            "hPa",
            t("settings.units.pressure_hPa"),
            units.pressure
          )}
          ${unitOption(
            "pressure",
            "mmHg",
            t("settings.units.pressure_mmHg"),
            units.pressure
          )}
          ${unitOption(
            "pressure",
            "inHg",
            t("settings.units.pressure_inHg"),
            units.pressure
          )}
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">${t(
          "settings.units.precipTitle"
        )}</h3>
        <div class="settings-options">
          ${unitOption(
            "precip",
            "mm",
            t("settings.units.precip_mm"),
            units.precip
          )}
          ${unitOption(
            "precip",
            "in",
            t("settings.units.precip_in"),
            units.precip
          )}
        </div>
      </div>
      <div class="settings-section">
        <h3 class="settings-section__title">${t("settings.units.aqiTitle")}</h3>
        <div class="settings-options">
          ${unitOption("aqi", "eu", t("settings.units.aqi_eu"), units.aqi)}
          ${unitOption("aqi", "us", t("settings.units.aqi_us"), units.aqi)}
        </div>
      </div>
    `;

    container.querySelectorAll("[data-unit-kind]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const kind = btn.getAttribute("data-unit-kind");
        const value = btn.getAttribute("data-unit-value");
        applyUnit(appState, kind, value);
        renderUnitsSheet(appState);
      });
    });
  }

  function unitOption(kind, value, label, current) {
    const active = current === value ? " settings-option--active" : "";
    return `
      <button
        type="button"
        class="settings-option${active}"
        data-unit-kind="${kind}"
        data-unit-value="${value}"
      >
        <span class="settings-option__title">${label}</span>
      </button>
    `;
  }

  function applyUnit(appState, kind, value) {
    if (!appState.settings) appState.settings = {};
    if (!appState.settings.units) appState.settings.units = {};
    appState.settings.units[kind] = value;
    try {
      localStorage.setItem(
        "wetter_units",
        JSON.stringify(appState.settings.units)
      );
    } catch (e) {}
  }

  global.UnitsSelectorSheet = { renderUnitsSheet };
})(window);
