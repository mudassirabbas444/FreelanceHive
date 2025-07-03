const ShareholderRequest = require("../Models/ShareholderRequest");
const { generateShareholderAgreement } = require('../utils/shareholderAgreementGenerator');
const fs = require('fs');
const path = require('path');
const Idea = require("../Models/Idea");

exports.createShareholderRequest = async (req, res) => {
    try {
        const {
            buyerId,
            sellerId,
            ideaId,
            replyId,
            ideaTitle,
            contributionType,
            contributionDetails,
            equityRequested,
            buyerName,
            sellerName
        } = req.body;

        // Generate the shareholder agreement PDF
        const agreementData = {
            buyerName,
            sellerName,
            ideaTitle,
            contributionType,
            contributionDetails,
            equityRequested
        };

        const agreement = await generateShareholderAgreement(agreementData);

        const shareholderRequest = await ShareholderRequest.create({
            buyerId,
            sellerId,
            ideaId,
            replyId,
            ideaTitle,
            contributionType,
            contributionDetails,
            equityRequested,
            agreementPdf: agreement.url,
            pdfPath: agreement.path
        });

        res.status(201).json({ 
            message: "Shareholder request created successfully", 
            shareholderRequest,
            agreementPdf: agreement.url
        });
    } catch (error) {
        console.error("Error creating shareholder request:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.getShareholderRequestsByBuyer = async (req, res) => {
    try {
        const { buyerId } = req.params;
        const requests = await ShareholderRequest.getByBuyerId(buyerId);
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching shareholder requests:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.getShareholderRequestsBySeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const requests = await ShareholderRequest.getBySellerId(sellerId);
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching shareholder requests:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.getShareholderRequestByReplyId = async (req, res) => {
    try {
        const { replyId } = req.params;
        console.log('Getting shareholder request for replyId:', replyId); // Debug log

        if (!replyId) {
            return res.status(400).json({ message: "Reply ID is required" });
        }

        const request = await ShareholderRequest.findByReplyId(replyId);
        console.log('Found request:', request); // Debug log
        
        if (!request) {
            return res.status(404).json({ message: "No shareholder request found for this reply" });
        }
        
        res.status(200).json(request);
    } catch (error) {
        console.error("Error fetching shareholder request:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.updateShareholderRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, signedAgreementPdf, signedPdfPath } = req.body;

        console.log(`Updating shareholder request ${requestId} status to: ${status}`);
        console.log('Signed PDF Info:', { signedAgreementPdf, signedPdfPath });

        if (!status) {
            return res.status(400).json({ error: "Status is required" });
        }

        const updateData = { 
            status,
            updatedAt: new Date()
        };

        // Add signed PDF information if provided
        if (signedAgreementPdf && signedPdfPath) {
            updateData.signedAgreementPdf = signedAgreementPdf;
            updateData.signedPdfPath = signedPdfPath;
        }

        const updatedRequest = await ShareholderRequest.updateStatus(requestId, updateData);

        // If the request is being finalized, update the idea status
        if (status === 'finalized') {
            try {
                await Idea.updateStatus(updatedRequest.ideaId.toString(), 'finalized');
                console.log(`Updated idea ${updatedRequest.ideaId} status to finalized`);
            } catch (error) {
                console.error('Error updating idea status:', error);
                // Don't throw error here, as the shareholder request update was successful
            }
        }

        res.status(200).json({ message: "Status updated successfully", updatedRequest });
    } catch (error) {
        console.error("Error updating shareholder request status:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.uploadPDF = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded'
            });
        }

        const { requestId, userId, role } = req.body;
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }

        // Get the request
        const request = await ShareholderRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Shareholder request not found'
            });
        }

        // Create the URL and path for the uploaded PDF
        const pdfUrl = `/agreements/${req.file.filename}`;
        const pdfPath = `uploads/agreements/${req.file.filename}`;

        // Determine update data based on role
        let updateData = {
            status: 'completed',
            updatedAt: new Date()
        };

        // If role is Buyer, always store in buyer fields
        if (role === 'Buyer') {
            updateData = {
                ...updateData,
                buyerSignedAgreementPdf: pdfUrl,
                buyerSignedPdfPath: pdfPath,
                buyerSignedAt: new Date(),
                status: 'agreementPending' // Change status to indicate waiting for seller
            };
        } 
        // If role is Seller, store in seller fields and finalize
        else if (role === 'Seller') {
            updateData = {
                ...updateData,
                sellerSignedAgreementPdf: pdfUrl,
                sellerSignedPdfPath: pdfPath,
                sellerSignedAt: new Date(),
                status: 'completed'
            };
        }

        console.log('Updating request with data:', updateData); // Debug log

        const updatedRequest = await ShareholderRequest.updateStatus(requestId, updateData);

        res.status(200).json({
            success: true,
            message: 'PDF uploaded successfully',
            request: updatedRequest
        });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        
        // Delete the uploaded file in case of error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (err) {
                console.error('Error deleting file after error:', err);
            }
        }

        // Send proper error response
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading PDF'
        });
    }
};

