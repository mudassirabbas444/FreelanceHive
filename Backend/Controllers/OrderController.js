const Order=require("../Models/Order")
const Review=require("../Models/Review")
const Transaction = require("../Models/Transaction")
const Wallet = require("../Models/Wallet")
const Gig = require("../Models/Gig")
// Create Order
exports.createOrder = async (req, res) => {
  try {
    const orderData = new Order(req.body);
    const { paymentMethod, walletAmount, cardAmount } = req.body;

    // Create the order
    const orderId = await Order.createOrder(orderData);

    // Create detailed transaction records
    const timestamp = new Date();

    // Record buyer's payment transaction(s)
    if (paymentMethod === "wallet" || paymentMethod === "mixed") {
      // Record wallet payment
      await Transaction.create({
        userId: orderData.buyerId,
        buyerId: orderData.buyerId,
        sellerId: orderData.sellerId,
        orderId: orderId,
        type: 'order_payment_wallet',
        amount: -walletAmount,
        role: 'buyer',
        status: 'completed',
        timestamp,
        notes: `Order payment via wallet (Order #${orderId})`,
        metadata: {
          paymentMethod: 'wallet',
          orderAmount: orderData.price,
          walletAmount: walletAmount
        }
      });
    }

    if (paymentMethod === "card" || paymentMethod === "mixed") {
      // Record card payment
      await Transaction.create({
        userId: orderData.buyerId,
        buyerId: orderData.buyerId,
        sellerId: orderData.sellerId,
        orderId: orderId,
        type: 'order_payment_card',
        amount: -cardAmount,
        role: 'buyer',
        status: 'completed',
        timestamp,
        notes: `Order payment via card (Order #${orderId})`,
        metadata: {
          paymentMethod: 'card',
          orderAmount: orderData.price,
          cardAmount: cardAmount
        }
      });
    }

    // Record seller's earnings transaction
    await Transaction.create({
      userId: orderData.sellerId,
      buyerId: orderData.buyerId,
      sellerId: orderData.sellerId,
      orderId: orderId,
      type: 'order_earnings',
      amount: orderData.price,
      role: 'seller',
      status: 'pending',
      timestamp,
      notes: `Order earnings pending completion (Order #${orderId})`,
      metadata: {
        orderAmount: orderData.price,
        packageId: orderData.packageId,
        gigId: orderData.gigId
      }
    });

    res.status(201).json({ 
      message: "Order created successfully.", 
      orderId,
      paymentDetails: {
        method: paymentMethod,
        walletAmount: walletAmount || 0,
        cardAmount: cardAmount || 0
      }
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message });
  }
};

