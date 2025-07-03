const { MongoClient, ObjectId } = require("mongodb");
const Gig = require("./Gig");

// MongoDB connection setup
const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class Review {
  static collectionName = "reviews";

  constructor({ review, rating, clientId, gigId }) {
    this.review = review;
    this.rating = rating;
    this.clientId = clientId;
    this.gigId = gigId;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Create a Review
  static async createReview(data) {
    const collection = db.collection(this.collectionName);
    // Insert review into the database
    const result = await collection.insertOne(data);

    // Update gig's review list and average rating
    await this.updateAverageRating(data.gigId);

    return result.insertedId;
  }
  static async updateAverageRating(gigId) {
    const gigCollection = db.collection("gigs");
    const reviewCollection = db.collection("reviews");
  
    // Fetch all reviews for the given gig
    const reviews = await reviewCollection.find({ gigId: gigId }).toArray();
  
    // If no reviews exist, set the rating to 0
    if (!reviews.length) {
      await gigCollection.updateOne(
        { _id: new ObjectId(gigId) },
        { $set: { rating: 0, updatedAt: new Date() } }
      );
      return;
    }

    // Calculate the average rating
    const averageRating =
      reviews.reduce((sum, review) => sum + parseFloat(review.rating), 0) /
      reviews.length;
  
    // Update the gig's average rating
    await gigCollection.updateOne(
      { _id: new ObjectId(gigId) },
      { $set: { rating: averageRating, updatedAt: new Date() } }
    );
  }

  // Get Reviews by Gig ID
  static async getReviewsByGigId(gigId) {
    const reviewCollection = db.collection(this.collectionName);
    const userCollection = db.collection("users"); 
  
    // Fetch all reviews for the given gig
    const reviews = await reviewCollection.find({ gigId: gigId }).toArray();
  
    // Fetch and add username for each review
    const reviewsWithUsernames = await Promise.all(
      reviews.map(async (review) => {
        const user = await userCollection.findOne({ _id: new ObjectId(review.clientId) });
        return {
          ...review,
          username: user ? user.username : "Unknown User", 
        };
      })
    );
  
    return reviewsWithUsernames;
  }
  
}

module.exports = Review;
