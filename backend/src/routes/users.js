const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middleware/admin');
const { User } = require('../models');

// GET /api/users — list all users
router.get('/', adminMiddleware, async (req, res) => {
  try {
    let usersList = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    
    res.json({ users: usersList });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/users/:id/role — change user role
router.patch('/:id/role', adminMiddleware, async (req, res) => {
  try {
    // Read the user ID from the URL and the new role from the request body
    let userId = req.params.id;
    let newRole = req.body.role;

    // Make sure they only send valid roles
    if (newRole !== 'admin' && newRole !== 'customer') {
      return res.status(400).json({ error: 'Invalid role. Must be admin or customer' });
    }

    // Find the user in the database
    let user = await User.findByPk(userId);
    if (user === null) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save the new role
    await user.update({ role: newRole });
    
    res.json({ 
      message: 'Role updated', 
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role 
      } 
    });
  } catch (err) {
    console.error('Update role error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// PATCH /api/users/:id/status — change active/inactive status
router.patch('/:id/status', adminMiddleware, async (req, res) => {
  try {
    // Read the user ID from the URL and the new status from the request body
    let userId = req.params.id;
    let newStatus = req.body.status;

    // Make sure they only send valid statuses
    if (newStatus !== 'active' && newStatus !== 'inactive') {
      return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
    }

    // Find the user in the database
    let user = await User.findByPk(userId);
    if (user === null) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Save the new status
    await user.update({ status: newStatus });
    
    res.json({ 
      message: 'Status updated', 
      user: { 
        id: user.id, 
        name: user.name, 
        status: user.status 
      } 
    });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

module.exports = router;
