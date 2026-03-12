const userController = require('../../../src/controllers/userController');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('User Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  // GET USERS
  test('getUsers should return 501 Not implemented', () => {
    userController.getUsers(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // GET USER
  test('getUser should return 501 Not implemented', () => {
    userController.getUser(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // UPDATE USER
  test('updateUser should return 501 Not implemented', () => {
    userController.updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });
});