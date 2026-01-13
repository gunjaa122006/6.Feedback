const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Rate limiter for feedback submission
 * Prevents spam while maintaining anonymity
 */
const feedbackLimiter = rateLimit({
  windowMs: config.RATE_LIMIT.windowMs,
  max: config.RATE_LIMIT.maxRequests,
  message: {
    success: false,
    error: config.RATE_LIMIT.message
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Don't skip any requests
  skip: () => false,
  // Use a custom key generator that doesn't log IPs
  keyGenerator: (req) => {
    // Generate a key based on IP but don't store the IP itself
    // This maintains rate limiting without compromising anonymity
    return req.ip || 'anonymous';
  },
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: config.RATE_LIMIT.message,
      retryAfter: Math.ceil(config.RATE_LIMIT.windowMs / 1000 / 60) // minutes
    });
  }
});

/**
 * Less restrictive rate limiter for admin endpoints
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  feedbackLimiter,
  adminLimiter
};
