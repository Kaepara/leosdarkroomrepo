const sharp = require('sharp');
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

async function processImage(image, index) {
    const inputPath = path.join(FULL_DIR, image);
    const baseName = path.parse(image).name;

    console.log(`[${index + 1}/${images.length}] Processing: ${image}`);

    // Generate compressed version (quality 80, max width 2000px)
    const compressedOutput = path.join(COMPRESSED_DIR, `${baseName}.webp`);
    if (!fs.existsSync(compressedOutput)) {
        try {
            await sharp(inputPath)
                .resize(2000, null, { withoutEnlargement: true })
                .webp({ quality: 80 })
                .toFile(compressedOutput);
            console.log(`   ✓ Compressed: ${baseName}.webp`);
        } catch (err) {
            console.error(`   ✗ Failed to compress: ${err.message}`);
        }
    } else {
        console.log(`   ○ Compressed exists: ${baseName}.webp`);
    }

    // Generate placeholder version (quality 20, width 40px)
    const placeholderOutput = path.join(PLACEHOLDER_DIR, `${baseName}.webp`);
    if (!fs.existsSync(placeholderOutput)) {
        try {
            await sharp(inputPath)
                .resize(40, null)
                .webp({ quality: 20 })
                .toFile(placeholderOutput);
            console.log(`   ✓ Placeholder: ${baseName}.webp`);
        } catch (err) {
            console.error(`   ✗ Failed to create placeholder: ${err.message}`);
        }
    } else {
        console.log(`   ○ Placeholder exists: ${baseName}.webp`);
    }
}

async function main() {
    for (let i = 0; i < images.length; i++) {
        await processImage(images[i], i);
    }

    console.log('\n✓ Done! Images are ready.');
    console.log(`  Compressed images: ${COMPRESSED_DIR}/`);
    console.log(`  Placeholder images: ${PLACEHOLDER_DIR}/`);
}

main().catch(console.error);
