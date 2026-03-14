const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  getProducts, getProductBySlug, createProduct,
  updateProduct, deleteProduct, uploadImage
} = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Multer: store uploaded files in memory (then send to Cloudinary)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', getProducts);
router.get('/:slug', getProductBySlug);

// Admin-only routes (must be logged in AND be admin)
router.post('/', protect, adminOnly, createProduct);
router.put('/:id', protect, adminOnly, updateProduct);
router.delete('/:id', protect, adminOnly, deleteProduct);
router.post('/upload/image', protect, adminOnly, upload.single('image'), uploadImage);

module.exports = router;