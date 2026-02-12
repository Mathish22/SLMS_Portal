const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'department_admin', 'staff', 'student'],
    default: 'student',
  },
  // Staff-specific fields
  staffName: { type: String, default: '' },
  staffId: { type: String, default: '' },
  staffDepartment: { type: String, default: '' },
  subjects: [{
    subjectCode: { type: String },
    subjectName: { type: String },
    year: { type: String },
    department: { type: String },
    section: { type: String }
  }],
  // Student-specific fields
  regulation: { type: String, default: '' },
  studentName: { type: String, default: '' },
  rollNo: { type: String, default: '' },
  regNo: { type: String, default: '' },
  department: { type: String, default: '' },
  year: { type: String, default: '' },
  section: { type: String, default: '' },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
}, { timestamps: true });

// Hash the password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);