const axios = require('axios');
const AppError = require('../utils/AppError');

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:4003';
const TIMEOUT_MS = 3000;
const MAX_RETRIES = 2;

/**
 * Gọi liên service sang Product Service để lấy thông tin sản phẩm (giá, tồn kho).
 * Có timeout + retry cho lỗi mạng tạm thời.
 */
async function getProduct(productId) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await axios.get(`${PRODUCT_SERVICE_URL}/products/${productId}`, { timeout: TIMEOUT_MS });
      return res.data;
    } catch (err) {
      if (err.response && err.response.status === 404) {
        throw new AppError('Sản phẩm không tồn tại', 404, 'PRODUCT_NOT_FOUND');
      }
      if (attempt === MAX_RETRIES) {
        throw new AppError('Không thể kết nối Product Service', 502, 'PRODUCT_SERVICE_UNAVAILABLE');
      }
      // retry on network/timeout errors
    }
  }
  return null;
}

module.exports = { getProduct };
