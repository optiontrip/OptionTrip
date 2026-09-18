import express from 'express';
import passport from 'passport';
import authController from '../controllers/authController.js';
import { authenticate, authenticateRefreshToken } from '../middleware/auth.js';
import {
  authRateLimiter,
  strictAuthRateLimiter,
  generalRateLimiter
} from '../middleware/security.js';
import {
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateLinkProvider
} from '../validators/authValidators.js';
import { uploadProfileImage, handleUploadError } from '../middleware/upload.js';

const router = express.Router();

router.post(
  '/signup',
  authRateLimiter,
  validateRegister,
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateLogin,
  authController.login
);

router.post(
  '/verify-otp',
  authRateLimiter,
  authController.verifyOtp
);

router.post(
  '/resend-otp',
  authRateLimiter,
  authController.resendOtp
);

router.post(
  '/refresh-token',
  generalRateLimiter,
  authenticateRefreshToken,
  authController.refreshToken
);

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false
    })
  );

  router.get(
    '/google/callback',
    passport.authenticate('google', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`
    }),
    authController.oauthCallback
  );
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  router.get(
    '/facebook',
    passport.authenticate('facebook', {
      scope: ['email', 'public_profile'],
      session: false
    })
  );

  router.get(
    '/facebook/callback',
    passport.authenticate('facebook', {
      session: false,
      failureRedirect: `${process.env.FRONTEND_URL}/login?error=facebook_auth_failed`
    }),
    authController.oauthCallback
  );
}


router.get(
  '/me',
  authenticate,
  authController.getMe
);

router.put(
  '/me',
  authenticate,
  generalRateLimiter,
  validateUpdateProfile,
  authController.updateProfile
);

router.post(
  '/upload-profile-image',
  authenticate,
  generalRateLimiter,
  uploadProfileImage,
  handleUploadError,
  authController.uploadProfileImage
);

router.post(
  '/logout',
  authenticate,
  authController.logout
);

router.post(
  '/logout-all',
  authenticate,
  strictAuthRateLimiter,
  authController.logoutAll
);

router.post(
  '/change-password',
  authenticate,
  strictAuthRateLimiter,
  validateChangePassword,
  authController.changePassword
);

router.post(
  '/link-provider',
  authenticate,
  generalRateLimiter,
  validateLinkProvider,
  authController.linkProvider
);

router.delete(
  '/unlink-provider/:provider',
  authenticate,
  generalRateLimiter,
  authController.unlinkProvider
);

router.delete(
  '/me',
  authenticate,
  strictAuthRateLimiter,
  authController.deleteAccount
);

router.patch(
  '/preferences',
  authenticate,
  generalRateLimiter,
  authController.updatePreferences
);

router.patch(
  '/settings',
  authenticate,
  generalRateLimiter,
  authController.updateSettings
);

router.get(
  '/achievements',
  authenticate,
  generalRateLimiter,
  authController.getAchievements
);

export default router;
