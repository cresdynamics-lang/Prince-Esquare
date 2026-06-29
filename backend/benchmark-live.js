const https = require('https');

function bench(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = Date.now() - start;
        try {
          const json = JSON.parse(data);
          resolve({ elapsed, count: json.data.products ? json.data.products.length : 0, size: Buffer.byteLength(data) });
        } catch (e) {
          resolve({ elapsed, error: e.message });
        }
      });
    }).on('error', (e) => resolve({ elapsed: 0, error: e.message }));
  });
}

(async () => {
  const r1 = await bench('https://prince-esquire.co.ke/api/catalogue');
  console.log('All products:', r1);
  const r2 = await bench('https://prince-esquire.co.ke/api/catalogue?category=jackets');
  console.log('Jackets:', r2);
  process.exit(0);
})();
