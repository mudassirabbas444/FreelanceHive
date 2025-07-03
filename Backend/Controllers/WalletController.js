const stripe = require('stripe')('sk_test_51Qh8HsFGXfJNzhXi7V8UqvhlkNQz6Tm8m4aKn8YhR8okKgxNIUIKbH23CqyF4Aw6h2JRJ6odoXd8Xwu7xxFHbw9700T9lDkqrz');
const Wallet = require("../Models/Wallet");
const Transaction = require("../Models/Transaction");

// Get wallet summary for a user
exports.getWalletSummary = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        
        const wallet = await Wallet.getOrCreateWallet(userId);
        res.status(200).json(wallet);
    } catch (error) {
        console.error("Error getting wallet summary:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Get transaction history for a user
exports.getTransactionHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        
        let transactions;
        if (type) {
            transactions = await Transaction.getByType(userId, type);
        } else {
            transactions = await Transaction.getByUserId(userId);
        }
        
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error getting transaction history:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Get transactions for a specific order
exports.getOrderTransactions = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!orderId) {
            return res.status(400).json({ error: "Order ID is required" });
        }
        
        const transactions = await Transaction.getByOrderId(orderId);
        res.status(200).json(transactions);
    } catch (error) {
        console.error("Error getting order transactions:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Process order completion and add funds to seller's wallet
exports.processOrderCompletion = async (req, res) => {
    try {
        const { orderId, sellerId, amount } = req.body;
        
        if (!orderId || !sellerId || !amount) {
            return res.status(400).json({ error: "Order ID, seller ID, and amount are required" });
        }
        
        // Add funds to seller's pending balance
        const wallet = await Wallet.updateBalances(sellerId, {
            pendingBalance: amount,
            totalBalance: amount
        });
        
        // Create transaction record
        const transaction = await Transaction.create({
            userId: sellerId,
            orderId: orderId,
            type: "order_earnings",
            amount: amount,
            role: "seller",
            status: "pending",
            notes: "Order completion earnings (pending clearance)"
        });
        
        res.status(200).json({ 
            message: "Order completion processed successfully", 
            wallet,
            transaction
        });
    } catch (error) {
        console.error("Error processing order completion:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Move funds from pending to verified (clearance period completed)
exports.clearPendingFunds = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ error: "User ID and amount are required" });
        }
        
        // Move funds from pending to verified
        const wallet = await Wallet.moveFromPendingToVerified(userId, amount);
        
        // Update transaction status
        const transactions = await Transaction.getByType(userId, "order_earnings");
        for (const transaction of transactions) {
            if (transaction.status === "pending") {
                await Transaction.updateStatus(transaction._id, "cleared");
            }
        }
        
        res.status(200).json({ 
            message: "Funds cleared successfully", 
            wallet
        });
    } catch (error) {
        console.error("Error clearing pending funds:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Process withdrawal request
exports.processWithdrawal = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        if (!userId || !amount) {
            return res.status(400).json({ error: "User ID and amount are required" });
        }
        
        // Process withdrawal
        const wallet = await Wallet.processWithdrawal(userId, amount);
        
        // Create withdrawal transaction
        const transaction = await Transaction.create({
            userId: userId,
            type: "withdrawal",
            amount: amount,
            role: "seller",
            status: "withdrawn",
            notes: "Withdrawal request processed"
        });
        
        res.status(200).json({ 
            message: "Withdrawal processed successfully", 
            wallet,
            transaction
        });
    } catch (error) {
        console.error("Error processing withdrawal:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Get available balance for withdrawal
exports.getAvailableForWithdrawal = async (req, res) => {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }
        
        // Get the wallet directly instead of using getAvailableForWithdrawal
        const wallet = await Wallet.getOrCreateWallet(userId);
        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found" });
        }

        // Return all wallet balances
        res.status(200).json({
            available: wallet.verifiedBalance,
            pending: wallet.pendingBalance,
            withdrawn: wallet.withdrawnBalance,
            total: wallet.totalBalance,
            verified: wallet.verifiedBalance
        });
    } catch (error) {
        console.error("Error getting wallet balance:", error);
        res.status(500).json({ error: error.message || "Server error" });
    }
};

// Verify wallet balance for payment
exports.verifyWalletBalance = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid user ID or amount" });
        }
        
        const wallet = await Wallet.getOrCreateWallet(userId);
        if (!wallet) {
            return res.status(404).json({ error: "Wallet not found" });
        }
        
        const hasEnoughBalance = wallet.verifiedBalance >= amount;
        
        res.json({
            hasEnoughBalance,
            availableBalance: wallet.verifiedBalance,
            requiredAmount: amount,
            canProceed: hasEnoughBalance
        });
    } catch (error) {
        console.error("Error verifying wallet balance:", error);
        res.status(500).json({ error: "Failed to verify wallet balance" });
    }
};

