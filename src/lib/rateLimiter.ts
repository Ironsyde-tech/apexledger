/**
 * Simple in-memory client-side rate limiter.
 * NOT a security measure (bypassable), but prevents accidental spam and abuse.
 *
 * @param key    - Identifier for the action being rate-limited (e.g. "login", "contact-form")
 * @param max    - Maximum number of attempts allowed within the window
 * @param windowMs - Time window in milliseconds
 * @returns true if the action should be blocked, false if it's allowed
 */

const attempts = new Map<string, number[]>();

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const history = (attempts.get(key) ?? []).filter((t) => now - t < windowMs);

  if (history.length >= max) {
    attempts.set(key, history);
    return true;
  }

  history.push(now);
  attempts.set(key, history);
  return false;
}
