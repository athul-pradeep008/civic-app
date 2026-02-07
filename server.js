const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { connectDB } = require('./config/database');
const config = require('./config/config');

// Add Global Crash Loggers
process.on('uncaughtException', (err) => {
    console.error('💥 CRITICAL: UNCAUGHT EXCEPTION');
    console.error(err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 CRITICAL: UNHANDLED REJECTION');
    console.error(reason);
    process.exit(1);
});

const authRoutes = require('./routes/auth');
const issueRoutes = require('./routes/issues');
const voteRoutes = require('./routes/votes');
const adminRoutes = require('./routes/admin');



// Initialize express app
const app = express();


// Force HTTPS in production
if (config.nodeEnv === 'production') {
    app.use((req, res, next) => {
        if (req.headers['x-forwarded-proto'] !== 'https') {
            return res.redirect(`https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
            "img-src": ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://unpkg.com", "https://*.flaticon.com", "https://*.google.com"],
            "connect-src": ["'self'", "https://*"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "object-src": ["'none'"],
            "media-src": ["'self'"],
            "frame-src": ["'self'"]
        },
    }
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/auth', authLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', require('./routes/users'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/stats', require('./routes/stats'));



// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        error: config.nodeEnv === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const http = require('http');
const { Server } = require('socket.io');

// Main async startup
const startApp = async () => {
    try {
        console.log('⚡ Starting CivicReport System...');

        // 1. Connect to Database
        await connectDB();
        console.log('✅ Database Connection Secured.');

        // 2. Identify Available Port (100% Reliable Hunter)
        const checkPort = (p) => {
            return new Promise((resolve) => {
                const srv = http.createServer();
                srv.unref();
                srv.on('error', () => resolve(false));
                srv.listen(p, () => {
                    srv.close(() => resolve(true));
                });
            });
        };

        const getFreePort = async (start) => {
            let p = start;
            while (!(await checkPort(p))) {
                console.warn(`⏳ Port ${p} is busy, checking next...`);
                p++;
                await new Promise(r => setTimeout(r, 100)); // Small delay for OS cleanup
            }
            return p;
        };

        let port = process.env.PORT || config.port || 5002;
        if (!process.env.PORT && !process.env.VERCEL) {
            port = await getFreePort(port);
        }

        // 3. Initialize Final Server
        const server = http.createServer(app);
        const io = new Server(server, {
            cors: { origin: "*", methods: ["GET", "POST"] }
        });

        // Setup simple socket logger
        io.on('connection', (socket) => {
            console.log(`🔌 New client connected: ${socket.id}`);
        });

        app.set('io', io);

        server.listen(port, () => {
            console.log(`\n🚀 System 100% Operational!`);
            console.log(`👉 Access: http://localhost:${port} (or your configured domain)`);
            console.log(`📡 API:    /api\n`);
        });

        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`💥 FATAL: Port ${port} was grabbed by another process. Please restart.`);
                process.exit(1);
            }
        });

    } catch (err) {
        console.error('💥 STARTUP FAILED:', err.message);
        process.exit(1);
    }
};

if (require.main === module) {
    startApp();
}

// Graceful shutdown
const shutdown = () => {
    console.log('\nShutting down gracefully...');
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;

