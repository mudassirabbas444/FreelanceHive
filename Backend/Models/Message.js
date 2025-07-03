const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class Message {
  static collectionName = "messages";

  constructor({ senderId, receiverId, message, audio, fileUrl, fileName, fileType, senderName, ideaId = null, replyId = null }) {
    this.senderId = senderId;
    this.receiverId = receiverId;
    this.message = message || '';  // Ensure message is either text or empty
    this.audio = audio || '';      // Ensure audio is either file URL or empty
    this.fileUrl = fileUrl || '';
    this.fileName = fileName || '';
    this.fileType = fileType || '';
    this.senderName = senderName || '';
    this.ideaId = ideaId ? new ObjectId(ideaId) : null;  // For idea-related private chats
    this.replyId = replyId ? new ObjectId(replyId) : null;  // Link to specific idea reply
    this.timestamp = new Date();
  }

  // Send a new message (text or audio)
  static async sendMessage(data) {
    const collection = db.collection(this.collectionName);
    const usersCollection = db.collection("users");
  
    if (!data.senderId || !data.receiverId) {
      throw new Error("Sender ID or Receiver ID is missing.");
    }
  
    try {
      // Get sender's name from users collection
      const sender = await usersCollection.findOne({ _id: new ObjectId(data.senderId) });
      if (!sender) {
        throw new Error("Sender not found");
      }
      
      const messageData = {
        ...data,
        senderName: sender.name
      };
      
      const newMessage = new Message(messageData);
      const result = await collection.insertOne(newMessage);
      console.log("Message inserted successfully:", result);
  
      return result.insertedId;
    } catch (error) {
      console.error("Error inserting message:", error);
      throw new Error("Failed to insert message into database");
    }
  }
  


  // Fetch messages between two users with sender and receiver names
  static async getMessages(userId1, userId2) {
    const collection = db.collection(this.collectionName);
    const usersCollection = db.collection("users");

    try {
      // Convert string IDs to ObjectId
      const user1Id = new ObjectId(userId1);
      const user2Id = new ObjectId(userId2);

      // Get both users' information
      const [user1, user2] = await Promise.all([
        usersCollection.findOne({ _id: user1Id }),
        usersCollection.findOne({ _id: user2Id })
      ]);

      if (!user1 || !user2) {
        throw new Error("One or both users not found");
      }

      const messages = await collection.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId1, receiverId: userId2 },
              { senderId: userId2, receiverId: userId1 }
            ]
          }
        },
        {
          $addFields: {
            senderName: {
              $cond: {
                if: { $eq: ["$senderId", userId1] },
                then: user1.name,
                else: user2.name
              }
            }
          }
        },
        {
          $project: {
            _id: 1,
            senderId: 1,
            receiverId: 1,
            message: 1,
            audio: 1,
            fileUrl: 1,
            fileName: 1,
            fileType: 1,
            timestamp: 1,
            senderName: 1
          }
        },
        { $sort: { timestamp: 1 } }
      ]).toArray();

      return messages;
    } catch (error) {
      console.error("Error fetching messages:", error);
      throw new Error("Failed to fetch messages");
    }
  }
  static async getAllChats(userId) {
    try {
      const collection = db.collection("messages");
      const usersCollection = db.collection("users");
  
      const chats = await collection.aggregate([
        {
          $match: {
            $or: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        },
        {
          $lookup: {
            from: "users",
            let: { senderId: { $toObjectId: "$senderId" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$senderId"] }
                }
              }
            ],
            as: "senderDetails"
          }
        },
        {
          $lookup: {
            from: "users",
            let: { receiverId: { $toObjectId: "$receiverId" } },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$receiverId"] }
                }
              }
            ],
            as: "receiverDetails"
          }
        },
        {
          $unwind: {
            path: "$senderDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $unwind: {
            path: "$receiverDetails",
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            senderId: 1,
            receiverId: 1,
            senderName: { $ifNull: ["$senderDetails.name", ""] },
            receiverName: { $ifNull: ["$receiverDetails.name", ""] }
          }
        },
        { $sort: { timestamp: 1 } }
      ]).toArray();
  
      return chats;
    } catch (error) {
      console.error("Error fetching chats:", error);
      throw new Error(`Error fetching chats: ${error.message}`);
    }
  }
  
  // Save message to database
  async save() {
    try {
      const collection = db.collection(this.constructor.collectionName);
      const result = await collection.insertOne(this);
      return result;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  }

  // Get chat history between two users for a specific idea and reply
  static async getChatHistory(senderId, receiverId, ideaId = null, replyId = null) {
    try {
      const collection = db.collection(this.collectionName);
      const query = {
        $or: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      };

      // Add idea and reply filters if provided
      if (ideaId) {
        query.ideaId = new ObjectId(ideaId);
      }
      if (replyId) {
        query.replyId = new ObjectId(replyId);
      }

      const messages = await collection
        .find(query)
        .sort({ timestamp: 1 })
        .toArray();

      return messages;
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  }

  // Get all chats for a specific idea
  static async getIdeaChats(ideaId) {
    try {
      const collection = db.collection(this.collectionName);
      const messages = await collection
        .find({ ideaId: new ObjectId(ideaId) })
        .sort({ timestamp: 1 })
        .toArray();
      return messages;
    } catch (error) {
      console.error("Error getting idea chats:", error);
      throw error;
    }
  }
}

module.exports = Message;