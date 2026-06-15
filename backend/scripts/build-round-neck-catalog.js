/**
 * Build round-neck T-shirts catalog from Cursor assets.
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.cursor',
  'projects',
  'c-Users-Spine-Prince-Esquare',
  'assets'
);
const OUT_DIR = path.join(__dirname, '..', 'data', 'round-neck-images');
const OUT_JSON = path.join(__dirname, '..', 'data', 'round-neck.json');
const SPECS_PATH = path.join(__dirname, '..', 'data', 'round-neck-specs.json');

const SPECS = fs.existsSync(SPECS_PATH)
  ? JSON.parse(fs.readFileSync(SPECS_PATH, 'utf8'))
  : {};

const ROUND_NECK_ALLOWLIST = [
  /^85357355418755853$/,
  /^1041105638872140423$/,
  /^983825481302129358$/,
  /^973059063227410039$/,
  /^Homens_Camiseta_S_lido_Gola_Redonda/i,
  /^Men_Solid_Round_Neck_Tee/i,
  /^INAWLY_Plus_Size_Summer_Casual_Solid_Color_Round_Neck/i,
  /^SHEIN_USA/i,
  /^Next_REGULAR_FIT.*RINGER/i,
  /^889038782743985577$/,
  /^Men_s_Casual_Vintage_Washed_Solid_Color_Round_Neck/i,
  /^Camiseta_Oversized.*Gola_Redonda/i,
  /^934567360184354962$/,
  /^976999712955422226$/,
  /^261701428342054007/i,
  /^819232988501803762$/,
  /^Minimalist_White.*Ringer/i,
  /^Clover_heavy_weight/i,
  /^Camisa_oversize_moda_masculino/i,
  /^Men_s_Summer_T-Shirt.*PARIS/i,
  /^Tween_Boys.*Spider/i,
  /^Men_Letter_Graphic_Contrast_Trim_Tee/i,
  /^1092193347152543341$/,
  /^Manfinity_Homme_Plus_Size_Men_s_Letter_Print_Round_Neck/i,
  /^868491109409733438$/,
  /^Men_s_Letter_And_Mountain_Pattern/i,
  /^camisa_masculina-3cd9446a/i,
  /^men_s_fashion_lightning_bolt/i,
  /^Oversized_Black_Spider-Man/i,
  /^camiseta_punto.*Temu/i,
  /^1119426051148909424$/,
  /^611363718205502215$/,
  /^1007610116647446639$/,
];

const SKIP_PATTERNS = [
  /women|mujer|femmes|donna|panda|bear.*cute|HAPPY_Cute/i,
  /Tween_Boy|Chico_preadolescente|Teen_Boy/i,
  /Don_t_miss|Link_is_available|Shop_this_comment|save_it_for_later/i,
  /Abbigliamento_Donna|Women_s___Men_s_Clothing/i,
  /Brand_new_Plain_T-shirts/i,
  /polo|Lacoste|camisa_d__/i,
  /ours_mignon|T-shirt___col_rond.*femmes/i,
  /Camiseta_de_verano_para_mujer/i,
  /Casual_Round_Neck.*Women/i,
  /Retro_American_Style_Women/i,
  /Navy_Blue_Minimalist_Cursive.*Women/i,
  /Gaming_Console|Cartoon_Letter|Palm_Tree/i,
  /____$/,
  /camisa_masculina_de_manga|manga_comprida|long.sleeve/i,
];

const rich = (intro, features, fit, sizes = 'M–3XL') =>
  [
    intro,
    '',
    'Key features:',
    ...features.map((f) => `• ${f}`),
    '',
    `Fit & styling: ${fit}`,
    '',
    'Care: Machine wash cold, tumble dry low. Iron on low heat if needed.',
    '',
    `Available sizes ${sizes}. Exclusively at Prince Esquire.`,
  ].join('\n');

const findSpec = (label) => {
  if (SPECS[label]) return SPECS[label];
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const nLabel = norm(label);
  const keys = Object.keys(SPECS)
    .filter((k) => {
      const nk = norm(k);
      return nLabel === nk || nLabel.includes(nk) || nk.includes(nLabel);
    })
    .sort((a, b) => norm(b).length - norm(a).length);
  return keys.length ? SPECS[keys[0]] : null;
};

const slugify = (v) =>
  String(v || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const extractLabel = (filename) => {
  const base = filename.replace(
    /^c__Users_Spine_AppData_Roaming_Cursor_User_workspaceStorage_c8f3ce83148d02272f6bffebdb3e27f0_images_/,
    ''
  );
  return base.replace(/-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.png$/i, '');
};

const normalizeLabel = (label) =>
  label
    .replace(/__\d+_?$/, '')
    .replace(/_+$/, '')
    .replace(/___1_$/, '');

const isRoundNeckAsset = (filename) => {
  const label = extractLabel(filename);
  if (SKIP_PATTERNS.some((re) => re.test(filename) || re.test(label))) return false;
  return ROUND_NECK_ALLOWLIST.some((re) => re.test(label));
};

const inferColor = (label) => {
  const t = label.toLowerCase();
  const colors = [
    ['White', /\bwhite\b|paris|clover|minimalist_white/i],
    ['Blue', /\bblue\b|navy|lightning|thunder/i],
    ['Black', /\bblack\b|spider-man|spiderman|acid.wash|oversized_black/i],
    ['Green', /\bgreen\b|brooklyn.*green|868491109409733438/i],
    ['Tan', /\btan\b|beige|lifestyle|khaki|1092193347152543341/i],
    ['Grey', /\bgrey|gray/i],
    ['Red', /\bred\b/],
  ];
  for (const [name, re] of colors) if (re.test(t)) return name;
  return 'Black';
};

const inferBrand = (label) => {
  const t = label.toLowerCase();
  if (/puma|camiseta_punto/i.test(t)) return 'Puma';
  if (/nike/i.test(t)) return 'Nike';
  if (/adidas|trefoil|clover/i.test(t)) return 'Adidas';
  if (/shein/i.test(t)) return 'SHEIN';
  return 'Prince Esquire';
};

const inferStyle = (label) => {
  const t = label.toLowerCase();
  if (/graphic|letter|paris|brooklyn|spider|lifestyle|lightning|mountain|big.moves|la\b|99|star|trefoil|clover|ringer/i.test(t))
    return 'GRAPHIC';
  if (/acid|washed|vintage/i.test(t)) return 'VINTAGE WASH';
  if (/oversized|oversize/i.test(t)) return 'OVERSIZED';
  return 'CLASSIC';
};

const buildName = (color, idx, label, spec) => {
  if (spec?.name) return spec.name;
  const style = inferStyle(label);
  const brand = inferBrand(label);
  if (/puma/i.test(label)) return `${brand.toUpperCase()} ${color.toUpperCase()} LOGO ROUND-NECK T-SHIRT`;
  if (style === 'GRAPHIC') return `${color.toUpperCase()} GRAPHIC ROUND-NECK T-SHIRT — PE-${String(idx).padStart(3, '0')}`;
  if (style === 'VINTAGE WASH') return `${color.toUpperCase()} VINTAGE WASH ROUND-NECK T-SHIRT`;
  if (style === 'OVERSIZED') return `${color.toUpperCase()} OVERSIZED ROUND-NECK T-SHIRT`;
  return `${color.toUpperCase()} SOLID ROUND-NECK T-SHIRT — PE-${String(idx).padStart(3, '0')}`;
};

const buildDescription = (meta, label) => {
  const style = inferStyle(label).toLowerCase();
  const intro =
    style.includes('graphic')
      ? `Prince Esquire ${meta.color.toLowerCase()} round-neck T-shirt with a bold chest graphic — soft cotton jersey built for everyday streetwear and casual comfort.`
      : style.includes('vintage')
        ? `Prince Esquire ${meta.color.toLowerCase()} vintage-wash round-neck tee — distressed finish and heavyweight cotton for an authentic lived-in streetwear look.`
        : style.includes('oversized')
          ? `Prince Esquire ${meta.color.toLowerCase()} oversized round-neck T-shirt — relaxed drop-shoulder fit and premium cotton jersey for modern casual styling.`
          : `Prince Esquire ${meta.color.toLowerCase()} solid round-neck essential tee — breathable cotton jersey designed as a versatile everyday staple.`;

  return rich(
    intro,
    [
      `${meta.color} cotton-blend jersey with soft breathable hand-feel.`,
      'Classic ribbed round-neck (crew neck) collar.',
      'Short sleeves with reinforced double-stitched hems.',
      style.includes('graphic') ? 'Statement chest graphic with durable screen print.' : 'Clean minimalist design — easy to layer or wear solo.',
      style.includes('oversized') ? 'Oversized relaxed fit with dropped shoulders.' : 'Comfortable regular-to-relaxed fit through body.',
      'Suitable for casual, streetwear, and weekend wear.',
    ],
    `Pair with denim, chinos, joggers, or shorts depending on the occasion. ${style.includes('oversized') ? 'The relaxed silhouette suits layering under open shirts and lightweight jackets.' : 'Tuck or leave untucked for a clean casual look.'}`,
  );
};

const priceFor = (idx, label, spec) => {
  if (spec?.price) return spec.price;
  if (/puma|nike|adidas/i.test(label)) return 5000 + (idx % 5) * 400;
  if (/graphic|letter|spider|paris|brooklyn|lifestyle|lightning|mountain/i.test(label)) return 3600 + (idx % 6) * 250;
  return 3000 + (idx % 5) * 200;
};

const main = () => {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error('Assets not found:', ASSETS_DIR);
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const files = fs
    .readdirSync(ASSETS_DIR)
    .filter((f) => f.startsWith('c__Users_Spine') && f.endsWith('.png'))
    .filter(isRoundNeckAsset)
    .sort();

  const seenLabels = new Set();
  const seenNames = new Set();
  const usedSlugs = new Set();
  const catalog = [];
  let idx = 0;

  for (const sourceFile of files) {
    const label = extractLabel(sourceFile);
    const dedupeKey = normalizeLabel(label);
    if (seenLabels.has(dedupeKey)) continue;
    seenLabels.add(dedupeKey);

    idx += 1;
    const shortImage = `rneck-${String(idx).padStart(3, '0')}.png`;
    fs.copyFileSync(path.join(ASSETS_DIR, sourceFile), path.join(OUT_DIR, shortImage));

    const spec = findSpec(label);
    const color = spec?.color || inferColor(label);
    const name = buildName(color, idx, label, spec).toUpperCase();
    if (seenNames.has(name)) continue;
    seenNames.add(name);

    let slug = slugify(spec?.slug || name);
    let resolvedSlug = slug;
    let sn = 2;
    while (usedSlugs.has(resolvedSlug)) {
      resolvedSlug = `${slug}-${sn}`;
      sn += 1;
    }
    usedSlugs.add(resolvedSlug);

    catalog.push({
      image: shortImage,
      sourceFile,
      name,
      slug: resolvedSlug,
      price: priceFor(idx, label, spec),
      brand: spec?.brand || inferBrand(label),
      color,
      subCategory: 'Round-neck T-shirts',
      featured: spec?.featured ?? idx % 5 === 0,
      description: spec?.description || buildDescription({ color }, label),
    });
  }

  fs.writeFileSync(OUT_JSON, JSON.stringify(catalog, null, 2));
  console.log(`Catalog: ${catalog.length} round-neck T-shirts`);
  console.log('Written:', OUT_JSON);
};

main();
