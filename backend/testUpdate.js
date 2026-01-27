const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function testUpdate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Find a staff member
        const staff = await User.findOne({ role: 'staff' });
        if (!staff) {
            console.log('No staff found');
            return;
        }

        console.log('Before update:');
        console.log('  Staff ID:', staff._id);
        console.log('  Username:', staff.username);
        console.log('  staffDepartment:', staff.staffDepartment);

        // Update staffDepartment
        const result = await User.updateOne(
            { _id: staff._id },
            { $set: { staffDepartment: 'IT' } }
        );
        console.log('\nUpdate result:', result);

        // Fetch again
        const updated = await User.findById(staff._id);
        console.log('\nAfter update:');
        console.log('  staffDepartment:', updated.staffDepartment);

        await mongoose.disconnect();
        console.log('\nDisconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

testUpdate();
