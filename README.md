# 🔒 Anonymous Feedback System

A production-ready, privacy-first anonymous feedback application built for academic and workplace environments. This system enables users to submit honest feedback without fear of identification, while providing administrators with a modern dashboard to review and manage submissions.

## 🌟 Core Features

### Privacy & Security
- ✅ **Zero Identity Tracking**: No authentication required for submissions
- ✅ **No IP Logging**: IP addresses are not stored in the database
- ✅ **No Fingerprinting**: No tracking cookies, browser fingerprinting, or analytics
- ✅ **Data Minimization**: Only essential feedback content and metadata are stored
- ✅ **Input Sanitization**: All inputs are sanitized to prevent XSS and injection attacks
- ✅ **Rate Limiting**: Prevents spam while maintaining anonymity (5 submissions per 15 minutes)
- ✅ **Secure Headers**: Helmet.js integration with CSP, HSTS, and XSS protection

### User Experience
- 🎨 **Modern UI/UX**: Contemporary, trust-centric design with smooth animations
- 📱 **Mobile-First**: Fully responsive design optimized for all devices
- ⚡ **Real-time Validation**: Instant feedback with character counter and progress indicator
- 🎯 **Intuitive Categories**: Easy-to-use category selection with visual icons
- ✨ **Micro-interactions**: Smooth transitions and interactive elements
- 💬 **Clear Communication**: Transparent anonymity guarantees displayed to users

### Admin Dashboard
- 📊 **Real-time Statistics**: Total, unread, and categorized feedback metrics
- 🗂️ **Smart Organization**: Automatic grouping by time (Today / This Week / Older)
- 🔍 **Advanced Filtering**: Filter by status, category, and sort order
- 📝 **Feedback Management**: Mark as read, delete, and view detailed submissions
- 🎨 **Clean Interface**: Card-based design with color-coded categories
- 🔄 **Auto-refresh**: Statistics update every 30 seconds
- 🔐 **Token-based Auth**: Simple but secure admin access control

## 📋 Technical Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite (better-sqlite3) - lightweight, serverless, zero-config
- **Security**: Helmet.js for security headers
- **Rate Limiting**: express-rate-limit
- **Validation**: validator.js for input sanitization
- **Compression**: gzip compression for responses

### Frontend
- **Markup**: Semantic HTML5
- **Styling**: Modern CSS with CSS Variables
- **JavaScript**: Vanilla JS (no heavy frameworks)
- **Design**: Mobile-first responsive design
- **Animations**: CSS animations and transitions

## 🚀 Quick Start

### Prerequisites
- Node.js 14.x or higher
- npm or yarn

### Installation

1. **Clone or download the project**
   ```bash
   cd c:\xampp\htdocs\6.feedback
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure admin token (IMPORTANT for production)**
   
   Edit `config.js` and change the admin token:
   ```javascript
   ADMIN: {
     ACCESS_TOKEN: process.env.ADMIN_TOKEN || 'your-secure-token-here'
   }
   ```
   
   Or set environment variable:
   ```bash
   set ADMIN_TOKEN=your-secure-token-here
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Access the application**
   - User Interface: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin
   - Health Check: http://localhost:3000/health

## 📡 API Documentation

### Public Endpoints

#### Submit Feedback
```http
POST /api/feedback
Content-Type: application/json

{
  "content": "Your feedback here (10-2000 characters)",
  "category": "general|suggestion|complaint|praise|other"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Your feedback has been submitted anonymously",
  "data": {
    "id": 123,
    "timestamp": 1705161600000,
    "anonymityGuarantee": "No identifying information was collected or stored"
  }
}
```

**Rate Limit**: 5 requests per 15 minutes per IP

#### Get System Info
```http
GET /api/feedback/info
```

**Response (200)**:
```json
{
  "success": true,
  "data": {
    "anonymityGuarantees": [...],
    "constraints": {...},
    "categories": [...]
  }
}
```

### Admin Endpoints

All admin endpoints require `X-Admin-Token` header.

#### Get All Feedback
```http
GET /api/admin/feedback?limit=50&offset=0
X-Admin-Token: your-admin-token
```

#### Get Statistics
```http
GET /api/admin/statistics
X-Admin-Token: your-admin-token
```

#### Mark Feedback as Read
```http
PATCH /api/admin/feedback/:id/read
X-Admin-Token: your-admin-token
```

#### Delete Feedback
```http
DELETE /api/admin/feedback/:id
X-Admin-Token: your-admin-token
```

## 🗄️ Database Schema

```sql
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  char_count INTEGER NOT NULL,
  status TEXT DEFAULT 'unread'
);

-- Indexes for performance
CREATE INDEX idx_created_at ON feedback(created_at DESC);
CREATE INDEX idx_status ON feedback(status);
```

**Note**: No IP addresses, user agents, or identifying information is stored.

## 🔒 Privacy Guarantees

### What We DON'T Collect
- ❌ No IP addresses
- ❌ No user agents or browser information
- ❌ No cookies or local storage
- ❌ No session tracking
- ❌ No analytics or third-party scripts
- ❌ No authentication data for submissions
- ❌ No geolocation data
- ❌ No device fingerprinting

### What We DO Store
- ✅ Feedback content (sanitized)
- ✅ Category selection
- ✅ Timestamp (for organization)
- ✅ Character count (for statistics)
- ✅ Read/unread status (admin use only)

### Rate Limiting Implementation
Rate limiting is implemented to prevent abuse while maintaining anonymity:
- Limits based on IP but **IP is not stored**
- Only used transiently for rate limit calculation
- Resets every 15 minutes
- Does not compromise anonymity

