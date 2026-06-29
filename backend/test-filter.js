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
          const first = count > 0 ? json.data.products[0].name : 'none';
          resolve('Count: ' + count + ' | First: ' + first);
        } catch (e) {
          resolve('Parse error: ' + e.message);
        }
      });
    }).on('error', (e) => resolve('Request error: ' + e.message));
  });
}

(async () => {
  const r1 = await fetch('https://prince-esquire.co.ke/api/catalogue?category=jackets');
  console.log('Jackets filter: ' + r1);
  const r2 = await fetch('https://prince-esquire.co.ke/api/catalogue?category=polos');
  console.log('Polos filter: ' + r2);
  const r3 = await fetch('https://prince-esquire.co.ke/api/catalogue');
  console.log('All products: ' + r3);
  process.exit(0);
})();
