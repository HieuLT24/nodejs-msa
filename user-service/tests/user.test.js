const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../src/models/User');
const User = require('../src/models/User');
const createApp = require('../src/app');

process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_dev';
const app = createApp();

function authHeader() {
  const token = jwt.sign({ sub: 'u1' }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
  return `Bearer ${token}`;
}

const VALID_ID = '64b7f0f0f0f0f0f0f0f0f0f0';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /users/:id', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/users/${VALID_ID}`);
    expect(res.status).toBe(401);
  });

  it('returns the user profile without password-like sensitive fields', async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: VALID_ID, email: 'a@b.com', name: 'A B' }),
    });

    const res = await request(app).get(`/users/${VALID_ID}`).set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('a@b.com');
  });

  it('returns 404 when user does not exist', async () => {
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });
    const res = await request(app).get(`/users/${VALID_ID}`).set('Authorization', authHeader());
    expect(res.status).toBe(404);
    expect(res.body.errorCode).toBe('USER_NOT_FOUND');
  });

  it('returns 400 for a malformed id (CastError)', async () => {
    const castError = new Error('cast failed');
    castError.name = 'CastError';
    User.findById.mockReturnValue({ select: jest.fn().mockRejectedValue(castError) });

    const res = await request(app).get('/users/not-a-valid-id').set('Authorization', authHeader());
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('INVALID_ID');
  });
});

describe('PUT /users/:id', () => {
  it('rejects invalid phone format with 400', async () => {
    const res = await request(app)
      .put(`/users/${VALID_ID}`)
      .set('Authorization', authHeader())
      .send({ phone: 'abc-not-a-phone' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('rejects an invalid email format with 400', async () => {
    const res = await request(app)
      .put(`/users/${VALID_ID}`)
      .set('Authorization', authHeader())
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('VALIDATION_ERROR');
  });

  it('returns 409 when email already used by another account', async () => {
    User.findOne.mockResolvedValue({ _id: 'other-id', email: 'dup@example.com' });
    const res = await request(app)
      .put(`/users/${VALID_ID}`)
      .set('Authorization', authHeader())
      .send({ email: 'dup@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('EMAIL_EXISTS');
  });

  it('updates and returns the user on valid data', async () => {
    User.findOne.mockResolvedValue(null);
    User.findByIdAndUpdate.mockResolvedValue({ _id: VALID_ID, name: 'New Name', phone: '0912345678' });

    const res = await request(app)
      .put(`/users/${VALID_ID}`)
      .set('Authorization', authHeader())
      .send({ name: 'New Name', phone: '0912345678' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New Name');
  });
});
