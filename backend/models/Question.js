const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    examId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exam',
        required: true
    },
    questionText: { type: String, required: true },
    questionType: { type: String, enum: ['MCQ', 'Descriptive'], default: 'MCQ' },
    options: [{ type: String }], // Only required if questionType is MCQ
    correctAnswer: { type: String } // Only required if questionType is MCQ
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
