(function (global) {
  function formatTemperature(value, unit) {
    if (value == null || isNaN(value)) return "–";
    const rounded = Math.round(value);
    return `${rounded}°${unit === "F" ? "F" : "C"}`;
  }

  function buildHeroHtml(data) {
    const {
      locationName,
      country,
      description,
      temp,
      feelsLike,
      tempMax,
      tempMin,
      precipProb,
      humidity,
      windSpeed,
      uvIndex,
      iconHtml,
      updatedLabel,
      tempUnit,
      windUnit,
    } = data;

    return `
      <div class="weather-hero__scene" aria-hidden="true">
        <div id="frog-hero-pond" class="frog-hero-pond">
          <canvas id="frog-hero-canvas" class="frog-hero-canvas"></canvas>
        </div>
      </div>

      <div class="weather-hero__top">
        <div class="weather-hero__now">
          <div class="weather-hero__temp-row">
            <span class="weather-hero__temp">${formatTemperature(
              temp,
              tempUnit
            )}</span>
            <span class="weather-hero__icon">${iconHtml || ""}</span>
          </div>
          <div class="weather-hero__description">
            <p>${description || ""}</p>
            <p class="weather-hero__feels">Gefühlt ${formatTemperature(
              feelsLike,
              tempUnit
            )}</p>
          </div>
        </div>
        <div class="weather-hero__meta">
          <p class="weather-hero__location">${
            locationName || "Noch kein Ort"
          }</p>
          <p class="weather-hero__country">${country || ""}</p>
          <p class="weather-hero__updated">${updatedLabel || ""}</p>
        </div>
      </div>

      <div class="weather-hero__band">
        <span>↑ ${formatTemperature(tempMax, tempUnit)}</span>
        <span>↓ ${formatTemperature(tempMin, tempUnit)}</span>
        ${
          typeof precipProb === "number"
            ? `<span>Regenwahrscheinlichkeit ${Math.round(precipProb)}%</span>`
            : ""
        }
      </div>

      <div class="weather-hero__chips">
        ${
          typeof humidity === "number"
            ? `<span>Luftfeuchtigkeit ${Math.round(humidity)}%</span>`
            : ""
        }
        ${
          typeof windSpeed === "number"
            ? `<span>Wind ${Math.round(windSpeed)} ${windUnit || "km/h"}</span>`
            : ""
        }
        ${typeof uvIndex === "number" ? `<span>UV ${uvIndex}</span>` : ""}
      </div>
    `;
  }

  function renderWeatherHero(appState, helpers) {
    const heroEl = document.getElementById("weather-hero");
    const barLocationEl = document.getElementById("app-bar-location");
    if (!heroEl) return;

    const current = appState.current || appState.currentWeather || {};
    const daily = (appState.daily && appState.daily[0]) || {};
    const location = appState.location || {};

    const tempUnit = appState.temperatureUnit || "C";
    const windUnit = appState.windUnit || "km/h";

    const iconHtml =
      helpers &&
      helpers.iconForCode &&
      helpers.iconForCode(current.weatherCode, current.isDay);

    const updatedLabel =
      helpers && helpers.formatUpdatedAt
        ? helpers.formatUpdatedAt(appState.lastUpdated)
        : "";

    const data = {
      locationName: location.name || location.cityName,
      country: location.country,
      description: current.description || current.summary,
      temp: current.temperature,
      feelsLike: current.apparentTemperature || current.feelsLike,
      tempMax: daily.temperatureMax || daily.maxTemp,
      tempMin: daily.temperatureMin || daily.minTemp,
      precipProb: current.precipProb || daily.precipProbMax,
      humidity: current.humidity,
      windSpeed: current.windSpeed,
      uvIndex: current.uvIndex,
      iconHtml,
      updatedLabel,
      tempUnit,
      windUnit,
    };

    heroEl.innerHTML = buildHeroHtml(data);

    if (global.FrogHeroPlayer && global.FrogHeroPlayer.renderFrogHero) {
      try {
        global.FrogHeroPlayer.renderFrogHero(current);
      } catch (e) {
        console.warn("FrogHero konnte nicht gerendert werden", e);
      }
    }

    if (barLocationEl && data.locationName) {
      barLocationEl.textContent = data.locationName;
    }
  }

  global.WeatherHero = { renderWeatherHero };
})(window);
