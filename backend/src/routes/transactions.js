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
    const { items } = req.body;
    // items: [{ product_id, quantity }]
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    let totalPrice = 0;
    const itemDetails = [];

    // Validate products and stock
    for (const item of items) {
      const product = await Product.findByPk(item.product_id);
      if (!product) return res.status(404).json({ error: `Product #${item.product_id} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for "${product.name}"` });
      }
      totalPrice += parseFloat(product.price) * item.quantity;
      itemDetails.push({ product, quantity: item.quantity });
    }

    // Create transaction
    const tx = await Transaction.create({
      user_id: req.user.id,
      status: 'pending',
      total_price: totalPrice.toFixed(2),
    });

    // Create items + deduct stock
    for (const { product, quantity } of itemDetails) {
      await TransactionItem.create({
        transaction_id: tx.id,
        product_id: product.id,
        quantity,
        price: product.price,
      });
      await product.update({ stock: product.stock - quantity });
    }

    const full = await Transaction.findByPk(tx.id, {
      include: [{
        model: TransactionItem,
        as: 'items',
        include: [{ model: Product, as: 'product' }],
      }],
    });

    res.status(201).json({ message: 'Order placed successfully', transaction: full });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /api/transactions/my — customer's own orders
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: TransactionItem,
        as: 'items',
        include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images', limit: 1 }] }],
      }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ transactions });
  } catch (err) {
    console.error('My transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/transactions — all transactions (admin only)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
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
    res.json({ transactions });
  } catch (err) {
    console.error('Admin transactions error:', err);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// PATCH /api/transactions/:id/status — update status (admin only)
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const tx = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        {
          model: TransactionItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        },
      ],
    });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });

    const previousStatus = tx.status;
    await tx.update({ status });

    // Restore stock on cancellation
    if (status === 'cancelled' && previousStatus !== 'cancelled') {
      for (const item of tx.items) {
        await item.product.update({ stock: item.product.stock + item.quantity });
      }
    }

    // Send receipt email on completion
    if (status === 'completed' && previousStatus !== 'completed') {
      try {
        const pdfBuffer = await generateReceipt(tx);
        await sendReceiptEmail(tx.user, tx, pdfBuffer);
      } catch (emailErr) {
        console.error('Email/PDF error (non-fatal):', emailErr.message);
      }
    }

    res.json({ message: 'Status updated', transaction: { id: tx.id, status: tx.status } });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
