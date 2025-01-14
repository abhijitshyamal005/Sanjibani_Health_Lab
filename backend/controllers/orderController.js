import Order from '../models/orderModel.js';

export const placeOrder = async (req, res) => {
    try {
        const { products } = req.body;
        const total = products.reduce((sum, item) => sum + item.quantity * item.price, 0);

        const order = await Order.create({
            user: req.userId,
            products,
            total
        });

        res.status(201).json({ message: 'Order placed', order });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.userId }).populate('products.product');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
