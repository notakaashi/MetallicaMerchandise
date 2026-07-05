const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');

exports.register = async (req, res) => {
  try {
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    let existingUser = await User.findOne({ where: { email: email } });
    if (existingUser !== null) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    let hashedPassword = await bcrypt.hash(password, 10);
    
    let newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    res.status(201).json({
      message: 'Registration successful',
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role,
        avatar: newUser.avatar
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let user = await User.findOne({ where: { email: email } });
    if (user === null) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    let isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch === false) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let token = crypto.createHash('sha256').update(email + Date.now()).digest('hex');

    await user.update({ token: token });

    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Login successful',
      token: token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        avatar: user.avatar
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.logout = async (req, res) => {
  try {
    let token = null;
    let authHeader = req.headers['authorization'];
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }
    }

    if (token !== null) {
      let user = await User.findOne({ where: { token: token } });
      if (user !== null) {
        await user.update({ token: null });
      }
    }

    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
};
