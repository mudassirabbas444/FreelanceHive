const Transaction = require("../Models/Transaction");
const Wallet = require("../Models/Wallet");
const { ObjectId } = require("mongodb");

// Get all transactions for a user
exports.getUserTransactions = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { page = 1, limit = 10, type, status, startDate, endDate, role } = req.query;
        
        // Convert userId to string for comparison
        const userIdStr = userId.toString();
        
        let transactions = await Transaction.getByUserId(userIdStr);
        
        // Apply filters
        if (type) {
            transactions = transactions.filter(t => t.type === type);
        }
        if (status) {
            transactions = transactions.filter(t => t.status === status);
        }
        if (role) {
            transactions = transactions.filter(t => t.role === role.toLowerCase());
        }
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            transactions = transactions.filter(t => {
                const date = new Date(t.timestamp);
                return date >= start && date <= end;
            });
        }

        // Sort transactions by timestamp (newest first)
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedTransactions = transactions.slice(startIndex, endIndex);

        // Calculate transaction statistics
        const stats = {
            totalAmount: transactions.reduce((sum, t) => {
                const amount = Math.abs(t.amount);
                if (t.type === 'withdrawal' || (t.role === 'buyer' && t.type === 'order_creation')) {
                    return sum - amount;
                } else if (t.type === 'deposit' || (t.role === 'seller' && t.type === 'order_completion')) {
                    return sum + amount;
                }
                return sum;
            }, 0),
            totalTransactions: transactions.length,
            byType: transactions.reduce((acc, t) => {
                acc[t.type] = (acc[t.type] || 0) + 1;
                return acc;
            }, {}),
            byStatus: transactions.reduce((acc, t) => {
                acc[t.status] = (acc[t.status] || 0) + 1;
                return acc;
            }, {})
        };

        res.json({
            transactions: paginatedTransactions,
            total: transactions.length,
            page: parseInt(page),
            totalPages: Math.ceil(transactions.length / limit),
            stats
        });
    } catch (error) {
        console.error("Error in getUserTransactions:", error);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
    try {
        const transactionId = req.params.transactionId;
        // Convert transactionId to string for comparison
        const transactionIdStr = transactionId.toString();
        const transaction = await Transaction.findById(transactionIdStr);
        
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        
        res.json(transaction);
    } catch (error) {
        console.error("Error in getTransactionById:", error);
        res.status(500).json({ error: "Failed to fetch transaction" });
    }
};

// Create a new transaction
exports.createTransaction = async (req, res) => {
    try {
        const { buyerId, sellerId, orderId, type, amount, role, notes } = req.body;
        
        // Convert IDs to strings
        const buyerIdStr = buyerId ? buyerId.toString() : null;
        const sellerIdStr = sellerId ? sellerId.toString() : null;
        const orderIdStr = orderId ? orderId.toString() : null;

        const transactionData = {
            buyerId: buyerIdStr,
            sellerId: sellerIdStr,
            orderId: orderIdStr,
            type,
            amount,
            role,
            status: "pending",
            notes
        };

        const transactionId = await Transaction.create(transactionData);
        res.status(201).json({ transactionId });
    } catch (error) {
        console.error("Error in createTransaction:", error);
        res.status(500).json({ error: "Failed to create transaction" });
    }
};

// Update transaction status
exports.updateTransactionStatus = async (req, res) => {
    try {
        const { transactionId } = req.params;
        const { status } = req.body;
        
        // Convert transactionId to string for comparison
        const transactionIdStr = transactionId.toString();
        const success = await Transaction.updateStatus(transactionIdStr, status);
        
        if (!success) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        
        res.json({ message: "Transaction status updated successfully" });
    } catch (error) {
        console.error("Error in updateTransactionStatus:", error);
        res.status(500).json({ error: "Failed to update transaction status" });
    }
};

// Get transaction statistics for a user
exports.getTransactionStats = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { startDate, endDate } = req.query;
        
        // Convert userId to string for comparison
        const userIdStr = userId.toString();
        
        let transactions = await Transaction.getByUserId(userIdStr);
        
        // Apply date filters if provided
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            transactions = transactions.filter(t => {
                const date = new Date(t.timestamp);
                return date >= start && date <= end;
            });
        }

        // Calculate statistics
        const totalTransactions = transactions.length;
        const totalAmount = transactions.reduce((sum, t) => {
            if (t.type === "withdrawal") {
                return sum - Math.abs(t.amount);
            } else if (t.type === "refund") {
                return sum + Math.abs(t.amount);
            } else {
                return t.role === "buyer" ? sum - Math.abs(t.amount) : sum + Math.abs(t.amount);
            }
        }, 0);

        const amountsByType = transactions.reduce((acc, t) => {
            const amount = Math.abs(t.amount);
            acc[t.type] = (acc[t.type] || 0) + amount;
            return acc;
        }, {});

        const transactionsByStatus = transactions.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {});

        res.json({
            totalTransactions,
            totalAmount,
            amountsByType,
            transactionsByStatus
        });
    } catch (error) {
        console.error("Error in getTransactionStats:", error);
        res.status(500).json({ error: "Failed to fetch transaction statistics" });
    }
};

// Cancel transaction
exports.cancelTransaction = async (req, res) => {
    try {
        const { transactionId } = req.params;
        
        // Convert transactionId to string for comparison
        const transactionIdStr = transactionId.toString();
        const success = await Transaction.updateStatus(transactionIdStr, "cancelled");
        
        if (!success) {
            return res.status(404).json({ error: "Transaction not found" });
        }
        
        res.json({ message: "Transaction cancelled successfully" });
    } catch (error) {
        console.error("Error in cancelTransaction:", error);
        res.status(500).json({ error: "Failed to cancel transaction" });
    }
}; 