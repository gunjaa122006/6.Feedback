const express = require('express');
const router = express.Router();
const { validateFeedbackInput } = require('../middleware/validation');
const { feedbackLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');

module.exports = (db) => {
  /**
   * POST /api/feedback
   * Submit anonymous feedback
   * 
   * Body:
   * - content: string (required)
   * - category: string (required)
   */
  router.post('/feedback', feedbackLimiter, async (req, res, next) => {
    try {
      const { content, category } = req.body;

      // Validate input
      const validation = validateFeedbackInput(content, category);
      
      if (!validation.valid) {
        throw new AppError(validation.error, 400);
      }

      // Store feedback in database
      const result = await db.submitFeedback(
        validation.sanitizedContent,
        validation.category
      );

      // Success response
      res.status(201).json({
        success: true,
        message: 'Your feedback has been submitted anonymously',
        data: {
          id: result.id,
          timestamp: result.timestamp,
          // Reinforce anonymity guarantee
          anonymityGuarantee: 'No identifying information was collected or stored'
        }
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/feedback/info
   * Get information about the feedback system (public endpoint)
   */
  router.get('/feedback/info', (req, res) => {
    res.json({
      success: true,
      data: {
        anonymityGuarantees: [
          'No authentication required',
          'No IP addresses logged',
          'No browser fingerprinting',
          'No cookies or tracking',
          'Content is sanitized for security'
        ],
        constraints: {
          minLength: 10,
          maxLength: 2000,
          rateLimit: '5 submissions per 15 minutes'
        },
        categories: ['general', 'suggestion', 'complaint', 'praise', 'other']
      }
    });
  });

  return router;
};
