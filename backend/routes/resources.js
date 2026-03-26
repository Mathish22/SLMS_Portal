const express = require('express');
// cloudinary config removed, using config/upload.js
const Resource = require('../models/Resource');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');
const path = require('path');
const { URL } = require('url');

const router = express.Router();
const { upload, uploader, useCloudinary } = require('../config/upload');
const fs = require('fs');
// path already imported above

const logToFile = (msg) => {
  const logPath = path.join(__dirname, '../server_debug.log');
  fs.appendFileSync(logPath, new Date().toISOString() + ': ' + msg + '\n');
};

// Get all resources (filtered by regulation for students)
router.get('/', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    let query = {};

    // Students only see resources matching their regulation
    if (user.role === 'student' && user.regulation) {
      query.regulation = user.regulation;
    }

    const resources = await Resource.find(query).populate('uploadedBy', 'staffName username');
    res.json(resources);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Upload a resource (Staff only)
router.post(
  '/upload',
  authMiddleware.isAuthenticated,
  authMiddleware.isStaff,
  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        logToFile('Multer Upload Error: ' + JSON.stringify(err));
        return res.status(400).json({ error: err.message || 'Multer Error' });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      logToFile('--- Upload Request ---');
      logToFile('Body: ' + JSON.stringify(req.body));
      logToFile('File: ' + (req.file ? req.file.filename : 'No File'));

      const { title, year, subjectCode, examType, regulation } = req.body;

      // Detailed validation logging
      if (!title || !year || !subjectCode || !req.file) {
        const missing = [];
        if (!title) missing.push('title');
        if (!year) missing.push('year');
        if (!subjectCode) missing.push('subjectCode');
        if (!req.file) missing.push('file');
        logToFile('Upload Validation Failed. Missing: ' + missing.join(', '));
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }

      let filePath = req.file.path;
      // If local storage, convert absolute path to relative URL
      if (!useCloudinary) {
        filePath = `/uploads/${req.file.filename}`;
      }

      const resource = new Resource({
        title,
        year,
        subjectCode,
        examType: examType || 'General',
        regulation: regulation || '',
        filePath: filePath,
        cloudinaryId: req.file.filename,
        uploadedBy: req.user.userId
      });

      await resource.save();
      logToFile('Resource saved successfully. ID: ' + resource._id);

      res.status(201).json({
        message: 'Resource uploaded successfully',
        fileUrl: resource.filePath,
      });
    } catch (error) {
      logToFile('Upload Exception: ' + error.message);
      res.status(400).json({ error: error.message });
    }
  }
);

// Get a specific resource by ID
router.get('/:id', authMiddleware.isAuthenticated, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update a resource
router.put(
  '/:id',
  authMiddleware.isAuthenticated,
  authMiddleware.isStaffOrAdmin,
  upload.single('file'),
  async (req, res) => {
    try {
      const { title, year, subjectCode, examType } = req.body;
      const resource = await Resource.findById(req.params.id);
      if (!resource) return res.status(404).json({ error: 'Resource not found' });

      // Update text fields
      resource.title = title || resource.title;
      resource.year = year || resource.year;
      resource.subjectCode = subjectCode || resource.subjectCode;
      resource.examType = examType || resource.examType;

      // 🧼 Replace PDF if new file uploaded
      if (req.file) {
        // ✅ Delete old file from Cloudinary
        // ✅ Delete old file
        if (resource.cloudinaryId) {
          await uploader.destroy(resource.cloudinaryId);
        }

        // ✅ Save new file details
        let newFilePath = req.file.path;
        if (!useCloudinary) {
          newFilePath = `/uploads/${req.file.filename}`;
        }
        resource.filePath = newFilePath;
        resource.cloudinaryId = req.file.filename;
      }

      await resource.save();

      res.json({
        message: 'Resource updated successfully',
        fileUrl: resource.filePath,
      });
    } catch (error) {
      console.error('Edit error:', error.message);
      res.status(500).json({ error: 'Error while updating the resource' });
    }
  }
);


// Delete a resource

router.delete('/:id', authMiddleware.isAuthenticated, authMiddleware.isStaffOrAdmin, async (req, res) => {
  try {
    // Find the resource in MongoDB
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    // Check for "Staff" role ownership
    if (req.user.role === 'staff' && resource.uploadedBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete resources you uploaded' });
    }
    // Department admins and admins bypass this check
    // Let's assume Dept Admin can delete any resource (or at least filtering by dept is good but resources don't have dept field explicit, just subjectCode)
    // For now, allow Dept Admin to delete any resource as per current implied logic (or consistent with plan).
    // The plan said: "Department Admins and Admins can delete any resource".

    // Construct public_id using folder and saved filename (cloudinaryId)
    const publicId = resource.cloudinaryId;

    console.log('➡️ Deleting from Cloudinary:', publicId);

    // Delete file (using unified uploader)
    const result = await uploader.destroy(publicId);

    console.log('✅ Cloudinary response:', result);

    // Delete resource from MongoDB
    await resource.deleteOne();

    res.json({ message: 'Resource and file deleted successfully' });
  } catch (error) {
    console.error('❌ Deletion error:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
module.exports = router;