/**
 * features.js - Additional UI modules used by app.js
 * Weather map, alert aggregation, historical charts and local analytics.
 */

// ============================================
// 1. LEAFLET MAP / OVERLAYS
// ============================================

class WeatherMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.marker = null;
    this.baseLayer = null;
    this.layerControl = null;
    this.overlayLookup = new Map();
    this.overlayConfigs = this._buildOverlayConfig();
    this.statusEl = null;
    this.noticeEl = null;
    this.currentOverlay = null;
    this.rainViewerTileUrl = null;
    this.rainViewerFetchedAt = 0;
    this.rainViewerPromise = null;
    this.overlayEventsBound = false;
  }

  init(lat, lon, city) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn("WeatherMap container missing", this.containerId);
      return;
    }

    if (typeof L === "undefined") {
      container.innerHTML =
        '<div class="map-unavailable">Leaflet nicht geladen - Karte deaktiviert</div>';
      return;
    }

    if (!this.map) {
      this._createMap(lat, lon);
      this._ensureOverlayStatus();
      this._injectOverlayNotice(container);
    }

    this._setMarker(lat, lon, city);
    this.map.setView([lat, lon], 10);
  }

  _createMap(lat, lon) {
    this.map = L.map(this.containerId, {
      preferCanvas: true,
      zoomControl: true,
    }).setView([lat, lon], 10);

    this.baseLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "OpenStreetMap contributors",
        maxZoom: 18,
      }
    ).addTo(this.map);

    this.refreshOverlays();
  }

  _setMarker(lat, lon, city) {
    if (!this.map) return;

    if (this.marker) {
      this.marker.setLatLng([lat, lon]);
      this.marker.setPopupContent(`<strong>${city || "Standort"}</strong>`);
    } else {
      this.marker = L.marker([lat, lon]).addTo(this.map);
      this.marker.bindPopup(`<strong>${city || "Standort"}</strong>`);
    }
  }

  _buildOverlayConfig() {
    return [
      {
        key: "radar",
        label: "Regenradar (RainViewer)",
        provider: "RainViewer",
        attribution: " RainViewer",
        url: "https://tilecache.rainviewer.com/v2/radar/nowcast_0/512/{z}/{x}/{y}/2/1_1.png",
      },
      {
        key: "owm-clouds",
        label: "Wolkendecke (OWM)",
        provider: "OpenWeatherMap",
        requiresKey: true,
        template:
          "https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid={API_KEY}",
      },
      {
        key: "owm-temp",
        label: "Temperatur (OWM)",
        provider: "OpenWeatherMap",
        requiresKey: true,
        template:
          "https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid={API_KEY}",
      },
    ];
  }

  _buildOverlayLayers() {
    if (!this.map) return;

    const overlays = {};
    const locked = [];
    let pendingRainViewer = false;

    this.overlayLookup.clear();

    this.overlayConfigs.forEach((config) => {
      let url = config.url;

      if (config.key === "radar") {
        if (this.rainViewerTileUrl) {
          url = this.rainViewerTileUrl;
        } else {
          pendingRainViewer = true;
          return;
        }
      }

      if (config.requiresKey) {
        const key =
          window.apiKeyManager && window.apiKeyManager.hasKey("openweathermap")
            ? window.apiKeyManager.getKey("openweathermap")
            : null;
        if (!key) {
          locked.push(config.label);
          return;
        }
        url = config.template.replace("{API_KEY}", key);
      }

      if (!url) {
        return;
      }

      const layer = L.tileLayer(url, {
        attribution: config.attribution || config.provider,
        opacity: 0.65,
        maxZoom: 18,
      });

      layer.on("tileerror", () => this._handleTileError(config));

      overlays[config.label] = layer;
      this.overlayLookup.set(layer, config);
    });

    if (this.layerControl) {
      this.layerControl.remove();
      this.layerControl = null;
    }

    const hasOverlays = Object.keys(overlays).length > 0;

    if (hasOverlays) {
      this.layerControl = L.control.layers(
        { "Standard (OSM)": this.baseLayer },
        overlays,
        { collapsed: false }
      );
      this.layerControl.addTo(this.map);

      if (!this.currentOverlay) {
        this._activateDefaultOverlay(overlays);
      }

      if (!this.overlayEventsBound) {
        this.map.on("overlayadd", (event) =>
          this._handleOverlayAdd(event.layer)
        );
        this.map.on("overlayremove", (event) =>
          this._handleOverlayRemove(event.layer)
        );
        this.overlayEventsBound = true;
      }
    }

    if (this.noticeEl) {
      if (locked.length && pendingRainViewer) {
        this.noticeEl.textContent =
          "RainViewer wird geladen… · OWM-Overlays benötigen einen API-Key.";
      } else if (locked.length) {
        this.noticeEl.textContent =
          "Zusätzliche Overlays benötigen einen OpenWeatherMap API-Key.";
      } else if (pendingRainViewer) {
        this.noticeEl.textContent = "RainViewer Radar wird geladen…";
      } else if (!hasOverlays) {
        this.noticeEl.textContent = "Keine Overlays verfügbar.";
      } else {
        this.noticeEl.textContent = "";
      }
    }

    if (pendingRainViewer) {
      this._ensureRainViewerTiles().then((success) => {
        if (success) {
          this.refreshOverlays();
        } else if (this.noticeEl) {
          const suffix = locked.length
            ? " · OWM-Overlays benötigen einen API-Key."
            : "";
          this.noticeEl.textContent =
            "RainViewer Radar derzeit nicht erreichbar" + suffix;
        }
      });
    }
  }

  refreshOverlays() {
    if (!this.map) return;

    if (this.layerControl) {
      this.layerControl.remove();
      this.layerControl = null;
    }

    if (this.overlayLookup.size) {
      this.overlayLookup.forEach((_, layer) => {
        if (this.map.hasLayer(layer)) {
          this.map.removeLayer(layer);
        }
      });
      this.overlayLookup.clear();
    }

    if (
      this.currentOverlay?.layer &&
      this.map.hasLayer(this.currentOverlay.layer)
    ) {
      this.map.removeLayer(this.currentOverlay.layer);
    }
    this.currentOverlay = null;

    this._buildOverlayLayers();
    this._updateOverlayStatus();
  }

  _ensureRainViewerTiles() {
    const isFresh =
      this.rainViewerTileUrl &&
      Date.now() - this.rainViewerFetchedAt < 5 * 60 * 1000;
    if (isFresh) {
      return Promise.resolve(true);
    }

    if (this.rainViewerPromise) {
      return this.rainViewerPromise;
    }

    const endpoint = "https://tilecache.rainviewer.com/api/maps.json";
    this.rainViewerPromise = fetch(endpoint)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`RainViewer ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const pastFrames = Array.isArray(data?.radar?.past)
          ? data.radar.past
          : [];
        const nowcastFrames = Array.isArray(data?.radar?.nowcast)
          ? data.radar.nowcast
          : [];
        const latestPast = pastFrames[pastFrames.length - 1];
        const fallbackFuture =
          nowcastFrames[0] || nowcastFrames[nowcastFrames.length - 1];
        const frame = latestPast || fallbackFuture;
        if (!frame?.path) {
          throw new Error("Kein Radar-Frame verfügbar");
        }
        this.rainViewerTileUrl = `https://tilecache.rainviewer.com/v2/radar/${frame.path}/512/{z}/{x}/{y}/2/1_1.png`;
        this.rainViewerFetchedAt = Date.now();
        return true;
      })
      .catch((err) => {
        console.warn("RainViewer Frames nicht verfügbar", err);
        this.rainViewerTileUrl = null;
        return false;
      })
      .finally(() => {
        this.rainViewerPromise = null;
      });

    return this.rainViewerPromise;
  }

  _handleOverlayAdd(layer) {
    const config = this.overlayLookup.get(layer);
    this.currentOverlay = config ? Object.assign({ layer }, config) : null;
    this._updateOverlayStatus();
  }

  _handleOverlayRemove(layer) {
    if (this.currentOverlay && layer === this.currentOverlay.layer) {
      this.currentOverlay = null;
    }
    this._updateOverlayStatus();
  }

  _ensureOverlayStatus() {
    if (this.statusEl) return;
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const pill = document.createElement("div");
    pill.className = "map-overlay-pill";
    pill.textContent = "Karte: Standard (OSM)";
    container.appendChild(pill);
    this.statusEl = pill;
  }

  _injectOverlayNotice(container) {
    if (this.noticeEl) return;
    const notice = document.createElement("div");
    notice.className = "map-overlay-notice";
    container.appendChild(notice);
    this.noticeEl = notice;
  }

  _updateOverlayStatus() {
    if (!this.statusEl) return;
    if (this.currentOverlay) {
      const label = this.currentOverlay.label;
      const provider = this.currentOverlay.provider;
      this.statusEl.textContent = `Overlay: ${label} - Quelle: ${provider}`;
      this.statusEl.classList.remove("pill-neutral");
    } else {
      this.statusEl.textContent = "Karte: Standard (OSM)";
      this.statusEl.classList.add("pill-neutral");
    }
  }

  _activateDefaultOverlay(overlays) {
    if (!this.map) return;
    const entries = Object.entries(overlays);
    if (!entries.length) return;
    const preferred = entries.find(([label]) =>
      label.toLowerCase().includes("radar")
    );
    const [, layer] = preferred || entries[0];
    if (layer && !this.map.hasLayer(layer)) {
      layer.addTo(this.map);
      const config = this.overlayLookup.get(layer);
      this.currentOverlay = config ? Object.assign({ layer }, config) : null;
      this._updateOverlayStatus();
    }
  }

  _handleTileError(config) {
    if (!this.noticeEl) return;
    if (config.requiresKey) {
      this.noticeEl.textContent =
        "OpenWeatherMap Overlays konnten nicht geladen werden – bitte API-Key pruefen.";
      if (window.updateApiStatusEntry) {
        window.updateApiStatusEntry("openweathermap", {
          state: "invalid-key",
          message: "Overlay konnte nicht geladen werden",
          detail: "OpenWeatherMap meldete einen Fehler beim Laden der Tiles.",
        });
      }
    } else {
      this.noticeEl.textContent = `${config.label} ist aktuell nicht verfuegbar.`;
    }
  }
}

