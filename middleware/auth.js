const config = require('../config');

/**
 * Simple token-based authentication for admin endpoints
 * In production, use proper authentication system
 */
function authenticateAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  if (token !== config.ADMIN.ACCESS_TOKEN) {
    return res.status(403).json({
      success: false,
      error: 'Invalid authentication token'
    });
  }

  next();
}

module.exports = { authenticateAdmin };
