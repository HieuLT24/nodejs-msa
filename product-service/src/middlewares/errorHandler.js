const AppError = require('../utils/AppError');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ errorCode: err.errorCode, message: err.message });
  }
  console.error(err);
  return res.status(500).json({ errorCode: 'INTERNAL_ERROR', message: 'Đã xảy ra lỗi hệ thống' });
}

module.exports = errorHandler;
