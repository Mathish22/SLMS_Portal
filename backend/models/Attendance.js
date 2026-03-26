const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['Present', 'Absent', 'Leave'], required: true },
    remarks: { type: String, default: '' }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    department: { type: String, required: true },
    year: { type: String, required: true },
    section: { type: String, required: true },
    records: [attendanceRecordSchema],
    recordedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true });

// Compound index to ensure one attendance record per class per day
attendanceSchema.index({ date: 1, department: 1, year: 1, section: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
