import {
    getCurrentStep,
    setCurrentStep
} from "./questionState.js";

export function generateFollowUpQuestion(
    symptoms,
    duration,
    temperature
) {

    const step = getCurrentStep();

    if (
        symptoms.length > 0 &&
        step === "symptom"
    ) {

        setCurrentStep("severity");

        return "How severe are your symptoms? (Mild / Moderate / Severe)";
    }

    if (
        !duration &&
        step === "severity"
    ) {

        setCurrentStep("duration");

        return "How long have you had these symptoms?";
    }

    if (
        !temperature &&
        step === "duration"
    ) {

        setCurrentStep("temperature");

        return "What is your temperature?";
    }

    if (
        duration &&
        !temperature
    ) {

        setCurrentStep("temperature");

        return "What is your temperature?";
    }

    setCurrentStep("analysis");

    return "Would you like more health guidance?";
}