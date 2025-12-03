// Jest Mock für GridFieldsAPI
export const mockGridFieldsAPI = {
  fetchTemperature: jest
    .fn()
    .mockResolvedValue([
      { lat: 35.0, lon: -97.0, currentTemp: 22, temperatures: [22, 21, 20] },
    ]),
  fetchWind: jest
    .fn()
    .mockResolvedValue([
      { lat: 35.0, lon: -97.0, currentSpeed: 5, currentDirection: 180 },
    ]),
  fetchCloudCover: jest.fn().mockResolvedValue([]),
  fetchHumidity: jest.fn().mockResolvedValue([]),
};
