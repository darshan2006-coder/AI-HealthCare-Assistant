import { healthcareKnowledge } from "./healthKnowledge.js";
import { cleanText } from "./utils.js";

export function checkEmergency(userMessage) {

    const cleanedMessage = cleanText(userMessage);

    for (const keyword of healthcareKnowledge.emergencyKeywords) {

        if (cleanedMessage.includes(keyword)) {

            return {
                isEmergency: true,
                message:
                    "🚨 Your symptoms may require immediate medical attention. Please contact a doctor or emergency service immediately."
            };
        }
    }

    return {
        isEmergency: false
    };
}