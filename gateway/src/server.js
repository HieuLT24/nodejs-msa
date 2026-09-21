const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 4000;

const routes = [
  { path: '/api/auth', target: process.env.AUTH_SERVICE_URL || 'http://localhost:4001', rewrite: '/auth' },
  { path: '/api/users', target: process.env.USER_SERVICE_URL || 'http://localhost:4002', rewrite: '/users' },
  { path: '/api/products', target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:4003', rewrite: '/products' },
  { path: '/api/cart', target: process.env.CART_SERVICE_URL || 'http://localhost:4004', rewrite: '/cart' },
];

routes.forEach(({ path, target, rewrite }) => {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${path}`]: rewrite },
    })
  );
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

app.listen(PORT, () => console.log(`api-gateway listening on port ${PORT}`));
