const Verification = require("../Models/Verification");
const { ObjectId } = require("mongodb");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure document storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/verification";
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const userId = req.body.userId || "unknown";
    const docType = req.body.docType || file.fieldname;
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${userId}-${docType}-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  // Allow only images and PDFs
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "application/pdf"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG and PDF are allowed."), false);
  }
};

// Setup multer for handling multipart/form-data (file uploads)
exports.uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
}).fields([
  { name: "governmentId", maxCount: 1 },
  { name: "selfieWithId", maxCount: 1 },
  { name: "addressProof", maxCount: 1 },
  { name: "digitalSignature", maxCount: 1 },
  { name: "emailVerification", maxCount: 1 },
]);

// Submit verification request
exports.submitVerification = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Request files:', req.files);
    
    const { userId, role } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    if (!role || (role !== "Buyer" && role !== "Seller")) {
      return res.status(400).json({ error: "Valid role is required (Buyer or Seller)" });
    }
    
    const documents = {};
    
    // Process uploaded files
    if (req.files) {
      for (const [docType, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          documents[docType] = `/uploads/verification/${files[0].filename}`;
        }
      }
    }
    
    // Check required documents based on role
    const requiredDocs = ["governmentId", "selfieWithId", "addressProof"];
    
    for (const doc of requiredDocs) {
      if (!documents[doc]) {
        return res.status(400).json({ error: `${doc} document is required` });
      }
    }
    
    const verificationId = await Verification.submitRequest({
      userId: new ObjectId(userId),
      role,
      documents
    });
    
    res.status(201).json({
      message: "Verification request submitted successfully",
      verificationId
    });
  } catch (error) {
    console.error("Error submitting verification:", error);
    res.status(500).json({ error: error.message });
  }
};

// Resubmit verification after rejection
exports.resubmitVerification = async (req, res) => {
  try {
    console.log('Resubmit request body:', req.body);
    console.log('Resubmit request files:', req.files);
    
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const newDocuments = {};
    
    // Process uploaded files
    if (req.files) {
      for (const [docType, files] of Object.entries(req.files)) {
        if (files && files.length > 0) {
          newDocuments[docType] = `/uploads/verification/${files[0].filename}`;
        }
      }
    }
    
    // Check if any documents were uploaded
    if (Object.keys(newDocuments).length === 0) {
      return res.status(400).json({ error: "At least one document must be uploaded" });
    }
    
    // Get the user's role from the previous verification request
    const previousRequest = await Verification.getUserVerificationStatus(userId);
    if (!previousRequest || previousRequest.status !== 'Rejected') {
      return res.status(400).json({ error: "No rejected verification request found to resubmit" });
    }
    
    const verificationId = await Verification.resubmitRequest(userId, newDocuments);
    
    res.status(201).json({
      message: "Verification request resubmitted successfully",
      verificationId
    });
  } catch (error) {
    console.error("Error resubmitting verification:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get verification status for a user
exports.getVerificationStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const status = await Verification.getUserVerificationStatus(userId);
    
    res.status(200).json(status);
  } catch (error) {
    console.error("Error getting verification status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get all verification requests (admin only)
exports.getAllVerifications = async (req, res) => {
  try {
    const { status, role } = req.query;
    const filters = {};
    
    if (status) filters.status = status;
    if (role) filters.role = role;
    
    const verifications = await Verification.fetchAllRequests(filters);
    
    res.status(200).json(verifications);
  } catch (error) {
    console.error("Error fetching verifications:", error);
    res.status(500).json({ error: error.message });
  }
};

// Update verification status (admin only)
exports.updateVerificationStatus = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const { action, rejectionReason, adminId } = req.body;
    
    if (!action || (action !== "approve" && action !== "reject")) {
      return res.status(400).json({ error: "Valid action is required (approve or reject)" });
    }
    
    if (action === "reject" && !rejectionReason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }
    
    if (!adminId) {
      return res.status(400).json({ error: "Admin ID is required" });
    }
    
    const result = await Verification.processRequest(
      verificationId,
      action,
      adminId,
      rejectionReason
    );
    
    res.status(200).json({ message: result });
  } catch (error) {
    console.error("Error updating verification status:", error);
    res.status(500).json({ error: error.message });
  }
}; 