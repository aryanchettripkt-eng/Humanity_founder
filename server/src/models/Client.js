import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    title: { type: String, trim: true },
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    profile: {
      delegation: { type: String, default: '' },
      vipSenders: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

applyBaseTransform(clientSchema);

export const Client = mongoose.models.Client || mongoose.model('Client', clientSchema);
