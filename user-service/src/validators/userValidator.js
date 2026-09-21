const Joi = require('joi');

const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  phone: Joi.string().pattern(/^(0|\+84)[0-9]{9,10}$/).messages({
    'string.pattern.base': 'Số điện thoại không đúng định dạng Việt Nam',
  }),
  email: Joi.string().email(),
}).min(1);

module.exports = { updateUserSchema };
