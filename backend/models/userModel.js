const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    mobile: { type: String, required: true, unique: true },
    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
});

module.exports = mongoose.model('User', userSchema);