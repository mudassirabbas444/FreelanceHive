const express = require("express");
const router = express.Router();
const ShareholderRequestController = require("../Controllers/ShareholderRequestController");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/agreements';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'signed_agreement_' + uniqueSuffix + '.pdf');
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Create a new shareholder request
router.post("/", ShareholderRequestController.createShareholderRequest);

// Upload PDF for shareholder request
router.post("/upload-pdf", upload.single('pdf'), ShareholderRequestController.uploadPDF);

// Get shareholder requests by buyer
router.get("/buyer/:buyerId", ShareholderRequestController.getShareholderRequestsByBuyer);

// Get shareholder requests by seller
router.get("/seller/:sellerId", ShareholderRequestController.getShareholderRequestsBySeller);

// Get shareholder request by reply ID
router.get("/reply/:replyId", ShareholderRequestController.getShareholderRequestByReplyId);

// Update shareholder request status
router.put("/:requestId/status", ShareholderRequestController.updateShareholderRequestStatus);

// Accept shareholder request
router.put("/:requestId/accept", ShareholderRequestController.acceptShareholderRequest);

// Serve agreement files
router.use('/agreements', express.static(path.join(__dirname, '../uploads/agreements')));

module.exports = router; 