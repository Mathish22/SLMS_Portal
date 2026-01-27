const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    department: { type: String, required: true },
    year: { type: String, required: true }, // e.g., '1', '2', '3', '4'
    semester: { type: String }, // Optional, for semester-wise
    subjects: [{
        subjectCode: { type: String, required: true },
        subjectName: { type: String, required: true }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Ensure unique combination of department, year, and semester
subjectSchema.index({ department: 1, year: 1, semester: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
