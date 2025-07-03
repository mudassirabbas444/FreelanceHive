const Gig = require("../Models/Gig");
const { Gig: CollabrativeFilteringGig } = require("../Models/CollabrativeFiltering");
const User = require("../Models/User");

exports.createGig = async (req, res) => {
  try {
    const { file } = req; 
    const gigData = req.body;

    // Add the uploaded image URL to the gig data
    if (file) {
      gigData.images = `/uploads/images/${file.filename}`;
    }

    const gigId = await Gig.createGig(gigData); 
    res.status(201).json({ message: "Gig created successfully.", gigId, imageUrl: gigData.images });
  } catch (error) {
    console.error("Error creating gig:", error);
    res.status(500).json({ error: error.message });
  }
};


// Update a Gig
exports.updateGig = async (req, res) => {
  try {
    const { file } = req; // Extract uploaded file
    const { gigId } = req.params;
    const updateData = req.body;
    if (file) {
      updateData.images = `/uploads/images/${file.filename}`;
    }

    const updated = await Gig.updateGig(gigId, updateData);

    if (!updated) {
      return res.status(404).json({ error: "Gig not found or cannot be updated" });
    }

    res.json({ message: "Gig updated successfully" });
  } catch (error) {
    console.error("Error updating gig:", error);
    res.status(500).json({ error: error.message });
  }
};


