const Cart = require('../models/Cart');
const AppError = require('../utils/AppError');
const { getProduct } = require('../services/productClient');

function computeTotal(items) {
  return items.reduce((sum, it) => sum + it.priceSnapshot * it.quantity, 0);
}

async function getCart(req, res, next) {
  try {
    const cart = (await Cart.findOne({ userId: req.user.sub })) || { userId: req.user.sub, items: [] };
    return res.status(200).json({ userId: cart.userId, items: cart.items, total: computeTotal(cart.items) });
  } catch (err) {
    return next(err);
  }
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      throw new AppError('Vui lòng cung cấp productId và quantity hợp lệ', 400, 'MISSING_FIELDS');
    }

    const product = await getProduct(productId);
    if (product.stock < quantity) {
      throw new AppError('Số lượng vượt quá tồn kho', 422, 'OUT_OF_STOCK');
    }

    let cart = await Cart.findOne({ userId: req.user.sub });
    if (!cart) {
      cart = new Cart({ userId: req.user.sub, items: [] });
    }

    const existing = cart.items.find((it) => it.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, priceSnapshot: product.price });
    }

    await cart.save();
    return res.status(200).json({ userId: cart.userId, items: cart.items, total: computeTotal(cart.items) });
  } catch (err) {
    return next(err);
  }
}

async function updateItem(req, res, next) {
  try {
    const { quantity } = req.body;
    if (quantity === undefined || quantity < 0) {
      throw new AppError('quantity không hợp lệ', 400, 'INVALID_QUANTITY');
    }

    const cart = await Cart.findOne({ userId: req.user.sub });
    if (!cart) {
      throw new AppError('Giỏ hàng trống', 404, 'CART_NOT_FOUND');
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((it) => it.productId !== req.params.productId);
    } else {
      const item = cart.items.find((it) => it.productId === req.params.productId);
      if (!item) {
        throw new AppError('Sản phẩm không có trong giỏ hàng', 404, 'ITEM_NOT_FOUND');
      }
      item.quantity = quantity;
    }

    await cart.save();
    return res.status(200).json({ userId: cart.userId, items: cart.items, total: computeTotal(cart.items) });
  } catch (err) {
    return next(err);
  }
}

async function removeItem(req, res, next) {
  try {
    const cart = await Cart.findOne({ userId: req.user.sub });
    if (!cart) {
      throw new AppError('Giỏ hàng trống', 404, 'CART_NOT_FOUND');
    }
    cart.items = cart.items.filter((it) => it.productId !== req.params.productId);
    await cart.save();
    return res.status(200).json({ userId: cart.userId, items: cart.items, total: computeTotal(cart.items) });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getCart, addItem, updateItem, removeItem, computeTotal };
