import { beforeEach, describe, expect, it } from 'vitest';
import { getAuthToken, setAuthToken } from './api';

describe('auth token storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('stores token in localStorage and clears sessionStorage when remember is true', () => {
    sessionStorage.setItem('relay_token', 'old-session-token');
    setAuthToken('persisted-token', { remember: true });

    expect(localStorage.getItem('relay_token')).toBe('persisted-token');
    expect(sessionStorage.getItem('relay_token')).toBeNull();
    expect(getAuthToken()).toBe('persisted-token');
  });

  it('stores token in sessionStorage and clears localStorage when remember is false', () => {
    localStorage.setItem('relay_token', 'old-local-token');
    setAuthToken('session-token', { remember: false });

    expect(sessionStorage.getItem('relay_token')).toBe('session-token');
    expect(localStorage.getItem('relay_token')).toBeNull();
    expect(getAuthToken()).toBe('session-token');
  });

  it('clears both localStorage and sessionStorage when token is null', () => {
    localStorage.setItem('relay_token', 'local-token');
    sessionStorage.setItem('relay_token', 'session-token');
    setAuthToken(null);

    expect(localStorage.getItem('relay_token')).toBeNull();
    expect(sessionStorage.getItem('relay_token')).toBeNull();
    expect(getAuthToken()).toBeNull();
  });
});

