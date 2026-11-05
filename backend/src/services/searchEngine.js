/**
 * In-memory product search. The catalogue is small (a few hundred items), so
 * ranking in JS gives us typo tolerance, shop vocabulary and all-words matching
 * without needing a Postgres extension. Pure functions: pass rows in, get rows out.
 */

/** Words Kenyan shoppers use → words that appear in our catalogue. */
const SYNONYMS = {
  official: ['formal'],
  officials: ['formal'],
  sneaker: ['casual', 'sneakers'],
  sneakers: ['casual', 'sneaker'],
  rubbers: ['casual', 'sneakers'],
  kicks: ['casual', 'sneakers'],
  tracksuit: ['track'],
  tracksuits: ['track'],
  trouser: ['trousers'],
  pants: ['trousers'],
  pant: ['trousers'],
  denim: ['jeans'],
  tee: ['t-shirt'],
  tees: ['t-shirt'],
  tshirt: ['t-shirt'],
  tshirts: ['t-shirt'],
  coat: ['jacket', 'blazer'],
  coats: ['jacket', 'blazer'],
  puffer: ['quilted', 'puffer'],
  tux: ['suit'],
  tuxedo: ['suit'],
  wedding: ['suit', 'three-piece', 'formal'],
  groom: ['suit', 'three-piece'],
  gift: ['gift', 'set'],
  polos: ['polo'],
  khakis: ['khaki'],
  chinos: ['chino'],
  moccasin: ['loafer'],
  moccasins: ['loafer'],
};

const STOP_WORDS = new Set(['for', 'and', 'the', 'men', 'mens', "men's", 'man', 'in', 'of', 'with', 'kenya', 'nairobi']);

/** Everyday shopping words that are not in product names; never "correct" these into one. */
const INTENT_WORDS = new Set([
  'cold', 'warm', 'hot', 'winter', 'summer', 'office', 'work', 'party', 'smart', 'best', 'cheap',
  'quality', 'new', 'stylish', 'event', 'church', 'date', 'dinner', 'travel', 'beach', 'coast',
]);

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function singular(word) {
  if (word.length > 4 && word.endsWith('ses')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

function queryTokens(query) {
  const tokens = normalize(query).split(' ').filter(Boolean);
  const useful = tokens.filter((t) => !STOP_WORDS.has(t) && !INTENT_WORDS.has(t));
  return useful.length ? useful : tokens;
}

function editDistance(a, b, cap = 3) {
  if (Math.abs(a.length - b.length) >= cap) return cap;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      row.push(value);
      if (value < best) best = value;
    }
    if (best >= cap) return cap;
    prev = row;
  }
  return prev[b.length];
}

function buildVocabulary(products, categories = []) {
  const vocabulary = new Map(); // word → how many times the catalogue uses it
  const add = (text) => {
    for (const word of normalize(text).split(/[\s-]+/)) {
      if (word.length >= 3) vocabulary.set(word, (vocabulary.get(word) || 0) + 1);
    }
  };
  products.forEach((p) => {
    add(p.name);
    add(p.category_name);
    add(p.parent_category_name);
    add(p.brand_name);
  });
  categories.forEach((c) => add(c.name));
  return vocabulary;
}

/** Fix a misspelt word using the catalogue's own vocabulary ("sute" → "suit"). */
function correctToken(token, vocabulary) {
  if (token.length < 3 || /\d/.test(token)) return token;
  if (vocabulary.has(token) || vocabulary.has(singular(token))) return token;
  if (SYNONYMS[token]) return token;
  if ([...vocabulary.keys()].some((word) => word.startsWith(token))) return token;

  const allowed = 2;
  let best = null;
  let bestDistance = allowed + 1;
  let bestCount = -1;
  for (const word of vocabulary.keys()) {
    // Typos rarely change the first letter, and short words need the first two to match.
    if (word[0] !== token[0]) continue;
    if (token.length <= 4 && word[1] !== token[1]) continue;
    const distance = editDistance(token, word, allowed + 1);
    const count = vocabulary.get(word);
    // Closest spelling wins; on a tie, the word the catalogue uses most ("sute" → suit, not suede).
    if (distance < bestDistance || (distance === bestDistance && distance <= allowed && count > bestCount)) {
      best = word;
      bestDistance = distance;
      bestCount = count;
    }
  }
  return best || token;
}

