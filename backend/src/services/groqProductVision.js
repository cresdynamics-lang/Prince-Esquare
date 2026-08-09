/**
 * Vision → SEO product copy for Prince Esquire (The Man's Shop, Nairobi).
 *
 * Fast chain (stops on first success, max VISION_MAX_MODELS tries):
 * 1. Gemini primary — GEMINI_VISION_MODEL (default gemini-flash-lite-latest)
 * 2. Gemini fallbacks — GEMINI_VISION_FALLBACK_MODELS
 * 3. Groq — last resort when GROQ_API_KEY is set
 *
 * Images are downscaled before send. Each model call has a hard timeout so nginx
 * never returns a raw 504 HTML page to the admin UI.
 * Quota-exhausted models are skipped quickly; RPM “try again in Xs” waits + retries.
 */
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b';
const GEMINI_MODEL = process.env.GEMINI_VISION_MODEL || 'gemini-flash-lite-latest';
const GEMINI_FALLBACK_MODELS = String(
  process.env.GEMINI_VISION_FALLBACK_MODELS ||
    'gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-flash-latest'
)
  .split(',')
  .map((m) => m.trim())
  .filter(Boolean);

const PER_MODEL_MS = Math.max(10000, Number(process.env.VISION_MODEL_TIMEOUT_MS || 35000));
const MAX_MODELS = Math.max(1, Number(process.env.VISION_MAX_MODELS || 4));
const MAX_IMAGE_EDGE = Math.max(400, Number(process.env.VISION_IMAGE_MAX_EDGE || 720));
const MAX_OUT_TOKENS = Math.max(600, Number(process.env.VISION_MAX_OUTPUT_TOKENS || 1200));
/** Retries only when provider gives a short “try again in Xs” (RPM), not hard daily quota. */
const RATE_LIMIT_RETRIES = Math.max(0, Number(process.env.VISION_RATE_LIMIT_RETRIES || 2));
const DEFAULT_RATE_WAIT_MS = Math.max(5000, Number(process.env.VISION_RATE_WAIT_MS || 28000));

const FRIENDLY_RETRY =
  'We could not finish reading that photo just now. Please wait about a minute, then try again.';

