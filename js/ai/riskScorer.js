import { riskConfig }
from "./riskConfig.js";

export function calculateRisk(
    symptoms,
    severity,
    temperature
) {

    let score = 0;

    score +=
        riskConfig.severityScore[
            severity
        ] || 0;

    if (
        temperature >=
        riskConfig.temperature.high
    ) {

        score += 40;
    }

    else if (
        temperature >=
        riskConfig.temperature.moderate
    ) {

        score += 20;
    }

    symptoms.forEach(symptom => {

        score +=
            riskConfig.symptomScore[
                symptom
            ] || 0;

    });

    if (score >= 80) {
        return "HIGH";
    }

    if (score >= 40) {
        return "MODERATE";
    }

    return "LOW";
}