// Fetch Order by ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.fetchOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Orders by Buyer/Seller
exports.fetchOrdersByUser = async (req, res) => {
  try {
    const { userId, role } = req.params;

    if (!userId || !role) {
      return res.status(400).json({ error: "Missing userId or role in URL parameters" });
    }

    if (role !== "Buyer" && role !== "Seller") {
      return res.status(400).json({ error: "Invalid role. Must be 'Buyer' or 'Seller'." });
    }

    let orders;
    if (role === "Seller") {
      // For sellers, get both their regular orders and shared orders where they are the buyer
      orders = await Order.fetchOrdersByUser(userId, role);
      
      // Get shared orders where the seller is acting as buyer
      const sharedOrders = await Order.fetchOrdersByUser(userId, "Buyer", { originalOrderId: { $exists: true } });

      // Combine both sets of orders
      orders = [...orders, ...sharedOrders];
    } else {
      // For buyers, just get their regular orders
      orders = await Order.fetchOrdersByUser(userId, role);
    }

    if (!orders.length) {
      return res.status(404).json({ error: "No orders found for the given user and role." });
    }

    // Sort orders by creation date, newest first
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(orders);
  } catch (error) {
    console.error("Error in fetchOrdersByUser:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// OrderController.js
exports.fetchAllOrders = async (req, res) => {
  try {
    const { status } = req.query;  // Get status filter from query parameters

    const filter = status && status !== "All" ? { status } : {}; 

    const orders = await Order.fetchAllOrders(filter);  // Pass filter to the query

    if (!orders.length) {
      return res.status(404).json({ error: "No orders found for the given criteria." });
    }

    res.json(orders);
  } catch (error) {
    console.error("Error in fetchOrdersByUser:", error.message);
    res.status(500).json({ error: error.message });
  }
};
// Update Order Status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, extraUpdates } = req.body;
    const orderId = req.params.id;
    const timestamp = new Date();
    
    // Get the order details
    const order = await Order.fetchOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const updated = await Order.updateOrderStatus(orderId, status, extraUpdates);
    if (!updated) return res.status(400).json({ error: "Failed to update order status." });

    // Handle transactions based on status
    if (status === "Completed") {
      try {
        // Record order completion for seller
        await Transaction.create({
          userId: order.sellerId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          orderId: orderId,
          type: 'order_completion',
          amount: order.price,
          role: 'seller',
          status: 'completed',
          timestamp,
          notes: `Order completed successfully (Order #${orderId})`,
          metadata: {
            orderAmount: order.price,
            completionDate: timestamp,
            packageId: order.packageId,
            gigId: order.gigId
          }
        });

        // Update all pending transactions for this order to completed
        const pendingTransactions = await Transaction.find({
          orderId: orderId,
          status: 'pending'
        });

        for (const transaction of pendingTransactions) {
          await Transaction.updateStatus(transaction._id, 'completed');
          
          // Create a completion record for each updated transaction
          await Transaction.create({
            userId: transaction.userId,
            buyerId: order.buyerId,
            sellerId: order.sellerId,
            orderId: orderId,
            type: 'transaction_completion',
            amount: transaction.amount,
            role: transaction.role,
            status: 'completed',
            timestamp,
            notes: `Transaction completed for order #${orderId}`,
            metadata: {
              originalTransactionId: transaction._id,
              originalType: transaction.type,
              orderAmount: order.price
            }
          });
        }

      } catch (error) {
        console.error("Error processing order completion:", error);
        return res.status(500).json({ error: "Failed to process order completion" });
      }
    } 
    else if (status === "Canceled") {
      try {
        // Record order cancellation for buyer (refund)
        await Transaction.create({
          userId: order.buyerId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          orderId: orderId,
          type: 'order_cancellation_refund',
          amount: order.price,
          role: 'buyer',
          status: 'completed',
          timestamp,
          notes: `Order cancelled - Refund processed (Order #${orderId})`,
          metadata: {
            orderAmount: order.price,
            cancellationDate: timestamp,
            reason: extraUpdates?.cancellationReason || 'No reason provided'
          }
        });

        // Record order cancellation for seller
        await Transaction.create({
          userId: order.sellerId,
          buyerId: order.buyerId,
          sellerId: order.sellerId,
          orderId: orderId,
          type: 'order_cancellation_deduction',
          amount: -order.price,
          role: 'seller',
          status: 'completed',
          timestamp,
          notes: `Order cancelled - Earnings deducted (Order #${orderId})`,
          metadata: {
            orderAmount: order.price,
            cancellationDate: timestamp,
            reason: extraUpdates?.cancellationReason || 'No reason provided'
          }
        });

        // Update all pending transactions to cancelled
        const pendingTransactions = await Transaction.find({
          orderId: orderId,
          status: 'pending'
        });
        
        for (const transaction of pendingTransactions) {
          await Transaction.updateStatus(transaction._id, 'cancelled');
          
          // Create a cancellation record for each updated transaction
          await Transaction.create({
            userId: transaction.userId,
            buyerId: order.buyerId,
            sellerId: order.sellerId,
            orderId: orderId,
            type: 'transaction_cancellation',
            amount: transaction.amount,
            role: transaction.role,
            status: 'cancelled',
            timestamp,
            notes: `Transaction cancelled for order #${orderId}`,
            metadata: {
              originalTransactionId: transaction._id,
              originalType: transaction.type,
              orderAmount: order.price,
              reason: extraUpdates?.cancellationReason || 'No reason provided'
            }
          });
        }

      } catch (error) {
        console.error("Error processing order cancellation:", error);
        return res.status(500).json({ error: "Failed to process order cancellation" });
      }
    }

    res.json({ 
      message: `Order status updated to ${status}.`,
      status: status,
      orderId: orderId,
      timestamp
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: error.message });
  }
};

// Open a Dispute
exports.openDispute = async (req, res) => {
  try {
    const { disputeDetails, userId } = req.body;

    const updated = await Order.openDispute(req.params.id, disputeDetails, userId);
    if (!updated) return res.status(400).json({ error: "Failed to open dispute." });

    res.json({ message: "Dispute opened successfully." });
  } catch (error) {
    console.error("Error in openDispute:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// Request Modification
exports.requestModification = async (req, res) => {
  try {
    const { sellerId, modificationDetails } = req.body;
    const updated = await Order.requestModification(req.params.id, modificationDetails, sellerId);
    if (!updated) return res.status(400).json({ error: "Failed to request modification." });
    res.json({ message: "Modification request sent successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Accept or Decline Modification
exports.respondToModification = async (req, res) => {
  try {
    const { accept, buyerId } = req.body;
    const updated = await Order.respondToModification(req.params.id, accept, buyerId);
    if (!updated) return res.status(400).json({ error: "Failed to respond to modification request." });
    res.json({
      message: `Modification ${accept ? "accepted" : "declined"} successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Assign Tasks to Other Sellers
exports.assignTasks = async (req, res) => {
  try {
    const { tasks, sellerId } = req.body;
    const updated = await Order.assignTasks(req.params.id, tasks, sellerId);
    if (!updated) return res.status(400).json({ error: "Failed to assign tasks." });
    res.json({ message: "Tasks assigned successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Close Dispute
exports.closeDispute = async (req, res) => {
  try {
    const { userId } = req.body;

    const updated = await Order.closeDispute(req.params.id, userId);
    if (!updated) return res.status(400).json({ error: "Failed to close dispute." });

    res.json({ message: "Dispute closed successfully." });
  } catch (error) {
    console.error("Error in closeDispute:", error.message);
    res.status(500).json({ error: error.message });
  }
};

// Cancel Order
exports.cancelOrder = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const status = "Canceled";

    const order = await Order.fetchOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });

    if (
      (role === "Seller" && order.sellerId !== userId) ||
      (role === "Admin" && !userId)
    ) {
      return res.status(403).json({ error: "Unauthorized action." });
    }

    // If this is a shared order, add the price back to the original order
    if (order.originalOrderId) {
      const originalOrder = await Order.fetchOrderById(order.originalOrderId);
      if (originalOrder) {
        // Add the shared price back to the original order
        const newPrice = originalOrder.price + order.price;
        await Order.updateOrderStatus(order.originalOrderId, originalOrder.status, {
          price: newPrice
        });
      }
    }

    const updated = await Order.updateOrderStatus(req.params.id, status, {
      buyerId: order.buyerId,
    });
    if (!updated) return res.status(400).json({ error: "Failed to cancel order." });
    res.json({ message: "Order canceled successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Deliver Order
exports.deliverOrder = async (req, res) => {
  try {
    const deliverables = req.files || []; 
    const filePaths = deliverables.map((file) => `uploads/${file.filename}`); 

    const order = await Order.fetchOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    // Update the order with deliverables and tasks
    const updated = await Order.deliverOrder(req.params.id, filePaths);
    if (!updated) {
      return res.status(400).json({ error: "Failed to deliver order." });
    }

    res.status(200).json({ message: "Order delivered successfully.", filePaths });
  } catch (error) {
    console.error("Error in deliverOrder:", error.message);
    res.status(500).json({ error: error.message });
  }
};


// Complete Order
exports.completeOrder = async (req, res) => {
  try {
    const { buyerId } = req.body;
    console.log("completing")
    const order = await Order.fetchOrderById(req.params.id);
    if (!order || order.buyerId !== buyerId) {
      return res.status(403).json({ error: "Unauthorized or invalid order." });
    }

    const updated = await Order.updateOrderStatus(req.params.id, "Completed", {
      sellerId: order.sellerId,
      buyerId: order.buyerId,
    });

    if (!updated) return res.status(400).json({ error: "Failed to complete order." });
    res.json({ message: "Order completed successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Rate and Review Order
exports.reviewOrder = async (req, res) => {
  try {
    const { userId, role, rating, reviewText } = req.body;

    const order = await Order.fetchOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found." });
    if (
      (role === "Buyer" && order.buyerId !== userId) ||
      (role === "Seller" && order.sellerId !== userId)
    ) {
      return res.status(403).json({ error: "Unauthorized action." });
    }

    const reviewData = new Review({
      gigId: order.gigId,
      review: reviewText,
      rating,
      clientId: userId,
    });
    const reviewId = await Review.createReview(reviewData);
    res.status(201).json({ message: "Review submitted successfully.", reviewId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Share Order with Another Freelancer
exports.shareOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { targetGigId, sharePrice } = req.body;

    // Get the order details
    const order = await Order.fetchOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Validate share price
    if (!sharePrice || sharePrice <= 0 || sharePrice > order.price) {
      return res.status(400).json({ error: "Invalid share price" });
    }

    // Get the target gig details
    const targetGig = await Gig.fetchById(targetGigId);
    if (!targetGig) {
      return res.status(404).json({ error: "Target gig not found" });
    }

    // Create a new order for the target freelancer
    // Use the current seller's ID as the buyer ID for the shared order
    const sharedOrderData = {
      gigId: targetGigId,
      buyerId: order.sellerId, // Current seller becomes the buyer
      sellerId: targetGig.sellerId,
      packageId: order.packageId,
      prerequisites: order.prerequisites,
      price: sharePrice,
      status: "Pending",
      originalOrderId: orderId,
      sharedFrom: order.sellerId,
      originalBuyerId: order.buyerId // Store the original buyer's ID for reference
    };

    const sharedOrderId = await Order.createOrder(sharedOrderData);

    // Update the original order's price
    const remainingPrice = order.price - sharePrice;
    await Order.updateOrderStatus(orderId, order.status, {
      price: remainingPrice
    });

    res.status(201).json({ 
      message: "Order shared successfully with freelancer",
      sharedOrderId,
      remainingPrice
    });
  } catch (error) {
    console.error("Error sharing order:", error);
    res.status(500).json({ error: error.message });
  }
};
