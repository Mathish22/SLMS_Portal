const express = require('express');
const router = express.Router();
const Exam = require('../models/Exam');
const Question = require('../models/Question');
const ExamAttempt = require('../models/ExamAttempt');
const { verifyToken, isStaffOrAdmin } = require('../middleware/auth');
const sebCheck = require('../middleware/sebCheck');

// ---------------------------------------------------
// STAFF ROUTES
// ---------------------------------------------------

// Staff: Create a new exam
router.post('/', verifyToken, isStaffOrAdmin, async (req, res) => {
    try {
        let { title, description, department, year, durationMinutes, startTime, endTime, sebRequired } = req.body;

        const User = require('../models/User');
        const user = await User.findById(req.user.userId);
        
        if (user.role === 'staff') {
            department = user.staffDepartment;
        } else if (user.role === 'department_admin') {
            department = user.department;
        }

        if (!department) {
             return res.status(400).json({ error: 'Department is required for this exam' });
        }

        const newExam = new Exam({
            title,
            description,
            department,
            year,
            durationMinutes,
            startTime,
            endTime,
            sebRequired: sebRequired !== undefined ? sebRequired : true,
            examType: 'Mixed', // Force mixed exam type
            createdBy: req.user.userId
        });

        await newExam.save();
        res.status(201).json(newExam);
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: 'Failed to create exam' });
    }
});

