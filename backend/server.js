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
      /^http:\/\/192\.168\.0\.100:517[0-9]$/
    ];
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

mongoose.connect(MONGO_URI)
  .then(() => console.log('✓ Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    console.log('Falling back to mongodb-memory-server...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    MongoMemoryServer.create().then((mongoServer) => {
      mongoose.connect(mongoServer.getUri()).then(() => {
        console.log('✓ Connected to In-Memory MongoDB');
      });
    });
  });

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/stocks', require('./routes/stocks'));
app.use('/api/user', require('./routes/user'));
app.use('/api/news', require('./routes/news'));

const PORT = process.env.PORT || 5000;

// Host frontend in production
const path = require('path');
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});

// KEEP-ALIVE HACK
setInterval(() => {}, 1000 * 60 * 60);

