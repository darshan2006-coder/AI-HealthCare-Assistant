import { generateFollowUpQuestion } from "./followUpQuestion.js";

export function generateResponse(
    symptoms = [],
    severity = "LOW",
    duration = null,
    temperature = null,
    riskLevel = "LOW",
    aiData = { conditions: [], advice: [] } // <-- New AI Data Parameter!
) {

    if (symptoms.length === 0) {
        return `
I couldn't clearly identify your symptoms.

Please describe:
• what symptoms you have
• how long you have them
• severity (mild / moderate / severe)
        `;
    }

    let response = `🧠 I analyzed your symptoms: ${symptoms.join(", ")}\n\n`;
    response += `📊 Severity Level: ${severity}\n\n`;

    if (duration) {
        response += `⏱ Duration: ${duration}\n\n`;
    }

    if (temperature) {
        response += `🌡 Temperature: ${temperature}°F\n\n`;
    }

    // Now we use the AI's Brain for conditions!
    response += `📌 Possible conditions (via AI Database):\n`;

    if (aiData.conditions && aiData.conditions.length > 0) {
        aiData.conditions.forEach(condition => {
            response += `• ${condition}\n`;
        });
    } else {
        response += `• Unable to fetch conditions. Please check your connection.\n`;
    }

    // Now we use the AI's Brain for advice!
    response += `\n💡 Recommended care:\n`;

    if (aiData.advice && aiData.advice.length > 0) {
        aiData.advice.forEach(item => {
            response += `• ${item}\n`;
        });
    } else {
        response += `• Stay hydrated\n• Monitor symptoms\n`;
    }

    if (riskLevel === "HIGH") {
        response += `\n🚨 WARNING: Your symptoms may require urgent medical attention.\n`;
    }

    response += `\n⚠️ Risk Level: ${riskLevel}\n`;

    response += `\n❓ ${generateFollowUpQuestion(symptoms, duration, temperature)}`;

    response += `\n\n⚠️ This is not a medical diagnosis. Please consult a healthcare professional if symptoms persist or worsen.`;

    return response;
}