import HistoryTransformer from "../../utils/historyTransformer";

export class HistoryView {
  constructor(options = {}) {
    this.containerId = options.containerId || "history-container";
    this.currentBucketSize = "day";
    this.historyData = null;
  }

  async render(rawHistory) {
    if (!rawHistory || rawHistory.length === 0) {
      this._renderEmpty();
      return;
    }

    this.historyData = rawHistory;

    const container = document.querySelector(`#${this.containerId}`);
    if (!container) {
      console.warn(`[HistoryView] Container #${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="history-view">
        <div class="history-control">
          <button class="history-btn history-btn--active" data-bucket="day">Tag</button>
          <button class="history-btn" data-bucket="week">Woche</button>
          <button class="history-btn" data-bucket="month">Monat</button>
        </div>

        <div class="history-charts">
          <div class="history-chart-card">
            <div class="history-chart-card__header">
              <h4>Temperatur</h4>
              <span class="history-chart-card__legend">
                <span class="history-chart-legend__item">
                  <span class="history-chart-legend__swatch history-chart-legend__swatch--band"></span>
                  Min/Max-Band
                </span>
                <span class="history-chart-legend__item">
                  <span class="history-chart-legend__swatch history-chart-legend__swatch--avg"></span>
                  Durchschnitt
                </span>
                <span class="history-chart-legend__item">
                  <span class="history-chart-legend__swatch history-chart-legend__swatch--trend"></span>
                  Trend
                </span>
              </span>
            </div>
            <canvas id="history-temp-chart"></canvas>
          </div>
          <div class="history-chart-card">
            <div class="history-chart-card__header">
              <h4>Niederschlag</h4>
              <span class="history-chart-card__legend">
                <span class="history-chart-legend__item">
                  <span class="history-chart-legend__swatch history-chart-legend__swatch--precip"></span>
                  Tagesmenge
                </span>
              </span>
            </div>
            <canvas id="history-precip-chart"></canvas>
          </div>
        </div>

        <div class="history-insights">
          <h4>Einsichten</h4>
          <div id="history-insights-grid" class="insights-grid"></div>
        </div>
      </div>
    `;

    container.querySelectorAll(".history-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        container
          .querySelectorAll(".history-btn")
          .forEach((b) => b.classList.remove("history-btn--active"));
        e.target.classList.add("history-btn--active");
        this.currentBucketSize = e.target.dataset.bucket;
        this._updateCharts();
      });
    });

