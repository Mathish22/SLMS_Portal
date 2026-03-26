const mongoose = require('mongoose');

const taskSubmissionSchema = new mongoose.Schema({
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileUrl: { type: String, required: true },
  cloudinaryId: { type: String }, // Optional if using local storage
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('TaskSubmission', taskSubmissionSchema);
