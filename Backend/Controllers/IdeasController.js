const Idea = require("../Models/Idea");

exports.createIdea = async (req, res) => {
    try {
        const { title, description, category, buyerId, buyerName } = req.body;

        if (!title || !description || !category || !buyerId || !buyerName) {
            return res.status(400).json({ error: "Title, description, category, buyerId, and buyerName are required" });
        }

        const idea = await Idea.create({ 
            title, 
            description, 
            category, 
            buyerId,
            buyerName 
        });
        
        res.status(201).json({ 
            message: "Idea created successfully", 
            idea 
        });

    } catch (error) {
        console.error("Error creating idea:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getIdeas = async (req, res) => {
    try {
        const { category } = req.query;

        const filters = {
            category
        };

        const ideas = await Idea.getAll(filters);
        res.status(200).json(ideas);
    } catch (error) {
        console.error("Error fetching ideas:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getIdeasByBuyerId = async (req, res) => {
    try {
        const { buyerId } = req.params;
        const ideas = await Idea.getByBuyerId(buyerId);
        res.status(200).json(ideas);
    } catch (error) {
        console.error("Error fetching ideas:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.getIdeaById = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const idea = await Idea.getById(ideaId);

        if (!idea) {
            return res.status(404).json({ error: "Idea not found" });
        }

        res.status(200).json(idea);
    } catch (error) {
        console.error("Error fetching idea details:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.closeIdea = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const updated = await Idea.updateStatus(ideaId, "closed");

        if (!updated) {
            return res.status(404).json({ error: "Idea not found" });
        }

        res.status(200).json({ message: "Idea closed successfully" });
    } catch (error) {
        console.error("Error closing idea:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// "Delete" an idea (Change status to 'deleted')
exports.deleteIdea = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const updated = await Idea.updateStatus(ideaId, "deleted");

        if (!updated) {
            return res.status(404).json({ error: "Idea not found" });
        }

        res.status(200).json({ message: "Idea deleted successfully" });
    } catch (error) {
        console.error("Error deleting idea:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.approveIdea = async (req, res) => {
    try {
        const { ideaId } = req.params;
        await Idea.updateIdeaStatus(ideaId, "open");
        res.status(200).json({ message: "Idea approved successfully" });
    } catch (error) {
        console.error("Error approving idea:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.rejectIdea = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const { feedback } = req.body;
        if (!feedback) return res.status(400).json({ error: "Feedback is required for rejection" });

        await Idea.updateIdeaStatus(ideaId, "rejected", feedback);
        res.status(200).json({ message: "Idea rejected with feedback" });
    } catch (error) {
        console.error("Error rejecting idea:", error);
        res.status(500).json({ error: "Server error" });
    }
};

exports.addReply = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const { sellerId, sellerName, content } = req.body;

        const reply = await Idea.addReply(ideaId, { 
            userId: sellerId, 
            sellerName, 
            description: content
        }); 
        
        res.status(201).json({ 
            message: "Reply submitted successfully. Please download, sign, and upload the agreement within 24 hours.",
            reply 
        });
    } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

exports.uploadAgreement = async (req, res) => {
    try {
        const { ideaId, replyId } = req.params;
        
        if (!req.file) {
            return res.status(400).json({ error: "No agreement PDF uploaded" });
        }

        // Convert the file path to the correct URL format
        const agreementPdf = `/agreements/${req.file.filename}`;
        const updated = await Idea.updateReplyWithAgreement(ideaId, replyId, agreementPdf);

        if (!updated) {
            return res.status(404).json({ error: "Reply not found or already completed" });
        }

        res.status(200).json({ 
            message: "Agreement uploaded successfully",
            agreementPdf 
        });
    } catch (error) {
        console.error("Error uploading agreement:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Get all replies for an idea
exports.getReplies = async (req, res) => {
    try {
        const { ideaId } = req.params;
        const replies = await Idea.getReplies(ideaId); 
        res.status(200).json(replies);
    } catch (error) {
        console.error("Error fetching replies:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Delete a reply
exports.deleteReply = async (req, res) => {
    try {
        const { ideaId, replyId } = req.params;
        const result = await Idea.deleteReply(ideaId, replyId);
        
        if (result) {
            res.status(200).json({ message: "Reply deleted successfully" });
        } else {
            res.status(404).json({ error: "Reply not found" });
        }
    } catch (error) {
        console.error("Error deleting reply:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Update a reply
exports.updateReply = async (req, res) => {
    try {
        const { ideaId, replyId } = req.params;
        const { name, description } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }

        const result = await Idea.updateReply(ideaId, replyId, { name, description });
        
        if (result) {
            res.status(200).json({ message: "Reply updated successfully" });
        } else {
            res.status(404).json({ error: "Reply not found" });
        }
    } catch (error) {
        console.error("Error updating reply:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};
