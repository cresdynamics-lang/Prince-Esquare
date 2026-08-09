// NEW — Shared formatting utilities

const GENERIC_NAMES = new Set(['admin', 'staff', 'user', 'seller', 'customer', 'guest']);

const isGenericName = (name) => {
  const normalized = String(name || '').trim().toLowerCase();
  return !normalized || GENERIC_NAMES.has(normalized);
};

const initialsFromName = (name) => {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const word = parts[0];
  if (isGenericName(word)) return null;
  if (word.length >= 2) return word.slice(0, 2).toUpperCase();
  return word[0]?.toUpperCase() || null;
};

const initialsFromEmail = (email) => {
  const local = String(email || '').split('@')[0]?.replace(/\+.*/, '').trim();
  if (!local) return null;

  const segments = local.split(/[._-]+/).filter(Boolean);
  if (segments.length >= 2) {
    const first = segments[0].replace(/\d+/g, '');
    const last = segments[segments.length - 1].replace(/\d+/g, '');
    if (first && last) return (first[0] + last[0]).toUpperCase();
  }

  const letters = local.replace(/\d+/g, '');
  const source = letters.length >= 2 ? letters : local;
  if (source.length >= 2) return source.slice(0, 2).toUpperCase();
  if (source.length === 1) return source.toUpperCase();
  return null;
};

/** Initials from a user object or plain name/email string */
export const userInitials = (user) => {
  if (!user) return '?';

  if (typeof user === 'string') {
    return initialsFromName(user) || initialsFromEmail(user) || '?';
  }

  const name = user.fullName || user.full_name || user.name;
  return initialsFromName(name) || initialsFromEmail(user.email) || '?';
};

/** @deprecated Prefer userInitials(user) — kept for existing imports */
export const nameInitials = (nameOrUser) => userInitials(nameOrUser);

export const formatKES = (amount) => {
  const n = Number(amount) || 0;
  return `KES ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
