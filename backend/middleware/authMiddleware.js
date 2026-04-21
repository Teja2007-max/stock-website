const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'stockedge_secret_2024';

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const optionalProtect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    try {
      const token = auth.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);
      // Validate that decoded.id looks like a valid MongoDB ObjectId before querying
      if (decoded.id && /^[a-fA-F0-9]{24}$/.test(decoded.id)) {
        req.user = await User.findById(decoded.id).select('-password');
      }
    } catch {
      // Silently skip — this is optional auth, not a failure
    }
  }
  next();
};

module.exports = { protect, optionalProtect };
