/**
 * Upsert six Kenya-intent Style Journal posts — gift, podcast, conference,
 * Yala Towers power dressing, blazers / jackets / khaki / suede + full catalog.
 *
 * Usage (from backend/):
 *   node scripts/seed-category-intent-journals.js
 */
const db = require('../src/config/db');

const CATEGORY = 'Style Journal';
const AUTHOR = 'Prince Esquire Editorial';

const waCta = (topic) =>
  `<p><a href="https://wa.me/254724494089?text=${encodeURIComponent(
    `Hi Prince Esquire — I read your journal on ${topic}. I want help choosing at Yala Towers / delivery.`
  )}" rel="noopener noreferrer" target="_blank"><strong>Chat with us on WhatsApp</strong></a> — visit us at <strong>Yala Towers, Nairobi</strong>, or we deliver across Kenya.</p>`;

const yalaBlock = `
<p><strong>Where to go:</strong> Prince Esquire — The Man&apos;s Shop — at <strong>Yala Towers, Nairobi</strong>. This is where men come when clothing must introduce them before they speak — boardrooms, conferences, podcasts, weddings, and gifts that say you chose carefully. Browse online, then walk into Yala Towers, or WhatsApp for sizing and Nairobi delivery.</p>
`;

const posts = [
  {
    title: "Best Blazers for a Men's Conference in Kenya: Clothes That Introduce You Before You Speak",
    slug: 'how-to-choose-mens-blazer-nairobi',
    meta_title: "Best Blazers Men's Conference Kenya | Yala Towers",
    meta_description:
      "Best blazers for a men's conference in Kenya — clothes that introduce you. Navy, charcoal and check blazers at Prince Esquire, Yala Towers, Nairobi.",
    excerpt:
      'When men gather — conferences, forums, leadership rooms — clothing speaks first. This guide is for the man who wants a blazer that introduces him before he says a word, and for anyone gifting him that presence from Yala Towers.',
    featured_image_url: '/models/blazers/navy-solid.jpg',
    published_date: '2026-10-19T09:00:00+03:00',
    content: `
<p>Searchers type <strong>best blazer for conference Kenya</strong>, <strong>men's conference outfit Nairobi</strong>, and <strong>blazer that looks expensive</strong> for one reason: they are walking into a room of men. Governors&apos; forums, county leadership summits, church men&apos;s conferences, founders&apos; meetups, political briefings — the blazer is not decoration. It is the handshake before the handshake.</p>

${yalaBlock}

<p>Shop <a href="/shop/suits/blazers">blazers</a>, <a href="/shop/suits">suits</a>, <a href="/shop/shirts/formal-shirts">formal shirts</a>, <a href="/shop/trousers/khaki">khaki trousers</a>, <a href="/shop/shoes/formal-shoes">formal shoes</a> and <a href="/shop/gift-sets">gift sets</a> at Prince Esquire. Related journals: <a href="/blog/navy-vs-grey-vs-check-blazer-kenya">podcast blazers</a>, <a href="/blog/blazer-vs-jacket-kenya">power dressing at Yala Towers</a>, <a href="/blog/buy-khaki-trousers-nairobi-mens-guide">gifts for your husband</a>.</p>

<img src="/models/blazers/navy-solid.jpg" alt="navy-blazer-mens-conference-kenya-yala-towers" width="900" height="1200" loading="lazy" />

<h2>Who is searching — and what they want clothing to do</h2>
<ul>
<li><strong>The man attending</strong> — “I want to feel like a man in that room. I want clothes that introduce me.”</li>
<li><strong>The wife or partner gifting</strong> — “best clothing for my husband”, “blazer gift Kenya”, “where do serious men shop in Nairobi?”</li>
<li><strong>The organiser / protocol team</strong> — dressing speakers and guests who will sit on stage.</li>
</ul>
<p>Prince Esquire at Yala Towers is built for that buyer: curated menswear for presence — the same lane as leaders, executives, and public men who cannot afford to look accidental.</p>

<h2>The conference blazer formula</h2>
<ol>
<li><strong>Navy solid</strong> — safest authority across Kenyan conference halls and hotel ballrooms.</li>
<li><strong>Charcoal or mid-grey</strong> — sharper evening and panel sessions under warm lights.</li>
<li><strong>Quiet windowpane or micro-check</strong> — when you speak from the front and need photo distinction without noise.</li>
</ol>
<p>Structure over shine. Wool-rich cloth over plastic polyester. Shoulders that land on your shoulder bone. Cuff that shows 0.5–1 cm of shirt. That is how clothing introduces you.</p>

<img src="/models/blazers/navy-windowpane.jpg" alt="windowpane-blazer-stage-conference-kenya" width="900" height="1200" loading="lazy" />

<h2>Full conference uniform (not only the blazer)</h2>
<ul>
<li><a href="/shop/shirts/formal-shirts">White or ice-blue formal shirt</a> — presidential collar energy</li>
<li><a href="/shop/trousers">Dark tailored trousers</a> or matched suit trousers</li>
<li><a href="/shop/shoes/formal-shoes">Black or deep brown oxfords</a> — polished, never tired</li>
<li><a href="/shop/accessories/belts">Matching leather belt</a> and a restrained tie if the programme is formal</li>
<li>Optional: <a href="/shop/suits/waistcoats">waistcoat</a> for evening banquets</li>
</ul>

<h2>Gift angle: buy him the conference blazer</h2>
<p>If you are shopping for your husband, fiancé or father, do not guess a random shirt. Gift presence: a navy blazer from Yala Towers, sized on WhatsApp with his chest and height, delivered in Nairobi or collected in person. Pair with a presidential shirt and he walks into the next men&apos;s conference already introduced.</p>

<h2>FAQ</h2>
<h3>What colour blazer for a men&apos;s conference in Kenya?</h3>
<p>Navy first. Charcoal second. Soft check only if the room is creative or you are on stage and need gentle contrast.</p>
<h3>Can I wear a blazer without a tie at a conference?</h3>
<p>Often yes for daytime forums. Keep the shirt immaculate. Evening programmes and church men&apos;s conferences may still expect a tie.</p>
<h3>Where do men buy conference blazers in Nairobi?</h3>
<p>Prince Esquire at <strong>Yala Towers</strong> — or order via WhatsApp with delivery across Kenya.</p>
<h3>Is this only for politicians and governors?</h3>
<p>No — but that is the standard we cut to. Pastors, founders, lawyers, MCs and rising professionals use the same language of cloth.</p>

${waCta("best blazers for a men's conference Kenya")}
`,
  },

  {
    title: 'Best Blazers for Podcast Hosts & On-Camera Men in Kenya (What Reads on Screen)',
    slug: 'navy-vs-grey-vs-check-blazer-kenya',
    meta_title: 'Best Blazers for Podcast Kenya | On-Camera',
    meta_description:
      'Best blazers for podcast hosts and on-camera men in Kenya — navy, grey and check colours that read on screen. Shop Prince Esquire, Yala Towers.',
    excerpt:
      'Podcast and camera searches are colour searches in disguise. This guide tells hosts, guests and gifting partners which blazer colours introduce authority on microphone and on video.',
    featured_image_url: '/models/blazers/grey-windowpane.jpg',
    published_date: '2026-10-19T09:30:00+03:00',
    content: `
<p>People searching <strong>best blazer for podcast</strong>, <strong>what to wear on a podcast Kenya</strong>, and <strong>blazer for YouTube men</strong> are solving a camera problem: shiny cloth glares, loud checks vibrate on video, and a tired shirt collar reads as unserious before the first sentence.</p>

${yalaBlock}

<p>Choose colours at <a href="/shop/suits/blazers">blazers</a>, shirts at <a href="/shop/shirts/formal-shirts">formal shirts</a>, and finish with <a href="/shop/shoes">shoes</a>. Continue with <a href="/blog/how-to-choose-mens-blazer-nairobi">conference blazers</a> and <a href="/blog/blazer-vs-jacket-kenya">Yala Towers power dressing</a>.</p>

<img src="/models/blazers/grey-textured.jpg" alt="grey-blazer-podcast-on-camera-kenya" width="900" height="1200" loading="lazy" />

<h2>Who this is for</h2>
<ul>
<li>Podcast hosts and repeat guests who appear weekly on camera</li>
<li>Pastors and leaders filming devotionals or interviews</li>
<li>Founders recording founder stories and press hits</li>
<li>Wives and managers searching “best blazer gift for my husband who does media”</li>
</ul>

<h2>Colours that win on microphone and camera</h2>
<table>
<thead><tr><th>Colour</th><th>On-camera effect</th><th>Best use</th></tr></thead>
<tbody>
<tr><td>Navy solid</td><td>Stable, trustworthy, never noisy</td><td>Default podcast uniform</td></tr>
<tr><td>Mid-grey / charcoal textured</td><td>Modern authority under softbox lights</td><td>Studio interviews, panels</td></tr>
<tr><td>Soft windowpane</td><td>Depth without moiré if the check is fine</td><td>Brand-building episodes, cover shoots</td></tr>
<tr><td>Avoid: high-shine black polyester</td><td>Glare and “cheap formal”</td><td>Skip for video</td></tr>
</tbody>
</table>

<img src="/models/blazers/navy-solid.jpg" alt="navy-blazer-podcast-host-kenya" width="900" height="1200" loading="lazy" />

<h2>The podcast kit (full catalog, not only the jacket)</h2>
<ol>
<li><a href="/shop/suits/blazers">Navy or grey blazer</a></li>
<li><a href="/shop/shirts/formal-shirts">Matte formal shirt</a> — white, soft blue, or muted stripe</li>
<li>Optional open collar for conversational shows; tie for political / news formats</li>
<li><a href="/shop/accessories">Quiet pocket square</a> if the frame is chest-up</li>
<li>Grooming + posture do the rest — cloth cannot fix a crumpled collar</li>
</ol>

<h2>Gift him the on-camera blazer</h2>
<p>If your husband hosts, guest-speaks, or records content, the highest-leverage gift is not another gadget. It is a navy blazer from <strong>Yala Towers</strong> that makes every thumbnail look intentional. Message Prince Esquire with a photo of his current jacket fit — we size from that.</p>

<h2>FAQ</h2>
<h3>Should podcast hosts wear a full suit?</h3>
<p>Usually a blazer is enough on camera. Full suits for formal political or legal shows.</p>
<h3>Can I wear a patterned blazer on video?</h3>
<p>Fine micro-checks and soft textures yes. Loud plaids and tight herringbone can shimmer on compression — test on your phone camera first.</p>
<h3>Where to buy a podcast blazer in Nairobi?</h3>
<p>Prince Esquire, Yala Towers — or WhatsApp order with delivery.</p>

${waCta('best blazers for podcast hosts Kenya')}
`,
  },

  {
    title: 'Best Clothing Gifts for Your Husband in Kenya — From Yala Towers, Nairobi',
    slug: 'buy-khaki-trousers-nairobi-mens-guide',
    meta_title: 'Best Clothing Gifts for Husband Kenya | Yala Towers',
    meta_description:
      'Best clothing gifts for your husband in Kenya — blazers, khaki trousers, shirts, shoes and jackets from Prince Esquire at Yala Towers, Nairobi.',
    excerpt:
      'When someone searches “best clothes for my husband Kenya” or “what to gift a man who has everything”, they want a destination with taste. Yala Towers is that destination — and khaki, blazers and shirts are the safe, powerful buys.',
    featured_image_url: 'https://res.cloudinary.com/dj8uacwqp/image/upload/v1781593603/PRINCE-eSQUIIRE/jf7ilisojhxxi0a8lkhm.jpg',
    published_date: '2026-10-19T11:00:00+03:00',
    content: `
<p>Gift searches sound like this: <strong>best clothing for my husband</strong>, <strong>gift blazer Kenya</strong>, <strong>what to buy a man who dresses well</strong>, <strong>anniversary gift menswear Nairobi</strong>. The shopper is often a wife, fiancée, sister or executive assistant who refuses another random perfume. She wants clothes that make him feel chosen — and respected in rooms of men.</p>

${yalaBlock}

<p>Start with <a href="/shop/gift-sets">gift sets &amp; boxes</a>, <a href="/shop/suits/blazers">blazers</a>, <a href="/shop/trousers/khaki">khaki trousers</a>, <a href="/shop/shirts">shirts</a>, <a href="/shop/jackets">jackets</a>, <a href="/shop/shoes">shoes</a> and <a href="/shop/linen-edit">the linen edit</a>.</p>

<img src="https://res.cloudinary.com/dj8uacwqp/image/upload/v1781593603/PRINCE-eSQUIIRE/jf7ilisojhxxi0a8lkhm.jpg" alt="khaki-trousers-gift-husband-kenya-yala-towers" width="900" height="1200" loading="lazy" />

<h2>Gift ladder: what to buy him (ranked by impact)</h2>
<table>
<thead><tr><th>Priority</th><th>Gift</th><th>Why it works</th></tr></thead>
<tbody>
<tr><td>1</td><td><a href="/shop/suits/blazers">Navy blazer</a></td><td>Introduces him at conferences, dinners, church and podcasts</td></tr>
<tr><td>2</td><td><a href="/shop/shirts/formal-shirts">Presidential / formal shirts</a> (2–3)</td><td>Weekly wear; he feels new every Monday</td></tr>
<tr><td>3</td><td><a href="/shop/trousers/khaki">Khaki or tailored trousers</a></td><td>Smart casual that still looks intentional</td></tr>
<tr><td>4</td><td><a href="/shop/shoes/formal-shoes">Leather oxfords or loafers</a></td><td>Finishes every outfit you already bought</td></tr>
<tr><td>5</td><td><a href="/shop/jackets">Quilted or bomber jacket</a></td><td>Nairobi mornings + weekend presence</td></tr>
<tr><td>6</td><td><a href="/shop/gift-sets">Curated gift set</a></td><td>When you want one box that decides for you</td></tr>
</tbody>
</table>

<img src="/models/blazers/navy-solid.jpg" alt="navy-blazer-gift-for-husband-nairobi" width="900" height="1200" loading="lazy" />

<h2>Khaki trousers as a husband gift (underrated)</h2>
<p>Men live in trousers. A well-tapered beige or olive khaki from Prince Esquire pairs with the navy blazer you gifted last year and the white sneakers he already owns. Check waist and preferred taper on WhatsApp — or bring him to <strong>Yala Towers</strong> for a fitting afternoon that feels like a date, not a chore.</p>

<h2>How to gift without guessing size</h2>
<ol>
<li>Photograph the size label in a jacket or trouser he already loves.</li>
<li>WhatsApp Prince Esquire — we map to our blazers, shirts and khakis.</li>
<li>Choose navy / beige / white as safe colours; save bold checks for when you know his taste.</li>
<li>Collect at Yala Towers or request Nairobi delivery with discreet packaging.</li>
</ol>

<h2>FAQ</h2>
<h3>What is the best clothing gift for a husband in Kenya?</h3>
<p>A navy blazer or a set of quality formal shirts — highest wear frequency and highest status return.</p>
<h3>Can I gift khaki trousers?</h3>
<p>Yes — especially with a belt and a note for a matching blazer next. Practical luxury.</p>
<h3>Where should I take him shopping in Nairobi?</h3>
<p><strong>Yala Towers</strong> — Prince Esquire, The Man&apos;s Shop. Clothes for men who want clothing to introduce them.</p>

${waCta('best clothing gifts for husband Kenya')}
`,
  },

  {
    title: "Where Men Shop Power Dressing in Nairobi: Prince Esquire at Yala Towers",
    slug: 'blazer-vs-jacket-kenya',
    meta_title: 'Yala Towers Menswear Nairobi | Prince Esquire',
    meta_description:
      'Where men shop power dressing in Nairobi — Prince Esquire at Yala Towers. Blazers, jackets, suits and shoes for men who want clothes that introduce them.',
    excerpt:
      'If you want to feel like a man through clothing — if you want clothes that introduce you in rooms of governors, founders and fathers — this is where you go: Yala Towers. Blazer or jacket is only the first decision.',
    featured_image_url: '/models/blazers/burgundy-solid.jpg',
    published_date: '2026-10-19T10:30:00+03:00',
    content: `
<p>Some searches are location searches wearing style words: <strong>where to buy suits Nairobi</strong>, <strong>menswear Yala Towers</strong>, <strong>blazer vs jacket</strong>, <strong>clothes that make you look powerful Kenya</strong>. The real question underneath is: <em>where do serious men shop?</em></p>

<p><strong>Answer:</strong> Prince Esquire — The Man&apos;s Shop — at <strong>Yala Towers, Nairobi</strong>. Come for blazers and jackets; leave with a language of dress used by professionals, public men, and husbands whose partners insist on presence. Online catalog, WhatsApp sizing, Nairobi delivery — and a physical floor where you can feel the cloth.</p>

<img src="/models/blazers/burgundy-solid.jpg" alt="prince-esquire-yala-towers-power-dressing-nairobi" width="900" height="1200" loading="lazy" />

<h2>Blazer vs jacket — decided by the room you are entering</h2>
<table>
<thead><tr><th>Room</th><th>Wear</th><th>Shop</th></tr></thead>
<tbody>
<tr><td>Men&apos;s conference, boardroom, formal church</td><td>Blazer or suit</td><td><a href="/shop/suits/blazers">Blazers</a> · <a href="/shop/suits">Suits</a></td></tr>
<tr><td>Podcast / studio / creative office</td><td>Blazer (often open collar)</td><td><a href="/shop/suits/blazers">Blazers</a></td></tr>
<tr><td>Cold Nairobi morning, weekend, travel</td><td>Quilted / bomber jacket</td><td><a href="/shop/jackets">Jackets</a></td></tr>
<tr><td>Garden wedding daytime</td><td>Textured blazer</td><td><a href="/shop/suits/blazers">Blazers</a></td></tr>
</tbody>
</table>

<img src="https://res.cloudinary.com/dj8uacwqp/image/upload/v1781569440/PRINCE-eSQUIIRE/q6dqo83bgfl7ifdadngw.jpg" alt="mens-jacket-yala-towers-nairobi" width="900" height="1200" loading="lazy" />

<h2>What “clothes that introduce you” includes at Prince Esquire</h2>
<ul>
<li><a href="/shop/suits">Suits</a> &amp; <a href="/shop/suits/blazers">blazers</a> — the introduction</li>
<li><a href="/shop/shirts/formal-shirts">Formal shirts</a> &amp; <a href="/shop/shirts/polo-t-shirts">polos</a> — the voice under the jacket</li>
<li><a href="/shop/trousers/khaki">Khaki</a>, <a href="/shop/trousers/chino">chinos</a>, tailored trousers — the stance</li>
<li><a href="/shop/jackets">Jackets</a> — weather and weekend authority</li>
<li><a href="/shop/shoes/formal-shoes">Formal shoes</a>, <a href="/shop/shoes/loafers">loafers</a> — the finish</li>
<li><a href="/shop/accessories">Belts, ties, caps</a> — the details protocol notices</li>
<li><a href="/shop/gift-sets">Gift sets</a> &amp; <a href="/shop/linen-edit">linen edit</a> — seasons and celebrations</li>
</ul>

<h2>For wives and gift shoppers</h2>
<p>Bring him to Yala Towers. Or WhatsApp us: “I want my husband to look like the man in the room.” We will shortlist a navy blazer, two shirts, and shoes that match — the same standard we hold for conference and camera dressing.</p>

<h2>FAQ</h2>
<h3>Is Prince Esquire only online?</h3>
<p>No. Visit <strong>Yala Towers, Nairobi</strong>, shop the site, or order on WhatsApp with delivery across Kenya.</p>
<h3>Blazer or jacket for a political / leadership event?</h3>
<p>Blazer or full suit. Jackets are for commute and casual layers.</p>
<h3>Can clothing really “introduce” you?</h3>
<p>In Kenyan public and professional rooms, yes — fit, cloth and polish are read in under three seconds. That is why men come to Yala Towers.</p>

${waCta('Prince Esquire Yala Towers power dressing')}
`,
  },

  {
    title: "Best Men's Jackets in Nairobi for Presence — And What to Pair from Yala Towers",
    slug: 'best-mens-jackets-nairobi-weather',
    meta_title: "Best Men's Jackets Nairobi | Yala Towers",
    meta_description:
      "Best men's jackets in Nairobi for cool mornings and weekend presence — bombers, quilted layers at Prince Esquire, Yala Towers, plus what to pair.",
    excerpt:
      'Jacket buyers want warmth without looking soft. This guide covers bombers and quilted jackets for Nairobi weather — and how to pair them with blazers, khaki and shoes from Yala Towers when the room gets serious.',
    featured_image_url: 'https://res.cloudinary.com/dj8uacwqp/image/upload/v1781569440/PRINCE-eSQUIIRE/q6dqo83bgfl7ifdadngw.jpg',
    published_date: '2026-10-19T10:00:00+03:00',
    content: `
<p>Searches like <strong>best men's jacket Nairobi</strong>, <strong>bomber jacket Kenya</strong>, and <strong>jacket gift for husband</strong> sit next to blazer searches — same man, different hour of the day. Morning mist on the Expressway asks for a jacket. The afternoon conference asks for a blazer. Prince Esquire at <strong>Yala Towers</strong> stocks both so his wardrobe can change rooms without changing identity.</p>

${yalaBlock}

<p>Shop <a href="/shop/jackets">jackets</a>, then step up to <a href="/shop/suits/blazers">blazers</a>, <a href="/shop/trousers/khaki">khakis</a>, <a href="/shop/shirts">shirts</a> and <a href="/shop/shoes">shoes</a>.</p>

<img src="https://res.cloudinary.com/dj8uacwqp/image/upload/v1781569440/PRINCE-eSQUIIRE/q6dqo83bgfl7ifdadngw.jpg" alt="navy-quilted-jacket-nairobi-yala-towers" width="900" height="1200" loading="lazy" />

<h2>Jackets that keep masculinity sharp in the cold</h2>
<ul>
<li><strong>Hybrid quilted / puffer-knit</strong> — modern, slim, office-adjacent</li>
<li><strong>Bombers</strong> — weekend and travel with clean trainers or Chelsea boots</li>
<li><strong>Suede racers</strong> — evening texture; pair carefully with rain plans</li>
</ul>

<img src="https://res.cloudinary.com/dj8uacwqp/image/upload/v1781569443/PRINCE-eSQUIIRE/xitvez8xmaaxgdhxvhru.jpg" alt="olive-suede-racer-jacket-kenya" width="900" height="1200" loading="lazy" />

<h2>Pairing map: jacket → the rest of the store</h2>
<ol>
<li>Navy quilted jacket + white tee + <a href="/shop/trousers/khaki">khaki</a> + sneakers — Saturday</li>
<li>Black bomber + turtleneck + dark trousers + <a href="/shop/shoes/formal-shoes">Chelsea boots</a> — night</li>
<li>Olive hybrid + oxford shirt + chinos — creative Friday</li>
<li>When the invite says conference or podcast — switch to a <a href="/shop/suits/blazers">navy blazer</a> from the same house</li>
</ol>

<h2>Gift idea</h2>
<p>Gift the jacket for weather; add a formal shirt and a note: “Next stop, Yala Towers for your conference blazer.” That is how partners build a man&apos;s wardrobe with intention.</p>

<h2>FAQ</h2>
<h3>Can a jacket replace a blazer at a men&apos;s conference?</h3>
<p>No. Warmth layers are not introduction layers. Wear the blazer in the hall; keep the jacket for the parking lot.</p>
<h3>Best jacket colour first?</h3>
<p>Navy or black — then olive.</p>
<h3>Where to try jackets in Nairobi?</h3>
<p>Prince Esquire, Yala Towers.</p>

${waCta("best men's jackets Nairobi Yala Towers")}
`,
  },

  {
    title: 'Suede Shoes, Complete Looks & Gifts That Finish Him — From Yala Towers',
    slug: 'how-to-wear-suede-shoes-kenya',
    meta_title: 'Suede Shoes Kenya Gift Guide | Yala Towers',
    meta_description:
      'How to wear and gift suede shoes in Kenya — outfits with blazers and khaki, rain care, and complete looks from Prince Esquire at Yala Towers.',
    excerpt:
      'Suede is the finish on a man who already owns the blazer. This guide covers how to wear suede shoes in Kenya, how to gift them, and how to complete the look with jackets, khaki and shirts from Yala Towers.',
    featured_image_url: '/models/shoes/tan-brogue-lifestyle.jpg',
    published_date: '2026-10-19T11:30:00+03:00',
    content: `
<p>Searches for <strong>suede shoes Kenya</strong>, <strong>suede loafers gift</strong>, and <strong>brown shoes with blazer</strong> usually come after the jacket decision. The man — or the person gifting him — wants the last 10% that makes the outfit feel expensive. At Prince Esquire, <strong>Yala Towers</strong>, shoes sit next to blazers, khaki and shirts so the look is built as one introduction.</p>

${yalaBlock}

<p>Browse <a href="/shop/shoes/formal-shoes">formal shoes</a>, <a href="/shop/shoes/loafers">loafers</a>, <a href="/shop/suits/blazers">blazers</a>, <a href="/shop/trousers/khaki">khaki</a>, <a href="/shop/jackets">jackets</a> and <a href="/shop/gift-sets">gift sets</a>.</p>

<img src="/models/shoes/tan-brogue-lifestyle.jpg" alt="suede-shoes-gift-outfit-kenya-yala-towers" width="900" height="1200" loading="lazy" />

<h2>When suede introduces him (and when leather protects him)</h2>
<ul>
<li><strong>Suede</strong> — garden weddings, podcast Fridays, smart dinners, creative offices</li>
<li><strong>Polished leather</strong> — heavy rain, muddy venues, strict black-tie, daily CBD flood risk</li>
</ul>

<img src="/models/shoes/brown-oxford-lifestyle.jpg" alt="brown-shoes-with-blazer-nairobi" width="900" height="1200" loading="lazy" />

<h2>Complete looks from the Prince Esquire floor</h2>
<ol>
<li>Tan suede + beige khaki + white shirt + navy blazer — husband gift formula</li>
<li>Brown suede Chelsea feel + dark trousers + knit + casual jacket — evening</li>
<li>Black leather oxfords + charcoal trousers + white shirt + navy blazer — conference / podcast formal</li>
</ol>

<h2>Rain-season care (Kenya-specific)</h2>
<ol>
<li>Protect suede before first wear</li>
<li>Skip suede when thunderstorms are certain</li>
<li>Brush Nairobi dust daily</li>
<li>Air-dry if wet — never bake on a heater</li>
</ol>

<h2>Gift wrapper</h2>
<p>Shoes alone are good. Shoes + a shirt from Yala Towers are better. Shoes + shirt + blazer are how you buy him the governor&apos;s posture without buying him a title — presence, not costume.</p>

<h2>FAQ</h2>
<h3>Are suede shoes a good gift for a Kenyan husband?</h3>
<p>Yes if he already owns black leather for rain days. Tan or mid-brown unlocks khaki and navy blazer outfits.</p>
<h3>Where can we try the full look together?</h3>
<p>Prince Esquire at <strong>Yala Towers, Nairobi</strong> — blazers, jackets, khaki, shirts and shoes in one house.</p>

${waCta('suede shoes and complete looks Yala Towers')}
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
    RETURNING slug, is_published, title`,
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
  console.log('Updating 6 Style Journal posts (gift / podcast / conference / Yala Towers)…');
  for (const post of posts) {
    const row = await upsertPost(post);
    console.log('✓', row.slug);
    console.log('  ', row.title);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
