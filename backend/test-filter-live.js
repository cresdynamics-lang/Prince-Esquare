const https = require('https');

function fetch(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const count = json.data.products ? json.data.products.length : 0;
          const cats = json.data.products.map(p => p.category_name);
          const uniqueCats = [...new Set(cats)];
          resolve('Count: ' + count + ' | Cats: ' + uniqueCats.join(', '));
        } catch (e) {
          resolve('Parse error: ' + e.message);
        }
      });
    }).on('error', (e) => resolve('Request error: ' + e.message));
  });
}

(async () => {
  const r1 = await fetch('https://prince-esquire.co.ke/api/catalogue?category=jackets');
  console.log('Jackets: ' + r1);
  const r2 = await fetch('https://prince-esquire.co.ke/api/catalogue?category=polos');
  console.log('Polos: ' + r2);
  const r3 = await fetch('https://prince-esquire.co.ke/api/catalogue?category=knitted-polos');
  console.log('Knitted Polos: ' + r3);
  process.exit(0);
})();
