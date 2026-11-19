import { access, copyFile, mkdir, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const screenshotsSource = fileURLToPath(new URL('../../../docs/screenshots/', import.meta.url));
const screenshotsTarget = fileURLToPath(new URL('../public/screenshots/', import.meta.url));
const iconSource = fileURLToPath(new URL('../../../public/app-icon.svg', import.meta.url));
const iconTarget = fileURLToPath(new URL('../public/app-icon.svg', import.meta.url));

await mkdir(screenshotsTarget, { recursive: true });

for (const name of await readdir(screenshotsSource)) {
  if (!/\.(png|jpe?g|webp)$/i.test(name)) continue;
  await copyFile(`${screenshotsSource}/${name}`, `${screenshotsTarget}/${name}`);
}

try {
  await access(iconSource);
  await copyFile(iconSource, iconTarget);
} catch {
  const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <rect width="64" height="64" rx="16" fill="#009957"/>
  <circle cx="24" cy="28" r="4" fill="#ffffff"/>
  <circle cx="40" cy="28" r="4" fill="#ffffff"/>
  <path d="M22 40c2.8 3.2 17.2 3.2 20 0" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round"/>
</svg>\n`;
  await writeFile(iconTarget, fallbackSvg, 'utf-8');
}
