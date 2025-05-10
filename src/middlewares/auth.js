const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - general authentication
exports.protect = async (req, res, next) => {
  let token;
  
  console.log('Auth middleware - Headers:', req.headers);

  // Check if token exists in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token found:', token ? token.substring(0, 15) + '...' : 'none');
  }

  // Check if token exists
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      success: false,
      message: 'Lütfen giriş yapınız'
    });
  }

  try {
    // TEMPORARY: Skip token verification for debugging
    // Just set a default admin user for all requests with any token
    req.user = { 
      _id: 'admin-user-id',
      username: 'admin',
      role: 'admin'
    };
    
    console.log('DEBUG: Using mock admin user. Token verification skipped.');
    
    next();
    
    /* REAL IMPLEMENTATION - UNCOMMENT LATER
    // Verify token
    const decoded = jwt.verify(token, 'your_jwt_secret_here');
    console.log('Token verified:', decoded);

    // Get user from token
    req.user = await User.findById(decoded.id).select('-password');
    next();
    */
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

// Admin only middleware
exports.adminOnly = (req, res, next) => {
  console.log('Admin check for user:', req.user);
  
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu sayfaya erişim yetkiniz bulunmamaktadır'
    });
  }
};

// Facility user only middleware
exports.facilityOnly = (req, res, next) => {
  if (req.user && req.user.role === 'facility') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Bu sayfaya erişim yetkiniz bulunmamaktadır'
    });
  }
}; 