require('dotenv').config();
const createApp = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 4004;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cart_db';

async function start() {
  await connectDB(MONGO_URI);
  const app = createApp();
  app.listen(PORT, () => console.log(`cart-service listening on port ${PORT}`));
}

start().catch((err) => {
  console.error('Failed to start cart-service', err);
  process.exit(1);
});
