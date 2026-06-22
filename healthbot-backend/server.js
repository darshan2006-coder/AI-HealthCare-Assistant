const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health check route
app.get('/', (req, res) => {
    res.send('HealthBot API is successfully running!');
});

// ROUTE 1: Strict JSON Medical Analysis (For the left-side form)
app.post('/api/analyze', async (req, res) => {
    try {
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

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent(prompt);
        const aiData = JSON.parse(result.response.text());
        res.json(aiData);

    } catch (error) {
        console.error("Analysis Error:", error);
        res.status(500).json({ error: "Failed to analyze symptoms." });
    }
});

// ROUTE 2: General Chat (For the bottom text input)
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        const prompt = `You are a helpful, empathetic AI healthcare assistant. 
        Answer the following user question clearly and concisely. 
        Always include a brief disclaimer that you are an AI, not a doctor.
        User question: "${message}"`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        
        res.json({ reply: result.response.text() });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ error: "Failed to process chat message." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});