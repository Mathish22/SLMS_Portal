require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const examsRoutes = require('./routes/exams');

const app = express();

// Middleware: Enable CORS for frontend (update origin as needed)
app.use(cors({
  origin: ['http://localhost:5173', 'https://academia-1-c0bl.onrender.com'], // Local dev + deployed frontend
  credentials: true,
}));

app.use(express.json());

// Serve static files (for uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/exams', examsRoutes);
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/tasks', require('./routes/tasks'));

// Serve frontend (React build) if exists in 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// For any route not handled, return frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
