const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");
const { connect } = require("./config/database");
const User = require("./Models/User");
const bcrypt = require("bcrypt");

const gigRoutes = require("./Routes/gigRoutes");
const userRoutes = require("./Routes/userRoutes");
const orderRoutes = require("./Routes/orderRoutes");
const messageRoutes = require("./Routes/messageRoutes");
const buyerRequestRoutes = require("./Routes/buyerRequestRoutes");
const proposalRoutes = require("./Routes/proposalRoutes");
const walletRoutes = require("./Routes/walletRoutes");
const transactionRoutes = require("./Routes/transactionRoutes");
const ideaRoutes = require("./Routes/IdeaRoutes");
const meetingRoutes = require("./Routes/meetingRoutes");
const shareholderRequestRoutes = require("./Routes/shareholderRequestRoutes");
const paymentRoutes = require('./Routes/paymentRoutes');
const verificationRoutes = require('./Routes/verificationRoutes');
const dashboardRoutes = require('./Routes/dashboardRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
const PORT = process.env.PORT || 4000;

// Serve static files from 'uploads' directory with CORS headers
app.use("/uploads", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}, express.static(path.join(__dirname, "uploads")));

// Serve agreement files specifically
app.use("/agreements", (req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
}, express.static(path.join(__dirname, "uploads/agreements")));

// Function to initialize default users
async function initializeDefaultUsers() {
  try {
    // Default Admin
    const adminEmail = "admin@gmail.com";
    const existingAdmin = await User.findUserByEmail(adminEmail);
    if (!existingAdmin) {
      await User.signup({
        name: "Admin User",
        email: adminEmail,
        username: "admin",
        password: "123456",
        role: "Admin"
      });
      console.log("Default admin created successfully");
    }

    // Default Seller
    const sellerEmail = "seller@gmail.com";
    const existingSeller = await User.findUserByEmail(sellerEmail);
    if (!existingSeller) {
      await User.signup({
        name: "Default Seller",
        email: sellerEmail,
        username: "seller",
        password: "123456",
        role: "Seller",
        expertise: ["Web Development", "Mobile Apps"],
        description: "Experienced full-stack developer",
        qualification: "BS Computer Science"
      });
      console.log("Default seller created successfully");
    }

    // Default Buyer
    const buyerEmail = "buyer@gmail.com";
    const existingBuyer = await User.findUserByEmail(buyerEmail);
    if (!existingBuyer) {
      await User.signup({
        name: "Default Buyer",
        email: buyerEmail,
        username: "buyer",
        password: "123456",
        role: "Buyer"
      });
      console.log("Default buyer created successfully");
    }
  } catch (error) {
    console.error("Error creating default users:", error);
  }
}

// Connect to MongoDB
connect()
  .then(() => {
    console.log("MongoDB connected");
    return initializeDefaultUsers();
  })
  .then(() => {
    console.log("Default users initialized");
  })
  .catch((error) => console.error("MongoDB connection error:", error));

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", gigRoutes);
app.use("/api", userRoutes);
app.use("/api", orderRoutes);
app.use("/api", messageRoutes);
app.use("/api", buyerRequestRoutes);
app.use("/api", proposalRoutes);
app.use("/api", ideaRoutes);
app.use("/api", meetingRoutes);
app.use("/api/shareholder-request", shareholderRequestRoutes);
app.use('/api', paymentRoutes);
app.use('/api', verificationRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api', dashboardRoutes);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  // Join a chat room
  socket.on("join_chat", (data) => {
    const roomId = [data.userId, data.receiverId].sort().join("-");
    socket.join(roomId);
  });

  // Handle new messages
  socket.on("send_message", async (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("-");
    io.to(roomId).emit("receive_message", data);
  });

  // Handle audio messages
  socket.on("send_audio", async (data) => {
    const roomId = [data.senderId, data.receiverId].sort().join("-");
    io.to(roomId).emit("receive_audio", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
