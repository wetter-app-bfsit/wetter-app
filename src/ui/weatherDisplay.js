/* Wetter-Anzeige Component */

class WeatherDisplayComponent {
  constructor(currentContainerId, forecastContainerId) {
    this.currentContainer = document.getElementById(currentContainerId);
    this.forecastContainer = document.getElementById(forecastContainerId);
    this.currentData = null;
    this.timeIntervalId = null;
    this._forecastDetailHandlers = null;
    this._detailEscapeHandler = null;
  }
  displayCurrent(weatherData, city = "Standort") {
    if (!this.currentContainer) return;

    try {
      if (!weatherData) {
        this.showEmpty();
        return;
      }

      const open = weatherData.openMeteo || {};
      const bright = weatherData.brightSky || {};
      const openHourly = Array.isArray(open.hourly) ? open.hourly : [];
      const brightHourly = Array.isArray(bright.hourly) ? bright.hourly : [];
      const primarySeries = openHourly.length ? openHourly : brightHourly;
      const currentHour = primarySeries[0];

      if (!currentHour) {
        this.showError("Keine aktuellen Wetterdaten gefunden.");
        return;
      }

      const daySnapshot = Array.isArray(open.dayInsights)
        ? open.dayInsights[0]
        : null;
      const description =
        daySnapshot?.summary?.condition ||
        currentHour.description ||
        "Aktuelle Bedingungen";
      const feelsLike =
        typeof currentHour.feelsLike === "number"
          ? currentHour.feelsLike
          : currentHour.apparentTemperature;
      const dewPoint =
        typeof currentHour.dewPoint === "number"
          ? currentHour.dewPoint
          : daySnapshot?.summary?.dewPointAvg;
      const humidity =
        typeof currentHour.humidity === "number"
          ? currentHour.humidity
          : daySnapshot?.summary?.humidityAvg;
      const precipitationSum = daySnapshot?.summary?.precipitationSum;
      const precipitationProb = Array.isArray(
        daySnapshot?.precipitationTimeline
      )
        ? daySnapshot.precipitationTimeline.reduce((acc, slot) => {
            if (typeof slot?.probability !== "number") return acc;
            return Math.max(acc, slot.probability);
          }, 0)
        : currentHour.precipitationProbability || 0;
      const uvIndex =
        typeof daySnapshot?.summary?.uvIndexMax === "number"
          ? daySnapshot.summary.uvIndexMax
          : currentHour.uvIndex;
      const windCardinal = daySnapshot?.summary?.wind?.cardinal;
      const windDirection =
        windCardinal ||
        (typeof currentHour.windDirection === "number"
          ? `${Math.round(currentHour.windDirection)} deg`
          : null);

      const highlightMetrics = [
        {
          label: "Taupunkt",
          value: this._formatTempValue(dewPoint),
          hint: "Ø Tagesmittel",
        },
        {
          label: "Luftfeuchte",
          value: this._formatPercentValue(humidity),
          hint: "gemessen jetzt",
        },
        {
          label: "Niederschlag",
          value:
            typeof precipitationSum === "number"
              ? `${precipitationSum.toFixed(1)} mm`
              : this._formatMetricValue(currentHour.precipitation, " mm", 1),
          hint: `${Math.round(precipitationProb || 0)}% Wahrscheinlichkeit`,
        },
        {
          label: "Wind",
          value: this._formatWindValue(currentHour.windSpeed),
          hint: windDirection || "--",
        },
        {
          label: "UV Index",
          value:
            typeof uvIndex === "number" && !Number.isNaN(uvIndex)
              ? uvIndex.toFixed(1)
              : "--",
          hint: "Peak heute",
        },
        {
          label: "Luftdruck",
          value: this._formatMetricValue(currentHour.pressure, " hPa", 0),
          hint: "Meeresspiegeldruck",
        },
      ];

      const sunriseSunset = this._renderSunTrack(daySnapshot?.sun);
      const extremes = daySnapshot
        ? `
          <div class="current-extremes">
            <div><span>Max</span><strong>${this._formatTempValue(
              daySnapshot.summary?.tempMax
            )}</strong></div>
            <div><span>Min</span><strong>${this._formatTempValue(
              daySnapshot.summary?.tempMin
            )}</strong></div>
          </div>
        `
        : "";

      const highlightsHtml = highlightMetrics
        .map(
          (metric) => `
            <article class="current-highlight">
              <span class="label">${metric.label}</span>
              <strong>${metric.value || "--"}</strong>
              <small>${metric.hint || ""}</small>
            </article>
          `
        )
        .join("");

      const html = `
        <div class="weather-current advanced">
          <div class="location-header">
            <h2 class="location-name">📍 ${this._escapeHtml(city)}</h2>
            <div class="location-controls">
              <button id="favoriteToggle" class="btn-icon favorite-toggle" data-city="${this._escapeHtml(
                city
              )}" aria-label="Favorit hinzufügen">☆</button>
              <span class="location-time" id="current-time"></span>
            </div>
          </div>
          <div class="current-main">
            <div class="temperature-section">
              <span class="current-emoji" id="current-emoji">${
                currentHour.emoji || "❓"
              }</span>
              <span class="current-temp" id="current-temp">${this._formatTempValue(
                currentHour.temperature
              )}</span>
              <span class="current-description" id="current-desc">${this._escapeHtml(
                description
              )}</span>
              <small class="current-feels" id="feels-like">Gefühlt ${
                typeof feelsLike === "number"
                  ? this._formatTempValue(feelsLike)
                  : "--"
              }</small>
              ${extremes}
            </div>
            <div class="weather-details">
              <div class="detail-item">
                <span class="detail-label">💨 Wind</span>
                <span class="detail-value" id="wind-speed">${this._formatWindValue(
                  currentHour.windSpeed
                )}${windDirection ? ` · ${windDirection}` : ""}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">💧 Luftfeuchtigkeit</span>
                <span class="detail-value" id="humidity">${this._formatPercentValue(
                  humidity
                )}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">☔ Regen</span>
                <span class="detail-value">${
                  typeof currentHour.precipitation === "number"
                    ? `${currentHour.precipitation.toFixed(1)} mm`
                    : "--"
                }</span>
              </div>
            </div>
          </div>
          ${sunriseSunset}
          <div class="current-highlights">${highlightsHtml}</div>
          <div class="source-info" id="source-info">Daten werden geladen...</div>
        </div>
      `;

      this.currentContainer.innerHTML = html;
      this.currentData = weatherData;
      if (daySnapshot) {
        this._renderDailyInsightsPanel(daySnapshot);
      } else if (!Array.isArray(open.dayInsights) || !open.dayInsights.length) {
        this._renderDailyInsightsPanel(null);
      }
      this._updateCurrentTime();

      if (this.timeIntervalId) {
        clearInterval(this.timeIntervalId);
      }
      this.timeIntervalId = setInterval(() => this._updateCurrentTime(), 1000);

      const favBtn = document.getElementById("favoriteToggle");
      if (favBtn) {
        favBtn.dataset.city = city;
      }
      if (typeof window !== "undefined" && window.syncFavoriteToggleState) {
        window.syncFavoriteToggleState(city);
      }
    } catch (error) {
      console.error("Fehler beim Anzeigen der aktuellen Wetter:", error);
      this.currentContainer.innerHTML =
        "<p>Fehler beim Laden der Wetterdaten</p>";
    }
  }

