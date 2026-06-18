let currentStep = "symptom";

export function getCurrentStep() {
    return currentStep;
}

export function setCurrentStep(step) {
    currentStep = step;
}

export function resetQuestionState() {
    currentStep = "symptom";
}