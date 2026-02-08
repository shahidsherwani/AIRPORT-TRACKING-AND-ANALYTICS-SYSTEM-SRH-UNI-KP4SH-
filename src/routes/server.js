/**
 * Airport Tracking and Analytics System - Main Server
 * SRH University Student Project
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

// Import database manager
const dbManager = require('./src/config/database');

// Import routes
const flightMonitorRoutes = require('./src/routes/flightMonitor');
const kpiRoutes = require('./src/routes/kpi');
const collisionRoutes = require('./src/routes/collision');
const altitudeRoutes = require('./src/routes/altitude');
const passengerRoutes = require('./src/routes/passenger');
const historyRoutes = require('./src/routes/history');
const replayRoutes = require('./src/routes/replay');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for development
}));
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const health = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            databases: {
                redis: false,
                mongodb: false,
                neo4j: false
            }
        };

        // Check database connections
        if (dbManager.isHealthy()) {
            health.databases.redis = true;
            health.databases.mongodb = true;
            health.databases.neo4j = true;
        }

        res.json(health);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// API Routes
app.use('/api/flights', flightMonitorRoutes);
app.use('/api/kpi', kpiRoutes);
app.use('/api/collision', collisionRoutes);
app.use('/api/altitude', altitudeRoutes);
app.use('/api/passenger', passengerRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/replay', replayRoutes);

// Serve frontend pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/kpi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kpi.html'));
});

app.get('/collision', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'collision.html'));
});

app.get('/altitude', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'altitude.html'));
});

app.get('/passenger', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'passenger.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'history.html'));
});

app.get('/replay', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'replay.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.path} not found`
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start server
async function startServer() {
    try {
        console.log('🚀 Starting Airport Tracking System...');
        console.log('📍 Environment:', process.env.NODE_ENV || 'development');

        // Connect to databases
        await dbManager.connect();

        // Import and start monitoring services
        const flightMonitorService = require('./src/services/flightMonitorService');
        const collisionService = require('./src/services/collisionService');
        const altitudeCheckService = require('./src/services/altitudeCheckService');

        console.log('');
        console.log('🔄 Starting monitoring services...');

        // Start flight data monitoring
        flightMonitorService.startMonitoring();

        // Start safety monitoring services
        collisionService.startMonitoring();
        altitudeCheckService.startMonitoring();

        console.log('✅ All monitoring services started!');

        // Start Express server
        app.listen(PORT, () => {
            console.log('');
            console.log('✈️  Airport Tracking System is running!');
            console.log('');
            console.log(`🌐 Server: http://localhost:${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`📈 KPIs: http://localhost:${PORT}/kpi`);
            console.log(`⚠️  Collision: http://localhost:${PORT}/collision`);
            console.log(`📉 Altitude: http://localhost:${PORT}/altitude`);
            console.log(`🔍 Passenger: http://localhost:${PORT}/passenger`);
            console.log(`📜 History: http://localhost:${PORT}/history`);
            console.log(`🎬 Replay: http://localhost:${PORT}/replay`);
            console.log(`💚 Health: http://localhost:${PORT}/health`);
            console.log('');
            console.log('Press Ctrl+C to stop');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        await dbManager.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    try {
        await dbManager.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the server
startServer();

module.exports = app;