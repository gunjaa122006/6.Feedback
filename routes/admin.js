const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');
const { AppError } = require('../middleware/errorHandler');

module.exports = (db) => {
  // All admin routes require authentication
  router.use(authenticateAdmin);
  router.use(adminLimiter);

  /**
   * GET /api/admin/feedback
   * Get all feedback submissions
   * 
   * Query params:
   * - limit: number (default: 50)
   * - offset: number (default: 0)
   */
  router.get('/feedback', async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      // Validate pagination parameters
      if (limit < 1 || limit > 200) {
        throw new AppError('Limit must be between 1 and 200', 400);
      }

      if (offset < 0) {
        throw new AppError('Offset must be non-negative', 400);
      }

      const feedback = await db.getAllFeedback(limit, offset);
      const total = await db.getFeedbackCount();

      res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total
          }
        }
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * GET /api/admin/statistics
   * Get feedback statistics
   */
  router.get('/statistics', async (req, res, next) => {
    try {
      const stats = await db.getStatistics();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * PATCH /api/admin/feedback/:id/read
   * Mark feedback as read
   */
  router.patch('/feedback/:id/read', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id) || id < 1) {
        throw new AppError('Invalid feedback ID', 400);
      }

      const result = await db.markAsRead(id);

      if (result.changes === 0) {
        throw new AppError('Feedback not found', 404);
      }

      res.json({
        success: true,
        message: 'Feedback marked as read'
      });

    } catch (error) {
      next(error);
    }
  });

  /**
   * DELETE /api/admin/feedback/:id
   * Delete feedback (for moderation purposes)
   */
  router.delete('/feedback/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id) || id < 1) {
        throw new AppError('Invalid feedback ID', 400);
      }

      const result = await db.deleteFeedback(id);

      if (result.changes === 0) {
        throw new AppError('Feedback not found', 404);
      }

      res.json({
        success: true,
        message: 'Feedback deleted'
      });

    } catch (error) {
      next(error);
    }
  });

  return router;
};
