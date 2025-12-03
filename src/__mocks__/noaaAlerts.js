// Jest Mock für NoaaAlertsAPI
export const mockNoaaAlertsAPI = {
  fetchAlertsForPoint: jest.fn().mockResolvedValue([
    {
      id: "alert-1",
      event: "Tornado Watch",
      severity: "Moderate",
      areaDesc: "Southern Oklahoma",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-97, 35],
            [-96, 35],
            [-96, 36],
            [-97, 36],
            [-97, 35],
          ],
        ],
      },
      color: "#FFA500",
    },
  ]),
};
