const express = require("express");
const router = express.Router();
const BuyerRequestController = require("../Controllers/BuyerRequestController");

router.post("/create-buyer-request", BuyerRequestController.createBuyerRequest);
router.get("/buyer-requests", BuyerRequestController.getBuyerRequests);
router.get("/buyer-requests/:buyerId", BuyerRequestController.getBuyerRequestsByBuyerId);
router.get("/buyerRequest/:requestId", BuyerRequestController.getBuyerRequestById);
router.put("/buyerRequest/close/:requestId", BuyerRequestController.closeBuyerRequest);
router.put("/buyerRequest/delete/:requestId", BuyerRequestController.deleteBuyerRequest);
router.put("/buyerRequest/approve/:requestId", BuyerRequestController.approveRequest);
router.put("/buyerRequest/reject/:requestId", BuyerRequestController.rejectRequest);


module.exports = router;
