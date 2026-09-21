const express = require('express');
const { listProducts, getProductById } = require('../controllers/productController');

const router = express.Router();

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Danh sách sản phẩm (phân trang, tìm kiếm, lọc)
 *     tags: [Product]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: minPrice
 *         schema: { type: number }
 *       - in: query
 *         name: maxPrice
 *         schema: { type: number }
 *     responses:
 *       200: { description: Danh sách sản phẩm kèm meta phân trang }
 */
router.get('/', listProducts);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Chi tiết một sản phẩm
 *     tags: [Product]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Chi tiết sản phẩm }
 *       404: { description: Không tìm thấy sản phẩm }
 */
router.get('/:id', getProductById);

module.exports = router;
