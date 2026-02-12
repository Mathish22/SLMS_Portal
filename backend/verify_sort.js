const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Load environment variables (adjust path if needed)
// Assuming .env is in the current directory or parent
// But here we are in backend/

const main = async () => {
    try {
        // Connect to MongoDB
        // We need the MONGO_URI from .env. 
        // Since I can't read .env directly easily (it might be hidden or I missed it), 
        // I will try to read it first or assume standard local URI if not found.
        // However, I previously listed .env file, so I can read it. 
        // Wait, I can just require('dotenv').config() as above.

        // A fallback URI just in case
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/academia';

        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        // Create some dummy data if needed, or just query existing
        // Let's query existing students

        // Mocking the query from auth.js
        // We need to find a department admin to simulate the query context if we were using the route,
        // but here we can just query all students and visually check.

        console.log('Fetching students sorted by year and studentName...');

        // Replicating the sort logic
        const students = await User.find({ role: 'student' })
            .sort({ year: 1, studentName: 1 })
            .select('studentName year department regNo');

        console.log('--- Sorted Students ---');
        students.forEach(s => {
            console.log(`Year: ${s.year}, Name: ${s.studentName}, Dept: ${s.department}, RegNo: ${s.regNo}`);
        });

        // Verification Logic (Simple check)
        let isSorted = true;
        for (let i = 0; i < students.length - 1; i++) {
            const current = students[i];
            const next = students[i + 1];

            // Check Year
            if (current.year > next.year) {
                isSorted = false;
                console.error(`Sort Error at index ${i}: Year ${current.year} > ${next.year}`);
                break;
            }

            // If Year is same, check Name
            if (current.year === next.year && current.studentName.localeCompare(next.studentName) > 0) {
                isSorted = false;
                console.error(`Sort Error at index ${i}: Name ${current.studentName} > ${next.studentName} for Year ${current.year}`);
                break;
            }
        }

        if (isSorted) {
            console.log('\nSUCCESS: Students are correctly sorted by Year and Name.');
        } else {
            console.log('\nFAILURE: Students are NOT correctly sorted.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

main();
