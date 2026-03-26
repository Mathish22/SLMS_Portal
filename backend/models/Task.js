const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  department: { type: String, required: true },
  year: { type: String, required: true },
  dueDate: { type: Date, required: true },
  fileUrl: { type: String }, // Optional attachment by staff
  cloudinaryId: { type: String },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
