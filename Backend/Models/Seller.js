const { ObjectId, getDb } = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Gig = require("./Gig");
const Order = require("./Order");
const Wallet = require("./Wallet");
const Transaction = require("./Transaction");

class Seller {
  static collectionName = "users";

  constructor({
    name,
    email,
    username,
    password,
    expertise = [],
    description = "",
    certificates = [],
    address = "",
    qualification = "",
  }) {
    this.name = name;
    this.email = email;
    this.username = username;
    this.password = password;
    this.role = "Seller";
    this.status = "Active";
    this.level = "New Seller"
    this.expertise = expertise;
    this.description = description;
    this.certificates = certificates;
    this.address = address;
    this.qualification = qualification;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Seller Signup
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

    const seller = new Seller(data);
    const result = await collection.insertOne(seller);
    return result.insertedId;
  }

  // Seller Login
  static async login(email, password) {
    const collection = getDb().collection(this.collectionName);

    // Find user by email and role
    const seller = await collection.findOne({ email, role: "Seller" });
    if (!seller) throw new Error("Invalid email or password.");
    if (seller.status === "blocked" || seller.status === "deleted") {
      throw new Error("Your account is not active. Please contact support.");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, seller.password);
    if (!isMatch) throw new Error("Invalid email or password.");

    const key = "mySuperSecretKey123!@#";
    // Generate token
    const token = jwt.sign(
      { id: seller._id, role: seller.role },
      key,
      { expiresIn: "1h" }
    );

    return { token, user: { id: seller._id, name: seller.name, role: seller.role } };
  }

  static async fetchDashboardData(userId) {
    try {
      const db = getDb();
      
      // Get gig statistics
      const gigStats = await this.getGigStats(userId, db.collection("gigs"));

      // Get order statistics
      const orderStats = await this.getOrderStats(userId, db.collection("orders"));

      // Get payment statistics
      const paymentStats = await this.getPaymentStats(userId, db.collection("wallets"), db.collection("transactions"));

      return {
        gigStats,
        orderStats,
        paymentStats
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  }

  static async getGigStats(userId, gigCollection) {
    const gigs = await gigCollection.find({ sellerId: userId.toString() }).toArray();
    
    return {
      totalGigs: gigs.length,
      activeGigs: gigs.filter(gig => gig.status === "active").length,
      pausedGigs: gigs.filter(gig => gig.status === "paused").length,
      deletedGigs: gigs.filter(gig => gig.status === "deleted").length,
      totalImpressions: gigs.reduce((sum, gig) => sum + (gig.impressions || 0), 0),
      totalClicks: gigs.reduce((sum, gig) => sum + (gig.clicks || 0), 0)
    };
  }

  static async getOrderStats(userId, orderCollection) {
    const orders = await orderCollection.find({ sellerId: userId.toString() }).toArray();
    
    const completedOrders = orders.filter(order => order.status === "Completed");
    const totalRating = completedOrders.reduce((sum, order) => sum + (order.rating || 0), 0);
    const averageRating = completedOrders.length > 0 ? totalRating / completedOrders.length : 0;

    return {
      inProgress: orders.filter(order => order.status === "In Progress").length,
      completed: completedOrders.length,
      canceled: orders.filter(order => order.status === "Canceled").length,
      averageRating: parseFloat(averageRating.toFixed(1))
    };
  }

  static async getPaymentStats(userId, walletCollection, transactionCollection) {
    const wallet = await walletCollection.findOne({ userId: new ObjectId(userId) });
    const transactions = await transactionCollection.find({
      $or: [
        { sellerId: userId.toString() },
        { buyerId: userId.toString() }
      ]
    }).toArray();

    const completedTransactions = transactions.filter(t => t.status === "completed");
    const pendingTransactions = transactions.filter(t => t.status === "pending");
    const canceledTransactions = transactions.filter(t => t.status === "cancelled");

    return {
      totalPayments: transactions.length,
      pendingPayments: pendingTransactions.length,
      completedPayments: completedTransactions.length,
      canceledPayments: canceledTransactions.length,
      escrowBalance: wallet ? wallet.pendingBalance : 0,
      totalRevenue: completedTransactions.reduce((sum, t) => {
        if (t.role === "seller") {
          return sum + t.amount;
        }
        return sum;
      }, 0)
    };
  }
}

module.exports = Seller;