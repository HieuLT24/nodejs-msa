const request = require('supertest');
const bcrypt = require('bcryptjs');

jest.mock('../src/models/User');
const User = require('../src/models/User');
const createApp = require('../src/app');

// In-memory fake collection backing the mocked User model
let store;
let idCounter;

function fakeId() {
  idCounter += 1;
  return { toString: () => `id_${idCounter}` };
}

beforeEach(() => {
  store = [];
  idCounter = 0;
  jest.clearAllMocks();

  User.findOne.mockImplementation(({ email, refreshToken }) => {
    if (refreshToken !== undefined) {
      return Promise.resolve(store.find((u) => u.refreshToken === refreshToken) || null);
    }
    return Promise.resolve(store.find((u) => u.email === email) || null);
  });

  User.findById.mockImplementation((id) => Promise.resolve(store.find((u) => u._id.toString() === id) || null));

  User.create.mockImplementation(async (data) => {
    const user = {
      _id: fakeId(),
      email: data.email,
      password: data.password,
      refreshToken: null,
      save: jest.fn(async function save() {
        return this;
      }),
    };
    store.push(user);
    return user;
  });

  User.updateOne.mockImplementation(async ({ refreshToken }, update) => {
    const user = store.find((u) => u.refreshToken === refreshToken);
    if (user) user.refreshToken = update.$set.refreshToken;
    return { modifiedCount: user ? 1 : 0 };
  });
});

const app = createApp();

describe('POST /auth/register', () => {
  it('creates a new account and returns 201', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'hieu@example.com', password: 'Password123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('hieu@example.com');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'hieu@example.com' });
    expect(res.status).toBe(400);
    expect(res.body.errorCode).toBe('MISSING_FIELDS');
  });

  it('returns 409 when email already exists', async () => {
    await request(app).post('/auth/register').send({ email: 'dup@example.com', password: '123456' });
    const res = await request(app).post('/auth/register').send({ email: 'dup@example.com', password: '123456' });
    expect(res.status).toBe(409);
    expect(res.body.errorCode).toBe('EMAIL_EXISTS');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    const hashed = await bcrypt.hash('CorrectPass1', 10);
    store.push({ _id: fakeId(), email: 'login@example.com', password: hashed, refreshToken: null, save: jest.fn(async function () { return this; }) });
  });

  it('returns 401 with standardized error when password is wrong', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'WrongPass' });

    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
    expect(res.body.message).toBe('Email hoặc mật khẩu không chính xác');
  });

  it('returns 401 when email does not exist', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('INVALID_CREDENTIALS');
  });

  it('returns 200 with access & refresh token on success', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'CorrectPass1' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});

describe('POST /auth/refresh', () => {
  it('issues a new access token from a valid refresh token', async () => {
    await request(app).post('/auth/register').send({ email: 'r@example.com', password: 'Password123' });
    const loginRes = await request(app).post('/auth/login').send({ email: 'r@example.com', password: 'Password123' });

    const res = await request(app).post('/auth/refresh').send({ refreshToken: loginRes.body.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it('rejects an invalid refresh token', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'bogus.token.here' });
    expect(res.status).toBe(401);
    expect(res.body.errorCode).toBe('INVALID_REFRESH_TOKEN');
  });
});

describe('POST /auth/logout', () => {
  it('clears refresh token and returns 204', async () => {
    await request(app).post('/auth/register').send({ email: 'lo@example.com', password: 'Password123' });
    const loginRes = await request(app).post('/auth/login').send({ email: 'lo@example.com', password: 'Password123' });

    const res = await request(app).post('/auth/logout').send({ refreshToken: loginRes.body.refreshToken });
    expect(res.status).toBe(204);
  });
});
