/**
 * routes/auth.routes.js
 */
const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const { validate, schemas } = require('../validators/schemas');

router.post('/login',           validate(schemas.login),       ctrl.login);
router.post('/register-org',    validate(schemas.registerOrg), ctrl.registerOrg);
router.post('/refresh',                                         ctrl.refreshToken);
router.post('/logout',          authenticate,                   ctrl.logout);
router.get('/check-slug/:slug',                                 ctrl.checkSlug);
router.post('/forgot-password',                                 ctrl.forgotPassword);
router.post('/reset-password/:token',                           ctrl.resetPassword);
router.post('/change-password', authenticate, validate(schemas.changePassword), ctrl.changePassword);
router.post('/client-activate/:token',                          ctrl.clientActivate);

module.exports = router;
