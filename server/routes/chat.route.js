// // // const router = require('express').Router();
// // // const Document = require('../models/Document');

// // // // Get all documents
// // // router.get ('/', async (req,res)=>{
// // //     try{
// // //         const documents = await Document.find().sort({createdAt: -1});
// // //     }catch (err){
// // //         console.error('Error fetching documents:', err);
// // //         res.status(500).json({ error: 'Failed to fetch documents' });
// // //     }
// // // })

// // // module.exports = router;

// // const router = require('express').Router();
// // const { spawn } = require('child_process');
// // const path = require('path');
// // const Anthropic = require('@anthropic-ai/sdk');
// // const Document = require('../models/Document');

// // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// // // Call Python query script
// // function runPythonQuery(question, topK = 5) {
// //   return new Promise((resolve, reject) => {
// //     const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
// //     const scriptPath = path.join(__dirname, '../../ai/query.py');
// //     const input = JSON.stringify({ question, topK });

// //     const py = spawn(pythonPath, [scriptPath]);
// //     let output = '';
// //     let errorOutput = '';

// //     py.stdin.write(input);
// //     py.stdin.end();

// //     py.stdout.on('data', data => output += data.toString());
// //     py.stderr.on('data', data => errorOutput += data.toString());

// //     py.on('close', code => {
// //       if (code !== 0) return reject(new Error(errorOutput || 'Python query failed'));
// //       try {
// //         resolve(JSON.parse(output));
// //       } catch {
// //         reject(new Error('Invalid Python output: ' + output));
// //       }
// //     });
// //   });
// // }

// // // Build context string from chunks
// // function buildContext(chunks) {
// //   return chunks.map((chunk, i) => 
// //     `[Source ${i + 1}]\n${chunk.text}`
// //   ).join('\n\n---\n\n');
// // }

// // // POST /api/chat
// // router.post('/', async (req, res) => {
// //   try {
// //     const { question, topK = 5 } = req.body;

// //     if (!question || !question.trim()) {
// //       return res.status(400).json({ error: 'Question is required' });
// //     }

// //     // Step 1: Find relevant chunks using Python
// //     const chunks = await runPythonQuery(question, topK);

// //     if (!chunks || chunks.length === 0) {
// //       return res.json({
// //         answer: "I couldn't find any relevant information in your knowledge base. Try uploading some documents first!",
// //         sources: [],
// //         chunks: []
// //       });
// //     }

// //     // Step 2: Get document names for sources
// //     const documentIds = [...new Set(chunks.map(c => c.documentId))];
// //     const documents = await Document.find({ _id: { $in: documentIds } });
// //     const docMap = {};
// //     documents.forEach(d => { docMap[d._id.toString()] = d.originalName; });

// //     // Step 3: Build context and call Claude
// //     const context = buildContext(chunks);

// //     const systemPrompt = `You are a helpful AI assistant that answers questions based ONLY on the provided context from the user's personal knowledge base.

// // Rules:
// // - Answer ONLY based on the provided context
// // - If the context doesn't contain enough information, say "I don't have enough information in your knowledge base to answer this"
// // - Be concise and clear
// // - Always mention which source your answer came from`;

// //     const userMessage = `Context from knowledge base:
// // ${context}

// // Question: ${question}`;

// //     const response = await anthropic.messages.create({
// //       model: 'claude-sonnet-4-20250514',
// //       max_tokens: 1024,
// //       system: systemPrompt,
// //       messages: [{ role: 'user', content: userMessage }]
// //     });

// //     const answer = response.content[0].text;

// //     // Step 4: Build sources array
// //     const sources = chunks.map(chunk => ({
// //       documentId: chunk.documentId,
// //       filename: docMap[chunk.documentId] || 'Unknown',
// //       pageNumber: chunk.pageNumber,
// //       text: chunk.text.substring(0, 200) + '...',
// //       score: chunk.score
// //     }));

// //     res.json({ success: true, answer, sources });

// //   } catch (err) {
// //     console.error('Chat error:', err.message);
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // module.exports = router;

// const router = require('express').Router();
// const { spawn } = require('child_process');
// const path = require('path');
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// const Document = require('../models/Document');

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// function runPythonQuery(question, topK = 5) {
//   return new Promise((resolve, reject) => {
//     const pythonPath = path.join(__dirname, '../../ai/venv/Scripts/python.exe');
//     const scriptPath = path.join(__dirname, '../../ai/query.py');
//     const input = JSON.stringify({ question, topK });

//     console.log('🐍 Running query with:', input);

//     const py = spawn(pythonPath, [scriptPath]);
//     let output = '';
//     let errorOutput = '';

//     py.stdin.write(input);
//     py.stdin.end();

//     py.stdout.on('data', data => {
//       output += data.toString();
//       console.log('🐍 Query stdout:', data.toString());
//     });
//     py.stderr.on('data', data => {
//       errorOutput += data.toString();
//     });

//     py.on('close', code => {
//       console.log('🐍 Query exit code:', code);
//       if (code !== 0) return reject(new Error(errorOutput || 'Python query failed'));
//       try {
//         resolve(JSON.parse(output));
//       } catch {
//         reject(new Error('Invalid Python output: ' + output));
//       }
//     });
//   });
// }

