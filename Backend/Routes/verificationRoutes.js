const express = require('express');
const router = express.Router();
const VerificationController = require('../Controllers/VerificationController');

// Submit verification request
router.post('/verification/submit', 
    VerificationController.uploadMiddleware,
    VerificationController.submitVerification
);

// Get verification status for a user
router.get('/verification/status/:userId',
    VerificationController.getVerificationStatus
);

// Get all verification requests (admin only)
router.get('/verification/all',
    VerificationController.getAllVerifications
);

// Approve or reject verification (admin only)
router.patch('/verification/:verificationId/update-status',
    VerificationController.updateVerificationStatus
);

// Resubmit verification after rejection
router.post('/verification/resubmit/:userId',
    VerificationController.uploadMiddleware,
    VerificationController.resubmitVerification
);

module.exports = router; 