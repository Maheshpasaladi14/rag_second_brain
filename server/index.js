const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Only load .env file in development — Railway provides env vars directly
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/upload', require('./routes/upload.route'));
app.use('/api/documents', require('./routes/document.route'));
app.use('/api/chat', require('./routes/chat.route'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RAG Second Brain API running' });
});

// Connect to MongoDB and start server
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected');
      app.listen(process.env.PORT || 5000, () => {
        console.log(`✅ Server running on port ${process.env.PORT || 5000}`);
      });
    })
    .catch(err => {
      console.error('❌ MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;