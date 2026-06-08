require('dotenv').config();
const posDb = require('../src/lib/posDb');

async function main() {
  const seller = await posDb.searchPosCatalog({
    search: '',
    limit: 500,
    inStockOnly: true,
    shopFloorOnly: true,
  });
  const all = await posDb.searchPosCatalog({
    search: '',
    limit: 500,
    inStockOnly: false,
    shopFloorOnly: false,
  });

  const wh = seller.items.filter((p) => (p.sku || '').includes('-W-'));
  const legacy = seller.items.filter((p) => (p.sku || '').startsWith('POS-'));
  const totalShop = (seller.meta.categoryTotals || []).reduce((s, c) => s + (c.shop_qty || 0), 0);

  console.log('Seller catalog (shop floor, in stock):');
  console.log('  items:', seller.items.length);
  console.log('  warehouse SKUs:', wh.length, wh.length ? 'FAIL' : 'OK');
  console.log('  legacy POS SKUs:', legacy.length, legacy.length ? 'FAIL' : 'OK');
  console.log('  category shop total:', totalShop);
  console.log('  meta.inStock:', seller.meta.inStock);
  console.log('\nOld catalog (no filter):', all.items.length, 'items');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
