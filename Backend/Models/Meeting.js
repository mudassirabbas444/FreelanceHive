const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class Meeting {
  static collectionName = "meetings";

  constructor({ hostId, receiverId, topic, start_time, duration, password }) {
    this.hostId = hostId;
    this.receiverId = receiverId;
    this.topic = topic;
    this.start_time = start_time;
    this.duration = duration;
    this.password = password;
    this.meetingUrl = `https://meet.jit.si/${new ObjectId()}`;
  }

  // ✅ Create Meeting
  static async createMeeting(data) {
    const collection = db.collection(this.collectionName);

    if (!data.hostId || !data.receiverId || !data.topic || !data.start_time || !data.duration) {
      throw new Error("Missing required fields.");
    }

    const newMeeting = new Meeting(data);

    try {
      const result = await collection.insertOne(newMeeting);
      return newMeeting;
    } catch (error) {
      console.error("Error inserting meeting:", error);
      throw new Error("Failed to insert meeting into database");
    }
  }

  // ✅ Get all meetings for a user (host or receiver)
  static async getUserMeetings(userId) {
    const collection = db.collection(this.collectionName);
    return await collection.find({
      $or: [{ hostId: userId }, { receiverId: userId }]
    }).toArray();
  }

  // ✅ Delete Meeting (Only host can delete)
  static async deleteMeeting(meetingId, userId) {
    const collection = db.collection(this.collectionName);
    const meeting = await collection.findOne({ _id: new ObjectId(meetingId) });

    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    if (meeting.hostId !== userId) {
      throw new Error("Unauthorized: Only the host can delete this meeting.");
    }

    return await collection.deleteOne({ _id: new ObjectId(meetingId) });
  }
}

module.exports = Meeting;
