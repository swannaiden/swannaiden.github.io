#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';

const root = process.cwd();
const albumsDir = path.join(root, '_albums');
const dataDir = path.join(root, '_data', 'album_sizes');

const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });

const THUMB_WIDTH = 640; // thumbnail width for grid and album thumbs
const THUMB_HEIGHT = 400; // 16:10 aspect ratio to align rows

async function getImageSize(absPath) {
  try {
    const meta = await sharp(absPath).metadata();
    let width = meta.width ?? 0;
    let height = meta.height ?? 0;
    const orientation = meta.orientation ?? 1;
    if ([5, 6, 7, 8].includes(orientation)) {
      const tmp = width; width = height; height = tmp;
    }
    return { width, height };
  } catch (e) {
    return { width: 0, height: 0 };
  }
}

async function generateThumb(absSrc, absThumb, width = THUMB_WIDTH, height = THUMB_HEIGHT) {
  ensureDir(path.dirname(absThumb));
  await sharp(absSrc)
    .rotate() // auto-orient using EXIF
    .resize({ width, height, fit: 'cover', position: 'center', withoutEnlargement: true })
    .toFormat('webp')
    .toFile(absThumb);
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function processAlbum(file) {
  const albumPath = path.join(albumsDir, file);
  const raw = fs.readFileSync(albumPath, 'utf-8');
  const { data } = matter(raw);

  const title = data.title || path.parse(file).name;
  const slug = slugify(title);
  const imagesDir = data.images_dir;
  const coverImage = data.cover_image;

  if (!imagesDir) return;

  const absImagesDir = path.join(root, imagesDir.replace(/^\//, ''));
  const thumbsDir = path.join(absImagesDir, 'thumbs');
  ensureDir(thumbsDir);

  const sizes = {};

  const files = fs.readdirSync(absImagesDir)
    .filter(f => /\.(jpe?g|png|gif|webp)$/i.test(f));

  for (const imgName of files) {
    const absImg = path.join(absImagesDir, imgName);
    const thumbName = path.parse(imgName).name + '.webp';
    const absThumb = path.join(thumbsDir, thumbName);

    const { width, height } = await getImageSize(absImg);
    sizes[imgName] = { width, height };

    let needThumb = true;
    try {
      const srcStat = fs.statSync(absImg);
      const thStat = fs.statSync(absThumb);
      if (thStat.mtimeMs >= srcStat.mtimeMs) needThumb = false;
    } catch (_) {}

    if (needThumb) {
      await generateThumb(absImg, absThumb);
      console.log(`thumb: ${path.relative(root, absThumb)}`);
    }
  }

  if (coverImage) {
    const absCover = path.join(root, coverImage.replace(/^\//, ''));
    const coverThumb = path.join(thumbsDir, path.parse(path.basename(coverImage)).name + '.webp');
    try {
      let needThumb = true;
      const srcStat = fs.statSync(absCover);
      try {
        const thStat = fs.statSync(coverThumb);
        if (thStat.mtimeMs >= srcStat.mtimeMs) needThumb = false;
      } catch (_) {}
      if (needThumb) {
        await generateThumb(absCover, coverThumb);
        console.log(`cover thumb: ${path.relative(root, coverThumb)}`);
      }
    } catch (_) {}
  }

  ensureDir(dataDir);
  const outPath = path.join(dataDir, `${slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(sizes, null, 2));
  console.log(`sizes: ${path.relative(root, outPath)}`);
}

async function main() {
  ensureDir(albumsDir);
  ensureDir(path.join(root, '_data'));
  ensureDir(dataDir);
  const entries = fs.readdirSync(albumsDir).filter(f => f.endsWith('.md'));
  for (const file of entries) {
    // eslint-disable-next-line no-await-in-loop
    await processAlbum(file);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 