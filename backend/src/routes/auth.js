const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    // Get data from the request body
    let name = req.body.name;
    let email = req.body.email;
    let password = req.body.password;

    // Check if any field is missing
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    let existingUser = await User.findOne({ where: { email: email } });
    if (existingUser !== null) {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    // Hash the password securely
    let hashedPassword = await bcrypt.hash(password, 10);
    
    // Create new user in the database
    let newUser = await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: 'customer',
      status: 'active',
    });

    // Send success response
    res.status(201).json({
      message: 'Registration successful',
      user: { 
        id: newUser.id, 
        name: newUser.name, 
        email: newUser.email, 
        role: newUser.role 
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    let email = req.body.email;
    let password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find the user by their email
    let user = await User.findOne({ where: { email: email } });
    if (user === null) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if the account is banned/inactive
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is inactive' });
    }

    // Check if the typed password matches the hashed password
    let isPasswordMatch = await bcrypt.compare(password, user.password);
    if (isPasswordMatch === false) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create a random token for the user session
    let tokenString = user.id + user.email + Date.now() + Math.random();
    let token = crypto.createHash('sha256').update(tokenString).digest('hex');

    // Save token to database
    await user.update({ token: token });

    // Send cookie to the browser
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      token: token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
  try {
    let token = null;
    let authHeader = req.headers['authorization'];
    
    // Grab the token from the header or the cookies
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
      }
    }

    // Clear it out in the database if we found one
    if (token !== null) {
      let user = await User.findOne({ where: { token: token } });
      if (user !== null) {
        await user.update({ token: null });
      }
    }

    // Clear the cookie
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Logout failed' });
  }
});

module.exports = router;
