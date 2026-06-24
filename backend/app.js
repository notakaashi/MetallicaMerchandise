require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: '*', // Allow frontend (file:// or separate static server)
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded product images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ───────────────────────────────────────────────
const authRoutes        = require('./src/routes/auth');
const userRoutes        = require('./src/routes/users');
const productRoutes     = require('./src/routes/products');
const transactionRoutes = require('./src/routes/transactions');
const dashboardRoutes   = require('./src/routes/dashboard');

app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/products',     productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard',    dashboardRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── 404 for unknown API routes ───────────────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found' }));

// ─── Error handler ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤘 Metallica Merch Store API running on http://localhost:${PORT}`);
  console.log(`   Frontend: open frontend/index.html in your browser`);
});

module.exports = app;
