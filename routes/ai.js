const express = require('express');
const router = express.Router();
const multer = require('multer');
const Information = require('../models/Information');
const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");
// DeepSeek အတွက် fetch ကိုသုံးမှာမို့ သီးသန့် import မလိုပါ။ Node.js 18+ မှာ global fetch ပါပြီးသား။
// Node.js version အဟောင်းဆိုရင် node-fetch install လုပ်ပြီး import လုပ်ရပါမယ်။
// const fetch = require('node-fetch'); // For Node.js < 18 if needed

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'uploads'); // Project root ကနေ uploads folder
    // uploads directory မရှိရင် ဖန်တီးပါ
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')); // space တွေကို underscore နဲ့အစားထိုး
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // PDF files တွေကိုပဲ လက်ခံဖို့ (ဥပမာ)
    // if (file.mimetype === 'application/pdf') {
    //   cb(null, true);
    // } else {
    //   cb(new Error('Only PDF files are allowed!'), false);
    // }
    cb(null, true); // လောလောဆယ် file type အကုန်လက်ခံထားမယ်
  }
}).array('files'); // 'files' က frontend FormData ထဲက field name

// POST /api/ai/upload
router.post('/upload', (req, res) => {
  console.log('[/api/ai/upload] Request received. Attempting to upload files...');

  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error during upload:', err);
      return res.status(500).json({ message: 'Multer error: ' + err.message });
    } else if (err) {
      console.error('Unknown error during upload:', err);
      return res.status(500).json({ message: 'Upload error: ' + err.message });
    }

    if (!req.files || req.files.length === 0) {
      console.log('No files were selected for upload.');
      return res.status(400).json({ message: 'No files selected.' });
    }

    console.log('Files received by multer:', req.files);
    console.log('Description from body:', req.body.description);

    try {
      const uploadedFileInfos = [];
      for (const file of req.files) {
        let extractedFileText = '';
        if (file.mimetype === 'application/pdf') {
          try {
            const dataBuffer = fs.readFileSync(file.path);
            const pdfData = await pdf(dataBuffer);
            extractedFileText = pdfData.text;
            console.log(`Extracted text from ${file.originalname} (first 200 chars): ${extractedFileText.substring(0,200)}...`);
          } catch (pdfError) {
            console.error(`Error parsing PDF ${file.originalname}:`, pdfError);
            // extractedText ကို خالی ထားနိုင်သည် သို့မဟုတ် error message တစ်ခုခု ထည့်နိုင်သည်
          }
        } else {
          console.log(`Skipping text extraction for non-PDF file: ${file.originalname}`);
          // တခြား file type တွေအတွက် (e.g., .txt, .docx) text extraction ထပ်ထည့်နိုင်ပါတယ်
        }

        const newInfo = new Information({
          originalName: file.originalname,
          filename: file.filename,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          description: req.body.description || '',
          extractedText: extractedFileText, // ထုတ်ယူထားတဲ့ စာသားကို ဒီမှာထည့်ပါ
        });
        const savedInfo = await newInfo.save();
        uploadedFileInfos.push(savedInfo);
        console.log(`File info saved to DB for ${file.originalname}:`, savedInfo._id);
      }

      console.log('All files processed and info saved. Sending success response.');
      res.status(200).json({
        message: `${req.files.length} file(s) uploaded and info saved successfully!`,
        files: uploadedFileInfos
      });

    } catch (dbError) {
      console.error('Error saving file information to database:', dbError);
      req.files.forEach(file => {
        try {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
            console.log(`Cleaned up file: ${file.path}`);
          }
        } catch (cleanupError) {
          console.error(`Error cleaning up file ${file.path}:`, cleanupError);
        }
      });
      res.status(500).json({ message: 'Database error during file upload.', error: dbError.message });
    }
  });
});

