/**
 * features.js - Makes all extra features functional
 * Maps, Alerts, Historical Charts, Analytics
 */

// ============================================
// 1. LEAFLET MAPS INTEGRATION
// ============================================

class WeatherMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.marker = null;
  }

  init(lat, lng, cityName) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) {
      container.innerHTML = `<p style="color: #c0392b; padding: 20px;">Karte konnte nicht geladen werden: Ungültige Koordinaten</p>`;
      return;
    }

    // Clear existing map completely
    if (this.map) {
      try {
        this.map.remove();
      } catch (e) {
        console.warn("Map cleanup warning:", e);
      }
      this.map = null;
      this.marker = null;
    }

    // Reset Leaflet container to avoid "already initialized" errors
    if (container._leaflet_id) {
      try {
        container._leaflet_id = null;
      } catch (e) {
        console.warn("Leaflet container reset failed:", e);
      }
    }

    // Clear container HTML to reset Leaflet state
    container.innerHTML = "";

    // Initialize Leaflet map
    try {
      this.map = L.map(this.containerId).setView([safeLat, safeLng], 10);

      // Add OSM tile layer
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(this.map);

      // Add marker
      this.marker = L.marker([safeLat, safeLng]).addTo(this.map);
      this.marker
        .bindPopup(
          `<b>${cityName}</b><br>Lat: ${safeLat.toFixed(
            2
          )}, Lng: ${safeLng.toFixed(2)}`
        )
        .openPopup();

      console.log("✅ Map initialized:", cityName);
    } catch (e) {
      console.error("❌ Map initialization failed:", e);
      container.innerHTML = `<p style="color: red; padding: 20px;">Karte konnte nicht geladen werden: ${e.message}</p>`;
    }
  }

  updateLocation(lat, lng, cityName) {
    const safeLat = Number(lat);
    const safeLng = Number(lng);
    if (!Number.isFinite(safeLat) || !Number.isFinite(safeLng)) {
      this.init(lat, lng, cityName);
      return;
    }

    if (!this.map) {
      this.init(safeLat, safeLng, cityName);
      return;
    }

    this.map.setView([safeLat, safeLng], 10);

    if (this.marker) {
      this.marker.setLatLng([safeLat, safeLng]);
      this.marker.setPopupContent(
        `<b>${cityName}</b><br>Lat: ${safeLat.toFixed(
          2
        )}, Lng: ${safeLng.toFixed(2)}`
      );
    } else {
      this.marker = L.marker([safeLat, safeLng]).addTo(this.map);
      this.marker
        .bindPopup(
          `<b>${cityName}</b><br>Lat: ${safeLat.toFixed(
            2
          )}, Lng: ${safeLng.toFixed(2)}`
        )
        .openPopup();
    }
  }
}

// ============================================
// 2. WEATHER ALERTS (MeteoAlarm-style)
// ============================================

class WeatherAlerts {
  constructor(containerId) {
    this.containerId = containerId;
  }

