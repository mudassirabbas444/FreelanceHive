const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

const COLLECTION_NAME = "buyerRequests";

class BuyerRequest {
    constructor({ buyerId, title, description, category, price, deliveryTime, status = "pending" }) {
        this.requestId = new ObjectId();
        this.buyerId = new ObjectId(buyerId);
        this.title = title;
        this.description = description;
        this.category = category;
        this.price = parseFloat(price);
        this.deliveryTime = parseInt(deliveryTime);
        this.status = status;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Create a new buyer request
    static async create(data) {
        try {
            const collection = db.collection(COLLECTION_NAME);
            const buyerRequest = new BuyerRequest(data);
            const result = await collection.insertOne(buyerRequest);
            return result.insertedId;
        } catch (error) {
            console.error("Error creating buyer request:", error);
            throw new Error("Database error");
        }
    }
    static async getAll(filters) {
        try {
            const collection = db.collection("buyerRequests");
            const query = { };
    
            // Filter by category
            if (filters.category) {
                query.category = filters.category;
            }
    
            // Filter by price range
            if (filters.minPrice) {
                query.price = { ...query.price, $gte: parseFloat(filters.minPrice) };
            }
            if (filters.maxPrice) {
                query.price = { ...query.price, $lte: parseFloat(filters.maxPrice) };
            }
    
            // Filter by creation date range
            if (filters.startDate) {
                query.createdAt = { ...query.createdAt, $gte: new Date(filters.startDate) };
            }
            if (filters.endDate) {
                query.createdAt = { ...query.createdAt, $lte: new Date(filters.endDate) };
            }
    
            // Filter by delivery time
            if (filters.deliveryTime) {
                query.deliveryTime = { $lte: parseInt(filters.deliveryTime) };
            }
    
            return await collection.find(query).toArray();
        } catch (error) {
            console.error("Error fetching buyer requests:", error);
            throw new Error("Database error");
        }
    }
    

    // Get buyer requests by buyer ID
    static async getByBuyerId(buyerId) {
        try {
            const collection = db.collection(COLLECTION_NAME);
            return await collection.find({ buyerId: new ObjectId(buyerId) }).toArray();
        } catch (error) {
            console.error("Error fetching buyer requests for buyerId:", buyerId, error);
            throw new Error("Database error");
        }
    }
    static async getById(requestId) {
        try {
            const collection = db.collection(COLLECTION_NAME);
            return await collection.findOne({ requestId: new ObjectId(requestId) });
        } catch (error) {
            console.error("Error fetching buyer request by ID:", error);
            throw new Error("Database error");
        }
    }
    static async updateStatus(requestId, status) {
        try {
            const collection = db.collection(COLLECTION_NAME);
            const result = await collection.updateOne(
                { requestId: new ObjectId(requestId) },
                { $set: { status, updatedAt: new Date() } }
            );
    
            return result.modifiedCount > 0;
        } catch (error) {
            console.error(`Error updating buyer request status to ${status}:`, error);
            throw new Error("Database error");
        }
    }
    
    static async updateRequestStatus(requestId, status, feedback = null) {
        try {
            // First, update the status using updateStatus method
            const statusUpdated = await this.updateStatus(requestId, status);
            
            if (!statusUpdated) {
                console.log("Failed to update status, request ID not found or already up to date.");
                return false;
            }
    
            // If feedback is provided, update the feedback
            const collection = db.collection(COLLECTION_NAME);
            const updateData = { updatedAt: new Date() };
    
            if (feedback) updateData.feedback = feedback;
    
            // Update feedback if provided
            const result = await collection.updateOne(
                { requestId: new ObjectId(requestId) },
                { $set: updateData }
            );
    
            if (result.modifiedCount > 0) {
                console.log("Request status and feedback updated successfully.");
                return true;
            } else {
                console.log("No changes made to feedback.");
                return false;
            }
        } catch (error) {
            console.error("Error updating request status or feedback:", error);
            throw new Error("Database error");
        }
    }
    
}

module.exports = BuyerRequest;
