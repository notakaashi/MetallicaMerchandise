const authMiddleware = require('./auth');

async function adminMiddleware(req, res, next) {
  // First run auth check
  authMiddleware(req, res, (err) => {
    if (err) return next(err);
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden — admin access required' });
    }
    if (req.user.status !== 'active') {
      return res.status(403).json({ error: 'Forbidden — account inactive' });
    }

    next();
  });
}

module.exports = adminMiddleware;