  async fetchAlerts(lat, lng, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML =
      '<p style="padding: 20px; text-align: center;">🔄 Lade Wetterwarnungen...</p>';

    try {
      // Simulate MeteoAlarm data (in production, use real API)
      // For now, check Open-Meteo for severe weather codes
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&hourly=temperature_2m,apparent_temperature,weathercode,windspeed_10m,precipitation_probability,precipitation&timezone=auto`
      );

      if (!response.ok) throw new Error("API Fehler");

      const data = await response.json();
      const alerts = this.analyzeWeatherData(data, city);

      this.renderAlerts(alerts, city);
    } catch (e) {
      console.error("Alerts fetch error:", e);
      container.innerHTML = `<p style="color: #666; padding: 20px; text-align: center;">⚠️ Keine Warnungen verfügbar (${e.message})</p>`;
    }
  }

  analyzeWeatherData(data, city) {
    const alerts = [];
    const current = data.current || {};
    const hourly = data.hourly || {};
    const issued = new Set();
    const formatTime = (iso) =>
      new Date(iso || Date.now()).toLocaleString("de-DE", {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });

    const pushAlert = (key, payload) => {
      if (issued.has(key)) return;
      issued.add(key);
      alerts.push({
        ...payload,
        time: formatTime(payload.time),
      });
    };

    // Current conditions first
    if (typeof current.windspeed_10m === "number") {
      if (current.windspeed_10m >= 65) {
        pushAlert("wind-now-red", {
          severity: "red",
          icon: "🌪️",
          title: "Akute Sturmwarnung",
          description: `Orkanartige Böen bis ${current.windspeed_10m.toFixed(
            0
          )} km/h in ${city}.`,
          time: Date.now(),
        });
      } else if (current.windspeed_10m >= 45) {
        pushAlert("wind-now-orange", {
          severity: "orange",
          icon: "💨",
          title: "Starke Böen",
          description: `Aktuell ${current.windspeed_10m.toFixed(
            0
          )} km/h. Gegenstände sichern!`,
          time: Date.now(),
        });
      }
    }

    if (typeof current.temperature_2m === "number") {
      if (current.temperature_2m >= 33) {
        pushAlert("heat-now", {
          severity: "orange",
          icon: "🔥",
          title: "Hitzewarnung",
          description: `Gefühlte Hitze über 33°C. Viel trinken!`,
          time: Date.now(),
        });
      } else if (current.temperature_2m <= -8) {
        pushAlert("cold-now", {
          severity: "orange",
          icon: "❄️",
          title: "Frostwarnung",
          description: `Extrem niedrige Temperaturen (${current.temperature_2m.toFixed(
            1
          )}°C).`,
          time: Date.now(),
        });
      }
    }

    if ([95, 96, 99].includes(current.weathercode)) {
      pushAlert("storm-now", {
        severity: "red",
        icon: "⛈️",
        title: "Gewitterwarnung",
        description: "Gewitter mit Hagel oder Starkregen in der Nähe.",
        time: Date.now(),
      });
    }

    // Forecast horizon (~48h)
    const times = hourly.time || [];
    const winds = hourly.windspeed_10m || [];
    const precipProb = hourly.precipitation_probability || [];
    const precip = hourly.precipitation || [];
    const apparent = hourly.apparent_temperature || [];
    const codes = hourly.weathercode || [];
    const horizon = Math.min(times.length, 48);

    for (let i = 0; i < horizon; i += 1) {
      const isoTime = times[i];
      const wind = winds[i];
      const prob = precipProb[i];
      const rain = precip[i];
      const feels = apparent[i];
      const code = codes[i];

      if (typeof wind === "number" && wind >= 70) {
        pushAlert("wind-forecast", {
          severity: "red",
          icon: "🌪️",
          title: "Schwerer Sturm erwartet",
          description: `Böen bis ${wind.toFixed(0)} km/h am ${formatTime(
            isoTime
          )}. Outdoor-Aktivitäten vermeiden!`,
          time: isoTime,
        });
      } else if (typeof wind === "number" && wind >= 55) {
        pushAlert("wind-forecast-orange", {
          severity: "orange",
          icon: "💨",
          title: "Sturmböen in Vorbereitung",
          description: `Vorhersage meldet ${wind.toFixed(
            0
          )} km/h. Gartenmöbel sichern!`,
          time: isoTime,
        });
      }

      if (
        typeof prob === "number" &&
        prob >= 80 &&
        typeof rain === "number" &&
        rain >= 5
      ) {
        pushAlert("rain-heavy", {
          severity: "orange",
          icon: "🌧️",
          title: "Starkregen möglich",
          description: `Niederschlag ≥ ${rain.toFixed(
            1
          )} mm (${prob}% Wahrscheinlichkeit).`,
          time: isoTime,
        });
      }

      if (typeof feels === "number" && feels <= -12) {
        pushAlert("frost-forecast", {
          severity: "yellow",
          icon: "🧊",
          title: "Strenger Frost",
          description: `Gefühlte Temperatur ${feels.toFixed(
            1
          )}°C in den Morgenstunden.`,
          time: isoTime,
        });
      }

      if ([95, 96, 99].includes(code)) {
        pushAlert("storm-forecast", {
          severity: "red",
          icon: "⛈️",
          title: "Gewitterfront im Anmarsch",
          description:
            "Blitz, Donner und Hagel laut Prognose. Bitte Schutz suchen!",
          time: isoTime,
        });
      } else if ([82, 86].includes(code)) {
        pushAlert("rain-squall", {
          severity: "orange",
          icon: "🌧️",
          title: "Schauerbänder",
          description: "Kurzzeitig sehr starker Regen möglich.",
          time: isoTime,
        });
      }
    }

    return alerts;
  }

  renderAlerts(alerts, city) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error("Alerts container not found:", this.containerId);
      return;
    }

    if (!Array.isArray(alerts) || alerts.length === 0) {
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #d4edda; border-radius: 8px; color: #155724;">
          <div style="font-size: 3rem; margin-bottom: 16px;">✅</div>
          <h3 style="margin: 0 0 8px 0;">Keine aktuellen Warnungen</h3>
          <p style="margin: 0;">Für ${city} liegen derzeit keine Wetterwarnungen vor.</p>
        </div>
      `;
      console.log("✅ No alerts for", city);
      return;
    }

    const html = alerts
      .map(
        (alert) => `
      <div class="alert-card alert-${alert.severity}" style="
        padding: 16px;
        margin-bottom: 16px;
        border-left: 4px solid ${
          alert.severity === "red"
            ? "#dc3545"
            : alert.severity === "orange"
            ? "#fd7e14"
            : "#ffc107"
        };
        background: ${
          alert.severity === "red"
            ? "#f8d7da"
            : alert.severity === "orange"
            ? "#fff3cd"
            : "#d1ecf1"
        };
        border-radius: 8px;
      ">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="font-size: 2rem;">${alert.icon}</div>
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #000;">${alert.title}</h3>
            <p style="margin: 0 0 8px 0; color: #333;">${alert.description}</p>
            <small style="color: #666;">Zeitpunkt: ${alert.time}</small>
          </div>
        </div>
      </div>
    `
      )
      .join("");

    container.innerHTML = `
      <div style="margin-bottom: 16px;">
        <p style="font-weight: 600; color: #dc3545;">⚠️ ${alerts.length} aktive Warnung(en) für ${city}</p>
      </div>
      ${html}
    `;
  }
}

