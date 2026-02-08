# Crowdsourced Civic Issue Reporting System

A comprehensive web application for reporting and tracking civic issues with enhanced verification and validation mechanisms. Built with Node.js, Express, MongoDB, and modern vanilla JavaScript.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Issue Reporting**: Report civic issues with images, location, and detailed descriptions
- **Interactive Maps**: Leaflet.js integration for precise location selection and visualization
- **Community Voting**: Upvote/downvote system for issue credibility
- **Status Tracking**: Track issues from reported → verified → in progress → resolved
- **Admin Dashboard**: Comprehensive admin panel for issue moderation and analytics

### Enhanced Verification & Validation
- **Duplicate Detection**: Automatic detection of similar issues within a specified radius
- **Location Verification**: GPS-based validation with reverse geocoding
- **Image Validation**: File type, size, and content checks
- **Spam Prevention**: Rate limiting and pattern detection
- **Auto-Verification**: Issues automatically verified based on community votes and credibility score
- **Credibility Scoring**: Algorithm-based scoring system considering votes, images, and time factors

### User Experience
- **Modern UI**: Glassmorphism design with smooth animations
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Real-time Updates**: Live status updates and notifications
- **Search & Filters**: Advanced filtering by category, status, priority, and location
- **Map/List Views**: Toggle between map visualization and list view

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer
- **Validation**: Express-validator
- **Security**: bcryptjs for password hashing, CORS, rate limiting

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Custom design system with CSS variables
- **JavaScript**: Vanilla ES6+
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Fonts**: Google Fonts (Inter)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🚀 Installation

### 1. Clone the repository
```bash
cd "civic issue reporting system"
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/civic-issues

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@civicissues.com

# Admin Configuration
ADMIN_EMAIL=admin@civicissues.com
ADMIN_PASSWORD=admin123

# Verification Settings
DUPLICATE_RADIUS_METERS=100
MIN_VOTES_FOR_VERIFICATION=3
SPAM_THRESHOLD=5
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 5. Run the application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
civic-issue-reporting-system/
├── config/
│   ├── config.js           # Application configuration
│   └── database.js         # MongoDB connection
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── issueController.js  # Issue management
│   ├── voteController.js   # Voting system
│   └── adminController.js  # Admin operations
├── middleware/
│   ├── auth.js            # JWT authentication
│   ├── upload.js          # File upload handling
│   ├── validation.js      # Request validation
│   └── rateLimiter.js     # Rate limiting
├── models/
│   ├── User.js            # User schema
│   ├── Issue.js           # Issue schema
│   └── Vote.js            # Vote schema
├── routes/
│   ├── auth.js            # Auth routes
│   ├── issues.js          # Issue routes
│   ├── votes.js           # Vote routes
│   └── admin.js           # Admin routes
├── services/
│   ├── verificationService.js  # Verification logic
│   └── notificationService.js  # Email notifications
├── public/
│   ├── css/
│   │   └── style.css      # Main stylesheet
│   ├── js/
│   │   ├── api.js         # API client
│   │   ├── auth.js        # Auth utilities
│   │   ├── validation.js  # Form validation
│   │   ├── map.js         # Map utilities
│   │   ├── issues.js      # Issue utilities
│   │   └── admin.js       # Admin utilities
│   ├── index.html         # Landing page
│   ├── login.html         # Login/Register
│   ├── dashboard.html     # User dashboard
│   ├── report-issue.html  # Issue reporting
│   ├── issues.html        # Browse issues
│   ├── issue-detail.html  # Issue details
│   └── admin.html         # Admin dashboard
├── uploads/               # Uploaded images
├── .env                   # Environment variables
├── .gitignore            # Git ignore file
├── package.json          # Dependencies
├── server.js             # Main server file
└── README.md             # Documentation
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Issues
- `POST /api/issues` - Create new issue (authenticated)
- `GET /api/issues` - Get all issues with filters
- `GET /api/issues/:id` - Get single issue
- `GET /api/issues/nearby/:longitude/:latitude` - Get nearby issues
- `PUT /api/issues/:id` - Update issue (owner only)
- `DELETE /api/issues/:id` - Delete issue (owner/admin)

### Votes
- `POST /api/votes/:issueId` - Vote on issue (authenticated)
- `GET /api/votes/:issueId` - Get user's vote on issue

### Admin
- `GET /api/admin/stats` - Get dashboard statistics
- `PUT /api/admin/issues/:id/status` - Update issue status
- `DELETE /api/admin/issues/:id` - Delete issue
- `GET /api/admin/users` - Get all users

## 👤 User Roles

### Citizen (Default)
- Report issues
- Vote on issues
- View all issues
- Track own reported issues

### Admin
- All citizen permissions
- Update issue status
- Delete any issue
- View statistics
- Moderate content
- Manage users

## 🔐 Default Admin Credentials

```
Email: admin@civicissues.com
Password: admin123
```

**⚠️ Important**: Change these credentials in production!

## 🎨 Issue Categories

- Pothole
- Broken Streetlight
- Garbage Dump
- Drainage Problem
- Water Supply Issue
- Road Damage
- Traffic Signal Issue
- Park Maintenance
- Graffiti/Vandalism
- Other

## 📊 Issue Status Flow

1. **Reported** - Initial status when issue is created
2. **Verified** - Community or admin verified the issue
3. **In Progress** - Authorities are working on resolution
4. **Resolved** - Issue has been fixed
5. **Rejected** - Issue was invalid or duplicate

## 🛡️ Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- CORS protection
- File upload restrictions
- SQL injection prevention (NoSQL)
- XSS protection

## 🧪 Testing

### Manual Testing Checklist

1. **User Registration & Login**
   - Register new user
   - Login with credentials
   - Access protected routes

2. **Issue Reporting**
   - Create issue with images
   - Select location on map
   - Verify duplicate detection

3. **Voting System**
   - Upvote/downvote issues
   - Check vote persistence
   - Verify auto-verification

4. **Admin Functions**
   - Update issue status
   - View statistics
   - Moderate content

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production MongoDB URI
4. Set up email service (optional)
5. Configure reverse proxy (nginx/Apache)

### Recommended Hosting
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: MongoDB Atlas
- **File Storage**: AWS S3, Cloudinary

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Support

For issues and questions:
- Create an issue in the repository
- Contact: admin@civicissues.com

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Leaflet.js for mapping functionality
- MongoDB for database
- Express.js community

---

**Built with ❤️ for better communities**
