import mongoose from 'mongoose';

/** A laboratory the admin team has invited by email to create a partner account. */
const labInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    labName: { type: String, required: [true, 'Lab name is required'], trim: true, maxlength: [120, 'Lab name is too long'] },
    contactName: { type: String, trim: true, maxlength: [80, 'Contact name is too long'] },
    note: { type: String, trim: true, maxlength: [500, 'Note is too long'] },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sendCount: { type: Number, default: 0 },
    lastSentAt: { type: Date },
  },
  { timestamps: true }
);

labInviteSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('LabInvite', labInviteSchema);
