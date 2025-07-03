const Message = require("../Models/Message");
const multer = require("multer");
const path = require("path");
const fs = require('fs');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.mimetype.startsWith('audio/')) {
      uploadPath = path.join(__dirname, "..", "uploads", "audio");
    } else {
      uploadPath = path.join(__dirname, "..", "uploads", "files");
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Ensure the filename is unique
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/wav'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Initialize multer with the storage configuration
const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

exports.sendAudioMessage = async (req, res) => {
  upload.single("audio")(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ error: "Error uploading file." });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No audio file uploaded." });
      }

      const { senderId, receiverId } = req.body;
      const audioUrl = `/uploads/audio/${req.file.filename}`;

      console.log("Sender ID:", senderId);
      console.log("Receiver ID:", receiverId);
      console.log("Audio URL:", audioUrl);

      const messageData = {
        senderId,
        receiverId,
        audio: audioUrl,
        timestamp: new Date(),
      };

      const messageId = await Message.sendMessage(messageData);

      res.status(200).json({
        message: "Audio message sent successfully.",
        messageId,
        audioUrl // Include the audio URL in the response
      });
    } catch (error) {
      console.error("Error processing the audio message:", error);
      res.status(500).json({ error: error.message });
    }
  });
};

exports.sendFile = async (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: "File size too large. Maximum size is 10MB." });
      }
      return res.status(500).json({ error: err.message });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded." });
      }

      const { senderId, receiverId } = req.body;
      const fileUrl = `/uploads/files/${req.file.filename}`;

      const messageData = {
        senderId,
        receiverId,
        fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        timestamp: new Date(),
      };

      const messageId = await Message.sendMessage(messageData);

      res.status(200).json({
        message: "File sent successfully.",
        messageId,
        fileUrl,
        fileName: req.file.originalname
      });
    } catch (error) {
      console.error("Error processing the file:", error);
      res.status(500).json({ error: error.message });
    }
  });
};

exports.sendMessage = async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;

    // Check if senderId and receiverId are present
    if (!senderId || !receiverId) {
      return res.status(400).json({ error: "Sender ID or Receiver ID is missing" });
    }

    const messageId = await Message.sendMessage({ senderId, receiverId, message });
    res.status(200).json({ message: "Message sent successfully.", messageId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId1, userId2 } = req.params;
    const messages = await Message.getMessages(userId1, userId2);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchMessages = async (req, res) => {
  try {
    const { userId1, userId2, searchTerm } = req.params;
    const messages = await Message.searchMessages(userId1, userId2, searchTerm);
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const { userId } = req.params;
    const chats = await Message.getAllChats(userId);
    res.status(200).json(chats); 
  } catch (error) {
    res.status(500).json({ error: error.message }); 
  }
};