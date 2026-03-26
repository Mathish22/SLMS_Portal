const mongoose = require('mongoose');
require('dotenv').config();

async function seedExam() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/academia');
        const Exam = require('./models/Exam');
        const Question = require('./models/Question');
        const User = require('./models/User');

        const staff = await User.findOne({ role: 'admin' });

        console.log("=== Seeding Exam ===");

        const newExam = new Exam({
            title: 'Test Final Exam ' + Date.now(),
            description: 'Automated test exam seeded directly',
            department: 'CSE',
            year: 'IV',
            durationMinutes: 30,
            startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // started yesterday
            endTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),  // ends tomorrow
            sebRequired: true,
            createdBy: staff._id
        });

        await newExam.save();
        console.log("✅ Created Exam with ID:", newExam._id);

        const q1 = new Question({
            examId: newExam._id,
            questionText: 'What is 2 + 2?',
            options: ['3', '4', '5', '6'],
            correctAnswer: '4'
        });

        const q2 = new Question({
            examId: newExam._id,
            questionText: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctAnswer: 'Paris'
        });

        await q1.save();
        await q2.save();
        console.log("✅ Added 2 questions to the exam");

        process.exit(0);
    } catch (err) {
        console.error("❌ Test failed:", err);
        process.exit(1);
    }
}

seedExam();
