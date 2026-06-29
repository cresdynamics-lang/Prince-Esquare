const http = require('http');
const start = Date.now();
http.get('http://127.0.0.1:5000/api/catalogue', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const elapsed = Date.now() - start;
    const json = JSON.parse(data);
    console.log(`Status: ${res.statusCode}`);
    console.log(`Time: ${elapsed}ms`);
    console.log(`Products: ${json.data.products.length}`);
    console.log(`Payload: ${(Buffer.byteLength(data) / 1024).toFixed(1)}KB`);
    process.exit(0);
  });
}).on('error', (e) => { console.error(e); process.exit(1); });
