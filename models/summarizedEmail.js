import mongoose from "mongoose";

const summarizedEmailSchema = new mongoose.Schema({
    gmailMessageId: {
        type: String,
        required: true,
        unique: true 
    },
    summary: {
        type: String,
        required: true
    },
    explaination: {
        type: String,
        required: false
    },
    replyBack: [{
        tone: {
            type: String,
            required: true,
            enum: ['Friendly', 'Neutral', 'Formal']
        },
        text: {
            type: String,
            required: true
        }
    }],
}, { timestamps: true });

export const SummarizedEmailModel = mongoose.model('SummarizedEmail', summarizedEmailSchema);