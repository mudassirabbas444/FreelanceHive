const express = require("express");
const gigController = require("../Controllers/GigController");
const multer = require("multer");
const upload = multer({ dest: "uploads/images/" });

const router = express.Router();

router.post("/gigs", upload.single("image"), gigController.createGig);

router.get("/gigs", gigController.getAllGigs);
router.get("/gigs/seller", gigController.getSellerGigs);

router.get("/gigs/:gigId", gigController.getGigById);

router.put("/gigs/update/:gigId",upload.single("image"), gigController.updateGig);

router.put("/gigs/pause/:gigId", gigController.pauseGig);
router.put("/gigs/activate/:gigId", gigController.activateGig);

router.delete("/gigs/:gigId", gigController.deleteGig);
router.patch("/gigs/:gigId/approve", gigController.approveGig);
router.patch("/gigs/:gigId/reject", gigController.rejectGig);
// ✅ Track Impressions
router.post("/gigs/:gigId/impression", gigController.trackImpression);

// ✅ Track Clicks
router.post("/gigs/:gigId/click", gigController.trackClick);

// ✅ Get personalized gig recommendations
router.post("/gigs/recommendations", gigController.getRecommendations);

// ✅ Track Saves
router.post("/gigs/:gigId/save", gigController.trackSave);

// ✅ Get NLP-based similar gigs
router.get("/gigs/:gigId/similar", gigController.getSimilarGigs);

module.exports = router;
