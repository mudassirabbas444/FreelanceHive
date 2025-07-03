const express = require("express");
const router = express.Router();
const ProposalController = require("../Controllers/ProposalController");

// Submit a proposal
router.post("/proposals", ProposalController.submitProposal);

// Get all proposals for a specific buyer request
router.get("/proposals/:requestId", ProposalController.getProposalsByBuyerRequestId);

router.put("/proposals/status/:proposalId", ProposalController.updateProposalStatus);

router.get("/proposals/check/:sellerId/:buyerRequestId", ProposalController.checkExistingProposal);


module.exports = router;
