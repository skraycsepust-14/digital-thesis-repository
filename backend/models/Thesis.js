// backend/models/Thesis.js

const mongoose = require('mongoose');

const ThesisSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    abstract: {
        type: String,
        required: true
    },
    keywords: {
        type: [String],
        required: true
    },
    filePath: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    authorName: {
        type: String,
        required: true
    },
    department: {
        type: String,
        required: true
    },
    submissionYear: {
        type: Number,
        required: true
    },
    isPublic: {
        type: Boolean,
        default: false
    },
    date: {
        type: Date,
        default: Date.now
    },
    // --- New fields for AI Analysis ---
    aiSummary: {
        type: String,
        required: false,
    },
    aiKeywords: {
        type: [String], // Storing AI-generated keywords as an array
        required: false,
    },
    aiSentiment: {
        type: String, // e.g., 'Positive', 'Neutral', 'Negative'
        required: false,
    },
    analysisStatus: {
        type: String,
        enum: ['pending', 'complete', 'failed'],
        default: 'pending',
    }
});

module.exports = mongoose.model('Thesis', ThesisSchema);