// Process purchase (deduct from buyer's wallet)
exports.processPurchase = async (req, res) => {
    try {
        const { userId, orderId, amount, paymentMethod, walletAmount, cardAmount } = req.body;
        
        if (!userId || !orderId || !amount) {
            return res.status(400).json({ error: "User ID, order ID, and amount are required" });
        }

        // If this is a wallet payment, verify and process it
        if (paymentMethod === "wallet" || (paymentMethod === "mixed" && walletAmount > 0)) {
            const wallet = await Wallet.getOrCreateWallet(userId);
            if (!wallet || wallet.verifiedBalance < walletAmount) {
                return res.status(400).json({ 
                    error: "Insufficient wallet balance",
                    required: walletAmount,
                    available: wallet?.verifiedBalance || 0
                });
            }

            // Deduct from wallet
            await Wallet.updateBalances(userId, {
                verifiedBalance: -walletAmount,
                totalBalance: -walletAmount
            });

            // Create wallet transaction record
            await Transaction.create({
                userId: userId,
                orderId: orderId,
                type: "purchase",
                amount: -walletAmount,
                role: "buyer",
                status: "completed",
                notes: `Order purchase (${paymentMethod === "wallet" ? "Wallet" : "Wallet + Card"})`
            });
        }
        
        // If this is a mixed payment with card amount, create a separate transaction
        if (paymentMethod === "mixed" && cardAmount > 0) {
            await Transaction.create({
                userId: userId,
                orderId: orderId,
                type: "purchase",
                amount: -cardAmount,
                role: "buyer",
                status: "completed",
                notes: "Order purchase (Card portion)"
            });
        }
        
        res.json({ 
            message: "Purchase processed successfully",
            paymentDetails: {
                method: paymentMethod,
                walletAmount: walletAmount || 0,
                cardAmount: cardAmount || 0
            }
        });
    } catch (error) {
        console.error("Error processing purchase:", error);
        res.status(500).json({ error: error.message || "Failed to process purchase" });
    }
};

// Process refund
exports.processRefund = async (req, res) => {
    try {
        const { userId, amount, orderId } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        // Get wallet
        const wallet = await Wallet.getOrCreateWallet(userId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        // Update wallet balance
        await Wallet.updateBalances(userId, { totalBalance: amount });
        
        // Create refund transaction
        await Transaction.create({
            userId,
            orderId,
            type: 'refund',
            amount,
            status: 'completed',
            notes: 'Refund processed'
        });
        
        res.json({ message: 'Refund processed successfully' });
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund' });
    }
};

exports.getWalletBalance = async (req, res) => {
    try {
        const { userId } = req.params;
        const wallet = await Wallet.getOrCreateWallet(userId);
        
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        res.json({ balance: wallet.totalBalance });
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        res.status(500).json({ error: 'Failed to get wallet balance' });
    }
};

exports.createWithdrawal = async (req, res) => {
    try {
        const { userId, amount } = req.body;
        
        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }
        
        // Get wallet and check balance
        const wallet = await Wallet.getOrCreateWallet(userId);
        if (!wallet) {
            return res.status(404).json({ error: 'Wallet not found' });
        }
        
        if (wallet.verifiedBalance < amount) {
            return res.status(400).json({ error: 'Insufficient verified balance' });
        }
        
        // Process withdrawal directly
        const success = await Wallet.processWithdrawal(userId, amount);
        
        if (!success) {
            return res.status(500).json({ error: 'Failed to process withdrawal' });
        }
        
        // Create withdrawal transaction
        await Transaction.create({
            userId: userId,
            type: "withdrawal",
            amount: amount,
            role: "seller",
            status: "completed",
            notes: "Withdrawal processed successfully"
        });
        
        res.json({ 
            message: 'Withdrawal processed successfully',
            amount: amount,
            newBalance: wallet.verifiedBalance - amount
        });
    } catch (error) {
        console.error('Error creating withdrawal:', error);
        res.status(500).json({ error: 'Failed to process withdrawal' });
    }
};

// Create payment intent for deposit
exports.createDepositIntent = async (req, res) => {
    try {
        const { amount, userId } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        // Create a payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Convert to cents
            currency: 'usd',
            metadata: {
                userId: userId
            }
        });

        res.json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        console.error('Error creating deposit intent:', error);
        res.status(500).json({ error: 'Failed to create deposit intent' });
    }
};

// Process successful deposit
exports.processDeposit = async (req, res) => {
    try {
        const { userId, amount, paymentIntentId } = req.body;
        
        if (!amount || amount <= 0 || !paymentIntentId) {
            return res.status(400).json({ error: 'Invalid deposit details' });
        }

        // Verify the payment intent with Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Payment not successful' });
        }

        // Update wallet balance
        const wallet = await Wallet.updateBalances(userId, {
            totalBalance: amount,
            verifiedBalance: amount // Direct deposit goes to verified balance
        });

        // Create deposit transaction
        await Transaction.create({
            userId: userId,
            type: 'deposit',
            amount: amount,
            role: 'buyer',
            status: 'completed',
            notes: `Deposit via Stripe (${paymentIntentId})`
        });

        res.json({
            message: 'Deposit processed successfully',
            wallet,
            amount
        });
    } catch (error) {
        console.error('Error processing deposit:', error);
        res.status(500).json({ error: 'Failed to process deposit' });
    }
}; 