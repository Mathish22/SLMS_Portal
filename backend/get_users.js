require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/academia')
    .then(async () => {
        const admins = await User.find({ role: { $in: ['admin', 'department_admin', 'staff'] } }).select('username password role staffName staffDepartment');
        console.log(JSON.stringify(admins, null, 2));
        process.exit(0);
    });
