const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class PricePackage {
    static collectionName = "pricePackages";
  
    constructor({ name, price, deliveryTime, revisions, gigId }) {
      this.name = name;
      this.price = price;
      this.deliveryTime = deliveryTime;
      this.revisions = revisions;
      this.gigId = gigId;
      this.createdAt = new Date();
      this.updatedAt = new Date();
    }
  
    // Create a PricePackage
    static async createPricePackage(data) {
      const collection = db.collection(this.collectionName);
      console.log(data);
      const result = await collection.insertOne(data);
      console.log(result)
      return result.insertedId;
    }
  
    // Get PricePackages by Gig ID
    static async getPricePackagesByGigId(gigId) {
      const collection = db.collection(this.collectionName);
      return await collection.find({ gigId: new ObjectId(gigId) }).toArray();
    }
  
    // Delete all PricePackages by Gig ID
    static async deleteAllByGigId(gigId) {
      const collection = db.collection(this.collectionName);
      await collection.deleteMany({ gigId: new ObjectId(gigId) });
    }
  }
  module.exports = PricePackage;  