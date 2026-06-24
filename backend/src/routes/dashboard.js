const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const adminMiddleware = require('../middleware/admin');
const { Transaction, TransactionItem, Product, sequelize } = require('../models');

// GET /api/dashboard/metrics
router.get('/metrics', adminMiddleware, async (req, res) => {
  try {
    // 1. Sales per product (bar chart)
    let salesPerProduct = await TransactionItem.findAll({
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
    let thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let dailyRevenue = await Transaction.findAll({
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
    let statusCounts = await Transaction.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
    });

    // 4. Summary KPIs
    let totalRevenue = await Transaction.sum('total_price', { where: { status: 'completed' } });
    if (!totalRevenue) {
      totalRevenue = 0;
    }

    let totalOrders = await Transaction.count();
    let totalProducts = await Product.count();

    // Format the sales per product array
    let formattedSales = [];
    for (let i = 0; i < salesPerProduct.length; i++) {
      let sale = salesPerProduct[i];

      let productName = 'Unknown';
      if (sale.product) {
        productName = sale.product.name;
      }

      let totalSold = parseInt(sale.dataValues.total_sold);
      if (isNaN(totalSold)) {
        totalSold = 0;
      }

      let totalRev = parseFloat(sale.dataValues.total_revenue);
      if (isNaN(totalRev)) {
        totalRev = 0;
      }

      formattedSales.push({
        product: productName,
        total_sold: totalSold,
        total_revenue: totalRev,
      });
    }

    // Format the daily revenue array
    let formattedRevenue = [];
    for (let i = 0; i < dailyRevenue.length; i++) {
      let daily = dailyRevenue[i];

      let rev = parseFloat(daily.dataValues.revenue);
      if (isNaN(rev)) {
        rev = 0;
      }

      let orders = parseInt(daily.dataValues.orders);
      if (isNaN(orders)) {
        orders = 0;
      }

      formattedRevenue.push({
        date: daily.dataValues.date,
        revenue: rev,
        orders: orders,
      });
    }

    // Format the status distribution array
    let formattedStatus = [];
    for (let i = 0; i < statusCounts.length; i++) {
      let statusItem = statusCounts[i];

      let count = parseInt(statusItem.dataValues.count);
      if (isNaN(count)) {
        count = 0;
      }

      formattedStatus.push({
        status: statusItem.status,
        count: count,
      });
    }

    // Send the final response
    res.json({
      salesPerProduct: formattedSales,
      dailyRevenue: formattedRevenue,
      statusDistribution: formattedStatus,
      kpis: {
        totalRevenue: totalRevenue,
        totalOrders: totalOrders,
        totalProducts: totalProducts,
      },
    });
  } catch (err) {
    console.error('Dashboard metrics error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard metrics' });
  }
});

module.exports = router;
