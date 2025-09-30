const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../routes/config');

const authenticateUser = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token, authorization denied' });
    }

    // Verify token with clock tolerance
    const decoded = jwt.verify(token, config.jwt.secret, {
      clockTolerance: 60 // 1 minute tolerance for clock skew
    });

    // Check if user still exists
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Handle specific JWT timing errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({ 
        success: false, 
        error: 'Token not active yet. Please try again.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }
    
    res.status(401).json({ success: false, error: 'Token is not valid' });
  }
};

const authorizeRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};