import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    mobile: { type: String, required: true, unique: true },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

export default mongoose.model('User', userSchema);
