const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const cron = require('node-cron');
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Frontend URL
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Socket.io Connection Handler
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join user to their own room for DMs
    socket.on('join_user', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined their room`);
        }
    });

    // Join user to group room
    socket.on('join_group', (groupId) => {
        if (groupId) {
            socket.join(groupId);
            console.log(`Socket ${socket.id} joined group ${groupId}`);
        }
    });

    // Join user to their notification room (same as user room for simplicity)
    socket.on('join_notification_room', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`User ${userId} joined notification room`);
        }
    });

    // Join user to a clan room
    socket.on('join_room', (roomId) => {
        if (roomId) {
            socket.join(roomId);
            console.log(`Socket ${socket.id} joined room ${roomId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/streak-game')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Routes (Placeholder)
app.get('/', (req, res) => {
    res.send('Streak Game API is running');
});

// Import Routes
const apiRoutes = require('./routes/index.route');
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', apiRoutes);

// Schedule Streak Reminder Job
const streakReminderService = require('./services/streak-reminder.service');

// Run daily at 8 PM (20:00)
cron.schedule('0 20 * * *', () => {
    console.log('[Cron] Running streak reminder job at', new Date().toLocaleString());
    streakReminderService.sendStreakReminders(io);
}, {
    timezone: "Asia/Kolkata" // Set your timezone
});

console.log('[Cron] Streak reminder scheduled for 8:00 PM daily');

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
