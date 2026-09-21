const express = require('express');
const requireAuth = require('../middlewares/auth');
const { getCart, addItem, updateItem, removeItem } = require('../controllers/cartController');

const router = express.Router();
router.use(requireAuth);

/**
 * @openapi
 * /cart:
 *   get:
 *     summary: Xem giỏ hàng hiện tại
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Giỏ hàng kèm tổng tiền }
 */
router.get('/', getCart);

/**
 * @openapi
 * /cart/items:
 *   post:
 *     summary: Thêm sản phẩm vào giỏ hàng
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId: { type: string }
 *               quantity: { type: integer }
 *     responses:
 *       200: { description: Giỏ hàng sau khi thêm }
 *       422: { description: Vượt quá tồn kho }
 */
router.post('/items', addItem);

/**
 * @openapi
 * /cart/items/{productId}:
 *   put:
 *     summary: Cập nhật số lượng một sản phẩm trong giỏ
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Giỏ hàng sau khi cập nhật }
 */
router.put('/items/:productId', updateItem);

/**
 * @openapi
 * /cart/items/{productId}:
 *   delete:
 *     summary: Xóa một sản phẩm khỏi giỏ hàng
 *     tags: [Cart]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Giỏ hàng sau khi xóa }
 */
router.delete('/items/:productId', removeItem);

module.exports = router;
