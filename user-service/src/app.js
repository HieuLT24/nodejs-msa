const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const userRoutes = require('./routes/userRoutes');
const errorHandler = require('./middlewares/errorHandler');

function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok', service: 'user-service' }));

  app.use('/users', userRoutes);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
