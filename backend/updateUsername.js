// Script to update a username in the database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const updateUsername = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Change these values:
        const oldUsername = 'Hemanth';      // Current username
        const newUsername = 'NewUsername';  // New username you want

        const result = await User.findOneAndUpdate(
            { username: oldUsername },
            { username: newUsername },
            { new: true }
        );

        if (result) {
            console.log('✅ Username updated successfully!');
            console.log(`   Old: ${oldUsername}`);
            console.log(`   New: ${result.username}`);
        } else {
            console.log('❌ User not found');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

updateUsername();
