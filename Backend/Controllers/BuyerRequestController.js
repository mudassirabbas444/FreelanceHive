const BuyerRequest = require("../Models/BuyerRequest");

exports.createBuyerRequest = async (req, res) => {
    try {
        const { buyerId, title, description, category, price, deliveryTime } = req.body;

        if (!buyerId || !title || !description || !category || !price || !deliveryTime) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const requestId = await BuyerRequest.create({ buyerId, title, description, category, price, deliveryTime });
        res.status(201).json({ message: "Buyer request created successfully", requestId });

    } catch (error) {
        console.error("Error creating buyer request:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getBuyerRequests = async (req, res) => {
    try {
        const { category, minPrice, maxPrice, startDate, endDate, deliveryTime } = req.query;

        const filters = {
            category,
            minPrice,
            maxPrice,
            startDate,
            endDate,
            deliveryTime
        };

        const buyerRequests = await BuyerRequest.getAll(filters);
        res.status(200).json(buyerRequests);
    } catch (error) {
        console.error("Error fetching buyer requests:", error);
        res.status(500).json({ error: "Server error" });
    }
};


exports.getBuyerRequestsByBuyerId = async (req, res) => {
    try {
        const { buyerId } = req.params;
        const requests = await BuyerRequest.getByBuyerId(buyerId);
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching buyer requests:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getBuyerRequestById = async (req, res) => {
    try {
        const { requestId } = req.params;
        const request = await BuyerRequest.getById(requestId);

        if (!request) {
            return res.status(404).json({ error: "Buyer request not found" });
        }

        res.status(200).json(request);
    } catch (error) {
        console.error("Error fetching buyer request details:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.closeBuyerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const updated = await BuyerRequest.updateStatus(requestId, "closed");

        if (!updated) {
            return res.status(404).json({ error: "Buyer request not found" });
        }

        res.status(200).json({ message: "Buyer request closed successfully" });
    } catch (error) {
        console.error("Error closing buyer request:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// "Delete" a buyer request (Change status to 'deleted')
exports.deleteBuyerRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const updated = await BuyerRequest.updateStatus(requestId, "deleted");

        if (!updated) {
            return res.status(404).json({ error: "Buyer request not found" });
        }

        res.status(200).json({ message: "Buyer request deleted successfully" });
    } catch (error) {
        console.error("Error deleting buyer request:", error);
        res.status(500).json({ error: "Server error" });
    }};

    exports.approveRequest = async (req, res) => {
        try {
            const { requestId } = req.params;
            await BuyerRequest.updateRequestStatus(requestId, "open");
            res.status(200).json({ message: "Request approved successfully" });
        } catch (error) {
            console.error("Error approving request:", error);
            res.status(500).json({ error: "Server error" });
        }
    };
    
    exports.rejectRequest = async (req, res) => {
        try {
            const { requestId } = req.params;
            const { feedback } = req.body;
            if (!feedback) return res.status(400).json({ error: "Feedback is required for rejection" });
    
            await BuyerRequest.updateRequestStatus(requestId, "rejected", feedback);
            res.status(200).json({ message: "Request rejected with feedback" });
        } catch (error) {
            console.error("Error rejecting request:", error);
            res.status(500).json({ error: "Server error" });
        }
    };
    