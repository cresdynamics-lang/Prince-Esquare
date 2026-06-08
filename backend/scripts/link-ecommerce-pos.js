require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { autoLinkAllProducts } = require('../src/services/productPosLink');

autoLinkAllProducts()
  .then((r) => {
    console.log(`Linked ${r.linked} of ${r.scanned} ecommerce products to POS stock`);
    if (r.reconciled) console.log(`Corrected ${r.reconciled} mis-linked products`);
    if (r.pricesUpdated != null) {
      console.log(`POS shop prices updated for ${r.pricesUpdated} stock categories`);
    }
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
