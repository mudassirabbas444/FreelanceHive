const { ObjectId, getDb } = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

class Buyer {
    static collectionName = "users";

    constructor({ name, email, username, password }) {
        this.name = name;
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = "Buyer";
        this.status = "Active";
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Buyer Signup
    static async signup(data) {
        const collection = getDb().collection(this.collectionName);

        // Check for unique email and username
        const existingUser = await collection.findOne({
            $or: [{ email: data.email }, { username: data.username }],
        });
        if (existingUser) {
            throw new Error("Email or username already exists.");
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);

        const buyer = new Buyer(data);
        const result = await collection.insertOne(buyer);
        return result.insertedId;
    }

    // Buyer Login
    static async login(email, password) {
        const collection = getDb().collection(this.collectionName);
    
        // Find user by email and role
        const buyer = await collection.findOne({ email, role: "Buyer" });
        if (!buyer) throw new Error("Invalid email or password.");
    
        // Check if the user is blocked or has a deleted status
        if (buyer.status === "blocked" || buyer.status === "deleted") {
            throw new Error("Your account is not active. Please contact support.");
        }
    
        // Verify password
        const isMatch = await bcrypt.compare(password, buyer.password);
        if (!isMatch) throw new Error("Invalid email or password.");
    
        const key = "mySuperSecretKey123!@#";
        // Generate token
        const token = jwt.sign(
            { id: buyer._id, role: buyer.role },
            key,
            { expiresIn: "1h" }
        );
    
        return { token, user: { id: buyer._id, name: buyer.name, role: buyer.role, status: buyer.status } };
    }
    
    static async fetchDashboardData(userId) {
        try {
            const db = getDb();
            const userIdStr = userId.toString();

            // Get order statistics from orders collection
            const orderStats = await db.collection("orders").aggregate([
                { $match: { buyerId: userIdStr } },
                {
                    $group: {
                        _id: null,
                        activeOrders: {
                            $sum: { 
                                $cond: [
                                    { $in: ["$status", ["Pending", "Active", "Modification Requested", "Disputed"]] }, 
                                    1, 
                                    0
                                ] 
                            }
                        },
                        completedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
                        },
                        canceledOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "Canceled"] }, 1, 0] }
                        },
                        totalSpent: {
                            $sum: { 
                                $cond: [
                                    { $eq: ["$status", "Completed"] }, 
                                    "$price", 
                                    0
                                ] 
                            }
                        }
                    }
                }
            ]).toArray();

            // Get request statistics from buyerRequests collection
            const requestStats = await db.collection("buyerRequests").aggregate([
                { $match: { buyerId: new ObjectId(userIdStr) } },
                {
                    $group: {
                        _id: null,
                        activeRequests: {
                            $sum: { 
                                $cond: [
                                    { $in: ["$status", ["pending", "open"]] }, 
                                    1, 
                                    0
                                ] 
                            }
                        },
                        completedRequests: {
                            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] }
                        },
                        rejectedRequests: {
                            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] }
                        },
                        totalRequests: { $sum: 1 }
                    }
                }
            ]).toArray();

            // Get review statistics
            const reviewStats = await db.collection("reviews").aggregate([
                { $match: { clientId: userIdStr } },
                {
                    $group: {
                        _id: null,
                        totalReviews: { $sum: 1 },
                        averageRating: { $avg: "$rating" }
                    }
                }
            ]).toArray();

            // Get message statistics
            const messageStats = await db.collection("messages").aggregate([
                { 
                    $match: { 
                        $or: [
                            { senderId: userIdStr },
                            { receiverId: userIdStr }
                        ]
                    } 
                },
                {
                    $group: {
                        _id: null,
                        totalMessages: { $sum: 1 },
                        activeChats: {
                            $addToSet: {
                                $concat: [
                                    { $min: ["$senderId", "$receiverId"] },
                                    "-",
                                    { $max: ["$senderId", "$receiverId"] }
                                ]
                            }
                        }
                    }
                }
            ]).toArray();

            // Log the results for debugging
            console.log("Order Stats:", orderStats[0]);
            console.log("Request Stats:", requestStats[0]);
            console.log("Review Stats:", reviewStats[0]);
            console.log("Message Stats:", messageStats[0]);

            return {
                orderStats: orderStats[0] || {
                    activeOrders: 0,
                    completedOrders: 0,
                    canceledOrders: 0,
                    totalSpent: 0
                },
                requestStats: requestStats[0] || {
                    activeRequests: 0,
                    completedRequests: 0,
                    rejectedRequests: 0,
                    totalRequests: 0
                },
                interactionStats: {
                    totalReviews: reviewStats[0]?.totalReviews || 0,
                    averageRating: reviewStats[0]?.averageRating?.toFixed(1) || 0,
                    totalMessages: messageStats[0]?.totalMessages || 0,
                    activeChats: messageStats[0]?.activeChats?.length || 0
                }
            };
        } catch (error) {
            console.error("Error fetching buyer dashboard data:", error);
            throw new Error(`Failed to fetch dashboard data: ${error.message}`);
        }
    }
}
module.exports = Buyer;
