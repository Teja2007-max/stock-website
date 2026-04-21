const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'stockedge_secret_2024';

const generateToken = (id) =>
  jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

const registerUser = async (req, res) => {
  const { username, email, phoneNumber, password } = req.body;
  if (!username || !email || !phoneNumber || !password)
    return res.status(400).json({ message: 'All fields are required' });

  try {
    const emailExists = await User.findOne({ email });
    if (emailExists)
      return res.status(400).json({ message: 'Email already registered' });

    const usernameExists = await User.findOne({ username });
    if (usernameExists)
      return res.status(400).json({ message: 'Username is already taken' });

    const phoneExists = await User.findOne({ phoneNumber });
    if (phoneExists)
      return res.status(400).json({ message: 'Phone number already in use' });

    const user = await User.create({ username, email, phoneNumber, password });

    res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ message: 'Email and password are required' });

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: 'Invalid email or password' });

    const match = await user.matchPassword(password);
    if (!match)
      return res.status(401).json({ message: 'Invalid email or password' });

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { registerUser, loginUser };
