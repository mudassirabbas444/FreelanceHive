const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class ShareholderRequest {
    static collectionName = "shareholderRequests";

    static async create(data) {
        const collection = db.collection(this.collectionName);
        
        console.log('Creating shareholder request with data:', data); // Debug log

        // Check if a request already exists for this reply
        const existingRequest = await collection.findOne({
            replyId: data.replyId
        });

        console.log('Existing request check:', existingRequest); // Debug log

        if (existingRequest) {
            throw new Error("A shareholder request already exists for this reply");
        }

        const shareholderRequest = {
            buyerId: new ObjectId(data.buyerId),
            sellerId: new ObjectId(data.sellerId),
            ideaId: new ObjectId(data.ideaId),
            replyId: data.replyId, // Store as string
            ideaTitle: data.ideaTitle,
            contributionType: data.contributionType,
            contributionDetails: data.contributionDetails,
            equityRequested: data.equityRequested,
            status: 'agreementPending',
            agreementDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            createdAt: new Date(),
            agreementPdf: data.agreementPdf || null,
            pdfPath: data.pdfPath || null,
            buyerSignedAgreementPdf: null,
            buyerSignedPdfPath: null,
            sellerSignedAgreementPdf: null,
            sellerSignedPdfPath: null,
            buyerSignedAt: null,
            sellerSignedAt: null
        };

        console.log('Creating new shareholder request:', shareholderRequest); // Debug log

        const result = await collection.insertOne(shareholderRequest);
        const createdRequest = { id: result.insertedId, ...shareholderRequest };
        
        console.log('Created shareholder request:', createdRequest); // Debug log
        
        return createdRequest;
    }

    static async updatePdf(requestId, pdfData) {
        const collection = db.collection(this.collectionName);
        
        if (!ObjectId.isValid(requestId)) {
            throw new Error("Invalid request ID");
        }

        const result = await collection.updateOne(
            { _id: new ObjectId(requestId) },
            { 
                $set: {
                    agreementPdf: pdfData.url,
                    pdfPath: pdfData.path,
                    updatedAt: new Date()
                }
            }
        );

        if (result.matchedCount === 0) {
            throw new Error("Shareholder request not found");
        }

        return await collection.findOne({ _id: new ObjectId(requestId) });
    }

    static async getByBuyerId(buyerId) {
        const collection = db.collection(this.collectionName);
        
        if (!ObjectId.isValid(buyerId)) {
            throw new Error("Invalid buyer ID");
        }

        const requests = await collection.find({
            buyerId: new ObjectId(buyerId)
        }).toArray();

        // Populate buyer and seller information
        const populatedRequests = await Promise.all(requests.map(async (request) => {
            const buyer = await db.collection("users").findOne({ _id: request.buyerId });
            const seller = await db.collection("users").findOne({ _id: request.sellerId });
            const idea = await db.collection("ideas").findOne({ _id: request.ideaId });
            
            return {
                ...request,
                buyerId: buyer ? { _id: buyer._id, name: buyer.name } : null,
                sellerId: seller ? { _id: seller._id, name: seller.name } : null,
                ideaId: idea ? { _id: idea._id, title: idea.title } : null
            };
        }));

        return populatedRequests;
    }

    static async getBySellerId(sellerId) {
        const collection = db.collection(this.collectionName);
        
        if (!ObjectId.isValid(sellerId)) {
            throw new Error("Invalid seller ID");
        }

        const requests = await collection.find({
            sellerId: new ObjectId(sellerId)
        }).toArray();

        // Populate buyer and seller information
        const populatedRequests = await Promise.all(requests.map(async (request) => {
            const buyer = await db.collection("users").findOne({ _id: request.buyerId });
            const seller = await db.collection("users").findOne({ _id: request.sellerId });
            const idea = await db.collection("ideas").findOne({ _id: request.ideaId });
            
            return {
                ...request,
                buyerId: buyer ? { _id: buyer._id, name: buyer.name } : null,
                sellerId: seller ? { _id: seller._id, name: seller.name } : null,
                ideaId: idea ? { _id: idea._id, title: idea.title } : null
            };
        }));

        return populatedRequests;
    }

    static async updateStatus(requestId, updateData) {
        const collection = db.collection(this.collectionName);
        
        if (!ObjectId.isValid(requestId)) {
            throw new Error("Invalid request ID");
        }

        // Map action values to status values
        let mappedStatus = updateData.status;
        if (updateData.status === 'accept') {
            mappedStatus = 'accepted';
        } else if (updateData.status === 'reject') {
            mappedStatus = 'rejected';
        } else if (updateData.status === 'uploadSigned') {
            mappedStatus = 'completed';
        }

        if (!['pending', 'agreementPending', 'accepted', 'rejected', 'completed', 'finalized', 'cancelled'].includes(mappedStatus)) {
            throw new Error(`Invalid status: ${updateData.status}`);
        }

        // Create update object with all possible fields
        const update = {
            $set: {
                status: mappedStatus,
                updatedAt: new Date()
            }
        };

        // Add all provided fields to the update
        if (updateData.buyerSignedAgreementPdf) {
            update.$set.buyerSignedAgreementPdf = updateData.buyerSignedAgreementPdf;
        }
        if (updateData.buyerSignedPdfPath) {
            update.$set.buyerSignedPdfPath = updateData.buyerSignedPdfPath;
        }
        if (updateData.buyerSignedAt) {
            update.$set.buyerSignedAt = updateData.buyerSignedAt;
        }
        if (updateData.sellerSignedAgreementPdf) {
            update.$set.sellerSignedAgreementPdf = updateData.sellerSignedAgreementPdf;
        }
        if (updateData.sellerSignedPdfPath) {
            update.$set.sellerSignedPdfPath = updateData.sellerSignedPdfPath;
        }
        if (updateData.sellerSignedAt) {
            update.$set.sellerSignedAt = updateData.sellerSignedAt;
        }
        if (updateData.agreementPdf) {
            update.$set.agreementPdf = updateData.agreementPdf;
        }
        if (updateData.pdfPath) {
            update.$set.pdfPath = updateData.pdfPath;
        }

        console.log('Updating request with:', update); // Debug log

        const result = await collection.updateOne(
            { _id: new ObjectId(requestId) },
            update
        );

        if (result.matchedCount === 0) {
            throw new Error("Shareholder request not found");
        }

        return await collection.findOne({ _id: new ObjectId(requestId) });
    }

    // Add new method to find request by replyId
    static async findByReplyId(replyId) {
        const collection = db.collection(this.collectionName);
        
        console.log('Finding request for replyId:', replyId); // Debug log

        // Find request by string comparison of replyId
        const request = await collection.findOne({
            replyId: replyId
        });

        console.log('Found request:', request); // Debug log

        if (request) {
            // Populate buyer and seller information
            const buyer = await db.collection("users").findOne({ _id: request.buyerId });
            const seller = await db.collection("users").findOne({ _id: request.sellerId });
            const idea = await db.collection("ideas").findOne({ _id: request.ideaId });
            
            return {
                ...request,
                buyerId: buyer ? { _id: buyer._id, name: buyer.name } : null,
                sellerId: seller ? { _id: seller._id, name: seller.name } : null,
                ideaId: idea ? { _id: idea._id, title: idea.title } : null
            };
        }

        return null;
    }

    // Add new method to find request by _id
    static async findById(requestId) {
        const collection = db.collection(this.collectionName);
        
        console.log('Finding request by ID:', requestId); // Debug log

        if (!ObjectId.isValid(requestId)) {
            throw new Error("Invalid request ID");
        }

        const request = await collection.findOne({
            _id: new ObjectId(requestId)
        });

        console.log('Found request:', request); // Debug log

        if (request) {
            // Store original IDs
            const originalBuyerId = request.buyerId;
            const originalSellerId = request.sellerId;

            // Populate buyer and seller information
            const buyer = await db.collection("users").findOne({ _id: request.buyerId });
            const seller = await db.collection("users").findOne({ _id: request.sellerId });
            const idea = await db.collection("ideas").findOne({ _id: request.ideaId });
            
            return {
                ...request,
                // Keep original IDs and add populated data
                buyerId: originalBuyerId,
                sellerId: originalSellerId,
                buyerDetails: buyer ? { _id: buyer._id, name: buyer.name } : null,
                sellerDetails: seller ? { _id: seller._id, name: seller.name } : null,
                ideaDetails: idea ? { _id: idea._id, title: idea.title } : null
            };
        }

        return null;
    }
}

module.exports = ShareholderRequest; 