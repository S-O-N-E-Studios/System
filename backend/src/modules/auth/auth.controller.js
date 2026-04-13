//  * Endpoints:
//  *  POST /auth/login
//  *  POST /auth/register-org
//  *  POST /auth/accept-invite/:token
//  *  POST /auth/client-activate/:token
//  *  POST /auth/forgot-password
//  *  POST /auth/reset-password/:token
//  *  POST /auth/refresh
//  *  POST /auth/logout
//  *  POST /auth/change-password
//  *  GET  /auth/check-slug/:slug

const authService = require("./auth.services");
const {
  sendSuccess,
  sendCreated,
  sendError,
  sendUnauthorized,
} = require("../../utils/apiResponse");
const {
  refreshCookieOptions,
  clearCookieOptions,
} = require("../../utils/generateToken");

//  Helper

//  Set the httpOnly refresh token cookie and return the access token in the body.
const issueTokens = (
  res,
  { user, accessToken, refreshToken },
  status = 200,
) => {
  res.cookie("refreshToken", refreshToken, refreshCookieOptions());
  return res.status(status).json({
    success: true,
    data: {
      accessToken,
      user,
    },
  });
};

//  Controllers

//  POST /auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return issueTokens(res, result);
};

//  POST /auth/register-org
const registerOrg = async (req, res) => {
  const result = await authService.registerOrg(req.body);
  return issueTokens(res, result, 201);
};

//  POST /auth/accept-invite/:token
const acceptInvite = async (req, res) => {
  const result = await authService.acceptInvite(req.params.token, req.body);
  return issueTokens(res, result, 201);
};

//  POST /auth/client-activate/:token
const clientActivate = async (req, res) => {
  const { password } = req.body;
  const result = await authService.activateClientAccess(
    req.params.token,
    password,
  );
  return issueTokens(res, result, 201);
};

//  POST /auth/forgot-password
const forgotPassword = async (req, res) => {
  await authService.forgotPassword(req.body.email);
  return sendSuccess(
    res,
    null,
    "If an account exists with this email, a password reset link has been sent.",
  );
};

//  POST /auth/reset-password/:token
const resetPassword = async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  return sendSuccess(
    res,
    null,
    "Password reset successfully. Please log in with your new password.",
  );
};

//  POST /auth/refresh
const refresh = async (req, res) => {
  const rawRefreshToken = req.cookies?.refreshToken;

  if (!rawRefreshToken) {
    return sendUnauthorized(res, "No refresh token provided");
  }

  const result = await authService.refreshTokens(rawRefreshToken);
  return issueTokens(res, result);
};

//  POST /auth/logout
const logout = async (req, res) => {
  if (req.user) {
    await authService.logout(req.user.sub);
  }
  res.clearCookie("refreshToken", clearCookieOptions());
  return sendSuccess(res, null, "Logged out successfully");
};

//  POST /auth/change-password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user.sub, currentPassword, newPassword);
  res.clearCookie("refreshToken", clearCookieOptions()); // Force re-login
  return sendSuccess(
    res,
    null,
    "Password changed successfully. Please log in again.",
  );
};

//  GET /auth/check-slug/:slug
const checkSlug = async (req, res) => {
  const result = await authService.checkSlugAvailability(req.params.slug);
  return sendSuccess(res, result);
};

module.exports = {
  login,
  registerOrg,
  acceptInvite,
  clientActivate,
  forgotPassword,
  resetPassword,
  refresh,
  logout,
  changePassword,
  checkSlug,
};
