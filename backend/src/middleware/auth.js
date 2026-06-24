const { User } = require('../models');

module.exports = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  const user = await User.findOne({ where: { token } });
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
};
