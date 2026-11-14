import { askSchema, classificationSchema } from '../schemas.js';

function classifyByHeuristics(prompt) {
  const lower = String(prompt || '').toLowerCase();

  // Check newsletter / automated / resolved first
  if (
    /unsubscribe|newsletter|digest|receipt|notification|noreply|no-reply|automated|thank you so much|thanks, got it|confirmed for/.test(
      lower
    )
  ) {
    return {
      owner: 'none',
      confidence: 0.92,
      reason: 'Informational or automated message that does not require a reply.',
      clientReason: null,
      category: /receipt|invoice/.test(lower) ? 'finance' : 'newsletter',
      isImportant: false,
      actionRequired: false,
      waitingOnOthers: false,
      summary: 'Informational update or automated notification requiring no response.',
      keyPoints: ['No reply needed'],
      entities: [],
    };
  }

  // Check client-only decisions / approvals / sensitive topics
  if (
    /approve|approval|your decision|sign|signature|term sheet|investor|board|hiring|offer|compensation|personal|interview/.test(
      lower
    )
  ) {
    return {
      owner: 'client',
      confidence: 0.88,
      reason: 'Requires the client’s direct decision, approval, or personal input.',
      clientReason: 'Your direct input or approval is requested on this thread.',
      category: /investor|board|legal|signature/.test(lower) ? 'legal' : 'action',
      isImportant: true,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Sender is requesting the client’s personal decision or sign-off.',
      keyPoints: ['Client approval or personal reply needed'],
      entities: [],
    };
  }

  // Check assistant-owned logistics / scheduling / vendors
  if (
    /schedule|reschedule|calendar|availability|meeting|call|invoice|payment|booking|flight|hotel|vendor|quote|rsvp/.test(
      lower
    )
  ) {
    return {
      owner: 'assistant',
      confidence: 0.86,
      reason: 'Scheduling, logistics, or vendor coordination that the assistant can handle.',
      clientReason: null,
      category: /schedule|reschedule|calendar|meeting|call/.test(lower) ? 'meeting' : 'action',
      isImportant: false,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Operational or scheduling request ready for the assistant to coordinate.',
      keyPoints: ['Assistant can coordinate logistics and reply'],
      entities: [],
    };
  }

  // Ambiguous -> low confidence so server threshold maps to `review`
  return {
    owner: 'assistant',
    confidence: 0.55,
    reason: 'Ambiguous context; flagged for quick human review.',
    clientReason: null,
    category: 'general',
    isImportant: false,
    actionRequired: true,
    waitingOnOthers: false,
    summary: 'Conversation needs quick review to confirm who should reply.',
    keyPoints: ['Unclear reply owner from message text'],
    entities: [],
  };
}

export const mockProvider = {
  name: 'mock',

  async generateJSON({ prompt, schema }) {
    if (schema === askSchema) {
      const idMatches = [...String(prompt || '').matchAll(/id=([a-f0-9]{24})/gi)].map((m) => m[1]);
      return askSchema.parse({
        answer:
          idMatches.length > 0
            ? `Based on your current inbox, here are the most relevant conversations (${idMatches.length} matched).`
            : 'I could not find any matching conversations for that question right now.',
        threadIds: idMatches.slice(0, 5),
      });
    }

    const result = classifyByHeuristics(prompt);
    if (schema === classificationSchema) {
      return classificationSchema.parse(result);
    }
    return schema.parse(result);
  },

  async generateText({ prompt }) {
    const lower = String(prompt || '').toLowerCase();
    if (lower.includes('morning brief') || lower.includes('2–3 sentences')) {
      return 'Your inbox is organised and up to date. Check Needs Review first to confirm any ambiguous threads, then clear your Assistant queue.';
    }
    if (lower.includes('brief')) {
      return 'Thanks for reaching out — I will coordinate this on our side and follow up shortly.';
    }
    if (lower.includes('formal')) {
      return 'Thank you for your message. We have reviewed the details and will follow up with next steps shortly.\n\nBest regards,';
    }
    return 'Thanks for the note! I’ll take care of this and circle back soon.';
  },
};

