const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Product, ProductImage } = require('../models');

// Helper to build order array from sort string
const getOrder = (sort) => {
  switch (sort) {
    case 'price_asc': return [['price', 'ASC']];
    case 'price_desc': return [['price', 'DESC']];
    case 'name_asc': return [['name', 'ASC']];
    case 'name_desc': return [['name', 'DESC']];
    case 'newest':
    default:
      return [['createdAt', 'DESC']];
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 12;
    let offset = (page - 1) * limit;

    let whereClause = {};
    if (req.query.category && req.query.category !== 'all') {
      whereClause.category = req.query.category;
    }
    if (req.query.q) {
      whereClause[Op.or] = [
        { name: { [Op.like]: '%' + req.query.q + '%' } },
        { description: { [Op.like]: '%' + req.query.q + '%' } },
      ];
    }

    let result = await Product.findAndCountAll({
      where: whereClause,
      include: [{ model: ProductImage, as: 'images', limit: 1 }],
      order: getOrder(req.query.sort),
      limit: limit,
      offset: offset,
      distinct: true,
    });

    res.json({
      products: result.rows,
      pagination: {
        total: result.count,
        page: page,
        limit: limit,
        pages: Math.ceil(result.count / limit),
      },
    });
  } catch (err) {
    console.error('List products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    let searchQuery = req.query.q || '';
    let page = req.query.page ? parseInt(req.query.page) : 1;
    let limit = req.query.limit ? parseInt(req.query.limit) : 12;
    let offset = (page - 1) * limit;

    let whereClause = {
      [Op.or]: [
        { name: { [Op.like]: '%' + searchQuery + '%' } },
        { description: { [Op.like]: '%' + searchQuery + '%' } },
      ],
    };
    if (req.query.category && req.query.category !== 'all') {
      whereClause.category = req.query.category;
    }

    let result = await Product.findAndCountAll({
      where: whereClause,
      include: [{ model: ProductImage, as: 'images', limit: 1 }],
      order: getOrder(req.query.sort),
      limit: limit,
      offset: offset,
      distinct: true,
    });

    res.json({
      products: result.rows,
      pagination: { 
        total: result.count, 
        page: page, 
        limit: limit, 
        pages: Math.ceil(result.count / limit) 
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
};

exports.autocompleteProducts = async (req, res) => {
  try {
    let searchQuery = req.query.q || '';
    let whereClause = { name: { [Op.like]: '%' + searchQuery + '%' } };
    
    if (req.query.category && req.query.category !== 'all') {
      whereClause.category = req.query.category;
    }

    let products = await Product.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'price'],
      limit: 8,
    });

    let resultList = products.map(p => ({
      id: p.id, 
      label: p.name, 
      value: p.name, 
      price: p.price 
    }));

    res.json(resultList);
  } catch (err) {
    res.status(500).json({ error: 'Autocomplete failed' });
  }
};

exports.getProduct = async (req, res) => {
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
};

exports.createProduct = async (req, res) => {
  try {
    let { name, description, price, stock, category } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    let parsedPrice = parseFloat(price);
    let parsedStock = parseInt(stock);
    if (isNaN(parsedStock) === true) parsedStock = 0;

    let newProduct = await Product.create({ 
      name: name, 
      description: description, 
      price: parsedPrice, 
      stock: parsedStock,
      category: category || 'other'
    });

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        let file = req.files[i];
        await ProductImage.create({
          product_id: newProduct.id,
          image_path: file.filename,
        });
      }
    }

    let finalProduct = await Product.findByPk(newProduct.id, { 
      include: [{ model: ProductImage, as: 'images' }] 
    });
    
    res.status(201).json({ message: 'Product created', product: finalProduct });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    let productId = req.params.id;
    let product = await Product.findByPk(productId);
    
    if (product === null) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let newName = req.body.name || product.name;
    let newDescription = req.body.description !== undefined ? req.body.description : product.description;
    let newPrice = req.body.price ? parseFloat(req.body.price) : product.price;
    let newStock = req.body.stock !== undefined ? parseInt(req.body.stock) : product.stock;
    let newCategory = req.body.category || product.category;

    await product.update({
      name: newName,
      description: newDescription,
      price: newPrice,
      stock: newStock,
      category: newCategory
    });

    let removeImages = req.body.removeImages;
    if (removeImages) {
      let imageIdsToRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
      for (let i = 0; i < imageIdsToRemove.length; i++) {
        let imageId = imageIdsToRemove[i];
        let imgRecord = await ProductImage.findByPk(imageId);
        
        if (imgRecord !== null) {
          let filePath = path.join(__dirname, '../../uploads', imgRecord.image_path);
          if (fs.existsSync(filePath) === true) {
            fs.unlinkSync(filePath);
          }
          await imgRecord.destroy();
        }
      }
    }

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        let file = req.files[i];
        await ProductImage.create({
          product_id: product.id,
          image_path: file.filename,
        });
      }
    }

    let finalProduct = await Product.findByPk(product.id, { 
      include: [{ model: ProductImage, as: 'images' }] 
    });
    res.json({ message: 'Product updated', product: finalProduct });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    let productId = req.params.id;
    let product = await Product.findByPk(productId, {
      include: [{ model: ProductImage, as: 'images' }],
    });
    
    if (product === null) {
      return res.status(404).json({ error: 'Product not found' });
    }

    for (let i = 0; i < product.images.length; i++) {
      let img = product.images[i];
      let filePath = path.join(__dirname, '../../uploads', img.image_path);
      if (fs.existsSync(filePath) === true) {
        fs.unlinkSync(filePath);
      }
    }

    await product.destroy();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};
