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
        
        // We instruct Gemini to return data in rigid JSON format so parsing never fails
        const prompt = `You are an AI healthcare assistant analyzing user messages.
        Analyze the user's message and respond STRICTLY in JSON format. Do not include markdown code blocks (like \`\`\`json).
        
        Use this exact structure:
        {
          "summary": "Brief summary of user input",
          "severity": "LOW, MODERATE, or SEVERE",
          "conditions": ["Condition 1", "Condition 2"],
          "care": ["Care instruction 1", "Care instruction 2"],
          "risk": "LOW, MEDIUM, or HIGH"
        }
        
        User input: "${message}"`;

        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        
        const aiResponseText = result.response.text().trim();
        
        // Clean out any accidental markdown styling if Gemini includes it
        const cleanJsonString = aiResponseText.replace(/^```json\s*|```$/g, '');
        const parsedData = JSON.parse(cleanJsonString);

        // Map the structured data directly into the exact layout your frontend string expectations need
        const structuredReply = `🧠 I analyzed your symptoms: ${parsedData.summary}

📊 Severity Level: ${parsedData.severity}

📌 Possible conditions (via AI Database):
${parsedData.conditions.map(c => `• ${c}`).join('\n')}

💡 Recommended care:
${parsedData.care.map(i => `• ${i}`).join('\n')}

⚠️ Risk Level: ${parsedData.risk}`;

        res.json({ reply: structuredReply });

    } catch (error) {
        console.error("Chat Error:", error);
        // Fallback response just in case JSON parsing hits an issue
        res.json({ 
            reply: `🧠 I analyzed your symptoms: Unable to process details cleanly.\n\n📊 Severity Level: MODERATE\n\n📌 Possible conditions (via AI Database):\n• Evaluation ongoing\n\n💡 Recommended care:\n• Monitor your health and seek advice.\n\n⚠️ Risk Level: LOW` 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});