const SYSTEM_PROMPT = `You are the product copywriter and SEO specialist for Prince Esquire — The Man's Shop at Yala Towers, Nairobi CBD, Kenya.

Brand: luxury / premium men's fashion boutique (menswear, formal shoes, suits, shirts, polos, tracksuits, linen, jackets, trousers, belts & ties).
Audience: discerning Kenyan and East African gentlemen — professionals, diaspora clients, wedding and boardroom occasions.
Tone: refined, confident, specific. Always masculine. Never feminine. Never childish. Never mention "AI" or "as an AI".

When given a product photo, describe ONLY what is clearly visible in that photo — not a related product, not inventory assumptions, not marketing inventory you cannot see.

Photo-first rules (critical):
- Base name, colours, pattern, and category on the actual garment/footwear/accessory in the frame.
- Do not invent a brand unless a logo/text on the product is clearly readable.
- Do not invent fabric names, pocket counts, sole types, or accessories that are not visible.
- Prefer plain accurate naming over hype: "Navy Oxford Shirt" beats a long fictional style story.
- If the photo is a single item, describe that one item. Only fill "components" when multiple distinct pieces are actually visible (outfit/set shot).
- Colours must match what you see; for stripes/checks use ONE patterned colour name (e.g. "Navy Striped"), never list stripe threads as separate colours.

Return ONLY valid JSON (no markdown) with this exact shape:
{
  "name": "Product display name in Title Case with brand/style cues when visible (e.g. Clarks Dark Brown Wingtip Brogue Oxford Shoes)",
  "slug": "url-safe-kebab-case-slug",
  "focus_description": "1 short sentence, ~80-140 chars. Who it's for + light SEO (e.g. luxury shoes Nairobi).",
  "description": "2 short paragraphs, 300-550 characters max. What it is, finish if visible, when to wear, Nairobi/Kenya. No hashtags. No ALL CAPS.",
  "parent_category_slug": "shirts",
  "category_slug": "formal-shirts",
  "colors": ["Navy Striped"],
  "pattern": "striped",
  "components": [
    {
      "name": "Sand Khaki Trousers",
      "category_hint": "khaki",
      "size": "32",
      "price": 4500,
      "note": "optional short note"
    }
  ]
}

Rules:
- name: clear, searchable, specific (color, style, type). Prefer Title Case, not ALL CAPS. Always men's naming.
- slug: lowercase, hyphens only, no leading/trailing hyphens, ASCII, max 80 chars.
- parent_category_slug / category_slug: best-fit menswear categories for this store. Use kebab-case.
  Parents (prefer exact match): polo-t-shirts, shoes, shirts, suits, blazers, track-suits, jackets, vests, boxers, trousers, linen, sets, caps-hats, belts-ties, sweaters, t-shirts.
  Leaves when clear: e.g. formal-shirts, shirts-casual, polo-t-shirts, formal-shoes, casual, loafers, boots, khaki, chino, jeans, gurkha, formal, blazers, jackets, etc. If unsure of the leaf, repeat the parent slug for both fields.
- colors (CRITICAL for patterns):
  - Solid single colour → one name, e.g. ["Navy"], ["Dark Brown"].
  - Striped / pinstripe / striped pattern → ONE colour string that includes "Striped" (or "Pinstripe"), NOT two separate solid colours.
    Examples: ["Navy Striped"], ["Blue & White Striped"], ["Black Pinstripe"]. NEVER return ["Blue", "White"] for a striped shirt.
  - Checked / gingham / windowpane → ONE name with the pattern, e.g. ["Navy Windowpane"], ["Red Gingham"].
  - Floral / printed / geometric print → ONE patterned name, e.g. ["Burgundy Printed"].
  - Two genuine alternate product colourways (completely different solid SKUs) only if the photo clearly shows two product variants — rare in a single flat-lay. Prefer one colour/pattern entry for a single garment photo.
  - Never use "Original". Never return an empty array.
- pattern: optional short lowercase label: solid | striped | pinstripe | checked | printed | textured | other.
- If brand is unclear, omit brand names rather than guessing wrongly.
- If image is unclear, still produce best-effort menswear copy based only on visible cues — never invent details.
- focus_description and description must be sentence case, not uppercase.
- components: default ALWAYS []. ONLY fill when Sets / full outfit shot with multiple pieces.
- Keep the whole JSON compact so it never truncates. Prefer shorter description (~250-400 chars) over long copy.
- For Sets: list every visible piece. category_hint: khaki|jeans|gurkha|chino|formal|formal-shirts|shirts-casual|polo-t-shirts|belts-ties|formal-shoes|casual|loafers|boots|caps-hats|blazers|jackets|other.
- For Sets: size/price optional. Name the whole look as a set when components are filled.
Masculine naming (critical):
- Never use feminine or unisex-soft words in name, slug, or descriptions: no "dress trousers", "dress pants", "ladies", "women's", "girly", "cute", "pretty", "floral dress", "skirt", "blouse", "heels".
- Prefer men's terms: men's trousers, formal trousers, tailored trousers, office trousers, wedding trousers, boardroom trousers — never "dress trousers".
- Say "men's" / "gentlemen" / "him" — never "her" / "she" / "women".

Trousers / pants (critical — be specific):
- When the product is trousers, chinos, khakis, or similar, name and describe the exact style if visible. Prefer one clear type in the product name.
- Style cues to look for and name explicitly when they fit:
  - Gurkha / Ghurka trousers: high waist, double buckle or buttoned waistband straps, no classic belt loops look, tailored formal drape.
  - Khaki trousers: classic khaki / sand / stone cotton work-to-weekend look; say "Men's Khaki Trousers" (or Khakis) when that is the fabric/colour style.
  - Chinos: cotton twill, smarter-casual tapered or straight; say "Men's Chinos" or "Men's Chino Trousers".
  - Formal / tailored trousers: suit-adjacent, sharp crease, wool or fine weave for office or wedding.
  - Linen trousers: visible linen texture, relaxed warm-weather drape.
  - Cargo / utility: visible cargo pockets.
- Put the style in the name when clear, e.g. "Men's Navy Gurkha Trousers", "Beige Men's Chinos", "Classic Sand Khaki Trousers", "Charcoal Tailored Formal Trousers".
- In focus_description and description, briefly confirm the style (Gurkha buckles, chino twill, khaki wash, etc.) so shoppers know exactly what they are buying.
- If category hint is Trousers / Chinos / Khakis, lean into that family and still pick the best subtype from the photo.`;