  /**
   * Aktualisiert aktuelle Zeit-Anzeige
   * @private
   */
  _updateCurrentTime() {
    const timeEl = document.getElementById("current-time");
    if (timeEl) {
      const now = new Date();
      timeEl.textContent = now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  }

  /**
   * Zeigt Stundendaten an (horizontal scrollbar)
   * @param {array} hourlyData - Array von Stunden-Objekten
   * @param {string} source - API-Quelle
   */
  displayHourly(hourlyData, source = "") {
    const target =
      document.getElementById("hourly-section") || this.currentContainer;
    if (!target) return;

    try {
      if (!Array.isArray(hourlyData) || !hourlyData.length) {
        if (!target.dataset.hourlyInitialized) {
          target.innerHTML =
            '<div class="hourly-empty">Keine Stundendaten verfügbar.</div>';
          target.dataset.hourlyInitialized = "true";
        }
        return;
      }

      if (!target.dataset.hourlyInitialized) {
        target.innerHTML = "";
        target.dataset.hourlyInitialized = "true";
      }

      const hourlyHtml = `
        <article class="hourly-block" data-hourly-source="${
          source || "primär"
        }">
          <h3>⏰ Stundenvorhersage${
            source ? ` · ${this._escapeHtml(source)}` : ""
          }</h3>
          <div class="hourly-scroll">
            ${hourlyData
              .map((hour, idx) => {
                const date = new Date(hour.time);
                const hourStr = date.getHours().toString().padStart(2, "0");
                // Temperatur und Wind basierend auf eingestellten Einheiten formatieren
                const tempRaw =
                  typeof hour.temperature === "number"
                    ? hour.temperature
                    : null;
                const windRaw =
                  typeof hour.windSpeed === "number" ? hour.windSpeed : null; // assume m/s input

                const formatTemp = (c) => {
                  const unit = window.appState?.units?.temperature || "C";
                  if (c === null) return "--";
                  if (unit === "F") return `${((c * 9) / 5 + 32).toFixed(1)}°F`;
                  return `${c.toFixed(1)}°C`;
                };

                const formatWind = (mps) => {
                  const unit = window.appState?.units?.wind || "km/h";
                  if (mps === null) return "";
                  if (unit === "m/s") return `${mps.toFixed(1)} m/s`;
                  // default show km/h
                  return `${(mps * 3.6).toFixed(0)} km/h`;
                };

                const tempDisplay =
                  tempRaw === null ? "--" : formatTemp(tempRaw);
                const windDisplay =
                  windRaw === null
                    ? ""
                    : `<small>${formatWind(windRaw)}</small>`;

                return `
                <div class="hourly-item" data-hour="${idx}">
                  <div class="hour-time">${hourStr}:00</div>
                  <div class="hour-emoji">${hour.emoji || "❓"}</div>
                  <div class="hour-temp">${tempDisplay}</div>
                  ${windDisplay}
                </div>
              `;
              })
              .join("")}
          </div>
        </article>
      `;

      const existingBlock = target.querySelector(
        `[data-hourly-source="${source || "primär"}"]`
      );
      if (existingBlock) {
        existingBlock.outerHTML = hourlyHtml;
      } else {
        target.insertAdjacentHTML("beforeend", hourlyHtml);
      }

      const updatedBlock = target.querySelector(
        `[data-hourly-source="${source || "primär"}"]`
      );
      this._setupHourlyScroll(updatedBlock || target);
    } catch (error) {
      console.error("Fehler beim Anzeigen der Stundendaten:", error);
    }
  }

  /**
   * Zeigt mehrtägige Vorhersage an
   * @param {array} dailyData - Array von Tages-Objekten
   */
  displayForecast(dailyData) {
    if (!this.forecastContainer) return;

    try {
      const insights = window.appState?.renderData?.openMeteo?.dayInsights;
      if (Array.isArray(insights) && insights.length) {
        this._renderDailyInsightsPanel(insights[0]);
        const cards = insights
          .map((day, idx) => this._renderAdvancedForecastCard(day, idx))
          .join("");
        this.forecastContainer.innerHTML = `
        <section class="weather-forecast">
          <h2>📅 7-Tage Vorhersage</h2>
          <div class="forecast-grid advanced">
            ${cards}
          </div>
        </section>
      `;
        this._bindDayDetailHandlers(insights);
        return;
      }

      this._renderDailyInsightsPanel(null);

      const byDay = window.appState?.renderData?.openMeteo?.byDay || null;
      const days = byDay && byDay.length ? byDay : dailyData || [];

      if (!days.length) {
        this.forecastContainer.innerHTML =
          '<p class="empty-state">Keine Vorhersagedaten verfuegbar.</p>';
        return;
      }

      const dateLabel = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("de-DE", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
      };

      const formatTempDay = (value) => {
        const unit = window.appState?.units?.temperature || "C";
        if (typeof value !== "number") return "--";
        return `${Math.round(value)}°${unit}`;
      };
      const normalizeDay = (entry) => {
        if (entry.hours) return entry;
        return {
          date: entry.date,
          hours: [],
          tempMax: entry.tempMax,
          tempMin: entry.tempMin,
          emoji: entry.emoji,
        };
      };

      const normalizedDays = (
        byDay && byDay.length ? byDay : (dailyData || []).slice(0, 7)
      )
        .slice(0, 7)
        .map(normalizeDay);

      const buildSummaryCard = (dayObj, idx) => {
        const temps = Array.isArray(dayObj.hours)
          ? dayObj.hours
              .map((h) =>
                typeof h.temperature === "number" ? h.temperature : null
              )
              .filter((value) => value !== null)
          : [];
        const max = temps.length ? Math.max(...temps) : dayObj.tempMax ?? null;
        const min = temps.length ? Math.min(...temps) : dayObj.tempMin ?? null;
        const representativeHour =
          (dayObj.hours || []).find((h) => {
            const hour = new Date(h.time).getHours();
            return hour === 12;
          }) || (dayObj.hours || [])[0];

        const detailSamples = (dayObj.hours || [])
          .filter((_, hourIdx) => hourIdx % 3 === 0)
          .slice(0, 8);

        const detailHtml =
          detailSamples.length && idx < 3
            ? `<details class="forecast-details"${idx === 0 ? " open" : ""}>
              <summary>Stunden-Details</summary>
              <div class="forecast-detail-grid">
                ${detailSamples
                  .map((h) => {
                    const hour = new Date(h.time)
                      .getHours()
                      .toString()
                      .padStart(2, "0");
                    const temp =
                      typeof h.temperature === "number"
                        ? `${Math.round(h.temperature)}°`
                        : "--";
                    return `<div class="forecast-detail-cell">
                        <strong>${hour}:00</strong>
                        <span>${h.emoji || "❓"}</span>
                        <span>${temp}</span>
                      </div>`;
                  })
                  .join("")}
              </div>
            </details>`
            : "";

        return `
          <article class="forecast-card">
            <header class="forecast-card-header">
              <div>
                <p class="forecast-date">${dateLabel(dayObj.date)}</p>
                <small class="forecast-meta">${
                  representativeHour?.description || "Tagestrend"
                }</small>
              </div>
              <div class="forecast-emoji">${
                representativeHour?.emoji || dayObj.emoji || "❓"
              }</div>
            </header>
            <div class="forecast-temps">
              <div class="forecast-max">${formatTempDay(max)}</div>
              <div class="forecast-min">${formatTempDay(min)}</div>
            </div>
            ${detailHtml}
          </article>
        `;
      };

      const focusHours = normalizedDays[0]?.hours || [];
      const focusStrip = focusHours.length
        ? `<section class="forecast-focus">
            <h3>🎯 Heute im Stundenverlauf</h3>
            <div class="forecast-focus-strip">
              ${focusHours
                .slice(0, 12)
                .map((h) => {
                  const hour = new Date(h.time)
                    .getHours()
                    .toString()
                    .padStart(2, "0");
                  const temp =
                    typeof h.temperature === "number"
                      ? `${Math.round(h.temperature)}°`
                      : "--";
                  const wind =
                    typeof h.windSpeed === "number"
                      ? `<small>${Math.round(h.windSpeed)} ${
                          window.appState?.units?.wind || "km/h"
                        }</small>`
                      : "";
                  return `<div class="forecast-focus-item">
                      <span class="hour">${hour}:00</span>
                      <span class="emoji">${h.emoji || "❓"}</span>
                      <span class="temp">${temp}</span>
                      ${wind}
                    </div>`;
                })
                .join("")}
            </div>
          </section>`
        : "";

      this.forecastContainer.innerHTML = `
        <section class="weather-forecast">
          <h2>📅 7-Tage Vorhersage</h2>
          <div class="forecast-grid">
            ${normalizedDays.map(buildSummaryCard).join("")}
          </div>
        </section>
        ${focusStrip}
      `;
    } catch (error) {
      console.error("Fehler beim Anzeigen der Vorhersage:", error);
      this.forecastContainer.innerHTML =
        "<p>Fehler beim Laden der Vorhersage</p>";
    }
  }

  _renderAdvancedForecastCard(day, idx) {
    const tempHigh = this._formatTempValue(day?.summary?.tempMax);
    const tempLow = this._formatTempValue(day?.summary?.tempMin);
    const dewPoint = this._formatTempValue(day?.summary?.dewPointAvg);
    const humidity = this._formatPercentValue(day?.summary?.humidityAvg);
    const precipSum =
      typeof day?.summary?.precipitationSum === "number"
        ? `${day.summary.precipitationSum.toFixed(1)} mm`
        : "--";
    const windSpeed = this._formatWindValue(day?.summary?.wind?.avgSpeed);
    const condition = day?.summary?.condition || "Tagestrend";
    const uvChip = this._renderUvChip(day?.summary?.uvIndexMax);
    const sunTrack = this._renderSunTrack(day?.sun);
    const precipBars = this._renderPrecipBars(day?.precipitationTimeline);
    const windCompass = this._renderWindCompass(
      day?.summary?.wind?.directionDeg,
      day?.summary?.wind?.cardinal
    );
    const hourlyPreview = this._renderInlineHourGrid(day?.hourGrid);

    return `
      <article class="forecast-card advanced" data-day-index="${idx}" tabindex="0" aria-label="Vorhersage für ${
      day?.label
    }">
        <header class="forecast-card-header">
          <div>
            <p class="forecast-date">${day?.label || ""}</p>
            <small class="forecast-meta">${condition}</small>
          </div>
          <div class="forecast-emoji">${day?.emoji || "❓"}</div>
        </header>
        <div class="forecast-temps advanced">
          <div><span class="label">Max</span><span class="value">${tempHigh}</span></div>
          <div><span class="label">Min</span><span class="value">${tempLow}</span></div>
          <div><span class="label">Taupunkt</span><span class="value">${dewPoint}</span></div>
        </div>
        <div class="forecast-metrics">
          <div class="metric-block">
            <span class="metric-label">Wind</span>
            ${windCompass}
            <span class="metric-value">${windSpeed}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">Feuchtigkeit</span>
            <span class="metric-value">${humidity}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">Niederschlag</span>
            <span class="metric-value">${precipSum}</span>
          </div>
          <div class="metric-block">
            <span class="metric-label">UV</span>
            ${uvChip}
          </div>
        </div>
        ${sunTrack}
        <div class="precip-timeline" aria-label="Niederschlag pro Stunde">
          ${precipBars}
        </div>
        ${hourlyPreview}
        <button type="button" class="forecast-card-action">Tagesdetails</button>
      </article>
    `;
  }

  _renderWindCompass(directionDeg, cardinal) {
    if (typeof directionDeg !== "number" || Number.isNaN(directionDeg)) {
      return '<div class="wind-compass is-empty">--</div>';
    }
    const label = cardinal || `${Math.round(directionDeg)}°`;
    return `
      <div class="wind-compass" aria-label="Windrichtung ${label}">
        <span class="wind-compass-rose"></span>
        <span class="wind-compass-arrow" style="transform: rotate(${directionDeg}deg);"></span>
        <span class="wind-compass-label">${label}</span>
      </div>
    `;
  }

  _renderSunTrack(sun) {
    if (!sun || (!sun.sunrise && !sun.sunset)) return "";
    const sunrise = this._formatTimeLabel(sun.sunrise) || "--:--";
    const sunset = this._formatTimeLabel(sun.sunset) || "--:--";
    const start =
      typeof sun.sunrisePercent === "number" ? sun.sunrisePercent : 0;
    const end = typeof sun.sunsetPercent === "number" ? sun.sunsetPercent : 100;
    const daylight =
      typeof sun.daylightMinutes === "number"
        ? `${Math.floor(sun.daylightMinutes / 60)}h ${
            sun.daylightMinutes % 60
          }m Licht`
        : "";
    return `
      <div class="sun-track">
        <div class="sun-track-times">
          <span>🌅 ${sunrise}</span>
          <span>🌇 ${sunset}</span>
        </div>
        <div class="sun-track-bar">
          <span class="sun-track-daylight" style="--sunrise:${start}%; --sunset:${end}%;"></span>
        </div>
        ${daylight ? `<small class="sun-track-label">${daylight}</small>` : ""}
      </div>
    `;
  }

  _renderPrecipBars(timeline = []) {
    if (!Array.isArray(timeline) || !timeline.length) {
      return '<div class="precip-bars empty">Keine Daten</div>';
    }
    return `
      <div class="precip-bars">
        ${timeline
          .slice(0, 24)
          .map((slot) => {
            const amount = typeof slot.amount === "number" ? slot.amount : 0;
            const prob =
              typeof slot.probability === "number"
                ? `${slot.probability}%`
                : "";
            const capped = Math.min(amount, 5);
            const height = (capped / 5) * 100;
            const classes = ["precip-bar"];
            if (slot.isDay === 0) classes.push("is-night");
            return `<span class="${classes.join(
              " "
            )}" style="--precip-height:${height}%;" title="${
              slot.hour
            }:00 · ${amount.toFixed(1)}mm ${prob}"></span>`;
          })
          .join("")}
      </div>
    `;
  }

  _renderInlineHourGrid(hourGrid = []) {
    if (!Array.isArray(hourGrid) || !hourGrid.length) {
      return "";
    }
    const cells = hourGrid
      .slice(0, 24)
      .map((slot) => {
        const hourLabel = (slot?.hour ?? 0).toString().padStart(2, "0");
        const temp =
          typeof slot?.temperature === "number"
            ? `${Math.round(slot.temperature)}°`
            : "–";
        const classes = ["inline-hour-cell"];
        if (slot?.isDay === 0) classes.push("is-night");
        return `<span class="${classes.join(
          " "
        )}"><strong>${hourLabel}</strong>${temp}</span>`;
      })
      .join("");
    return `<div class="inline-hour-grid">${cells}</div>`;
  }

  _renderUvChip(value) {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return '<span class="uv-chip uv-unknown">--</span>';
    }
    let severity = "low";
    let label = "niedrig";
    if (value >= 8) {
      severity = "extreme";
      label = "sehr hoch";
    } else if (value >= 6) {
      severity = "high";
      label = "hoch";
    } else if (value >= 3) {
      severity = "moderate";
      label = "mittel";
    }
    return `<span class="uv-chip uv-${severity}">UV ${value.toFixed(
      1
    )} · ${label}</span>`;
  }

  _renderHourlyMatrix(days, options = {}) {
    if (!Array.isArray(days) || !days.length) return "";
    const title =
      typeof options.title === "string"
        ? options.title
        : "🕒 7×24 Stundenraster";
    const sectionClasses = ["hourly-matrix"];
    if (options.compact) sectionClasses.push("is-compact");
    const headerCells = Array.from({ length: 24 }, (_, hour) => {
      const label = hour.toString().padStart(2, "0");
      return `<span class="matrix-cell matrix-header-cell">${label}</span>`;
    }).join("");
    const rows = days.map((day) => this._renderHourlyMatrixRow(day)).join("");
    return `
      <section class="${sectionClasses.join(" ")}">
        ${title ? `<h3>${title}</h3>` : ""}
        <div class="hourly-matrix-grid">
          <div class="hourly-matrix-row matrix-header">
            <div class="matrix-day-label">Tag</div>
            <div class="matrix-hour-cells">${headerCells}</div>
          </div>
          ${rows}
        </div>
      </section>
    `;
  }

  _renderHourlyMatrixRow(day) {
    const cells = (
      day?.hourGrid ||
      Array.from({ length: 24 }, (_, idx) => ({
        hour: idx,
      }))
    )
      .map((slot) => {
        const temp =
          typeof slot.temperature === "number"
            ? `${Math.round(slot.temperature)}°`
            : "–";
        const prob =
          typeof slot.precipitationProbability === "number"
            ? `<small>${slot.precipitationProbability}%</small>`
            : "";
        const classes = ["matrix-cell"];
        if (slot.isDay === 0) classes.push("is-night");
        if (typeof slot.precipitation === "number" && slot.precipitation > 0) {
          classes.push("has-rain");
        }
        const emoji = slot.emoji || "·";
        return `<span class="${classes.join(" ")}" title="${day?.label || ""} ${
          slot.hour
        }:00 · ${temp}">
            <span class="matrix-emoji">${emoji}</span>
            <span class="matrix-temp">${temp}</span>
            ${prob}
          </span>`;
      })
      .join("");

    return `
      <div class="hourly-matrix-row">
        <div class="matrix-day-label">${day?.label || ""}</div>
        <div class="matrix-hour-cells">${cells}</div>
      </div>
    `;
  }

  _renderDailyInsightsPanel(day) {
    const container = document.getElementById("daily-insights");
    if (!container) return;
    if (!day) {
      container.innerHTML = `
        <div class="insights-empty">
          <p>📈 Tagesverlauf steht nach einer Ortssuche bereit.</p>
        </div>`;
      return;
    }

    const hourGrid = Array.isArray(day.hourGrid) ? day.hourGrid : [];
    const dewSeries = hourGrid.map((slot) =>
      typeof slot?.dewPoint === "number" ? slot.dewPoint : null
    );
    const humiditySeries = hourGrid.map((slot) =>
      typeof slot?.humidity === "number" ? slot.humidity : null
    );
    const windDirectionSeries = hourGrid.map((slot) =>
      typeof slot?.windDirection === "number" ? slot.windDirection : null
    );
    const precipSeries = (day.precipitationTimeline || []).map((slot) =>
      typeof slot?.amount === "number" ? slot.amount : 0
    );
    const precipProbabilities = (day.precipitationTimeline || []).map((slot) =>
      typeof slot?.probability === "number" ? slot.probability : 0
    );
    const uvSeries = (day.uvTimeline || []).map((slot) =>
      typeof slot?.value === "number" ? slot.value : null
    );
    const sunSeries = hourGrid.map((slot) =>
      typeof slot?.isDay === "number" ? slot.isDay : slot?.isDay ? 1 : 0
    );
    const daylightMinutes = day.sun?.daylightMinutes ?? null;
    const daylightLabel =
      typeof daylightMinutes === "number"
        ? `${Math.floor(daylightMinutes / 60)}h ${daylightMinutes % 60}m Licht`
        : "";

    const peakProbability = precipProbabilities.length
      ? Math.max(...precipProbabilities)
      : 0;

    const cards = [
      this._renderInsightCard({
        title: "Sonnenpfad",
        primary: `${this._formatTimeLabel(day.sun?.sunrise) || "–"} · ${
          this._formatTimeLabel(day.sun?.sunset) || "–"
        }`,
        secondary: daylightLabel,
        sparkline: this._buildSparkline(sunSeries, {
          min: 0,
          max: 1,
          area: true,
        }),
        metaStart: "Tag",
        metaEnd:
          typeof day.sun?.sunrisePercent === "number"
            ? `${Math.round(day.sun.sunrisePercent)}%`
            : "",
      }),
      this._renderInsightCard({
        title: "Taupunkt",
        primary: this._formatTempValue(day.summary?.dewPointAvg),
        secondary: "Ø Tagesmittel",
        sparkline: this._buildSparkline(dewSeries, { area: true }),
        metaStart: "Max",
        metaEnd: this._formatTempValue(
          dewSeries.reduce(
            (acc, value) =>
              typeof value === "number" && (acc === null || value > acc)
                ? value
                : acc,
            null
          )
        ),
      }),
      this._renderInsightCard({
        title: "Wind",
        primary: this._formatWindValue(day.summary?.wind?.avgSpeed),
        secondary: day.summary?.wind?.cardinal || "-",
        sparkline: this._buildSparkline(windDirectionSeries, {
          min: 0,
          max: 360,
        }),
        metaStart: "Max",
        metaEnd: this._formatWindValue(day.summary?.wind?.maxSpeed),
      }),
      this._renderInsightCard({
        title: "Luftfeuchtigkeit",
        primary: this._formatPercentValue(day.summary?.humidityAvg),
        sparkline: this._buildSparkline(humiditySeries, { area: true }),
        metaStart: "Min",
        metaEnd: this._formatPercentValue(
          humiditySeries.reduce(
            (acc, value) =>
              typeof value === "number" && (acc === null || value < acc)
                ? value
                : acc,
            null
          )
        ),
      }),
      this._renderInsightCard({
        title: "Niederschlag",
        primary:
          typeof day.summary?.precipitationSum === "number"
            ? `${day.summary.precipitationSum.toFixed(1)} mm`
            : "–",
        sparkline: this._buildSparkline(precipSeries, { area: true }),
        metaStart: "Wahrsch.",
        metaEnd: `${Math.round(peakProbability)}%`,
      }),
      this._renderInsightCard({
        title: "UV Index",
        primary:
          typeof day.summary?.uvIndexMax === "number"
            ? day.summary.uvIndexMax.toFixed(1)
            : "–",
        sparkline: this._buildSparkline(uvSeries, { area: true }),
        metaStart: "Mitte",
        metaEnd: day.summary?.condition || "",
      }),
    ].filter(Boolean);

    container.innerHTML = `
      <div class="section-title">
        <h3>🔎 Tagesinsights · ${day.label || ""}</h3>
        <small>${day.summary?.condition || ""}</small>
      </div>
      <div class="insights-grid">
        ${cards.join("")}
      </div>
    `;
  }

  _renderInsightCard({
    title,
    primary,
    secondary,
    sparkline,
    metaStart,
    metaEnd,
  }) {
    return `
      <article class="insight-card">
        <h4>${title || ""}</h4>
        <strong>${primary || "–"}</strong>
        ${secondary ? `<small>${secondary}</small>` : ""}
        ${sparkline || ""}
        ${
          metaStart || metaEnd
            ? `<div class="insight-meta"><span>${metaStart || ""}</span><span>${
                metaEnd || ""
              }</span></div>`
            : ""
        }
      </article>
    `;
  }

  _buildSparkline(series = [], options = {}) {
    const sanitized = series
      .map((value, index) => ({ value, index }))
      .filter((entry) => typeof entry.value === "number");
    if (!sanitized.length) {
      return '<svg class="sparkline" viewBox="0 0 100 40"></svg>';
    }
    const minValue =
      typeof options.min === "number"
        ? options.min
        : Math.min(...sanitized.map((entry) => entry.value));
    let maxValue =
      typeof options.max === "number"
        ? options.max
        : Math.max(...sanitized.map((entry) => entry.value));
    if (maxValue === minValue) {
      maxValue += 1;
    }
    const width = 100;
    const height = 40;
    const totalSteps = Math.max(series.length - 1, 1);
    const points = sanitized
      .map((entry) => {
        const x = (entry.index / totalSteps) * width;
        const normalized = (entry.value - minValue) / (maxValue - minValue);
        const y = height - normalized * height;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(" ");
    const areaPath = options.area
      ? `<polygon points="0,${height} ${points} ${width},${height}" fill="currentColor" opacity="0.2"></polygon>`
      : "";
    return `
      <svg class="sparkline${
        options.area ? " sparkline--area" : ""
      }" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none">
        ${areaPath}
        <polyline points="${points}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    `;
  }

  _bindDayDetailHandlers(days) {
    if (!this.forecastContainer) return;
    if (this._forecastDetailHandlers) {
      this.forecastContainer.removeEventListener(
        "click",
        this._forecastDetailHandlers.click
      );
      this.forecastContainer.removeEventListener(
        "keydown",
        this._forecastDetailHandlers.key
      );
      this._forecastDetailHandlers = null;
    }
    if (!Array.isArray(days) || !days.length) return;

    const cards = this.forecastContainer.querySelectorAll(
      ".forecast-card[data-day-index]"
    );
    cards.forEach((card, index) => {
      card.dataset.dayIndex = String(index);
    });

    const handleOpen = (event) => {
      const card = event.target.closest(".forecast-card[data-day-index]");
      if (!card) return;
      const index = Number(card.dataset.dayIndex);
      if (Number.isNaN(index)) return;
      event.preventDefault();
      this._openDayDetail(days[index]);
    };

    const handleKey = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      handleOpen(event);
    };

    this.forecastContainer.addEventListener("click", handleOpen);
    this.forecastContainer.addEventListener("keydown", handleKey);
    this._forecastDetailHandlers = { click: handleOpen, key: handleKey };
  }

  _openDayDetail(day) {
    if (!day) return;
    const modal = document.getElementById("day-detail-modal");
    if (!modal) return;
    modal.innerHTML = `
      <div class="day-detail-panel">
        <button type="button" class="day-detail-close" aria-label="Tagesdetails schließen">&times;</button>
        ${this._renderDayDetailBody(day)}
      </div>
    `;
    modal.classList.add("is-visible");
    const closeBtn = modal.querySelector(".day-detail-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this._closeDayDetail());
      setTimeout(() => closeBtn.focus(), 0);
    }
    const dismiss = (event) => {
      if (event.target === modal) {
        this._closeDayDetail();
      }
    };
    modal.addEventListener("click", dismiss, { once: true });
    this._detailEscapeHandler = (event) => {
      if (event.key === "Escape") {
        this._closeDayDetail();
      }
    };
    document.addEventListener("keydown", this._detailEscapeHandler);
  }

  _closeDayDetail() {
    const modal = document.getElementById("day-detail-modal");
    if (modal) {
      modal.classList.remove("is-visible");
      modal.innerHTML = "";
    }
    if (this._detailEscapeHandler) {
      document.removeEventListener("keydown", this._detailEscapeHandler);
      this._detailEscapeHandler = null;
    }
  }

  _renderDayDetailBody(day) {
    const stats = [
      { label: "Max", value: this._formatTempValue(day?.summary?.tempMax) },
      { label: "Min", value: this._formatTempValue(day?.summary?.tempMin) },
      {
        label: "Taupunkt",
        value: this._formatTempValue(day?.summary?.dewPointAvg),
      },
      {
        label: "Feuchte",
        value: this._formatPercentValue(day?.summary?.humidityAvg),
      },
      {
        label: "Wind",
        value: this._formatWindValue(day?.summary?.wind?.avgSpeed),
      },
      {
        label: "UV",
        value:
          typeof day?.summary?.uvIndexMax === "number"
            ? day.summary.uvIndexMax.toFixed(1)
            : "--",
      },
    ];

    const statsHtml = stats
      .map(
        (entry) => `
          <article>
            <span>${entry.label}</span>
            <strong>${entry.value}</strong>
          </article>
        `
      )
      .join("");

    const detailInsights = [
      this._renderInsightCard({
        title: "Luftfeuchtigkeit",
        primary: this._formatPercentValue(day?.summary?.humidityAvg),
        sparkline: this._buildSparkline(
          (day.hourGrid || []).map((slot) => slot?.humidity ?? null),
          { area: true }
        ),
      }),
      this._renderInsightCard({
        title: "Niederschlag",
        primary:
          typeof day.summary?.precipitationSum === "number"
            ? `${day.summary.precipitationSum.toFixed(1)} mm`
            : "--",
        sparkline: this._buildSparkline(
          (day.precipitationTimeline || []).map((slot) => slot?.amount ?? 0),
          { area: true }
        ),
      }),
      this._renderInsightCard({
        title: "Wind",
        primary: `${this._formatWindValue(day?.summary?.wind?.avgSpeed)} · ${
          day?.summary?.wind?.cardinal || "-"
        }`,
        sparkline: this._buildSparkline(
          (day.hourGrid || []).map((slot) => slot?.windDirection ?? null),
          { min: 0, max: 360 }
        ),
      }),
      this._renderInsightCard({
        title: "UV Index",
        primary:
          typeof day.summary?.uvIndexMax === "number"
            ? day.summary.uvIndexMax.toFixed(1)
            : "--",
        sparkline: this._buildSparkline(
          (day.uvTimeline || []).map((slot) => slot?.value ?? null),
          { area: true }
        ),
      }),
    ].join("");

    const matrix = this._renderHourlyMatrix([day], {
      title: "",
      compact: true,
    });

    return `
      <header class="day-detail-header">
        <p class="forecast-date">${day?.label || ""}</p>
        <h3>${day?.summary?.condition || "Tagesdetails"}</h3>
        ${
          day?.sun
            ? `<small>🌅 ${
                this._formatTimeLabel(day.sun.sunrise) || "–"
              } · 🌇 ${this._formatTimeLabel(day.sun.sunset) || "–"}</small>`
            : ""
        }
      </header>
      <div class="day-detail-body">
        <div class="day-detail-stats">${statsHtml}</div>
        <div class="insights-grid">${detailInsights}</div>
        ${matrix}
      </div>
    `;
  }

  _formatTempValue(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    const unit = window.appState?.units?.temperature || "C";
    return `${Math.round(value)}°${unit}`;
  }

  _formatWindValue(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    const unit = window.appState?.units?.wind || "km/h";
    const formatted = unit === "m/s" ? value.toFixed(1) : Math.round(value);
    const suffix = unit === "mph" ? " mph" : unit === "m/s" ? " m/s" : " km/h";
    return `${formatted}${suffix}`;
  }

  _formatPercentValue(value) {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    return `${Math.round(value)}%`;
  }

  _formatMetricValue(value, suffix = "", digits = 1) {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    return `${value.toFixed(digits)}${suffix}`;
  }

  _formatTimeLabel(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Aktualisiert Quellen-Information
   * @param {array} sources - Array von Quellen-Objekten {name, success, duration}
   */
  updateSourceInfo(sources) {
    const sourceInfoEl = document.getElementById("source-info");
    if (!sourceInfoEl) return;

    const html = sources
      .map((src) => {
        const statusIcon = src.success ? "✅" : "❌";
        const duration = src.duration ? ` (${src.duration}ms)` : "";
        return `
        <div class="source-item">
          ${statusIcon} <strong>${src.name}</strong>${duration}
        </div>
      `;
      })
      .join("");

    sourceInfoEl.innerHTML = `<div class="sources-list">${html}</div>`;
  }

  /**
   * Zeigt detaillierten Vergleich zwischen zwei API-Quellen
   * @param {object|null} openData - Open-Meteo aktuelle Data (first hour) or null
   * @param {object|null} brightData - BrightSky aktuelle Data (first hour) or null
   * @param {array} sources - sources metadata
   */
  showSourcesComparison(openData, brightData, sources = []) {
    try {
      const section = document.getElementById("sources-comparison");
      if (section) {
        if (!openData && !brightData) section.style.display = "none";
        else section.style.display = "";
      }
      const openEl = document.querySelector(
        "#source-openmeteo .source-content"
      );
      const brightEl = document.querySelector(
        "#source-brightsky .source-content"
      );

      const unitTemp = window.appState?.units?.temperature || "C";
      const unitWind = window.appState?.units?.wind || "km/h";
      const fmt = (v, unit = "") =>
        v === null || v === undefined ? "–" : `${v}${unit}`;

      // Helper to extract current metrics
      const extract = (d, sourceName) => {
        if (!d)
          return {
            temp: null,
            wind: null,
            humidity: null,
            note: "keine Daten",
          };
        // d may be either full API raw or formatted hourly array; try common fields
        let temp = null,
          wind = null,
          humidity = null,
          emoji = "";
        if (Array.isArray(d.hourly) && d.hourly.length) {
          const h = d.hourly[0];
          temp = h.temperature;
          wind = h.windSpeed;
          humidity = h.humidity;
          emoji = h.emoji || "";
        } else if (d.temperature !== undefined) {
          temp = d.temperature;
          wind = d.windSpeed;
          humidity = d.relativeHumidity || d.humidity || null;
          emoji = d.emoji || "";
        }
        const srcMeta = sources.find((s) =>
          s.name.toLowerCase().includes(sourceName.toLowerCase())
        );
        const status = srcMeta
          ? srcMeta.success
            ? "OK"
            : "FEHLER"
          : "unbekannt";
        const duration =
          srcMeta && srcMeta.duration ? `${srcMeta.duration}ms` : "";
        return { temp, wind, humidity, emoji, status, duration };
      };

      const o = extract(openData, "Open-Meteo");
      const b = extract(brightData, "BrightSky");

      if (openEl) {
        openEl.innerHTML = `
          <div class="source-compare">
            <div><strong>Aktuell:</strong> ${o.emoji || ""} ${fmt(
          o.temp,
          unitTemp === "F" ? "°F" : "°C"
        )}</div>
            <div>Wind: ${fmt(
              o.wind,
              unitWind === "m/s" ? " m/s" : " km/h"
            )}</div>
            <div>Luft: ${fmt(o.humidity, "%")}</div>
            <div>Status: ${o.status} ${
          o.duration ? "(" + o.duration + ")" : ""
        }</div>
          </div>
        `;
      }

      if (brightEl) {
        brightEl.innerHTML = `
          <div class="source-compare">
            <div><strong>Aktuell:</strong> ${b.emoji || ""} ${fmt(
          b.temp,
          unitTemp === "F" ? "°F" : "°C"
        )}</div>
            <div>Wind: ${fmt(
              b.wind,
              unitWind === "m/s" ? " m/s" : " km/h"
            )}</div>
            <div>Luft: ${fmt(b.humidity, "%")}</div>
            <div>Status: ${b.status} ${
          b.duration ? "(" + b.duration + ")" : ""
        }</div>
          </div>
        `;
      }
    } catch (e) {
      console.warn("showSourcesComparison failed", e);
    }
  }

  /**
   * Aktualisiert aktuelle Wetter-Werte
   * @param {object} data - {temp, windSpeed, humidity, feelsLike, emoji, description}
   */
  updateCurrentValues(data) {
    // Temperatur formatieren (angenommen input in °C)
    if (data.temp !== undefined) {
      const tempEl = document.getElementById("current-temp");
      if (tempEl) {
        const unit = window.appState?.units?.temperature || "C";
        const t = data.temp;
        tempEl.textContent =
          unit === "F"
            ? `${((t * 9) / 5 + 32).toFixed(1)}°F`
            : `${t.toFixed(1)}°C`;
      }
    }

    // Wind formatieren (eingehend angenommen in m/s)
    if (data.windSpeed !== undefined) {
      const windEl = document.getElementById("wind-speed");
      if (windEl) {
        const unit = window.appState?.units?.wind || "km/h";
        const mps = data.windSpeed;
        if (unit === "m/s") windEl.textContent = `${mps.toFixed(1)} m/s`;
        else windEl.textContent = `${(mps * 3.6).toFixed(0)} km/h`;
      }
    }

    if (data.humidity !== undefined) {
      const humidityEl = document.getElementById("humidity");
      if (humidityEl) humidityEl.textContent = `${data.humidity}%`;
    }

    if (data.feelsLike !== undefined) {
      const feelsEl = document.getElementById("feels-like");
      if (feelsEl) feelsEl.textContent = `${data.feelsLike.toFixed(1)}°C`;
    }

    if (data.emoji) {
      const emojiEl = document.getElementById("current-emoji");
      if (emojiEl) emojiEl.textContent = data.emoji;
    }

    if (data.description) {
      const descEl = document.getElementById("current-desc");
      if (descEl) descEl.textContent = data.description;
    }
  }

  /**
   * Zeigt Loading-State
   */
  showLoading() {
    if (this.currentContainer) {
      this.currentContainer.innerHTML = `
        <div class="loading-state">
          <div class="spinner">🔄</div>
          <p>Wetterdaten werden geladen...</p>
        </div>
      `;
    }
  }

  /**
   * Setup Horizontales Scrolling für Stundendaten
   * @private
   */
  _setupHourlyScroll(scope) {
    const root = scope || this.currentContainer;
    const scrollContainer = root?.querySelector(".hourly-scroll");
    if (!scrollContainer) return;

    let isDown = false;
    let startX;
    let scrollLeft;

    scrollContainer.addEventListener("mousedown", (e) => {
      isDown = true;
      startX = e.pageX - scrollContainer.offsetLeft;
      scrollLeft = scrollContainer.scrollLeft;
    });

    scrollContainer.addEventListener("mouseleave", () => {
      isDown = false;
    });

    scrollContainer.addEventListener("mouseup", () => {
      isDown = false;
    });

    scrollContainer.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - scrollContainer.offsetLeft;
      const walk = (x - startX) * 1;
      scrollContainer.scrollLeft = scrollLeft - walk;
    });
  }

  /**
   * HTML-Escape für Sicherheit
   * @private
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Zeigt Empty-State
   */
  showEmpty() {
    if (this.currentContainer) {
      this.currentContainer.innerHTML = `
        <div class="empty-state">
          <p>🔍 Geben Sie einen Ort ein um Wetterdaten zu sehen</p>
        </div>
      `;
    }
  }

  /**
   * Zeigt Error-State
   */
  showError(errorMessage) {
    if (this.currentContainer) {
      this.currentContainer.innerHTML = `
        <div class="error-state">
          <p>❌ ${this._escapeHtml(errorMessage)}</p>
        </div>
      `;
    }
  }
}
