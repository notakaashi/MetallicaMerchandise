const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { Product, ProductImage } = require('../models');

// Configure image uploading
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = path.join(__dirname, '../../uploads');
    
    // Create folder if it doesn't exist
    if (fs.existsSync(uploadDir) === false) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Make a random filename to avoid duplicate names
    let uniqueId = Date.now() + '-' + Math.round(Math.random() * 1000000000);
    let extension = path.extname(file.originalname);
    cb(null, 'product-' + uniqueId + extension);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: function (req, file, cb) {
    // Only allow pictures
    let allowedExtensions = /jpeg|jpg|png|gif|webp/;
    let fileExtension = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.test(fileExtension) === true) {
      cb(null, true); // It is a valid picture
    } else {
      cb(new Error('Only image files allowed')); // It is not a picture
    }
  },
});

// GET /api/products — list all products
router.get('/', async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page);
    }

    let limit = 12;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }

    let offset = (page - 1) * limit;

    let result = await Product.findAndCountAll({
      include: [{ model: ProductImage, as: 'images', limit: 1 }],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      distinct: true,
    });

    let totalProducts = result.count;
    let productsArray = result.rows;
    let totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products: productsArray,
      pagination: {
        total: totalProducts,
        page: page,
        limit: limit,
        pages: totalPages,
      },
    });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/search?q=...
router.get('/search', async (req, res) => {
  try {
    let searchQuery = '';
    if (req.query.q) {
      searchQuery = req.query.q;
    }

    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page);
    }

    let limit = 12;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    }

    let offset = (page - 1) * limit;

    let result = await Product.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: '%' + searchQuery + '%' } },
          { description: { [Op.like]: '%' + searchQuery + '%' } },
        ],
      },
      include: [{ model: ProductImage, as: 'images', limit: 1 }],
      limit: limit,
      offset: offset,
      distinct: true,
    });

    let totalProducts = result.count;
    let productsArray = result.rows;
    let totalPages = Math.ceil(totalProducts / limit);

    res.json({
      products: productsArray,
      pagination: { 
        total: totalProducts, 
        page: page, 
        limit: limit, 
        pages: totalPages 
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/products/autocomplete?q=...
router.get('/autocomplete', async (req, res) => {
  try {
    let searchQuery = '';
    if (req.query.q) {
      searchQuery = req.query.q;
    }

    let products = await Product.findAll({
      where: { name: { [Op.like]: '%' + searchQuery + '%' } },
      attributes: ['id', 'name', 'price'],
      limit: 8,
    });

    // Make a simple list for the dropdown
    let resultList = [];
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      resultList.push({ 
        id: p.id, 
        label: p.name, 
        value: p.name, 
        price: p.price 
      });
    }

    res.json(resultList);
  } catch (err) {
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

// GET /api/products/:id — get one product
router.get('/:id', async (req, res) => {
  try {
    let productId = req.params.id;
    let product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }],
    });
    
    if (product === null) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product: product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products — create new product (Admin Only)
router.post('/', adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    // Read the form data clearly
    let name = req.body.name;
    let description = req.body.description;
    let price = req.body.price;
    let stock = req.body.stock;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Convert values to correct number types
    let parsedPrice = parseFloat(price);
    let parsedStock = parseInt(stock);
    if (isNaN(parsedStock) === true) {
      parsedStock = 0;
    }

    // Save the new item in the database
    let newProduct = await Product.create({ 
      name: name, 
      description: description, 
      price: parsedPrice, 
      stock: parsedStock 
    });

    // Save uploaded images if there are any
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        let file = req.files[i];
        await ProductImage.create({
          product_id: newProduct.id,
          image_path: file.filename,
        });
      }
    }

    // Get the product again from DB to show its images
    let finalProduct = await Product.findByPk(newProduct.id, { 
      include: [{ model: ProductImage, as: 'images' }] 
    });
    
    res.status(201).json({ message: 'Product created', product: finalProduct });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id — update product
router.put('/:id', adminMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    let productId = req.params.id;
    let product = await Product.findByPk(productId);
    
    if (product === null) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Prepare new values using simple IF statements instead of ternaries
    let newName = req.body.name;
    if (!newName) {
      newName = product.name; // Keep old value if not provided
    }

    let newDescription = req.body.description;
    if (newDescription === undefined) {
      newDescription = product.description;
    }

    let newPrice = req.body.price;
    if (newPrice) {
      newPrice = parseFloat(newPrice);
    } else {
      newPrice = product.price;
    }

    let newStock = req.body.stock;
    if (newStock !== undefined) {
      newStock = parseInt(newStock);
    } else {
      newStock = product.stock;
    }

    // Update the database record
    await product.update({
      name: newName,
      description: newDescription,
      price: newPrice,
      stock: newStock,
    });

    // Remove old images if the user selected them to be deleted
    let removeImages = req.body.removeImages;
    if (removeImages) {
      
      // Make sure it is a list of IDs even if only 1 was sent
      let imageIdsToRemove = [];
      if (Array.isArray(removeImages) === true) {
        imageIdsToRemove = removeImages;
      } else {
        imageIdsToRemove = [removeImages];
      }

      // Loop through each ID and delete it
      for (let i = 0; i < imageIdsToRemove.length; i++) {
        let imageId = imageIdsToRemove[i];
        let imgRecord = await ProductImage.findByPk(imageId);
        
        if (imgRecord !== null) {
          let filePath = path.join(__dirname, '../../uploads', imgRecord.image_path);
          if (fs.existsSync(filePath) === true) {
            fs.unlinkSync(filePath); // Delete file from hard drive
          }
          await imgRecord.destroy(); // Delete record from database
        }
      }
    }

    // Add newly uploaded images
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        let file = req.files[i];
        await ProductImage.create({
          product_id: product.id,
          image_path: file.filename,
        });
      }
    }

    // Return the updated product
    let finalProduct = await Product.findByPk(product.id, { 
      include: [{ model: ProductImage, as: 'images' }] 
    });
    res.json({ message: 'Product updated', product: finalProduct });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id — delete product
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    let productId = req.params.id;
    let product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }],
    });
    
    if (product === null) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete image files from hard drive
    for (let i = 0; i < product.images.length; i++) {
      let img = product.images[i];
      let filePath = path.join(__dirname, '../../uploads', img.image_path);
      if (fs.existsSync(filePath) === true) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove the product row from the database
    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