function slugify(text = '') {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .slice(0, 80);
}

function titleCaseColor(value = '') {
  return String(value)
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PATTERN_WORDS = /\b(striped|stripe|stripes|pinstripe|pinstriped|checked|check|gingham|windowpane|plaid|printed|print|patterned|herringbone|houndstooth)\b/i;

function normalizePatternLabel(value = '') {
  const v = String(value || '').trim().toLowerCase();
  if (!v || v === 'solid' || v === 'none') return '';
  if (/stripe|pinstripe/.test(v)) return v.includes('pin') ? 'Pinstripe' : 'Striped';
  if (/check|gingham|windowpane|plaid/.test(v)) {
    if (v.includes('gingham')) return 'Gingham';
    if (v.includes('window')) return 'Windowpane';
    if (v.includes('plaid')) return 'Plaid';
    return 'Checked';
  }
  if (/print/.test(v)) return 'Printed';
  if (/herringbone/.test(v)) return 'Herringbone';
  if (/houndstooth/.test(v)) return 'Houndstooth';
  return titleCaseColor(v);
}

/**
 * Prefer a single patterned colour name over multiple solid chips for striped garments.
 */
function normalizeColors(raw, patternHint = '') {
  let list = raw;
  if (typeof list === 'string') {
    list = list.split(/[,|/]/).map((s) => s.trim()).filter(Boolean);
  }
  if (!Array.isArray(list)) list = [];

  const seen = new Set();
  const colors = [];
  for (const item of list) {
    const name = titleCaseColor(typeof item === 'string' ? item : item?.name || item?.color || '');
    if (!name || name.toLowerCase() === 'original') continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    colors.push(name);
  }

  const patternLabel = normalizePatternLabel(patternHint);
  const hasPatternWord = colors.some((c) => PATTERN_WORDS.test(c));

  // Model returned two solids for a striped look → collapse to one "X & Y Striped"
  if (!hasPatternWord && patternLabel && colors.length >= 2) {
    return [`${colors.slice(0, 2).join(' & ')} ${patternLabel}`];
  }
  if (!hasPatternWord && patternLabel && colors.length === 1) {
    return [`${colors[0]} ${patternLabel}`];
  }
  // Two bare solids with stripe words only in name context handled elsewhere
  if (!hasPatternWord && colors.length === 2 && !patternLabel) {
    // Common bad pair from stripe shirts: Blue + White → assume striped
    const pair = colors.map((c) => c.toLowerCase()).sort().join('|');
    if (
      pair === 'blue|white' ||
      pair === 'black|white' ||
      pair === 'navy|white' ||
      pair === 'grey|white' ||
      pair === 'gray|white'
    ) {
      return [`${colors[0]} & ${colors[1]} Striped`];
    }
  }
  return colors;
}

const NAME_COLOR_PHRASES = [
  'Dark Brown', 'Light Brown', 'Dark Blue', 'Light Blue', 'Dark Grey', 'Light Grey',
  'Dark Gray', 'Light Gray', 'Charcoal', 'Burgundy', 'Chocolate', 'Espresso', 'Mustard',
  'Khaki', 'Camel', 'Stone', 'Sand', 'Beige', 'Cream', 'Ivory', 'Navy', 'Black', 'Brown',
  'Tan', 'Olive', 'Grey', 'Gray', 'White', 'Maroon', 'Green', 'Blue', 'Red', 'Wine',
  'Rust', 'Orange', 'Purple', 'Silver', 'Gold', 'Slate', 'Indigo', 'Teal',
];

function inferColorsFromName(name = '') {
  const text = String(name || '');
  if (!text) return [];
  const found = [];
  const lower = text.toLowerCase();
  for (const phrase of NAME_COLOR_PHRASES) {
    if (lower.includes(phrase.toLowerCase())) found.push(phrase);
  }
  return normalizeColors(found);
}

function stripCodeFences(text = '') {
  return String(text)
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function unescapeJsonString(value = '') {
  return String(value)
    .replace(/\\n/g, ' ')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim();
}

/** Best-effort when the model cuts JSON mid-response (common under token limits). */
function salvagePartialProductJson(text) {
  const src = String(text || '');
  const pick = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i');
    const m = src.match(re);
    return m ? unescapeJsonString(m[1]) : '';
  };
  const name = pick('name');
  const description = pick('description') || pick('focus_description');
  if (!name || !description) return null;
  const focus = pick('focus_description');
  const slug = pick('slug');
  const parent = pick('parent_category_slug');
  const category = pick('category_slug');
  const pattern = pick('pattern');
  const colorBlock = src.match(/"colors"\s*:\s*\[([\s\S]*?)\]/i);
  let colors = [];
  if (colorBlock) {
    colors = [...colorBlock[1].matchAll(/"((?:\\.|[^"\\])*)"/g)].map((m) => unescapeJsonString(m[1]));
  }
  return {
    name,
    slug,
    focus_description: focus,
    description,
    parent_category_slug: parent,
    category_slug: category,
    colors,
    pattern,
    components: [],
  };
}

