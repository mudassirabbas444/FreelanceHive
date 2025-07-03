const express = require("express");
const router = express.Router();
const meetingController = require("../Controllers/meetingController");

router.post("/meetings/create", meetingController.createMeeting);
router.get("/meetings/all", meetingController.getUserMeetings);
router.delete("/meetings/:meetingId", meetingController.deleteMeeting);

module.exports = router;
