import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const recipientSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false }
);

const draftSchema = new mongoose.Schema(
  {
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread', required: true, index: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    createdBy: { type: String, enum: ['ai', 'user'], default: 'ai' },
    tone: { type: String, enum: ['formal', 'friendly', 'brief'], default: 'friendly' },
    instruction: { type: String },
    sourceNote: { type: String },
    to: { type: [recipientSchema], default: [] },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: ['draft', 'sent', 'discarded'], default: 'draft' },
  },
  { timestamps: true }
);

applyBaseTransform(draftSchema);

export const Draft = mongoose.models.Draft || mongoose.model('Draft', draftSchema);

