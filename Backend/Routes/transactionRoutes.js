const express = require("express");
const router = express.Router();
const transactionController = require("../Controllers/TransactionController");

// Get all transactions for a user with filtering and pagination
router.get("/user/:userId", transactionController.getUserTransactions);

// Get transaction by ID
router.get("/:transactionId", transactionController.getTransactionById);

// Create a new transaction
router.post("/", transactionController.createTransaction);

// Update transaction status
router.put("/:transactionId/status", transactionController.updateTransactionStatus);

// Get transaction statistics
router.get("/stats/:userId", transactionController.getTransactionStats);

// Cancel transaction
router.post("/:transactionId/cancel", transactionController.cancelTransaction);

module.exports = router; 