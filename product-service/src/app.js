const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middlewares/errorHandler');

function createApp() {
  const app = express();

  // --- Security hardening ---
  app.use(helmet());

  const whitelist = (process.env.CORS_WHITELIST || '').split(',').filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || whitelist.length === 0 || whitelist.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
    })
  );

  const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
  app.use(limiter);

  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'product-service' }));

  app.use('/products', productRoutes);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
