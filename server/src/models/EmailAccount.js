import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const emailAccountSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    assistantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['gmail', 'outlook'], required: true },
    address: { type: String, required: true, lowercase: true, trim: true },
    status: {
      type: String,
      enum: ['connecting', 'syncing', 'connected', 'error', 'disconnected'],
      default: 'connecting',
    },
    lastSyncedAt: { type: Date },
    error: { type: String },
    simulated: { type: Boolean, default: true },
    google: {
      sub: { type: String },
      refreshTokenEnc: { type: String },
      scope: { type: String },
      historyId: { type: String },
      lastPolledAt: { type: Date },
    },
  },
  { timestamps: true }
);

applyBaseTransform(emailAccountSchema, (ret) => {
  if (ret.google) {
    delete ret.google.refreshTokenEnc;
  }
});

export const EmailAccount =
  mongoose.models.EmailAccount || mongoose.model('EmailAccount', emailAccountSchema);

