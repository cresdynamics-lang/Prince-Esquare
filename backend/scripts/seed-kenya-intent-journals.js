/**
 * Upsert four Kenya-intent Style Journal posts (blogs === journals).
 * Publishing priority: wedding → shirts → office → presidential.
 *
 * Usage (from backend/):
 *   node scripts/seed-kenya-intent-journals.js
 */
const db = require('../src/config/db');

const CATEGORY = 'Style Journal';
const AUTHOR = 'Prince Esquire Editorial';

const waCta = (topic) =>
  `<p><a href="https://wa.me/254724494089?text=${encodeURIComponent(
    `Hi Prince Esquire — I read your journal on ${topic} and need sizing / colour matching help.`
  )}" rel="noopener noreferrer" target="_blank"><strong>Chat with us on WhatsApp</strong></a> for sizing, colour matching, and Nairobi delivery.</p>`;

const posts = [
  {
    title: "Men's Wedding Guest Outfits in Kenya: What to Wear as a Guest, Groomsman, or Family",
    slug: 'mens-wedding-guest-outfits-kenya',
    meta_title: "Men's Wedding Guest Outfits Kenya | Guide",
    meta_description:
      "Men's wedding guest outfit Kenya guide for church, garden, coastal and ruracio — guest, groomsman and family looks with colour rules.",
    excerpt:
      'From church aisles to Karen gardens and coastal vows, this guide shows Kenyan men what to wear as a wedding guest, groomsman or family member — without guessing the dress code.',
    featured_image_url: '/models/blazers/burgundy-check.jpg',
    published_date: '2026-10-07T10:00:00+03:00',
    content: `
<p><strong>Men's wedding guest outfit Kenya</strong> choices start with the event type, the colour theme, and the time of day. A church wedding wants a darker suit and tie; a garden wedding allows lighter fabrics and softer colours; a coastal wedding rewards breathable linen or lightweight wool; a ruracio asks for polished cultural respect first, fashion second.</p>

<p>Prince Esquire — The Man's Shop in Nairobi — curates suits, blazers, shirts and shoes for weddings across Kenya, with WhatsApp sizing help and delivery nationwide. Explore <a href="/shop/suits">suits</a>, <a href="/shop/suits/blazers">blazers</a> and <a href="/shop/shirts/formal-shirts">formal shirts</a>, then read our guides on <a href="/blog/quality-mens-shirts-kenya">quality men's shirts Kenya</a>, <a href="/blog/mens-office-wear-kenya">men's office wear Kenya</a>, and <a href="/blog/mens-power-dressing-presidential-look">men's power dressing</a>.</p>

<img src="/models/blazers/burgundy-lifestyle.jpg" alt="burgundy-check-blazer-wedding-guest-nairobi" width="900" height="1200" loading="lazy" />

<h2>What should a man wear to a wedding in Kenya?</h2>
<p>Wear a clean, well-fitted suit or blazer set that respects the colour theme, never white or ivory, and matches the venue formality. Add a crisp shirt, a restrained tie for church or evening, polished leather shoes, and a matching belt. When unsure, ask the couple — then choose navy, charcoal, soft taupe or a quiet check.</p>

<h2>Church wedding guest outfit</h2>
<p>Church weddings lean formal. Choose a navy or charcoal two-piece, white or pale blue shirt, silk or grenadine tie in a theme-friendly colour, black oxfords, and a simple leather belt. Skip loud patterns. A slim lapel pin is fine; oversized jewellery is not.</p>
<ul>
<li>Best pieces: navy wool blazer or full suit, white poplin shirt, black oxfords</li>
<li>Avoid: trainers, open-collar beach shirts, bright white suits</li>
</ul>

<h2>Garden wedding guest outfit</h2>
<p>Garden and outdoor weddings in Karen, Kiambu or Naivasha allow lighter tones — soft grey, olive, tan check, or a textured blazer over tailored trousers. Breathable cotton or light wool helps under midday sun. A pocket square can replace a heavy tie for daytime; add a tie if the invitation says formal.</p>
<img src="/models/blazers/tan-check.jpg" alt="tan-checked-wool-blazer-garden-wedding-kenya" width="900" height="1200" loading="lazy" />

<h2>Coastal wedding guest outfit</h2>
<p>Mombasa, Diani and Watamu heat demand breathable cloth. Prioritise linen or open-weave cotton shirts, unlined or soft-structure blazers, light trousers, and loafers. Keep colours soft — sand, sky blue, sage — unless the couple set a darker evening theme.</p>

<h2>Ruracio dress code for men</h2>
<p>Ruracio and traditional ceremonies reward neat, respectful dressing. A well-pressed shirt, tailored trousers or a smart blazer set, and polished shoes show care for the families. Follow any colour request from the couple's side. When cultural attire is expected, wear it cleanly and completely — mixed half-looks read as careless.</p>

<h2>Rules readers search for</h2>
<ol>
<li><strong>Never wear white or ivory</strong> — those colours belong to the couple.</li>
<li><strong>Follow the colour theme</strong> — ask if the invite is unclear.</li>
<li><strong>Day versus evening</strong> — lighter fabrics and softer colours by day; darker suits and ties after dusk.</li>
<li><strong>When to wear a tie</strong> — church, formal evening, and most groomsmen duties; optional for casual garden daytime if the couple says so.</li>
</ol>

<h2>Groomsmen outfits Kenya</h2>
<p>Groomsmen should match each other more than they match guests. Agree on suit colour, shirt colour, tie or bow, and shoe finish before buying. At Prince Esquire, blazers and suits typically run from about KSh 7,000 upward, with shirts from about KSh 3,000–5,500 — useful when dressing a full party on one WhatsApp thread.</p>

<h2>One outfit, three budgets</h2>
<table>
<thead><tr><th>Level</th><th>Build</th><th>Approx. spend</th></tr></thead>
<tbody>
<tr><td>Budget</td><td>Navy blazer + white shirt + dark trousers + clean black shoes</td><td>From ~KSh 10,000–15,000 combined</td></tr>
<tr><td>Mid</td><td>Matched suit, theme-toned tie, polished oxfords, leather belt</td><td>From ~KSh 18,000–28,000</td></tr>
<tr><td>Premium</td><td>Textured wool suit or check blazer set, presidential shirt, leather oxfords</td><td>From ~KSh 30,000+</td></tr>
</tbody>
</table>

<h2>FAQ</h2>
<h3>Can I wear a black suit to a Kenyan wedding?</h3>
<p>Yes for evening and formal church weddings, if it fits the theme. For daytime garden and coastal events, navy or mid-grey usually photographs softer.</p>
<h3>Do groomsmen need identical shoes?</h3>
<p>Same colour and formality — all black oxfords or all brown loafers — matters more than the exact brand.</p>
<h3>What if the invitation says “smart traditional”?</h3>
<p>Ask the couple what that means for their families. When unclear, a sharp blazer and trousers with polished shoes is a respectful default.</p>
<h3>Should family of the couple dress differently from guests?</h3>
<p>Often yes — closer family may be asked to wear theme colours or coordinated fabrics. Confirm early.</p>
<h3>Where can I get help matching colours in Nairobi?</h3>
<p>Message Prince Esquire on WhatsApp with the theme colours and your size — we help match shirts, blazers and shoes from stock.</p>

${waCta('men’s wedding guest outfits Kenya')}
`,
  },
  {
    title: "How to Choose a Quality Men's Shirt in Kenya: 7 Things to Check Before You Buy",
    slug: 'quality-mens-shirts-kenya',
    meta_title: "Quality Men's Shirts Kenya | 7 Checks",
    meta_description:
      "How to choose quality men's shirts Kenya — fabric, stitching, collar, buttons, pattern match, fit and care. Best men's shirts Nairobi tips.",
    excerpt:
      'A quality shirt is not about the logo on the placket. It is fabric, stitching, collar structure, buttons, pattern matching, fit and how it survives Nairobi heat and laundry.',
    featured_image_url: '/models/shirts/lilac-contrast.jpg',
    published_date: '2026-10-06T09:00:00+03:00',
    content: `
<p><strong>Quality men's shirts Kenya</strong> shoppers should check seven things before paying: fabric and weave, stitching, collar and cuff construction, buttons, pattern matching at the seams, fit through shoulders, sleeve and collar, and care instructions. Breathable cotton and cotton-rich weaves handle Nairobi afternoons and coastal heat far better than shiny polyester.</p>

<p>Prince Esquire stocks formal, casual and presidential shirts in Nairobi with sizes typically from S to 3XL and prices commonly from about KSh 3,000 to KSh 5,500. Browse <a href="/shop/shirts">shirts</a> and <a href="/shop/shirts/formal-shirts">formal shirts</a>, then continue with <a href="/blog/mens-wedding-guest-outfits-kenya">wedding guest outfits</a>, <a href="/blog/mens-office-wear-kenya">office wear</a>, and <a href="/blog/mens-power-dressing-presidential-look">power dressing</a>.</p>

<img src="/models/shirts/light-blue-gingham.jpg" alt="light-blue-gingham-shirt-quality-check-nairobi" width="900" height="1200" loading="lazy" />

<h2>What makes a men's shirt high quality?</h2>
<p>A high-quality men's shirt uses a stable, breathable fabric; even, dense stitching; a collar and cuffs that hold shape; sewn (not glued) buttons; matched patterns at placket and pockets; and a fit that sits clean on the shoulders without pulling at the chest or gaping at the collar.</p>

<h2>1. Fabric and weave</h2>
<p>Learn the weave. Poplin feels smooth and crisp for office days. Twill has a soft diagonal rib and drapes well under a jacket. Oxford is textured and forgiving for smart casual. Pure or high-cotton blends breathe; cheap polyester shines under office lights and traps heat on Mombasa Road traffic.</p>

<h2>2. Stitching</h2>
<p>Turn the shirt inside out. Quality shirts show even seams, secure side vents, and clean yoke joins. Loose threads, skipped stitches or wavy side seams are early signs the shirt will twist after washes.</p>

<h2>3. Collar and cuff construction</h2>
<p>The collar should stand without collapsing and close with a finger of space when buttoned. Cuffs should take a watch comfortably and show a clean edge under a blazer sleeve. Fused collars that bubble after one wash are a common cheap-shirt failure.</p>

<img src="/models/shirts/navy-gold-paisley.jpg" alt="navy-gold-paisley-presidential-shirt-collar-detail" width="900" height="1200" loading="lazy" />

<h2>4. Buttons</h2>
<p>Quality buttons are thick, sewn with a shank or secure cross-stitch, and match in colour and size. Mother-of-pearl or dense resin beats brittle plastic that cracks in Nairobi dry seasons.</p>

<h2>5. Pattern matching at seams</h2>
<p>On checks and stripes, look at the placket, pocket and sleeve join. Matched patterns signal careful cutting — a hallmark of better men's shirts in Nairobi ateliers and curated shops.</p>

<h2>6. Fit: shoulders, sleeve, collar</h2>
<ol>
<li><strong>Shoulders</strong> — seam sits at the shoulder bone, not hanging off.</li>
<li><strong>Sleeve</strong> — ends near the wrist bone so a cuff shows under a jacket.</li>
<li><strong>Collar</strong> — buttons without choking or gaping; leave room for a tie knot if you wear one.</li>
</ol>

<h2>7. Care and Nairobi weather</h2>
<p>Choose shirts that tolerate gentle machine or careful hand wash when dry cleaning every week is unrealistic. For Nairobi heat and coastal trips, prioritise breathable cotton. Hang shirts after wear; moisture plus polyester is how odours stick.</p>

<h2>Shirt weaves at a glance</h2>
<table>
<thead><tr><th>Weave</th><th>Feel</th><th>Best for</th></tr></thead>
<tbody>
<tr><td>Poplin</td><td>Smooth, crisp</td><td>Office, interviews, formal weddings</td></tr>
<tr><td>Twill</td><td>Soft diagonal drape</td><td>Long office days, travel, under suits</td></tr>
<tr><td>Oxford</td><td>Textured, casual polish</td><td>Smart casual, Friday wear, loafers</td></tr>
<tr><td>Paisley / print presidential</td><td>Statement surface</td><td>Events, dinners, groom party accents</td></tr>
</tbody>
</table>

<h2>How we make — and select — our shirts at Prince Esquire</h2>
<p>Prince Esquire is a Nairobi menswear house (The Man's Shop) serving Kenya with curated formal and presidential shirts, contrast-collar styles, and everyday oxfords. We prioritise cotton-rich cloth, clean shoulder fits across S–3XL, and modelled photography so you see the shirt on a real silhouette. Formal shirts commonly price from about KSh 3,000 to KSh 5,500. We help with WhatsApp sizing before you buy — useful when ordering for a wedding party or a full office rotation.</p>

<h2>FAQ</h2>
<h3>Is cotton always better than polyester?</h3>
<p>For Kenyan heat, yes in most cases. A small stretch blend can help mobility, but shiny 100% polyester rarely looks or feels premium.</p>
<h3>How do I know a good shirt without trying it on?</h3>
<p>Ask for fabric composition, collar type, size chart, and clear photos of seams and cuffs. At Prince Esquire, WhatsApp us your chest and neck measurements.</p>
<h3>What shirt colours work hardest in Nairobi?</h3>
<p>White, light blue, soft lilac, and microchecks cover office, interviews and most weddings.</p>
<h3>Should the shirt tuck easily?</h3>
<p>Yes — a quality dress shirt is cut to stay tucked through a workday when the body length is right.</p>
<h3>Where should I start if I can only buy two shirts?</h3>
<p>One white poplin and one light blue twill or oxford. Add a presidential print later for events.</p>

${waCta('quality men’s shirts Kenya')}
`,
  },
  {
    title: "What to Wear to the Office in Kenya: Men's Work Outfits for Every Dress Code (Including Interviews)",
    slug: 'mens-office-wear-kenya',
    meta_title: "Men's Office Wear Kenya | Dress Codes",
    meta_description:
      "Men's office wear Kenya guide: corporate, business casual, smart casual and interview outfits for Nairobi — commute, heat and rain included.",
    excerpt:
      'Decode corporate, business casual, smart casual and creative-office dress codes in Kenya — then build a Monday-to-Friday rotation with a few strong shirts.',
    featured_image_url: '/models/shirts/grey-microcheck.jpg',
    published_date: '2026-10-05T09:00:00+03:00',
    content: `
<p><strong>Men's office wear Kenya</strong> is not one uniform. Banking floors still expect suits; tech and creative offices lean smart casual; client-facing sales teams often sit in between. The winning approach in Nairobi is a short rotation of quality shirts, one dark trouser, one navy blazer, and shoes that survive commute, heat and sudden rain.</p>

<p>Shop <a href="/shop/shirts/formal-shirts">formal shirts</a>, <a href="/shop/suits/blazers">blazers</a> and <a href="/shop/shoes/formal-shoes">formal shoes</a> at Prince Esquire, and read <a href="/blog/quality-mens-shirts-kenya">quality men's shirts Kenya</a>, <a href="/blog/mens-wedding-guest-outfits-kenya">wedding guest outfits</a>, and <a href="/blog/mens-power-dressing-presidential-look">the presidential look</a>.</p>

<img src="/models/shirts/mauve-contrast.jpg" alt="mauve-contrast-collar-shirt-office-nairobi" width="900" height="1200" loading="lazy" />

<h2>Dress code decoder</h2>
<h3>Corporate</h3>
<p>Sample outfit: charcoal or navy suit, white or pale blue shirt, restrained tie, black oxfords, leather belt. Keep patterns quiet.</p>
<h3>Business casual</h3>
<p>Sample outfit: navy blazer, light blue shirt (tie optional), grey or khaki tailored trousers, leather loafers or derbies.</p>
<h3>Smart casual</h3>
<p>Sample outfit: oxford or microcheck shirt, chinos, clean loafers, optional unstructured blazer. No athletic shorts, no wrinkled tees.</p>
<h3>Creative office</h3>
<p>Sample outfit: textured shirt or knit polo, dark tailored trousers, quality sneakers or loafers, soft blazer if clients visit.</p>

<h2>Monday to Friday with a few shirts</h2>
<table>
<thead><tr><th>Day</th><th>Shirt</th><th>Bottom + layer</th><th>Shoes</th></tr></thead>
<tbody>
<tr><td>Monday</td><td>White poplin</td><td>Navy suit or blazer + grey trouser</td><td>Black oxfords</td></tr>
<tr><td>Tuesday</td><td>Light blue twill</td><td>Charcoal trousers, blazer on meetings</td><td>Black or dark brown derbies</td></tr>
<tr><td>Wednesday</td><td>Microcheck</td><td>Khaki or grey trouser, optional blazer</td><td>Loafers</td></tr>
<tr><td>Thursday</td><td>White or lilac contrast collar</td><td>Navy blazer, dark denim or chinos (if allowed)</td><td>Loafers</td></tr>
<tr><td>Friday</td><td>Oxford / soft print</td><td>Chinos, skip the tie</td><td>Loafers</td></tr>
</tbody>
</table>
<p>Five workdays do not need fifteen shirts. Three to five quality shirts, rotated and properly hung, outperform a cupboard of polyester.</p>

<h2>Practical Nairobi angle: commute, heat, rain, long days</h2>
<ul>
<li><strong>Commute</strong> — choose fabrics that recover; keep a spare shirt at the office if you matatu or ride through traffic sweat.</li>
<li><strong>Heat</strong> — breathable cotton shirts; unlined blazers; skip heavy synthetic linings.</li>
<li><strong>Rain</strong> — dark trousers hide splash better; leather shoes with grip; a compact umbrella beats a ruined cuff.</li>
<li><strong>Long days</strong> — comfort stretch in trousers and a shirt with a stable collar so you still look sharp at 6 p.m. client calls.</li>
</ul>

<img src="/models/blazers/navy-solid.jpg" alt="navy-solid-blazer-business-casual-nairobi" width="900" height="1200" loading="lazy" />

<h2>What should a man wear to a job interview in Kenya?</h2>
<p>Wear a clean navy or charcoal blazer or suit, a crisp white or light blue shirt, dark tailored trousers, a simple leather belt, polished black or dark brown shoes, and neat grooming. Dress one step sharper than the company's everyday dress code. Arrive pressed, not scented heavily, with a quiet watch and matching socks.</p>

<h3>By industry</h3>
<ul>
<li><strong>Banking and law</strong> — full suit, tie, black oxfords.</li>
<li><strong>Tech</strong> — blazer + quality shirt + dark chinos or trousers; tie optional unless the firm is formal.</li>
<li><strong>NGO / development</strong> — neat blazer or smart shirt and trousers; avoid flashy logos.</li>
<li><strong>Sales / client-facing</strong> — blazer, spotless shirt, reliable shoes; you may walk and present all day.</li>
</ul>
<p>Shoes and belt should match in formality. Grooming: fresh haircut, trimmed nails, light or no cologne.</p>

<h2>FAQ</h2>
<h3>Is a tie required for every Nairobi office?</h3>
<p>No. Corporate and interview settings often yes; many Westlands tech and creative offices skip ties daily.</p>
<h3>Can I wear loafers to the office?</h3>
<p>Yes for business casual and smart casual. Prefer oxfords for strict corporate and court-adjacent roles.</p>
<h3>What colours read as professional in Kenya?</h3>
<p>Navy, charcoal, white, light blue, soft grey. Save loud prints for Friday or creative teams.</p>
<h3>How many shirts do I need to start a new job?</h3>
<p>Start with three: white, light blue, and one subtle pattern. Add from there.</p>
<h3>Where do I buy men's office wear in Nairobi with advice?</h3>
<p>Prince Esquire at Yala Towers — or WhatsApp us your dress code and size for a short shortlist.</p>

${waCta('men’s office wear Kenya')}
`,
  },
  {
    title: 'The Presidential Look: How to Dress with Authority (Men’s Power Dressing Guide)',
    slug: 'mens-power-dressing-presidential-look',
    meta_title: "Men's Power Dressing | Presidential Look",
    meta_description:
      "Men's power dressing guide: the presidential look defined — dark suit, crisp shirt, restrained tie, oxfords and minimal accessories. Build it on a budget.",
    excerpt:
      'The presidential look is a clear, calm uniform of authority: dark tailored suit, crisp light shirt, restrained tie, polished oxfords, and almost no visual noise.',
    featured_image_url: '/models/blazers/navy-solid.jpg',
    published_date: '2026-10-04T09:00:00+03:00',
    content: `
<p><strong>The presidential look</strong> is a men's power-dressing formula built on restraint: a dark tailored suit, a crisp white or light blue shirt, a quiet tie, polished oxford shoes, and minimal accessories. It is not costume and it is not celebrity cosplay — it is boardroom clarity that photographs well and reads as decisive in Kenyan business culture.</p>

<p>Prince Esquire curates the building blocks in Nairobi — <a href="/shop/suits">suits</a>, <a href="/shop/suits/blazers">blazers</a>, <a href="/shop/shirts/formal-shirts">formal shirts</a>, and <a href="/shop/shoes/formal-shoes">formal shoes</a>. Pair this guide with <a href="/blog/mens-office-wear-kenya">office wear</a>, <a href="/blog/quality-mens-shirts-kenya">quality shirts</a>, and <a href="/blog/mens-wedding-guest-outfits-kenya">wedding guest outfits</a>.</p>

<img src="/models/blazers/navy-windowpane.jpg" alt="navy-windowpane-blazer-executive-look-men" width="900" height="1200" loading="lazy" />

<h2>What is the presidential look?</h2>
<p>The presidential look is a formal menswear style that signals authority through fit, dark colour, and simplicity. Shoulders clean, trousers breaking lightly on the shoe, shirt collar sharp, tie knot centred, leather polished. When every element is quiet, the man — not the outfit — leads the room.</p>

<h2>1. Tailored dark suit</h2>
<p>Navy and charcoal do the heavy lifting. Fit the shoulders first. A two-button single-breasted jacket with a slight waist suppression looks modern without shouting. Soft windowpane is acceptable if the contrast stays low.</p>

<h2>2. Crisp white or light blue shirt</h2>
<p>These two colours frame the face under any lighting. Prefer cotton poplin or twill with a collar that stands through a long meeting. Explore presidential and formal shirts at Prince Esquire from roughly KSh 3,000–5,500.</p>
<img src="/models/shirts/white-paisley.jpg" alt="white-presidential-shirt-power-dressing-kenya" width="900" height="1200" loading="lazy" />

<h2>3. Restrained tie</h2>
<p>Solid grenadine, fine repp stripes, or a subtle texture. Avoid novelty prints and oversized logos. The tie should finish at the belt line.</p>

<h2>4. Polished oxfords</h2>
<p>Black oxfords remain the default for maximum authority. Dark brown works with navy in slightly softer settings. Match belt to shoe.</p>

<h2>5. Minimal accessories</h2>
<p>One simple watch, clean socks, optional slim lapel detail. Remove visual clutter — competing metals and loud pocket squares weaken the presidential look.</p>

<h2>How to dress like a CEO on a weekday</h2>
<p>Repeat the uniform with tiny variations: Monday navy suit + white shirt; Wednesday charcoal + light blue; Friday navy blazer + microcheck shirt if your office allows. Consistency builds recognition.</p>

<h2>Build it on a budget: five pieces to buy first</h2>
<ol>
<li>Navy blazer or suit jacket (from about KSh 7,000 at Prince Esquire for selected blazers)</li>
<li>Charcoal or dark grey trousers</li>
<li>White formal shirt</li>
<li>Light blue formal shirt</li>
<li>Black leather oxfords + matching belt</li>
</ol>
<p>Add a restrained tie and a second trouser when you can. This five-piece core creates more boardroom outfits than a random haul of trend pieces.</p>

<img src="/models/shoes/black-patent-closeup.jpg" alt="black-leather-oxford-shoes-boardroom-outfit-men" width="900" height="1200" loading="lazy" />

<h2>Executive look mistakes to avoid</h2>
<ul>
<li>Jacket sleeves covering the shirt cuff completely</li>
<li>Shiny polyester suits that glare under fluorescent lights</li>
<li>Loud ties that fight the shirt pattern</li>
<li>Scuffed shoes — they undo an expensive jacket in one glance</li>
</ul>

<p>This guide describes a style language only. It does not name or depict real political figures, and it is not an endorsement of any office or party.</p>

<h2>FAQ</h2>
<h3>Is the presidential look only for older men?</h3>
<p>No. Younger professionals use the same formula with slimmer fits and slightly softer fabrics.</p>
<h3>Can I wear the presidential look without a tie?</h3>
<p>For strict boardrooms, keep the tie. For modern executive casual, a perfect collar and blazer can stand alone.</p>
<h3>Navy or black suit for authority?</h3>
<p>Navy reads more versatile and approachable; black is starker for evening formality. Most Kenyan weekday power dressing prefers navy or charcoal.</p>
<h3>How do I keep the look in Nairobi heat?</h3>
<p>Choose breathable wool-rich or mid-weight cloth, cotton shirts, and an unlined or lightly lined jacket when possible.</p>
<h3>Where can I assemble the presidential look in Kenya?</h3>
<p>Prince Esquire in Nairobi — WhatsApp us for a navy blazer, white shirt, and oxford shortlist in your size.</p>

${waCta('men’s power dressing / presidential look')}
`,
  },
];

