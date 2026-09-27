const http = require('http');
const options = {
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/products?category=Tracksuits',
  method: 'GET'
};
const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Total:', json.data.pagination.total);
      json.data.products.forEach(p => console.log(p.name, '-', p.category_name));
    } catch (e) {
      console.log(data.slice(0, 500));
    }
  });
});
req.on('error', (e) => console.error(e));
req.end();