// ============================================
// 3. HISTORICAL WEATHER CHARTS
// ============================================

class HistoricalChart {
  constructor(containerId) {
    this.containerId = containerId;
    this.chart = null;
  }

  async fetchAndRender(lat, lon, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    container.innerHTML =
      '<p style="padding: 20px; text-align: center;">📊 Lade historische Daten...</p>';

    try {
      const safeLat = Number(lat);
      const safeLon = Number(lon);
      if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon)) {
        throw new Error("Ungültige Koordinaten für historische Daten");
      }

      // Prepare shared date window
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1); // Yesterday (archive data is delayed)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 8); // 8 days ago

      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      // Try Meteostat first if API key is available
      const canUseMeteostat =
        window.apiKeyManager &&
        window.apiKeyManager.hasKey &&
        window.apiKeyManager.hasKey("meteostat") &&
        typeof MeteostatAPI === "function";
      if (canUseMeteostat) {
        const used = await this.fetchViaMeteostat(
          safeLat,
          safeLon,
          city,
          start,
          end
        );
        if (used) {
          return;
        }
      }

      console.log(`Fetching historical data (fallback): ${start} to ${end}`);

      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${safeLat}&longitude=${safeLon}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      this.renderChart(data, city);
      if (canUseMeteostat) {
        window.updateApiStatusEntry?.("meteostat", {
          id: "meteostat",
          name: "Meteostat",
          state: "warning",
          message: "Fallback auf Open-Meteo Archiv",
        });
      }
    } catch (e) {
      console.error("Historical data error:", e);
      container.innerHTML = `
        <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
          <p style="color: #666; margin: 0;">📈 Historische Daten nicht verfügbar</p>
          <small style="color: #999;">${e.message}</small>
        </div>
      `;
      window.updateApiStatusEntry?.("meteostat", {
        id: "meteostat",
        name: "Meteostat",
        state: "error",
        message: e.message,
      });
    }
  }

  async fetchViaMeteostat(lat, lon, city, start, end) {
    try {
      const api = new MeteostatAPI();
      const key = window.apiKeyManager.getKey("meteostat");
      const result = await api.fetchHistorical(lat, lon, start, end, key);
      if (result.error || !result.daily || !result.daily.length) {
        throw new Error(result.error || "Keine Meteostat Daten");
      }
      const converted = this.meteostatToDailyPayload(result.daily);
      this.renderChart(converted, city);
      window.updateApiStatusEntry?.("meteostat", {
        id: "meteostat",
        name: "Meteostat",
        state: "online",
        message: "Live · Historische Daten",
        duration: result.duration,
      });
      return true;
    } catch (err) {
      console.warn("Meteostat fetch failed, falling back:", err.message);
      window.updateApiStatusEntry?.("meteostat", {
        id: "meteostat",
        name: "Meteostat",
        state: "warning",
        message: err.message || "Meteostat nicht verfügbar",
      });
      return false;
    }
  }

  meteostatToDailyPayload(entries) {
    const time = entries.map((d) => d.date);
    const max = entries.map((d) =>
      typeof d.temp_max === "number"
        ? d.temp_max
        : typeof d.temp_avg === "number"
        ? d.temp_avg
        : null
    );
    const min = entries.map((d) =>
      typeof d.temp_min === "number"
        ? d.temp_min
        : typeof d.temp_avg === "number"
        ? d.temp_avg
        : null
    );
    return {
      daily: {
        time,
        temperature_2m_max: max,
        temperature_2m_min: min,
        precipitation_sum: entries.map((d) =>
          typeof d.precipitation === "number" ? d.precipitation : 0
        ),
      },
    };
  }

  renderChart(data, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    // Clear existing content
    container.innerHTML =
      '<canvas id="historical-canvas" style="max-height: 400px;"></canvas>';

    const canvas = document.getElementById("historical-canvas");
    if (!canvas) return;

    const daily = data.daily || {};
    const labels = (daily.time || []).map((d) => {
      const date = new Date(d);
      return date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "short",
      });
    });

    // Destroy existing chart
    if (this.chart) {
      this.chart.destroy();
    }

    // Create chart
    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Max Temp (°C)",
            data: daily.temperature_2m_max || [],
            borderColor: "#dc3545",
            backgroundColor: "rgba(220, 53, 69, 0.1)",
            tension: 0.3,
          },
          {
            label: "Min Temp (°C)",
            data: daily.temperature_2m_min || [],
            borderColor: "#007bff",
            backgroundColor: "rgba(0, 123, 255, 0.1)",
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          title: {
            display: true,
            text: `Temperaturverlauf - ${city} (Letzte 7 Tage)`,
          },
          legend: {
            position: "bottom",
          },
        },
        scales: {
          y: {
            title: {
              display: true,
              text: "Temperatur (°C)",
            },
          },
        },
      },
    });
  }
}

