const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User } = require('../models');
const { findSafeUserById } = require('../services/userService');

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

const GENERIC_FORGOT_MESSAGE =
  'If an account exists for that email, you will receive password reset instructions shortly.';

function pickSafeUser(userInstance) {
  const user = userInstance?.get ? userInstance.get({ plain: true }) : userInstance;
  if (!user) return null;
  // Ensure password and reset fields never leave the API response
  // eslint-disable-next-line no-unused-vars
  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    ...safe
  } = user;
  return safe;
}

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function getFrontendBaseUrl() {
  return (
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    'http://localhost:5173'
  ).replace(/\/$/, '');
}

function validatePasswordStrength(password) {
  const value = String(password);
  if (value.length < 6) {
    return 'Password must be at least 6 characters';
  }
  return null;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function signup(req, res) {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: name, email, password',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(String(password), 10);

    const createdUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return res.status(201).json({
      status: 'ok',
      message: 'Signup successful',
      user: pickSafeUser(createdUser),
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        status: 'error',
        message: 'Email already in use',
      });
    }

    return res.status(500).json({
      status: 'error',
      message: 'Signup failed',
      error: err.message,
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: email, password',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        status: 'error',
        message: 'JWT secret not configured',
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '1d' },
    );

    return res.json({
      status: 'ok',
      message: 'Login successful',
      token,
      user: pickSafeUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: err.message,
    });
  }
}

async function getProfile(req, res) {
  try {
    const user = await findSafeUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }
    return res.json({
      status: 'ok',
      user,
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load profile',
      error: err.message,
    });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: email',
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address',
      });
    }

    const user = await User.findOne({ where: { email: normalizedEmail } });

    let resetUrl;
    if (user) {
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);

      user.resetPasswordToken = tokenHash;
      user.resetPasswordExpires = expiresAt;
      await user.save();

      resetUrl = `${getFrontendBaseUrl()}/reset-password/${rawToken}`;

      console.log('[password-reset] Reset link for', normalizedEmail, ':', resetUrl);

      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        // Email delivery can be wired here (e.g. nodemailer) when SMTP is configured.
        console.log('[password-reset] SMTP configured — send email to user in production.');
      }
    }

    const payload = {
      status: 'ok',
      message: GENERIC_FORGOT_MESSAGE,
    };

    if (resetUrl && process.env.NODE_ENV !== 'production') {
      payload.resetUrl = resetUrl;
    }

    return res.json(payload);
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process password reset request',
      error: err.message,
    });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: token, password',
      });
    }

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({
        status: 'error',
        message: passwordError,
      });
    }

    const tokenHash = hashResetToken(token);
    const user = await User.findOne({
      where: {
        resetPasswordToken: tokenHash,
        resetPasswordExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired reset token. Please request a new password reset link.',
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({
      status: 'ok',
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Password reset failed',
      error: err.message,
    });
  }
}

module.exports = {
  signup,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
};