// function buildContext(chunks) {
//   return chunks.map((chunk, i) =>
//     `[Source ${i + 1}]\n${chunk.text}`
//   ).join('\n\n---\n\n');
// }

// router.post('/', async (req, res) => {
//   try {
//     const { question, topK = 5 } = req.body;

//     if (!question || !question.trim()) {
//       return res.status(400).json({ error: 'Question is required' });
//     }

//     console.log('💬 Question received:', question);

//     // Step 1: Find relevant chunks using Python
//     const chunks = await runPythonQuery(question, topK);
//     console.log('📚 Chunks found:', chunks.length);

//     if (!chunks || chunks.length === 0) {
//       return res.json({
//         success: true,
//         answer: "I couldn't find any relevant information in your knowledge base. Try uploading some documents first!",
//         sources: []
//       });
//     }

//     // Step 2: Get document names for sources
//     const documentIds = [...new Set(chunks.map(c => c.documentId))];
//     const documents = await Document.find({ _id: { $in: documentIds } });
//     const docMap = {};
//     documents.forEach(d => { docMap[d._id.toString()] = d.originalName; });

//     // Step 3: Build context
//     const context = buildContext(chunks);

//     const prompt = `You are a helpful AI assistant that answers questions based ONLY on the provided context from the user's personal knowledge base.

// Rules:
// - Answer ONLY based on the provided context
// - If the context doesn't contain enough information, say "I don't have enough information in your knowledge base to answer this"
// - Be concise and clear
// - Mention which source your answer came from

// Context from knowledge base:
// ${context}

// Question: ${question}`;

//     // Step 4: Call Gemini
//     // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
//     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
//     const result = await model.generateContent(prompt);
//     const answer = result.response.text();

//     console.log('🤖 Gemini answered successfully');

//     // Step 5: Build sources
//     const sources = chunks.map(chunk => ({
//       documentId: chunk.documentId,
//       filename: docMap[chunk.documentId] || 'Unknown',
//       pageNumber: chunk.pageNumber,
//       preview: chunk.text.substring(0, 200) + '...',
//       score: chunk.score
//     }));

//     res.json({ success: true, answer, sources });

//   } catch (err) {
//     console.error('❌ Chat error:', err.message);
//     res.status(500).json({ error: err.message });
//   }
// });

// module.exports = router;

const router = require('express').Router();
const { spawn } = require('child_process');
const path = require('path');
const Groq = require('groq-sdk');
const Document = require('../models/Document');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function runPythonQuery(question, topK = 5) {
  return new Promise((resolve, reject) => {
    const pythonPath = path.join(__dirname, '../../ai/venv/Scripts/python.exe');
    const scriptPath = path.join(__dirname, '../../ai/query.py');
    const input = JSON.stringify({ question, topK });

    console.log('🐍 Running query with:', input);

    const py = spawn(pythonPath, [scriptPath]);
    let output = '';
    let errorOutput = '';

    py.stdin.write(input);
    py.stdin.end();

    py.stdout.on('data', data => {
      output += data.toString();
      console.log('🐍 Query stdout:', data.toString());
    });
    py.stderr.on('data', data => {
      errorOutput += data.toString();
    });

    py.on('close', code => {
      console.log('🐍 Query exit code:', code);
      if (code !== 0) return reject(new Error(errorOutput || 'Python query failed'));
      try {
        resolve(JSON.parse(output));
      } catch {
        reject(new Error('Invalid Python output: ' + output));
      }
    });
  });
}

function buildContext(chunks) {
  return chunks.map((chunk, i) =>
    `[Source ${i + 1}]\n${chunk.text}`
  ).join('\n\n---\n\n');
}

router.post('/', async (req, res) => {
  try {
    const { question, topK = 5 } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log('💬 Question received:', question);

    // Step 1: Find relevant chunks using Python
    const chunks = await runPythonQuery(question, topK);
    console.log('📚 Chunks found:', chunks.length);

    if (!chunks || chunks.length === 0) {
      return res.json({
        success: true,
        answer: "I couldn't find any relevant information in your knowledge base. Try uploading some documents first!",
        sources: []
      });
    }

    // Step 2: Get document names for sources
    const documentIds = [...new Set(chunks.map(c => c.documentId))];
    const documents = await Document.find({ _id: { $in: documentIds } });
    const docMap = {};
    documents.forEach(d => { docMap[d._id.toString()] = d.originalName; });

    // Step 3: Build context
    const context = buildContext(chunks);

    const systemPrompt = `You are a helpful AI assistant that answers questions based ONLY on the provided context from the user's personal knowledge base.

Rules:
- Answer ONLY based on the provided context
- If the context doesn't contain enough information, say "I don't have enough information in your knowledge base to answer this"
- Be concise and clear
- Mention which source your answer came from`;

    const userMessage = `Context from knowledge base:
${context}

Question: ${question}`;

    // Step 4: Call Groq
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1024
    });

    const answer = response.choices[0].message.content;
    console.log('🤖 Groq answered successfully');

    // Step 5: Build sources
    const sources = chunks.map(chunk => ({
      documentId: chunk.documentId,
      filename: docMap[chunk.documentId] || 'Unknown',
      pageNumber: chunk.pageNumber,
      preview: chunk.text.substring(0, 200) + '...',
      score: chunk.score
    }));

    res.json({ success: true, answer, sources });

  } catch (err) {
    console.error('❌ Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
