require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';

async function start() {
  await connectDB(MONGO_URI);
  const app = createApp();
  app.listen(PORT, () => console.log(`product-service listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start product-service', err);
  process.exit(1);
});
