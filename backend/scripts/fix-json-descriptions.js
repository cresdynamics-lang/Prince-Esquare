const fs = require('fs');
const path = require('path');

const main = () => {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Please provide a file path.');
    process.exit(1);
  }

  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  try {
    const fileContent = fs.readFileSync(absolutePath, 'utf8');

    const search = new RegExp('"description": "((?:.|
|)*?)"', 'g');
    const correctedContent = fileContent.replace(search, (match, description) => {
      const escapedDescription = description.replace(/
/g, '
').replace(//g, '');
      return `"description": "${escapedDescription}"`;
    });
    
    // Now that the newlines are escaped, the content should be valid JSON.
    JSON.parse(correctedContent);

    fs.writeFileSync(absolutePath, correctedContent);
    console.log(`Successfully fixed newlines in: ${absolutePath}`);
  } catch (error) {
    console.error(`Error processing file: ${absolutePath}`, error);
    process.exit(1);
  }
};

main();
