const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Validation middleware to check if Staff is advisor for this generic class
const isAdvisor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        if (user.role === 'admin' || user.role === 'department_admin') {
            return next(); // Admins and Dept Admins can theoretically post attendance too if needed, or bypass.
        }

        if (user.role !== 'staff') {
            return res.status(403).json({ error: 'Only staff can take attendance' });
        }

        const { year, section } = req.body.year ? req.body : req.query; // Check body for POST/PUT, query for GET

        // Safety check - if year/section aren't provided yet, let the route handle the validation error
        if (!year || !section) return next();

        const isAuthorized = user.advisingSections && user.advisingSections.some(
            s => s.year === year && s.section === section
        );

        if (!isAuthorized) {
            return res.status(403).json({ error: 'You are not the designated advisor for this class section' });
        }

        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error verifying advisor status' });
    }
};

// POST: Submit new attendance record for a specific day
router.post('/', authMiddleware.isAuthenticated, isAdvisor, async (req, res) => {
    try {
        const { date, department, year, section, records } = req.body;

        if (!date || !department || !year || !section || !records) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        // Check if attendance already exists for this date/dept/year/section
        const existing = await Attendance.findOne({
            department,
            year,
            section,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (existing) {
            return res.status(400).json({ error: 'Attendance for this class has already been recorded for this date. Please edit the existing record.' });
        }

        const newAttendance = new Attendance({
            date: startOfDay,
            department,
            year,
            section,
            records,
            recordedBy: req.user.userId
        });

        await newAttendance.save();
        res.status(201).json({ message: 'Attendance recorded successfully', attendance: newAttendance });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: 'Duplicate attendance record found for this date.' });
        }
        res.status(500).json({ error: error.message });
    }
});

// GET: Fetch attendance for a specific class on a specific date (or range)
router.get('/', authMiddleware.isAuthenticated, isAdvisor, async (req, res) => {
    try {
        const { department, year, section, date } = req.query;

        if (!department || !year || !section || !date) {
            return res.status(400).json({ error: 'Department, year, section, and date are required' });
        }

        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const attendance = await Attendance.findOne({
            department,
            year,
            section,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('records.studentId', 'studentName rollNo regNo');

        if (!attendance) {
            return res.status(404).json({ error: 'No attendance record found for this date.' });
        }

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT: Update an existing attendance record
router.put('/:id', authMiddleware.isAuthenticated, isAdvisor, async (req, res) => {
    try {
        const { records } = req.body;

        if (!records) {
            return res.status(400).json({ error: 'Records payload required for update' });
        }

        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({ error: 'Attendance record not found' });
        }

        // Double check Advisor permissions against the documented record just in case
        const user = await User.findById(req.user.userId);
        if (user.role === 'staff') {
            const hasAccess = user.advisingSections.some(s => s.year === attendance.year && s.section === attendance.section);
            if (!hasAccess) return res.status(403).json({ error: 'You are not the designated advisor' });
        }

        attendance.records = records;
        attendance.recordedBy = req.user.userId; // Optionally update who last modified it

        await attendance.save();
        res.json({ message: 'Attendance updated successfully', attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
