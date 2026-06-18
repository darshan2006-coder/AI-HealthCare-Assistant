// severityAnalyzer.js

/**
 * Evaluates initial symptom text arrays for immediate clinical risk keywords.
 * This acts as a safety-first fallback mechanism to establish baseline severity 
 * before the user explicitly answers downstream triage prompts.
 * * @param {string[]} symptoms - Array of strings representing raw symptom inputs.
 * @returns {string} The derived baseline severity level ("LOW", "MODERATE", or "HIGH").
 */
export function analyzeSeverity(symptoms) {
    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
        return "LOW";
    }

    
    const evaluationText = symptoms.join(" ").toLowerCase();

    
    const emergencyFlags = [
        "chest pain", "breathing", "shortness of breath", 
        "unconscious", "severe", "heavy bleeding", "stroke"
    ];

   
    const moderateFlags = [
        "fever", "vomiting", "dizziness", "dizzy", "moderate", "pain"
    ];

   
    const containsEmergency = emergencyFlags.some(flag => evaluationText.includes(flag));
    if (containsEmergency) {
        return "HIGH";
    }

  
    const containsModerate = moderateFlags.some(flag => evaluationText.includes(flag));
    if (containsModerate) {
        return "MODERATE";
    }

    return "LOW";
}