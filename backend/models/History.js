const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  action: { type: String, enum: ['SEARCH', 'PREDICTION'], required: true },
  metadata: { type: mongoose.Schema.Types.Mixed }, // Can store prediction results, location etc.
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('History', historySchema);
