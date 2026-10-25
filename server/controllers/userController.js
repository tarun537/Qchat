import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from 'bcryptjs'
import { sendResetOtpEmail } from "../lib/nodemailer.js";

// Signup a new User
export const signup = async (req, res)=>{
    const { fullName, email, password, bio } = req.body;

    try {
        if(!fullName || !email || !password || !bio){
            return res.json({success: false, message: "Missing Details"})
        }
        if (password.length < 6) {
            return res.json({success: false, message: "Password must be at least 6 characters"});
        }
        const user = await User.findOne({email});

        if(user){
            return res.json({success: false, message: "Account already exists"})
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, email, password: hashedPassword, bio
        });

        const token = generateToken(newUser._id)

        res.json({success: true, userData: newUser, token, message: "Account created successfully"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Controller to Login
export const login = async (req, res) =>{
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const userData = await User.findOne({email})

        if (!userData) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);

        if(!isPasswordCorrect){
            return res.json({ success: false, message: "Invalid Credentials"});
        }

        const token = generateToken(userData._id)

        res.json({success: true, userData, token, message: "Login successful"})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}
// controller to check if user is authenticated
export const checkAuth = (req, res) =>{
    res.json({success: true, user: req.user});
}

// Controller to update user profile details
export const updateProfile = async (req, res)=>{
    try {
        const { profilePic, bio, fullName } = req.body;

        const userId = req.user._id;
        let updatedUser;

        if(!profilePic){
            updatedUser = await User.findByIdAndUpdate(userId, {bio, fullName}, {new: true});
        }else{
            let imageUrl = profilePic;
            if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
                const upload = await cloudinary.uploader.upload(profilePic);
                imageUrl = upload.secure_url;
            }

            updatedUser = await User.findByIdAndUpdate(userId, {profilePic: imageUrl, bio, fullName}, {new: true});
        }
        res.json({success: true, user: updatedUser})
    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }
}

// Controller to send password reset OTP
export const sendResetOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.json({ success: false, message: "Email is required" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "No account found with this email" });
        }

        // Generate 6-digit OTP
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        // Valid for 15 minutes
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        user.resetOtp = otp;
        user.resetOtpExpiresAt = expiresAt;
        await user.save();

        const result = await sendResetOtpEmail(email, otp);

        const message = result.delivered
            ? "OTP sent to your email"
            : "OTP sent! (Email service not configured, check server console for OTP)";

        res.json({ success: true, message });
    } catch (error) {
        console.log("Error in sendResetOtp:", error.message);
        res.json({ success: false, message: error.message });
    }
};

// Controller to verify OTP and reset password
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: "All fields are required" });
        }

        if (newPassword.length < 6) {
            return res.json({ success: false, message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.resetOtp || user.resetOtp !== String(otp).trim()) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (!user.resetOtpExpiresAt || new Date(user.resetOtpExpiresAt).getTime() < Date.now()) {
            return res.json({ success: false, message: "OTP has expired. Please request a new one" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpiresAt = null;
        await user.save();

        res.json({ success: true, message: "Password reset successful! You can now login" });
    } catch (error) {
        console.log("Error in resetPassword:", error.message);
        res.json({ success: false, message: error.message });
    }
};