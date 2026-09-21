const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/Cart');
jest.mock('../src/services/productClient');

const Cart = require('../src/models/Cart');
const { getProduct } = require('../src/services/productClient');
const createApp = require('../src/app');

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
const app = createApp();

function authHeader(sub = 'user-1') {
  const token = jwt.sign({ sub }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  return `Bearer ${token}`;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Auth guard', () => {
  it('rejects requests without a Bearer token', async () => {
    const res = await request(app).get('/cart');
    expect(res.status).toBe(401);
  });
});

describe('GET /cart', () => {
  it('returns an empty cart with total 0 when none exists yet', async () => {
    Cart.findOne.mockResolvedValue(null);
    const res = await request(app).get('/cart').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  it('computes the total from existing items', async () => {
    Cart.findOne.mockResolvedValue({
      userId: 'user-1',
      items: [{ productId: 'p1', quantity: 2, priceSnapshot: 100 }],
    });
    const res = await request(app).get('/cart').set('Authorization', authHeader());
    expect(res.body.total).toBe(200);
  });
});

describe('POST /cart/items', () => {
  it('returns 400 when productId or quantity is missing', async () => {
    const res = await request(app).post('/cart/items').set('Authorization', authHeader()).send({ productId: 'p1' });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('MISSING_FIELDS');
  });

  it('returns 422 when quantity exceeds stock', async () => {
    getProduct.mockResolvedValue({ _id: 'p1', price: 50, stock: 1 });
    const res = await request(app)
      .post('/cart/items')
      .set('Authorization', authHeader())
      .send({ productId: 'p1', quantity: 5 });

    expect(res.status).toBe(422);
    expect(res.body.errorCode).toBe('OUT_OF_STOCK');
  });

  it('creates a new cart and adds the item on first purchase', async () => {
    getProduct.mockResolvedValue({ _id: 'p1', price: 50, stock: 10 });
    Cart.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/cart/items')
      .set('Authorization', authHeader())
      .send({ productId: 'p1', quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(100);
  });

  it('accumulates quantity when the product is already in the cart', async () => {
    getProduct.mockResolvedValue({ _id: 'p1', price: 50, stock: 10 });
    Cart.findOne.mockResolvedValue({
      userId: 'user-1',
      items: [{ productId: 'p1', quantity: 1, priceSnapshot: 50 }],
      save: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .post('/cart/items')
      .set('Authorization', authHeader())
      .send({ productId: 'p1', quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.items[0].quantity).toBe(3);
  });

  it('propagates a 404 from the Product Service when the product does not exist', async () => {
    const AppError = require('../src/utils/AppError');
    getProduct.mockRejectedValue(new AppError('Sản phẩm không tồn tại', 404, 'PRODUCT_NOT_FOUND'));

    const res = await request(app)
      .post('/cart/items')
      .set('Authorization', authHeader())
      .send({ productId: 'missing', quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('PRODUCT_NOT_FOUND');
  });
});

describe('PUT /cart/items/:productId', () => {
  it('removes the item when quantity is set to 0', async () => {
    Cart.findOne.mockResolvedValue({
      userId: 'user-1',
      items: [{ productId: 'p1', quantity: 2, priceSnapshot: 50 }],
      save: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app)
      .put('/cart/items/p1')
      .set('Authorization', authHeader())
      .send({ quantity: 0 });

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('returns 404 when the item is not in the cart', async () => {
    Cart.findOne.mockResolvedValue({ userId: 'user-1', items: [], save: jest.fn() });
    const res = await request(app)
      .put('/cart/items/not-there')
      .set('Authorization', authHeader())
      .send({ quantity: 2 });

    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('ITEM_NOT_FOUND');
  });
});

describe('DELETE /cart/items/:productId', () => {
  it('removes an existing item from the cart', async () => {
    Cart.findOne.mockResolvedValue({
      userId: 'user-1',
      items: [{ productId: 'p1', quantity: 1, priceSnapshot: 50 }],
      save: jest.fn().mockResolvedValue(true),
    });

    const res = await request(app).delete('/cart/items/p1').set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('returns 404 when there is no cart yet', async () => {
    Cart.findOne.mockResolvedValue(null);
    const res = await request(app).delete('/cart/items/p1').set('Authorization', authHeader());
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('CART_NOT_FOUND');
  });
});
