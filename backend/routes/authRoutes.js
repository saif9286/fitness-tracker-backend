const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { signup, login, logout, refreshToken, getMe, forgotPassword, resetPassword, verifyEmail } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/signup',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  signup
);

router.post(
  '/login',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.post(
  '/forgot-password',
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ]),
  forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ]),
  resetPassword
);

router.post(
  '/verify-email',
  validate([
    body('token').notEmpty().withMessage('Token is required'),
  ]),
  verifyEmail
);

router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.get('/me', protect, getMe);

module.exports = router;
