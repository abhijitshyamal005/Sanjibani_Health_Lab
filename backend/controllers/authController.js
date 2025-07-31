import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();
const router = express.Router();

// Email Transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Store verification codes temporarily
const verificationCodes = new Map();

const sendVerificationEmail = async (email, code) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Verify Your Email for SanjiBani HealthLab",
        text: `Your verification code is: ${code}`,
    };
    await transporter.sendMail(mailOptions);
};

const ConfirmationMail = async (email, name) => {
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Welcome to SanjiBani HealthLab",
        text: `Dear ${name},\n\nThank you for registering with SanjiBani HealthLab! Your account has been successfully created.\n\nBest regards,\nSanjiBani HealthLab Team`,
    };
    await transporter.sendMail(mailOptions);
}

// Register User (Step 1)
export const register = async (req, res) => {
    const { name, email, mobileNumber, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).json({ message: "User already exists. Please login." });
        
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        verificationCodes.set(email, { name, email, mobileNumber, password, verificationCode });
        
        await sendVerificationEmail(email, verificationCode);
        res.status(200).json({ message: "Verification code sent to email." });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Verify Email & Save User (Step 2)
export const verifyemail = async (req, res) => {
    const { email, verificationCode } = req.body;
    const storedData = verificationCodes.get(email);

    if (!storedData || storedData.verificationCode !== verificationCode) {
        return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    try {
        const hashedPassword = await bcrypt.hash(storedData.password, 10);
        const user = await User.create({
            name: storedData.name,
            email: storedData.email,
            mobileNumber: storedData.mobileNumber,
            password: hashedPassword,
            isVerified: true,
        });
        // Send confirmation email
        await ConfirmationMail(storedData.email, storedData.name);
        verificationCodes.delete(email);
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
        res.status(201).json({ message: "Email verified successfully!", token, userId: user._id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export default router;

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: "Email not verified." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials." });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

        // Send back the user object along with token and userId
        res.status(200).json({
            message: "Login successful",
            token,
            userId: user._id,
            user: { 
                _id: user._id,
                email: user.email,
                name: user.name, 
            },
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
