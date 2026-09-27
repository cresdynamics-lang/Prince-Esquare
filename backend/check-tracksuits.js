const db = require('./src/config/db');

async function checkTracksuits() {
  try {
    // Check if tracksuit products exist
    const products = await db.query("SELECT id, name, slug, is_active, category_id FROM products WHERE name ILIKE '%Moncler%' AND name ILIKE '%Tracksuit%'");
    console.log('Moncler Tracksuit Products:', JSON.stringify(products.rows, null, 2));
    
    // Check tracksuit category
    const category = await db.query("SELECT id, name, slug FROM categories WHERE name ILIKE '%Tracksuit%'");
    console.log('\nTracksuit Category:', JSON.stringify(category.rows, null, 2));
    
    // Check sportswear subcategory
    const subcategory = await db.query("SELECT id, name, slug, parent_id FROM categories WHERE name ILIKE '%Sportswear%'");
    console.log('\nSportswear Subcategory:', JSON.stringify(subcategory.rows, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err);
    process.exit(1);
  }
}

checkTracksuits();
