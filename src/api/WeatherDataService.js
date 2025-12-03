// Zentrale Fassade für alle Wetter-Datenflüsse
// Nutzt bestehende API-Module und kapselt deren Aufrufe

import "../utils/validation.js";

export class WeatherDataService {
  constructor(options = {}) {
    this.options = options;
  }

  async loadCurrentAndForecast(latitude, longitude) {
    const [{ default: openMeteoAPI }, { default: brightSkyApi }] =
      await Promise.all([import("./weather.js"), import("./brightsky.js")]);

    const [openMeteoResult, brightSkyResult] = await Promise.all([
      openMeteoAPI.fetchWeather(latitude, longitude),
      brightSkyApi.fetchWeather(latitude, longitude),
    ]);

    return {
      openMeteo: openMeteoResult?.data || null,
      brightSky: brightSkyResult?.data || null,
      raw: {
        openMeteo: openMeteoResult,
        brightSky: brightSkyResult,
      },
    };
  }

  async loadHistory(latitude, longitude, startDate, endDate) {
    const { gridFieldsAPI } = await import("./gridFields.js");
    return gridFieldsAPI.fetchHistoricalData(
      latitude,
      longitude,
      startDate,
      endDate
    );
  }

  async loadAirQuality(latitude, longitude) {
    const { default: aqiApi } = await import("./aqi.js");
    try {
      const result = await aqiApi.fetchAirQuality(latitude, longitude);
      return result?.data || null;
    } catch (e) {
      console.warn("[WeatherDataService] loadAirQuality failed", e);
      return null;
    }
  }

  async loadMapLayers(centerLat, centerLon) {
    const { GridFieldsAPI } = await import("./gridFields.js");
    const api = new GridFieldsAPI();

    const [temp, wind, clouds, humidity] = await Promise.all([
      api.fetchTemperature(centerLat, centerLon),
      api.fetchWind(centerLat, centerLon),
      api.fetchCloudCover(centerLat, centerLon),
      api.fetchHumidity(centerLat, centerLon),
    ]);

    return { temp, wind, clouds, humidity };
  }
}

// einfache Singleton-Instanz
export const weatherDataService = new WeatherDataService();
