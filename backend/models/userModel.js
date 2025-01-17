import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true },
    password: { type: String, required: true },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

export default mongoose.model('User', userSchema);
