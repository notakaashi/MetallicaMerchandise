const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Helper to get user from cookie/header
async function getCurrentUser(req) {
  try {
    const token = req.cookies && req.cookies.token ? req.cookies.token : null;
    if (!token) return null;
    const user = await User.findOne({ where: { token } });
    if (!user || user.status !== 'active') return null;
    return { id: user.id, name: user.name, email: user.email, role: user.role, token: user.token };
  } catch {
    return null;
  }
}

// Admin middleware for page routes (redirects instead of JSON)
async function requireAdmin(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) return res.redirect('/login?redirect=' + encodeURIComponent(req.path));
  if (user.role !== 'admin') return res.redirect('/');
  req.currentUser = user;
  next();
}

async function requireAuth(req, res, next) {
  const user = await getCurrentUser(req);
  if (!user) return res.redirect('/login?redirect=' + encodeURIComponent(req.path));
  req.currentUser = user;
  next();
}

// Public pages
router.get('/', async (req, res) => {
  const user = await getCurrentUser(req);
  res.render('index', { title: 'Metallica Merch Store', user });
});

router.get('/login', async (req, res) => {
  const user = await getCurrentUser(req);
  if (user) return res.redirect(user.role === 'admin' ? '/admin/dashboard' : '/');
  res.render('login', { title: 'Login — Metallica Merch', user: null, redirect: req.query.redirect || '/' });
});

router.get('/register', async (req, res) => {
  const user = await getCurrentUser(req);
  if (user) return res.redirect('/');
  res.render('register', { title: 'Register — Metallica Merch', user: null });
});

router.get('/checkout', requireAuth, (req, res) => {
  res.render('checkout', { title: 'Checkout — Metallica Merch', user: req.currentUser });
});

router.get('/orders', requireAuth, (req, res) => {
  res.render('orders', { title: 'My Orders — Metallica Merch', user: req.currentUser });
});

// Admin pages
router.get('/admin', requireAdmin, (req, res) => res.redirect('/admin/dashboard'));

router.get('/admin/dashboard', requireAdmin, (req, res) => {
  res.render('admin/dashboard', { title: 'Dashboard — Admin', user: req.currentUser });
});

router.get('/admin/users', requireAdmin, (req, res) => {
  res.render('admin/users', { title: 'Users — Admin', user: req.currentUser });
});

router.get('/admin/products', requireAdmin, (req, res) => {
  res.render('admin/products', { title: 'Products — Admin', user: req.currentUser });
});

router.get('/admin/transactions', requireAdmin, (req, res) => {
  res.render('admin/transactions', { title: 'Transactions — Admin', user: req.currentUser });
});

// 404 fallback
router.use((req, res) => {
  res.status(404).render('404', { title: '404 — Not Found', user: null });
});

module.exports = router;
