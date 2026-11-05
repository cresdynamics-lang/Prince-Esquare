/**
 * House rules for product names, shared by the AI writer and anything else that
 * creates a listing. Formula: [Brand or house name] + colour + one detail + type.
 */

/** Short names that set otherwise identical unbranded pieces apart. */
const HOUSE_NAMES = [
  'Ambassador', 'Chairman', 'Counsel', 'Director', 'Magistrate', 'Statesman', 'Consul',
  'Regent', 'Governor', 'Diplomat', 'Senator', 'Barrister', 'Advocate', 'Minister',
  'Patron', 'Executive', 'Principal', 'Trustee', 'Laureate', 'Sentinel', 'Vanguard',
  'Envoy', 'Marshal', 'Curator', 'Founder', 'Architect', 'Sovereign', 'Commodore',
];

const KEEP_UPPER = new Set(['PE', 'BOSS']);
const SMALL_WORDS = new Set(['and', 'with', 'in', 'of', 'the', 'for', 'on']);

function titleCaseWord(word, index) {
  if (KEEP_UPPER.has(word)) return word;
  const lower = word.toLowerCase();
  if (index > 0 && SMALL_WORDS.has(lower)) return lower;
  return lower.replace(/(^|[-/'])([a-z])/g, (m, sep, ch) =>
    sep === "'" ? m : `${sep}${ch.toUpperCase()}`
  );
}

/** Removes the slips AI and manual entry leave behind. Never adds a fact. */
function polishProductName(value = '') {
  let name = String(value)
    .replace(/\((?:confirmed|verified|via|likely|possibly)[^)]*\)?/gi, ' ')
    .replace(/\b(?:nwt|new with tags|size \d+)\b/gi, ' ')
    .replace(/\s+[—–-]\s+[A-Z]{0,3}\s?[A-Z]?\d[\w-]*\s*$/, '')
    .replace(/\s*[—–]\s*/g, ' ')
    .replace(/^[\s:;,.-]+/, '')
    .replace(/[\s:;,.-]+$/, '')
    .replace(/\bdress (trousers|pants|shoes)\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  const letters = name.replace(/[^A-Za-z]/g, '');
  if (letters && letters === letters.toUpperCase()) {
    name = name.split(' ').map(titleCaseWord).join(' ');
  }
  return name;
}

/** When a name is already taken, set the new piece apart with an unused house name. */
function distinctProductName(name, existingNames = []) {
  const taken = new Set(existingNames.map((n) => String(n).trim().toLowerCase()));
  if (!taken.has(name.toLowerCase())) return name;
  const bare = name.replace(/^The \w+ /, '');
  for (const house of HOUSE_NAMES) {
    const candidate = `The ${house} ${bare}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return name;
}

module.exports = { HOUSE_NAMES, polishProductName, distinctProductName };
