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
    const user = await User.findById(req.user.userId, 'username role staffName staffId subjects advisingSections department year section rollNo regNo lastSeenResources lastSeenExams');
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update last seen for resources or exams
router.post('/seen-updates', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const { type } = req.body;
    const updateField = type === 'resources' ? 'lastSeenResources' : (type === 'exams' ? 'lastSeenExams' : null);
    
    if (!updateField) {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: { [updateField]: Date.now() } },
      { new: true, select: 'username role staffName staffId subjects advisingSections department year section rollNo regNo lastSeenResources lastSeenExams' }
    );
    
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
    const { staffName, username, password, subjects, advisingSections } = req.body;
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
      advisingSections: advisingSections || [],
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
    if (body.advisingSections !== undefined) {
      staff.advisingSections = body.advisingSections;
      staff.markModified('advisingSections');
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
        subjects: staff.subjects,
        advisingSections: staff.advisingSections
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

    const staff = await User.find(query, 'username staffName staffId staffDepartment subjects advisingSections role createdAt');
    console.log('FOUND STAFF COUNT:', staff.length);
    res.json(staff);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Create Student account
// Department Admin: Create Student account
router.post('/create-student', authMiddleware.isDepartmentAdmin, async (req, res) => {
  try {
    const { studentName, rollNo, regNo, year, section } = req.body;

    const username = regNo;
    const password = rollNo;

    // Check if username/regNo already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Registration Number (Username) already exists' });
    }

    // Check if roll number already exists
    if (rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(400).json({ error: 'Roll number already exists' });
      }
    }

    // Fetch creator to get department
    const creator = await User.findById(req.user.userId);
    const department = creator.staffDepartment;

    const student = new User({
      username,
      password,
      role: 'student',
      studentName: studentName || '',
      rollNo: rollNo || '',
      regNo: regNo || '',
      department: department || '',
      year: year || '',
      section: section || '',
      createdBy: req.user.userId
    });
    await student.save();
    res.status(201).json({
      message: 'Student account created successfully',
      user: {
        _id: student._id,
        username,
        studentName,
        rollNo,
        regNo,
        department,
        year,
        section
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Staff: Get all students with search
// Department Admin: Get all students
router.get('/students', authMiddleware.isDepartmentAdmin, async (req, res) => {
  try {
    const { search } = req.query;

    // Fetch creator to get department
    const creator = await User.findById(req.user.userId);
    const department = creator.staffDepartment;

    let query = {
      role: 'student',
      department: { $regex: new RegExp(department.trim(), 'i') }
    };

    // If search term provided, filter by multiple fields
    if (search) {
      query.$and = [
        {
          $or: [
            { studentName: { $regex: search, $options: 'i' } },
            { rollNo: { $regex: search, $options: 'i' } },
            { regNo: { $regex: search, $options: 'i' } },
            { year: { $regex: search, $options: 'i' } },
            { section: { $regex: search, $options: 'i' } }
          ]
        }
      ];
    }

    const students = await User.find(query, 'username role studentName rollNo regNo department year section createdAt')
      .sort({ year: 1, studentName: 1 });
    res.json(students);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Department Admin: Update student
router.put('/student/:id', authMiddleware.isDepartmentAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { studentName, rollNo, regNo, year, section } = req.body;

    const student = await User.findById(id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check Dept Admin ownership
    const creator = await User.findById(req.user.userId);
    if (student.department !== creator.staffDepartment) {
      return res.status(403).json({ error: 'You can only edit students in your department' });
    }

    // Update RegNo/Username
    if (regNo && regNo !== student.regNo) {
      const existingUser = await User.findOne({ username: regNo });
      if (existingUser) {
        return res.status(400).json({ error: 'Registration Number already exists' });
      }
      student.regNo = regNo;
      student.username = regNo; // Sync username
    }

    // Update RollNo/Password
    if (rollNo && rollNo !== student.rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(400).json({ error: 'Roll number already exists' });
      }
      student.rollNo = rollNo;
      student.password = rollNo; // Sync password (will be hashed by pre-save)
    }

    if (studentName !== undefined) student.studentName = studentName;
    if (year !== undefined) student.year = year;
    if (section !== undefined) student.section = section;

    await student.save();
    res.json({
      message: 'Student updated successfully',
      user: {
        _id: student._id,
        username: student.username,
        studentName: student.studentName,
        rollNo: student.rollNo,
        regNo: student.regNo,
        department: student.department,
        year: student.year,
        section: student.section
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

// Department Admin: Delete student
router.delete('/student/:id', authMiddleware.isDepartmentAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await User.findById(id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check Dept Admin ownership
    const creator = await User.findById(req.user.userId);
    if (student.department !== creator.staffDepartment) {
      return res.status(403).json({ error: 'You can only delete students in your department' });
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