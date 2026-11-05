/**
 * Buying guidance shown on category pages. General advice only: no stock claims,
 * prices or fabric promises, because those change. `keywords` pick related journal posts.
 */
const GUIDES = {
  suits: {
    keywords: ['suit', 'wedding', 'power'],
    sections: [
      { heading: 'How a suit should fit', body: 'Check the shoulders first, because they are the hardest part to alter. The seam should end where your shoulder ends. The jacket should button without pulling, and about a centimetre of shirt cuff should show at the sleeve.' },
      { heading: 'Which colour to buy first', body: 'Navy is the most useful first suit in Nairobi: it works for the office, meetings and most weddings. Charcoal comes next for formal days. Add a blue or grey once those are covered.' },
      { heading: 'Two-piece or blazer?', body: 'Choose a two-piece when the jacket and trousers must match, such as for interviews, boardrooms and weddings. Choose a blazer when you want to dress up chinos or khakis without wearing a full suit.' },
    ],
  },
  'two-piece': {
    keywords: ['suit', 'wedding', 'power'],
    sections: [
      { heading: 'Choosing a two-piece suit', body: 'Start with where you will wear it most. Navy and charcoal carry a working week; steel and royal blues suit weddings and events better. A slim cut looks sharp, but you should still be able to sit comfortably with the jacket buttoned.' },
      { heading: 'What to wear with it', body: 'A white or light blue shirt works with almost every two-piece. Wear black shoes with charcoal and black suits, and black or dark brown with navy and blue. Match your belt to your shoes.' },
    ],
  },
  'wedding-suits': {
    keywords: ['wedding', 'suit'],
    sections: [
      { heading: 'Dressing as a groom, groomsman or guest', body: 'A groom can take the strongest colour in the room, such as royal blue or a deep navy. Groomsmen look best in one matching colour. Guests should stay smart without competing with the groom, so midnight navy or charcoal is a safe choice.' },
      { heading: 'Plan the whole look', body: 'Choose the suit first, then the shirt, tie, belt and shoes together. Try everything on at least a week before the day so there is time for changes. For a group, visit us at Yala Towers or message us on WhatsApp to check sizes early.' },
    ],
  },
  blazers: {
    keywords: ['blazer', 'jacket'],
    sections: [
      { heading: 'Making a blazer work', body: 'A blazer should fit closely across the shoulders and chest, and should look deliberately different from your trousers. A navy blazer goes with khaki, grey and cream. Burgundy and tan checks suit darker trousers.' },
      { heading: 'Office, events and on camera', body: 'Keep patterns quiet for the office, and let texture and windowpane checks do the work at events. For photos and video, solid colours and small patterns tend to look cleaner than very fine checks.' },
    ],
  },
  shirts: {
    keywords: ['shirt'],
    sections: [
      { heading: 'Getting the fit right', body: 'A shirt collar should close with room for one finger. The shoulder seam should sit on your shoulder, and the cuff should reach the base of your thumb. If it pulls at the buttons, go up a size.' },
      { heading: 'Building a shirt rotation', body: 'Start with white and light blue for work, then add stripes and checks for variety. Keep a printed Presidential shirt for occasions when you want to stand out.' },
    ],
  },
  'formal-shirts': {
    keywords: ['shirt'],
    sections: [
      { heading: 'Choosing an official shirt', body: 'For the office, start with white and light blue, then add gingham, stripes and contrast collars. A contrast collar reads more formal, so it pairs well with a suit. Smaller patterns are easier to wear with a patterned tie.' },
      { heading: 'Looking after it in Nairobi', body: 'Wash official shirts inside out, hang them to dry in the shade, and iron them while slightly damp. Rotating several shirts through the week also helps them last longer.' },
    ],
  },
  'presidential-shirts': {
    keywords: ['shirt', 'presidential'],
    sections: [
      { heading: 'What to wear with a Presidential shirt', body: 'These printed long-sleeve shirts carry the look on their own, so keep everything else plain. Wear them with solid navy, black, cream or khaki trousers and clean leather shoes. They work well for events, Fridays and evenings out.' },
      { heading: 'Choosing a print', body: 'Paisley and floral prints in navy or green are the easiest to start with. Champagne and multi-colour checks stand out more, so save them for occasions.' },
    ],
  },
  'polo-t-shirts': {
    keywords: ['shirt', 'polo'],
    sections: [
      { heading: 'Knitted or pique?', body: 'A knitted polo looks smarter and pairs well with chinos and a blazer. A pique polo is more relaxed and suits weekends. A quarter-zip adds some structure at the neck when you want a dressier look without a collar and tie.' },
      { heading: 'The right fit', body: 'The sleeves should sit around mid-bicep and the hem should fall just below your belt. If the shoulder seams hang past your shoulders, go down a size.' },
    ],
  },
  trousers: {
    keywords: ['trouser', 'khaki', 'chino'],
    sections: [
      { heading: 'Chinos, khakis or Gurkha?', body: 'Chinos are the smartest everyday choice and work with a blazer. Khakis are easy for work and weekends. Gurkha trousers have a high waist and buckled waistband, so they suit a tucked-in shirt.' },
      { heading: 'Where trousers should end', body: 'For a clean line, trousers should just touch the top of your shoe. A shop or tailor can adjust the length, so buy for the waist and seat first.' },
    ],
  },
  chino: {
    keywords: ['chino', 'trouser', 'khaki'],
    sections: [
      { heading: 'Which chinos to buy first', body: 'Navy and stone go with the most shirts. Add black for evenings and olive for weekends. Wear them with polos, official shirts or a blazer, and finish with loafers or smart sneakers.' },
    ],
  },
  khaki: {
    keywords: ['khaki', 'trouser', 'chino'],
    sections: [
      { heading: 'Wearing khakis well', body: 'Khakis work from the office to the weekend. Cream, tan and olive look good with navy and white shirts, while charcoal and black lean more formal. Choose a tapered fit if you want a sharper line over your shoes.' },
    ],
  },
  jackets: {
    keywords: ['jacket'],
    sections: [
      { heading: 'Choosing a jacket for Nairobi weather', body: 'Nairobi mornings and evenings can be cool while the afternoons warm up, so a light layer you can take off is usually the most useful. Hybrid knit and quilted jackets work well for this. Suede racers and bombers add polish for evenings.' },
      { heading: 'Getting the length right', body: 'A casual jacket should end around your belt line or just below it, and should zip without pulling. Try it on over the shirt or knit you plan to wear underneath.' },
    ],
  },
  tracksuits: {
    keywords: ['track', 'jacket'],
    sections: [
      { heading: 'Wearing a tracksuit smartly', body: 'A matching tracksuit looks sharpest with clean white or black sneakers and a plain T-shirt underneath. Check that the cuffs sit at your wrist and ankle without bunching. Black is the easiest colour to wear, and white and dark green stand out more.' },
      { heading: 'Looking after it', body: 'Zip it up before washing, wash it inside out on a cool setting, and avoid high heat when drying. This helps keep the shape and colour of the fabric.' },
    ],
  },
  shoes: {
    keywords: ['shoe', 'suede', 'sneaker'],
    sections: [
      { heading: 'Which shoes to buy first', body: 'A black cap-toe Oxford covers most formal occasions. Add dark brown for navy and blue suits, then Chelsea boots or loafers for variety. Smart sneakers take care of the weekend.' },
      { heading: 'Getting the right size', body: 'Shoes should feel firm across the widest part of your foot without pinching, and your heel should not slip when you walk. Sizes can differ between styles, so message us on WhatsApp with your usual size if you are unsure.' },
    ],
  },
  'formal-shoes': {
    keywords: ['shoe'],
    sections: [
      { heading: 'Oxford, Derby or brogue?', body: 'An Oxford is the most formal, with a closed lacing that looks sleek under a suit. A Derby has open lacing and is a little more relaxed and roomier across the foot. Brogues have decorative punching and suit business-casual outfits and tweedier fabrics.' },
      { heading: 'Matching official shoes', body: 'Wear black with charcoal and black suits. With navy, black and dark brown both work. Tan suits lighter blues and greys. Match your belt to your shoes for the cleanest look.' },
    ],
  },
  'chelsea-boots': {
    keywords: ['shoe', 'boot'],
    sections: [
      { heading: 'How to wear Chelsea boots', body: 'Slim trousers should sit just over the top of the boot. Black Chelsea boots can work with a suit, while burnished tan and brown suit chinos, jeans and blazers. They are also easy to pull on, which makes them handy on a busy day.' },
      { heading: 'Getting the right fit', body: 'The elastic side panels should grip your ankle, and your heel should stay in place when you walk. They should feel snug at first without pressing on your toes.' },
    ],
  },
  brogues: {
    keywords: ['shoe'],
    sections: [
      { heading: 'When to wear brogues', body: 'The decorative punching makes brogues a little less formal than a plain Oxford. They are ideal for business-casual days and look especially good with checked blazers, chinos and textured suits.' },
      { heading: 'Keeping them looking sharp', body: 'Brush dust out of the punched pattern, polish regularly, and use a shoe tree between wears to help the leather keep its shape.' },
    ],
  },
  loafers: {
    keywords: ['shoe', 'loafer'],
    sections: [
      { heading: 'Wearing loafers', body: 'Penny loafers suit chinos, khakis and relaxed suits. They look best with trousers that end at or slightly above the top of the shoe. Patent finishes lean towards evenings, while pebbled leather is easier for the day.' },
    ],
  },
  casual: {
    keywords: ['shoe', 'sneaker'],
    sections: [
      { heading: 'Choosing smart sneakers', body: 'Clean white leather sneakers go with almost everything, including chinos, jeans and tracksuits. Black or tan work better with darker outfits. Keep them clean, because it is what makes sneakers look smart rather than sporty.' },
    ],
  },
  't-shirts': {
    keywords: ['shirt', 'gift'],
    sections: [
      { heading: 'Choosing a T-shirt', body: 'The shoulder seam should sit on your shoulder and the sleeve should end around mid-bicep. Black, white and navy go with almost everything, and a clean crew neck looks smart under a jacket or blazer.' },
    ],
  },
  jeans: {
    keywords: ['trouser', 'gift'],
    sections: [
      { heading: 'Picking the right jeans', body: 'Dark blue is the smartest wash and works with a blazer or polo. Lighter washes are better for weekends. The jeans should sit comfortably at the waist without a belt, and should just touch the top of your shoe.' },
    ],
  },
  'full-jackets': {
    keywords: ['jacket'],
    sections: [
      { heading: 'Hybrid, quilted or suede?', body: 'A hybrid jacket combines a padded front with knit sleeves, which suits cool Nairobi mornings. Quilted jackets look smart over a shirt, and suede racers work well for evenings. Try a jacket on over what you plan to wear underneath.' },
    ],
  },
  'half-jackets': {
    keywords: ['jacket'],
    sections: [
      { heading: 'Wearing a gilet or short jacket', body: 'A puffer gilet adds warmth without bulk at the arms, so it layers easily over a shirt or knitted polo. A short bomber should end around your belt line. Neutral colours such as black, cream and olive are the easiest to wear.' },
    ],
  },
  'gift-sets': {
    keywords: ['gift', 'husband'],
    sections: [
      { heading: 'Choosing a gift for him', body: 'Think about where he will wear it most: the office, weekends or events. If you are unsure of his size, message us on WhatsApp before ordering, and remember that size exchanges are free within 5 days of delivery.' },
    ],
  },
  'linen-edit': {
    keywords: ['linen', 'wardrobe'],
    sections: [
      { heading: 'Wearing linen well', body: 'Linen keeps you cooler on warm Nairobi afternoons and is meant to look a little relaxed. Lighter colours feel coolest. Wash it gently and iron it while slightly damp to keep it looking neat.' },
    ],
  },
  accessories: {
    keywords: ['gift', 'belt'],
    sections: [
      { heading: 'Finishing the look', body: 'Match a leather belt to your shoes when wearing official clothes. Woven and stretch belts are better suited to chinos and weekend wear, and a brushed or gunmetal buckle looks more understated than polished metal.' },
    ],
  },
  belts: {
    keywords: ['gift', 'belt'],
    sections: [
      { heading: 'Picking the right belt', body: 'Choose a belt about two sizes above your trouser waist, so that you can fasten it on a middle hole. Use smooth leather with suits and official shoes, and woven or stretch belts with casual trousers.' },
    ],
  },
};

module.exports = { GUIDES };
