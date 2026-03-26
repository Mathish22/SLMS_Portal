const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    score: { type: Number, required: true, default: 0 },
    maxScore: { type: Number, required: true, default: 0 },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedOption: { type: String, required: true },
        isCorrect: { type: Boolean } // Optional for Descriptive questions
    }],
    notepadContent: { type: String }, // For Notepad exams
    submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Prevent multiple submissions for the same exam
examAttemptSchema.index({ studentId: 1, examId: 1 }, { unique: true });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
