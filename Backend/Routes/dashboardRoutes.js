const express = require('express');
const router = express.Router();
const dashboardController = require('../Controllers/DashboardController');

// Admin Dashboard Route
router.get('/admin/dashboard/:userId', dashboardController.getAdminDashboard);

// Seller Dashboard Route
router.get('/seller/dashboard/:userId',  dashboardController.getSellerDashboard);

// Buyer Dashboard Route
router.get('/buyer/dashboard/:userId',  dashboardController.getBuyerDashboard);

module.exports = router; 