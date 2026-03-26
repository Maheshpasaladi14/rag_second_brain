const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
    documentId: { type:mongoose.Schema.Types.ObjectId, ref:'Document',required: true},
    text: {type: String, required: true},
    embedding: {type:[Number], required: true},
    chunkIndex: {type: Number, default: 1},
    pageNumber: {type: Number, default: 1}
}, { timestamps: true });

module.exports = mongoose.model('Chunk',ChunkSchema);