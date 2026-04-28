const express = require('express');
const Task = require('../models/Task');
const TaskSubmission = require('../models/TaskSubmission');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const { upload, useCloudinary } = require('../config/upload');

const router = express.Router();

// Get tasks
// Students: Get tasks for their year and department
// Staff: Get tasks created by them
router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let query = {};

    if (user.role === 'student') {
      if (user.year) query.year = user.year;
      if (user.department) query.department = user.department;
    } else if (user.role === 'staff') {
      query.createdBy = req.user.userId;
    }

    const tasks = await Task.find(query)
      .populate('createdBy', 'staffName username')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new task (Staff only)
router.post(
  '/',
  authMiddleware.isAuthenticated,
  authMiddleware.isStaff,
  async (req, res) => {
    try {
      const { title, description, year, department: customDept, subjectCode, subjectName, dueDate } = req.body;

      const staffUser = await User.findById(req.user.userId);
      // Use customDept from subject if provided, else fallback to staff's default department
      const department = customDept || staffUser.department || staffUser.staffDepartment || 'Unknown';

      if (!title || !year || !dueDate) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const task = new Task({
        title,
        description,
        department,
        year,
        subjectCode,
        subjectName,
        dueDate,
        createdBy: req.user.userId
      });

      await task.save();
      res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get submissions for a task (Staff only)
router.get('/:id/submissions', authMiddleware.isAuthenticated, authMiddleware.isStaff, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only creator can view submissions OR department admin (assuming staff logic for now)
    if (task.createdBy.toString() !== req.user.userId && req.user.role !== 'department_admin') {
      return res.status(403).json({ error: 'Not authorized to view these submissions' });
    }

    const TaskSubmission = require('../models/TaskSubmission');
    const User = require('../models/User');

    const submissions = await TaskSubmission.find({ task: req.params.id })
      .populate('student', 'username studentName regNo rollNo department section year');

    const students = await User.find({
        role: 'student',
        department: task.department,
        year: String(task.year)
    }).select('username studentName regNo rollNo department section year');

    const allResults = [];

    for (const student of students) {
        const submission = submissions.find(s => s.student && s.student._id.toString() === student._id.toString());
        if (submission) {
            allResults.push({
                ...submission.toObject(),
                status: 'Completed'
            });
        } else {
            allResults.push({
                _id: `pending_${task._id}_${student._id}`,
                task: task.toObject(),
                student: student.toObject(),
                status: 'Pending',
                submittedAt: null,
                fileUrl: null
            });
        }
    }

    // Sort: completed first, then by submittedAt desc
    allResults.sort((a, b) => {
        if (a.status === 'Completed' && b.status === 'Pending') return -1;
        if (a.status === 'Pending' && b.status === 'Completed') return 1;
        if (a.status === 'Completed' && b.status === 'Completed') {
            return new Date(b.submittedAt) - new Date(a.submittedAt);
        }
        return 0;
    });

    res.json(allResults);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Submit a file for a task (Student only)
router.post(
  '/:id/submit',
  authMiddleware.isAuthenticated,
  upload.single('file'),
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can submit tasks' });
      }

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      } // Not checking strict due date here to allow late submissions, can be filtered in frontend

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      let fileUrl = null;
      let cloudinaryId = null;

      if (!useCloudinary) {
        fileUrl = `/uploads/${req.file.filename}`;
      } else {
        fileUrl = req.file.path;
      }
      cloudinaryId = req.file.filename;

      // Check if already submitted
      let submission = await TaskSubmission.findOne({ task: task._id, student: user._id });

      if (submission) {
        // Update existing submission
        submission.fileUrl = fileUrl;
        submission.cloudinaryId = cloudinaryId;
        submission.submittedAt = Date.now();
      } else {
        // Create new submission
        submission = new TaskSubmission({
          task: task._id,
          student: user._id,
          fileUrl,
          cloudinaryId
        });
      }

      await submission.save();
      res.status(200).json({ message: 'Task submitted successfully', submission });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get student's submission for a task
router.get('/:id/my-submission', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const submission = await TaskSubmission.findOne({ task: req.params.id, student: req.user.userId });
    if (!submission) {
      return res.status(404).json({ message: 'No submission found' });
    }
    res.json({ submission });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

module.exports = router;
