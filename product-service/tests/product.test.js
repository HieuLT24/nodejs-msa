const request = require('supertest');

jest.mock('../src/models/Product');
jest.mock('../src/utils/cache');

const Product = require('../src/models/Product');
const { getOrSetCache } = require('../src/utils/cache');
const { buildFilter, cacheKeyFor } = require('../src/controllers/productController');
const createApp = require('../src/app');

const app = createApp();

beforeEach(() => {
  jest.clearAllMocks();
});

function mockFindChain(items) {
  const chain = {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(items),
  };
  Product.find.mockReturnValue(chain);
  return chain;
}

describe('buildFilter (pure function)', () => {
  it('builds a case-insensitive regex filter for search', () => {
    const filter = buildFilter({ search: 'chair' });
    expect(filter.name.$regex).toBe('chair');
    expect(filter.name.$options).toBe('i');
  });

  it('builds a category filter', () => {
    expect(buildFilter({ category: 'furniture' })).toEqual({ category: 'furniture' });
  });

  it('builds a price range filter with only minPrice', () => {
    expect(buildFilter({ minPrice: '100' })).toEqual({ price: { $gte: 100 } });
  });

  it('builds a combined price range filter', () => {
    expect(buildFilter({ minPrice: '100', maxPrice: '500' })).toEqual({ price: { $gte: 100, $lte: 500 } });
  });

  it('returns an empty filter when no query params are given', () => {
    expect(buildFilter({})).toEqual({});
  });
});

describe('cacheKeyFor (pure function)', () => {
  it('produces the same key regardless of query parameter order', () => {
    const k1 = cacheKeyFor({ page: 1, category: 'a' });
    const k2 = cacheKeyFor({ category: 'a', page: 1 });
    expect(k1).toBe(k2);
  });

  it('produces different keys for different queries', () => {
    const k1 = cacheKeyFor({ page: 1 });
    const k2 = cacheKeyFor({ page: 2 });
    expect(k1).not.toBe(k2);
  });
});

describe('GET /products', () => {
  it('returns paginated data with meta info', async () => {
    mockFindChain([{ name: 'Chair' }]);
    Product.countDocuments.mockResolvedValue(1);

    const res = await request(app).get('/products');
    expect(res.status).toBe(200);
    expect(res.body.meta.totalItems).toBe(1);
    expect(res.body.meta.currentPage).toBe(1);
    expect(res.headers['x-cache']).toBe('MISS');
  });

  it('clamps limit to a maximum of 100', async () => {
    mockFindChain([]);
    Product.countDocuments.mockResolvedValue(0);

    await request(app).get('/products?limit=999');
    const chainArgsCall = Product.find.mock.results[0].value;
    expect(chainArgsCall.limit).toHaveBeenCalledWith(100);
  });

  it('falls back to page=1 for an invalid page value', async () => {
    mockFindChain([]);
    Product.countDocuments.mockResolvedValue(0);

    const res = await request(app).get('/products?page=-5');
    expect(res.status).toBe(200);
    expect(res.body.meta.currentPage).toBe(1);
  });

  it('reports X-Cache: HIT when getOrSetCache reports a cache hit', async () => {
    getOrSetCache.mockResolvedValueOnce({
      data: { data: [], meta: { totalItems: 0, totalPages: 1, currentPage: 1, hasNextPage: false } },
      fromCache: true,
    });

    const res = await request(app).get('/products');
    expect(res.headers['x-cache']).toBe('HIT');
  });
});

describe('GET /products/:id', () => {
  it('returns 404 when the product does not exist', async () => {
    Product.findById.mockResolvedValue(null);
    const res = await request(app).get('/products/64b7f0f0f0f0f0f0f0f0f0f0');
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('PRODUCT_NOT_FOUND');
  });

  it('returns 400 for a malformed id', async () => {
    const castError = new Error('cast failed');
    castError.name = 'CastError';
    Product.findById.mockRejectedValue(castError);

    const res = await request(app).get('/products/not-valid');
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_ID');
  });

  it('returns the product on success', async () => {
    Product.findById.mockResolvedValue({ _id: '1', name: 'Chair' });
    const res = await request(app).get('/products/64b7f0f0f0f0f0f0f0f0f0f0');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Chair');
  });
});

describe('Security headers & rate limiting', () => {
  it('sets basic Helmet security headers', async () => {
    mockFindChain([]);
    Product.countDocuments.mockResolvedValue(0);
    const res = await request(app).get('/products');
    expect(res.headers['x-dns-prefetch-control']).toBeDefined();
  });
});
