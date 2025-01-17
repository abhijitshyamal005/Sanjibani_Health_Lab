import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import nodemailer from "nodemailer";
import crypto from "crypto";

const sendVerificationEmail = async (email, code) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Verify Your Email for SanjiBani HealthLab",
        text: `Your verification code is: ${code}`,
    };

    await transporter.sendMail(mailOptions);
};

export const register = async (req, res) => {
    const { name, email, mobileNumber, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists. Please login." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = crypto.randomBytes(3).toString("hex");

        const user = await User.create({
            name,
            email,
            mobileNumber,
            password: hashedPassword,
            isVerified: false,
            verificationCode,
        });

        await sendVerificationEmail(email, verificationCode);
        res.status(201).json({ message: "Verification email sent.", userId: user._id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const verifyEmail = async (req, res) => {
    const { userId, verificationCode } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.verificationCode !== verificationCode) {
            return res.status(400).json({ message: 'Invalid verification code' });
        }

        user.isVerified = true;
        user.verificationCode = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({ success: true, message: 'Email verified successfully', token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};


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

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
