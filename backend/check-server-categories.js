const http = require('http');

const url = 'http://127.0.0.1:5000/api/catalogue';
http.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const cats = {};
      for (const p of json.data.products) {
        if (!cats[p.category_name]) cats[p.category_name] = [];
        cats[p.category_name].push({ name: p.name, price: p.price });
      }
      for (const [cat, items] of Object.entries(cats)) {
        console.log(cat);
        for (const item of items.slice(0, 2)) {
          console.log(`  ${item.name}: ${item.price}`);
        }
      }
    } catch (e) {
      console.error(data);
    }
    process.exit(0);
  });
}).on('error', (e) => { console.error(e); process.exit(1); });
