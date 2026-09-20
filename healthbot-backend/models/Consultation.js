// healthbot-backend/models/Consultation.js
const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    type: { 
        type: String, 
        enum: ['analyze', 'chat'], 
        required: true 
    },
    userInput: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    },
    aiResponse: { 
        type: mongoose.Schema.Types.Mixed, 
        required: true 
    },
    language: { 
        type: String, 
        default: 'en' 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Consultation', consultationSchema);