const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
    res.send('HealthBot API is successfully running!');
});

// ROUTE 1: Strict JSON Medical Analysis (For the left-side form)
app.post('/api/analyze', async (req, res) => {
    try {
        // Extract user key from headers; fallback to your server's .env key
        const activeApiKey = req.headers['x-user-api-key'] || process.env.GEMINI_API_KEY;
        
        if (!activeApiKey) {
            return res.status(400).json({ error: "Missing Gemini API key. Please configure it in your settings." });
        }

        const { symptoms, duration, severity, temperature } = req.body;
        
        const prompt = `You are a medical assistant database. 
        A patient has the following symptoms: ${symptoms.join(', ')}.
        Duration: ${duration}. Severity: ${severity}. Temperature: ${temperature}.
        Please provide the top 3 possible conditions and a short list of recommended care.
        Return the result ONLY as a JSON object in exactly this format:
        {
          "conditions": ["Condition 1", "Condition 2", "Condition 3"],
          "advice": ["Advice 1", "Advice 2", "Advice 3"]
        }`;

        // Initialize Gemini dynamically per request using the active key
        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent(prompt);
        const aiData = JSON.parse(result.response.text());
        res.json(aiData);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze symptoms. Verify your API key configuration." });
    }
});

// ROUTE 2: General Chat (For the bottom text input)
app.post('/api/chat', async (req, res) => {
    try {
        const activeApiKey = req.headers['x-user-api-key'] || process.env.GEMINI_API_KEY;

        if (!activeApiKey) {
            return res.status(400).json({ error: "Missing Gemini API key. Please configure it in your settings." });
        }

        const { message } = req.body;
        
        // 🌟 Updated prompt instructing Gemini to return a clean layout that your frontend expects
        const prompt = `You are an empathetic AI healthcare assistant analyzing user messages.
        Analyze the user's message and respond strictly using the following layout sections (use the exact headers):
        
        🧠 I analyzed your symptoms: [Summarize what they said here]
        📊 Severity Level: [LOW / MODERATE / SEVERE]
        📌 Possible conditions (via AI Database):
        • [Condition 1]
        • [Condition 2]
        💡 Recommended care:
        • [Care instruction 1]
        • [Care instruction 2]
        ⚠️ Risk Level: [LOW / MEDIUM / HIGH]
        
        User question: "${message}"`;

        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to process chat message. Verify your API key configuration." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});