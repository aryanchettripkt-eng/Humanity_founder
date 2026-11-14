import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const participantSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, required: true, lowercase: true, trim: true },
  },
  { _id: false }
);

const entitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['meeting', 'deadline', 'date'], required: true },
    title: { type: String, required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    location: { type: String },
  },
  { _id: false }
);

const historyItemSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    from: { type: String, required: true },
    to: { type: String, required: true },
    source: { type: String, required: true },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const threadSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailAccount', required: true },
    source: { type: String, enum: ['seed', 'simulated', 'gmail'], default: 'seed' },
    externalId: { type: String },
    subject: { type: String, required: true, trim: true },
    snippet: { type: String, default: '' },
    participants: { type: [participantSchema], default: [] },
    lastMessageAt: { type: Date, required: true },
    messageCount: { type: Number, default: 0 },
    lastSender: { type: String, enum: ['them', 'us'], default: 'them' },
    unread: { type: Boolean, default: true },
    important: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    status: { type: String, enum: ['open', 'done'], default: 'open' },

    // AI / ownership
    owner: {
      type: String,
      enum: ['assistant', 'client', 'none', 'review'],
      default: 'review',
    },
    ownerSource: {
      type: String,
      enum: ['ai', 'rule', 'manual', 'client'],
      default: 'ai',
    },
    suggestedOwner: {
      type: String,
      enum: ['assistant', 'client', 'none'],
    },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    reason: { type: String, default: '' },
    clientReason: { type: String },
    category: {
      type: String,
      enum: ['meeting', 'action', 'update', 'newsletter', 'finance', 'legal', 'personal', 'general'],
      default: 'general',
    },
    actionRequired: { type: Boolean, default: false },
    waitingOnOthers: { type: Boolean, default: false },
    summary: { type: String, default: '' },
    keyPoints: { type: [String], default: [] },
    entities: { type: [entitySchema], default: [] },
    reclassifiedAt: { type: Date },
    aiStatus: { type: String, enum: ['pending', 'done', 'failed'], default: 'pending' },
    aiAttempts: { type: Number, default: 0 },
    aiModel: { type: String },
    history: { type: [historyItemSchema], default: [] },
    handoff: {
      state: {
        type: String,
        enum: ['none', 'client_handling', 'handed_to_assistant', 'handled'],
        default: 'none',
      },
      note: { type: String },
      at: { type: Date },
    },
  },
  { timestamps: true }
);

threadSchema.index({ clientId: 1, owner: 1, archived: 1, status: 1, lastMessageAt: -1 });
threadSchema.index({ clientId: 1, archived: 1, status: 1, lastMessageAt: -1 });
threadSchema.index(
  { accountId: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { externalId: { $exists: true } } }
);
threadSchema.index({
  subject: 'text',
  snippet: 'text',
  summary: 'text',
  'participants.email': 'text',
});

applyBaseTransform(threadSchema);

export const Thread = mongoose.models.Thread || mongoose.model('Thread', threadSchema);

