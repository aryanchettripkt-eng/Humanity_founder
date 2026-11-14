import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockThreadDoc = {
  _id: 'thread1',
  id: 'thread1',
  clientId: 'client1',
  subject: 'Quick question',
  snippet: 'Are you around?',
  owner: 'assistant',
  ownerSource: 'ai',
  suggestedOwner: undefined,
  confidence: 0.9,
  reason: 'Initial',
  history: [],
  save: vi.fn(async function save() {
    return this;
  }),
  toJSON: vi.fn(function toJSON() {
    return {
      id: this.id,
      owner: this.owner,
      ownerSource: this.ownerSource,
      suggestedOwner: this.suggestedOwner,
      confidence: this.confidence,
      reason: this.reason,
      aiStatus: this.aiStatus,
      history: this.history,
    };
  }),
};

const mockProvider = {
  name: 'mock',
  generateJSON: vi.fn(),
};

vi.mock('../src/ai/index.js', () => ({
  getProvider: () => mockProvider,
}));

vi.mock('../src/models/Thread.js', () => ({
  Thread: {
    findById: vi.fn(async () => mockThreadDoc),
  },
}));

vi.mock('../src/models/Message.js', () => ({
  Message: {
    find: vi.fn(() => ({
      sort: vi.fn(async () => [
        {
          direction: 'inbound',
          from: { name: 'Sender', email: 'sender@acme.com' },
          to: [{ email: 'priya@example.com' }],
          cc: [],
          sentAt: new Date(),
          bodyText: 'Hello',
        },
      ]),
    })),
  },
}));

vi.mock('../src/models/Client.js', () => ({
  Client: {
    findById: vi.fn(async () => ({
      name: 'Priya Raman',
      title: 'Founder',
      assistantId: 'assistant1',
      profile: { delegation: 'Alex schedules', vipSenders: [] },
    })),
  },
}));

vi.mock('../src/models/User.js', () => ({
  User: {
    findById: vi.fn(async () => ({ name: 'Alex Morgan' })),
  },
}));

vi.mock('../src/models/Rule.js', () => ({
  Rule: {
    findOne: vi.fn(async () => null),
  },
}));

vi.mock('../src/services/activity.service.js', () => ({
  recordActivity: vi.fn(async () => ({})),
}));

vi.mock('../src/realtime/socket.js', () => ({
  emitThreadUpdated: vi.fn(),
  emitCountsChanged: vi.fn(),
}));

const { classifyThread } = await import('../src/services/classification.service.js');
const { Rule } = await import('../src/models/Rule.js');

describe('classification.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockThreadDoc.owner = 'assistant';
    mockThreadDoc.ownerSource = 'ai';
    mockThreadDoc.suggestedOwner = undefined;
    mockThreadDoc.history = [];
    mockThreadDoc.aiStatus = 'pending';
  });

  it('maps confidence < 0.70 to owner=review and keeps suggestedOwner', async () => {
    mockThreadDoc.aiStatus = 'done';
    mockProvider.generateJSON.mockResolvedValueOnce({
      owner: 'client',
      confidence: 0.55,
      reason: 'Unclear if client must reply.',
      clientReason: null,
      category: 'general',
      isImportant: false,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Ambiguous thread.',
      keyPoints: [],
      entities: [],
    });

    const res = await classifyThread('thread1', { emit: false });
    expect(res.owner).toBe('review');
    expect(res.suggestedOwner).toBe('client');
    expect(res.history).toHaveLength(1);
    expect(res.history[0]).toMatchObject({ from: 'assistant', to: 'review' });
  });

  it('preserves sticky manual owner and sets suggestedOwner when AI disagrees >= 0.85', async () => {
    mockThreadDoc.owner = 'assistant';
    mockThreadDoc.ownerSource = 'manual';

    mockProvider.generateJSON.mockResolvedValueOnce({
      owner: 'client',
      confidence: 0.92,
      reason: 'Client asked directly.',
      clientReason: 'Please reply.',
      category: 'action',
      isImportant: true,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Summary',
      keyPoints: [],
      entities: [],
    });

    const res = await classifyThread('thread1', { emit: false });
    expect(res.owner).toBe('assistant');
    expect(res.ownerSource).toBe('manual');
    expect(res.suggestedOwner).toBe('client');
  });

  it('applies matching Rule first', async () => {
    Rule.findOne.mockResolvedValueOnce({
      owner: 'client',
      match: { type: 'sender', value: 'sender@acme.com' },
      hits: 0,
      save: vi.fn(async () => {}),
    });

    mockProvider.generateJSON.mockResolvedValueOnce({
      owner: 'assistant',
      confidence: 0.8,
      reason: 'AI guess',
      clientReason: null,
      category: 'action',
      isImportant: false,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Summary',
      keyPoints: [],
      entities: [],
    });

    const res = await classifyThread('thread1', { emit: false });
    expect(res.owner).toBe('client');
    expect(res.ownerSource).toBe('rule');
    expect(res.confidence).toBe(1);
  });

  it('falls back safely to review when AI fails', async () => {
    mockProvider.generateJSON.mockRejectedValueOnce(new Error('timeout'));

    const res = await classifyThread('thread1', { emit: false });
    expect(res.aiStatus).toBe('failed');
    expect(res.owner).toBe('review');
    expect(res.reason).toBe('AI unavailable — please review');
  });

  it('does not mark initial classification (aiStatus=pending) as reclassified', async () => {
    mockThreadDoc.owner = 'review';
    mockThreadDoc.aiStatus = 'pending';

    mockProvider.generateJSON.mockResolvedValueOnce({
      owner: 'client',
      confidence: 0.91,
      reason: 'Client decision needed.',
      clientReason: 'Please approve.',
      category: 'action',
      isImportant: true,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Summary',
      keyPoints: [],
      entities: [
        {
          type: 'meeting',
          title: 'Sync',
          startsAt: '2026-11-15T10:00:00Z',
          endsAt: 'not-a-valid-date',
        },
      ],
    });

    const res = await classifyThread('thread1', { emit: false });
    expect(res.owner).toBe('client');
    expect(res.history).toHaveLength(0);
    expect(mockThreadDoc.entities).toHaveLength(1);
    expect(mockThreadDoc.entities[0].endsAt).toBeUndefined();
  });
});

