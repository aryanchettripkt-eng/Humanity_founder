import mongoose from 'mongoose';
import { applyBaseTransform } from './plugins.js';

const ruleSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    match: {
      type: { type: String, enum: ['sender', 'domain'], required: true },
      value: { type: String, required: true, lowercase: true, trim: true },
    },
    owner: { type: String, enum: ['assistant', 'client', 'none'], required: true },
    createdFromThreadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
    hits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ruleSchema.index({ clientId: 1, 'match.type': 1, 'match.value': 1 }, { unique: true });

applyBaseTransform(ruleSchema);

export const Rule = mongoose.models.Rule || mongoose.model('Rule', ruleSchema);
