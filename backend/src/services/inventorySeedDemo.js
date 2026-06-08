const { seedInventoryCatalog } = require('./inventoryCatalogSeed');

const runSeedCatalog = async (_req, res, next) => {
  try {
    const summary = await seedInventoryCatalog({ replaceExisting: true });
    res.status(200).json({
      success: true,
      message: `Inventory catalog built — ${summary.totalProducts} products, ${summary.totalShopQty} shop units (not on website)`,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { runSeedCatalog };
