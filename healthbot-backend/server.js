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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Clean the response to ensure it is valid JSON
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const aiData = JSON.parse(jsonMatch[0]);
            res.json(aiData); // Send the data back to the frontend
        } else {
            throw new Error("AI did not return valid JSON");
        }

    } catch (error) {
        console.error("Error with AI:", error);
        res.status(500).json({ error: "Failed to analyze symptoms." });
    }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is successfully running on http://localhost:${PORT}`);
});