const express = require("express");
const router = express.Router();
const IdeaController = require("../Controllers/IdeasController");
const multer = require('multer');
const path = require('path');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/agreements')
    },
    filename: function (req, file, cb) {
        // Generate a unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `agreement_${uniqueSuffix}${path.extname(file.originalname)}`)
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'));
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File is too large. Maximum size is 10MB'
            });
        }
        return res.status(400).json({
            message: 'Error uploading file: ' + err.message
        });
    } else if (err) {
        return res.status(400).json({
            message: err.message
        });
    }
    next();
}

router.post("/create-idea", IdeaController.createIdea);
router.get("/ideas", IdeaController.getIdeas);
router.get("/ideas/:buyerId", IdeaController.getIdeasByBuyerId);
router.get("/idea/:ideaId", IdeaController.getIdeaById);
router.put("/idea/close/:ideaId", IdeaController.closeIdea);
router.put("/idea/delete/:ideaId", IdeaController.deleteIdea);
router.put("/idea/approve/:ideaId", IdeaController.approveIdea);
router.put("/idea/reject/:ideaId", IdeaController.rejectIdea);

// Reply routes
router.post("/idea/:ideaId/reply", IdeaController.addReply);
router.post("/idea/:ideaId/reply/:replyId/agreement", upload.single('agreement'), handleMulterError, IdeaController.uploadAgreement);
router.get("/idea/:ideaId/replies", IdeaController.getReplies);
router.put("/idea/:ideaId/reply/:replyId", IdeaController.updateReply);
router.delete("/idea/:ideaId/reply/:replyId", IdeaController.deleteReply);

module.exports = router;