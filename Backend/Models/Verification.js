const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class Verification {
    static collectionName = "verifications";
  
    constructor({
      userId,
      role, // 'Buyer' or 'Seller'
      documents = {
        governmentId: null,
        selfieWithId: null,
        addressProof: null,
        emailVerification: null,
        digitalSignature: null
      },
      status = "Pending", // Default status - can be "Pending", "Approved", "Rejected"
      rejectionReason = null,
      attemptCount = 1
    }) {
      this.userId = userId;
      this.role = role;
      this.documents = documents;
      this.status = status;
      this.rejectionReason = rejectionReason;
      this.attemptCount = attemptCount;
      this.submittedAt = new Date();
      this.updatedAt = new Date();
    }
  
    // Submit Verification Request
    static async submitRequest(data) {
      const collection = db.collection(this.collectionName);
  
      // Check if user already has a pending request
      const existingRequest = await collection.findOne({
        userId: new ObjectId(data.userId),
        status: "Pending",
      });
      
      if (existingRequest) {
        throw new Error("A verification request is already pending.");
      }
  
      // Check if user has reached the maximum attempts (3)
      const rejectedRequests = await collection.countDocuments({
        userId: new ObjectId(data.userId),
        status: "Rejected"
      });
      
      if (rejectedRequests >= 3) {
        throw new Error("Maximum verification attempts reached (3). Please contact support.");
      }
      
      // Create new verification request
      const request = new Verification(data);
      const result = await collection.insertOne(request);
      return result.insertedId;
    }
    
    // Resubmit verification after rejection
    static async resubmitRequest(userId, newDocuments) {
      const collection = db.collection(this.collectionName);
      
      // Find the most recent rejected request for this user
      const rejectedRequest = await collection.findOne(
        { userId: new ObjectId(userId), status: "Rejected" },
        { sort: { updatedAt: -1 } }
      );
      
      if (!rejectedRequest) {
        throw new Error("No rejected request found to resubmit.");
      }
      
      // Check attempt count
      if (rejectedRequest.attemptCount >= 3) {
        throw new Error("Maximum verification attempts reached (3). Please contact support.");
      }
      
      // Create new request based on previous one with updated attempt count
      const request = new Verification({
        userId: rejectedRequest.userId,
        role: rejectedRequest.role,
        documents: { ...rejectedRequest.documents, ...newDocuments },
        attemptCount: rejectedRequest.attemptCount + 1
      });
      
      const result = await collection.insertOne(request);
      return result.insertedId;
    }
  
    // Fetch All Verification Requests (Admin Only)
    static async fetchAllRequests(filters = {}) {
      const collection = db.collection(this.collectionName);
  
      const query = {};
      if (filters.status) query.status = filters.status;
      if (filters.role) query.role = filters.role;
      
      // Join with users collection to get user details
      const pipeline = [
        { $match: query },
        { $sort: { submittedAt: -1 } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        {
          $project: {
            _id: 1,
            userId: 1,
            role: 1,
            documents: 1,
            status: 1,
            rejectionReason: 1,
            attemptCount: 1,
            submittedAt: 1,
            updatedAt: 1,
            "user.name": 1,
            "user.email": 1
          }
        }
      ];
      
      return await collection.aggregate(pipeline).toArray();
    }
  
    // Get Verification Status for a User
    static async getUserVerificationStatus(userId) {
      const collection = db.collection(this.collectionName);
      
      // Get the most recent verification request
      const verification = await collection.findOne(
        { userId: new ObjectId(userId) },
        { sort: { submittedAt: -1 } }
      );
      
      if (!verification) {
        return { status: "Not Submitted", attemptCount: 0 };
      }
      
      return {
        status: verification.status,
        rejectionReason: verification.rejectionReason,
        attemptCount: verification.attemptCount,
        submittedAt: verification.submittedAt,
        updatedAt: verification.updatedAt
      };
    }
  
    // Approve or Reject Verification Request
    static async processRequest(requestId, action, adminId, rejectionReason = null) {
      const collection = db.collection(this.collectionName);
  
      if (action !== "approve" && action !== "reject") {
        throw new Error("Invalid action. Must be 'approve' or 'reject'.");
      }
      
      const status = action === "approve" ? "Approved" : "Rejected";
      
      const updateData = { 
        status, 
        updatedAt: new Date(), 
        processedBy: new ObjectId(adminId) 
      };
      
      if (action === "reject" && rejectionReason) {
        updateData.rejectionReason = rejectionReason;
      }
      
      const result = await collection.updateOne(
        { _id: new ObjectId(requestId) },
        { $set: updateData }
      );
  
      if (result.matchedCount === 0) {
        throw new Error("Verification request not found or update failed.");
      }
  
      // Get the updated verification
      const verification = await collection.findOne({ _id: new ObjectId(requestId) });
      
      // Update user's verification status in users collection
      await db.collection("users").updateOne(
        { _id: new ObjectId(verification.userId) },
        { $set: { 
            verificationStatus: status,
            isVerified: status === "Approved"
          } 
        }
      );
  
      return action === "approve" ? "Verification approved." : "Verification rejected.";
    }
  }
  module.exports = Verification;  