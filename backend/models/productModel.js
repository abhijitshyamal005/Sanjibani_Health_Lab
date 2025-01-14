import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    stock: Number,
});

export default mongoose.model('Product', productSchema);
