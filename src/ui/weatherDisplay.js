/* Wetter-Anzeige Component */

class WeatherDisplayComponent {
  constructor(currentContainerId, forecastContainerId) {
    this.currentContainer = document.getElementById(currentContainerId);
    this.forecastContainer = document.getElementById(forecastContainerId);
    this.currentData = null;
    this.timeIntervalId = null;
  }

  /**
   * Zeigt aktuelle Wetter-Daten an
   * @param {object} weatherData - Aktuelle Wetterdaten
   * @param {string} city - Stadtname
   */
  displayCurrent(weatherData, city) {
    if (!this.currentContainer) return;

    try {
      const html = `
        <div class="weather-current">
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
              <span class="current-emoji" id="current-emoji">☀️</span>
              <span class="current-temp" id="current-temp">--°C</span>
              <span class="current-description" id="current-desc">--</span>
            </div>

            <div class="weather-details">
              <div class="detail-item">
                <span class="detail-label">💨 Wind</span>
                <span class="detail-value" id="wind-speed">-- km/h</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">💧 Luftfeuchtigkeit</span>
                <span class="detail-value" id="humidity">-- %</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">🌡️ Gefühlt wie</span>
                <span class="detail-value" id="feels-like">--°C</span>
              </div>
            </div>
          </div>

          <div class="source-info" id="source-info">
            Daten werden geladen...
          </div>
        </div>
      `;

      this.currentContainer.innerHTML = html;
      this.currentData = weatherData;
      this._updateCurrentTime();

      if (this.timeIntervalId) {
        clearInterval(this.timeIntervalId);
      }
      this.timeIntervalId = setInterval(() => this._updateCurrentTime(), 1000);

      if (typeof window !== "undefined") {
        const favBtn = document.getElementById("favoriteToggle");
        if (favBtn) {
          favBtn.dataset.city = city;
        }
        if (window.syncFavoriteToggleState) {
          window.syncFavoriteToggleState(city);
        }
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
    if (!this.currentContainer) return;

    try {
      const hourlyHtml = `
        <div class="hourly-section">
          <h3>⏰ Stundenvorhersage</h3>
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
        </div>
      `;

      this.currentContainer.innerHTML += hourlyHtml;
      this._setupHourlyScroll();
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
  _setupHourlyScroll() {
    const scrollContainer =
      this.currentContainer?.querySelector(".hourly-scroll");
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
