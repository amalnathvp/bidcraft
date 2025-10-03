import { connectDB } from "../connection.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const createAdmin = async () => {
    try {
        await connectDB();
        
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: "admin@bidcraft.com" });
        if (existingAdmin) {
            console.log("Admin user already exists:", existingAdmin.email);
            process.exit(0);
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash("admin123", 10);
        
        // Create admin user
        const adminUser = new User({
            name: "Admin User",
            email: "admin@bidcraft.com",
            password: hashedPassword,
            role: "admin",
            avatar: "https://avatar.iran.liara.run/public/1",
            signupAt: new Date(),
            lastLogin: new Date(),
            location: {
                country: "Admin Location",
                region: "Admin Region",
                city: "Admin City"
            }
        });
        
        await adminUser.save();
        console.log("Admin user created successfully!");
        console.log("Email: admin@bidcraft.com");
        console.log("Password: admin123");
        
        process.exit(0);
    } catch (error) {
        console.error("Error creating admin user:", error);
        process.exit(1);
    }
};

createAdmin();