require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Import configurations
const connectDB = require('./config/database');
const { connectRedis } = require('./config/redis');
const { register, metricsMiddleware } = require('./middleware/metrics');

// Import routes
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const restaurantRoutes = require('./routes/restaurant');
const deliveryRoutes = require('./routes/delivery');
const swipeRoutes = require('./routes/swipe');
const gameRoutes = require('./routes/game');
const adminRoutes = require('./routes/admin');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

// Connect to databases
connectDB();
connectRedis();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'yummygo-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        httpOnly: true
    }
}));

// Metrics middleware
app.use(metricsMiddleware);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io setup for real-time order tracking
io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join room based on order ID
    socket.on('track-order', (orderId) => {
        socket.join(`order-${orderId}`);
        console.log(`Client joined order room: order-${orderId}`);
    });

    // Join room for restaurant orders
    socket.on('track-restaurant-orders', (restaurantId) => {
        socket.join(`restaurant-${restaurantId}`);
        console.log(`Client joined restaurant room: restaurant-${restaurantId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Make io accessible to routes
app.set('io', io);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customer', customerRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/swipe', swipeRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   🍕 YummyGo Server Running 🍕       ║
    ║   Port: ${PORT}                         ║
    ║   Environment: ${process.env.NODE_ENV || 'development'}          ║
    ╚═══════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = { app, io };
