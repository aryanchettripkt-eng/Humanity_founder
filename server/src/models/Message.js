import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const addressSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    from: { type: addressSchema, required: true },
    to: { type: [addressSchema], default: [] },
    cc: { type: [addressSchema], default: [] },
    sentAt: { type: Date, required: true },
    bodyText: { type: String, required: true },
    bodyHtml: { type: String },
    direction: { type: String, enum: ['inbound', 'outbound'], required: true },
    simulated: { type: Boolean, default: true },
  },
  { timestamps: true }
);

messageSchema.index({ threadId: 1, sentAt: 1 });

applyBaseTransform(messageSchema);

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

