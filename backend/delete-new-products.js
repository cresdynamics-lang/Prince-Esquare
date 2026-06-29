const db = require('./src/config/db');

const SLUGS_TO_DELETE = [
  'classic-knitted-polo',
  'brown-formal-shoe-view-1',
  'brown-formal-shoe-view-2',
  'brown-formal-shoe-view-3',
  'brown-formal-shoe-view-4',
  'brown-formal-shoe-view-5',
  'brown-formal-shoe-view-6',
  'brown-formal-shoe-view-7',
  'brown-formal-shoe-view-8',
  'brown-formal-shoe-view-9',
  'brown-formal-shoe-view-10',
  'brown-formal-shoe-view-11',
  'brown-formal-shoe-view-12',
  'brown-formal-shoe-view-13',
  'brown-formal-shoe-view-14',
  'brown-formal-shoe-view-15',
  'brown-formal-shoe-view-16',
  'brown-formal-shoe-view-17',
  'brown-formal-shoe-view-18',
  'brown-formal-shoe-view-19',
  'brown-formal-shoe-view-20',
  'brown-formal-shoe-view-21',
  'brown-formal-shoe-view-22',
  'brown-formal-shoe-view-23',
  'brown-formal-shoe-view-24',
  'brown-formal-shoe-view-25',
  'brown-formal-shoe-view-26',
  'brown-formal-shoe-view-27',
  'brown-formal-shoe-view-28',
  'brown-formal-shoe-view-29',
  'brown-formal-shoe-view-30',
  'brown-formal-shoe-view-31',
  'brown-formal-shoe-view-32',
  'brown-formal-shoe-view-33',
  'black-formal-shoe-view-34',
  'black-formal-oxford-shoe',
  'black-formal-shoe-view-35',
  'brown-formal-shoe-detail-view-1',
  'brown-formal-shoe-detail-view-2'
];

async function deleteProducts() {
  let deletedCount = 0;

  for (const slug of SLUGS_TO_DELETE) {
    try {
      // First delete variants
      await db.query('DELETE FROM product_variants WHERE product_id IN (SELECT id FROM products WHERE slug = $1)', [slug]);
      
      // Then delete the product
      const result = await db.query('DELETE FROM products WHERE slug = $1 RETURNING name', [slug]);
      
      if (result.rows.length > 0) {
        console.log(`✓ Deleted: ${result.rows[0].name}`);
        deletedCount++;
      }
    } catch (error) {
      console.error(`✗ Error deleting ${slug}:`, error.message);
    }
  }

  console.log(`\n✓ Deleted ${deletedCount}/${SLUGS_TO_DELETE.length} products`);
  process.exit(0);
}

deleteProducts().catch((error) => {
  console.error('delete-new-products failed:', error);
  process.exit(1);
});
