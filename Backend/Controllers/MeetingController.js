const Meeting = require("../Models/Meeting");

// ✅ Create Meeting (Now includes hostId & receiverId)
exports.createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.createMeeting(req.body);
    res.status(201).json({ message: "Meeting created", meeting });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ✅ Get All Meetings (Only for host & receiver)
exports.getUserMeetings = async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const meetings = await Meeting.getUserMeetings(userId);
    res.status(200).json(meetings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};

// ✅ Delete Meeting (Only Host)
exports.deleteMeeting = async (req, res) => {
  try {
    const result = await Meeting.deleteMeeting(req.params.meetingId, req.body.userId);
    res.status(200).json({ message: "Meeting deleted", result });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
};
