import HistoryTransformer from "../utils/historyTransformer.js";

describe("History Transformer", () => {
  const mockData = [
    {
      date: "2024-01-01",
      temp_min: 5,
      temp_max: 15,
      precip: 2,
      wind_speed: 10,
      humidity: 60,
    },
    {
      date: "2024-01-02",
      temp_min: 6,
      temp_max: 16,
      precip: 0,
      wind_speed: 8,
      humidity: 55,
    },
    {
      date: "2024-01-03",
      temp_min: 4,
      temp_max: 14,
      precip: 5,
      wind_speed: 12,
      humidity: 70,
    },
  ];

  it("should aggregate by day", () => {
    const result = HistoryTransformer.aggregateByDay(mockData);
    expect(result.dates).toHaveLength(3);
    expect(result.temps.min).toEqual([5, 6, 4]);
    expect(result.temps.max).toEqual([15, 16, 14]);
  });

  it("should aggregate by week", () => {
    const result = HistoryTransformer.aggregateByWeek(mockData);
    expect(result.dates.length).toBeGreaterThan(0);
    expect(result.temps.min.length).toBe(result.dates.length);
  });

  it("should aggregate by month", () => {
    const result = HistoryTransformer.aggregateByMonth(mockData);
    expect(result.dates.length).toBe(1);
    expect(result.temps.min[0]).toBeLessThanOrEqual(5);
    expect(result.temps.max[0]).toBeGreaterThanOrEqual(16);
  });

  it("should calculate insights", () => {
    const insights = HistoryTransformer.calculateInsights(mockData);
    expect(insights.warmestDay.temp).toBe(16);
    expect(insights.coldestDay.temp).toBe(4);
    expect(insights.avgTemp).toBeDefined();
  });

  it("should handle empty data", () => {
    const result = HistoryTransformer.aggregateByDay([]);
    expect(result.dates).toEqual([]);

    const insights = HistoryTransformer.calculateInsights([]);
    expect(insights.totalDays).toBe(0);
  });
});
