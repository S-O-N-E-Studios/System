const taskController = require('../../../src/controllers/taskController');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Task Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  // GET TASKS
  test('getTasks should return 501 Not implemented', () => {
    taskController.getTasks(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // GET TASK
  test('getTask should return 501 Not implemented', () => {
    taskController.getTask(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // CREATE TASK
  test('createTask should return 501 Not implemented', () => {
    taskController.createTask(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // UPDATE TASK
  test('updateTask should return 501 Not implemented', () => {
    taskController.updateTask(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // DELETE TASK
  test('deleteTask should return 501 Not implemented', () => {
    taskController.deleteTask(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });
});