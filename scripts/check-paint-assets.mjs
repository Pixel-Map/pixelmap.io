import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

const root = new URL('../frontend/public/paint/vendor/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'));
for (const file of manifest.files) {
  const bytes = await readFile(new URL(file.file, root));
  if (createHash('sha256').update(bytes).digest('hex') !== file.sha256 || bytes.length !== file.bytes) {
    throw new Error(`Emulator asset differs from the pinned manifest: ${file.file}`);
  }
}
console.log(`Verified ${manifest.files.length} pinned emulator assets.`);
