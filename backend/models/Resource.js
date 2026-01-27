const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  year: { type: Number, required: true },
  subjectCode: { type: String, required: true },
  examType: { type: String, required: true },
  regulation: { type: String, default: '' },
  filePath: { type: String, required: true },
  cloudinaryId: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resource', resourceSchema);