## 🛡️ Security Features

### Input Sanitization
- HTML escaping to prevent XSS attacks
- SQL injection prevention via parameterized queries
- Content length validation (10-2000 characters)
- Category whitelist validation
- Profanity filter (basic implementation included)
- Spam detection (repeated characters, excessive caps)

### Security Headers
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Referrer-Policy: no-referrer
- X-Powered-By header removed

### Rate Limiting
- Feedback submissions: 5 per 15 minutes
- Admin endpoints: 100 per 15 minutes
- Configurable in `config.js`

## 📦 Deployment

### Production Checklist

1. **Change Admin Token**
   ```bash
   export ADMIN_TOKEN="$(openssl rand -base64 32)"
   ```

2. **Set NODE_ENV**
   ```bash
   export NODE_ENV=production
   ```

3. **Use Process Manager**
   ```bash
   npm install -g pm2
   pm2 start server.js --name feedback-system
   pm2 save
   pm2 startup
   ```

4. **Configure Reverse Proxy (nginx example)**
   ```nginx
   server {
       listen 80;
       server_name feedback.yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

5. **Enable HTTPS**
   ```bash
   # Using Let's Encrypt
   sudo certbot --nginx -d feedback.yourdomain.com
   ```

6. **Backup Database**
   ```bash
   # Regular backups of feedback.db
   0 2 * * * cp /path/to/feedback.db /path/to/backups/feedback-$(date +\%Y\%m\%d).db
   ```

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Admin Configuration
ADMIN_TOKEN=your-secure-random-token
```

### Docker Deployment (Optional)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t anonymous-feedback .
docker run -d -p 3000:3000 -e ADMIN_TOKEN=your-token anonymous-feedback
```

## 🔧 Configuration

Edit `config.js` to customize:

```javascript
module.exports = {
  PORT: 3000,
  
  RATE_LIMIT: {
    windowMs: 15 * 60 * 1000,  // Time window
    maxRequests: 5,             // Max requests per window
  },
  
  FEEDBACK: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
    CATEGORIES: ['general', 'suggestion', 'complaint', 'praise', 'other']
  },
  
  ADMIN: {
    ACCESS_TOKEN: 'change-this-in-production',
    ITEMS_PER_PAGE: 50
  }
};
```

## 🧪 Testing

### Manual Testing

1. **Test Feedback Submission**
   ```bash
   curl -X POST http://localhost:3000/api/feedback \
     -H "Content-Type: application/json" \
     -d '{"content":"Test feedback content here","category":"general"}'
   ```

2. **Test Rate Limiting**
   - Submit 6 requests quickly
   - 6th request should return 429 status

3. **Test Admin Access**
   ```bash
   curl http://localhost:3000/api/admin/statistics \
     -H "X-Admin-Token: your-token"
   ```

### Edge Cases Handled

✅ Empty submissions  
✅ Excessively long submissions  
✅ Repeated spam submissions  
✅ Network failures during submission  
✅ Invalid categories  
✅ SQL injection attempts  
✅ XSS attacks  
✅ Concurrent read/write operations  
✅ Admin pagination for large datasets  

## 📁 Project Structure

```
6.feedback/
├── server.js                 # Main Express server
├── config.js                 # Configuration settings
├── database.js               # SQLite database layer
├── package.json              # Dependencies
├── middleware/
│   ├── validation.js         # Input validation & sanitization
│   ├── rateLimiter.js        # Rate limiting middleware
│   ├── auth.js               # Admin authentication
│   └── errorHandler.js       # Error handling middleware
├── routes/
│   ├── feedback.js           # Public feedback routes
│   └── admin.js              # Admin routes
└── public/
    ├── index.html            # User feedback interface
    ├── styles.css            # User interface styles
    ├── app.js                # User interface logic
    ├── admin.html            # Admin dashboard
    ├── admin-styles.css      # Admin dashboard styles
    └── admin.js              # Admin dashboard logic
```

## 🤝 Contributing

This is a privacy-critical system. When contributing:

1. **Never** add any tracking or analytics
2. **Never** log IP addresses or identifying information
3. **Always** sanitize user input
4. **Always** use parameterized queries
5. **Test** security implications of changes
6. Follow the existing code style and patterns

## 📄 License

MIT License - Feel free to use in academic or workplace environments.

## ⚠️ Important Notes

1. **Change the default admin token** before deploying to production
2. **Use HTTPS** in production to prevent man-in-the-middle attacks
3. **Regular backups** of the SQLite database are recommended
4. **Monitor rate limits** and adjust based on your environment
5. **Review content moderation** settings based on your use case
6. **Keep dependencies updated** for security patches

## 🆘 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js version (14.x or higher)
- Check for syntax errors: `node -c server.js`

### Database errors
- Ensure write permissions in the application directory
- Check if `feedback.db` is locked by another process
- Delete `feedback.db` to reset (will lose all data)

### Rate limiting too strict
- Adjust `RATE_LIMIT.maxRequests` in `config.js`
- Increase `RATE_LIMIT.windowMs` for longer time windows

### Admin can't log in
- Verify token matches in `config.js`
- Check browser console for errors
- Clear browser cache and try again

## 📞 Support

For issues, questions, or feature requests:
1. Check the troubleshooting section above
2. Review the API documentation
3. Examine server logs for error messages
4. Ensure all dependencies are properly installed

---

**Built with privacy by design. Zero tracking. Zero logs. 100% Anonymous.**
