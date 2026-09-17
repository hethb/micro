/** Supabase's default minimum password length. */
export const MIN_PASSWORD_LENGTH = 6;

/** A light client-side check; Supabase does the real validation. */
export function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
