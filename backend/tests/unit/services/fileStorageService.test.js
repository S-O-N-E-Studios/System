const fileStorageService = require('../../../src/services/fileStorageService');

describe('File Storage Service', () => {
  // UPLOAD METHOD
  test('upload should be a function', () => {
    expect(typeof fileStorageService.upload).toBe('function');
  });

  test('upload should be an async function', () => {
    const result = fileStorageService.upload();
    expect(result instanceof Promise).toBe(true);
  });

  test('upload should resolve', async () => {
    const result = await fileStorageService.upload();
    expect(result).toBeUndefined();
  });

  // GET URL METHOD
  test('getUrl should be a function', () => {
    expect(typeof fileStorageService.getUrl).toBe('function');
  });

  test('getUrl should be an async function', () => {
    const result = fileStorageService.getUrl();
    expect(result instanceof Promise).toBe(true);
  });

  test('getUrl should resolve', async () => {
    const result = await fileStorageService.getUrl();
    expect(result).toBeUndefined();
  });

  // VERIFY BOTH FUNCTIONS EXIST
  test('fileStorageService should export upload and getUrl', () => {
    expect(fileStorageService).toHaveProperty('upload');
    expect(fileStorageService).toHaveProperty('getUrl');
  });
});
