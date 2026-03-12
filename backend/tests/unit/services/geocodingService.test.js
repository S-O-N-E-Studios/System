const geocodingService = require('../../../src/services/geocodingService');

describe('Geocoding Service', () => {
  // GEOCODE METHOD
  test('geocode should be a function', () => {
    expect(typeof geocodingService.geocode).toBe('function');
  });

  test('geocode should be an async function', () => {
    const result = geocodingService.geocode();
    expect(result instanceof Promise).toBe(true);
  });

  test('geocode should resolve', async () => {
    const result = await geocodingService.geocode();
    expect(result).toBeUndefined();
  });

  // VERIFY GEOCODE FUNCTION EXISTS
  test('geocodingService should export geocode', () => {
    expect(geocodingService).toHaveProperty('geocode');
  });
});
