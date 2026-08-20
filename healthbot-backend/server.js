const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors()); 
app.use(express.json());

// Serve static frontend files (HTML, CSS, JS) from the root project folder
app.use(express.static(path.join(__dirname, '..')));

// Health check route
app.get('/api/health', (req, res) => {
    res.send('HealthBot API is successfully running!');
});

// ROUTE 1: Strict JSON Medical Analysis (For the left-side form)
app.post('/api/analyze', async (req, res) => {
    try {
        const activeApiKey = req.headers['x-user-api-key'] || process.env.GEMINI_API_KEY;
        
        if (!activeApiKey) {
            return res.status(400).json({ error: "Missing Gemini API key. Please configure it in your settings." });
        }

        const { symptoms, duration, severity, temperature } = req.body;
        
        const prompt = `You are a medical assistant database. 
        A patient has the following symptoms: ${symptoms.join(', ')}.
        Duration: ${duration}. Severity: ${severity}. Temperature: ${temperature}.
        Please provide the top 3 possible conditions, a short list of recommended care, and 1 to 3 safe Over-The-Counter (OTC) medications if severity is LOW or MODERATE.
        If severity is SEVERE or temperature is high, return an empty array for medications.
        NEVER suggest prescription drugs.

        Return the result ONLY as a JSON object in exactly this format:
        {
          "conditions": ["Condition 1", "Condition 2", "Condition 3"],
          "advice": ["Advice 1", "Advice 2", "Advice 3"],
          "medications": ["OTC Med 1", "OTC Med 2"]
        }`;

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

// ROUTE 2: General Chat (For the bottom text input with language support)
app.post('/api/chat', async (req, res) => {
    try {
        const activeApiKey = req.headers['x-user-api-key'] || process.env.GEMINI_API_KEY;

        if (!activeApiKey) {
            return res.status(400).json({ error: "Missing Gemini API key. Please configure it in your settings." });
        }

        const { message, language = 'en' } = req.body;

        const languageNames = {
            'hi': 'Hindi (हिंदी)',
            'kn': 'Kannada (ಕನ್ನಡ)',
            'ml': 'Malayalam (മലയാളം)',
            'en': 'English'
        };

        const targetLangName = languageNames[language] || 'English';
        
        const prompt = `You are an AI healthcare assistant analyzing user messages.
        IMPORTANT: All text in your JSON values MUST be written entirely in ${targetLangName}.
        Analyze the user's message and respond STRICTLY in JSON format. Do not include markdown code blocks.
        
        Medication Rules:
        - If severity is LOW or MODERATE, suggest 1 to 3 safe Over-The-Counter (OTC) medications.
        - If severity is SEVERE or risk is HIGH, return an empty array [] for medications.
        - NEVER recommend prescription medications.

        Use this exact JSON structure (translate values into ${targetLangName}):
        {
          "summary": "Brief summary of user input",
          "severity": "LOW, MODERATE, or SEVERE",
          "conditions": ["Condition 1", "Condition 2"],
          "care": ["Care instruction 1", "Care instruction 2"],
          "medications": ["OTC Med 1", "OTC Med 2"],
          "risk": "LOW, MEDIUM, or HIGH"
        }
        
        User input: "${message}"`;

        const genAI = new GoogleGenerativeAI(activeApiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent(prompt);
        const aiResponseText = result.response.text().trim();
        
        const cleanJsonString = aiResponseText.replace(/^```json\s*|```$/g, '');
        const parsedData = JSON.parse(cleanJsonString);

        const meds = Array.isArray(parsedData.medications) ? parsedData.medications : [];
        let medicationSection = '';

        if (meds.length > 0) {
            medicationSection = `\n\n💊 Suggested OTC Medications:\n${meds.map(m => `• ${m}`).join('\n')}\n⚠️ Disclaimer: Consult a pharmacist or doctor before taking any medication.`;
        }

        const structuredReply = `🧠 I analyzed your symptoms: ${parsedData.summary}

📊 Severity Level: ${parsedData.severity}

📌 Possible conditions (via AI Database):
${parsedData.conditions.map(c => `• ${c}`).join('\n')}

💡 Recommended care:
${parsedData.care.map(i => `• ${i}`).join('\n')}${medicationSection}

⚠️ Risk Level: ${parsedData.risk}`;

        res.json({ reply: structuredReply });

    } catch (error) {
        console.error("Chat Error:", error);
        res.json({ 
            reply: `🧠 I analyzed your symptoms: Unable to process details cleanly.\n\n📊 Severity Level: MODERATE\n\n📌 Possible conditions (via AI Database):\n• Evaluation ongoing\n\n💡 Recommended care:\n• Monitor your health and seek advice.\n\n⚠️ Risk Level: LOW` 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});