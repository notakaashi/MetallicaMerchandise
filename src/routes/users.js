const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const { User } = require('../models');

// GET /api/users — list all users (admin only)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/users/:id/role — update role (admin only)
router.patch('/:id/role', adminMiddleware, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'customer'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be admin or customer' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ role });
    res.json({ message: 'Role updated', user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/users/:id/status — toggle active/inactive (admin only)
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    await user.update({ status });
    res.json({ message: 'Status updated', user: { id: user.id, name: user.name, status: user.status } });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
