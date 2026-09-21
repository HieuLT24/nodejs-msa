const express = require('express');
const { register, login, refresh, logout } = require('../controllers/authController');

const router = express.Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201: { description: Tạo tài khoản thành công }
 *       400: { description: Thiếu thông tin bắt buộc }
 *       409: { description: Email đã tồn tại }
 */
router.post('/register', register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Đăng nhập và nhận Access/Refresh Token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Đăng nhập thành công }
 *       401: { description: Sai email hoặc mật khẩu }
 */
router.post('/login', login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     summary: Cấp lại Access Token từ Refresh Token
 *     tags: [Auth]
 *     responses:
 *       200: { description: Access token mới }
 *       401: { description: Refresh token không hợp lệ }
 */
router.post('/refresh', refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Đăng xuất, thu hồi Refresh Token
 *     tags: [Auth]
 *     responses:
 *       204: { description: Đăng xuất thành công }
 */
router.post('/logout', logout);

module.exports = router;