function closeOpenJson(text) {
  let s = String(text || '').trim();
  const start = s.indexOf('{');
  if (start < 0) return s;
  s = s.slice(start);

  let inStr = false;
  let esc = false;
  let braces = 0;
  let brackets = 0;
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === '\\') {
        esc = true;
      } else if (ch === '"') {
        inStr = false;
      }
      continue;
    }
    if (ch === '"') {
      inStr = true;
      continue;
    }
    if (ch === '{') braces += 1;
    else if (ch === '}') braces = Math.max(0, braces - 1);
    else if (ch === '[') brackets += 1;
    else if (ch === ']') brackets = Math.max(0, brackets - 1);
  }
  if (inStr) s += '"';
  // Drop trailing partial key/value debris
  s = s.replace(/,\s*("[^"]*"\s*:\s*)?$/g, '');
  s = s.replace(/,\s*$/g, '');
  while (brackets > 0) {
    s += ']';
    brackets -= 1;
  }
  while (braces > 0) {
    s += '}';
    braces -= 1;
  }
  return s;
}

function extractJson(text) {
  if (!text) throw apiError(FRIENDLY_RETRY, 502);
  const trimmed = stripCodeFences(text);
  try {
    return JSON.parse(trimmed);
  } catch {
    /* continue */
  }
  try {
    return JSON.parse(closeOpenJson(trimmed));
  } catch {
    /* continue */
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      try {
        return JSON.parse(closeOpenJson(match[0]));
      } catch {
        /* fall through */
      }
    }
  }
  const salvaged = salvagePartialProductJson(trimmed);
  if (salvaged) return salvaged;
  throw apiError(FRIENDLY_RETRY, 502);
}

