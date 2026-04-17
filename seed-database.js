import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedDatabase() {
  console.log('Seeding database...')

  // Categories
  const categories = [
    { slug: 'suits', name: 'Suits', description: 'Tailored suits for the modern gentleman', image_url: '/src/assets/cat-suits.jpg', display_order: 1 },
    { slug: 'shirts', name: 'Shirts', description: 'Premium dress shirts in various styles', image_url: '/src/assets/cat-shirts.jpg', display_order: 2 },
    { slug: 'trousers', name: 'Trousers', description: 'Formal and casual trousers', image_url: '/src/assets/cat-trousers.jpg', display_order: 3 },
    { slug: 'shoes', name: 'Shoes', description: 'Leather dress shoes and casual footwear', image_url: '/src/assets/cat-shoes.jpg', display_order: 4 },
    { slug: 'socks', name: 'Socks', description: 'Quality socks for every occasion', image_url: '/src/assets/cat-socks.jpg', display_order: 5 },
    { slug: 'belts', name: 'Belts', description: 'Leather belts to complete your look', image_url: '/src/assets/cat-belts.jpg', display_order: 6 },
    { slug: 'casual', name: 'Casual', description: 'Smart casual wear for everyday', image_url: '/src/assets/cat-casual.jpg', display_order: 7 },
    { slug: 'formal', name: 'Formal', description: 'Formal attire for special occasions', image_url: '/src/assets/cat-formal.jpg', display_order: 8 },
    { slug: 'sportswear', name: 'Sportswear', description: 'Athletic wear for the active man', image_url: '/src/assets/cat-sportswear.jpg', display_order: 9 },
  ]

  // Insert categories
  console.log('Inserting categories...')
  const { data: cats, error: catError } = await supabase
    .from('categories')
    .upsert(categories, { onConflict: 'slug' })
    .select()

  if (catError) {
    console.error('Error inserting categories:', catError)
    return
  }
  console.log(`Inserted ${cats.length} categories`)

  // Get category IDs
  const catMap = {}
  cats.forEach(c => {
    catMap[c.slug] = c.id
  })

  // Products
  const products = [
    { slug: 'navy-three-piece-suit', title: 'Navy Three-Piece Suit', description: 'A classic navy three-piece suit crafted from premium wool blend fabric. Perfect for weddings, business meetings, and formal events.', category_id: catMap['suits'], price: 45000, sale_price: 38000, is_published: true, is_featured: true, meta_title: 'Navy Three-Piece Suit | Prince Esquare', meta_description: 'Elegant navy three-piece suit with matching vest. Expertly tailored for the modern gentleman.' },
    { slug: 'charcoal-slim-fit-suit', title: 'Charcoal Slim Fit Suit', description: 'Contemporary charcoal slim fit suit with modern silhouette. Made from high-quality fabric with excellent drape and comfort.', category_id: catMap['suits'], price: 42000, sale_price: null, is_published: true, is_featured: true, meta_title: 'Charcoal Slim Fit Suit | Prince Esquare', meta_description: 'Modern charcoal slim fit suit. Perfect for the contemporary professional.' },
    { slug: 'white-dress-shirt', title: 'White Dress Shirt', description: 'Classic white dress shirt made from Egyptian cotton. Features a spread collar and French cuffs for cufflinks.', category_id: catMap['shirts'], price: 4500, sale_price: 3800, is_published: true, is_featured: true, meta_title: 'White Dress Shirt | Prince Esquare', meta_description: 'Premium white dress shirt in Egyptian cotton. Timeless elegance for any formal occasion.' },
    { slug: 'blue-oxford-shirt', title: 'Blue Oxford Shirt', description: 'Versatile blue Oxford shirt with button-down collar. Perfect for both casual and formal settings.', category_id: catMap['shirts'], price: 3800, sale_price: null, is_published: true, is_featured: true, meta_title: 'Blue Oxford Shirt | Prince Esquare', meta_description: 'Classic blue Oxford shirt with button-down collar. A wardrobe essential.' },
    { slug: 'black-oxford-shoes', title: 'Black Oxford Shoes', description: 'Handcrafted black Oxford shoes with Goodyear welt construction. Premium leather sole for durability and comfort.', category_id: catMap['shoes'], price: 15000, sale_price: 12000, is_published: true, is_featured: true, meta_title: 'Black Oxford Shoes | Prince Esquare', meta_description: 'Luxurious black Oxford shoes with Goodyear welt. Handcrafted from premium leather.' },
    { slug: 'brown-loafers', title: 'Brown Loafers', description: 'Classic brown loafers crafted from supple leather. Perfect for smart casual and formal occasions.', category_id: catMap['shoes'], price: 12000, sale_price: null, is_published: true, is_featured: true, meta_title: 'Brown Loafers | Prince Esquare', meta_description: 'Elegant brown loafers in premium leather. Versatile style for any occasion.' },
    { slug: 'black-leather-belt', title: 'Black Leather Belt', description: 'Premium black leather belt with brushed silver buckle. 1.5 inches wide for a classic look.', category_id: catMap['belts'], price: 2500, sale_price: null, is_published: true, is_featured: true, meta_title: 'Black Leather Belt | Prince Esquare', meta_description: 'Quality black leather belt with silver buckle. The perfect accessory for any outfit.' },
    { slug: 'brown-leather-belt', title: 'Brown Leather Belt', description: 'Rich brown leather belt with antique brass buckle. Handcrafted from full-grain leather.', category_id: catMap['belts'], price: 2500, sale_price: null, is_published: true, is_featured: true, meta_title: 'Brown Leather Belt | Prince Esquare', meta_description: 'Handcrafted brown leather belt with brass buckle. Premium full-grain leather.' },
    { slug: 'grey-trousers', title: 'Grey Trousers', description: 'Classic grey trousers in a modern fit. Made from wrinkle-resistant fabric for all-day comfort.', category_id: catMap['trousers'], price: 6500, sale_price: 5500, is_published: true, is_featured: true, meta_title: 'Grey Trousers | Prince Esquare', meta_description: 'Modern grey trousers with wrinkle-resistant fabric. Perfect for business and formal wear.' },
    { slug: 'chino-trousers', title: 'Chino Trousers', description: 'Versatile chino trousers in a slim fit. Available in classic colors for any wardrobe.', category_id: catMap['trousers'], price: 5500, sale_price: null, is_published: true, is_featured: true, meta_title: 'Chino Trousers | Prince Esquare', meta_description: 'Slim fit chino trousers in premium cotton. Versatile style for any occasion.' },
    { slug: 'premium-socks-set', title: 'Premium Socks Set', description: 'Set of 3 premium cotton blend socks in classic colors. Reinforced heel and toe for durability.', category_id: catMap['socks'], price: 1200, sale_price: null, is_published: true, is_featured: true, meta_title: 'Premium Socks Set | Prince Esquare', meta_description: 'Set of 3 premium socks in classic colors. Reinforced for durability and comfort.' },
    { slug: 'dress-socks', title: 'Dress Socks', description: 'Fine merino wool dress socks in elegant patterns. Moisture-wicking for all-day comfort.', category_id: catMap['socks'], price: 800, sale_price: null, is_published: true, is_featured: true, meta_title: 'Dress Socks | Prince Esquare', meta_description: 'Luxurious merino wool dress socks. Moisture-wicking comfort for the modern gentleman.' },
  ]

  // Insert products
  console.log('Inserting products...')
  const { data: prods, error: prodError } = await supabase
    .from('products')
    .upsert(products, { onConflict: 'slug' })
    .select()

  if (prodError) {
    console.error('Error inserting products:', prodError)
    return
  }
  console.log(`Inserted ${prods.length} products`)

  // Get product IDs
  const prodMap = {}
  prods.forEach(p => {
    prodMap[p.slug] = p.id
  })

  // Product images
  const productImages = [
    { product_id: prodMap['navy-three-piece-suit'], image_url: '/src/assets/cat-suits.jpg', alt_text: 'Navy Three-Piece Suit front view', display_order: 0 },
    { product_id: prodMap['charcoal-slim-fit-suit'], image_url: '/src/assets/cat-suits.jpg', alt_text: 'Charcoal Slim Fit Suit front view', display_order: 0 },
    { product_id: prodMap['white-dress-shirt'], image_url: '/src/assets/cat-shirts.jpg', alt_text: 'White Dress Shirt front view', display_order: 0 },
    { product_id: prodMap['blue-oxford-shirt'], image_url: '/src/assets/cat-shirts.jpg', alt_text: 'Blue Oxford Shirt front view', display_order: 0 },
    { product_id: prodMap['black-oxford-shoes'], image_url: '/src/assets/cat-shoes.jpg', alt_text: 'Black Oxford Shoes side view', display_order: 0 },
    { product_id: prodMap['brown-loafers'], image_url: '/src/assets/cat-shoes.jpg', alt_text: 'Brown Loafers side view', display_order: 0 },
    { product_id: prodMap['black-leather-belt'], image_url: '/src/assets/cat-belts.jpg', alt_text: 'Black Leather Belt', display_order: 0 },
    { product_id: prodMap['brown-leather-belt'], image_url: '/src/assets/cat-belts.jpg', alt_text: 'Brown Leather Belt', display_order: 0 },
    { product_id: prodMap['grey-trousers'], image_url: '/src/assets/cat-trousers.jpg', alt_text: 'Grey Trousers front view', display_order: 0 },
    { product_id: prodMap['chino-trousers'], image_url: '/src/assets/cat-trousers.jpg', alt_text: 'Chino Trousers front view', display_order: 0 },
    { product_id: prodMap['premium-socks-set'], image_url: '/src/assets/cat-socks.jpg', alt_text: 'Premium Socks Set', display_order: 0 },
    { product_id: prodMap['dress-socks'], image_url: '/src/assets/cat-socks.jpg', alt_text: 'Dress Socks', display_order: 0 },
  ]

  // Insert product images
  console.log('Inserting product images...')
  const { error: imgError } = await supabase
    .from('product_images')
    .upsert(productImages, { onConflict: 'product_id,display_order' })

  if (imgError) {
    console.error('Error inserting product images:', imgError)
    return
  }
  console.log('Inserted product images')

  // Product variants
  const variants = [
    // Navy Three-Piece Suit
    { product_id: prodMap['navy-three-piece-suit'], size: '40R', color: 'Navy', sku: 'PE-SUIT-NAV-40R', stock_quantity: 2 },
    { product_id: prodMap['navy-three-piece-suit'], size: '42R', color: 'Navy', sku: 'PE-SUIT-NAV-42R', stock_quantity: 3 },
    { product_id: prodMap['navy-three-piece-suit'], size: '44R', color: 'Navy', sku: 'PE-SUIT-NAV-44R', stock_quantity: 2 },
    // Charcoal Slim Fit Suit
    { product_id: prodMap['charcoal-slim-fit-suit'], size: '40R', color: 'Charcoal', sku: 'PE-SUIT-CHR-40R', stock_quantity: 3 },
    { product_id: prodMap['charcoal-slim-fit-suit'], size: '42R', color: 'Charcoal', sku: 'PE-SUIT-CHR-42R', stock_quantity: 2 },
    { product_id: prodMap['charcoal-slim-fit-suit'], size: '44R', color: 'Charcoal', sku: 'PE-SUIT-CHR-44R', stock_quantity: 2 },
    // White Dress Shirt
    { product_id: prodMap['white-dress-shirt'], size: '15', color: 'White', sku: 'PE-SHIRT-WHT-15', stock_quantity: 5 },
    { product_id: prodMap['white-dress-shirt'], size: '16', color: 'White', sku: 'PE-SHIRT-WHT-16', stock_quantity: 5 },
    { product_id: prodMap['white-dress-shirt'], size: '17', color: 'White', sku: 'PE-SHIRT-WHT-17', stock_quantity: 5 },
    // Blue Oxford Shirt
    { product_id: prodMap['blue-oxford-shirt'], size: '15', color: 'Blue', sku: 'PE-SHIRT-BLU-15', stock_quantity: 4 },
    { product_id: prodMap['blue-oxford-shirt'], size: '16', color: 'Blue', sku: 'PE-SHIRT-BLU-16', stock_quantity: 4 },
    { product_id: prodMap['blue-oxford-shirt'], size: '17', color: 'Blue', sku: 'PE-SHIRT-BLU-17', stock_quantity: 4 },
    // Black Oxford Shoes
    { product_id: prodMap['black-oxford-shoes'], size: '41', color: 'Black', sku: 'PE-SHOE-BLK-41', stock_quantity: 3 },
    { product_id: prodMap['black-oxford-shoes'], size: '42', color: 'Black', sku: 'PE-SHOE-BLK-42', stock_quantity: 3 },
    { product_id: prodMap['black-oxford-shoes'], size: '43', color: 'Black', sku: 'PE-SHOE-BLK-43', stock_quantity: 3 },
    // Brown Loafers
    { product_id: prodMap['brown-loafers'], size: '41', color: 'Brown', sku: 'PE-SHOE-BRN-41', stock_quantity: 2 },
    { product_id: prodMap['brown-loafers'], size: '42', color: 'Brown', sku: 'PE-SHOE-BRN-42', stock_quantity: 2 },
    { product_id: prodMap['brown-loafers'], size: '43', color: 'Brown', sku: 'PE-SHOE-BRN-43', stock_quantity: 2 },
    // Black Leather Belt
    { product_id: prodMap['black-leather-belt'], size: 'One Size', color: 'Black', sku: 'PE-BELT-BLK-OS', stock_quantity: 10 },
    // Brown Leather Belt
    { product_id: prodMap['brown-leather-belt'], size: 'One Size', color: 'Brown', sku: 'PE-BELT-BRN-OS', stock_quantity: 10 },
    // Grey Trousers
    { product_id: prodMap['grey-trousers'], size: '32', color: 'Grey', sku: 'PE-TRS-GRY-32', stock_quantity: 4 },
    { product_id: prodMap['grey-trousers'], size: '34', color: 'Grey', sku: 'PE-TRS-GRY-34', stock_quantity: 4 },
    { product_id: prodMap['grey-trousers'], size: '36', color: 'Grey', sku: 'PE-TRS-GRY-36', stock_quantity: 4 },
    // Chino Trousers
    { product_id: prodMap['chino-trousers'], size: '32', color: 'Beige', sku: 'PE-TRS-CHN-32', stock_quantity: 3 },
    { product_id: prodMap['chino-trousers'], size: '34', color: 'Beige', sku: 'PE-TRS-CHN-34', stock_quantity: 3 },
    { product_id: prodMap['chino-trousers'], size: '36', color: 'Beige', sku: 'PE-TRS-CHN-36', stock_quantity: 3 },
    // Premium Socks Set
    { product_id: prodMap['premium-socks-set'], size: 'One Size', color: 'Assorted', sku: 'PE-SOCK-PRM-OS', stock_quantity: 15 },
    // Dress Socks
    { product_id: prodMap['dress-socks'], size: 'One Size', color: 'Assorted', sku: 'PE-SOCK-DRS-OS', stock_quantity: 15 },
  ]

  // Insert variants
  console.log('Inserting product variants...')
  const { error: varError } = await supabase
    .from('product_variants')
    .upsert(variants, { onConflict: 'sku' })

  if (varError) {
    console.error('Error inserting variants:', varError)
    return
  }
  console.log('Inserted product variants')

  console.log('Database seeded successfully!')
}

seedDatabase().catch(console.error)
