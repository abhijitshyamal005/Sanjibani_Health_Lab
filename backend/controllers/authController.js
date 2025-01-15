import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

export const register = async (req, res) => {
    try {
        const { mobile } = req.body;
        const user = await User.create({ mobile });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(201).json({ user, token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const login = async (req, res) => {
    try {
        const { mobile } = req.body;
        const user = await User.findOne({ mobile });
        if (!user) return res.status(404).json({ message: 'User not found' });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
