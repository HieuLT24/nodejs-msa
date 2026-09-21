const express = require('express');
const { getUser, updateUser } = require('../controllers/userController');
const validate = require('../middlewares/validate');
const requireAuth = require('../middlewares/auth');
const { updateUserSchema } = require('../validators/userValidator');

const router = express.Router();

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin hồ sơ người dùng
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Thông tin người dùng }
 *       404: { description: Không tìm thấy người dùng }
 */
router.get('/:id', requireAuth, getUser);

/**
 * @openapi
 * /users/{id}:
 *   put:
 *     summary: Cập nhật hồ sơ người dùng
 *     tags: [User]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *     responses:
 *       200: { description: Cập nhật thành công }
 *       400: { description: Dữ liệu không hợp lệ }
 *       409: { description: Email đã tồn tại }
 */
router.put('/:id', requireAuth, validate(updateUserSchema), updateUser);

module.exports = router;
