const User = require('../models/User');
const AppError = require('../utils/AppError');

async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
    }
    return res.status(200).json(user);
  } catch (err) {
    if (err.name === 'CastError') {
      return next(new AppError('ID người dùng không hợp lệ', 400, 'INVALID_ID'));
    }
    return next(err);
  }
}

async function updateUser(req, res, next) {
  try {
    if (req.body.email) {
      const existing = await User.findOne({ email: req.body.email, _id: { $ne: req.params.id } });
      if (existing) {
        throw new AppError('Email đã được sử dụng bởi tài khoản khác', 409, 'EMAIL_EXISTS');
      }
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng', 404, 'USER_NOT_FOUND');
    }
    return res.status(200).json(user);
  } catch (err) {
    if (err.name === 'CastError') {
      return next(new AppError('ID người dùng không hợp lệ', 400, 'INVALID_ID'));
    }
    return next(err);
  }
}

module.exports = { getUser, updateUser };
