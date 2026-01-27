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
      { userId: user._id, role: user.role, staffDepartment: user.staffDepartment },
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

// Admin: Create Department Admin
router.post('/create-dept-admin', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { username, password, department } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const deptAdmin = new User({
      username,
      password,
      role: 'department_admin',
      staffDepartment: department, // Use staffDepartment for Dept Admin's department
      createdBy: req.user.userId
    });
    await deptAdmin.save();
    res.status(201).json({
      message: 'Department Admin created successfully',
      user: { _id: deptAdmin._id, username, role: 'department_admin', department }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Get all Department Admins
router.get('/dept-admins', authMiddleware.isAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'department_admin' }, 'username staffDepartment createdAt');
    res.json(admins);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin: Delete Department Admin
router.delete('/dept-admin/:id', authMiddleware.isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role !== 'department_admin') {
      return res.status(404).json({ error: 'Department Admin not found' });
    }

    await User.findByIdAndDelete(id);
    res.json({ message: 'Department Admin deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Department Admin: Create Staff account
router.post('/create-staff', authMiddleware.isDepartmentAdmin, async (req, res) => {
  try {
    const { staffName, username, password, subjects } = req.body;
    console.log('CREATE STAFF REQUEST:', req.body);
    console.log('Creator:', req.user.userId);

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Auto-generate Staff ID starting with 'ests'
    const lastStaff = await User.findOne({
      role: 'staff',
      staffId: { $regex: /^ests\d+$/i }
    }).sort({ staffId: -1 });

    let nextNumber = 1;
    if (lastStaff && lastStaff.staffId) {
      const match = lastStaff.staffId.match(/ests(\d+)/i);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const staffId = `ests${String(nextNumber).padStart(3, '0')}`;

    // Fetch creator to get department
    const creator = await User.findById(req.user.userId);
    const department = creator.staffDepartment;

    const staff = new User({
      staffName: staffName || '',
      staffId: staffId,
      username,
      password,
      role: 'staff',
      staffDepartment: department,
      subjects: subjects || [],
      createdBy: req.user.userId
    });
    await staff.save();
    res.status(201).json({
      message: 'Staff account created successfully',
      user: { _id: staff._id, staffName, staffId, username, role: 'staff', staffDepartment: department }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin & Dept Admin: Edit Staff (update staffId, staffName, staffDepartment, subjects)
router.put('/staff/:id', authMiddleware.isAdminOrDepartmentAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    console.log('=== Updating Staff ===');
    console.log('Staff ID:', id);
    console.log('Full Request Body:', body);

    // Find staff by ID
    const staff = await User.findOne({ _id: id, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // If Department Admin, check if staff belongs to their department
    if (req.user.role === 'department_admin') {
      const currentUser = await User.findById(req.user.userId);
      if (!currentUser.staffDepartment || currentUser.staffDepartment !== staff.staffDepartment) {
        return res.status(403).json({ error: 'You can only edit staff in your department' });
      }
      // Prevent changing department
      if (body.staffDepartment && body.staffDepartment !== staff.staffDepartment) {
        return res.status(403).json({ error: 'You cannot change the department of a staff member' });
      }
    }

    console.log('Before update - staffDepartment:', staff.staffDepartment);

    // Directly set each field
    if (body.staffName !== undefined) {
      staff.staffName = body.staffName;
    }
    if (body.staffId !== undefined) {
      staff.staffId = body.staffId;
    }
    if (body.staffDepartment !== undefined) {
      staff.staffDepartment = body.staffDepartment;
      staff.markModified('staffDepartment'); // Force Mongoose to recognize the change
    }
    if (body.subjects !== undefined) {
      staff.subjects = body.subjects;
      staff.markModified('subjects');
    }

    // Save with validation skipped for password
    await staff.save({ validateModifiedOnly: true });

    console.log('After update - staffDepartment:', staff.staffDepartment);

    res.json({
      message: 'Staff updated successfully',
      user: {
        _id: staff._id,
        username: staff.username,
        staffName: staff.staffName,
        staffId: staff.staffId,
        staffDepartment: staff.staffDepartment,
        subjects: staff.subjects
      }
    });
  } catch (error) {
    console.error('Error updating staff:', error);
    res.status(400).json({ error: error.message });
  }
});

// Admin & Dept Admin: Get all staff with search/filter by department and year
router.get('/staff', authMiddleware.isAdminOrDepartmentAdmin, async (req, res) => {
  try {
    const { search, department, year } = req.query;

    let query = { role: 'staff' };
    let andConditions = [];

    console.log('GET STAFF REQUEST user:', req.user);
    console.log('Department filter:', department);

    // If Department Admin, enforce their department
    if (req.user.role === 'department_admin') {
      const currentUser = await User.findById(req.user.userId);
      if (currentUser && currentUser.staffDepartment) {
        andConditions.push({
          staffDepartment: { $regex: new RegExp(currentUser.staffDepartment.trim(), 'i') }
        });
      }
    } else if (department) {
      // If Admin and department filter provided
      andConditions.push({
        $or: [
          { 'subjects.department': { $regex: department, $options: 'i' } },
          { 'staffDepartment': { $regex: department, $options: 'i' } }
        ]
      });
    }

    // Filter by year in subjects
    if (year) {
      andConditions.push({
        'subjects.year': { $regex: year, $options: 'i' }
      });
    }

    // General search term
    if (search) {
      andConditions.push({
        $or: [
          { 'subjects.subjectCode': { $regex: search, $options: 'i' } },
          { 'subjects.subjectName': { $regex: search, $options: 'i' } },
          { 'subjects.department': { $regex: search, $options: 'i' } },
          { 'staffName': { $regex: search, $options: 'i' } },
          { 'staffId': { $regex: search, $options: 'i' } },
          { 'staffDepartment': { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Combine conditions
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    console.log('FINAL STAFF QUERY:', JSON.stringify(query, null, 2));

    const staff = await User.find(query, 'username staffName staffId staffDepartment subjects role createdAt');
    console.log('FOUND STAFF COUNT:', staff.length);
    res.json(staff);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Create Student account
router.post('/create-student', authMiddleware.isStaff, async (req, res) => {
  try {
    const { username, password, regulation, studentName, rollNo, department, year } = req.body;

    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Check if roll number already exists
    if (rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(400).json({ error: 'Roll number already exists' });
      }
    }

    const student = new User({
      username,
      password,
      role: 'student',
      regulation: regulation || '',
      studentName: studentName || '',
      rollNo: rollNo || '',
      department: department || '',
      year: year || '',
      createdBy: req.user.userId
    });
    await student.save();
    res.status(201).json({
      message: 'Student account created successfully',
      user: {
        _id: student._id,
        username,
        role: 'student',
        regulation,
        studentName,
        rollNo,
        department,
        year
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Get all students with search
router.get('/students', authMiddleware.isStaff, async (req, res) => {
  try {
    const { search } = req.query;
    let query = { role: 'student' };

    // If search term provided, filter by multiple fields
    if (search) {
      query.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { year: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { regulation: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query, 'username role regulation studentName rollNo department year createdAt');
    res.json(students);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Update student
router.put('/student/:id', authMiddleware.isStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, regulation, studentName, rollNo, department, year } = req.body;

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if username already exists (if changing username)
    if (username && username !== student.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      student.username = username;
    }

    // Check if roll number already exists (if changing rollNo)
    if (rollNo && rollNo !== student.rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(400).json({ error: 'Roll number already exists' });
      }
      student.rollNo = rollNo;
    }

    if (regulation !== undefined) student.regulation = regulation;
    if (studentName !== undefined) student.studentName = studentName;
    if (department !== undefined) student.department = department;
    if (year !== undefined) student.year = year;

    await student.save();
    res.json({
      message: 'Student updated successfully',
      user: {
        _id: student._id,
        username: student.username,
        role: student.role,
        regulation: student.regulation,
        studentName: student.studentName,
        rollNo: student.rollNo,
        department: student.department,
        year: student.year
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Admin & Dept Admin: Delete staff
router.delete('/staff/:id', authMiddleware.isAdminOrDepartmentAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user || user.role !== 'staff') {
      return res.status(404).json({ error: 'Staff not found' });
    }

    // If Department Admin, check if staff belongs to their department
    if (req.user.role === 'department_admin') {
      const currentUser = await User.findById(req.user.userId);
      if (!currentUser.staffDepartment || currentUser.staffDepartment !== user.staffDepartment) {
        return res.status(403).json({ error: 'You can only delete staff in your department' });
      }
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