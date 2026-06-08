require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { syncPosPricesFromEcommerce } = require('../src/services/productPosLink');

syncPosPricesFromEcommerce()
  .then((r) => {
    console.log(`POS prices synced: ${r.updated} categories (${r.linkedUpdated} linked, ${r.nameMatchedUpdated} name-matched)`);
    if (r.products?.length) {
      r.products.slice(0, 10).forEach((p) => console.log(`  ${p.name}: KES ${p.shop_price}`));
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
