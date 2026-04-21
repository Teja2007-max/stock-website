const express = require('express');
const router = express.Router();
const History = require('../models/History');
const Watchlist = require('../models/Watchlist');
const Portfolio = require('../models/Portfolio');
const Alert = require('../models/Alert');
const { protect } = require('../middleware/authMiddleware');

// --- History ---
router.get('/history', protect, async (req, res) => {
  try {
    const history = await History.find({ user: req.user._id }).sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching history', error: err.message });
  }
});

// --- Watchlist ---
router.get('/watchlist', protect, async (req, res) => {
  try {
    const list = await Watchlist.find({ user: req.user._id }).sort({ addedAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching watchlist', error: err.message });
  }
});

router.post('/watchlist', protect, async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Symbol required' });
    const item = await Watchlist.create({ user: req.user._id, symbol: symbol.toUpperCase() });
    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Already in watchlist' });
    res.status(500).json({ message: 'Error adding to watchlist', error: err.message });
  }
});

router.delete('/watchlist/:symbol', protect, async (req, res) => {
  try {
    await Watchlist.findOneAndDelete({ user: req.user._id, symbol: req.params.symbol.toUpperCase() });
    res.json({ message: 'Removed from watchlist' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing from watchlist', error: err.message });
  }
});

// --- Portfolio ---
router.get('/portfolio', protect, async (req, res) => {
  try {
    const holdings = await Portfolio.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(holdings);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching portfolio', error: err.message });
  }
});

router.post('/portfolio', protect, async (req, res) => {
  try {
    const { symbol, buyPrice, quantity, buyDate, notes } = req.body;
    if (!symbol || !buyPrice || !quantity) return res.status(400).json({ message: 'Symbol, price, and quantity required' });
    const item = await Portfolio.create({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      buyPrice: parseFloat(buyPrice),
      quantity: parseInt(quantity),
      buyDate: buyDate || Date.now(),
      notes: notes || '',
    });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Error adding holding', error: err.message });
  }
});

router.delete('/portfolio/:id', protect, async (req, res) => {
  try {
    await Portfolio.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Holding removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing holding', error: err.message });
  }
});

// --- Alerts ---
router.get('/alerts', protect, async (req, res) => {
  try {
    const alerts = await Alert.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching alerts', error: err.message });
  }
});

router.post('/alerts', protect, async (req, res) => {
  try {
    const { symbol, targetPrice, condition } = req.body;
    if (!symbol || !targetPrice || !condition) return res.status(400).json({ message: 'All fields required' });
    const alert = await Alert.create({
      user: req.user._id,
      symbol: symbol.toUpperCase(),
      targetPrice: parseFloat(targetPrice),
      condition,
    });
    res.status(201).json(alert);
  } catch (err) {
    res.status(500).json({ message: 'Error creating alert', error: err.message });
  }
});

router.delete('/alerts/:id', protect, async (req, res) => {
  try {
    await Alert.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Alert removed' });
  } catch (err) {
    res.status(500).json({ message: 'Error removing alert', error: err.message });
  }
});

module.exports = router;
