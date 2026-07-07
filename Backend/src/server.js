
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http'); // 🌐 Core Node module to attach HTTP server wrappers
const { Server } = require('socket.io'); // 🚀 Real-time WebSocket Server engine
const User = require("./models/user");
require('dotenv').config();

const authRoutes = require('./auth/authRoutes');
const rideRoutes = require('./routes/rides');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

app.get("/", (req, res) => {
    res.send("RideBook Backend Running with Live Socket Engine");
});

// 🔌 Step A: Integrate native HTTP Server layers over Express instance
const server = http.createServer(app);

// 🔌 Step B: Bind Socket.io instance to your HTTP pipeline with unrestricted CORS
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// 📡 Step C: Open Global Real-Time Event Handlers for connected clients
io.on('connection', (socket) => {
    console.log(`🔌 [Socket Engine] A client connected! Assignment ID: ${socket.id}`);

    // Listener: When a driver logs into the mobile app, they join a "drivers-room"
    socket.on('join-driver-stream', () => {
        socket.join('drivers-room');
        console.log(`🚖 [Socket Engine] A driver asset just registered into the active stream.`);
    });

    // Listener: Client joins a private room for an active ride (for chat and live ETA)
    socket.on('join-ride-room', ({ rideId }) => {
        socket.join(`ride-room-${rideId}`);
        console.log(`📡 [Socket Engine] Client joined private room: ride-room-${rideId}`);
    });

    // Listener: Relays quick-chat messages between passenger and driver
    socket.on('send-message', ({ rideId, text, senderId }) => {
        console.log(`💬 [Socket Chat] Relaying message on Ride ${rideId}: "${text}"`);
        io.to(`ride-room-${rideId}`).emit(`new-message-${rideId}`, { text, senderId });
    });

    // Listener: Handlers for disconnection cleanups
    socket.on('disconnect', () => {
        console.log(`🔌 [Socket Engine] Client disconnected from system pipeline.`);
    });
});

// 💾 Make the 'io' engine safely available to our routes files
app.set('io', io);

mongoose.connect("mongodb+srv://kaushalsimran620_db_user:Simran252001@cluster0.a0fxt2w.mongodb.net/?appName=Cluster0")
.then(() => {
    console.log("MongoDB Connected Successfully");
}).catch((error) => {
    console.log("MongoDB Connection Fatal Error:", error);
});

// 🔥 CRITICAL CHANGE: We now listen via the modified HTTP 'server' instance, NOT 'app' directly!
const PORT = process.env.PORT || 5000;

server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Velo Server listening and running live on Port ${PORT}`);
});