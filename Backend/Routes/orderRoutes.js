const express = require("express");
const router = express.Router();
const orderController = require("../Controllers/OrderController");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
// Create Order
router.post("/orders/create", orderController.createOrder);

// Fetch Order by ID
router.get("/orders/:id", orderController.getOrderById);

// Fetch Orders by Buyer/Seller
router.get("/orders/user/:userId/:role", orderController.fetchOrdersByUser);
router.get("/orders", orderController.fetchAllOrders);

// Update Order Status
router.post("/orders/:id/status", orderController.updateOrderStatus);

// Open a Dispute
router.post("/orders/:id/dispute", orderController.openDispute);

// Request Modification
router.post("/orders/:id/modification", orderController.requestModification);

// Accept or Decline Modification
router.put("/orders/:id/modificationResponse", orderController.respondToModification);

// Assign Tasks to Other Sellers
router.post("/orders/:id/assign-tasks", orderController.assignTasks);

// Close Dispute
router.put("/orders/:id/close-dispute", orderController.closeDispute);

// Cancel Order
router.put("/orders/:id/cancel", orderController.cancelOrder);

router.post("/orders/:id/deliver", upload.array("deliverables"), orderController.deliverOrder);


// Complete Order
router.put("/orders/:id/complete", orderController.completeOrder);

// Rate and Review Order
router.post("/orders/:id/review", orderController.reviewOrder);

// Share Order with Another Freelancer
router.post("/orders/:orderId/share", orderController.shareOrder);

module.exports = router;
