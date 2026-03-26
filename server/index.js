// const express = require('express');
// const dotenv = require('dotenv');


// dotenv.config();
// const app = express();
// const PORT = process.env.PORT || 5000;


// app.use(express.json());

// app.get('/', (req, res)=>{
//     res.send("Welcome to RAG Second Brain Server");
// })

// app.listen (PORT=>{
//     console.log(`Server is running on port ${PORT}`);
// })


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
// app.use('/api/upload', require('./routes/upload'));
// app.use('/api/chat', require('./routes/chat'));
// app.use('/api/documents', require('./routes/documents'));

app.use('/api/upload', require('./routes/upload.route'));
app.use('/api/documents', require('./routes/document.route'));
app.use('/api/chat', require('./routes/chat.route'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RAG Second Brain API running' });
});
// app.get('/test-python', async (req, res) => {
//   const { spawn } = require('child_process');
//   const path = require('path');

//   const pythonPath = path.join(__dirname, '../ai/venv/Scripts/python.exe');
//   const scriptPath = path.join(__dirname, '../ai/ingest.py');

//   console.log('Python path:', pythonPath);
//   console.log('Script path:', scriptPath);
//   console.log('Python exists:', require('fs').existsSync(pythonPath));
//   console.log('Script exists:', require('fs').existsSync(scriptPath));

//   // Get the latest uploaded file
//   const Document = require('./models/Document');
//   const doc = await Document.findOne().sort({ createdAt: -1 });

//   if (!doc) return res.json({ error: 'No documents found, upload a file first' });

//   const uploadsPath = path.join(__dirname, 'uploads', doc.filename);
//   console.log('File path:', uploadsPath);
//   console.log('File exists:', require('fs').existsSync(uploadsPath));

//   const input = JSON.stringify({
//     documentId: doc._id.toString(),
//     filepath: uploadsPath.replace(/\\/g, '/'),
//     fileType: doc.type
//   });

//   console.log('Input to Python:', input);

//   const py = spawn(pythonPath, [scriptPath]);
//   let output = '';
//   let errorOutput = '';

//   py.stdin.write(input);
//   py.stdin.end();

//   py.stdout.on('data', data => {
//     output += data.toString();
//     console.log('Python stdout:', data.toString());
//   });

//   py.stderr.on('data', data => {
//     errorOutput += data.toString();
//     console.log('Python stderr:', data.toString());
//   });

//   py.on('close', code => {
//     console.log('Python exit code:', code);
//     res.json({
//       exitCode: code,
//       stdout: output,
//       stderr: errorOutput,
//       input
//     });
//   });
// });

//Connect to MongoDB
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

  // At the bottom of index.js
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