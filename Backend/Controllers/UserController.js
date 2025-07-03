// Update User Profile
const User = require("../Models/User");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require('google-auth-library');
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Role = require("../Models/Role");
const Admin = require("../Models/Admin");
const Seller = require("../Models/Seller");

// Google OAuth2 configuration
const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
);

oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
});

// Signup
exports.signup = async (req, res) => {
  try {
      const userId = await User.signup(req.body);
      res.status(201).json({ message: "User signed up successfully.", userId });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
      const { email, password, role } = req.body;
      const { token, user } = await User.login(email, password, role);
      res.json({ message: "Login successful.", token, user });
  } catch (error) {
      res.status(401).json({ error: error.message });
  }
};

exports.viewProfile = async (req, res) => {
    try {
        const user = await User.viewProfile(req.params.id);
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };
  exports.updateProfile = async (req, res) => {
    try {
        await User.updateProfile(req.params.id, req.body);
        res.json({ message: "User profile updated successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };
    
  exports.updateProfile = async (req, res) => {
    try {
        await User.updateProfile(req.params.id, req.body);
        res.json({ message: "User profile updated successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };
  exports.deleteProfile = async (req, res) => {
    try {
        await User.deleteProfile(req.params.id);
        res.json({ message: "User profile deleted successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };
    
  exports.viewUserList = async (req, res) => {
    try {
        const { role } = req.query; // Optional role filter from query params
        const users = await User.viewUserList(role);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };

  exports.blockUser = async (req, res) => {
    try {
        await User.blockUser(req.params.id);
        res.json({ message: "User blocked successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };
  exports.unBlockUser = async (req, res) => {
    try {
        await User.unBlockUser(req.params.id);
        res.json({ message: "User unblocked successfully." });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
  };
  
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Check if user exists
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ error: "User with this email does not exist." });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenHash = await bcrypt.hash(resetToken, 10);

        // Save reset token hash in the database
        const result = await User.saveResetToken(email, resetTokenHash);
        if (!result) {
            throw new Error("Failed to generate reset token.");
        }

        // Create reset link
        const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

        // Get access token
        const { token } = await oauth2Client.getAccessToken();

        // Create transporter with OAuth2
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GOOGLE_EMAIL,
                clientId: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
                accessToken: token
            }
        });

        // Send email
        await transporter.sendMail({
            from: `FreelanceHive <${process.env.GOOGLE_EMAIL}>`,
            to: email,
            subject: "Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>You requested a password reset for your FreelanceHive account.</p>
                    <p>Click the button below to reset your password:</p>
                    <a href="${resetLink}" 
                       style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Reset Password
                    </a>
                    <p>If you did not request this password reset, please ignore this email.</p>
                    <p>This link will expire in 1 hour.</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
                </div>
            `
        });

        res.status(200).json({ message: "Password reset email sent successfully." });
    } catch (error) {
        console.error("Error in forgotPassword:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;
  
      // Validate token and get user
      const user = await User.findUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ error: "Invalid or expired reset token." });
      }
  
      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
  
      // Update the user's password and remove the reset token
      const result = await User.updatePasswordAndClearToken(user.email, hashedPassword);
      if (!result) {
        throw new Error("Failed to reset the password.");
      }
  
      res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(500).json({ error: error.message });
    }
  };
  
  exports.getSellerDashboardData= async (req, res)=> {
    try {
      const userId = req.params.id;

      const data = await Seller.fetchDashboardData(userId);
      res.status(200).json(data);
    } catch (error) {
      console.error("Error in SellerDashboardController:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
  
// Create Role
exports.createRole = async (req, res) => {
  try {
      const roleId = await Role.createRole(req.body);
      res.status(201).json({ message: "Role created successfully.", roleId });
  } catch (error) {
      console.error("Error creating role:", error);
      res.status(400).json({ error: error.message }); // Use 400 for validation errors
  }
};

// Delete Role
exports.deleteRole = async (req, res) => {
  try {
      const { id } = req.params;
      await Role.deleteRole(id);
      res.status(200).json({ message: "Role deleted successfully." });
  } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: error.message });
  }
};

exports.getRoles = async (req, res) => {
  try {
      const roles = await Role.getAllRoles();
      res.status(200).json(roles);
  } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ error: "Unable to fetch roles." });
  }
};

exports.createProfile = async (req, res) => {
  try {
      const { name, email, username, password, role } = req.body;

      // Create admin
      const adminId = await Admin.create({ name, email, username, password, role });

      res.status(201).json({
          message: "Admin created successfully.",
          adminId
      });
  } catch (error) {
      console.error("Error creating admin:", error);
      res.status(500).json({ error: error.message });
  }
};
