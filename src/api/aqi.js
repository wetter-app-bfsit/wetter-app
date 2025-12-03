export class AQIAPI {
  constructor(options = {}) {
    this.baseUrl =
      options.baseUrl ||
      "https://air-quality-api.open-meteo.com/v1/air-quality";
  }

  async fetchAQIForPoint(lat, lon, timestamp = null) {
    try {
      const url = new URL(this.baseUrl);
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      url.searchParams.set("hourly", "european_aqi");
      if (timestamp) {
        const d = new Date(timestamp);
        const isoDate = d.toISOString().split("T")[0];
        url.searchParams.set("start_date", isoDate);
        url.searchParams.set("end_date", isoDate);
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`AQI API error: ${res.status}`);
      const data = await res.json();
      const times = data.hourly?.time || [];
      const values = data.hourly?.european_aqi || [];
      if (!times.length || !values.length) return null;

      let idx = values.length - 1;
      if (timestamp) {
        const target = new Date(timestamp).getTime();
        let bestDiff = Infinity;
        times.forEach((t, i) => {
          const diff = Math.abs(new Date(t).getTime() - target);
          if (diff < bestDiff) {
            bestDiff = diff;
            idx = i;
          }
        });
      }

      return {
        aqi: values[idx],
        time: times[idx],
      };
    } catch (e) {
      console.error("[AQIAPI] fetchAQIForPoint failed", e);
      return null;
    }
  }
}

const defaultInstance = new AQIAPI();
export default defaultInstance;
