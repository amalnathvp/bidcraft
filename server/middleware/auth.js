import jwt from "jsonwebtoken";
import dotenv from "dotenv"
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

export const secureRoute=(req,res,next)=>{
    console.log('=== AUTH MIDDLEWARE ===');
    console.log('Cookies:', req.cookies);
    
    const token=req.cookies.auth_token;
    if(!token) {
        console.log('No auth token found');
        return res.status(401).json({error:"Unauthorized"});
    }

    try {
        const decode=jwt.verify(token, JWT_SECRET);
        console.log('Token decoded successfully:', { id: decode.id, email: decode.email });
        req.user=decode;
        next();
    } catch (error) {
        console.log('Token verification failed:', error.message);
        return res.status(401).json({error:"Invalid or expired token"});
    }
}