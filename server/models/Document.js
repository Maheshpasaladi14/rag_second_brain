const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  type: { type: String, enum: ['pdf', 'txt', 'url'], required: true },
  fileSize: { type: Number },
  totalChunks: { type: Number, default: 0 },
  status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
  cloudinaryUrl: { type: String },
  cloudinaryPublicId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);