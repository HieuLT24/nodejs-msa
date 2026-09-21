const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Bạn chưa đăng nhập hoặc token không hợp lệ', 401, 'UNAUTHORIZED'));
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    req.user = decoded;
    return next();
  } catch (e) {
    return next(new AppError('Token đã hết hạn hoặc không hợp lệ', 401, 'UNAUTHORIZED'));
  }
}

module.exports = requireAuth;
