import { analyzeSymptoms } from "./symptomAnalyzer.js";
import { analyzeSeverity } from "./severityAnalyzer.js";
import { generateResponse } from "./responseGenerator.js";
import { detectDuration } from "./durationDetector.js";
import { getConversationState, updateSymptoms, updateDuration} from "./conversationMemory.js";
import { detectTemperature } from "./temperatureDetector.js";
import { setTemperature, getTemperature, resetTemperature} from "./followUpState.js";
import { calculateRisk } from "./riskScorer.js";
import { detectUserSeverity } from "./severityInputDetector.js";
import { setUserSeverity, getUserSeverity, resetUserSeverity} from "./severityState.js";
import { generateExtraGuidance } from "./guidanceGenerator.js";
import { setCurrentStep, getCurrentStep } from "./questionState.js";
import { showWarning } from "./warningModal.js";

export async function generateAIResponse(message) {
    const state = getConversationState();

    // 1. Context Check: Determine if the message is answering a specific triage question
    const duration = detectDuration(message);
    const userSeverity = detectUserSeverity(message);
    const isAnsweringTemperature = getCurrentStep() === "temperature";
    const lowerMsg = message.toLowerCase().trim();
    const ignoreWords = ["hi", "hello", "hey", "yes", "no", "ok", "thanks", "jg", "g4tg"];

    let symptoms = [];

    // 2. Core Pipeline: Only treat as a new symptom if it's not structural triage input or a greeting
    if (!duration && !userSeverity && !isAnsweringTemperature && !ignoreWords.includes(lowerMsg)) {
        symptoms = analyzeSymptoms(message);
    }

    // Check for newly added symptoms
    const newSymptoms = symptoms.filter(
        symptom => !state.symptoms.includes(symptom)
    );

    // Dynamic Reset: If a user drops a heavy multi-symptom emergency string, clear old state pollution
    const hasEmergencyKeywords = lowerMsg.includes("chest pain") || lowerMsg.includes("breathing");
    
    if (newSymptoms.length > 0 || hasEmergencyKeywords) {
        setCurrentStep("symptom");
        resetUserSeverity();
        updateDuration(null);
        resetTemperature();
    }

    // Save data to memory
    if (symptoms.length > 0) {
        // If it's a critical new emergency string, overwrite the state instead of appending duplicates
        if (hasEmergencyKeywords) {
            state.symptoms = []; 
        }
        updateSymptoms(symptoms);
    }
    if (duration) updateDuration(duration);
    if (userSeverity) setUserSeverity(userSeverity);

    const updatedState = getConversationState();
    const severity = getUserSeverity() || analyzeSeverity(updatedState.symptoms);
    
    // Evaluate Risk Level
    const currentTemp = getTemperature();
    let riskLevel = calculateRisk(updatedState.symptoms, severity, currentTemp);
    
    // 🚨 CLINICAL SAFETY ALIGNMENT: Force Risk Level to HIGH if severity is HIGH or temperature is critical
    if (severity === "HIGH" || (currentTemp && parseFloat(currentTemp) >= 103)) {
        riskLevel = "HIGH";
    }

    // Detect temperature if expected
    let temperature = null;
    if (getCurrentStep() === "temperature") {
        temperature = detectTemperature(message);
    }

    if (temperature === "INVALID") {
        showWarning(
            "⚠ Invalid Temperature",
            "Please enter a body temperature between 95°F and 108°F."
        );
        return `
⚠ Invalid Temperature
Please enter a body temperature between 95°F and 108°F.
❓ What is your temperature?`;
    }

    if (temperature) {
        setTemperature(temperature);
        if (temperature >= 106) {
            showWarning(
                "🚨 Medical Emergency",
                "A temperature above 106°F can be life-threatening. Please seek emergency medical care immediately."
            );
        }
    }

    // ==========================================
    // 🧠 AI SERVER FETCH LOGIC
    // ==========================================
    let aiData = { conditions: [], advice: [] };
    
    if (updatedState.symptoms.length > 0) {
        try {
            const response = await fetch('http://localhost:3000/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symptoms: updatedState.symptoms,
                    duration: updatedState.duration || "Not specified",
                    severity: severity || "Not specified",
                    temperature: currentTemp || "Not specified"
                })
            });
            
            aiData = await response.json();
            
        } catch (error) {
            console.error("AI Server Error:", error);
            aiData.conditions = ["Systemic Evaluation Suggested (Server Offline)"];
            aiData.advice = [
                "Ensure your local backend server node is actively running.",
                "For severe symptoms like chest pain, proceed immediately to an emergency care facility."
            ];
        }
    }

    let finalRiskLevel = riskLevel;

    // Debug logs
    console.log("Message:", message);
    console.log("Current State:", updatedState);
    console.log("Risk Level:", finalRiskLevel);

    const lowerMessage = message.toLowerCase().trim();

    if (lowerMessage.includes("yes")) {
        return generateExtraGuidance(
            updatedState.symptoms,
            severity,
            currentTemp,
            finalRiskLevel
        );
    }

    if (lowerMessage.includes("no")) {
        return `
✅ Thank you for using HealthBot.
Take care and monitor your symptoms.
⚠️ Consult a healthcare professional if symptoms worsen.
`;
    }

    return generateResponse(
        updatedState.symptoms,
        severity,
        updatedState.duration,
        currentTemp,
        finalRiskLevel,
        aiData
    );
}