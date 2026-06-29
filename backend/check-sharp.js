try {
  const sharp = require('sharp');
  console.log('sharp available');
} catch (e) {
  console.log('sharp not available:', e.message);
}