// Staff: Add a question to an exam
router.post('/:id/questions', verifyToken, isStaffOrAdmin, async (req, res) => {
    try {
        const examId = req.params.id;
        const { questionText, questionType, options, correctAnswer } = req.body;

        // Verify exam belongs to user (optional but good practice)
        const exam = await Exam.findById(examId);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        if (exam.createdBy.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized to add questions to this exam' });
        }

        // Check if the exam has started or has attempts
        if (new Date() >= new Date(exam.startTime)) {
            return res.status(400).json({ error: 'Cannot add questions: The exam start time has already passed.' });
        }
        const existingAttempt = await ExamAttempt.findOne({ examId });
        if (existingAttempt) {
            return res.status(400).json({ error: 'Cannot add questions: Students have already attended this exam.' });
        }

        const newQuestion = new Question({
            examId,
            questionText,
            questionType: questionType || 'MCQ',
            options,
            correctAnswer
        });

        await newQuestion.save();
        res.status(201).json(newQuestion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to add question' });
    }
});

// Staff: Delete a question
router.delete('/questions/:questionId', verifyToken, isStaffOrAdmin, async (req, res) => {
    try {
        const question = await Question.findById(req.params.questionId);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        // Check if the exam has started
        const exam = await Exam.findById(question.examId);
        if (exam && new Date() >= new Date(exam.startTime)) {
            return res.status(400).json({ error: 'Cannot delete questions: The exam start time has already passed.' });
        }

        // Check if any student has already attempted this exam
        const existingAttempt = await ExamAttempt.findOne({ examId: question.examId });
        if (existingAttempt) {
            return res.status(400).json({ error: 'Cannot delete questions: Students have already attended this exam.' });
        }

        await Question.findByIdAndDelete(req.params.questionId);
        res.json({ message: 'Question deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// ---------------------------------------------------
// SHARED ROUTES (Staff + Student)
// ---------------------------------------------------

// Get all exams (Staff sees all they created, Student sees exams for their dept/year)
router.get('/', verifyToken, async (req, res) => {
    try {
        let query = {};

        if (req.user.role === 'staff') {
            query.createdBy = req.user.userId;
        } else if (req.user.role === 'student') {
            // Need the student's department and year to filter correctly. 
            // If they aren't in req.user, we might need to fetch the User doc.
            // For now, let's just return all or rely on frontend filtering, 
            // but ideally we'd fetch the user's dept/year here.
            // Let's assume frontend passes them as query params for now, 
            // or we fetch the user object.
            const User = require('../models/User');
            const student = await User.findById(req.user.userId);
            if (student) {
                query = { department: student.department, year: student.year };
            }
        }

        const exams = await Exam.find(query)
            .sort({ startTime: -1 })
            .populate('createdBy', 'staffName username');
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exams' });
    }
});

// Get all attempts for a staff's exams
router.get('/attempts', verifyToken, isStaffOrAdmin, async (req, res) => {
    try {
        let examsQuery = {};

        if (req.user.role === 'staff') {
            examsQuery.createdBy = req.user.userId;
        } else if (req.user.role === 'department_admin') {
            const User = require('../models/User');
            const user = await User.findById(req.user.userId);
            examsQuery.department = user.department;
        }

        // Find all exams that belong to this staff/dept admin
        const exams = await Exam.find(examsQuery).select('_id title examType');
        const examIds = exams.map(e => e._id);

        if (examIds.length === 0) {
            return res.json([]);
        }

        // Find all attempts for these exams
        const attempts = await ExamAttempt.find({ examId: { $in: examIds } })
            .populate('studentId', 'studentName rollNo username department')
            .populate('examId', 'title examType')
            .populate({
                path: 'answers.questionId',
                select: 'questionText options correctAnswer'
            })
            .sort({ submittedAt: -1 });

        res.json(attempts);
    } catch (error) {
        console.error('Error fetching attempts:', error);
        res.status(500).json({ error: 'Failed to fetch student attempts' });
    }
});

// Get single exam metadata
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const exam = await Exam.findById(req.params.id).lean();
        if (!exam) return res.status(404).json({ error: 'Exam not found' });
        
        const hasAttempts = await ExamAttempt.findOne({ examId: req.params.id }) !== null;
        const hasStarted = new Date() >= new Date(exam.startTime);
        
        exam.hasAttempts = hasAttempts;
        exam.isLocked = hasAttempts || hasStarted;

        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch exam details' });
    }
});

// ---------------------------------------------------
// STUDENT ROUTES
// ---------------------------------------------------

// Helper middleware to conditionally apply sebCheck based on Exam DB setting
const conditionalSebCheck = async (req, res, next) => {
    try {
        const exam = await Exam.findById(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Pass exam down to next middleware via req.exam if needed
        req.exam = exam;

        if (exam.sebRequired) {
            return sebCheck(req, res, next);
        }
        next();
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Student: Fetch questions for active exam (SEB enforced if required)
// NOTE: We strip correct answers so students can't cheat by looking at payload
router.get('/:id/questions', verifyToken, conditionalSebCheck, async (req, res) => {
    try {
        const exam = req.exam;
        const now = new Date();

        // Check time constraints for students
        if (req.user.role === 'student') {
            if (now < exam.startTime || now > exam.endTime) {
                return res.status(403).json({ error: 'Exam is not currently active' });
            }
        }

        // Fetch questions
        const questions = await Question.find({ examId: exam._id });

        // Strip correct answers if user is not staff/admin
        if (req.user.role === 'student') {
            const sanitizedQuestions = questions.map(q => ({
                _id: q._id,
                examId: q.examId,
                questionText: q.questionText,
                questionType: q.questionType,
                options: q.options
            }));

            // Shuffle questions (Fisher-Yates algorithm)
            for (let i = sanitizedQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [sanitizedQuestions[i], sanitizedQuestions[j]] = [sanitizedQuestions[j], sanitizedQuestions[i]];
            }

            return res.json(sanitizedQuestions);
        }

        res.json(questions); // Staff gets full payload
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// Student: Submit exam answers (SEB enforced if required)
router.post('/:id/submit', verifyToken, conditionalSebCheck, async (req, res) => {
    try {
        const exam = req.exam;
        const studentId = req.user.userId;
        const { answers, notepadContent } = req.body; // Array of { questionId, selectedOption } or string

        // Check time constraints (allow a slight 1-2 min buffer for submission latency)
        const now = new Date();
        const bufferEndTime = new Date(exam.endTime.getTime() + 2 * 60000);
        if (now > bufferEndTime) {
            return res.status(403).json({ error: 'Exam submission time has expired.' });
        }

        // Check for existing attempt
        const existingAttempt = await ExamAttempt.findOne({ studentId, examId: exam._id });
        if (existingAttempt) {
            return res.status(400).json({ error: 'You have already submitted this exam.' });
        }

        let score = 0;
        let maxScore = 0;
        const processedAnswers = [];

        // Unified Grading: fetch all questions
        const questions = await Question.find({ examId: exam._id });
        maxScore = questions.length;

        if (answers && Array.isArray(answers)) {
            for (const answer of answers) {
                const question = questions.find(q => q._id.toString() === answer.questionId);
                if (question) {
                    let isCorrect = null;

                    // Only grade MCQ automatically
                    if (question.questionType === 'MCQ') {
                        isCorrect = (question.correctAnswer === answer.selectedOption);
                        if (isCorrect) score++;
                    }

                    processedAnswers.push({
                        questionId: question._id,
                        selectedOption: answer.selectedOption,
                        isCorrect
                    });
                }
            }
        }

        const newAttempt = new ExamAttempt({
            studentId,
            examId: exam._id,
            score,
            maxScore,
            answers: processedAnswers || []
        });

        await newAttempt.save();
        res.status(201).json({ message: 'Exam submitted successfully', score, maxScore });

    } catch (error) {
        console.error('Submission error:', error);
        res.status(500).json({ error: 'Failed to submit exam' });
    }
});

// Student: Get submission results (allow viewing score after)
router.get('/:id/results', verifyToken, async (req, res) => {
    try {
        const attempt = await ExamAttempt.findOne({ studentId: req.user.userId, examId: req.params.id })
            .populate('examId');

        if (!attempt) return res.status(404).json({ error: 'No attempt found' });

        res.json({
            score: attempt.score,
            maxScore: attempt.maxScore,
            submittedAt: attempt.submittedAt
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

module.exports = router;