exports.acceptShareholderRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        
        // Generate a new agreement PDF for the accepted request
        const request = await ShareholderRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Shareholder request not found' });
        }

        const agreementData = {
            buyerName: request.buyerName,
            sellerName: request.sellerName,
            ideaTitle: request.ideaTitle,
            contributionType: request.contributionType,
            contributionDetails: request.contributionDetails,
            equityRequested: request.equityRequested,
            isAccepted: true
        };

        const agreement = await generateShareholderAgreement(agreementData);

        // Update the request with the new agreement and change status to accepted
        const updateData = {
            status: 'accepted',
            agreementPdf: agreement.url,
            pdfPath: agreement.path
        };

        const updatedRequest = await ShareholderRequest.updateStatus(requestId, updateData);
        
        res.status(200).json({ 
            message: 'Shareholder request accepted successfully',
            updatedRequest,
            agreementPdf: agreement.url
        });
    } catch (error) {
        console.error('Error accepting shareholder request:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};

exports.uploadSignedAgreement = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No PDF file uploaded' });
        }

        const requestId = req.body.requestId;
        if (!requestId) {
            return res.status(400).json({ message: 'Request ID is required' });
        }

        const request = await ShareholderRequest.findById(requestId);
        if (!request) {
            return res.status(404).json({ message: 'Shareholder request not found' });
        }

        if (request.status !== 'accepted') {
            return res.status(400).json({ message: 'Request must be accepted before uploading signed agreement' });
        }

        // Create separate directories for buyer and seller agreements
        const buyerAgreementDir = 'uploads/shareholder-agreements/buyer';
        const sellerAgreementDir = 'uploads/shareholder-agreements/seller';

        // Ensure directories exist
        if (!fs.existsSync(buyerAgreementDir)) {
            fs.mkdirSync(buyerAgreementDir, { recursive: true });
        }
        if (!fs.existsSync(sellerAgreementDir)) {
            fs.mkdirSync(sellerAgreementDir, { recursive: true });
        }

        // Move the uploaded file to the appropriate directory
        const timestamp = Date.now();
        const newFileName = `agreement_${requestId}_${timestamp}.pdf`;
        const targetDir = request.buyerId.toString() === req.user.id ? buyerAgreementDir : sellerAgreementDir;
        const targetPath = path.join(targetDir, newFileName);
        
        fs.renameSync(req.file.path, targetPath);

        const pdfUrl = `/shareholder-agreements/${request.buyerId.toString() === req.user.id ? 'buyer' : 'seller'}/${newFileName}`;
        const pdfPath = targetPath;

        // Update the request with the signed PDF and change status to completed
        const updateData = {
            status: 'completed',
            signedAgreementPdf: pdfUrl,
            signedPdfPath: pdfPath,
            signedBy: request.buyerId.toString() === req.user.id ? 'buyer' : 'seller'
        };

        const updatedRequest = await ShareholderRequest.updateStatus(requestId, updateData);
        
        res.status(200).json({ 
            message: 'Signed agreement uploaded successfully',
            updatedRequest,
            signedPdfUrl: pdfUrl
        });
    } catch (error) {
        console.error('Error uploading signed agreement:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
}; 