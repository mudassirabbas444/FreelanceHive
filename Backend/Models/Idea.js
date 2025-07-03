const { MongoClient, ObjectId } = require("mongodb");
const { generateSellerAgreement } = require('../utils/agreementGenerator');

// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 50,
    connectTimeoutMS: 5000,
    serverSelectionTimeoutMS: 5000
});

const dbName = "freelancing_platform";
let db;

// Initialize database connection
async function initializeDb() {
    if (!db) {
        try {
            await client.connect();
            db = client.db(dbName);
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error;
        }
    }
    return db;
}

const COLLECTION_NAME = "ideas";

class Idea {
    constructor({ title, description, category, buyerId, buyerName }) {
        this.ideaId = new ObjectId();
        this.title = title;
        this.description = description;
        this.category = category;
        this.buyerId = new ObjectId(buyerId);
        this.buyerName = buyerName;
        this.status = "open";
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this.replies = []; // Initialize empty replies array
        this.agreementUrl = null; // Initialize agreement URL
    }

    // Validate idea data
    static validateIdeaData(data) {
        const errors = [];
        
        if (!data.title || data.title.trim().length < 5) {
            errors.push("Title must be at least 5 characters long");
        }
        
        if (!data.description || data.description.trim().length < 20) {
            errors.push("Description must be at least 20 characters long");
        }
        
        if (!data.category || data.category.trim().length === 0) {
            errors.push("Category is required");
        }
        
        if (!data.buyerId || !ObjectId.isValid(data.buyerId)) {
            errors.push("Valid Buyer ID is required");
        }
        
        return errors;
    }

    // Create a new idea
    static async create(data) {
        try {
            const database = await initializeDb();
            const errors = this.validateIdeaData(data);
            if (errors.length > 0) {
                throw new Error(errors.join(", "));
            }

            const idea = new Idea(data);
            
            // Generate agreement PDF
            const agreement = await generateSellerAgreement(idea);
            idea.agreementUrl = agreement.url;

            const collection = database.collection(COLLECTION_NAME);
            const result = await collection.insertOne(idea);
            return { id: result.insertedId, ...idea };
        } catch (error) {
            console.error("Error creating idea:", error);
            throw error;
        }
    }

// Get all ideas with filters (only status = "open")
    static async getAll(filters = {}) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
        
        const query = { status: "open" };

            if (filters.category) {
                query.category = filters.category;
            }

