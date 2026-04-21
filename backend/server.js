const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowedOriginPatterns = [
      /^http:\/\/localhost:517[0-9]$/,
      /^http:\/\/127\.0\.0\.1:517[0-9]$/,
      /^http:\/\/192\.168\.56\.1:517[0-9]$/,
      /^http:\/\/192\.168\.0\.\d+:517[0-9]$/,
      /^https:\/\/stock-website.*\.vercel\.app$/,
    ];
    // Also allow any origin set via CORS_ORIGIN env var
    const envOrigin = process.env.CORS_ORIGIN;
    if (envOrigin && origin === envOrigin) return callback(null, true);
    const isAllowed = allowedOriginPatterns.some((pattern) => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/stockwebsite';

// Cache connection across serverless invocations
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log('✓ Connected to MongoDB');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (!process.env.MONGO_URI) {
      // Local fallback only — won't work on serverless
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      isConnected = true;
      console.log('✓ Connected to In-Memory MongoDB (local only)');
    }
  }
};

// Connect immediately and on each request for serverless
connectDB();
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/user', require('./routes/user'));
app.use('/api/news', require('./routes/news'));

const PORT = process.env.PORT || 5000;

// Export app for Vercel serverless
module.exports = app;

// Start server only when run directly (local dev)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\u2713 Server running on http://localhost:${PORT}`);
  });
}