// ============================================
// 4. ANALYTICS MODULE
// ============================================

class Analytics {
  constructor() {
    this.events = this.loadEvents();
    // Enable by default if not set
    const savedSetting = localStorage.getItem("wetter_analytics_enabled");
    this.enabled = savedSetting === null ? true : savedSetting === "true";
    if (savedSetting === null) {
      localStorage.setItem("wetter_analytics_enabled", "true");
    }
  }

  loadEvents() {
    try {
      return JSON.parse(
        localStorage.getItem("wetter_analytics_events") || "[]"
      );
    } catch (e) {
      return [];
    }
  }

  saveEvents() {
    try {
      localStorage.setItem(
        "wetter_analytics_events",
        JSON.stringify(this.events)
      );
    } catch (e) {
      console.warn("Analytics save failed:", e);
    }
  }

  logEvent(type, data = {}) {
    if (!this.enabled) return;

    this.events.push({
      type,
      data,
      timestamp: Date.now(),
    });

    if (this.events.length > 1000) {
      this.events = this.events.slice(-500); // Keep last 500
    }

    this.saveEvents();
  }

  getStats() {
    const searches = this.events.filter((e) => e.type === "search").length;
    const apiCalls = this.events.filter((e) => e.type === "api_call").length;
    const cacheHits = this.events.filter((e) => e.type === "cache_hit").length;
    const favActions = this.events.filter(
      (e) => e.type === "favorite_action"
    ).length;

    return {
      searches,
      apiCalls,
      cacheHits,
      favActions,
      total: this.events.length,
    };
  }

  exportData() {
    return JSON.stringify(
      {
        events: this.events,
        stats: this.getStats(),
        exportDate: new Date().toISOString(),
      },
      null,
      2
    );
  }

  renderDashboard(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const stats = this.getStats();

    container.innerHTML = `
      <div style="padding: 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 16px;">
        <h3 style="margin-bottom: 16px;">📊 Nutzungsstatistiken</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px;">
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #007BFF;">${
              stats.searches
            }</div>
            <div style="color: #666; margin-top: 8px;">Suchanfragen</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #28a745;">${
              stats.apiCalls
            }</div>
            <div style="color: #666; margin-top: 8px;">API Calls</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #ffc107;">${
              stats.cacheHits
            }</div>
            <div style="color: #666; margin-top: 8px;">Cache Hits</div>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); text-align: center;">
            <div style="font-size: 2.5rem; font-weight: bold; color: #17a2b8;">${
              stats.favActions
            }</div>
            <div style="color: #666; margin-top: 8px;">Favoriten</div>
          </div>
        </div>
        <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="analytics-toggle" ${
              this.enabled ? "checked" : ""
            }
                   style="width: 20px; height: 20px; cursor: pointer;">
            <span>Analytics aktiviert (Daten werden nur lokal gespeichert)</span>
          </label>
        </div>
      </div>
      <button id="export-analytics-btn" class="btn-secondary" style="margin-top: 16px;">📥 Analytics exportieren (JSON)</button>
    `;

    // Wire up toggle
    const toggle = document.getElementById("analytics-toggle");
    if (toggle) {
      toggle.addEventListener("change", (e) => {
        this.enabled = e.target.checked;
        localStorage.setItem("wetter_analytics_enabled", String(this.enabled));
        console.log("Analytics:", this.enabled ? "enabled" : "disabled");
      });
    }

    // Wire up export
    const exportBtn = document.getElementById("export-analytics-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const data = this.exportData();
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wetter-analytics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }
}

// Export globally
window.WeatherMap = WeatherMap;
window.WeatherAlerts = WeatherAlerts;
window.HistoricalChart = HistoricalChart;
window.Analytics = Analytics;
