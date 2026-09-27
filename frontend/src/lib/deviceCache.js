/**
 * Device-side response cache — cuts repeat mobile data for catalogue GETs.
 * Soft TTL serves instantly + revalidates; hard TTL expires. Never caches
 * mutations (POST/PUT) or auth-sensitive payloads.
 */

const PREFIX = 'pe-cache:v1:';
const MAX_ENTRIES = 80;

function safeParse(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function pruneIfNeeded() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const k = localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    if (keys.length <= MAX_ENTRIES) return;
    const scored = keys
      .map((k) => {
        const entry = safeParse(localStorage.getItem(k));
        return { k, at: entry?.savedAt || 0 };
      })
      .sort((a, b) => a.at - b.at);
    const drop = scored.slice(0, scored.length - MAX_ENTRIES);
    drop.forEach(({ k }) => localStorage.removeItem(k));
  } catch {
    /* quota / private mode */
  }
}

export function deviceCacheGet(key) {
  if (typeof localStorage === 'undefined') return null;
  try {
    const entry = safeParse(localStorage.getItem(PREFIX + key));
    if (!entry || entry.exp == null) return null;
    if (Date.now() > entry.exp) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return {
      data: entry.data,
      savedAt: entry.savedAt || 0,
      softUntil: entry.softUntil || 0,
    };
  } catch {
    return null;
  }
}

export function deviceCacheSet(key, data, { ttlMs = 5 * 60 * 1000, softMs = 60 * 1000 } = {}) {
  if (typeof localStorage === 'undefined') return;
  try {
    const now = Date.now();
    localStorage.setItem(
      PREFIX + key,
      JSON.stringify({
        data,
        savedAt: now,
        softUntil: now + softMs,
        exp: now + ttlMs,
      })
    );
    pruneIfNeeded();
  } catch {
    /* quota */
  }
}

export function deviceCacheKey(url, params) {
  try {
    return `${url}?${JSON.stringify(params || {})}`;
  } catch {
    return String(url);
  }
}

/**
 * Stale-while-revalidate GET helper.
 * Fresh soft cache → return immediately, refresh in background.
 * Network fail → fall back to any unexpired hard cache.
 */
export async function cachedGet(axiosInstance, url, config = {}, cacheOpts = {}) {
  const key = cacheOpts.key || deviceCacheKey(url, config.params);
  const ttlMs = cacheOpts.ttlMs ?? 5 * 60 * 1000;
  const softMs = cacheOpts.softMs ?? 45 * 1000;
  const cached = deviceCacheGet(key);
  const now = Date.now();

  const revalidate = () =>
    axiosInstance.get(url, config).then((res) => {
      deviceCacheSet(key, res.data, { ttlMs, softMs });
      return res;
    });

  if (cached && cached.softUntil > now) {
    revalidate().catch(() => {});
    return { data: cached.data, status: 200, fromCache: true, config };
  }

  try {
    return await revalidate();
  } catch (err) {
    if (cached?.data != null) {
      return { data: cached.data, status: 200, fromCache: true, stale: true, config };
    }
    throw err;
  }
}
