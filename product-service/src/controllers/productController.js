const crypto = require('crypto');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const { getOrSetCache } = require('../utils/cache');

function buildFilter(query) {
  const filter = {};
  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }
  if (query.category) {
    filter.category = query.category;
  }
  const min = Number(query.minPrice);
  const max = Number(query.maxPrice);
  if (!Number.isNaN(min) || !Number.isNaN(max)) {
    filter.price = {};
    if (!Number.isNaN(min)) filter.price.$gte = min;
    if (!Number.isNaN(max)) filter.price.$lte = max;
  }
  return filter;
}

function cacheKeyFor(query) {
  const normalized = JSON.stringify(
    Object.keys(query)
      .sort()
      .reduce((acc, k) => {
        acc[k] = query[k];
        return acc;
      }, {})
  );
  const hash = crypto.createHash('md5').update(normalized).digest('hex');
  return `products:list:${hash}`;
}

async function listProducts(req, res, next) {
  try {
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);
    if (!Number.isInteger(page) || page < 1) page = 1;
    if (!Number.isInteger(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100;

    const filter = buildFilter(req.query);
    const key = cacheKeyFor({ ...req.query, page, limit });

    const { data, fromCache } = await getOrSetCache(key, 300, async () => {
      const [items, totalItems] = await Promise.all([
        Product.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit),
        Product.countDocuments(filter),
      ]);

      return {
        data: items,
        meta: {
          totalItems,
          totalPages: Math.max(1, Math.ceil(totalItems / limit)),
          currentPage: page,
          hasNextPage: page * limit < totalItems,
        },
      };
    });

    res.set('X-Cache', fromCache ? 'HIT' : 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}

async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      throw new AppError('Không tìm thấy sản phẩm', 404, 'PRODUCT_NOT_FOUND');
    }
    return res.status(200).json(product);
  } catch (err) {
    if (err.name === 'CastError') {
      return next(new AppError('ID sản phẩm không hợp lệ', 400, 'INVALID_ID'));
    }
    return next(err);
  }
}

module.exports = { listProducts, getProductById, buildFilter, cacheKeyFor };
