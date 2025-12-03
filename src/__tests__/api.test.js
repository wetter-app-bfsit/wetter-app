import gridFieldsAPI from "../api/gridFields";
import noaaAlertsAPI from "../api/noaaAlerts";

describe("Phase 2b APIs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GridFieldsAPI", () => {
    it("should generate grid points correctly", () => {
      const points = gridFieldsAPI.generateGridPoints(35, -97);
      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toHaveLength(2);
    });

    it("should fetch temperature data", async () => {
      const data = await gridFieldsAPI.fetchTemperature(35, -97);
      expect(Array.isArray(data)).toBe(true);
    });

    it("should fetch wind data", async () => {
      const data = await gridFieldsAPI.fetchWind(35, -97);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("NoaaAlertsAPI", () => {
    it("should fetch alerts for a point", async () => {
      const alerts = await noaaAlertsAPI.fetchAlertsForPoint(35, -97);
      expect(Array.isArray(alerts)).toBe(true);
    });
  });
});
