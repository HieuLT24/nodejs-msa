const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    category: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

productSchema.index({ category: 1, price: 1 });
productSchema.index({ name: 'text' });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