            return await collection.find(query).toArray();
        } catch (error) {
            console.error("Error fetching ideas:", error);
            throw error;
        }
    }


    // Get ideas by buyer ID
    static async getByBuyerId(buyerId) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(buyerId)) {
                throw new Error("Invalid buyer ID");
            }

            return await collection.find({
                buyerId: new ObjectId(buyerId),
                isDeleted: { $ne: true }
            }).toArray();
        } catch (error) {
            console.error("Error fetching buyer ideas:", error);
            throw error;
        }
    }

    // Get single idea by ID
    static async getById(ideaId) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(ideaId)) {
                throw new Error("Invalid idea ID");
            }

            return await collection.findOne({
                ideaId: new ObjectId(ideaId),
                isDeleted: { $ne: true }
            });
        } catch (error) {
            console.error("Error fetching idea:", error);
            throw error;
        }
    }

    // Update idea
    static async update(ideaId, updateData) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            const allowedUpdates = ['title', 'description', 'category', 'status'];
            const updates = {};

            Object.keys(updateData).forEach(key => {
                if (allowedUpdates.includes(key)) {
                    updates[key] = updateData[key];
                }
            });

            updates.updatedAt = new Date();

            const result = await collection.updateOne(
                { ideaId: new ObjectId(ideaId) },
                { $set: updates }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea not found");
            }

            return await this.getById(ideaId);
        } catch (error) {
            console.error("Error updating idea:", error);
            throw error;
        }
    }

    // Soft delete idea
    static async delete(ideaId) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            const result = await collection.updateOne(
                { ideaId: new ObjectId(ideaId) },
                { 
                    $set: {
                        isDeleted: true,
                        deletedAt: new Date(),
                        status: 'deleted'
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea not found");
            }

            return true;
        } catch (error) {
            console.error("Error deleting idea:", error);
            throw error;
        }
    }

    // Change idea status
    static async updateStatus(ideaId, status, feedback = null) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            const allowedStatuses = ['pending', 'approved', 'rejected', 'closed', 'deleted'];
            
            if (!ObjectId.isValid(ideaId)) {
                throw new Error("Invalid idea ID");
            }
            
            if (!allowedStatuses.includes(status)) {
                throw new Error("Invalid status");
            }

            const updateData = {
                status,
                updatedAt: new Date(),
                [`${status}At`]: new Date()
            };

            if (feedback) {
                updateData.feedback = feedback;
            }

            const result = await collection.updateOne(
                { ideaId: new ObjectId(ideaId) },
                { $set: updateData }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea not found");
            }

            return await this.getById(ideaId);
        } catch (error) {
            console.error("Error updating idea status:", error);
            throw error;
        }
    }

    // Add a reply to an idea
    static async addReply(ideaId, { userId, sellerName, description }) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(ideaId)) {
                throw new Error("Invalid idea ID");
            }

            const reply = {
                replyId: new ObjectId(),
                userId: new ObjectId(userId),
                sellerName,
                description,
                status: 'pending_agreement',
                agreementDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
                agreementPdf: null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            const result = await collection.updateOne(
                { ideaId: new ObjectId(ideaId) },
                { $push: { replies: reply } }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea not found");
            }

            return reply;
        } catch (error) {
            console.error("Error adding reply:", error);
            throw error;
        }
    }

    // Update reply with signed agreement
    static async updateReplyWithAgreement(ideaId, replyId, agreementPdf) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(ideaId) || !ObjectId.isValid(replyId)) {
                throw new Error("Invalid ID provided");
            }

            const result = await collection.updateOne(
                { 
                    ideaId: new ObjectId(ideaId),
                    "replies.replyId": new ObjectId(replyId)
                },
                { 
                    $set: { 
                        "replies.$.agreementPdf": agreementPdf,
                        "replies.$.status": "completed",
                        "replies.$.updatedAt": new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea or reply not found");
            }

            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error updating reply with agreement:", error);
            throw error;
        }
    }

    // Get all replies for an idea
    static async getReplies(ideaId) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(ideaId)) {
                throw new Error("Invalid idea ID");
            }

            const idea = await collection.findOne(
                { ideaId: new ObjectId(ideaId) },
                { projection: { replies: 1 } }
            );

            if (!idea) {
                throw new Error("Idea not found");
            }

            return idea.replies || [];
        } catch (error) {
            console.error("Error fetching replies:", error);
            throw error;
        }
    }

    // Delete a reply
    static async deleteReply(ideaId, replyId) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(ideaId) || !ObjectId.isValid(replyId)) {
                throw new Error("Invalid ID provided");
            }

            const result = await collection.updateOne(
                { ideaId: new ObjectId(ideaId) },
                { 
                    $pull: { replies: { replyId: new ObjectId(replyId) } },
                    $set: { updatedAt: new Date() }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea not found");
            }

            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error deleting reply:", error);
            throw error;
        }
    }

    // Update a reply
    static async updateReply(ideaId, replyId, { name, description }) {
        try {
            const database = await initializeDb();
            const collection = database.collection(COLLECTION_NAME);
            
            if (!ObjectId.isValid(ideaId) || !ObjectId.isValid(replyId)) {
                throw new Error("Invalid ID provided");
            }

            const result = await collection.updateOne(
                { 
                    ideaId: new ObjectId(ideaId),
                    "replies.replyId": new ObjectId(replyId)
                },
                { 
                    $set: { 
                        "replies.$.name": name,
                        "replies.$.description": description,
                        "replies.$.updatedAt": new Date(),
                        updatedAt: new Date()
                    }
                }
            );

            if (result.matchedCount === 0) {
                throw new Error("Idea or reply not found");
            }

            return result.modifiedCount > 0;
        } catch (error) {
            console.error("Error updating reply:", error);
            throw error;
        }
    }
}

module.exports = Idea;
