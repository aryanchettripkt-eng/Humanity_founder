import { describe, expect, it, vi } from 'vitest';
import { Thread } from '../src/models/Thread.js';
import { listThreads, listThreadsSchema } from '../src/controllers/threads.controller.js';

describe('listThreads handoff filter', () => {
  it('validates handoff query values with zod', () => {
    for (const value of ['client_handling', 'handed_to_assistant', 'handled']) {
      const res = listThreadsSchema.query.safeParse({ handoff: value });
      expect(res.success).toBe(true);
      expect(res.data.handoff).toBe(value);
    }

    const bad = listThreadsSchema.query.safeParse({ handoff: 'invalid_state' });
    expect(bad.success).toBe(false);
  });

  it('applies handoff.state filter to Thread.find when handoff is provided', async () => {
    const chain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };
    const findSpy = vi.spyOn(Thread, 'find').mockReturnValue(chain);
    const countSpy = vi.spyOn(Thread, 'countDocuments').mockResolvedValue(0);

    const req = {
      clientId: 'c1',
      query: {
        segment: 'client',
        handoff: 'client_handling',
        page: 1,
        pageSize: 50,
      },
    };
    const json = vi.fn();
    const res = { json };
    const next = vi.fn();

    await listThreads(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(findSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        clientId: 'c1',
        owner: 'client',
        'handoff.state': 'client_handling',
      })
    );
    expect(countSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        'handoff.state': 'client_handling',
      })
    );
    expect(json).toHaveBeenCalledWith({
      data: [],
      meta: { total: 0, page: 1, pageSize: 50 },
    });

    findSpy.mockRestore();
    countSpy.mockRestore();
  });
});

