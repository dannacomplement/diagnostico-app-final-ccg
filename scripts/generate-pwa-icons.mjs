import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');

const svgBuffer = readFileSync(resolve(publicDir, 'icon-complement.svg'));

const sizes = [192, 512];

mkdirSync(publicDir, { recursive: true });

for (const size of sizes) {
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(resolve(publicDir, `pwa-${size}x${size}.png`));
  console.log(`Generated pwa-${size}x${size}.png`);
}

// Maskable icon (with padding for safe zone)
const maskableSize = 512;
const iconSize = Math.round(maskableSize * 0.8);
const padding = Math.round((maskableSize - iconSize) / 2);

const icon = await sharp(svgBuffer).resize(iconSize, iconSize).png().toBuffer();

await sharp({
  create: { width: maskableSize, height: maskableSize, channels: 4, background: { r: 27, g: 42, b: 74, alpha: 1 } }
})
  .composite([{ input: icon, left: padding, top: padding }])
  .png()
  .toFile(resolve(publicDir, 'pwa-maskable-512x512.png'));

console.log('Generated pwa-maskable-512x512.png');

// Apple touch icon (180x180)
await sharp(svgBuffer)
  .resize(180, 180)
  .png()
  .toFile(resolve(publicDir, 'apple-touch-icon.png'));

console.log('Generated apple-touch-icon.png');
