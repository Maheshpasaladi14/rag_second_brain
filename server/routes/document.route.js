// const router = require('express').Router();
// const Document = require('../models/Document');
// const Chunk = require('../models/Chunk');

// // GET /api/documents
// router.get('/', async (req, res) => {
//   try {
//     const documents = await Document.find().sort({ createdAt: -1 });
//     res.json({ success: true, documents });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // DELETE /api/documents/:id
// router.delete('/:id', async (req, res) => {
//   try {
//     await Document.findByIdAndDelete(req.params.id);
//     await Chunk.deleteMany({ documentId: req.params.id });
//     res.json({ success: true, message: 'Document deleted' });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });



// module.exports = router;

const router = require('express').Router();
const Document = require('../models/Document');
const Chunk = require('../models/Chunk');
const cloudinary = require('../utils/cloudinary');

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json({ success: true, documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) return res.status(404).json({ error: 'Document not found' });

    // Delete from Cloudinary
    if (document.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(document.cloudinaryPublicId, {
        resource_type: 'raw'
      });
      console.log('☁️ Deleted from Cloudinary:', document.cloudinaryPublicId);
    }

    // Delete from MongoDB
    await Document.findByIdAndDelete(req.params.id);
    await Chunk.deleteMany({ documentId: req.params.id });

    res.json({ success: true, message: 'Document deleted from cloud and database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
// ```

// ---

// **Restart server and test upload!** You should see in terminal:
// ```
// 📄 File received: yourfile.pdf
// ☁️ Uploading to Cloudinary...
// ☁️ Cloudinary URL: https://res.cloudinary.com/your-cloud/...
// 📄 Document saved: 69c4xxxxx
// 🐍 Starting Python ingestion...
// 🐍 Python stdout: {"success": true, "totalChunks": 10}
// ✅ Python result: { success: true, totalChunks: 10 }