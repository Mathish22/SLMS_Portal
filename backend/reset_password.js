const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const username = process.argv[2];
const newPassword = process.argv[3];

if (!username || !newPassword) {
    console.log('Usage: node reset_password.js <username> <new_password>');
    process.exit(1);
}

const main = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/academia';
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ username });
        if (!user) {
            console.log(`User '${username}' not found.`);
            process.exit(1);
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        await user.save();
        console.log(`Password for '${username}' has been successfully reset.`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

main();
