const { MongoClient, ObjectId } = require("mongodb");

// MongoDB connection setup
const uri = "mongodb://localhost:27017"; 
const client = new MongoClient(uri);
const dbName = "freelancing_platform";
const db = client.db(dbName);

class Role {
    static collectionName = "roles";

    constructor({ roleName, roleDescription, permissions }) {
        this.roleName = roleName;
        this.roleDescription = roleDescription || "";
        this.permissions = permissions || [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Create Role
    static async createRole(data) {
        const collection = db.collection(this.collectionName);

        // Check if role with the same name already exists
        const existingRole = await collection.findOne({ roleName: data.roleName });
        if (existingRole) {
            throw new Error("Role with this name already exists.");
        }

        const role = new Role(data);
        const result = await collection.insertOne(role);
        return result.insertedId; 
    }

    // Delete Role
    static async deleteRole(id) {
        const collection = db.collection(this.collectionName);
        const result = await collection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            throw new Error("Role not found.");
        }
        return "Role deleted successfully.";
    }
    static async getAllRoles() {
        const collection = db.collection(this.collectionName);
        return await collection.find({}).toArray(); 
    }

}

module.exports = Role;
