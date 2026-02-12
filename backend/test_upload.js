const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs');
require('dotenv').config();

async function generateToken() {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/academia';
        await mongoose.connect(mongoURI);

        const User = require('./models/User');
        const staff = await User.findOne({ role: 'staff' });

        if (!staff) {
            console.error('No staff user found.');
            process.exit(1);
        }

        const jwtSecret = process.env.JWT_SECRET || 'secret_key';
        const token = jwt.sign(
            { userId: staff._id, role: staff.role, staffDepartment: staff.staffDepartment },
            jwtSecret,
            { expiresIn: '1h' }
        );

        console.log('TOKEN:', token);
        fs.writeFileSync('token.txt', token);
        console.log('Token written to token.txt');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

generateToken();