// ============================================
// 2. WEATHER ALERT AGGREGATION
// ============================================

class WeatherAlerts {
  constructor(containerId) {
    this.containerId = containerId;
    this.activeRequest = 0;
  }

  async fetchAlerts(lat, lon, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    this.activeRequest += 1;
    const requestId = this.activeRequest;
    container.innerHTML =
      '<p class="alerts-loading">Warnungen werden geladen...</p>';

    try {
      const url = this._buildForecastUrl(lat, lon);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Warnungs-API ${response.status}`);
      }
      const payload = await response.json();

      if (this.activeRequest !== requestId) {
        return;
      }

      const alerts = this._deriveAlerts(payload);
      this.renderAlerts(alerts, city || "Standort");
    } catch (error) {
      console.error("WeatherAlerts", error);
      container.innerHTML = `
        <div class="alerts-empty">
          <p>Warnungen aktuell nicht verfuegbar</p>
          <small>${error.message || "Unbekannter Fehler"}</small>
        </div>
      `;
    }
  }

  _buildForecastUrl(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      hourly:
        "temperature_2m,apparent_temperature,precipitation_probability,precipitation,weathercode,windspeed_10m",
      timezone: "auto",
      forecast_days: "2",
    });
    return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  }

  _deriveAlerts(payload) {
    const alerts = [];
    const hourly = payload && payload.hourly ? payload.hourly : {};
    const hours = (hourly.time || []).slice(0, 24);

    const grab = (arr, idx, fallback = null) => {
      if (!arr || !(idx in arr)) return fallback;
      const value = Number(arr[idx]);
      return Number.isFinite(value) ? value : fallback;
    };

    const pushAlert = (id, data) => {
      if (alerts.some((item) => item.id === id)) return;
      alerts.push(Object.assign({ id }, data));
    };

    hours.forEach((iso, idx) => {
      const temp = grab(hourly.temperature_2m, idx);
      const feels = grab(hourly.apparent_temperature, idx);
      const prob = grab(hourly.precipitation_probability, idx, 0);
      const rain = grab(hourly.precipitation, idx, 0);
      const wind = grab(hourly.windspeed_10m, idx, 0);
      const code = grab(hourly.weathercode, idx);

      if (typeof wind === "number" && wind >= 75) {
        pushAlert(`wind-${iso}`, {
          severity: "red",
          icon: "[wind]",
          title: "Sturmwarnung",
          description: `Windspitzen um ${wind.toFixed(0)} km/h erwartet.`,
          time: iso,
        });
      } else if (typeof wind === "number" && wind >= 55) {
        pushAlert(`wind-${iso}`, {
          severity: "orange",
          icon: "[wind]",
          title: "Sturmboeen",
          description: `Wind bis ${wind.toFixed(0)} km/h moeglich.`,
          time: iso,
        });
      }

      if (typeof temp === "number" && temp >= 32) {
        pushAlert(`heat-${iso}`, {
          severity: "orange",
          icon: "[heat]",
          title: "Starke Hitze",
          description: `Temperaturen ueber 32 Grad erwartet.`,
          time: iso,
        });
      }

      if (typeof feels === "number" && feels <= -12) {
        pushAlert(`frost-${iso}`, {
          severity: "yellow",
          icon: "[frost]",
          title: "Strenger Frost",
          description: `Gefuehlte Temperatur um ${feels.toFixed(0)} Grad.`,
          time: iso,
        });
      }

      if (typeof rain === "number" && rain >= 5 && prob >= 60) {
        pushAlert(`rain-${iso}`, {
          severity: "orange",
          icon: "[rain]",
          title: "Starkregen",
          description: `${rain.toFixed(1)} mm mit ${prob}% Wahrscheinlichkeit.`,
          time: iso,
        });
      }

      if ([95, 96, 99].indexOf(code) >= 0) {
        pushAlert(`storm-${iso}`, {
          severity: "red",
          icon: "[storm]",
          title: "Gewitterfront",
          description: "Gewitter mit Hagel oder Starkregen moeglich.",
          time: iso,
        });
      }
    });

    return alerts;
  }

  renderAlerts(alerts, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (!alerts.length) {
      container.innerHTML = `
        <div class="alerts-empty">
          <div class="emoji"></div>
          <h3>Keine aktuellen Warnungen</h3>
          <p>Fuer ${city} liegen derzeit keine Meldungen vor.</p>
        </div>
      `;
      return;
    }

    const cards = alerts
      .map((alert) => {
        return `
          <article class="alert-card alert-${alert.severity}">
            <div class="alert-icon">${alert.icon || ""}</div>
            <div class="alert-body">
              <header>
                <h3>${alert.title}</h3>
                <span>${this._formatTime(alert.time)}</span>
              </header>
              <p>${alert.description}</p>
            </div>
          </article>
        `;
      })
      .join("");

    container.innerHTML = `
      <div class="alert-summary">${alerts.length} Warnung(en) fuer ${city}</div>
      ${cards}
    `;
  }

  _formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("de-DE", {
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
      '<p style="padding:20px; text-align:center;"> Lade historische Daten...</p>';

    try {
      const safeLat = Number(lat);
      const safeLon = Number(lon);
      if (!Number.isFinite(safeLat) || !Number.isFinite(safeLon)) {
        throw new Error("Ungueltige Koordinaten fuer historische Daten");
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() - 1);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 8);

      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      const response = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${safeLat}&longitude=${safeLon}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Archiv-API ${response.status}: ${text}`);
      }

