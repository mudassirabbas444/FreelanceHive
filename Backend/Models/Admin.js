const { ObjectId, getDb } = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

class Admin {
    static collectionName = "users";

    constructor({ name, email, username, password, role }) {
        this.name = name;
        this.email = email;
        this.username = username;
        this.password = password;
        this.role = role;
        this.status = "Active";
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Admin Creation by Another Admin
    static async create(data) {
        const collection = getDb().collection(this.collectionName);

        // Check for unique email
        const existingAdmin = await collection.findOne({ email: data.email });
        if (existingAdmin) {
            throw new Error("Admin with this email already exists.");
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        data.password = await bcrypt.hash(data.password, salt);

        const admin = new Admin(data);
        const result = await collection.insertOne(admin);
        return result.insertedId;
    }

    // Admin Login
    static async login(email, password) {
        const collection = getDb().collection(this.collectionName);

        // Find user by email and role
        const admin = await collection.findOne({ email, role: "Admin" });
        if (!admin) throw new Error("Invalid email or password.");
        if (admin.status === "blocked" || admin.status === "deleted") {
            throw new Error("Your account is not active. Please contact support.");
        }
    
        // Verify password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) throw new Error("Invalid email or password.");

        const key="mySuperSecretKey123!@#";
                // Generate token

        // Generate token
        const token = jwt.sign(
            { id: admin._id, role: admin.role },
             key,
            { expiresIn: "1h" }
        );

        return { token, user: { id: admin._id, name: admin.name, role: admin.role } };
    }

    static async fetchDashboardData(userId, startDate = null, endDate = null) {
        try {
            const db = getDb();
            const userIdStr = userId.toString();

            // Create date filter if date range is provided
            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }

            // Get gig statistics
            const gigStats = await db.collection("gigs").aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalGigs: { $sum: 1 },
                        activeGigs: {
                            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                        },
                        pausedGigs: {
                            $sum: { $cond: [{ $eq: ["$status", "paused"] }, 1, 0] }
                        },
                        deletedGigs: {
                            $sum: { $cond: [{ $eq: ["$status", "deleted"] }, 1, 0] }
                        },
                        totalImpressions: { $sum: "$impressions" },
                        totalClicks: { $sum: "$clicks" }
                    }
                }
            ]).toArray();

            // Get order statistics
            const orderStats = await db.collection("orders").aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        inProgressOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] }
                        },
                        completedOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                        },
                        canceledOrders: {
                            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] }
                        },
                        totalOrders: { $sum: 1 },
                        averageRating: { $avg: "$rating" }
                    }
                }
            ]).toArray();

            // Get payment statistics
            const paymentStats = await db.collection("transactions").aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalPayments: { $sum: 1 },
                        pendingPayments: {
                            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                        },
                        completedPayments: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                        },
                        canceledPayments: {
                            $sum: { $cond: [{ $eq: ["$status", "canceled"] }, 1, 0] }
                        },
                        totalRevenue: {
                            $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0] }
                        }
                    }
                }
            ]).toArray();

            // Get escrow balance
            const escrowBalance = await db.collection("wallets").aggregate([
                {
                    $group: {
                        _id: null,
                        escrowBalance: { $sum: "$escrowBalance" }
                    }
                }
            ]).toArray();

            // Get user statistics
            const userStats = await db.collection("users").aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        activeUsers: {
                            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                        },
                        blockedUsers: {
                            $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] }
                        },
                        deletedUsers: {
                            $sum: { $cond: [{ $eq: ["$status", "deleted"] }, 1, 0] }
                        },
                        buyers: {
                            $sum: { $cond: [{ $eq: ["$role", "Buyer"] }, 1, 0] }
                        },
                        sellers: {
                            $sum: { $cond: [{ $eq: ["$role", "Seller"] }, 1, 0] }
                        },
                        admins: {
                            $sum: { $cond: [{ $eq: ["$role", "Admin"] }, 1, 0] }
                        }
                    }
                }
            ]).toArray();

            return {
                gigStats: gigStats[0] || {
                    totalGigs: 0,
                    activeGigs: 0,
                    pausedGigs: 0,
                    deletedGigs: 0,
                    totalImpressions: 0,
                    totalClicks: 0
                },
                orderStats: orderStats[0] || {
                    inProgressOrders: 0,
                    completedOrders: 0,
                    canceledOrders: 0,
                    totalOrders: 0,
                    averageRating: 0
                },
                paymentStats: {
                    ...(paymentStats[0] || {
                        totalPayments: 0,
                        pendingPayments: 0,
                        completedPayments: 0,
                        canceledPayments: 0,
                        totalRevenue: 0
                    }),
                    escrowBalance: escrowBalance[0]?.escrowBalance || 0
                },
                userStats: userStats[0] || {
                    totalUsers: 0,
                    activeUsers: 0,
                    blockedUsers: 0,
                    deletedUsers: 0,
                    buyers: 0,
                    sellers: 0,
                    admins: 0
                }
            };
        } catch (error) {
            console.error("Error fetching admin dashboard data:", error);
            throw error;
        }
    }
}

module.exports = Admin;