    this._updateCharts();
  }

  _updateCharts() {
    const aggregated = this._getAggregatedData();
    const insights = HistoryTransformer.calculateInsights(this.historyData);

    this._drawTemperatureChart(aggregated);
    this._drawPrecipitationChart(aggregated);
    this._drawInsights(insights);
  }

  _getAggregatedData() {
    switch (this.currentBucketSize) {
      case "week":
        return HistoryTransformer.aggregateByWeek(this.historyData);
      case "month":
        return HistoryTransformer.aggregateByMonth(this.historyData);
      default:
        return HistoryTransformer.aggregateByDay(this.historyData);
    }
  }

  _drawTemperatureChart(aggregated) {
    const canvas = document.querySelector("#history-temp-chart");
    if (!canvas || !aggregated.dates.length) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.offsetWidth || 300;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    const minVal = Math.min(...aggregated.temps.min);
    const maxVal = Math.max(...aggregated.temps.max);
    const range = maxVal - minVal || 10;

    const pointWidth = width / aggregated.dates.length;
    const pointHeight = height / range;

    ctx.clearRect(0, 0, width, height);

    // Min/Max-Fläche als Band
    ctx.fillStyle = "rgba(138, 180, 255, 0.22)";
    ctx.strokeStyle = "rgba(138, 180, 255, 0.8)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    aggregated.temps.min.forEach((val, idx) => {
      const x = idx * pointWidth + pointWidth / 2;
      const y = height - (val - minVal) * pointHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    aggregated.temps.max
      .slice()
      .reverse()
      .forEach((val, idx) => {
        const origIdx = aggregated.temps.max.length - 1 - idx;
        const x = origIdx * pointWidth + pointWidth / 2;
        const y = height - (val - minVal) * pointHeight;
        ctx.lineTo(x, y);
      });
    ctx.closePath();
    ctx.fill();

    // Durchschnitts-Linie
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    aggregated.temps.avg.forEach((val, idx) => {
      const x = idx * pointWidth + pointWidth / 2;
      const y = height - (val - minVal) * pointHeight;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Trend-Linie (lineare Regression) deutlich hervorgehoben
    if (aggregated.temps.avg.length > 1) {
      const n = aggregated.temps.avg.length;
      const xs = aggregated.temps.avg.map((_, i) => i);
      const ys = aggregated.temps.avg;

      const sumX = xs.reduce((acc, v) => acc + v, 0);
      const sumY = ys.reduce((acc, v) => acc + v, 0);
      const sumXY = xs.reduce((acc, v, i) => acc + v * ys[i], 0);
      const sumX2 = xs.reduce((acc, v) => acc + v * v, 0);

      const denom = n * sumX2 - sumX * sumX || 1;
      const slope = (n * sumXY - sumX * sumY) / denom;
      const intercept = (sumY - slope * sumX) / n;

      const startY = intercept;
      const endY = slope * (n - 1) + intercept;

      const y1 = height - (startY - minVal) * pointHeight;
      const y2 = height - (endY - minVal) * pointHeight;

      ctx.strokeStyle = "rgba(255, 138, 101, 1)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pointWidth / 2, y1);
      ctx.lineTo(width - pointWidth / 2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  _drawPrecipitationChart(aggregated) {
    const canvas = document.querySelector("#history-precip-chart");
    if (!canvas || !aggregated.precips.length) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.offsetWidth || 300;
    const height = 200;
    canvas.width = width;
    canvas.height = height;

    const maxPrecip = Math.max(...aggregated.precips) || 10;
    const pointWidth = width / aggregated.precips.length;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(100, 200, 255, 0.6)";

    aggregated.precips.forEach((val, idx) => {
      const x = idx * pointWidth;
      const barHeight = (val / maxPrecip) * height;
      ctx.fillRect(x, height - barHeight, pointWidth - 2, barHeight);
    });
  }

  _drawInsights(insights) {
    const grid = document.querySelector("#history-insights-grid");
    if (!grid) return;

    const warmTemp =
      typeof insights.warmestDay.temp === "number"
        ? insights.warmestDay.temp.toFixed(1)
        : "–";
    const coldTemp =
      typeof insights.coldestDay.temp === "number"
        ? insights.coldestDay.temp.toFixed(1)
        : "–";

    grid.innerHTML = `
      <div class="insight-box">
        <div class="insight-label">Wärmster Tag</div>
        <div class="insight-value">${warmTemp}°C</div>
        <div class="insight-date">${insights.warmestDay.date || "–"}</div>
      </div>
      <div class="insight-box">
        <div class="insight-label">Kältester Tag</div>
        <div class="insight-value">${coldTemp}°C</div>
        <div class="insight-date">${insights.coldestDay.date || "–"}</div>
      </div>
      <div class="insight-box">
        <div class="insight-label">Durchschnitt</div>
        <div class="insight-value">${insights.avgTemp}°C</div>
        <div class="insight-date">${insights.totalDays} Tage</div>
      </div>
      <div class="insight-box">
        <div class="insight-label">Trend</div>
        <div class="insight-value">$${
          insights.trend === "warming" ? "📈 Wärmer" : "📉 Kälter"
        }</div>
        <div class="insight-date">vs. Durchschnitt</div>
      </div>
    `;
  }

  _renderEmpty() {
    const container = document.querySelector(`#${this.containerId}`);
    if (container) {
      container.innerHTML =
        '<p style="padding: 16px; color: var(--color-text-secondary);">Keine historischen Daten verfügbar.</p>';
    }
  }
}

export default HistoryView;
