const { ObjectId, getDb } = require("../config/database");

class Wallet {
    static collectionName = "wallets";

    static async getOrCreateWallet(userId) {
        const collection = getDb().collection(this.collectionName);
        
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        try {
            // Try to find existing wallet
            let wallet = await collection.findOne({ userId: new ObjectId(userId) });
            
            // If wallet doesn't exist, create a new one
            if (!wallet) {
                const newWallet = {
                    userId: new ObjectId(userId),
                    totalBalance: 0,
                    pendingBalance: 0,
                    withdrawnBalance: 0,
                    verifiedBalance: 0,
                    lastUpdated: new Date()
                };
                
                const result = await collection.insertOne(newWallet);
                wallet = { _id: result.insertedId, ...newWallet };
                console.log('Created new wallet:', {
                    userId,
                    walletId: wallet._id,
                    balances: {
                        total: wallet.totalBalance,
                        pending: wallet.pendingBalance,
                        withdrawn: wallet.withdrawnBalance,
                        verified: wallet.verifiedBalance
                    }
                });
            } else {
                // Convert any string balances to numbers and ensure they are valid
                const numericBalances = {
                    totalBalance: Number(wallet.totalBalance) || 0,
                    pendingBalance: Number(wallet.pendingBalance) || 0,
                    withdrawnBalance: Number(wallet.withdrawnBalance) || 0,
                    verifiedBalance: Number(wallet.verifiedBalance) || 0
                };

                // Only update if there are string values
                if (typeof wallet.totalBalance === 'string' || 
                    typeof wallet.pendingBalance === 'string' || 
                    typeof wallet.withdrawnBalance === 'string' || 
                    typeof wallet.verifiedBalance === 'string') {
                    
                    const updateResult = await collection.updateOne(
                        { _id: wallet._id },
                        { $set: { ...numericBalances, lastUpdated: new Date() } }
                    );

                    if (updateResult.modifiedCount > 0) {
                        console.log('Updated wallet balances to numeric values:', {
                            userId,
                            walletId: wallet._id,
                            oldBalances: {
                                total: wallet.totalBalance,
                                pending: wallet.pendingBalance,
                                withdrawn: wallet.withdrawnBalance,
                                verified: wallet.verifiedBalance
                            },
                            newBalances: numericBalances
                        });
                    }

                    wallet = { ...wallet, ...numericBalances };
                }
            }
            
            return wallet;
        } catch (error) {
            console.error('Error in getOrCreateWallet:', {
                error: error.message,
                userId,
                stack: error.stack
            });
            throw new Error(`Failed to get or create wallet: ${error.message}`);
        }
    }

    static async updateBalances(userId, updates) {
        const collection = getDb().collection(this.collectionName);
        
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        // Get current wallet
        const wallet = await this.getOrCreateWallet(userId);
        
        // Ensure all updates are numbers
        const numericUpdates = {
            totalBalance: Number(updates.totalBalance) || 0,
            pendingBalance: Number(updates.pendingBalance) || 0,
            withdrawnBalance: Number(updates.withdrawnBalance) || 0,
            verifiedBalance: Number(updates.verifiedBalance) || 0
        };

        // Validate that the updates won't result in negative balances
        const newBalances = {
            totalBalance: wallet.totalBalance + numericUpdates.totalBalance,
            pendingBalance: wallet.pendingBalance + numericUpdates.pendingBalance,
            withdrawnBalance: wallet.withdrawnBalance + numericUpdates.withdrawnBalance,
            verifiedBalance: wallet.verifiedBalance + numericUpdates.verifiedBalance
        };

        // Check for negative balances
        for (const [key, value] of Object.entries(newBalances)) {
            if (value < 0) {
                throw new Error(`Update would result in negative ${key}: ${value}`);
            }
        }

        // Log current state and updates
        console.log('Updating wallet balances:', {
            userId,
            currentBalances: {
                total: wallet.totalBalance,
                pending: wallet.pendingBalance,
                withdrawn: wallet.withdrawnBalance,
                verified: wallet.verifiedBalance
            },
            updates: numericUpdates,
            newBalances
        });
        
        try {
            // First verify the wallet still has sufficient balance
            const currentWallet = await collection.findOne({ 
                _id: wallet._id,
                totalBalance: { $gte: -numericUpdates.totalBalance },
                pendingBalance: { $gte: -numericUpdates.pendingBalance },
                withdrawnBalance: { $gte: -numericUpdates.withdrawnBalance },
                verifiedBalance: { $gte: -numericUpdates.verifiedBalance }
            });

            if (!currentWallet) {
                console.error('Insufficient balance for update:', {
                    userId,
                    requiredUpdates: numericUpdates,
                    currentBalances: {
                        total: wallet.totalBalance,
                        pending: wallet.pendingBalance,
                        withdrawn: wallet.withdrawnBalance,
                        verified: wallet.verifiedBalance
                    }
                });
                throw new Error("Insufficient balance for update");
            }

            // Use findOneAndUpdate for atomic operation
            const result = await collection.findOneAndUpdate(
                { 
                    _id: wallet._id,
                    totalBalance: { $gte: -numericUpdates.totalBalance },
                    pendingBalance: { $gte: -numericUpdates.pendingBalance },
                    withdrawnBalance: { $gte: -numericUpdates.withdrawnBalance },
                    verifiedBalance: { $gte: -numericUpdates.verifiedBalance }
                },
                { 
                    $inc: {
                        totalBalance: numericUpdates.totalBalance,
                        pendingBalance: numericUpdates.pendingBalance,
                        withdrawnBalance: numericUpdates.withdrawnBalance,
                        verifiedBalance: numericUpdates.verifiedBalance
                    },
                    $set: { lastUpdated: new Date() }
                },
                { 
                    returnDocument: 'after',
                    new: true
                }
            );

            if (!result.value) {
                throw new Error("Failed to update wallet balances - insufficient balance");
            }

            // Log updated state
            console.log('Updated wallet balances:', {
                userId,
                newBalances: {
                    total: result.value.totalBalance,
                    pending: result.value.pendingBalance,
                    withdrawn: result.value.withdrawnBalance,
                    verified: result.value.verifiedBalance
                }
            });

            return result.value;
        } catch (error) {
            console.error('Error in updateBalances:', {
                error: error.message,
                userId,
                walletId: wallet._id,
                updates: numericUpdates,
                currentBalances: {
                    total: wallet.totalBalance,
                    pending: wallet.pendingBalance,
                    withdrawn: wallet.withdrawnBalance,
                    verified: wallet.verifiedBalance
                }
            });
            throw new Error(`Failed to update wallet balances: ${error.message}`);
        }
    }

