const { ObjectId, getDb } = require("../config/database");

class Order {
  static collectionName = "orders";

  constructor({
    gigId,
    buyerId,
    sellerId,
    packageId,
    prerequisites,
    price,
    status = "Pending",
    tasks = [],
    modificationRequests = [],
    deliverables = [],
    disputeDetails = null,
    originalOrderId = null,
    sharedFrom = null,
    originalBuyerId = null
  }) {
    this.gigId = gigId;
    this.buyerId = buyerId;
    this.sellerId = sellerId;
    this.packageId = packageId;
    this.prerequisites = prerequisites;
    this.price = price;
    this.status = status;
    this.tasks = tasks; // For task delegation
    this.modificationRequests = modificationRequests; // For modification tracking
    this.disputeDetails = disputeDetails; // For dispute handling
    this.deliverables = deliverables;
    this.originalOrderId = originalOrderId;
    this.sharedFrom = sharedFrom;
    this.originalBuyerId = originalBuyerId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Create an Order
  static async createOrder(data) {
    const collection = getDb().collection(this.collectionName);
    const result = await collection.insertOne(data);
    return result.insertedId;
  }

  // Fetch Order by ID
  static async fetchOrderById(orderId) {
    const collection = getDb().collection(this.collectionName);
    return await collection.findOne({ _id: new ObjectId(orderId) });
  }

  static async fetchOrdersByUser(userId, role) {
    const collection = getDb().collection(this.collectionName);
    const query = role === "Buyer"
      ? { buyerId: userId }
      : { sellerId: userId };
  
    return await collection.find(query).toArray();
  }
  
  static async fetchAllOrders(filter = {}) {
    const collection = getDb().collection(this.collectionName);
    return await collection.find(filter).toArray();
  }

  // Update Order Status
  static async updateOrderStatus(orderId, status, extraUpdates = {}) {
    const collection = getDb().collection(this.collectionName);

    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      { $set: { status, updatedAt: new Date(), ...extraUpdates } }
    );

    if (result.matchedCount > 0) {
      // Notify based on status
      const notificationMessage =
        status === "Completed"
          ? `Order ${orderId} has been marked as Completed.`
          : status === "Canceled"
          ? `Order ${orderId} has been canceled.`
          : `Order ${orderId} status updated to ${status}.`;
    }

    return result.matchedCount > 0;
  }
  static async deliverOrder(orderId, deliverables) {
    const collection = getDb().collection(this.collectionName);
  
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          deliverables,
          status: "Delivered",
          updatedAt: new Date(),
        },
      }
    );
  
    return result.matchedCount > 0;
  }
  
  // Request Modification
  static async requestModification(orderId, modificationDetails, sellerId) {
    const collection = getDb().collection(this.collectionName);
  
    const order = await collection.findOne({ _id: new ObjectId(orderId), sellerId });
    if (!order) throw new Error("Order not found or cannot be modified.");
  
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $push: { modificationRequests: modificationDetails },
        $set: { status: "Modification Requested", updatedAt: new Date() },
      }
    );
  
    return result.matchedCount > 0;
  }
  static async respondToModification(orderId, accept, buyerId) {
    const collection = getDb().collection(this.collectionName);
  
    const order = await collection.findOne({ _id: new ObjectId(orderId), buyerId });
    if (!order) throw new Error("Order not found or unauthorized access.");
  
    const updates = accept
      ? {
          price: order.modificationRequests[0]?.price || order.price,
          deliveryTime: order.modificationRequests[0]?.deliveryTime || order.deliveryTime,
          modificationRequests: [],
        }
      : { modificationRequests: [] }; // Clear modification requests if rejected
  
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          status: "Active",
          updatedAt: new Date(),
          ...updates,
        },
      }
    );
  
    return result.matchedCount > 0;
  }
  
  static async openDispute(orderId, disputeDetails, userId) {
    const collection = getDb().collection(this.collectionName);
  
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          disputeDetails,
          status: "Disputed",
          updatedAt: new Date(),
        },
      }
    );
  
    return result.matchedCount > 0;
  }
  
  // Assign Tasks to Other Sellers
  static async assignTasks(orderId, tasks, sellerId) {
    const collection = getDb().collection(this.collectionName);

    const order = await collection.findOne({ _id: new ObjectId(orderId), sellerId });
    if (!order) throw new Error("Order not found or cannot be delegated.");

    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: { tasks, status: "In Progress", updatedAt: new Date() },
      }
    );

    if (result.matchedCount > 0) {
      // Notify Assigned Sellers
      for (const task of tasks) {
        await Notification.sendTaskAssignmentNotification({
          sellerId: task.assignedSellerId,
          message: `You have been assigned a task for Order ${orderId}.`,
        });
      }
    }

    return result.matchedCount > 0;
  }

  static async closeDispute(orderId, userId) {
    const collection = getDb().collection(this.collectionName);
  
    const result = await collection.updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          disputeDetails: null,
          status: "Active",
          updatedAt: new Date(),
        },
      }
    );
  
    return result.matchedCount > 0;
  }
}  
module.exports = Order;