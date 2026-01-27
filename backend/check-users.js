// Script to check all registered users in the database
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('Connected to MongoDB');
        console.log('\n=== Registered Users ===\n');

        const users = await User.find({}, 'username role createdAt');

        if (users.length === 0) {
            console.log('No users found in the database.');
        } else {
            users.forEach((user, index) => {
                console.log(`${index + 1}. Username: ${user.username}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Created: ${user.createdAt || 'N/A'}`);
                console.log('');
            });
            console.log(`Total users: ${users.length}`);
        }

        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Error:', err.message);
        process.exit(1);
    });
