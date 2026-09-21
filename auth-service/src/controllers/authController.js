const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const messages = require('../utils/messages');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

async function register(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError(messages.MISSING_FIELDS, 400, 'MISSING_FIELDS');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(messages.EMAIL_EXISTS, 409, 'EMAIL_EXISTS');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed });

    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new AppError(messages.MISSING_FIELDS, 400, 'MISSING_FIELDS');
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Standardized 401 instead of leaking whether the email exists
      throw new AppError(messages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new AppError(messages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
    }

    const payload = { sub: user._id.toString(), email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({ accessToken, refreshToken });
  } catch (err) {
    return next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError(messages.INVALID_REFRESH_TOKEN, 401, 'INVALID_REFRESH_TOKEN');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (e) {
      throw new AppError(messages.INVALID_REFRESH_TOKEN, 401, 'INVALID_REFRESH_TOKEN');
    }

    const user = await User.findById(decoded.sub);
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError(messages.INVALID_REFRESH_TOKEN, 401, 'INVALID_REFRESH_TOKEN');
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), email: user.email });
    return res.status(200).json({ accessToken });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await User.updateOne({ refreshToken }, { $set: { refreshToken: null } });
    }
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

module.exports = { register, login, refresh, logout };
