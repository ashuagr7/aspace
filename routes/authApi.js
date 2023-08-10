const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = mongoose.model("User");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")


// Routes
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
  
    try {
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      const newUser = new User({
        username,
        email,
        password: hashedPassword
      });
  
      await newUser.save();
  
      // Create a token
      const token = jwt.sign({ id: newUser._id }, 'faslkfocvneofu', { expiresIn: '7d' });
      res.json({ token });
  
    } catch (error) {
      res.status(400).json({ error: 'Failed to register' });
    }
  });
  
  router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }
  
    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
  
    // Create a token
    const token = jwt.sign({ id: user._id }, 'faslkfocvneofu', { expiresIn: '7d' });
    res.json({ token });
  });


  module.exports = router