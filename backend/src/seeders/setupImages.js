/**
 * Image setup script — copies seed product images from the brain artifacts directory
 * to public/uploads so the seeder can reference them.
 * Run automatically as part of npm run seed.
 */
const fs = require('fs');
const path = require('path');

const destDir = path.join(__dirname, '../../public/uploads');

// Ensure uploads directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Map of seed image filenames to create (as minimal placeholder SVGs if no real images found)
const seedImages = [
  'product1_1.jpg', 'product1_2.jpg',
  'product2_1.jpg', 'product2_2.jpg',
  'product3_1.jpg',
  'product4_1.jpg', 'product4_2.jpg',
  'product5_1.jpg',
  'product6_1.jpg', 'product6_2.jpg',
  'product7_1.jpg',
  'product8_1.jpg', 'product8_2.jpg', 'product8_3.jpg',
  'product9_1.jpg',
  'product10_1.jpg',
];

// Try to copy from brain artifacts directory first
const brainDir = path.join(__dirname, '../../../../brain');
const convId = 'b9ac678d-a83a-4a09-b1bf-c9d655f0ff4c';
const artifactsDir = path.join(brainDir, convId);

const productImageMapping = {
  'product1_1': ['product1_1', 'product1_2'],
  'product2_1': ['product2_1', 'product2_2'],
  'product3_1': ['product3_1'],
  'product4_1': ['product4_1', 'product4_2'],
  'product5_1': ['product5_1'],
  'product6_1': ['product6_1', 'product6_2'],
  'product7_1': ['product7_1'],
  'product8_1': ['product8_1', 'product8_2', 'product8_3'],
  'product9_1': ['product9_1'],
  'product10_1': ['product10_1'],
};

let copied = 0;

if (fs.existsSync(artifactsDir)) {
  const artifactFiles = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.png'));

  for (const [prefix, destNames] of Object.entries(productImageMapping)) {
    const match = artifactFiles.find(f => f.startsWith(prefix + '_') && f.endsWith('.png'));
    if (match) {
      const src = path.join(artifactsDir, match);
      for (const destName of destNames) {
        const dest = path.join(destDir, destName + '.jpg');
        if (!fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          console.log(`  📸 Copied: ${match} → ${destName}.jpg`);
          copied++;
        }
      }
    }
  }
}

// For any missing images, create an SVG placeholder
for (const imgName of seedImages) {
  const destPath = path.join(destDir, imgName);
  if (!fs.existsSync(destPath)) {
    // Create a styled SVG placeholder that renders in browsers
    const productNum = imgName.match(/product(\d+)/)?.[1] || '?';
    const colors = ['#DE0A26', '#8a1010', '#5a0a0a', '#2a2a2a', '#1a1a1a'];
    const color = colors[parseInt(productNum) % colors.length];

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#1a1a1a"/>
  <rect x="0" y="0" width="400" height="4" fill="${color}"/>
  <text x="200" y="180" text-anchor="middle" font-family="Arial" font-size="72" fill="${color}">⚡</text>
  <text x="200" y="230" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold" fill="#f0f0f0">METALLICA MERCH</text>
  <text x="200" y="255" text-anchor="middle" font-family="Arial" font-size="12" fill="#8a8a8a">Product #${productNum}</text>
  <rect x="50" y="280" width="300" height="1" fill="#333"/>
  <text x="200" y="310" text-anchor="middle" font-family="Arial" font-size="11" fill="#555">🤘 For The Love of Metal</text>
</svg>`;

    // Write as SVG but with .jpg extension (browsers will still render it)
    fs.writeFileSync(destPath, svgContent, 'utf8');
    console.log(`  🎨 Created placeholder: ${imgName}`);
    copied++;
  }
}

console.log(`✅ Image setup complete. ${copied} image(s) processed.`);
module.exports = { setupImages: () => { } };
