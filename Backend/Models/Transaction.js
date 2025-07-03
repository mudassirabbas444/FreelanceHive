const { ObjectId, getDb } = require("../config/database");

class Transaction {
  constructor(data) {
    this.buyerId = data.buyerId;
    this.sellerId = data.sellerId;
    this.orderId = data.orderId;
    this.type = data.type; // order_creation, order_completion, order_cancellation, withdrawal, deposit, refund
    this.amount = parseFloat(data.amount) || 0; // Ensure amount is always a number
    this.role = data.role; // buyer, seller
    this.status = data.status; // pending, completed, cancelled, failed
    this.timestamp = data.timestamp || new Date();
    this.notes = data.notes;
  }

  static async create(transactionData) {
    try {
      const collection = getDb().collection("transactions");
      // Ensure amount is a number
      transactionData.amount = parseFloat(transactionData.amount) || 0;
      
      // Set role based on transaction type and IDs
      if (!transactionData.role) {
        if (transactionData.type === 'order_creation') {
          transactionData.role = transactionData.buyerId ? 'buyer' : 'seller';
        } else if (transactionData.type === 'order_completion') {
          transactionData.role = 'seller';
        } else if (transactionData.type === 'withdrawal') {
          transactionData.role = 'seller';
        } else if (transactionData.type === 'deposit') {
          transactionData.role = 'buyer';
        }
      }

      const transaction = new Transaction(transactionData);
      const result = await collection.insertOne(transaction);
      return result.insertedId;
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  static async getByUserId(userId) {
    try {
      const collection = getDb().collection("transactions");
      const userIdStr = userId.toString();
      
      // Get all transactions where user is either buyer or seller
      const query = {
        $or: [
          { buyerId: userIdStr },
          { sellerId: userIdStr }
        ]
      };
      
      const transactions = await collection.find(query)
        .sort({ timestamp: -1 })
        .toArray();

      // Process transactions to ensure proper types and roles
      return transactions.map(t => {
        // Determine role based on transaction type and IDs
        let role = t.role;
        if (!role) {
          if (t.type === 'order_creation') {
            role = t.buyerId === userIdStr ? 'buyer' : 'seller';
          } else if (t.type === 'order_completion') {
            role = 'seller';
          } else if (t.type === 'withdrawal') {
            role = 'seller';
          } else if (t.type === 'deposit') {
            role = 'buyer';
          }
        }

        return {
          ...t,
          _id: t._id.toString(),
          amount: parseFloat(t.amount) || 0, // Ensure amount is a number
          role: role,
          buyerId: t.buyerId?.toString(),
          sellerId: t.sellerId?.toString(),
          orderId: t.orderId?.toString()
        };
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  static async findById(transactionId) {
    try {
      const collection = getDb().collection("transactions");
      const transactionIdStr = transactionId.toString();
      const query = { _id: new ObjectId(transactionIdStr) };
      const transaction = await collection.findOne(query);
      if (transaction) {
        transaction._id = transaction._id.toString();
      }
      return transaction;
    } catch (error) {
      console.error("Error fetching transaction:", error);
      throw error;
    }
  }

  static async findOne(query) {
    try {
      const collection = getDb().collection("transactions");
      const transaction = await collection.findOne(query);
      if (transaction) {
        transaction._id = transaction._id.toString();
      }
      return transaction;
    } catch (error) {
      console.error("Error finding transaction:", error);
      throw error;
    }
  }

  static async find(query) {
    try {
      const collection = getDb().collection("transactions");
      const transactions = await collection.find(query).toArray();
      return transactions.map(t => ({
        ...t,
        _id: t._id.toString()
      }));
    } catch (error) {
      console.error("Error finding transactions:", error);
      throw error;
    }
  }

  static async updateStatus(transactionId, status) {
    try {
      const collection = getDb().collection("transactions");
      const transactionIdStr = transactionId.toString();
      const query = { _id: new ObjectId(transactionIdStr) };
      const result = await collection.updateOne(
        query,
        { 
          $set: { 
            status,
            lastUpdated: new Date()
          }
        }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error updating transaction status:", error);
      throw error;
    }
  }

  static async getByOrderId(orderId) {
    try {
      const collection = getDb().collection("transactions");
      const orderIdStr = orderId.toString();
      const transactions = await collection.find({ orderId: orderIdStr })
        .sort({ timestamp: -1 })
        .toArray();
      return transactions.map(t => ({
        ...t,
        _id: t._id.toString()
      }));
    } catch (error) {
      console.error("Error fetching order transactions:", error);
      throw error;
    }
  }

  static async getByType(userId, type) {
    try {
      const collection = getDb().collection("transactions");
      const userIdStr = userId.toString();
      const query = {
        $or: [
          { buyerId: userIdStr },
          { sellerId: userIdStr },
          { userId: userIdStr }
        ],
        type
      };
      const transactions = await collection.find(query)
        .sort({ timestamp: -1 })
        .toArray();
      return transactions.map(t => ({
        ...t,
        _id: t._id.toString(),
        role: t.role || (t.buyerId === userIdStr ? 'buyer' : 'seller')
      }));
    } catch (error) {
      console.error("Error fetching transactions by type:", error);
      throw error;
    }
  }
}

module.exports = Transaction; 