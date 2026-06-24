const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { Product, ProductImage } = require('../models');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `product-${unique}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
});

// GET /api/products — paginated list
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      include: [{ model: ProductImage, as: 'images', limit: 1 }],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      products: rows,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
      },
    });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search?q=
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${q}%` } },
          { description: { [Op.like]: `%${q}%` } },
        ],
      },
      include: [{ model: ProductImage, as: 'images', limit: 1 }],
      limit,
      offset,
      distinct: true,
    });

    res.json({
      products: rows,
      pagination: { total: count, page, limit, pages: Math.ceil(count / limit) },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/products/autocomplete?q=
router.get('/autocomplete', async (req, res) => {
  try {
    const q = req.query.q || '';
    const products = await Product.findAll({
      where: { name: { [Op.like]: `%${q}%` } },
      attributes: ['id', 'name', 'price'],
      limit: 8,
    });
    res.json(products.map(p => ({ id: p.id, label: p.name, value: p.name, price: p.price })));
  } catch (err) {
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

// GET /api/products/:id — single product with all images
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage, as: 'images' }],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products — admin only, with up to 5 images
router.post('/', adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const product = await Product.create({ name, description, price: parseFloat(price), stock: parseInt(stock) || 0 });

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await ProductImage.create({
          product_id: product.id,
          image_path: `/uploads/${file.filename}`,
        });
      }
    }

    const full = await Product.findByPk(product.id, { include: [{ model: ProductImage, as: 'images' }] });
    res.status(201).json({ message: 'Product created', product: full });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id — admin only, update product + images
router.put('/:id', adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const { name, description, price, stock, removeImages } = req.body;
    await product.update({
      name: name || product.name,
      description: description !== undefined ? description : product.description,
      price: price ? parseFloat(price) : product.price,
      stock: stock !== undefined ? parseInt(stock) : product.stock,
    });

    // Remove selected images
    if (removeImages) {
      const ids = Array.isArray(removeImages) ? removeImages : [removeImages];
      for (const imgId of ids) {
        const img = await ProductImage.findByPk(imgId);
        if (img) {
          const filePath = path.join(__dirname, '../../public', img.image_path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          await img.destroy();
        }
      }
    }

    // Add new images
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await ProductImage.create({
          product_id: product.id,
          image_path: `/uploads/${file.filename}`,
        });
      }
    }

    const full = await Product.findByPk(product.id, { include: [{ model: ProductImage, as: 'images' }] });
    res.json({ message: 'Product updated', product: full });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage, as: 'images' }],
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Delete image files
    for (const img of product.images) {
      const filePath = path.join(__dirname, '../../public', img.image_path);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
