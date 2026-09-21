import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/images', { recursive: true });
const sources = {
  hero: 'bliss_Background.png',
  forest: 'forest_image.png',
  wildlife: 'image_with_elephant.png',
  water: 'water_lily_image.png',
  wellness: 'woman_massaging.png',
};
for (const [name, file] of Object.entries(sources)) {
  await sharp(file)
    .resize({ width: name === 'hero' ? 1974 : 1200, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(`public/images/${name}.webp`);
}
// Extract the nine supplied photographs from the existing contact sheet.
const cols = [
  [4, 424],
  [460, 423],
  [910, 421],
];
const rows = [
  [5, 364],
  [384, 359],
  [761, 404],
];
for (let y = 0; y < 3; y++)
  for (let x = 0; x < 3; x++) {
    await sharp('image_stack.png')
      .extract({ left: cols[x][0], top: rows[y][0], width: cols[x][1], height: rows[y][1] })
      .webp({ quality: 88 })
      .toFile(`public/images/gallery-${y * 3 + x + 1}.webp`);
  }
console.log('Prepared 14 optimized images from the supplied assets.');
