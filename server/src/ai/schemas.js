import { z } from 'zod';

const CATEGORIES = [
  'meeting',
  'action',
  'update',
  'newsletter',
  'finance',
  'legal',
  'personal',
  'general',
];

const trimLower = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v);

const coerceBool = z.preprocess((v) => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const lower = v.trim().toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  return v;
}, z.boolean());

const nullableString = z
  .string()
  .nullable()
  .optional()
  .transform((v) => (typeof v === 'string' ? v.trim() : ''));

export const entityOutputSchema = z.object({
  type: z.preprocess(trimLower, z.enum(['meeting', 'deadline', 'date'])),
  title: z.string().trim().min(1),
  startsAt: z.string().trim().min(1),
  endsAt: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export const classificationSchema = z.object({
  owner: z.preprocess(trimLower, z.enum(['assistant', 'client', 'none'])),
  confidence: z.coerce.number().transform((n) => {
    if (!Number.isFinite(n)) return 0;
    const scaled = n > 1 && n <= 100 ? n / 100 : n;
    return Math.min(1, Math.max(0, scaled));
  }),
  reason: nullableString,
  clientReason: nullableString,
  category: z.preprocess(trimLower, z.enum(CATEGORIES).catch('general')),
  isImportant: coerceBool.catch(false),
  actionRequired: coerceBool.catch(false),
  waitingOnOthers: coerceBool.catch(false),
  summary: nullableString,
  keyPoints: z
    .array(z.coerce.string())
    .catch([])
    .transform((arr) => arr.map((s) => s.trim()).filter(Boolean).slice(0, 6)),
  entities: z
    .array(z.unknown())
    .catch([])
    .transform((items) =>
      items
        .map((item) => entityOutputSchema.safeParse(item))
        .filter((res) => res.success)
        .map((res) => res.data)
    ),
});

export const askSchema = z.object({
  answer: z.string().min(1),
  threadIds: z.array(z.string()).default([]),
});
