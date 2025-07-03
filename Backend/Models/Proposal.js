const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

const COLLECTION_NAME = "proposals";

class Proposal {
    constructor({ sellerId, buyerRequestId, gigId, price, deliveryTime, message, status = "submitted" }) {
        this.proposalId = new ObjectId();
        this.sellerId = new ObjectId(sellerId);
        this.buyerRequestId = new ObjectId(buyerRequestId);
        this.gigId = new ObjectId(gigId);
        this.price = parseFloat(price);
        this.deliveryTime = parseInt(deliveryTime);
        this.message = message;
        this.status = status;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Create a new proposal
    static async create(data) {
        try {
            const collection = db.collection(COLLECTION_NAME);
            const proposal = new Proposal(data);
            const result = await collection.insertOne(proposal);
            return result.insertedId;
        } catch (error) {
            console.error("Error creating proposal:", error);
            throw new Error("Database error");
        }
    }

    // Get all proposals for a specific buyer request
    static async getByBuyerRequestId(buyerRequestId) {
        try {
            const collection = db.collection(COLLECTION_NAME);
            return await collection.find({ buyerRequestId: new ObjectId(buyerRequestId) }).toArray();
        } catch (error) {
            console.error("Error fetching proposals:", error);
            throw new Error("Database error");
        }
    }

    static async getProposalById(proposalId) {
        const collection = db.collection("proposals");
        return await collection.findOne({ _id: new ObjectId(proposalId) });
    }

    static async updateProposalStatus(proposalId, status) {
        const collection = db.collection("proposals");
        return await collection.updateOne(
            { _id: new ObjectId(proposalId) },
            { $set: { status, updatedAt: new Date() } }
        );
    }
    static async checkExistingProposal(sellerId, buyerRequestId) {
        try {
            // Validate IDs before converting
            if (!ObjectId.isValid(sellerId) || !ObjectId.isValid(buyerRequestId)) {
                console.error("Invalid ObjectId format:", { sellerId, buyerRequestId });
                return null; // Return null instead of crashing
            }
    
            const collection = db.collection(COLLECTION_NAME);
            return await collection.findOne({
                sellerId: new ObjectId(sellerId),
                buyerRequestId: new ObjectId(buyerRequestId),
            });
        } catch (error) {
            console.error("Error checking existing proposal:", error);
            throw new Error("Database error");
        }
    }

    static async updateStatus(requestId, status, feedback = null) {
        try {
            const collection = db.collection("buyerRequests");
            const updateData = { status, updatedAt: new Date() };
            if (feedback) updateData.feedback = feedback;
    
            await collection.updateOne({ _id: requestId }, { $set: updateData });
        } catch (error) {
            console.error("Error updating request status:", error);
            throw new Error("Database error");
        }
    }
    
}

module.exports = Proposal;
