const projectController = require('../../../src/controllers/projectController');

function mockResponse() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Project Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {};
    res = mockResponse();
  });

  // GET PROJECTS
  test('getProjects should return 501 Not implemented', () => {
    projectController.getProjects(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // GET PROJECT
  test('getProject should return 501 Not implemented', () => {
    projectController.getProject(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // CREATE PROJECT
  test('createProject should return 501 Not implemented', () => {
    projectController.createProject(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // UPDATE PROJECT
  test('updateProject should return 501 Not implemented', () => {
    projectController.updateProject(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });

  // DELETE PROJECT
  test('deleteProject should return 501 Not implemented', () => {
    projectController.deleteProject(req, res);

    expect(res.status).toHaveBeenCalledWith(501);
    expect(res.json).toHaveBeenCalledWith({ message: 'Not implemented' });
  });
});