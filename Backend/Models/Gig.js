const { MongoClient, ObjectId } = require("mongodb");
const Review=require("./Review")
const PricePackage=require("./PricePackage")
const { rankGigsByRelevance } = require("../Utils/nlpUtils");
// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class Gig {
  static collectionName = "gigs";

  constructor({
    title,
    description,
    category,
    subcategory,
    sellerId,
    images = [],
    tags = [],
    pricePackages = [],
    prerequisites,
  }) {
    this.title = title;
    this.description = description;
    this.category = category;
    this.subcategory = subcategory;
    this.images = images;
    this.status = "pending";
    this.rating = 0;
    this.reviews = [];
    this.sellerId = sellerId;
    this.tags = tags;
    this.pricePackages = pricePackages; 
    this.prerequisites = prerequisites;
    this.createdAt = new Date();
    this.updatedAt = new Date();

    // ✅ Add new tracking metrics
    this.impressions = 0;
    this.clicks = 0;
    this.clickThroughRate = 0;
  }

  // ✅ Increment Impressions
  static async incrementImpressions(gigId) {
    const collection = db.collection(this.collectionName);
    const result = await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $inc: { impressions: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (!result.matchedCount) {
      throw new Error("Gig not found.");
    }

    // ✅ Update CTR after incrementing impressions
    await this.updateClickThroughRate(gigId);
    return true;
  }

  // ✅ Increment Clicks
  static async incrementClicks(gigId) {
    const collection = db.collection(this.collectionName);
    const result = await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $inc: { clicks: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (!result.matchedCount) {
      throw new Error("Gig not found.");
    }

    // ✅ Update CTR after incrementing clicks
    await this.updateClickThroughRate(gigId);
    return true;
  }

  // ✅ Update Click-Through Rate (CTR)
  static async updateClickThroughRate(gigId) {
    const collection = db.collection(this.collectionName);
    const gig = await collection.findOne({ _id: new ObjectId(gigId) });
    
    if (!gig) {
      throw new Error("Gig not found.");
    }

    const ctr = gig.impressions > 0 ? (gig.clicks / gig.impressions) * 100 : 0;
    
    await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $set: { 
          clickThroughRate: parseFloat(ctr.toFixed(2)),
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  }


  // Create a Gig
  static async createGig(data) {
    const collection = db.collection(this.collectionName);
    const { pricePackages, ...gigData } = data;
    const gig = new Gig(gigData);

    const result = await collection.insertOne(gig);
    const gigId = result.insertedId;
    for (const pkg of pricePackages) {
      const pricePackageData = new PricePackage({ ...pkg, gigId });
      await PricePackage.createPricePackage(pricePackageData);
    }

    return gigId;
  }

  static async updateAverageRating(gigId) {
    const gigCollection = db.collection(this.collectionName);
    const reviewCollection = db.collection(Review.collectionName);

    const reviews = await reviewCollection.find({ gigId: new ObjectId(gigId) }).toArray();
    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / (reviews.length || 1);

    await gigCollection.updateOne(
      { _id: new ObjectId(gigId) },
      { $set: { rating: averageRating } }
    );
  }
  //update Gig
  static async updateGig(gigId, updateData) {
    const collection = db.collection(this.collectionName);
     console.log(gigId);
    if (updateData._id) {
      delete updateData._id;
    }
  
    const { pricePackages, ...gigUpdates } = updateData;
    gigUpdates.updatedAt = new Date();
  
    const result = await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { $set: gigUpdates }
    );
  
    if (!result.matchedCount) {
      throw new Error("Gig not found or cannot be updated.");
    }
    if (pricePackages) {
      for (const pkg of pricePackages) {
        const pricePackageData = new PricePackage({ ...pkg, gigId });
        console.log(pricePackageData);
        await PricePackage.createPricePackage(pricePackageData);
      }
    }
  
    return result.modifiedCount > 0;
  }
  

  // Fetch a Gig with Reviews and PricePackages
  static async fetchById(gigId) {
    const collection = db.collection(this.collectionName);

    const gig = await collection.findOne({ _id: new ObjectId(gigId) });
    if (!gig) throw new Error("Gig not found.");

    gig.reviews = await Review.getReviewsByGigId(gigId);
    gig.pricePackages = await PricePackage.getPricePackagesByGigId(gigId);

    return gig;
  }

  // Fetch Gig List (with optional filters)
  static async fetchSellerGigList(sellerId) {
    const collection = db.collection(this.collectionName);

    const query = { sellerId: sellerId };

    const gigs = await collection.find(query).toArray();

    // Attach reviews and price packages for each gig
    for (const gig of gigs) {
      gig.reviews = await Review.getReviewsByGigId(gig._id);
      gig.pricePackages = await PricePackage.getPricePackagesByGigId(gig._id);
    }

    return gigs;
  };


  static async fetchGigList(filters) {
    const collection = db.collection(this.collectionName);
    const query = {};
  
    // Apply category filter
    if (filters.category) {
      query.category = filters.category;
    }
  
    // Apply status filter
    if (filters.status) {
      query.status = filters.status;
    }
  
    // Apply price filter on the first package
    if (filters.price) {
      if (filters.price === '< $50') {
        query['pricePackages.0.price'] = { $lt: 50 };
      } else if (filters.price === '$50 - $200') {
        query['pricePackages.0.price'] = { $gte: 50, $lte: 200 };
      } else if (filters.price === '$200+') {
        query['pricePackages.0.price'] = { $gte: 200 }; 
      }
    }
  
    // Fetch matching gigs
    let gigs = await collection.find(query).toArray();
  
    // Populate additional data for each gig
    for (const gig of gigs) {
      gig.reviews = await Review.getReviewsByGigId(gig._id);
      gig.pricePackages = await PricePackage.getPricePackagesByGigId(gig._id);
    }
  
    // Apply NLP-based semantic search if search query is provided
    if (filters.search) {
      gigs = rankGigsByRelevance(filters.search, gigs);
    }
  
    return gigs;
  }
  
  static async fetchGigListUser(filters) {
    const collection = db.collection(this.collectionName);
    const query = {};
  
    // Apply category filter
    if (filters.category) {
      query.category = filters.category;
    }

    query.status = "active";
  
    // Apply price filter on the first package
    if (filters.price) {
      if (filters.price === '< $50') {
        query['pricePackages.0.price'] = { $lt: 50 }; // First package price less than 50
      } else if (filters.price === '$50 - $200') {
        query['pricePackages.0.price'] = { $gte: 50, $lte: 200 }; // First package price between 50 and 200
      } else if (filters.price === '$200+') {
        query['pricePackages.0.price'] = { $gte: 200 }; // First package price greater than or equal to 200
      }
    }
  
    // Fetch matching gigs
    let gigs = await collection.find(query).toArray();
  
    // Populate additional data for each gig
    for (const gig of gigs) {
      gig.reviews = await Review.getReviewsByGigId(gig._id);
      gig.pricePackages = await PricePackage.getPricePackagesByGigId(gig._id);
    }
  
    // Apply NLP-based semantic search if search query is provided
    if (filters.search) {
      gigs = rankGigsByRelevance(filters.search, gigs);
    }
  
    return gigs;
  }
  static async hasActiveOrders(gigId) {
    const orderCollection = db.collection("orders"); 
    const activeOrderStatuses = ["Active", "Cancel Request", "Pending", "Disputed","Modification Requested"];
    const activeOrdersCount = await orderCollection.countDocuments({
      gigId: new ObjectId(gigId),
      status: { $in: activeOrderStatuses },
    });
  
    return activeOrdersCount > 0;
  }
  // Delete a Gig
  static async deleteGig(gigId) {
    const collection = db.collection(this.collectionName);
    const hasActiveOrders = await this.hasActiveOrders(gigId);
    if (hasActiveOrders) {
      throw new Error("Gig cannot be deleted because it has active orders.");
    }
    const result = await collection.updateOne(
      {
        _id: new ObjectId(gigId),
        status: { $in: ["active", "paused", "pending"] },
      },
      { $set: { status: "deleted", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error("Gig not found or already deleted.");
    }
    return true;
  };
  // Admin Approve or Reject Gig
static async approveOrRejectGig(gigId, action, rejectionReason) {
  const collection = db.collection(this.collectionName);

  if (!["approve", "reject"].includes(action)) {
    throw new Error("Invalid action. Use 'approve' or 'reject'.");
  }

  const update = action === "approve"
    ? { status: "active", updatedAt: new Date() }
    : { status: "rejected", rejectionReason, updatedAt: new Date() };

  const result = await collection.updateOne(
    { _id: new ObjectId(gigId), status: "pending" },
    { $set: update }
  );

  if (!result.matchedCount) {
    throw new Error("Gig not found or not in pending status.");
  }
}


  static async pauseGig(gigId) {
    const collection = db.collection(this.collectionName);
    const hasActiveOrders = await this.hasActiveOrders(gigId);
    if (hasActiveOrders) {
      throw new Error("Gig cannot be deleted because it has active orders.");
    }
    const result = await collection.updateOne(
      {
        _id: new ObjectId(gigId)
      },
      { $set: { status: "paused", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error("Gig not active or does not exist.");
    }
    return true;
  }
  static async activateGig(gigId) {
    const collection = db.collection(this.collectionName);

    const result = await collection.updateOne(
      {
        _id: new ObjectId(gigId)
      },
      { $set: { status: "active", updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      throw new Error("Gig not active or does not exist.");
    }
    return true;
  }

  // Add new methods for tracking impressions and clicks
  static async incrementImpressions(gigId) {
    const collection = db.collection(this.collectionName);
    const result = await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $inc: { impressions: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (!result.matchedCount) {
      throw new Error("Gig not found.");
    }

    // Update CTR after incrementing impressions
    await this.updateClickThroughRate(gigId);
    return true;
  }

  static async incrementClicks(gigId) {
    const collection = db.collection(this.collectionName);
    const result = await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $inc: { clicks: 1 },
        $set: { updatedAt: new Date() }
      }
    );
    
    if (!result.matchedCount) {
      throw new Error("Gig not found.");
    }

    // Update CTR after incrementing clicks
    await this.updateClickThroughRate(gigId);
    return true;
  }

  static async updateClickThroughRate(gigId) {
    const collection = db.collection(this.collectionName);
    const gig = await collection.findOne({ _id: new ObjectId(gigId) });
    
    if (!gig) {
      throw new Error("Gig not found.");
    }

    const ctr = gig.impressions > 0 ? (gig.clicks / gig.impressions) * 100 : 0;
    
    await collection.updateOne(
      { _id: new ObjectId(gigId) },
      { 
        $set: { 
          clickThroughRate: parseFloat(ctr.toFixed(2)),
          updatedAt: new Date()
        }
      }
    );
    
    return true;
  }
}

module.exports = Gig;
