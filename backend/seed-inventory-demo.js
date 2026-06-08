/**
 * Seed POS inventory from stock-sheet totals — inventory only, NOT on website.
 * Run: npm run seed:inventory
 */
const { seedInventoryCatalog } = require('./src/services/inventoryCatalogSeed');
const { syncInventoryAlignment } = require('./src/services/inventoryWarehouseSync');

async function main() {
  console.log('=== Building inventory — shop + warehouse (no website) ===\n');
  const summary = await seedInventoryCatalog({
    replaceExisting: true,
    onProgress: ({ category, done, total }) => {
      if (done === total || done % 100 === 0) {
        process.stdout.write(`  ${category}: ${done}/${total}\r`);
      }
    },
  });

  console.log(`\nRemoved ${summary.deleted} previous catalog row(s)\n`);
  for (const cat of summary.categories) {
    const match = cat.targetQty === cat.actualShopQty ? '✓' : '⚠';
    console.log(
      `  ${match} ${cat.name}: shop ${cat.actualShopQty}/${cat.targetQty}, warehouse ${cat.warehouseQty}`
    );
  }
  console.log(`\nTotal: ${summary.totalProducts} pieces (${summary.totalShopQty} shop, ${summary.totalStoreQty} warehouse)`);

  console.log('\nRunning alignment sync…');
  const alignment = await syncInventoryAlignment();
  console.log(`  Warehouse backfill: ${alignment.warehouse?.created ?? 0} created`);
  console.log(`  Repaired: ${alignment.repaired?.repaired ?? 0}`);
  console.log(`  Website stock synced: ${alignment.website?.updated ?? 0}`);
  console.log('\nNothing was published to the website — use admin Publish when ready.\n');
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

module.exports = { main };
