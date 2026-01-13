module.exports = {
  // Server configuration
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database configuration
  DB_PATH: './feedback.db',
  
  // Rate limiting configuration
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // Limit each IP to 5 submissions per window
    message: 'Too many submissions from this location. Please try again later.'
  },
  
  // Feedback content constraints
  FEEDBACK: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
    CATEGORIES: ['general', 'suggestion', 'complaint', 'praise', 'other']
  },
  
  // Admin configuration
  ADMIN: {
    // Token loaded from environment variable
    ACCESS_TOKEN: process.env.ADMIN_TOKEN,
    ITEMS_PER_PAGE: 50
  },
  
  // Security headers
  SECURITY: {
    // Disable all tracking headers
    disablePoweredBy: true,
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'none'"],
        frameSrc: ["'none'"]
      }
    }
  }
};
