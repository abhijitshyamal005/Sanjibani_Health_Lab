import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

dotenv.config();
const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Store verification data temporarily
const verificationCodes = new Map();

// --- Helper: Send Verification Email ---
const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Verify Your Email for SanjiBani HealthLab",
    text: `Your verification code is: ${code}`,
  };
  await transporter.sendMail(mailOptions);
};

// --- Helper: Send Confirmation Email ---
const sendConfirmationEmail = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Welcome to SanjiBani HealthLab – Account Created!",
    text: `Dear ${name},\n\nYour account has been created successfully!\n\nWe’re happy to have you onboard.\n\nBest regards,\nSanjiBani HealthLab Team\nsupport@sanjibanihealthlab.com\nPhone: +91-6296390743`,
  };
  await transporter.sendMail(mailOptions);
};

// --- Register (Step 1) ---
export const register = async (req, res) => {
  const { name, email, mobileNumber, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ message: "User already exists. Please login." });

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    verificationCodes.set(email, { name, email, mobileNumber, password, verificationCode });

    // Respond immediately
    res.status(200).json({ message: "Verification code sent to email." });

    // Send email in background (non-blocking)
    sendVerificationEmail(email, verificationCode)
      .then(() => console.log("Verification email sent to", email))
      .catch((err) => console.error("Email sending failed:", err));

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- Verify Email (Step 2) ---
export const verifyemail = async (req, res) => {
  const { email, verificationCode } = req.body;
  const storedData = verificationCodes.get(email);

  if (!storedData || storedData.verificationCode !== verificationCode) {
    return res.status(400).json({ message: "Invalid or expired verification code." });
  }

  try {
    const hashedPassword = await bcrypt.hash(storedData.password, 8); // faster hash
    const user = await User.create({
      name: storedData.name,
      email: storedData.email,
      mobileNumber: storedData.mobileNumber,
      password: hashedPassword,
      isVerified: true,
    });

    verificationCodes.delete(email);
    sendConfirmationEmail(email, storedData.name).catch(console.error);

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.status(201).json({ message: "Email verified successfully!", token, userId: user._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Login (Step 3) ---
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found." });
    if (!user.isVerified)
      return res.status(400).json({ message: "Email not verified." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials." });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "2h" });

    res.status(200).json({
      message: "Login successful",
      token,
      userId: user._id,
      user: { _id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export default router;
