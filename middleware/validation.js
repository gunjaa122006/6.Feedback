const validator = require('validator');
const config = require('../config');

/**
 * Sanitize and validate feedback content
 */
function sanitizeFeedback(content) {
  if (!content || typeof content !== 'string') {
    return { valid: false, error: 'Content is required' };
  }

  // Trim whitespace
  const sanitized = validator.trim(content);

  // Check length constraints
  if (sanitized.length < config.FEEDBACK.MIN_LENGTH) {
    return { 
      valid: false, 
      error: `Feedback must be at least ${config.FEEDBACK.MIN_LENGTH} characters` 
    };
  }

  if (sanitized.length > config.FEEDBACK.MAX_LENGTH) {
    return { 
      valid: false, 
      error: `Feedback must not exceed ${config.FEEDBACK.MAX_LENGTH} characters` 
    };
  }

  // Escape HTML to prevent XSS
  const escaped = validator.escape(sanitized);

  return { valid: true, sanitized: escaped };
}

/**
 * Validate category
 */
function validateCategory(category) {
  if (!category || typeof category !== 'string') {
    return { valid: false, error: 'Category is required' };
  }

  const normalized = category.toLowerCase().trim();

  if (!config.FEEDBACK.CATEGORIES.includes(normalized)) {
    return { 
      valid: false, 
      error: `Invalid category. Must be one of: ${config.FEEDBACK.CATEGORIES.join(', ')}` 
    };
  }

  return { valid: true, category: normalized };
}

/**
 * Basic profanity detection (placeholder - can be extended)
 */
function checkProfanity(content) {
  // This is a basic implementation - in production, use a proper profanity filter library
  const profanityPatterns = [
    /\b(f[u\*]+ck|sh[i\*]+t|d[a\*]+mn|b[i\*]+tch|a[s\*]+shole)\b/gi
  ];

  let hasProfanity = false;
  let cleanedContent = content;

  profanityPatterns.forEach(pattern => {
    if (pattern.test(cleanedContent)) {
      hasProfanity = true;
      cleanedContent = cleanedContent.replace(pattern, '[filtered]');
    }
  });

  return { hasProfanity, cleanedContent };
}

/**
 * Detect spam patterns
 */
function detectSpam(content) {
  // Check for repeated characters
  const repeatedChars = /(.)\1{10,}/g;
  if (repeatedChars.test(content)) {
    return { isSpam: true, reason: 'Excessive repeated characters' };
  }

  // Check for excessive capitalization
  const upperCaseRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (upperCaseRatio > 0.7 && content.length > 50) {
    return { isSpam: true, reason: 'Excessive capitalization' };
  }

  // Check for URLs (optional - uncomment if you want to block URLs)
  // const urlPattern = /(https?:\/\/[^\s]+)/g;
  // if (urlPattern.test(content)) {
  //   return { isSpam: true, reason: 'URLs not allowed' };
  // }

  return { isSpam: false };
}

/**
 * Comprehensive input validation
 */
function validateFeedbackInput(content, category) {
  // Validate content
  const contentValidation = sanitizeFeedback(content);
  if (!contentValidation.valid) {
    return { valid: false, error: contentValidation.error };
  }

  // Validate category
  const categoryValidation = validateCategory(category);
  if (!categoryValidation.valid) {
    return { valid: false, error: categoryValidation.error };
  }

  // Check for spam
  const spamCheck = detectSpam(contentValidation.sanitized);
  if (spamCheck.isSpam) {
    return { valid: false, error: `Spam detected: ${spamCheck.reason}` };
  }

  // Check profanity (and filter if found)
  const profanityCheck = checkProfanity(contentValidation.sanitized);

  return {
    valid: true,
    sanitizedContent: profanityCheck.cleanedContent,
    category: categoryValidation.category,
    hasProfanity: profanityCheck.hasProfanity
  };
}

module.exports = {
  validateFeedbackInput,
  sanitizeFeedback,
  validateCategory,
  checkProfanity,
  detectSpam
};
