import { describe, expect, it } from 'vitest';
import { pageSection } from './RouteTransitions';

describe('pageSection', () => {
  it('treats each app tab as its own page', () => {
    expect(pageSection('/app/today')).toBe('/app/today');
    expect(pageSection('/app/stats')).toBe('/app/stats');
    expect(pageSection('/app/settings/accounts')).toBe('/app/settings');
  });

  it('keeps moves inside the Inbox on the same page', () => {
    expect(pageSection('/app/inbox/inbox')).toBe(pageSection('/app/inbox/review/t1'));
  });

  it('groups the client view and public pages by their first segment', () => {
    expect(pageSection('/c')).toBe(pageSection('/c/thread/t1'));
    expect(pageSection('/login')).toBe('/login');
    expect(pageSection('/')).toBe('/');
  });
});