    static async moveFromPendingToVerified(userId, amount) {
        const collection = getDb().collection(this.collectionName);
        
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        // Get current wallet
        const wallet = await this.getOrCreateWallet(userId);
        
        // Ensure amount is a number and positive
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            throw new Error("Invalid amount");
        }

        // Log current balances for debugging
        console.log('Current wallet state:', {
            userId,
            pendingBalance: wallet.pendingBalance,
            verifiedBalance: wallet.verifiedBalance,
            amount: numericAmount,
            walletId: wallet._id
        });
        
        // Check if there's enough pending balance
        if (wallet.pendingBalance < numericAmount) {
            throw new Error(`Insufficient pending balance. Required: ${numericAmount}, Available: ${wallet.pendingBalance}`);
        }
        
        try {
            // First verify the wallet still has sufficient balance
            const currentWallet = await collection.findOne({ 
                _id: wallet._id,
                pendingBalance: { $gte: numericAmount }
            });

            if (!currentWallet) {
                console.error('Wallet balance changed during operation:', {
                    userId,
                    expectedPendingBalance: wallet.pendingBalance,
                    actualPendingBalance: currentWallet?.pendingBalance
                });
                throw new Error("Wallet balance changed during operation");
            }

            // Perform the update
            const updateResult = await collection.updateOne(
                { 
                    _id: wallet._id,
                    pendingBalance: { $gte: numericAmount }
                },
                { 
                    $inc: { 
                        pendingBalance: -numericAmount,
                        verifiedBalance: numericAmount
                    },
                    $set: { lastUpdated: new Date() }
                }
            );

            if (updateResult.matchedCount === 0) {
                console.error('Update operation failed:', {
                    userId,
                    walletId: wallet._id,
                    updateResult
                });
                throw new Error("Failed to update wallet balances - no matching document found");
            }

            if (updateResult.modifiedCount === 0) {
                console.error('Update operation did not modify any document:', {
                    userId,
                    walletId: wallet._id,
                    updateResult
                });
                throw new Error("Failed to update wallet balances - no document was modified");
            }

            // Verify the update
            const updatedWallet = await collection.findOne({ _id: wallet._id });
            console.log('Updated wallet state:', {
                userId,
                walletId: wallet._id,
                newPendingBalance: updatedWallet.pendingBalance,
                newVerifiedBalance: updatedWallet.verifiedBalance,
                updateResult
            });

            return true;
        } catch (error) {
            console.error('Error in moveFromPendingToVerified:', {
                error: error.message,
                userId,
                walletId: wallet._id,
                amount: numericAmount,
                stack: error.stack
            });
            throw new Error(`Failed to move funds from pending to verified: ${error.message}`);
        }
    }

    static async processWithdrawal(userId, amount) {
        const collection = getDb().collection(this.collectionName);
        
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        // Get current wallet
        const wallet = await this.getOrCreateWallet(userId);
        
        // Check if there's enough verified balance
        if (wallet.verifiedBalance < amount) {
            throw new Error("Insufficient verified balance");
        }
        
        // Update balances - only deduct from verified and total balance
        const result = await collection.updateOne(
            { userId: new ObjectId(userId) },
            { 
                $inc: { 
                    verifiedBalance: -amount,
                    withdrawnBalance: amount,
                    totalBalance: -amount
                },
                $set: { lastUpdated: new Date() }
            }
        );
        
        if (result.modifiedCount === 0) {
            throw new Error("Failed to process withdrawal");
        }
        
        return true;
    }

    static async getAvailableForWithdrawal(userId) {
        const collection = getDb().collection(this.collectionName);
        
        if (!ObjectId.isValid(userId)) {
            throw new Error("Invalid user ID");
        }

        // Get current wallet
        const wallet = await this.getOrCreateWallet(userId);
        
        // Ensure all balances are numbers and properly formatted
        return {
            available: Number(wallet.verifiedBalance.toFixed(2)),
            pending: Number(wallet.pendingBalance.toFixed(2)),
            withdrawn: Number(wallet.withdrawnBalance.toFixed(2)),
            total: Number(wallet.totalBalance.toFixed(2)),
            verified: Number(wallet.verifiedBalance.toFixed(2))
        };
    }
}

module.exports = Wallet; 