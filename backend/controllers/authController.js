import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/userModel.js';

// Register new user
export const register = async (req, res) => {
    try {
        const { name, email, mobileNumber, password } = req.body;
        
        // Check if the user already exists
        const checkUser = await User.findOne({ mobileNumber });
        if (checkUser) {
            return res.status(409).json({ message: 'User already exists' });
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create the new user
        const user = await User.create({
            name,
            email,
            mobileNumber,
            password: hashedPassword
        });

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(201).json({ user, token });
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message });
    }
};

// Login existing user
export const login = async (req, res) => {
    try {
        const { mobileNumber, password } = req.body;

        // Find user by mobile number
        const user = await User.findOne({ mobileNumber });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Compare the provided password with the hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
