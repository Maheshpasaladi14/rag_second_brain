// const router = require('express').Router();
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const { spawn } = require('child_process');
// const Document = require('../models/Document');

// // Setup upload folder
// const uploadDir = path.join(__dirname, '../uploads');
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => {
//     const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, unique + path.extname(file.originalname));
//   }
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 10 * 1024 * 1024 },
//   fileFilter: (req, file, cb) => {
//     const allowed = ['.pdf', '.txt'];
//     const ext = path.extname(file.originalname).toLowerCase();
//     if (allowed.includes(ext)) cb(null, true);
//     else cb(new Error('Only PDF and TXT files allowed'));
//   }
// });

// function runPythonIngest(documentId, filepath, fileType) {
//   return new Promise((resolve, reject) => {
//     // ✅ Fix 1: Always use venv Python, not system Python
//     const pythonPath = path.join(__dirname, '../../ai/venv/Scripts/python.exe');
//     const scriptPath = path.join(__dirname, '../../ai/ingest.py');

//     // ✅ Fix 2: Convert Windows backslashes to forward slashes
//     const normalizedPath = filepath.replace(/\\/g, '/');
//     const input = JSON.stringify({ documentId, filepath: normalizedPath, fileType });

//     console.log('🐍 Starting Python ingestion...');
//     console.log('🐍 Input:', input);

//     const py = spawn(pythonPath, [scriptPath]);
//     let output = '';
//     let errorOutput = '';

//     py.stdin.write(input);
//     py.stdin.end();

//     py.stdout.on('data', data => {
//       output += data.toString();
//       console.log('🐍 Python stdout:', data.toString());
//     });

//     py.stderr.on('data', data => {
//       errorOutput += data.toString();
//     });

//     py.on('close', code => {
//       console.log('🐍 Python exit code:', code);
//       if (code !== 0) {
//         console.error('🐍 Python error:', errorOutput);
//         return reject(new Error(errorOutput || 'Python script failed'));
//       }
//       try {
//         resolve(JSON.parse(output));
//       } catch {
//         reject(new Error('Invalid Python output: ' + output));
//       }
//     });
//   });
// }

// router.post('/', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

//     const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');

//     const document = await Document.create({
//       filename: req.file.filename,
//       originalName: req.file.originalname,
//       type: fileType,
//       fileSize: req.file.size,
//       status: 'processing'
//     });

//     console.log('📄 Document saved:', document._id.toString());

//     runPythonIngest(document._id.toString(), req.file.path, fileType)
//       .then(result => {
//         console.log('✅ Python result:', result);
//         if (!result.success) {
//           console.error('❌ Ingestion failed:', result.error);
//           Document.findByIdAndUpdate(document._id, { status: 'failed' }).exec();
//         }
//       })
//       .catch(err => {
//         console.error('❌ Python crashed:', err.message);
//         Document.findByIdAndUpdate(document._id, { status: 'failed' }).exec();
//       });

//     res.json({
//       success: true,
//       document: {
//         id: document._id,
//         originalName: document.originalName,
//         status: 'processing'
//       },
//       message: 'File uploaded! Processing in background...'
//     });

//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // Multer error handler
// router.use((err, req, res, next) => {
//   res.status(400).json({ error: err.message });
// });

// module.exports = router;

const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const Document = require('../models/Document');
const cloudinary = require('../utils/cloudinary');

// Temp local folder for processing before Cloudinary upload
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Store temporarily on disk first
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF and TXT files allowed'));
  }
});

// Upload file to Cloudinary
async function uploadToCloudinary(filepath, originalName) {
  const result = await cloudinary.uploader.upload(filepath, {
    resource_type: 'raw',
    folder: 'rag-second-brain',
    public_id: `${Date.now()}-${originalName.replace(/\s+/g, '-')}`,
    use_filename: true
  });
  return result;
}

// Call Python ingest script
function runPythonIngest(documentId, filepath, fileType) {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(__dirname, '../../ai/venv/Scripts/python.exe');
    const scriptPath = path.join(__dirname, '../../ai/ingest.py');
    const normalizedPath = filepath.replace(/\\/g, '/');
    const input = JSON.stringify({ documentId, filepath: normalizedPath, fileType });

    console.log('🐍 Starting Python ingestion...');

    const py = spawn(pythonPath, [scriptPath]);
    let output = '';
    let errorOutput = '';

    py.stdin.write(input);
    py.stdin.end();

    py.stdout.on('data', data => {
      output += data.toString();
      console.log('🐍 Python stdout:', data.toString());
    });
    py.stderr.on('data', data => { errorOutput += data.toString(); });

    py.on('close', code => {
      console.log('🐍 Python exit code:', code);
      if (code !== 0) return reject(new Error(errorOutput || 'Python script failed'));
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error('Invalid Python output: ' + output));
      }
    });
  });
}

// POST /api/upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileType = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const localPath = req.file.path;

    console.log('📄 File received:', req.file.originalname);

    // Step 1: Upload to Cloudinary
    console.log('☁️ Uploading to Cloudinary...');
    const cloudinaryResult = await uploadToCloudinary(localPath, req.file.originalname);
    console.log('☁️ Cloudinary URL:', cloudinaryResult.secure_url);

    // Step 2: Save document metadata with Cloudinary URL
    const document = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      type: fileType,
      fileSize: req.file.size,
      status: 'processing',
      cloudinaryUrl: cloudinaryResult.secure_url,
      cloudinaryPublicId: cloudinaryResult.public_id
    });

    console.log('📄 Document saved:', document._id.toString());

    // Step 3: Run Python ingestion in background using local file
    runPythonIngest(document._id.toString(), localPath, fileType)
      .then(result => {
        console.log('✅ Python result:', result);
        // Clean up local file after ingestion
        fs.unlink(localPath, () => {});
        if (!result.success) {
          Document.findByIdAndUpdate(document._id, { status: 'failed' }).exec();
        }
      })
      .catch(err => {
        console.error('❌ Python crashed:', err.message);
        fs.unlink(localPath, () => {});
        Document.findByIdAndUpdate(document._id, { status: 'failed' }).exec();
      });

    // Return immediately
    res.json({
      success: true,
      document: {
        id: document._id,
        originalName: document.originalName,
        status: 'processing',
        cloudinaryUrl: cloudinaryResult.secure_url
      },
      message: 'File uploaded to cloud! Processing in background...'
    });

  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;