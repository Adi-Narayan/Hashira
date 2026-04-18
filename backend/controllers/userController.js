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
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
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
        res.json({ success: false, message: error.message });
    }
}

//  Route: POST /api/user/register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Please enter a strong password" });
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

        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET);
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
    const { email } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'No account found with this email' });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        const salt = await bcrypt.genSalt(10);
        user.resetOtp = await bcrypt.hash(otp, salt);
        user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        await sendOtpEmail(email, otp);
        res.json({ success: true, message: 'OTP sent' });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
    }
}

//  Route: POST /api/user/forgot-password
const forgotPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!otp || !newPassword) {
            return res.json({ success: false, message: 'OTP and new password are required' });
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        if (!user.resetOtp || !user.resetOtpExpiry) {
            return res.json({ success: false, message: 'No OTP requested. Please request a new one.' });
        }

        if (new Date() > user.resetOtpExpiry) {
            user.resetOtp = undefined;
            user.resetOtpExpiry = undefined;
            await user.save();
            return res.json({ success: false, message: 'OTP has expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, user.resetOtp);
        if (!isMatch) {
            return res.json({ success: false, message: 'Invalid OTP. Please try again.' });
        }

        if (newPassword.length < 8) {
            return res.json({ success: false, message: 'Password must be at least 8 characters' });
        }

        user.password = newPassword;
        user.resetOtp = undefined;
        user.resetOtpExpiry = undefined;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: err.message });
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