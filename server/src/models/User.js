import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['assistant', 'client'], required: true, default: 'assistant' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    onboarding: {
      completed: { type: Boolean, default: false },
      tourSeen: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

applyBaseTransform(userSchema);

export const User = mongoose.models.User || mongoose.model('User', userSchema);

