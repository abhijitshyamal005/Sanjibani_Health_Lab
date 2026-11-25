import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { FAMILY_RELATIONS, MAX_FAMILY_MEMBERS, ROLES } from '../utils/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name is too long'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit mobile number'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: { type: String, enum: ROLES, default: 'patient' },
    city: { type: String, trim: true, maxlength: 60 },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    dateOfBirth: { type: String, match: [/^(\d{4}-\d{2}-\d{2})?$/, 'Invalid date of birth'] },
    address: {
      line: { type: String, trim: true, maxlength: 200 },
      area: { type: String, trim: true, maxlength: 80 },
      city: { type: String, trim: true, maxlength: 60 },
      pincode: { type: String, trim: true, match: [/^(\d{6})?$/, 'Pincode must be 6 digits'] },
    },
    // People a patient books tests for (parents, children, spouse…), picked at checkout.
    familyMembers: {
      type: [
        new mongoose.Schema({
          name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: [80, 'Name is too long'] },
          relation: { type: String, enum: { values: FAMILY_RELATIONS, message: 'Select a relation' }, required: [true, 'Select a relation'] },
          gender: { type: String, enum: { values: ['male', 'female', 'other'], message: 'Select a gender' }, required: [true, 'Select a gender'] },
          dateOfBirth: {
            type: String,
            required: [true, 'Date of birth is required'],
            match: [/^\d{4}-\d{2}-\d{2}$/, 'Invalid date of birth'],
          },
          phone: { type: String, trim: true, match: [/^([6-9]\d{9})?$/, 'Please enter a valid 10-digit mobile number'] },
        }),
      ],
      default: [],
      validate: [(v) => v.length <= MAX_FAMILY_MEMBERS, `You can save up to ${MAX_FAMILY_MEMBERS} family members`],
    },
    isActive: { type: Boolean, default: true },
    // For sample collectors: the lab that employs them.
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', index: true },
    resetCodeHash: { type: String, select: false },
    resetCodeExpires: { type: Date, select: false },
    // Invite-a-friend: this user's personal share code, who invited them, and when their inviter was rewarded.
    inviteCode: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    inviteRewardedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.resetCodeHash;
    delete ret.resetCodeExpires;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', userSchema);
