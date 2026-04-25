const fs = require("fs");
const path = require("path");

const socksDir = path.resolve(__dirname, "../src/assets/catalog/socks");
if (!fs.existsSync(socksDir)) {
  console.log("socks directory not found");
  process.exit(0);
}

const files = fs
  .readdirSync(socksDir, { withFileTypes: true })
  .filter((e) => e.isFile())
  .map((e) => e.name);

function slugify(value) {
  return (
    value
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .toLowerCase()
      .replace(/\([^)]*\)/g, " ")
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .replace(/-+/g, "-") || "item"
  );
}

const used = new Set(files.map((f) => f.toLowerCase()));
const moved = [];

for (const fileName of files) {
  const ext = path.extname(fileName).toLowerCase();
  const stem = path.basename(fileName, ext);
  const normalizedStem = slugify(stem).replace(/^socks-/, "");
  const base = `socks-${normalizedStem}`;

  let candidate = `${base}${ext}`;
  let i = 1;
  while (used.has(candidate.toLowerCase())) {
    i += 1;
    candidate = `${base}-${i}${ext}`;
  }

  if (candidate === fileName) continue;

  fs.renameSync(path.join(socksDir, fileName), path.join(socksDir, candidate));
  used.add(candidate.toLowerCase());
  moved.push({ from: fileName, to: candidate });
}

fs.writeFileSync(
  path.join(socksDir, "rename-report.json"),
  JSON.stringify({ renamed_count: moved.length, renamed: moved }, null, 2),
);

console.log(`renamed=${moved.length}`);
