const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const FULL_DIR = 'images/full';
const PLACEHOLDER_DIR = 'images/placeholders';

const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

// Get all subfolders in full directory
function getSubfolders(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

// Get all images in a directory
function getImages(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir).filter(file =>
        imageExtensions.includes(path.extname(file).toLowerCase())
    );
}

async function processImage(folder, image, index, total) {
    const inputPath = path.join(FULL_DIR, folder, image);
    const baseName = path.parse(image).name;

    console.log(`[${index + 1}/${total}] Processing: ${folder}/${image}`);

    // Ensure output directory exists
    const placeholderDir = path.join(PLACEHOLDER_DIR, folder);

    if (!fs.existsSync(placeholderDir)) {
        fs.mkdirSync(placeholderDir, { recursive: true });
    }

    // Generate placeholder (tiny, blurry, for loading state)
    const placeholderOutput = path.join(placeholderDir, `${baseName}.webp`);
    if (!fs.existsSync(placeholderOutput)) {
        try {
            await sharp(inputPath)
                .rotate() // Auto-rotate based on EXIF orientation
                .resize(40, 40, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .webp({ quality: 20, effort: 6 })
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
    const folders = getSubfolders(FULL_DIR);

    if (folders.length === 0) {
        console.log('No subfolders found in', FULL_DIR);
        console.log('Create folders like images/full/portfolio/ and add images to them.');
        process.exit(0);
    }

    console.log(`Found folders: ${folders.join(', ')}\n`);

    let totalImages = 0;
    const folderImages = {};

    // Count total images
    for (const folder of folders) {
        const images = getImages(path.join(FULL_DIR, folder));
        folderImages[folder] = images;
        totalImages += images.length;
    }

    if (totalImages === 0) {
        console.log('No images found in any subfolder.');
        process.exit(0);
    }

    console.log(`Found ${totalImages} images to process...\n`);

    let processed = 0;
    for (const folder of folders) {
        const images = folderImages[folder];
        if (images.length > 0) {
            console.log(`\n── ${folder} (${images.length} images) ──`);
            for (const image of images) {
                await processImage(folder, image, processed, totalImages);
                processed++;
            }
        }
    }

    console.log('\n✓ Done!');
    console.log(`  Placeholders: ${PLACEHOLDER_DIR}/<folder>/`);
}

main().catch(console.error);
