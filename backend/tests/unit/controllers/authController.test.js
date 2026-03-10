const authController = require('../../../src/controllers/authController')

function mockResponse() {
  const res = {}
  res.status = jest.fn().mockReturnValue(res)
  res.json = jest.fn().mockReturnValue(res)
  return res
}

describe('Auth Controller', () => {

  let req
  let res

  beforeEach(() => {
    req = {}
    res = mockResponse()
  })

  // LOGIN
  test('login should return demo user and tokens', () => {

    req.body = { email: 'test@example.com' }

    authController.login(req, res)

    expect(res.json).toHaveBeenCalled()

    const response = res.json.mock.calls[0][0]

    expect(response.data.user.email).toBe('test@example.com')
    expect(response.data.tokens.accessToken).toContain('demo-access')
    expect(response.data.tokens.refreshToken).toContain('demo-refresh')

  })


  // REGISTER ORG - missing fields
  test('registerOrg should return 400 when fields missing', () => {

    req.body = { orgName: 'Test Org' }

    authController.registerOrg(req, res)

    expect(res.status).toHaveBeenCalledWith(400)

  })


  // REGISTER ORG success
  test('registerOrg should create organisation', () => {

    req.body = {
      orgName: 'Test Org',
      slug: 'test-org',
      adminFirstName: 'John',
      adminLastName: 'Doe',
      adminEmail: 'john@test.com',
      adminPassword: '123456'
    }

    authController.registerOrg(req, res)

    expect(res.status).toHaveBeenCalledWith(201)

    const response = res.json.mock.calls[0][0]

    expect(response.data.user.email).toBe('john@test.com')
    expect(response.data.tokens.accessToken).toContain('demo-access')

  })


  // CHECK SLUG taken
  test('checkSlug should mark taken slug unavailable', () => {

    req.params = { slug: 'demo' }

    authController.checkSlug(req, res)

    const response = res.json.mock.calls[0][0]

    expect(response.data.available).toBe(false)
    expect(response.data.suggestion).toBe('demo-1')

  })


  // CHECK SLUG available
  test('checkSlug should mark new slug available', () => {

    req.params = { slug: 'my-company' }

    authController.checkSlug(req, res)

    const response = res.json.mock.calls[0][0]

    expect(response.data.available).toBe(true)

  })


  // ACCEPT INVITE
  test('acceptInvite should return user and tokens', () => {

    req.body = { token: 'abc123', password: 'secret' }

    authController.acceptInvite(req, res)

    const response = res.json.mock.calls[0][0]

    expect(response.data.user.email).toContain('invite+abc123')

  })


  // CHANGE PASSWORD
  test('changePassword should return success message', () => {

    req.body = { password: 'newpass' }

    authController.changePassword(req, res)

    expect(res.json).toHaveBeenCalledWith({
      data: null,
      message: 'Password changed (demo)'
    })

  })


  // REFRESH TOKEN
  test('refreshToken should return new tokens', () => {

    authController.refreshToken(req, res)

    const response = res.json.mock.calls[0][0]

    expect(response.data.accessToken).toContain('demo-access')
    expect(response.data.refreshToken).toContain('demo-refresh')

  })


  // GET ME
  test('getMe should return demo user', () => {

    authController.getMe(req, res)

    const response = res.json.mock.calls[0][0]

    expect(response.data.email).toBe('demo@sone.engineering')

  })

})