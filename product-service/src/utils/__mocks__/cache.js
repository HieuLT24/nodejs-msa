module.exports = {
  getOrSetCache: jest.fn(async (key, ttl, dbCallback) => ({ data: await dbCallback(), fromCache: false })),
  invalidateProductCache: jest.fn(),
};
