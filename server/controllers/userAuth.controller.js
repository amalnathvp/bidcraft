import { connectDB } from "../connection.js"
import User from "../models/user.js"
import Login from "../models/Login.js"
import bcrypt from "bcrypt";
import dotenv from "dotenv"
import { generateToken } from "../utils/jwt.js";
import { getClientIp, getLocationFromIp } from "../utils/geoDetails.js";
dotenv.config();


export const handleUserLogin = async (req, res) => {
    console.log('=== LOGIN REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    const { email, password } = req.body;
    if (!email || !password) {
        console.log('Missing email or password');
        return res.status(400).json({ error: "All Fields are required" });
    }
    
    try {
        await connectDB();
        console.log('Looking for user with email:', email);
        const user = await User.findOne({ email });
        //  Checking user exists
        if (!user) {
            console.log('User not found for email:', email);
            return res.status(400).json({ error: "User not found" });
        }

        console.log('User found:', { id: user._id, name: user.name, email: user.email, role: user.role });

        // Password Validate
        const psswordValidate = await bcrypt.compare(password, user.password);
        if (!psswordValidate) {
            console.log('Password validation failed for user:', email);
            return res.status(401).json({ error: "Invalid Credentials" });
        }

        console.log('Password validated successfully');

        // generating jwt token
        const token = generateToken(user._id, user.role);
        console.log('JWT token generated');

        // Set HTTP-only cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })
        console.log('Auth cookie set');

        // Getting user gro location
        const ip = getClientIp(req);
        const userAgent = req.headers["user-agent"];
        const location = await getLocationFromIp(ip);

        // Update user's last login and location
        await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
            location: location,
            ipAddress: ip,
            userAgent: userAgent
        });

        // Saving login details
        const login = new Login({
            userId: user._id,
            ipAddress: ip,
            userAgent,
            location,
            loginAt: new Date(),
        })
        await login.save();

        // Return user data (without password) along with success message
        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        };

        console.log('Sending successful login response:', { message: "Login Successful", user: userResponse });
        return res.status(200).json({ 
            message: "Login Successful",
            user: userResponse 
        });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ error: "Server error from handle login" });
    }
}

export const handleUserSignup = async (req, res) => {
    await connectDB();
    const { name, email, password } = req.body;

    // Checking input fields
    if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
    }
    try {
        await connectDB();
        const existingUser = await User.findOne({ email });

        // Checking existing of user
        if (existingUser)
            return res.status(400).json({ error: "User already exists" });

        // Getting geo details
        const ip = getClientIp(req);
        const userAgent = req.headers["user-agent"];
        const location = await getLocationFromIp(ip);

        // Hashing user password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Saving user to database
        const newUser = new User({
            name,
            email,
            password: hashedPassword,
            avatar: "https://avatar.iran.liara.run/public/7",
            ipAddress: ip,
            userAgent,
            location,
            signupAt: new Date(),
            lastLogin: new Date(),
        });
        await newUser.save();

        const login = new Login({
            userId: newUser._id,
            ipAddress: ip,
            userAgent,
            location,
            loginAt: new Date(),
        })
        await login.save();

        // Generating jwt token
        const token = generateToken(newUser._id, newUser.role);

        // Set HTTP-only cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        })

        // Return user data (without password) along with success message
        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            avatar: newUser.avatar
        };

        return res.status(201).json({ 
            message: "User registered successfully",
            user: userResponse 
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: "Server error" });
    }
}

export const handleUserLogout = async (req, res) => {
    res.clearCookie("auth_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    return res.status(200).json({ message: "Logged out successfully" });
}