const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

// Connect to MongoDB
async function connect() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    return db;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
}

// Get database instance
function getDb() {
  return db;
}

module.exports = {
  connect,
  getDb,
  ObjectId
}; 