// Get a Gig by ID (with Reviews and PricePackages)
exports.getGigById = async (req, res) => {
  try {
    const gig = await Gig.fetchById(req.params.gigId);
    res.json(gig);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fetch Gig List
exports.getSellerGigs = async (req, res) => {
  try {
    const { sellerId } = req.query;
    const gigs = await Gig.fetchSellerGigList(sellerId);
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Fetch Gig List
exports.getAllGigs = async (req, res) => {
  try {
    const { filters } = req.query;
    let parsedFilters = {};
    
    if (filters) {
      try {
        parsedFilters = JSON.parse(filters);
      } catch (error) {
        console.error("Error parsing filters:", error);
      }
    }

    let query = {};
    
    // Handle search by gig title/description
    if (parsedFilters.search) {
      query.$or = [
        { title: { $regex: parsedFilters.search, $options: 'i' } },
        { description: { $regex: parsedFilters.search, $options: 'i' } }
      ];
    }

    // Handle search by seller username
    if (parsedFilters.searchType === 'seller' && parsedFilters.search) {
      const users = await User.viewUserList();
      const matchingUsers = users.filter(user => 
        user.username.toLowerCase().includes(parsedFilters.search.toLowerCase())
      );
      if (matchingUsers && matchingUsers.length > 0) {
        const sellerIds = matchingUsers.map(user => user._id);
        query.sellerId = { $in: sellerIds };
      } else {
        // If no users found, return empty array
        return res.json([]);
      }
    }

    // Handle category filter
    if (parsedFilters.category) {
      query.category = parsedFilters.category;
    }

    // Handle status filter
    if (parsedFilters.status) {
      query.status = parsedFilters.status;
    }

    // Handle price range filter
    if (parsedFilters.minPrice || parsedFilters.maxPrice) {
      query['pricePackages.price'] = {};
      if (parsedFilters.minPrice) {
        query['pricePackages.price'].$gte = parseFloat(parsedFilters.minPrice);
      }
      if (parsedFilters.maxPrice) {
        query['pricePackages.price'].$lte = parseFloat(parsedFilters.maxPrice);
      }
    }

    // Handle delivery time filter
    if (parsedFilters.deliveryTime) {
      query.deliveryTime = { $lte: parseInt(parsedFilters.deliveryTime) };
    }

    // Get all gigs with filters using fetchGigList instead of fetchGigListUser
    const gigs = await Gig.fetchGigList(query);

    // If no gigs found, return empty array
    if (!gigs || gigs.length === 0) {
      return res.json([]);
    }

    // Get seller information for each gig
    const gigsWithSellerInfo = await Promise.all(gigs.map(async (gig) => {
      const seller = await User.viewProfile(gig.sellerId);
      return {
        ...gig,
        sellerUsername: seller ? seller.username : 'Unknown Seller',
        sellerRating: seller ? seller.rating : 0
      };
    }));

    res.json(gigsWithSellerInfo);
  } catch (error) {
    console.error("Error fetching gigs:", error);
    res.status(500).json({ error: error.message });
  }
};
// Pause a Gig
exports.pauseGig = async (req, res) => {
  try {
    
    const { gigId } = req.params;
    await Gig.pauseGig(gigId);
    res.json({ message: "Gig paused successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.activateGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    await Gig.activateGig(gigId);
    res.json({ message: "Gig activated successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// Delete a Gig
exports.deleteGig = async (req, res) => {
  try {
    const { gigId } = req.params; // Only use gigId from parameters
    await Gig.deleteGig(gigId); // Call deleteGig without sellerId
    res.json({ message: "Gig deleted successfully." });
  } catch (error) {
    console.error("Error deleting gig:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.approveGig = async (req, res) => {
  try {
    const { gigId } = req.params;

    await Gig.approveOrRejectGig(gigId, "approve");

    res.status(200).json({ message: "Gig approved successfully." });
  } catch (error) {
    console.error("Error approving gig:", error);
    res.status(500).json({ error: error.message });
  }
};

// Reject Gig
exports.rejectGig = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: "Rejection reason is required." });
    }

    await Gig.approveOrRejectGig(gigId, "reject", rejectionReason);

    res.status(200).json({ message: "Gig rejected successfully." });
  } catch (error) {
    console.error("Error rejecting gig:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ API to track impressions
exports.trackImpression = async (req, res) => {
  try {
    const { gigId } = req.params;
    await Gig.incrementImpressions(gigId);
    res.status(200).json({ message: "Impression tracked successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ API to track clicks
exports.trackClick = async (req, res) => {
  try {
    const { gigId } = req.params;
    await Gig.incrementClicks(gigId);
    res.status(200).json({ message: "Click tracked successfully." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get personalized gig recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const { userId, currentGigId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Get recommendations using the collaborative filtering model
    const recommendations = await CollabrativeFilteringGig.recommendGigs(userId);
    
    // If we have a current gig ID, filter it out from recommendations
    const filteredRecommendations = currentGigId 
      ? recommendations.filter(gig => gig._id.toString() !== currentGigId)
      : recommendations;
    
    // Limit to top 10 recommendations
    const topRecommendations = filteredRecommendations.slice(0, 10);
    
    res.status(200).json(topRecommendations);
  } catch (error) {
    console.error("Error getting recommendations:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ API to track saves
exports.trackSave = async (req, res) => {
  try {
    const { gigId } = req.params;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Track the save interaction for collaborative filtering
    await CollabrativeFilteringGig.trackInteraction(userId, gigId, "save");
    
    res.status(200).json({ message: "Save tracked successfully." });
  } catch (error) {
    console.error("Error tracking save:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get NLP-based similar gig recommendations
exports.getSimilarGigs = async (req, res) => {
  try {
    const { gigId } = req.params;
    
    if (!gigId) {
      return res.status(400).json({ error: "Gig ID is required" });
    }
    
    // Get the current gig details
    const currentGig = await Gig.fetchById(gigId);
    if (!currentGig) {
      return res.status(404).json({ error: "Gig not found" });
    }
    
    // Create a combined text representation of the gig
    const currentGigText = `${currentGig.title} ${currentGig.description} ${currentGig.category} ${currentGig.subcategory || ''}`;
    
    // Get all active gigs
    const allGigs = await Gig.fetchGigListUser({ status: "active" });
    
    // Don't include the current gig in recommendations
    const otherGigs = allGigs.filter(gig => gig._id.toString() !== gigId);
    
    // Use NLP to rank gigs by similarity
    const { rankGigsByRelevance } = require('../Utils/nlpUtils');
    const similarGigs = rankGigsByRelevance(currentGigText, otherGigs, 0.1);
    
    // Limit to top 5 similar gigs
    const topSimilarGigs = similarGigs.slice(0, 5);
    
    console.log(`[NLP Similar Gigs] Found ${topSimilarGigs.length} similar gigs for ${currentGig.title}`);
    if (topSimilarGigs.length > 0) {
      console.log(`[Top Similar Gigs] ${topSimilarGigs.map(g => g.title).join(', ')}`);
    }
    
    res.status(200).json(topSimilarGigs);
  } catch (error) {
    console.error("Error getting similar gigs:", error);
    res.status(500).json({ error: error.message });
  }
};
