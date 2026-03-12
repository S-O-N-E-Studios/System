const fileController = require('../../../src/controllers/fileController');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('File Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  // UPLOAD
  test('upload should return 501 Not implemented', () => {
    fileController.upload(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // DOWNLOAD
  test('download should return 501 Not implemented', () => {
    fileController.download(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });
});