import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const activitySchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    actor: {
      type: { type: String, enum: ['client', 'assistant', 'ai', 'system'], required: true },
      name: { type: String, required: true },
    },
    type: {
      type: String,
      enum: [
        'client_handling',
        'client_handled',
        'client_handoff',
        'client_note',
        'reclassified',
        'owner_changed',
        'draft_sent',
        'sync_completed',
        'new_email',
      ],
      required: true,
    },
    threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activitySchema.index({ clientId: 1, createdAt: -1 });

applyBaseTransform(activitySchema);

export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
