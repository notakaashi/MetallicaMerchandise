const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const adminMiddleware = require('../middleware/admin');
const { Transaction, TransactionItem, Product, sequelize } = require('../models');

// GET /api/dashboard/metrics
router.get('/metrics', adminMiddleware, async (req, res) => {
  try {
    // 1. Sales per product (bar chart)
    const salesPerProduct = await TransactionItem.findAll({
      attributes: [
        'product_id',
        [fn('SUM', col('quantity')), 'total_sold'],
        [fn('SUM', literal('`TransactionItem`.`quantity` * `TransactionItem`.`price`')), 'total_revenue'],
      ],
      include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
      group: ['product_id', 'product.id', 'product.name'],
      order: [[literal('total_sold'), 'DESC']],
      limit: 10,
    });

    // 2. Daily revenue over last 30 days (line chart)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Transaction.findAll({
      attributes: [
        [fn('DATE', col('createdAt')), 'date'],
        [fn('SUM', col('total_price')), 'revenue'],
        [fn('COUNT', col('id')), 'orders'],
      ],
      where: {
        status: 'completed',
        createdAt: { [Op.gte]: thirtyDaysAgo },
      },
      group: [fn('DATE', col('createdAt'))],
      order: [[fn('DATE', col('createdAt')), 'ASC']],
    });

    // 3. Transaction status distribution (pie chart)
    const statusCounts = await Transaction.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
    });

    // 4. Summary KPIs
    const totalRevenue = await Transaction.sum('total_price', { where: { status: 'completed' } });
    const totalOrders = await Transaction.count();
    const totalProducts = await Product.count();

    res.json({
      salesPerProduct: salesPerProduct.map(s => ({
        product: s.product ? s.product.name : 'Unknown',
        total_sold: parseInt(s.dataValues.total_sold) || 0,
        total_revenue: parseFloat(s.dataValues.total_revenue) || 0,
      })),
      dailyRevenue: dailyRevenue.map(d => ({
        date: d.dataValues.date,
        revenue: parseFloat(d.dataValues.revenue) || 0,
        orders: parseInt(d.dataValues.orders) || 0,
      })),
      statusDistribution: statusCounts.map(s => ({
        status: s.status,
        count: parseInt(s.dataValues.count) || 0,
      })),
      kpis: {
        totalRevenue: totalRevenue || 0,
        totalOrders,
        totalProducts,
      },
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

module.exports = router;
