const Product = require('../models/Product');
const cloudinary = require('../utils/cloudinary');

// @GET /api/products — Get all products with search, filter, pagination
const getProducts = async (req, res) => {
  const { search, category, minPrice, maxPrice, page = 1, limit = 12, featured } = req.query;

  // Build filter object dynamically
  const filter = { isActive: true };
  
  if (search) {
    filter.$text = { $search: search }; // Uses the text index we created
  }
  if (category) {
    filter.category = category;
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  if (featured === 'true') {
    filter.isFeatured = true;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const total = await Product.countDocuments(filter);
  
  const products = await Product.find(filter)
    .populate('category', 'name slug') // Get category name, not just ID
    .limit(Number(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  res.json({
    products,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
};

// @GET /api/products/:slug — Get single product with related & upsell
const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    .populate('category', 'name slug')
    .populate('relatedProducts', 'name slug price images rating')
    .populate('upsellProducts', 'name slug price images rating comparePrice');

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // If no related products were manually set, auto-find by category
  if (product.relatedProducts.length === 0) {
    const autoRelated = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id }, // Exclude current product
      isActive: true,
    })
    .limit(4)
    .select('name slug price images rating');
    
    product.relatedProducts = autoRelated;
  }

  res.json(product);
};

// @POST /api/products — Admin: Create product
const createProduct = async (req, res) => {
  const { name, description, price, comparePrice, category, tags, stock, 
          isFeatured, relatedProducts, upsellProducts } = req.body;

  // Auto-generate slug from name: "Running Shoes" → "running-shoes"
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const product = await Product.create({
    name, slug, description, price, comparePrice,
    category, tags, stock, isFeatured,
    relatedProducts: relatedProducts || [],
    upsellProducts: upsellProducts || [],
    images: req.body.images || [],
  });

  const populated = await product.populate('category', 'name slug');
  res.status(201).json(populated);
};

// @PUT /api/products/:id — Admin: Update product
const updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Update only the fields that were sent
  Object.assign(product, req.body);
  
  // Regenerate slug if name changed
  if (req.body.name) {
    product.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  const updated = await product.save();
  res.json(updated);
};

// @DELETE /api/products/:id — Admin: Delete product
const deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  // Delete all images from Cloudinary
  for (const image of product.images) {
    if (image.publicId) {
      await cloudinary.uploader.destroy(image.publicId);
    }
  }

  await product.deleteOne();
  res.json({ message: 'Product deleted successfully' });
};

// @POST /api/products/upload — Admin: Upload image to Cloudinary
const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Convert buffer to base64 for Cloudinary
  const b64 = Buffer.from(req.file.buffer).toString('base64');
  const dataURI = `data:${req.file.mimetype};base64,${b64}`;
  
  const result = await cloudinary.uploader.upload(dataURI, {
    folder: 'ecommerce-products',
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  });

  res.json({ url: result.secure_url, publicId: result.public_id });
};

module.exports = { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, uploadImage };