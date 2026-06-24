const { User } = require('../models');

async function authMiddleware(req, res, next) {
  try {
    // Check Authorization header first, then cookie fallback
    let token = null;
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized — no token provided' });
    }

    const user = await User.findOne({ where: { token } });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized — invalid token' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
}

module.exports = authMiddleware;
