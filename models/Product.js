// The Product model is the core of our e-commerce store.
// It holds everything about a product: name, price, images, stock, etc.
// It also stores "upsell" products — what to recommend when viewing this product.

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number }, // Original price for "sale" display
  
  images: [{ 
    url: String, 
    publicId: String // Cloudinary public ID (needed to delete images)
  }],
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category', // Links to the Category model
    required: true,
  },
  
  tags: [String], // e.g. ["wireless", "gaming", "accessories"]
  
  stock: { type: Number, default: 0, min: 0 },
  
  // Related products: shown at bottom of product page
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  
  // Upsell products: shown as "You might also want..."
  upsellProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
}, { timestamps: true });

// Text search index — allows searching by name, description, tags
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);