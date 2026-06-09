const express = require('express');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { protect, checkAccountStatus, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

/**
 * @desc    Get all products (public browsing)
 * @route   GET /api/products
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get vendor's own products
 * @route   GET /api/products/my
 * @access  Private (Vendor)
 */
router.get('/my', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(400).json({ success: false, message: 'No store associated with this vendor.' });
    }

    const products = await Product.find({ storeId: store._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get products by store ID (public — for store page)
 * @route   GET /api/products/store/:storeId
 * @access  Public
 */
router.get('/store/:storeId', async (req, res, next) => {
  try {
    const products = await Product.find({ storeId: req.params.storeId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Get single product by ID (public)
 * @route   GET /api/products/:id
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('storeId', 'name description');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Add a new product
 * @route   POST /api/products
 * @access  Private (Vendor)
 */
router.post('/', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const { name, price, stock, description, image, category } = req.body;
    
    if (!name || price === undefined || stock === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields.' });
    }

    const store = await Store.findOne({ owner: req.user._id });
    if (!store) {
      return res.status(400).json({ success: false, message: 'Please create a store before adding products.' });
    }

    const product = await Product.create({
      storeId: store._id,
      name,
      price,
      stock,
      description,
      image,
      category,
    });

    res.status(201).json({ success: true, message: 'Product created successfully.', product });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Submit a review for a product (customer only, one review per product)
 * @route   POST /api/products/:id/review
 * @access  Private (Customer)
 */
router.post('/:id/review', protect, checkAccountStatus, authorizeRoles('customer'), async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Check if user already reviewed this product
    const alreadyReviewed = product.reviews.find(
      (r) => r.userId.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }

    const review = {
      userId: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment: comment || '',
    };

    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
    product.averageRating =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: 'Review submitted successfully.', product });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private (Vendor)
 */
router.put('/:id', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const { name, price, stock, description, image, category } = req.body;
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const store = await Store.findOne({ owner: req.user._id });
    if (product.storeId.toString() !== store._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: not your product.' });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, stock, description, image, category },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Product updated successfully.', product });
  } catch (error) {
    next(error);
  }
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private (Vendor)
 */
router.delete('/:id', protect, checkAccountStatus, authorizeRoles('vendor'), async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const store = await Store.findOne({ owner: req.user._id });
    if (product.storeId.toString() !== store._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: not your product.' });
    }

    await product.deleteOne();

    res.status(200).json({ success: true, message: 'Product deleted successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
