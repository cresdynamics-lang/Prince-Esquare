const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_DIR = 'c:\\Users\\Spine\\Downloads';
const OUTPUT_DIR = path.join(__dirname, 'processed-images');
const IMAGES = [
  'WhatsApp Image 2026-07-01 at 17.48.56.jpeg',
  'WhatsApp Image 2026-07-01 at 17.48.57.jpeg'
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function processImage(imagePath, outputPath) {
  try {
    await sharp(imagePath)
      .jpeg({ quality: 85, progressive: true })
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toFile(outputPath);
    
    console.log(`✓ Processed: ${path.basename(imagePath)} → ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    console.error(`✗ Error processing ${imagePath}:`, error.message);
    return null;
  }
}

async function processAllImages() {
  console.log('Starting image processing...\n');
  
  const results = [];
  
  for (const image of IMAGES) {
    const sourcePath = path.join(SOURCE_DIR, image);
    const outputName = image.replace('.jpeg', '.jpg');
    const outputPath = path.join(OUTPUT_DIR, outputName);
    
    if (fs.existsSync(sourcePath)) {
      const result = await processImage(sourcePath, outputPath);
      if (result) {
        results.push({
          original: image,
          processed: outputName,
          path: outputPath
        });
      }
    } else {
      console.log(`⚠ File not found: ${sourcePath}`);
    }
  }
  
  console.log(`\n✓ Successfully processed ${results.length}/${IMAGES.length} images`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  
  return results;
}

processAllImages()
  .then((results) => {
    console.log('\n✓ Processing complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Processing failed:', error);
    process.exit(1);
  });
