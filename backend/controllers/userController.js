import userModel from "../models/userModel.js";
import validator from "validator"
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'
import { sendWelcomeEmail, sendOtpEmail } from '../services/emailService.js';

// Create JWT token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1825d' });
}

//  Route: POST /api/user/login
const loginUser = async (req, res) => {
    try {
        const email = typeof req.body?.email === "string" ? req.body.email : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";

        if (!email || !password) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = createToken(user._id);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Login failed" });
    }
}

//  Route: POST /api/user/register
const registerUser = async (req, res) => {
    try {
        const name = typeof req.body?.name === "string" ? req.body.name : "";
        const email = typeof req.body?.email === "string" ? req.body.email : "";
        const password = typeof req.body?.password === "string" ? req.body.password : "";

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
        }

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const newUser = new userModel({ name, email, password }); // password will be hashed by pre-save
        const user = await newUser.save();
        const token = createToken(user._id);

        // Send welcome email (non-blocking)
        const frontendUrl = req.headers.origin || 'https://hashira.in';
        sendWelcomeEmail(email, name, frontendUrl).catch(err => 
            console.error('Failed to send welcome email:', err)
        );

        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//  Route: POST /api/user/admin-login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email === "string" &&
            typeof password === "string" &&
            email === process.env.ADMIN_EMAIL &&
            password === process.env.ADMIN_PASSWORD
        ) {
            const token = jwt.sign(
                { role: "admin", email },
                process.env.JWT_SECRET,
                { expiresIn: "1825d" }
            );
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

//  Route: POST /api/user/send-otp
const sendOtp = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    try {
        if (!email) {
            return res.json({ success: true, message: 'If an account exists, an OTP has been sent' });
        }
        const user = await userModel.findOne({ email });
        if (!user) {
            // Generic response — don't leak which emails are registered
            return res.json({ success: true, message: 'If an account exists, an OTP has been sent' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const salt = await bcrypt.genSalt(10);
        user.resetOtp = await bcrypt.hash(otp, salt);
        user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.resetOtpAttempts = 0;
        await user.save();

        await sendOtpEmail(email, otp);
        res.json({ success: true, message: 'If an account exists, an OTP has been sent' });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: 'Unable to send OTP. Please try again later.' });
    }
}

//  Route: POST /api/user/forgot-password
const MAX_OTP_ATTEMPTS = 5;

const forgotPassword = async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email : "";
    const otp = typeof req.body?.otp === "string" ? req.body.otp : "";
    const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

    try {
        if (!email || !otp || !newPassword) {
            return res.json({ success: false, message: 'OTP and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters' });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        if (new Date() > user.resetOtpExpiry) {
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            user.resetOtpAttempts = 0;
            await user.save();
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        if ((user.resetOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            user.resetOtpAttempts = 0;
            await user.save();
            return res.json({ success: false, message: 'Too many invalid attempts. Please request a new OTP.' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) {
            user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
            await user.save();
            return res.json({ success: false, message: 'Invalid or expired OTP' });
        }

        user.password = newPassword;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        user.resetOtpAttempts = 0;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: 'Password reset failed. Please try again.' });
    }
}

// GET user profile
const getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.userId).select('-password');
    if (!user) return res.json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};

// PUT update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await userModel.findById(req.userId);

    if (!user) return res.json({ success: false, message: 'User not found' });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save();
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
};


export { loginUser, registerUser, adminLogin, sendOtp, forgotPassword, getProfile, updateProfile };