/**
 * All routes are prefixed with /api/v1/auth
 *
 * Public routes (no JWT required):
 *
 *  POST /login
 *  POST /register-org
 *  POST /accept-invite/:inviteToken
 *  POST /client-active/:token
 *  POST /forgot-password
 *  POST /reset-password/:token
 *  GET  /check-slug/:slug
 *
 *  Protected routes (JWT required):
 *      POST /refresh
 *      POST /logout
 *      POST /change-password
 *
 * */

const express = require("express");
const router = express.Router();
const controller = require("./auth.controller");
const validate = require("../../middleware/validation.middleware");
const asyncHandler = require("../../utils/asyncHandler");
const { authenticate } = require("../../middleware/auth.middleware");
const {
  loginSchema,
  registerOrgSchema,
  acceptInviteSchema,
  clientActivateSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("./auth.validation");

// Public routes
router.post("/login", validate(loginSchema), asyncHandler(controller.login)); // the login route
router.post(
  "/register-org",
  validate(registerOrgSchema),
  asyncHandler(controller.registerOrg),
);
router.post(
  "/accept-invite/:token",
  validate(acceptInviteSchema),
  asyncHandler(controller.acceptInvite),
); // the accept invite route this route will be used when a user accepts an invite to join an organization so the token will be the invite token that was sent to the user's email
router.post(
  "/client-activate/:token",
  validate(clientActivateSchema),
  asyncHandler(controller.clientActivate),
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  asyncHandler(controller.forgotPassword),
);
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  asyncHandler(controller.resetPassword),
);
router.get("/check-slug/:slug", asyncHandler(controller.checkSlug)); // this route will be used to check if an organization slug is available or not when a user is registering an organization so the slug will be the organization slug that the user wants to use and we will check if it is available or not and return a boolean value indicating whether the slug is available or not

// Protected routes
router.post("/refresh", authenticate, asyncHandler(controller.refresh));
router.post("/logout", authenticate, asyncHandler(controller.logout));
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(controller.changePassword),
);

module.exports = router;
