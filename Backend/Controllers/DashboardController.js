const Admin = require("../Models/Admin");
const Seller = require("../Models/Seller");
const Buyer = require("../Models/Buyer");


// Admin Dashboard
exports.getAdminDashboard = async (req, res) => {
    try {
    

        const { startDate, endDate } = req.query;
        const dashboardData = await Admin.fetchDashboardData(req.params.userId, startDate, endDate);
        res.json(dashboardData);
    } catch (error) {
        console.error("Error in admin dashboard:", error);
        res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
    }
};

// Seller Dashboard
exports.getSellerDashboard = async (req, res) => {
    try {

        const { startDate, endDate } = req.query;
        const dashboardData = await Seller.fetchDashboardData(req.params.userId, startDate, endDate);
        res.json(dashboardData);
    } catch (error) {
        console.error("Error in seller dashboard:", error);
        res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
    }
};

// Buyer Dashboard
exports.getBuyerDashboard = async (req, res) => {
    try {
       
        const { startDate, endDate } = req.query;
        const dashboardData = await Buyer.fetchDashboardData(req.params.userId, startDate, endDate);
        res.json(dashboardData);
    } catch (error) {
        console.error("Error in buyer dashboard:", error);
        res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
    }
}; 