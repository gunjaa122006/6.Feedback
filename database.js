const sqlite3 = require('sqlite3').verbose();
const config = require('./config');

class FeedbackDatabase {
  constructor() {
    this.db = new sqlite3.Database(config.DB_PATH);
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Create feedback table with minimal data collection
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        char_count INTEGER NOT NULL,
        status TEXT DEFAULT 'unread'
      )
    `;
    
    this.db.serialize(() => {
      this.db.run(createTableSQL);
      this.db.run('CREATE INDEX IF NOT EXISTS idx_created_at ON feedback(created_at DESC)');
      this.db.run('CREATE INDEX IF NOT EXISTS idx_status ON feedback(status)');
    });
  }

  // Submit anonymous feedback
  submitFeedback(content, category) {
    return new Promise((resolve, reject) => {
      const timestamp = Date.now();
      const charCount = content.length;
      
      this.db.run(
        `INSERT INTO feedback (content, category, created_at, char_count, status)
         VALUES (?, ?, ?, ?, 'unread')`,
        [content, category, timestamp, charCount],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, timestamp });
        }
      );
    });
  }

  // Get all feedback (admin only)
  getAllFeedback(limit = 50, offset = 0) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT id, content, category, created_at, char_count, status
         FROM feedback
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }

  // Get feedback count
  getFeedbackCount() {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT COUNT(*) as count FROM feedback',
        (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        }
      );
    });
  }

  // Get feedback statistics
  getStatistics() {
    return new Promise((resolve, reject) => {
      Promise.all([
        new Promise((res, rej) => {
          this.db.get('SELECT COUNT(*) as total FROM feedback', (err, row) => {
            if (err) rej(err);
            else res(row ? row.total : 0);
          });
        }),
        new Promise((res, rej) => {
          this.db.get('SELECT COUNT(*) as unread FROM feedback WHERE status = ?', ['unread'], (err, row) => {
            if (err) rej(err);
            else res(row ? row.unread : 0);
          });
        }),
        new Promise((res, rej) => {
          this.db.all('SELECT category, COUNT(*) as count FROM feedback GROUP BY category', [], (err, rows) => {
            if (err) rej(err);
            else res(rows || []);
          });
        })
      ])
      .then(([total, unread, byCategory]) => {
        resolve({ total, unread, byCategory });
      })
      .catch(reject);
    });
  }

  // Mark feedback as read
  markAsRead(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE feedback SET status = "read" WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Delete feedback (for moderation purposes)
  deleteFeedback(id) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM feedback WHERE id = ?',
        [id],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

module.exports = FeedbackDatabase;
