const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const fixPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ username: 'Mathish@22' });

        if (user) {
            console.log("Current stored hash:", user.password);

            // Generate a fresh hash bypassing the mongoose hook just in case it's broken
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Aswath@123', salt);

            console.log("Newly generated hash:", hashedPassword);

            // Save it using updateOne to bypass the pre-save hook
            await User.updateOne({ username: 'Mathish@22' }, { $set: { password: hashedPassword } });
            console.log("Password manually forced to Aswath@123");

            // test if it works now
            const updatedUser = await User.findOne({ username: 'Mathish@22' });
            const isMatch = await bcrypt.compare('Aswath@123', updatedUser.password);
            console.log("Does it match after manual force?", isMatch);
        }
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}

fixPassword();
