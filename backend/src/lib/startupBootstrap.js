const logger = require('../utils/logger');

/**
 * Runs on server start when AUTO_BOOTSTRAP=true.
 * Keeps ecommerce ↔ POS links and prices in sync without manual scripts.
 */
const runStartupBootstrap = async () => {
  if (process.env.AUTO_BOOTSTRAP !== 'true') {
    logger.info({ msg: 'AUTO_BOOTSTRAP disabled — skip startup sync' });
    return;
  }

  try {
    const {
      ensureAllEcommerceProductsInPos,
    } = require('../services/inventoryChannel');
    const { autoLinkAllProducts, syncPosPricesFromEcommerce, reconcileAllProductLinks } = require('../services/productPosLink');

    const ensured = await ensureAllEcommerceProductsInPos();
    const linked = await autoLinkAllProducts();
    await syncPosPricesFromEcommerce();
    await reconcileAllProductLinks();

    logger.info({
      msg: 'Startup bootstrap complete',
      websiteEnsured: ensured?.linked ?? 0,
      stockSeeded: ensured?.stockSeeded ?? 0,
      productsLinked: linked?.linked ?? linked,
    });
  } catch (err) {
    logger.warn({ err, msg: 'Startup bootstrap failed (server still running)' });
  }
};

module.exports = { runStartupBootstrap };
