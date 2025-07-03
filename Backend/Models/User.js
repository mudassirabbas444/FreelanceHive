const { ObjectId, getDb } = require("../config/database");
const Buyer = require("./Buyer");
const Seller = require("./Seller");
const Admin = require("./Admin");

class User {
    static collectionName = "users";
    static async signup(data) {
        switch (data.role) {
            case "Buyer":
                return await Buyer.signup(data);
            case "Seller":
                return await Seller.signup(data);
            case "Admin":
                return await Admin.create(data);
            default:
                throw new Error("Invalid role. Only Buyer or Seller can sign up.");
        }
    }

    static async login(email, password, role) {
        switch (role) {
            case "Buyer":
                return await Buyer.login(email, password);
            case "Seller":
                return await Seller.login(email, password);
            case "Admin":
                return await Admin.login(email, password);
            default:
                throw new Error("Invalid role. Please specify a valid role.");
        }
    }
       static async viewProfile(userId) {
        const collection = getDb().collection(this.collectionName);
    
        // Find user by ID
        const user = await collection.findOne({ _id: new ObjectId(userId) }, { projection: { password: 0 } });
        if (!user) {
            throw new Error("User not found.");
        }
        return user;
    }
    static async updateProfile(userId, updates) {
        const collection = getDb().collection(this.collectionName);
    
        // Update user information
        updates.updatedAt = new Date();
        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: updates }
        );
        if (result.matchedCount === 0) {
            throw new Error("User not found.");
        }
        return "Profile updated successfully.";
    }
    
    static async deleteProfile(userId) {
        const collection = getDb().collection(this.collectionName);
    
        // Update user to set isDeleted to true
        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { status: "Deleted" } }
        );
    
        if (result.matchedCount === 0) {
            throw new Error("User not found.");
        }
        return "Profile marked as deleted successfully.";
    }
    
     
    static async viewUserList(role) {
        const collection = getDb().collection(this.collectionName);
    
        // Query users with optional role filter
        const query = role ? { role } : {};
        const users = await collection.find(query, { projection: { password: 0 } }).toArray();
        return users;
    }
    static async blockUser(userId) {
    
        const collection = getDb().collection(this.collectionName);
    
        // Block user
        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isBlocked: true, status:"Blocked", updatedAt: new Date() } }
        );
        if (result.matchedCount === 0) {
            throw new Error("User not found.");
        }
        return "User blocked successfully.";
    }
    
    static async unBlockUser(userId) {
    
        const collection = getDb().collection(this.collectionName);
    
        // Block user
        const result = await collection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { isBlocked: false, status:"Active", updatedAt: new Date() } }
        );
        if (result.matchedCount === 0) {
            throw new Error("User not found.");
        }
        return "User Activated successfully.";
    }

    static async forgetPassword(email, newPassword) {
        const collection = getDb().collection(this.collectionName);
    
        // Check if the user exists
        const user = await collection.findOne({ email });
        if (!user) {
            throw new Error("User with this email does not exist.");
        }
    
        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
    
        // Update the password
        const result = await collection.updateOne(
            { email },
            { $set: { password: hashedPassword, updatedAt: new Date() } }
        );
        if (result.matchedCount === 0) {
            throw new Error("Failed to reset the password.");
        }
        return "Password reset successfully.";
    }
    static async findUserByEmail(email) {
        const collection = getDb().collection(this.collectionName);
        return await collection.findOne({ email });
      }
    
      static async saveResetToken(email, resetTokenHash) {
        const collection = getDb().collection(this.collectionName);
        const result = await collection.updateOne(
          { email },
          { $set: { resetToken: resetTokenHash, resetTokenExpiry: new Date(Date.now() + 3600000) } } // Token valid for 1 hour
        );
        return result.matchedCount > 0;
      }
    
      static async findUserByResetToken(token) {
        const collection = getDb().collection(this.collectionName);
        const users = await collection.find().toArray();
    
        for (let user of users) {
          if (user.resetToken && await bcrypt.compare(token, user.resetToken)) {
            if (new Date() < new Date(user.resetTokenExpiry)) {
              return user; // Token is valid and not expired
            }
            break;
          }
        }
        return null; // Token not valid or expired
      }
    
      static async updatePasswordAndClearToken(email, hashedPassword) {
        const collection = getDb().collection(this.collectionName);
        const result = await collection.updateOne(
          { email },
          { $set: { password: hashedPassword, resetToken: null, resetTokenExpiry: null, updatedAt: new Date() } }
        );
        return result.matchedCount > 0;
      }     
      static async getUserEmailById(userId) {
        try {
            const user = await getDb().collection(User.collectionName).findOne({ _id: new ObjectId(userId) });
            return user ? user.email : null;
        } catch (error) {
            console.error("❌ Error fetching user email:", error);
            throw new Error("Failed to fetch user email");
        }
    }
}
module.exports = User;