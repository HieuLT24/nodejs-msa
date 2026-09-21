const AppError = require('../utils/AppError');
const { INTERNAL_ERROR } = require('../utils/messages');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ errorCode: 'INVALID_JSON', message: 'Dữ liệu JSON không hợp lệ' });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ errorCode: err.errorCode, message: err.message });
  }

  console.error(err);
  return res.status(500).json({ errorCode: 'INTERNAL_ERROR', message: INTERNAL_ERROR });
}

module.exports = errorHandler;
