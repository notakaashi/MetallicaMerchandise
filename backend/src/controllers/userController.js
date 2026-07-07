const { User } = require('../models');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    let users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ users: users });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      status: 'active',
    });

    res.json({
      message: 'User created',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, role, status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'customer' && role === 'admin') {
      return res.status(403).json({ error: 'Customers cannot be promoted to admin.' });
    }

    await user.update({ name, email, role, status });
    
    res.json({ 
      message: 'User updated', 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email,
        role: user.role,
        status: user.status
      } 
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.destroy();
    
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'avatar', 'phone', 'address', 'city', 'zip']
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, phone, address, city, zip } = req.body;
    
    // Update basic info
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (zip !== undefined) user.zip = zip;

    // Handle avatar upload
    if (req.file) {
      user.avatar = '/uploads/' + req.file.filename;
    }

    await user.save();
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        city: user.city,
        zip: user.zip
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.getDeletedUsers = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    let users = await User.findAll({
      where: { deletedAt: { [Op.ne]: null } },
      paranoid: false,
      attributes: ['id', 'name', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json({ users: users });
  } catch (err) {
    console.error('List deleted users error:', err);
    res.status(500).json({ error: 'Failed to fetch deleted users' });
  }
};

exports.restoreUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByPk(userId, { paranoid: false });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    await user.restore();
    res.json({ success: true, message: 'User restored successfully' });
  } catch (err) {
    console.error('Restore user error:', err);
    res.status(500).json({ error: 'Failed to restore user' });
  }
};
