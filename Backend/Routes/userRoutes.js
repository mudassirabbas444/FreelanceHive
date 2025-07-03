const express = require("express");
const userController = require("../Controllers/UserController");

const router = express.Router();

router.post("/users",userController.signup );
router.post("/users/login", userController.login);
// Route for viewing detailed profile
router.get('/profile/view/:id', userController.viewProfile);

// Route for updating a profile
router.put('/profile/update/:id', userController.updateProfile);

// Route for deleting a profile
router.delete('/profile/delete/:id', userController.deleteProfile);

// Route for viewing the user list
router.get('/users/list', userController.viewUserList);

// Route for blocking a user
router.put('/users/block/:id', userController.blockUser);
router.put('/users/unblock/:id', userController.unBlockUser);

// Route for forgetting password
router.post('/password/forget', userController.forgotPassword);

router.get('/dashboard/seller/:id', userController.getSellerDashboardData);
router.post("/auth/forgot-password", userController.forgotPassword);

// Reset Password Route
router.post("/auth/reset-password/:token", userController.resetPassword);

// Role Routes
router.post("/roles", userController.createRole);
router.delete("/roles/:id", userController.deleteRole); 

// Role Routes
router.get("/allRoles", userController.getRoles);

// Profile routes
router.post('/profile/create', userController.createProfile);

// Get seller signature


module.exports = router;