// Helper function to call different AI models
async function callSelectedAIModel(question, context, modelName, apiKey) {
  console.log(`Calling actual AI: ${modelName} with question: "${question}"`);
  
  try {
    switch (modelName.toLowerCase()) {
      case 'gemini':
        if (!apiKey) throw new Error("Google API Key (GOOGLE_API_KEY) is not set.");
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); 
        
        const geminiStrictContextPrompt = `You are an AI assistant. Follow these crucial instructions precisely:

Crucial Instructions for Answering:
1.  **Source of Truth**: Your answer MUST be based *exclusively* on the information found within the "Context from uploaded documents" provided below. Do NOT use any external knowledge or information you were trained on.
2.  **Language of Response**: You MUST respond in the *same language as the user's question*. For example, if the question is in Burmese, your entire response must be in Burmese. If the question is in English, your entire response must be in English.
3.  **Handling Document Language Differences**:
    *   The "Context from uploaded documents" might be in a different language than the user's question.
    *   If the languages differ, you MUST first thoroughly understand the content of the documents.
    *   Identify the specific information *within the documents* that directly answers the user's question.
    *   Internally translate *only this specific relevant information* into the language of the user's question.
    *   Use this internally translated information to construct your answer in the language of the user's question.
4.  **Information Not Found**: If, after careful review of the "Context from uploaded documents", the answer to the question cannot be found, you MUST explicitly state this in the language of the user's question. For example, if the question is in Burmese, you might say: "တင်ပြထားသော စာရွက်စာတမ်းများတွင် အမေးနှင့်သက်ဆိုင်သည့် အချက်အလက် မပါဝင်ပါ။". Do not attempt to answer from general knowledge or make assumptions.

Context from uploaded documents:
"""
${context}
"""

Based *ONLY* on the "Context from uploaded documents" provided above (and translated internally if necessary as per "Handling Document Language Differences" instruction), answer the following question: "${question}"`;
        
        console.log(`Attempting to generate content with Gemini model: gemini-1.5-flash-latest`);
        const resultGemini = await geminiModel.generateContent(geminiStrictContextPrompt);
        const responseGemini = await resultGemini.response;
        console.log("Gemini response received.");
        return responseGemini.text();

      case 'gpt-4':
        if (!apiKey) throw new Error("OpenAI API Key (OPENAI_API_KEY) is not set.");
        const openai = new OpenAI({ apiKey });
        
        const gptStrictSystemMessage = `You are an AI assistant. Adhere strictly to the following instructions:

Crucial Instructions for Answering:
1.  **Source of Truth**: Your answer MUST be based *exclusively* on the information found within the "Context from uploaded documents" provided in the user message. Do NOT use any external knowledge or information you were trained on.
2.  **Language of Response**: You MUST respond in the *same language as the user's question*.
3.  **Handling Document Language Differences**:
    *   The "Context from uploaded documents" (in the user message) might be in a different language than the user's question.
    *   If the languages differ, you must first thoroughly understand the content of the documents.
    *   Identify the specific information *within the documents* that directly answers the user's question.
    *   Internally translate *only this specific relevant information* into the language of the user's question.
    *   Use this internally translated information to construct your answer in the language of the user's question.
4.  **Information Not Found**: If, after careful review of the "Context from uploaded documents", the answer to the question cannot be found, you MUST explicitly state this in the language of the user's question (e.g., for a Burmese question: "တင်ပြထားသော စာရွက်စာတမ်းများတွင် အမေးနှင့်သက်ဆိုင်သည့် အချက်အလက် မပါဝင်ပါ။"). Do not attempt to answer from general knowledge.`;

        const gptUserStrictContextPrompt = `Context from uploaded documents:
"""
${context}
"""

Based *ONLY* on the "Context from uploaded documents" provided above (and translated internally if necessary as per system instructions for handling document language differences), answer the following question: "${question}"`;
        
        const modelToUse = "gpt-4o"; 
        console.log(`Attempting to generate content with OpenAI model: ${modelToUse}`);
        
        const completionOpenAI = await openai.chat.completions.create({
          messages: [
            { role: "system", content: gptStrictSystemMessage },
            { role: "user", content: gptUserStrictContextPrompt } 
          ],
          model: modelToUse, 
        });
        console.log("OpenAI response received. Choices:", completionOpenAI.choices);
        if (completionOpenAI.choices && completionOpenAI.choices.length > 0 && completionOpenAI.choices[0].message) {
          return completionOpenAI.choices[0].message.content;
        } else {
          console.error("Unexpected OpenAI response structure:", completionOpenAI);
          throw new Error("Could not parse response from OpenAI. Check server logs for the full response object.");
        }

      case 'deepseek':
        if (!apiKey) throw new Error("DeepSeek API Key (DEEPSEEK_API_KEY) is not set.");
        const deepseekApiUrl = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
        
        const deepseekStrictSystemMessage = `You are an AI assistant. Follow these instructions precisely:

Crucial Instructions for Answering:
1.  **Source of Truth**: Your answer MUST be based *exclusively* on the information found within the "Context from uploaded documents" provided in the user message. Do NOT use any external knowledge.
2.  **Language of Response**: You MUST respond in the *same language as the user's question*.
3.  **Handling Document Language Differences**:
    *   The "Context from uploaded documents" (in the user message) might be in a different language than the user's question.
    *   If languages differ, first thoroughly understand the document content.
    *   Identify specific information *within the documents* that answers the question.
    *   Internally translate *only this specific relevant information* to the question's language.
    *   Use this translated information to construct your answer in the question's language.
4.  **Information Not Found**: If the answer isn't in the "Context from uploaded documents", state this in the question's language (e.g., for Burmese: "တင်ပြထားသော စာရွက်စာတမ်းများတွင် အမေးနှင့်သက်ဆိုင်သည့် အချက်အလက် မပါဝင်ပါ။"). Do not use general knowledge.`;

        const deepseekUserStrictContextPrompt = `Context from uploaded documents:
"""
${context}
"""

Based *ONLY* on the "Context from uploaded documents" provided above (and translated internally if necessary as per system instructions for handling document language differences), answer the following question: "${question}"`;

        console.log(`Attempting to generate content with DeepSeek model: deepseek-chat via URL: ${deepseekApiUrl}`);
        
        const deepseekPayload = {
          model: "deepseek-chat", 
          messages: [
            { role: "system", content: deepseekStrictSystemMessage },
            { role: "user", content: deepseekUserStrictContextPrompt } 
          ],
        };

        const responseDeepSeek = await fetch(deepseekApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(deepseekPayload)
        });

        console.log(`DeepSeek API response status: ${responseDeepSeek.status}`);
        if (!responseDeepSeek.ok) {
          const errorBody = await responseDeepSeek.text();
          console.error(`DeepSeek API Error Body: ${errorBody}`);
          throw new Error(`DeepSeek API Error: ${responseDeepSeek.status} ${responseDeepSeek.statusText}`);
        }
        const dataDeepSeek = await responseDeepSeek.json();
        console.log("DeepSeek response data received:", JSON.stringify(dataDeepSeek, null, 2));
        if (dataDeepSeek.choices && dataDeepSeek.choices.length > 0 && dataDeepSeek.choices[0].message) {
          return dataDeepSeek.choices[0].message.content;
        } else {
          console.error("Unexpected DeepSeek response structure:", dataDeepSeek);
          throw new Error("Could not parse response from DeepSeek. Check server logs for the full response object.");
        }

      case 'claude':
        // TODO: Implement Claude API call using Anthropic SDK if available and API key is set
        // const { Anthropic } = require("@anthropic-ai/sdk");
        // if (!process.env.ANTHROPIC_API_KEY) throw new Error("Anthropic API Key (ANTHROPIC_API_KEY) is not set.");
        // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        // const msg = await anthropic.messages.create({
        //   model: "claude-3-opus-20240229", // or other Claude model
        //   max_tokens: 1024,
        //   messages: [{ role: "user", content: fullPrompt }],
        // });
        // return msg.content[0].text;
        console.warn("Claude API call is not fully implemented yet. Returning simulated response.");
        return `Simulated response from Claude for: "${question}". Context (first 100 chars): "${context.substring(0,100)}..."`;

      default:
        throw new Error(`Unsupported AI model: ${modelName}`);
    }
  } catch (error) {
    console.error(`Error calling AI model ${modelName}:`, error); // ဒီနေရာမှာလည်း error object ကို ပြပါလိမ့်မယ်
    res.status(500).json({ message: 'Failed to get response from AI.', error: error.message });
  }
}

