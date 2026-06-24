const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { Transaction, TransactionItem, Product, User, ProductImage } = require('../models');
const { sendReceiptEmail } = require('../services/emailService');
const { generateReceipt } = require('../services/pdfService');

// POST /api/transactions — create order (authenticated)
router.post('/', authMiddleware, async (req, res) => {
  try {
    let items = req.body.items;
    
    // items should be a list of objects like: [{ product_id: 1, quantity: 2 }]
    if (!items || Array.isArray(items) === false || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    let totalPrice = 0;
    let itemDetails = [];

    // Loop through each item in the cart to check the stock and calculate the price
    for (let i = 0; i < items.length; i++) {
      let currentItem = items[i];
      let product = await Product.findByPk(currentItem.product_id);
      
      if (product === null) {
        return res.status(404).json({ error: 'Product #' + currentItem.product_id + ' not found' });
      }
      
      if (product.stock < currentItem.quantity) {
        return res.status(400).json({ error: 'Insufficient stock for "' + product.name + '"' });
      }
      
      // Calculate how much this item costs and add it to the total price
      let itemCost = parseFloat(product.price) * currentItem.quantity;
      totalPrice = totalPrice + itemCost;
      
      // Save the product details to our list so we can create the transaction items later
      itemDetails.push({ 
        product: product, 
        quantity: currentItem.quantity 
      });
    }

    // Save the new transaction record in the database
    let newTransaction = await Transaction.create({
      user_id: req.user.id,
      status: 'pending',
      total_price: totalPrice.toFixed(2),
    });

    // Save each individual item connected to the transaction
    for (let i = 0; i < itemDetails.length; i++) {
      let detail = itemDetails[i];
      
      await TransactionItem.create({
        transaction_id: newTransaction.id,
        product_id: detail.product.id,
        quantity: detail.quantity,
        price: detail.product.price,
      });
      
      // Deduct the bought quantity from the product's available stock
      let newStock = detail.product.stock - detail.quantity;
      await detail.product.update({ stock: newStock });
    }

    // Get the newly created transaction with all its items to return to the frontend
    let finalTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [{
        model: TransactionItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }],
      }],
    });

    res.status(201).json({ message: 'Order placed successfully', transaction: finalTransaction });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/transactions/my — customer's own orders
router.get('/my', authMiddleware, async (req, res) => {
  try {
    let myTransactions = await Transaction.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: TransactionItem,
        as: 'items',
        include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images', limit: 1 }] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ transactions: myTransactions });
  } catch (err) {
    console.error('My transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/transactions — all transactions (admin only)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    let allTransactions = await Transaction.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: TransactionItem,
          as: 'items',
          include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price'] }],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ transactions: allTransactions });
  } catch (err) {
    console.error('Admin transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// PATCH /api/transactions/:id/status — update status (admin only)
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    let newStatus = req.body.status;
    let validStatuses = ['pending', 'completed', 'cancelled'];
    
    if (validStatuses.includes(newStatus) === false) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    let transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        {
          model: TransactionItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });
    
    if (transaction === null) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    let previousStatus = transaction.status;
    
    // Save the new status
    await transaction.update({ status: newStatus });

    // Restore stock if the order was just cancelled
    if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      for (let i = 0; i < transaction.items.length; i++) {
        let item = transaction.items[i];
        let newStock = item.product.stock + item.quantity;
        await item.product.update({ stock: newStock });
      }
    }

    // Send receipt email if the order was just completed
    if (newStatus === 'completed' && previousStatus !== 'completed') {
      try {
        let pdfBuffer = await generateReceipt(transaction);
        await sendReceiptEmail(transaction.user, transaction, pdfBuffer);
      } catch (emailErr) {
        console.error('Email or PDF error:', emailErr.message);
      }
    }

    res.json({ message: 'Status updated', transaction: { id: transaction.id, status: transaction.status } });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
