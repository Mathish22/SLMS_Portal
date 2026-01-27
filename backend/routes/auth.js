const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({ token, role: user.role, username: user.username });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user info
router.get('/me', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, 'username role staffName staffId subjects');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Create Staff account
router.post('/create-staff', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { staffName, username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const staff = new User({
      staffName: staffName || '',
      username,
      password,
      role: 'staff',
      subjects: [],
      createdBy: req.user.userId
    });
    await staff.save();
    res.status(201).json({
      message: 'Staff account created successfully',
      user: { _id: staff._id, staffName, username, role: 'staff' }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Edit Staff (update staffId, staffName, subjects)
router.put('/staff/:id', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { staffName, staffId, subjects } = req.body;

    const staff = await User.findById(id);
    if (!staff || staff.role !== 'staff') {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // Update fields if provided
    if (staffName !== undefined) staff.staffName = staffName;
    if (staffId !== undefined) staff.staffId = staffId;
    if (subjects !== undefined) staff.subjects = subjects;

    await staff.save();
    res.json({
      message: 'Staff updated successfully',
      user: {
        _id: staff._id,
        username: staff.username,
        staffName: staff.staffName,
        staffId: staff.staffId,
        subjects: staff.subjects
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Get all staff with search/filter
router.get('/staff', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { search } = req.query;

    let query = { role: 'staff' };

    // If search term provided, filter by subject code or name
    if (search) {
      query.$or = [
        { 'subjects.subjectCode': { $regex: search, $options: 'i' } },
        { 'subjects.subjectName': { $regex: search, $options: 'i' } },
        { 'staffName': { $regex: search, $options: 'i' } },
        { 'staffId': { $regex: search, $options: 'i' } }
      ];
    }

    const staff = await User.find(query, 'username staffName staffId subjects role createdAt');
    res.json(staff);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Create Student account
router.post('/create-student', authMiddleware.isStaff, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const student = new User({
      username,
      password,
      role: 'student',
      createdBy: req.user.userId
    });
    await student.save();
    res.status(201).json({ message: 'Student account created successfully', user: { username, role: 'student' } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Get all students
router.get('/students', authMiddleware.isStaff, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }, 'username role createdAt');
    res.json(students);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Delete staff
router.delete('/staff/:id', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role !== 'staff') {
      return res.status(404).json({ error: 'Staff not found' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Staff deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Delete student
router.delete('/student/:id', authMiddleware.isStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Get all users
router.get('/users', authMiddleware.isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, 'username role staffName staffId subjects createdAt');
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;