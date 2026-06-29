const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'public', 'images', 'products');

async function compress() {
  const files = fs.readdirSync(IMAGES_DIR).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
  let totalBefore = 0;
  let totalAfter = 0;

  for (const file of files) {
    const inputPath = path.join(IMAGES_DIR, file);
    const tempPath = path.join(IMAGES_DIR, file + '.tmp');
    const stats = fs.statSync(inputPath);
    totalBefore += stats.size;

    const buffer = await sharp(inputPath)
      .jpeg({ quality: 70, progressive: true, mozjpeg: true })
      .resize(800)
      .toBuffer();

    fs.writeFileSync(tempPath, buffer);
    fs.renameSync(tempPath, inputPath);
    totalAfter += buffer.length;
    console.log(`Compressed ${file}: ${(stats.size / 1024).toFixed(1)}KB -> ${(buffer.length / 1024).toFixed(1)}KB`);
  }

  console.log(`\nTotal: ${(totalBefore / 1024).toFixed(1)}KB -> ${(totalAfter / 1024).toFixed(1)}KB (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}% reduction)`);
  process.exit(0);
}

compress().catch(e => { console.error(e); process.exit(1); });
