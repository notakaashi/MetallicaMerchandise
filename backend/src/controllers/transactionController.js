const { Transaction, TransactionItem, Product, User, ProductImage } = require('../models');
const { sendReceiptEmail } = require('../services/emailService');
const { generateReceipt } = require('../services/pdfService');

exports.createTransaction = async (req, res) => {
  try {
    let items = req.body.items;

    if (!items || Array.isArray(items) === false || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required' });
    }

    let totalPrice = 0;
    let itemDetails = [];

    for (let i = 0; i < items.length; i++) {
      let currentItem = items[i];
      let product = await Product.findByPk(currentItem.product_id);

      if (product === null) {
        return res.status(404).json({ error: 'Product #' + currentItem.product_id + ' not found' });
      }

      if (product.stock < currentItem.quantity) {
        return res.status(400).json({ error: 'Insufficient stock for "' + product.name + '"' });
      }

      let itemCost = parseFloat(product.price) * currentItem.quantity;
      totalPrice = totalPrice + itemCost;

      itemDetails.push({
        product: product,
        quantity: currentItem.quantity
      });
    }

    let newTransaction = await Transaction.create({
      user_id: req.user.id,
      total_price: totalPrice.toFixed(2),
      full_name: req.body.full_name,
      address: req.body.address,
      city: req.body.city,
      zip: req.body.zip,
      payment_method: req.body.payment_method || 'card',
    });

    for (let i = 0; i < itemDetails.length; i++) {
      let detail = itemDetails[i];

      await TransactionItem.create({
        transaction_id: newTransaction.id,
        product_id: detail.product.id,
        quantity: detail.quantity,
        price: detail.product.price,
      });

      let newStock = detail.product.stock - detail.quantity;
      await detail.product.update({ stock: newStock });
    }

    let finalTransaction = await Transaction.findByPk(newTransaction.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: TransactionItem,
          as: 'items',
          include: [{ model: Product, as: 'product' }],
        }
      ],
    });

    try {
      let pdfBuffer = await generateReceipt(finalTransaction);
      await sendReceiptEmail(finalTransaction.user, finalTransaction, pdfBuffer);
    } catch (emailErr) {
      console.error('Email or PDF error during checkout:', emailErr.message);
    }

    res.status(201).json({ message: 'Order placed successfully', transaction: finalTransaction });
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
};

exports.getMyTransactions = async (req, res) => {
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
};

exports.getAllTransactions = async (req, res) => {
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
};

exports.updateTransactionStatus = async (req, res) => {
  try {
    let newStatus = req.body.status;
    let validStatuses = ['pending', 'completed', 'cancelled', 'shipped', 'delivering'];

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
    await transaction.update({ status: newStatus });

    if (newStatus === 'cancelled' && previousStatus !== 'cancelled') {
      for (let i = 0; i < transaction.items.length; i++) {
        let item = transaction.items[i];
        let newStock = item.product.stock + item.quantity;
        await item.product.update({ stock: newStock });
      }
    }

    // Send email + PDF receipt only when status transitions to completed
    if (newStatus === 'completed' && previousStatus !== 'completed') {
      try {
        let pdfBuffer = await generateReceipt(transaction);
        await sendReceiptEmail(transaction.user, transaction, pdfBuffer);
      } catch (emailErr) {
        console.error('Email or PDF error during status update:', emailErr.message);
      }
    }
    res.json({ message: 'Status updated', transaction: { id: transaction.id, status: transaction.status } });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.getTransactionById = async (req, res) => {
  try {
    let transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
        {
          model: TransactionItem,
          as: 'items',
          include: [{ model: Product, as: 'product', include: [{ model: ProductImage, as: 'images' }] }],
        },
      ],
    });

    if (transaction === null) {
      return res.status(404).json({ error: 'Order not found' });
    }

    let isOwner = transaction.user_id === req.user.id;
    let isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'You do not have permission to view this order' });
    }

    res.json({ transaction: transaction });
  } catch (err) {
    console.error('Get transaction error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

exports.downloadReceipt = async (req, res) => {
  try {
    let token = req.query.token;
    if (!token) return res.status(401).send('Unauthorized');
    
    const crypto = require('crypto');
    const secret = process.env.SESSION_SECRET || 'metallica_secret_key_change_in_production';
    const expectedHash = crypto.createHmac('sha256', secret).update(req.params.id.toString()).digest('hex');
    
    if (token !== expectedHash) {
      return res.status(401).send('Unauthorized');
    }

    let transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user' },
        { model: TransactionItem, as: 'items', include: [{ model: Product, as: 'product' }] },
      ],
    });

    if (!transaction) return res.status(404).send('Order not found');

    let pdfBuffer = await generateReceipt(transaction);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="metallica-receipt-${transaction.id}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Download receipt error:', err);
    res.status(500).send('Failed to generate receipt');
  }
};
