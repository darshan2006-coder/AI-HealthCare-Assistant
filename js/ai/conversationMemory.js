// 🔄 Load initial state from localStorage, or default if empty
let conversationState = JSON.parse(localStorage.getItem('conversationState')) || {
    symptoms: [],
    duration: null
};

// 🔄 Load initial medical context from localStorage, or default to null
let currentMedicalContext = JSON.parse(localStorage.getItem('medicalFormContext')) || null;

// Function to save the form data and backend results
export function setMedicalContext(contextData) {
    currentMedicalContext = contextData;
    // Persist to localStorage
    localStorage.setItem('medicalFormContext', JSON.stringify(currentMedicalContext));
    console.log("🧠 AI Memory Updated with Medical Context:", currentMedicalContext);
}

// Function to retrieve it later when the user types a casual message
export function getMedicalContext() {
    return currentMedicalContext;
}

export function updateSymptoms(newSymptoms) {
    if (newSymptoms && newSymptoms.length > 0) {
        const combinedSymptoms = new Set([...conversationState.symptoms, ...newSymptoms]);
        conversationState.symptoms = Array.from(combinedSymptoms);
        
        // Save updated symptoms array to localStorage
        localStorage.setItem('conversationState', JSON.stringify(conversationState));
    }
}

export function updateDuration(duration) {
    conversationState.duration = duration;
    // Save updated duration to localStorage
    localStorage.setItem('conversationState', JSON.stringify(conversationState));
}

export function getConversationState() {
    return conversationState;
}

export function clearConversationState() {
    conversationState = {
        symptoms: [],
        duration: null
    };
    currentMedicalContext = null;
    
    // 🧼 Clean out localStorage completely so a new session starts clean
    localStorage.removeItem('conversationState');
    localStorage.removeItem('medicalFormContext');
    
    console.log("Conversation State Reset and LocalStorage Cleared");
}