function normalizeSetComponents(raw) {
  if (!raw) return [];
  let list = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list
    .map((item, index) => {
      const name = String(item?.name || item?.title || '').trim();
      if (!name) return null;
      const priceRaw = item.price ?? item.estimated_price ?? item.estimatedPrice;
      const price = priceRaw === '' || priceRaw == null ? '' : Number(priceRaw);
      return {
        id: String(item.id || `ai-${index + 1}`),
        name,
        category_hint: String(item.category_hint || item.categoryHint || item.type || 'other')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .slice(0, 40) || 'other',
        size: String(item.size || item.suggested_size || item.suggestedSize || '').trim(),
        price: Number.isFinite(price) ? price : '',
        note: String(item.note || '').trim(),
      };
    })
    .filter(Boolean);
}

function normalizePayload(raw) {
  const name = String(raw.name || '').trim().replace(/\s+/g, ' ');
  const focus = String(raw.focus_description || raw.focusDescription || '').trim();
  let description = String(raw.description || '').trim();
  if (!description && focus) description = focus;
  if (!description && name) {
    description = `${name} from Prince Esquire — The Man's Shop, Yala Towers, Nairobi.`;
  }
  let slug = String(raw.slug || '').trim().toLowerCase();
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    slug = slugify(name);
  } else {
    slug = slugify(slug);
  }

  if (!name) {
    throw apiError(FRIENDLY_RETRY, 502);
  }

  const pattern = String(raw.pattern || raw.pattern_type || raw.patternType || '').trim();
  const colors = normalizeColors(raw.colors || raw.color || raw.colour || raw.colours, pattern);
  let inferred = colors.length ? colors : inferColorsFromName(name);
  // If name says striped but colors are multi-solid, collapse
  if (/strip|pin.?stripe/i.test(name) && inferred.length > 1 && !inferred.some((c) => PATTERN_WORDS.test(c))) {
    inferred = normalizeColors(inferred, 'striped');
  }
  const components = normalizeSetComponents(
    raw.components || raw.set_components || raw.setComponents || raw.pieces || raw.items
  );

  const parentSlug = slugify(
    raw.parent_category_slug || raw.parentCategorySlug || raw.parent_category || ''
  );
  const categorySlug = slugify(
    raw.category_slug || raw.categorySlug || raw.category || parentSlug
  );

  return {
    name,
    slug,
    focus_description: focus || description.split(/(?<=[.!?])\s+/)[0].slice(0, 200),
    description,
    colors: inferred,
    parent_category_slug: parentSlug || null,
    category_slug: categorySlug || parentSlug || null,
    pattern: pattern || null,
    components,
  };
}

