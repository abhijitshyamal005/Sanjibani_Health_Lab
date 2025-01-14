import User from '../models/userModel.js';
import Product from '../models/productModel.js';

export const addToCart = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { productId } = req.body;
        user.cart.push(productId);
        await user.save();

        res.status(200).json({ message: 'Product added to cart', cart: user.cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCart = async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('cart');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json(user.cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
