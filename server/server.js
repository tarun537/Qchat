import express from 'express';
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from './lib/db.js';
import userRouter from './routes/userRoutes.js';
import messageRouter from './routes/messageRoutes.js';
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
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User Connected", userId);

    if (userId) userSocketMap[userId] = socket.id;

    // Emit online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
        console.log("User Disconnected", userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

// Middleware setup
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());


// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter)
app.use("/api/messages", messageRouter)

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

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 4000;
    server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
}

// Export server for vercel
export default server;