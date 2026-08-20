import { analyzeSymptoms } from "./symptomAnalyzer.js";
import { analyzeSeverity } from "./severityAnalyzer.js";
import { generateResponse } from "./responseGenerator.js";
import { detectDuration } from "./durationDetector.js";
import { getConversationState, updateSymptoms, updateDuration, getMedicalContext } from "./conversationMemory.js";
import { detectTemperature } from "./temperatureDetector.js";
import { setTemperature, getTemperature, resetTemperature} from "./followUpState.js";
import { calculateRisk } from "./riskScorer.js";
import { detectUserSeverity } from "./severityInputDetector.js";
import { setUserSeverity, getUserSeverity, resetUserSeverity} from "./severityState.js";
import { generateExtraGuidance } from "./guidanceGenerator.js";
import { setCurrentStep, getCurrentStep } from "./questionState.js";
import { showWarning } from "./warningModal.js";

// Helper to use the global translation function safely
const t = (key) => window.t ? window.t(key) : key;

export async function generateAIResponse(message) {
    const medicalContext = getMedicalContext();
    const state = getConversationState();

    if (medicalContext) {
        if ((!state.symptoms || state.symptoms.length === 0) && medicalContext.symptoms) {
            const symptomsArray = typeof medicalContext.symptoms === 'string'
                ? medicalContext.symptoms.split(',').map(s => s.trim())
                : medicalContext.symptoms;
            updateSymptoms(symptomsArray);
        }
        if (!state.duration && medicalContext.duration) updateDuration(medicalContext.duration);
        if (!getTemperature() && medicalContext.temperature) setTemperature(medicalContext.temperature);
        if (!getUserSeverity() && medicalContext.severity) setUserSeverity(medicalContext.severity);
    }

    const duration = detectDuration(message);
    const userSeverity = detectUserSeverity(message);
    const isAnsweringTemperature = getCurrentStep() === "temperature";
    const lowerMsg = message.toLowerCase().trim();
    const ignoreWords = ["hi", "hello", "hey", "yes", "no", "ok", "thanks", "jg", "g4tg"];

    let symptoms = [];

    if (!duration && !userSeverity && !isAnsweringTemperature && !ignoreWords.includes(lowerMsg)) {
        // Only parse new symptoms if we don't already have a strict medical context active
        // This prevents questions like "can I take tylenol?" from being treated as a disease
        if (!medicalContext) {
            symptoms = analyzeSymptoms(message);
        }
    }

    const newSymptoms = symptoms.filter(
        symptom => !state.symptoms.includes(symptom)
    );

    const hasEmergencyKeywords = lowerMsg.includes("chest pain") || lowerMsg.includes("breathing");
    
    // 🛡️ THE FIX: Protect the memory! Only reset vitals if there is NO strict medical context.
    if (newSymptoms.length > 0 || hasEmergencyKeywords) {
        if (!medicalContext) { 
            setCurrentStep("symptom");
            resetUserSeverity();
            updateDuration(null);
            resetTemperature();
        }
    }

    if (symptoms.length > 0) {
        if (hasEmergencyKeywords && !medicalContext) {
            state.symptoms = []; 
        }
        updateSymptoms(symptoms);
    }
    if (duration) updateDuration(duration);
    if (userSeverity) setUserSeverity(userSeverity);

    const updatedState = getConversationState();
    const severity = getUserSeverity() || analyzeSeverity(updatedState.symptoms);
    
    const currentTemp = getTemperature();
    let riskLevel = calculateRisk(updatedState.symptoms, severity, currentTemp);
    
    // 🚨 Safety Check ensures Risk Level stays HIGH for 103F+
    if (severity === "HIGH" || severity === "Severe" || (currentTemp && parseFloat(currentTemp) >= 103)) {
        riskLevel = "HIGH";
    }

    let temperature = null;
    if (getCurrentStep() === "temperature") {
        temperature = detectTemperature(message);
    }

    if (temperature === "INVALID") {
        showWarning(t("aiInvalidTempTitle"), t("aiInvalidTempDesc"));
        return `${t("aiInvalidTempTitle")}\n${t("aiInvalidTempDesc")}\n❓ ${t("aiAskTemp")}`;
    }

    if (temperature) {
        setTemperature(temperature);
        if (temperature >= 106) {
            showWarning(t("aiEmergencyTitle"), t("aiEmergencyDesc"));
        }
    }

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
                    temperature: currentTemp || "Not specified",
                    message: message 
                })
            });
            aiData = await response.json();
        } catch (error) {
            console.error("AI Server Error:", error);
            aiData.conditions = [t("aiOfflineCond")];
            aiData.advice = [t("aiOfflineAdv")];
        }
    }

    let finalRiskLevel = riskLevel;

    // We can still check English keywords here since the underlying ML engine likely processes English
    if (lowerMsg.includes("yes")) {
        return generateExtraGuidance(updatedState.symptoms, severity, currentTemp, finalRiskLevel);
    }
    if (lowerMsg.includes("no")) {
        return t("aiFarewell");
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