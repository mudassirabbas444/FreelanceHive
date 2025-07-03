const Proposal = require("../Models/Proposal");
const Order = require("../Models/Order");
const BuyerRequest = require("../Models/BuyerRequest");
// Submit a proposal
exports.submitProposal = async (req, res) => {
    try {
        const { sellerId, buyerRequestId, gigId, price, deliveryTime, message } = req.body;

        if (!sellerId || !buyerRequestId || !gigId || !price || !deliveryTime || !message) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const proposalId = await Proposal.create({
            sellerId,
            buyerRequestId,
            gigId,
            price,
            deliveryTime,
            message,
            status: "submitted",
        });

        res.status(201).json({ message: "Proposal submitted successfully", proposalId });
    } catch (error) {
        console.error("Error submitting proposal:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// Get all proposals for a specific buyer request
exports.getProposalsByBuyerRequestId = async (req, res) => {
    try {
        const { requestId } = req.params;
        const proposals = await Proposal.getByBuyerRequestId(requestId);
        res.status(200).json(proposals);
    } catch (error) {
        console.error("Error fetching proposals:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.updateProposalStatus = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const { status } = req.body;

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({ error: "Invalid status" });
        }

        // Fetch proposal details
        const proposal = await Proposal.getProposalById(proposalId);
        if (!proposal) {
            return res.status(404).json({ error: "Proposal not found" });
        }

        // Fetch buyer request details
        const buyerRequest = await BuyerRequest.getById(proposal.buyerRequestId);
        if (!buyerRequest) {
            return res.status(404).json({ error: "Buyer request not found" });
        }

        // If accepted, create an order
        if (status === "accepted") {
            const orderDetails = {
                gigId: proposal.gigId.toString(),
                buyerId: buyerRequest.buyerId.toString(),
                sellerId: proposal.sellerId.toString(),
                title: buyerRequest.title,
                description: buyerRequest.description,
                category: buyerRequest.category,
                price: proposal.price, 
                deliveryTime: proposal.deliveryTime, 
                status: "Pending", 
            };
        
        

            // Create an order using the proposal and buyer request data
            const orderId = await Order.createOrder(orderDetails);
            console.log(`✅ Order created successfully: ${orderId}`);
        }

        // Update proposal status
        await Proposal.updateProposalStatus(proposalId, status);

        // Update the buyer request status
        if (status === "accepted") {
            await BuyerRequest.updateRequestStatus(buyerRequest.requestId, "accepted");
        } else if (status === "rejected") {
            await BuyerRequest.updateRequestStatus(buyerRequest.requestId, "rejected");
        }

        res.status(200).json({ message: `Proposal ${status} successfully` });
    } catch (error) {
        console.error("Error updating proposal status:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.checkExistingProposal = async (req, res) => {
    try {
        const { sellerId, buyerRequestId } = req.params;

        if (!sellerId || !buyerRequestId) {
            return res.status(400).json({ error: "sellerId and buyerRequestId are required" });
        }

        const proposal = await Proposal.checkExistingProposal(sellerId, buyerRequestId);
        res.status(200).json(proposal ? proposal : null);
    } catch (error) {
        console.error("Error checking existing proposal:", error);
        res.status(500).json({ error: "Server error" });
    }
};

