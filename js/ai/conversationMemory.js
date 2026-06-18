let conversationState = {
    symptoms: [],
    duration: null
};

export function updateSymptoms(newSymptoms) {
    
    if (newSymptoms && newSymptoms.length > 0) {
       
        const combinedSymptoms = new Set([...conversationState.symptoms, ...newSymptoms]);
        conversationState.symptoms = Array.from(combinedSymptoms);
    }
}

export function updateDuration(duration) {
    conversationState.duration = duration;
}

export function getConversationState() {
    return conversationState;
}

export function clearConversationState() {
    conversationState = {
        symptoms: [],
        duration: null
    };
    console.log("Conversation State Reset");
}