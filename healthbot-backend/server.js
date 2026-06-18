const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
// This allows your frontend to talk to this backend
app.use(cors()); 
app.use(express.json());

// Initialize the AI with your hidden key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Health check route for cloud deployment
app.get('/', (req, res) => {
    res.send('HealthBot API is successfully running!');
});

// Create the route that your frontend will send data to
app.post('/api/analyze', async (req, res) => {
    try {
        const { symptoms, duration, severity, temperature } = req.body;
        
        // This is the prompt that instructs the AI how to behave
        const prompt = `You are a medical assistant database. 
        A patient has the following symptoms: ${symptoms.join(', ')}.
        Duration: ${duration}. Severity: ${severity}. Temperature: ${temperature}.
        Please provide the top 3 possible conditions and a short list of recommended care.
        Return the result ONLY as a JSON object in exactly this format:
        {
          "conditions": ["Condition 1", "Condition 2", "Condition 3"],
          "advice": ["Advice 1", "Advice 2", "Advice 3"]
        }`;

        // Call the Gemini model
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            // 2. Pro-Tip: Force the AI to natively output strict JSON
            generationConfig: { responseMimeType: "application/json" }
        });
        
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // 3. Cleanly parse the guaranteed JSON response
        const aiData = JSON.parse(responseText);
        res.json(aiData); // Send the data back to the frontend

    } catch (error) {
        console.error("Error with AI:", error);
        res.status(500).json({ error: "Failed to analyze symptoms." });
    }
});

// 4. Dynamic port for Cloud Deployment
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});