function hasWord(haystack, needle) {
  if (!needle) return false;
  return ` ${haystack} `.includes(` ${needle}`);
}

function scoreToken(token, fields) {
  const variants = [...new Set([token, singular(token), ...(SYNONYMS[token] || [])])];
  let best = 0;
  variants.forEach((variant, index) => {
    const penalty = index === 0 ? 1 : 0.8;
    if (hasWord(fields.name, variant)) best = Math.max(best, 10 * penalty);
    else if (fields.name.includes(variant)) best = Math.max(best, 7 * penalty);
    if (hasWord(fields.category, variant)) best = Math.max(best, 8 * penalty);
    if (hasWord(fields.brand, variant)) best = Math.max(best, 8 * penalty);
    if (hasWord(fields.description, variant)) best = Math.max(best, 2 * penalty);
  });
  return best;
}

function isInStock(product) {
  return Number(product.stock_quantity) > 0;
}

/**
 * @returns {{products:object[],total:number,correctedQuery:string|null,matchType:'exact'|'related'|'none'}}
 */
function searchCatalog(query, products, { categories = [], limit = 8 } = {}) {
  const raw = queryTokens(query);
  if (!raw.length) return { products: [], total: 0, correctedQuery: null, matchType: 'none' };

  const vocabulary = buildVocabulary(products, categories);
  const tokens = raw.map((token) => correctToken(token, vocabulary));
  const correctedQuery = tokens.join(' ') !== raw.join(' ') ? tokens.join(' ') : null;
  const phrase = tokens.join(' ');

  const scored = [];
  for (const product of products) {
    const fields = {
      name: normalize(product.name),
      category: normalize(`${product.category_name || ''} ${product.parent_category_name || ''}`),
      brand: normalize(product.brand_name),
      description: normalize(product.description),
    };
    const perToken = tokens.map((token) => scoreToken(token, fields));
    const matched = perToken.filter((s) => s > 0).length;
    if (!matched) continue;
    // A name, category or brand hit is what the shopper meant; a passing mention
    // in a description ("pairs well with a suit") is only a fallback.
    const strong = perToken.every((s) => s > 2);

    let score = perToken.reduce((sum, s) => sum + s, 0);
    if (fields.name.includes(phrase)) score += 12;
    if (fields.name.startsWith(phrase)) score += 4;
    if (product.is_featured) score += 1;
    if (isInStock(product)) score += 2;
    scored.push({ product, score, matched, complete: matched === tokens.length, strong });
  }

  const strongRows = scored.filter((row) => row.complete && row.strong);
  const complete = strongRows.length ? strongRows : scored.filter((row) => row.complete);
  const pool = complete.length ? complete : scored;
  pool.sort(
    (a, b) => b.matched - a.matched || b.score - a.score || String(a.product.name).localeCompare(String(b.product.name))
  );

  return {
    products: pool.slice(0, limit).map((row) => row.product),
    total: pool.length,
    correctedQuery,
    matchType: complete.length ? 'exact' : pool.length ? 'related' : 'none',
  };
}

/** Category shortcuts shown above product results ("suit" → Suits, Two-Piece). */
function matchCategories(query, categories, limit = 4) {
  const tokens = queryTokens(query);
  if (!tokens.length) return [];
  const vocabulary = buildVocabulary([], categories);
  const corrected = tokens.map((t) => correctToken(t, vocabulary));

  return categories
    .map((category) => {
      const name = normalize(category.name);
      const hits = corrected.filter((t) => {
        const variants = [t, singular(t), ...(SYNONYMS[t] || []).map(singular)];
        return variants.some((v) => name.includes(v));
      }).length;
      return { category, hits };
    })
    .filter((row) => row.hits > 0)
    .sort((a, b) => b.hits - a.hits || (b.category.count || 0) - (a.category.count || 0))
    .map((row) => row.category)
    // "Suits" exists at two levels; only the larger (parent) one is worth a shortcut.
    .filter((category, index, list) => list.findIndex((c) => c.name === category.name) === index)
    .slice(0, limit);
}

module.exports = { searchCatalog, matchCategories, correctToken, buildVocabulary, normalize };
