const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { generateAccessToken, generateRefreshToken, setTokenCookies } = require('../utils/generateToken');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const crypto = require('crypto');

// @desc    Register new user
// @route   POST /api/auth/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Generate verification token
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const hashedVerifyToken = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const verifyTokenExpires = new Date(Date.now() + 24 * 3600000); // 24 hours

    // Create user (is_verified defaults to false)
    const user = await prisma.user.create({
      data: { 
        name, 
        email, 
        password_hash,
        verify_token: hashedVerifyToken,
        verify_token_expires: verifyTokenExpires
      },
      select: { id: true, name: true, email: true, created_at: true },
    });

    // Create verification URL
    const clientUrl = process.env.CLIENT_URL || `http://localhost:5173`;
    const verifyUrl = `${clientUrl}/verify-email?token=${verifyToken}`;

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verifyUrl);
    } catch (err) {
      console.error('Error sending email, continuing anyway in dev mode...', err);
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address to log in.',
      });
    }

    // Check if user has profile (for onboarding redirect)
    const profile = await prisma.userProfile.findUnique({
      where: { user_id: user.id },
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        hasProfile: !!profile,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  res.cookie('accessToken', '', { maxAge: 0 });
  res.cookie('refreshToken', '', { maxAge: 0 });
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const newAccessToken = generateAccessToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        profile: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    
    // For security reasons, do not reveal if a user exists or not
    if (!user) {
      return res.json({
        success: true,
        message: 'If that account exists, we have sent instructions to reset the password.',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    // Hash token and set expiry (1 hour)
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000);

    // Save to DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        reset_token: hashedToken,
        reset_token_expires: resetTokenExpires,
      },
    });

    // Create reset URL
    const clientUrl = process.env.CLIENT_URL || `http://localhost:5173`;
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      console.error('Error sending reset email...', err);
    }

    res.json({
      success: true,
      message: 'If that account exists, we have sent instructions to reset the password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const crypto = require('crypto');

    // Hash the token received from url
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with valid token and not expired
    const user = await prisma.user.findFirst({
      where: {
        reset_token: hashedToken,
        reset_token_expires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Update user password and clear token fields
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password_hash,
        reset_token: null,
        reset_token_expires: null,
      },
    });

    res.json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        verify_token: hashedToken,
        verify_token_expires: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token.',
      });
    }

    // Mark as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        is_verified: true,
        verify_token: null,
        verify_token_expires: null,
      },
    });

    // Generate tokens for automatic login
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          created_at: user.created_at,
        },
        hasProfile: false,
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { signup, login, logout, refreshToken, getMe, forgotPassword, resetPassword, verifyEmail };
