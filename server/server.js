import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import groupRouter from './routes/groupRoutes.js';
import Group from './models/Group.js';
import { Server } from 'socket.io';

// Create Express app and http server
const app = express();
const server = http.createServer(app)

// Initialize socket.io server
export const io = new Server(server, {
    cors: { origin: "*" }
})

// Store online users
export const userSocketMap = {}; // { userId: socketId }

// Socket.io connection handler
io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;

        // Auto-join socket rooms for all groups this user belongs to
        try {
            const userGroups = await Group.find({ members: userId }).select("_id");
            userGroups.forEach((g) => {
                socket.join(`group:${g._id}`);
            });
        } catch (err) {
            console.error("Error joining user group rooms:", err.message);
        }
    }

    // Allow dynamic joining/leaving of group rooms
    socket.on("group:join", ({ groupId }) => {
        socket.join(`group:${groupId}`);
    });

    socket.on("group:leave", ({ groupId }) => {
        socket.leave(`group:${groupId}`);
    });

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // Socket call signaling handlers
    socket.on("call:initiate", ({ to, fromUser, type, offer }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("call:incoming", { from: userId, fromUser, type, offer });
        } else {
            socket.emit("call:user-unavailable");
        }
    });

    socket.on("call:accept", ({ to, answer }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call:accepted", { from: userId, answer });
        }
    });

    socket.on("call:reject", ({ to }) => {
        const callerSocketId = userSocketMap[to];
        if (callerSocketId) {
            io.to(callerSocketId).emit("call:rejected", { from: userId });
        }
    });

    socket.on("call:end", ({ to }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("call:ended", { from: userId });
        }
    });

    socket.on("call:ice-candidate", ({ to, candidate }) => {
        const targetSocketId = userSocketMap[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit("call:ice-candidate", { from: userId, candidate });
        }
    });

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
        // Also inform active call counterpart if disconnected
        io.emit("call:user-disconnected", { userId });
    });
})

// Middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());


// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)
app.use("/api/groups", groupRouter)

// Error handling middleware
app.use((err, req, res, next) => {
    if (err.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request entity too large. Please select a smaller file (under 25MB)."
        });
    }
    console.error("Server error:", err.message);
    res.status(500).json({ success: false, message: err.message || "Internal server error" });
});


// Connect to MongoDB
await connectDB();

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => console.log("Server is running on PORT: " + PORT));

export default server;