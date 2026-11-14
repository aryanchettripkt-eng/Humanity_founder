import { z } from 'zod';

export const entityOutputSchema = z.object({
  type: z.enum(['meeting', 'deadline', 'date']),
  title: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const classificationSchema = z.object({
  owner: z.enum(['assistant', 'client', 'none']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
  clientReason: z.string().nullable().optional(),
  category: z.enum([
    'meeting',
    'action',
    'update',
    'newsletter',
    'finance',
    'legal',
    'personal',
    'general',
  ]),
  isImportant: z.boolean(),
  actionRequired: z.boolean(),
  waitingOnOthers: z.boolean(),
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).max(6).default([]),
  entities: z.array(entityOutputSchema).default([]),
});

export const askSchema = z.object({
  answer: z.string().min(1),
  threadIds: z.array(z.string()).default([]),
});

