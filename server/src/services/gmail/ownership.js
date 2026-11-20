/**
 * A user may only connect the Gmail inbox of the Google account they are signed in as.
 * Google sign-in users must come back with the same Google account (`sub`).
 * Email/password users must come back with a verified Google account whose email
 * equals their Relay email.
 * @param {{ email?: string, googleId?: string }} user
 * @param {{ id?: string, email?: string, verified_email?: boolean }} googleInfo
 * @returns {boolean}
 */
export function mailboxBelongsToUser(user, googleInfo) {
  if (!user || !googleInfo) return false;
  if (user.googleId) {
    return Boolean(googleInfo.id) && String(googleInfo.id) === String(user.googleId);
  }
  const userEmail = String(user.email || '').toLowerCase().trim();
  const googleEmail = String(googleInfo.email || '').toLowerCase().trim();
  return Boolean(userEmail) && googleInfo.verified_email === true && googleEmail === userEmail;
}
