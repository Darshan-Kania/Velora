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
}, { timestamps: true });

export const SummarizedEmailModel = mongoose.model('SummarizedEmail', summarizedEmailSchema);