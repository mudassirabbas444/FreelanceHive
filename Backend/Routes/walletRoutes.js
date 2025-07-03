const express = require("express");
const router = express.Router();
const walletController = require("../Controllers/WalletController");

// Get wallet summary
router.get("/summary/:userId", walletController.getWalletSummary);

// Get transaction history
router.get("/transactions/:userId", walletController.getTransactionHistory);

// Get order transactions
router.get("/order-transactions/:orderId", walletController.getOrderTransactions);

// Process order completion
router.post("/process-order", walletController.processOrderCompletion);

// Clear pending funds
router.post("/clear-pending", walletController.clearPendingFunds);

// Process withdrawal
router.post("/withdraw", walletController.processWithdrawal);

// Get available balance for withdrawal
router.get("/available/:userId", walletController.getAvailableForWithdrawal);

// Process purchase
router.post("/purchase", walletController.processPurchase);

// Process refund
router.post("/refund", walletController.processRefund);

// Get wallet balance
router.get("/:userId", walletController.getWalletBalance);

// Create withdrawal
router.post("/create-withdrawal", walletController.createWithdrawal);

// Create deposit intent
router.post("/create-deposit-intent", walletController.createDepositIntent);

// Process deposit
router.post("/process-deposit", walletController.processDeposit);

// Verify wallet balance
router.post("/verify-balance", walletController.verifyWalletBalance);

module.exports = router; 