// POST /api/ai/ask - AI ကို မေးမြန်းရန် API
router.post('/ask', async (req, res) => {
  const { question, model } = req.body;

  if (!question || !model) {
    return res.status(400).json({ message: 'Question and AI model are required.' });
  }

  console.log(`Received question: "${question}" for AI model: ${model}`);

  try {
    let contextText = "No relevant information found in uploaded files.";
    // Try to find documents where extractedText or description or originalName matches the question
    const contextDocuments = await Information.find(
      { $text: { $search: question } },
      { score: { $meta: "textScore" } }
    )
    .sort({ score: { $meta: "textScore" } })
    .limit(3);

    if (contextDocuments && contextDocuments.length > 0) {
      contextText = contextDocuments.map(doc => {
        let content = "";
        if (doc.extractedText && doc.extractedText.trim() !== "") {
          content += doc.extractedText.trim() + "\n"; // Prioritize extracted text
        }
        if (doc.description && doc.description.trim() !== "") {
          content += "Description: " + doc.description.trim() + "\n";
        }
        // Include filename if other content is sparse, or for reference
        if (content.length < 100 && doc.originalName) { // Add filename if content is short
             content += "File Reference: " + doc.originalName;
        }
        return content.trim();
      }).join("\n\n---\n\n");
      console.log(`Found context from ${contextDocuments.length} file(s).`);
      console.log(`Full context being sent to AI (first 500 chars): ${contextText.substring(0, 500)}`);
    } else {
      console.log('No relevant documents found for context using $text search.');
    }

    // 2. Select API Key based on model
    let apiKey;
    let effectiveModelName = model; // This will be used for the switch case in callSelectedAIModel

    switch (model.toLowerCase()) {
      case 'gemini':
        apiKey = process.env.GOOGLE_API_KEY;
        effectiveModelName = 'gemini'; // Ensure this matches the case in callSelectedAIModel
        break;
      case 'gpt-4':
        apiKey = process.env.OPENAI_API_KEY;
        effectiveModelName = 'gpt-4'; // Ensure this matches the case in callSelectedAIModel
        break;
      case 'deepseek':
        apiKey = process.env.DEEPSEEK_API_KEY;
        effectiveModelName = 'deepseek'; // Ensure this matches the case in callSelectedAIModel
        break;
      case 'claude':
        // apiKey = process.env.ANTHROPIC_API_KEY; // Claude အတွက် API key .env မှာထည့်ရန်
        effectiveModelName = 'claude'; // Ensure this matches the case in callSelectedAIModel
        break;
      default:
        return res.status(400).json({ message: 'Unsupported AI model selected.' });
    }

    // API Key မရှိရင် warning ပြပြီး simulation အတိုင်းဆက်မသွားတော့ဘဲ error ပြန်ပါမယ်။
    // Claude ကလဲရင်ပေါ့ (Claude ကို simulation အဖြစ်ထားခဲ့လို့)
    if (!apiKey && effectiveModelName !== 'claude') {
        console.error(`API Key for ${effectiveModelName} is not set in .env file.`); // API Key မရှိရင် ဒီ log ထွက်ပါမယ်
        return res.status(500).json({ message: `API Key for ${effectiveModelName} is not configured on the server.` });
    }
    
    const aiAnswer = await callSelectedAIModel(question, contextText, effectiveModelName, apiKey);

    res.status(200).json({ answer: aiAnswer, modelUsed: effectiveModelName, contextFound: contextDocuments.length > 0 });

  } catch (error) {
    console.error('Error processing AI request:', error); // ဒီနေရာမှာလည်း error object ကို ပြပါလိမ့်မယ်
    res.status(500).json({ message: 'Failed to get response from AI.', error: error.message });
  }
});

module.exports = router;