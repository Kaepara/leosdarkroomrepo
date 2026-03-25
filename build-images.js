const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FULL_DIR = 'images/full';
const COMPRESSED_DIR = 'images/compressed';
const PLACEHOLDER_DIR = 'images/placeholders';

// Ensure output directories exist
[COMPRESSED_DIR, PLACEHOLDER_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Get all image files from full directory
const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
const images = fs.readdirSync(FULL_DIR).filter(file =>
    imageExtensions.includes(path.extname(file).toLowerCase())
);

if (images.length === 0) {
    console.log('No images found in', FULL_DIR);
    console.log('Add your original images to the images/full/ folder first.');
    process.exit(0);
}

console.log(`Found ${images.length} images to process...\n`);

function processImage(image, index) {
    const inputPath = path.join(FULL_DIR, image);
    const baseName = path.parse(image).name;

    console.log(`[${index + 1}/${images.length}] Processing: ${image}`);

    // Generate compressed version using Squoosh
    const compressedOutput = path.join(COMPRESSED_DIR, `${baseName}.webp`);
    if (!fs.existsSync(compressedOutput)) {
        try {
            execSync(`npx @squoosh/cli --webp "{quality: 80, effort: 4}" --resize "{width: 2000}" "${inputPath}" -d "${COMPRESSED_DIR}" -o "${baseName}"`, {
                stdio: 'pipe'
            });
            console.log(`   ✓ Compressed: ${baseName}.webp`);
        } catch (err) {
            console.error(`   ✗ Failed to compress: ${err.message}`);
        }
    } else {
        console.log(`   ○ Compressed exists: ${baseName}.webp`);
    }

    // Generate placeholder version using Squoosh
    const placeholderOutput = path.join(PLACEHOLDER_DIR, `${baseName}.webp`);
    if (!fs.existsSync(placeholderOutput)) {
        try {
            execSync(`npx @squoosh/cli --webp "{quality: 20, effort: 4}" --resize "{width: 40}" "${inputPath}" -d "${PLACEHOLDER_DIR}" -o "${baseName}"`, {
                stdio: 'pipe'
            });
            console.log(`   ✓ Placeholder: ${baseName}.webp`);
        } catch (err) {
            console.error(`   ✗ Failed to create placeholder: ${err.message}`);
        }
    } else {
        console.log(`   ○ Placeholder exists: ${baseName}.webp`);
    }
}

function main() {
    for (let i = 0; i < images.length; i++) {
        processImage(images[i], i);
    }

    console.log('\n✓ Done! Images are ready.');
    console.log(`  Compressed images: ${COMPRESSED_DIR}/`);
    console.log(`  Placeholder images: ${PLACEHOLDER_DIR}/`);
}

main();
