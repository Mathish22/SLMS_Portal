const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    department: { type: String, required: true },
    year: { type: String, required: true }, // e.g., '1', '2', '3', '4'
    durationMinutes: { type: Number, required: true },
    startTime: { type: Date, required: true }, // When students can start
    endTime: { type: Date, required: true },   // When the exam closes
    sebRequired: { type: Boolean, default: true },
    examType: { type: String, enum: ['MCQ', 'Notepad', 'Mixed'], default: 'MCQ' },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
