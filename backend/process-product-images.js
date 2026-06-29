const fs = require('fs');
const path = require('path');
const heicDecoder = require('heic-decoder');
const sharp = require('sharp');

const SOURCE_DIR = 'c:\\Users\\Spine\\Downloads';
const OUTPUT_DIR = path.join(__dirname, 'processed-images');
const IMAGES = [
  'IMG_3707.HEIC', 'IMG_3710.HEIC', 'IMG_3714.HEIC',
  'IMG_4052.HEIC', 'IMG_4053.HEIC', 'IMG_4054.HEIC', 'IMG_4055.HEIC',
  'IMG_4056.HEIC', 'IMG_4057.HEIC', 'IMG_4064.HEIC', 'IMG_4065.HEIC',
  'IMG_4066.HEIC', 'IMG_4067.HEIC', 'IMG_4068.HEIC', 'IMG_4069.HEIC',
  'IMG_4070.HEIC', 'IMG_4071.HEIC', 'IMG_4072.HEIC', 'IMG_4073.HEIC',
  'IMG_4076.HEIC', 'IMG_4077.HEIC', 'IMG_4080.HEIC', 'IMG_4081.HEIC',
  'IMG_4082.HEIC', 'IMG_4085.HEIC', 'IMG_4086.HEIC', 'IMG_4089.HEIC',
  'IMG_4090.HEIC', 'IMG_4091.HEIC', 'IMG_4094.HEIC', 'IMG_4099.HEIC',
  'IMG_4102.HEIC', 'IMG_4103.HEIC', 'IMG_4106.HEIC', 'IMG_4265.HEIC',
  'IMG_4282.HEIC', 'IMG_4283.HEIC', 'IMG_4049.HEIC', 'IMG_4051.HEIC'
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function convertHeicToJpeg(heicPath, outputPath) {
  try {
    const heicBuffer = fs.readFileSync(heicPath);
    
    // Decode HEIC using heic-decoder
    const decoded = await heicDecoder({ buffer: heicBuffer });
    
    // Get the first image frame
    const frame = decoded.frames[0];
    
    // Convert to JPEG using sharp
    await sharp(frame.data, {
      raw: {
        width: frame.width,
        height: frame.height,
        channels: 4
      }
    })
      .jpeg({ quality: 80, progressive: true })
      .resize(800, 800, { fit: 'inside', withoutEnlargement: true })
      .toFile(outputPath);
    
    console.log(`✓ Converted: ${path.basename(heicPath)} → ${path.basename(outputPath)}`);
    return outputPath;
  } catch (error) {
    console.error(`✗ Error converting ${heicPath}:`, error.message);
    return null;
  }
}

async function processAllImages() {
  console.log('Starting image conversion...\n');
  
  const results = [];
  
  for (const image of IMAGES) {
    const heicPath = path.join(SOURCE_DIR, image);
    const jpegName = image.replace('.HEIC', '.jpg');
    const outputPath = path.join(OUTPUT_DIR, jpegName);
    
    if (fs.existsSync(heicPath)) {
      const result = await convertHeicToJpeg(heicPath, outputPath);
      if (result) {
        results.push({
          original: image,
          converted: jpegName,
          path: outputPath
        });
      }
    } else {
      console.log(`⚠ File not found: ${heicPath}`);
    }
  }
  
  console.log(`\n✓ Successfully converted ${results.length}/${IMAGES.length} images`);
  console.log(`\nOutput directory: ${OUTPUT_DIR}`);
  
  // Save results to JSON for next step
  fs.writeFileSync(
    path.join(__dirname, 'converted-images.json'),
    JSON.stringify(results, null, 2)
  );
  
  return results;
}

processAllImages()
  .then(() => {
    console.log('\n✓ Conversion complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n✗ Conversion failed:', error);
    process.exit(1);
  });
