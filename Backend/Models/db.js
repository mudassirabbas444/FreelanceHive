const { MongoClient } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";

let db;

async function connectDB() {
    await client.connect();
    db = client.db(dbName);
    console.log("Connected to MongoDB");
}

function getDB() {
    if (!db) throw new Error("Database not connected!");
    return db;
}

module.exports = { connectDB, getDB };
