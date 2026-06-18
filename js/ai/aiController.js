import { detectSymptoms } from "./symptomDetector.js";
import { checkEmergency } from "./emergencyChecker.js";
import { generateResponse } from "./responseGenerator.js";
import { healthcareKnowledge } from "./healthKnowledge.js";
import { randomItem, cleanText } from "./utils.js";

export function generateAIResponse(userMessage) {

    const cleanedMessage = cleanText(userMessage);

    
    const emergencyResult = checkEmergency(cleanedMessage);

    if (emergencyResult.isEmergency) {
        return emergencyResult.message;
    }

    
    const symptoms = detectSymptoms(cleanedMessage);

    
    if (
        cleanedMessage.includes("hello") ||
        cleanedMessage.includes("hi") ||
        cleanedMessage.includes("hey")
    ) {
        return randomItem(healthcareKnowledge.greetings);
    }

    
    return generateResponse(symptoms);
}