function buildUserText(hints = {}) {
  const hintBits = [];
  if (hints.categoryName) hintBits.push(`Selected category: ${hints.categoryName}`);
  if (hints.brandName) hintBits.push(`Selected brand: ${hints.brandName}`);
  const isSet = /set/i.test(String(hints.categoryName || '')) && !/track/i.test(String(hints.categoryName || ''));
  return [
    isSet
      ? 'Analyze this outfit / set look photo for Prince Esquire. Identify EVERY visible garment and accessory (trousers, shirt, belt, shoes, cap, jacket, etc.). Return JSON including a components array for each piece.'
      : 'Analyze this product image for Prince Esquire and return the JSON fields, including visible colors, pattern, and best category slugs.',
    hintBits.length ? `${hintBits.join('. ')}.` : '',
    'Target market: men shopping luxury fashion in Kenya / Nairobi.',
    'If the garment is striped, pinstripe, checked, or printed, set pattern accordingly and use ONE colour name that includes that pattern word — never list stripe threads as two separate colors.',
    isSet
      ? 'For Sets: name the full look (e.g. "Navy Khaki & White Shirt Complete Set"). List each piece in components with name, category_hint, suggested size if readable, and a rough price in KES if you can estimate from typical Prince Esquire range — admin will edit prices.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function apiError(message, statusCode = 502) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

function toFriendlyError(err) {
  const status = err?.statusCode || err?.status;
  const raw = String(err?.message || '');
  const name = String(err?.name || '');
  const technical =
    name === 'AbortError' ||
    /json|model|api key|configured|groq|gemini|fetch|timeout|aborted|rate|quota|empty|did not return|status|econnreset|gateway|504|503|502/i.test(raw) ||
    !raw ||
    (status && (status >= 500 || status === 429));

  if (technical) {
    // Always 503 for soft "try again" so the UI can treat it as temporary, not hard fail
    return apiError(FRIENDLY_RETRY, 503);
  }
  return apiError(raw, status && status >= 400 ? status : 503);
}

async function fetchWithTimeout(url, options = {}, ms = PER_MODEL_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw apiError(FRIENDLY_RETRY, 503);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Smaller JPEG for vision APIs — faster upload + inference. */
async function prepareVisionImage(buffer, mimeType) {
  if (!buffer?.length) return { buffer, mimeType };
  try {
    // eslint-disable-next-line global-require, import/no-extraneous-dependencies
    const sharp = require('sharp');
    const out = await sharp(buffer)
      .rotate()
      .resize(MAX_IMAGE_EDGE, MAX_IMAGE_EDGE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 68, mozjpeg: true })
      .toBuffer();
    return { buffer: out, mimeType: 'image/jpeg' };
  } catch {
    // Keep original if sharp missing or decode failed
    return { buffer, mimeType: mimeType || 'image/jpeg' };
  }
}

async function analyzeWithGroq({ mimeType, buffer, hints, model = GROQ_MODEL }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw apiError(FRIENDLY_RETRY, 503);

  const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${buffer.toString('base64')}`;

  // Prefer plain completions — qwen + response_format json_object often fails validation
  const response = await fetchWithTimeout(
    GROQ_URL,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'prince-esquire-backend/1.0',
      },
      body: JSON.stringify({
        model,
        temperature: 0.25,
        max_completion_tokens: MAX_OUT_TOKENS,
        messages: [
          {
            role: 'system',
            content: `${SYSTEM_PROMPT}\n\nCRITICAL: Reply with a single JSON object only. No markdown fences. No <think> tags.`,
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: buildUserText(hints) },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    },
    PER_MODEL_MS,
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const failedGen = body?.error?.failed_generation || body?.failed_generation;
    if (failedGen) {
      try {
        return normalizePayload(extractJson(failedGen));
      } catch {
        /* fall through */
      }
    }
    throw apiError(body?.error?.message || FRIENDLY_RETRY, response.status);
  }

  const content = body?.choices?.[0]?.message?.content;
  // Strip possible chain-of-thought wrappers from qwen
  const cleaned = String(content || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim();
  return normalizePayload(extractJson(cleaned || content));
}

async function analyzeWithGemini({ mimeType, buffer, hints, model = GEMINI_MODEL }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw apiError(FRIENDLY_RETRY, 503);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'User-Agent': 'prince-esquire-backend/1.0',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: 'user',
            parts: [
              { text: buildUserText(hints) },
              {
                inline_data: {
                  mime_type: mimeType || 'image/jpeg',
                  data: buffer.toString('base64'),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: MAX_OUT_TOKENS,
          responseMimeType: 'application/json',
        },
      }),
    },
    PER_MODEL_MS,
  );

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      body?.error?.message ||
      body?.error?.status ||
      FRIENDLY_RETRY;
    throw apiError(msg, response.status);
  }

  const parts = body?.candidates?.[0]?.content?.parts || [];
  // Parts often split mid-JSON — join without newlines so parse/repair works
  const content = parts.map((p) => p.text || '').join('').trim();
  if (!content) {
    throw apiError(FRIENDLY_RETRY, 502);
  }
  return normalizePayload(extractJson(content));
}

function buildModelChain() {
  const chain = [];
  const seen = new Set();
  const push = (provider, model) => {
    if (!model) return;
    // Skip models that consistently fail free-tier or are retired for new projects
    if (
      model === 'gemini-2.5-flash' ||
      model === 'gemini-2.5-flash-lite' ||
      model === 'gemini-1.5-flash' ||
      model === 'gemini-2.0-flash' ||
      model === 'gemini-2.0-flash-lite'
    ) {
      return;
    }
    const key = `${provider}:${model}`;
    if (seen.has(key)) return;
    seen.add(key);
    chain.push({ provider, model });
  };

  if (process.env.GEMINI_API_KEY) {
    push('gemini', GEMINI_MODEL);
    for (const model of GEMINI_FALLBACK_MODELS) {
      push('gemini', model);
    }
  }
  if (process.env.GROQ_API_KEY) {
    push('groq', GROQ_MODEL);
  }
  // Prefer at least one model even if primary was filtered
  if (!chain.length && process.env.GEMINI_API_KEY) {
    chain.push({ provider: 'gemini', model: 'gemini-flash-lite-latest' });
  }
  return chain.slice(0, MAX_MODELS);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse provider “try again in X.Ys” so we cool down for RPM.
 * Hard free-tier quota exhaustion (no short retry window) returns 0 → skip to next model.
 */
function parseRetryMs(message = '', status) {
  const text = String(message || '');
  const sec = text.match(/try again in\s*([\d.]+)\s*s/i);
  if (sec) {
    return Math.min(75000, Math.ceil(Number(sec[1]) * 1000) + 800);
  }
  // Daily / free-tier hard block — waiting 30s does not help; move to another model.
  if (
    /exceeded your current quota|quota exceeded|free_tier|billing details|resource_exhausted/i.test(text) &&
    !/try again in/i.test(text)
  ) {
    return 0;
  }
  const rateLimited =
    status === 429 ||
    /rate limit|tokens per minute|tpm|too many requests/i.test(text);
  if (rateLimited) return DEFAULT_RATE_WAIT_MS;
  return 0;
}

/**
 * Try each configured vision model in order until one succeeds.
 * On rate/quota limits, wait and retry the same model a few times before switching.
 * Only after every model fails do we return the friendly “try again” message.
 */
async function analyzeProductImage({ mimeType, buffer, hints = {} }) {
  const chain = buildModelChain();
  if (!chain.length) {
    throw apiError(FRIENDLY_RETRY, 503);
  }

  const prepared = await prepareVisionImage(buffer, mimeType);
  const img = prepared.buffer;
  const type = prepared.mimeType;

  let lastError = null;

  for (let i = 0; i < chain.length; i += 1) {
    const { provider, model } = chain[i];
    const next = chain[i + 1];
    const attempts = 1 + RATE_LIMIT_RETRIES;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const started = Date.now();
      try {
        const result =
          provider === 'groq'
            ? await analyzeWithGroq({ mimeType: type, buffer: img, hints, model })
            : await analyzeWithGemini({ mimeType: type, buffer: img, hints, model });
        console.info(
          `[product-vision] ok ${provider}/${model} in ${Date.now() - started}ms` +
            (attempt > 1 ? ` (attempt ${attempt})` : '') +
            ` (image ${img.length}b)`
        );
        return { ...result, provider, model };
      } catch (err) {
        lastError = err;
        const waitMs = parseRetryMs(err.message, err.statusCode || err.status);
        if (waitMs && attempt < attempts) {
          console.warn(
            `[product-vision] ${provider}/${model} rate-limited` +
              ` (attempt ${attempt}/${attempts}, ${Date.now() - started}ms).` +
              ` Waiting ${Math.round(waitMs / 1000)}s then retry…`
          );
          // eslint-disable-next-line no-await-in-loop
          await sleep(waitMs);
          continue;
        }
        console.warn(
          `[product-vision] ${provider}/${model} failed in ${Date.now() - started}ms (${err.message}).` +
            (next ? ` Switching to ${next.provider}/${next.model}…` : ' No more models left.')
        );
        break;
      }
    }
  }

  throw toFriendlyError(lastError || apiError(FRIENDLY_RETRY, 503));
}

module.exports = {
  analyzeProductImage,
  slugify,
  FRIENDLY_RETRY,
  GROQ_MODEL,
  GEMINI_MODEL,
};
