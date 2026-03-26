// Script to seed the default admin account
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: 'Mathish@22' });

        if (existingAdmin) {
            console.log('Admin account already exists. Updating password...');
            existingAdmin.password = 'Aswath@123';
            await existingAdmin.save();
            console.log('Admin password successfully updated to Aswath@123');
        } else {
            // Create admin account
            const admin = new User({
                username: 'Mathish@22',
                password: 'Aswath@123',
                role: 'admin',
                createdBy: null
            });
            await admin.save();
            console.log('Admin account created successfully!');
            console.log('Username: Mathish@22');
            console.log('Password: Aswath@123');
        }

        // Optionally clear old test users (keep only admin)
        const deletedCount = await User.deleteMany({
            role: { $in: ['user', 'faculty'] }
        });
        if (deletedCount.deletedCount > 0) {
            console.log(`Cleaned up ${deletedCount.deletedCount} old user(s) with legacy roles`);
        }

        mongoose.connection.close();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