async function upsertPost(post) {
  const result = await db.query(
    `INSERT INTO blog_posts (
      title, slug, excerpt, content, category, author_name, featured_image_url,
      is_published, views, published_date, meta_title, meta_description, updated_at
    ) VALUES (
      $1, $2::varchar, $3, $4, $5, $6, $7,
      true, 0, $8::timestamptz, $9, $10, NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      excerpt = EXCLUDED.excerpt,
      content = EXCLUDED.content,
      category = EXCLUDED.category,
      author_name = EXCLUDED.author_name,
      featured_image_url = EXCLUDED.featured_image_url,
      is_published = true,
      published_date = EXCLUDED.published_date,
      meta_title = EXCLUDED.meta_title,
      meta_description = EXCLUDED.meta_description,
      updated_at = NOW()
    RETURNING slug, is_published, published_date`,
    [
      post.title,
      post.slug,
      post.excerpt,
      post.content.trim(),
      CATEGORY,
      AUTHOR,
      post.featured_image_url,
      post.published_date,
      post.meta_title,
      post.meta_description,
    ]
  );
  return result.rows[0];
}

async function main() {
  console.log('Upserting Kenya-intent Style Journal posts…');
  for (const post of posts) {
    const row = await upsertPost(post);
    console.log('✓', row.slug, '| published=', row.is_published, '|', row.published_date);
  }
  const count = await db.query(
    `SELECT COUNT(*)::int AS n FROM blog_posts WHERE slug = ANY($1)`,
    [posts.map((p) => p.slug)]
  );
  console.log('Live posts ready:', count.rows[0].n);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
