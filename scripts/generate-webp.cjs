/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");
const sharp = require("sharp");

const ROOT = process.cwd();
const ASSETS_ROOT = path.join(ROOT, "src", "assets");
const INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".jfif"]);
const WEBP_QUALITY = 90;
const AVIF_QUALITY = 58;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function shouldSkipOutput(inputPath, outputPath) {
  const sourceStat = await fs.stat(inputPath);
  const outputExists = await fileExists(outputPath);
  if (!outputExists) return false;
  const outputStat = await fs.stat(outputPath);
  return outputStat.mtimeMs >= sourceStat.mtimeMs;
}

async function main() {
  const allFiles = await walk(ASSETS_ROOT);
  const inputFiles = allFiles.filter((filePath) =>
    INPUT_EXTENSIONS.has(path.extname(filePath).toLowerCase()),
  );

  let webpConverted = 0;
  let webpSkipped = 0;
  let webpFailed = 0;
  let avifConverted = 0;
  let avifSkipped = 0;
  let avifFailed = 0;

  for (const inputPath of inputFiles) {
    const ext = path.extname(inputPath);
    const webpOutputPath = inputPath.slice(0, -ext.length) + ".webp";
    const avifOutputPath = inputPath.slice(0, -ext.length) + ".avif";
    if (await shouldSkipOutput(inputPath, webpOutputPath)) {
      webpSkipped += 1;
    } else {
      try {
        await sharp(inputPath).webp({ quality: WEBP_QUALITY }).toFile(webpOutputPath);
        webpConverted += 1;
      } catch (error) {
        webpFailed += 1;
        console.error(`WebP failed: ${path.relative(ROOT, inputPath)} -> ${error.message}`);
      }
    }

    if (await shouldSkipOutput(inputPath, avifOutputPath)) {
      avifSkipped += 1;
    } else {
      try {
        await sharp(inputPath).avif({ quality: AVIF_QUALITY }).toFile(avifOutputPath);
        avifConverted += 1;
      } catch (error) {
        avifFailed += 1;
        console.error(`AVIF failed: ${path.relative(ROOT, inputPath)} -> ${error.message}`);
      }
    }
  }

  console.log(
    `Image generation complete. WebP converted: ${webpConverted}, skipped: ${webpSkipped}, failed: ${webpFailed}. AVIF converted: ${avifConverted}, skipped: ${avifSkipped}, failed: ${avifFailed}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