      const data = await response.json();
      data.meta = {
        provider: "Open-Meteo Archiv",
        range: { start, end },
      };
      this.renderChart(data, city || "Standort");
    } catch (error) {
      console.error("HistoricalChart", error);
      container.innerHTML = `
        <div class="historical-error">
          <p>Keine historischen Daten verfuegbar</p>
          <small>${error.message || "Unbekannter Fehler"}</small>
        </div>
      `;
    }
  }

  renderChart(data, city) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    const entries = this._normalizeDailyEntries(data.daily || {});
    if (!entries.length) {
      container.innerHTML = `
        <div class="historical-error">
          <p>Keine historischen Daten verfuegbar</p>
          <small>Der Anbieter hat fuer diesen Zeitraum nichts geliefert.</small>
        </div>
      `;
      return;
    }

    const labels = entries.map((entry) => entry.label);
    container.innerHTML = `
      <div class="historical-chart-canvas">
        <canvas id="historical-chart-canvas" aria-label="Historische Wetterdaten" role="img"></canvas>
      </div>
    `;
    const canvas = container.querySelector("#historical-chart-canvas");
    if (!canvas) return;

    if (typeof Chart === "undefined") {
      container.insertAdjacentHTML(
        "beforeend",
        '<p class="historical-error">Chart.js nicht geladen</p>'
      );
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Max Temp (degC)",
            data: entries.map((entry) => entry.max),
            borderColor: "#dc3545",
            backgroundColor: "rgba(220,53,69,0.1)",
            tension: 0.35,
            fill: false,
            yAxisID: "temp",
          },
          {
            label: "Min Temp (degC)",
            data: entries.map((entry) => entry.min),
            borderColor: "#007bff",
            backgroundColor: "rgba(0,123,255,0.1)",
            tension: 0.35,
            fill: false,
            yAxisID: "temp",
          },
          {
            type: "bar",
            label: "Niederschlag (mm)",
            data: entries.map((entry) => entry.rain || 0),
            backgroundColor: "rgba(0,150,136,0.35)",
            borderColor: "rgba(0,150,136,0.8)",
            borderWidth: 1,
            yAxisID: "precip",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: "index", intersect: false },
        plugins: {
          title: {
            display: true,
            text: `Temperatur & Niederschlag  ${city || "Standort"}`,
          },
          legend: { position: "bottom" },
        },
        scales: {
          temp: {
            position: "left",
            title: { display: true, text: "Temperatur (degC)" },
            ticks: { callback: (value) => `${value} deg` },
          },
          precip: {
            position: "right",
            beginAtZero: true,
            title: { display: true, text: "Niederschlag (mm)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });

    const stats = this._computeHistoricalStats(entries);
    const summaryHtml = this._renderHistoricalSummary(stats, data.meta || {});
    const tableHtml = this._renderHistoricalTable(entries, stats);
    container.insertAdjacentHTML("beforeend", summaryHtml + tableHtml);
  }

  _normalizeDailyEntries(daily) {
    const times = daily.time || [];
    const maxValues = daily.temperature_2m_max || [];
    const minValues = daily.temperature_2m_min || [];
    const precipitation = daily.precipitation_sum || [];

    return times.map((isoDate, idx) => {
      const max = this._toNumber(maxValues[idx]);
      const min = this._toNumber(minValues[idx]);
      const rain = this._toNumber(precipitation[idx], 0);
      const range =
        typeof max === "number" && typeof min === "number"
          ? Number((max - min).toFixed(1))
          : null;
      return {
        date: isoDate,
        label: new Date(isoDate).toLocaleDateString("de-DE", {
          weekday: "short",
          day: "2-digit",
          month: "short",
        }),
        max,
        min,
        rain,
        range,
      };
    });
  }

  _computeHistoricalStats(entries) {
    const validMax = entries.filter((entry) => typeof entry.max === "number");
    const validMin = entries.filter((entry) => typeof entry.min === "number");
    const warmest = validMax.reduce(
      (acc, entry) => (!acc || entry.max > acc.max ? entry : acc),
      null
    );
    const coldest = validMin.reduce(
      (acc, entry) => (!acc || entry.min < acc.min ? entry : acc),
      null
    );
    const wettest = entries.reduce(
      (acc, entry) =>
        !acc || (entry.rain || 0) > (acc.rain || 0) ? entry : acc,
      null
    );

    const average = (list, key) => {
      if (!list.length) return null;
      const sum = list.reduce((total, entry) => total + (entry[key] || 0), 0);
      return sum / list.length;
    };

    return {
      avgMax: average(validMax, "max"),
      avgMin: average(validMin, "min"),
      totalRain: entries.reduce((total, entry) => total + (entry.rain || 0), 0),
      warmest,
      coldest,
      wettest,
    };
  }

  _renderHistoricalSummary(stats, meta) {
    const fmt = (value, suffix = " degC") =>
      typeof value === "number" ? `${value.toFixed(1)}${suffix}` : "";
    const rainFmt = (value) =>
      typeof value === "number" ? `${value.toFixed(1)} mm` : "";
    const hasRange = meta && meta.range && meta.range.start && meta.range.end;
    const rangeText = hasRange
      ? `${this._formatDate(meta.range.start)}  ${this._formatDate(
          meta.range.end
        )}`
      : "letzte Tage";
    const provider = meta && meta.provider ? meta.provider : "Open-Meteo";

    return `
      <div class="historical-summary-meta">
        <p>Quelle: <strong>${provider}</strong>  Zeitraum: ${rangeText}</p>
      </div>
      <div class="historical-summary-grid">
        <article class="historical-summary-card">
          <span class="label">Durchschnitt Max</span>
          <strong>${fmt(stats.avgMax)}</strong>
        </article>
        <article class="historical-summary-card">
          <span class="label">Durchschnitt Min</span>
          <strong>${fmt(stats.avgMin)}</strong>
        </article>
        <article class="historical-summary-card">
          <span class="label">Gesamter Niederschlag</span>
          <strong>${rainFmt(stats.totalRain)}</strong>
        </article>
        <article class="historical-summary-card">
          <span class="label">Extrema</span>
          <strong>${
            stats.warmest
              ? `${stats.warmest.label} (${fmt(stats.warmest.max)})`
              : ""
          }</strong>
          <small>${
            stats.coldest
              ? `Kaeltester Tag: ${stats.coldest.label} (${fmt(
                  stats.coldest.min
                )})`
              : ""
          }</small>
        </article>
      </div>
    `;
  }

  _renderHistoricalTable(entries, stats) {
    if (!entries.length) return "";
    const warmDate = stats.warmest && stats.warmest.date;
    const coldDate = stats.coldest && stats.coldest.date;
    const wetDate = stats.wettest && stats.wettest.date;

    const rows = entries
      .map((entry) => {
        let tone = "";
        if (entry.date === warmDate) tone = "max";
        else if (entry.date === coldDate) tone = "min";
        else if (entry.date === wetDate) tone = "rain";
        return `
          <tr ${tone ? `data-extreme="${tone}"` : ""}>
            <td>${entry.label}</td>
            <td>${this._formatValue(entry.max, " degC")}</td>
            <td>${this._formatValue(entry.min, " degC")}</td>
            <td>${
              typeof entry.range === "number"
                ? `${entry.range.toFixed(1)} deg`
                : ""
            }</td>
            <td>${this._formatValue(entry.rain, " mm", 1)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <div class="historical-table-wrapper">
        <table class="historical-table">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Max</th>
              <th>Min</th>
              <th>Spanne</th>
              <th>Niederschlag</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  _formatValue(value, suffix = "", digits = 1) {
    if (typeof value !== "number") return "";
    return `${value.toFixed(digits)}${suffix}`;
  }

  _toNumber(value, fallback = null) {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
  }

  _formatDate(input) {
    if (!input) return "?";
    return new Date(input).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
    });
  }
}

// ============================================
// 4. LOCAL ANALYTICS (unchanged)
// ============================================

class Analytics {
  constructor() {
    this.events = this.loadEvents();
    const saved = localStorage.getItem("wetter_analytics_enabled");
    this.enabled = saved === null ? true : saved === "true";
    if (saved === null) {
      localStorage.setItem("wetter_analytics_enabled", "true");
    }
  }

  loadEvents() {
    try {
      return JSON.parse(
        localStorage.getItem("wetter_analytics_events") || "[]"
      );
    } catch (error) {
      console.warn("Analytics load failed", error);
      return [];
    }
  }

  saveEvents() {
    try {
      localStorage.setItem(
        "wetter_analytics_events",
        JSON.stringify(this.events)
      );
    } catch (error) {
      console.warn("Analytics save failed", error);
    }
  }

  logEvent(type, data) {
    if (!this.enabled) return;
    this.events.push({ type, data, timestamp: Date.now() });
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
    this.saveEvents();
  }

  getStats() {
    const count = (t) => this.events.filter((event) => event.type === t).length;
    return {
      searches: count("search"),
      apiCalls: count("api_call"),
      cacheHits: count("cache_hit"),
      favActions: count("favorite_action"),
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
    const hasData = stats.total > 0;
    const chipLabel = hasData
      ? `${stats.total} Ereignisse`
      : "Noch keine Events";
    const emptyState = hasData
      ? ""
      : '<p class="analytics-empty">Noch keine Daten – führe eine Suche aus, füge Favoriten hinzu oder lade Wetterdaten, um diese Übersicht zu füllen.</p>';
    const gridModifier = hasData ? "" : " analytics-grid--disabled";
    container.innerHTML = `
      <div class="analytics-panel">
        <div class="analytics-panel-header">
          <div>
            <p class="section-subtitle">Lokale Insights</p>
            <h3>📊 Nutzungsstatistiken</h3>
          </div>
          <span class="analytics-chip">${chipLabel}</span>
        </div>
        ${emptyState}
        <div class="analytics-grid${gridModifier}">
          <article><strong>${
            stats.searches
          }</strong><span>Suchanfragen</span></article>
          <article><strong>${
            stats.apiCalls
          }</strong><span>API Calls</span></article>
          <article><strong>${
            stats.cacheHits
          }</strong><span>Cache Hits</span></article>
          <article><strong>${
            stats.favActions
          }</strong><span>Favoriten-Aktionen</span></article>
        </div>
        <div class="analytics-footer">
          <label class="analytics-toggle">
            <input type="checkbox" id="analytics-toggle" ${
              this.enabled ? "checked" : ""
            }>
            <span>Analytics aktiviert (nur lokal gespeichert)</span>
          </label>
          <button id="export-analytics-btn" class="btn-secondary">Analytics exportieren</button>
        </div>
      </div>
    `;

    const toggle = document.getElementById("analytics-toggle");
    if (toggle) {
      toggle.addEventListener("change", (event) => {
        this.enabled = event.target.checked;
        localStorage.setItem("wetter_analytics_enabled", String(this.enabled));
      });
    }

    const exportBtn = document.getElementById("export-analytics-btn");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        const blob = new Blob([this.exportData()], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `wetter-analytics-${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
      });
    }
  }
}

// Global exports
window.WeatherMap = WeatherMap;
window.WeatherAlerts = WeatherAlerts;
window.HistoricalChart = HistoricalChart;
window.Analytics = Analytics;
