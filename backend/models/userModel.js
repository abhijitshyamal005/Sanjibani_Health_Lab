import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true, // Ensures email is stored in lowercase
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    mobileNumber: {
      type: String,
      required: [true, 'Mobile number is required'],
      unique: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid mobile number']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    isVerified: {
      type: Boolean,
      default: false // User is initially not verified
    },
    verificationCode: {
      type: String // Temporary verification code
    },
    cart: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ]
  },
  {
    timestamps: true
  }
)

export default mongoose.model('User', userSchema)
