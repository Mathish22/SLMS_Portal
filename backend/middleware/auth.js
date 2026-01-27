const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = {
  // Verify token and set req.user
  verifyToken: (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      next();
    } catch (error) {
      res.status(400).json({ message: 'Invalid token' });
    }
  },

  // Check if authenticated
  isAuthenticated: (req, res, next) => {
    authMiddleware.verifyToken(req, res, () => {
      if (req.user) {
        next();
      } else {
        res.status(401).json({ message: 'Not authenticated' });
      }
    });
  },

  // Check if admin
  isAdmin: (req, res, next) => {
    authMiddleware.verifyToken(req, res, () => {
      if (req.user.role === 'admin') {
        next();
      } else {
        res.status(403).json({ message: 'Admin access required' });
      }
    });
  },

  // Check if staff
  isStaff: (req, res, next) => {
    authMiddleware.verifyToken(req, res, () => {
      if (req.user.role === 'staff') {
        next();
      } else {
        res.status(403).json({ message: 'Staff access required' });
      }
    });
  },

  // Check if staff or admin
  isStaffOrAdmin: (req, res, next) => {
    authMiddleware.verifyToken(req, res, () => {
      if (['staff', 'admin'].includes(req.user.role)) {
        next();
      } else {
        res.status(403).json({ message: 'Staff or admin access required' });
      }
    });
  },
};

module.exports = authMiddleware;