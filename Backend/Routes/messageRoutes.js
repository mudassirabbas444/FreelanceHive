const express = require("express");
const messageController = require("../Controllers/MessageController");

const router = express.Router();

// File upload route
router.post("/chat/file", messageController.sendFile);

// Audio message route
router.post("/chat/audio", messageController.sendAudioMessage);

// Route to send a message
router.post("/chat", messageController.sendMessage);

// Route to get messages between two users
router.get("/chat/:userId1/:userId2", messageController.getMessages);

// Route to search messages between two users
router.get("/chat/:userId1/:userId2/search/:searchTerm", messageController.searchMessages);

router.get('/chats/:userId', messageController.getAllChats);

module.exports = router;
