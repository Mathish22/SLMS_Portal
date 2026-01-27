const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Declare subjects (Dept Admin only)
router.post('/', authMiddleware.isDepartmentAdmin, async (req, res) => {
    try {
        const { year, semester, subjects } = req.body;

        // department inferred from user
        const currentUser = await User.findById(req.user.userId);
        if (!currentUser || !currentUser.staffDepartment) {
            return res.status(400).json({ error: 'Department Admin has no department assigned' });
        }
        const department = currentUser.staffDepartment;

        // Upsert: Create or Update based on dept/year/sem
        const filter = { department, year, semester };
        // If subjects is just an array of strings, map to object. If it's already objects with code/name, use as is.
        // Assuming body.subjects is array of { subjectCode, subjectName } from frontend.
        const update = { subjects, createdBy: req.user.userId };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const subjectDoc = await Subject.findOneAndUpdate(filter, update, options);
        res.json({ message: 'Subjects declared successfully', data: subjectDoc });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get subjects
router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
    try {
        const { department, year, semester } = req.query;
        let query = {};
        if (department) query.department = department;
        if (year) query.year = year;
        if (semester) query.semester = semester;

        const subjects = await Subject.find(query);
        res.json(subjects);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
