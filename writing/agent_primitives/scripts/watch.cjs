// Rebuild on saved content changes. No additional packages required.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function snapshot() {
  const files = new Set(['layout.json', 'scripts/build.cjs', 'scripts/references.cjs', 'scripts/slide-menus.cjs']);
  function collect(directory) {
    try {
      for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
        const name = path.join(directory, entry.name);
        if (entry.isDirectory()) collect(name);
        else if (entry.isFile() && /\.md$/i.test(entry.name)) files.add(name);
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  collect('sections');
  // Also support section files placed elsewhere within this project.
  try {
    const layout = JSON.parse(fs.readFileSync(path.join(root, 'layout.json'), 'utf8'));
    if (typeof layout.references?.bibliography === 'string') {
      const file = path.resolve(root, layout.references.bibliography);
      if (file.startsWith(root + path.sep)) files.add(path.relative(root, file));
    }
    for (const section of layout.sections || []) {
      if (typeof section.file !== 'string') continue;
      const file = path.resolve(root, section.file);
      if (file.startsWith(root + path.sep)) files.add(path.relative(root, file));
    }
  } catch { /* The build reports invalid JSON; keep watching for a correction. */ }
  const hash = crypto.createHash('sha256');
  for (const file of [...files].sort()) {
    hash.update(file + '\0');
    try { hash.update(fs.readFileSync(path.join(root, file))); }
    catch (error) { hash.update(`unavailable:${error.code}`); }
    hash.update('\0');
  }
  return hash.digest('hex');
}

function build() {
  const result = spawnSync(process.execPath, [path.join(__dirname, 'build.cjs')], {
    cwd: root,
    stdio: 'inherit'
  });
  if (result.error) console.error(`Could not start build: ${result.error.message}`);
  if (result.status !== 0) console.error('Waiting for a correction; the last successful page is preserved.');
  else console.log('Refresh your browser to see the updated page.');
}

let previous = snapshot();
let pending = false;
build();
console.log('Watching layout.json, Markdown sections, and the bibliography. Press Ctrl+C to stop.');
// Poll contents to handle editor atomic saves, new files, and renamed folders.
// Wait for one unchanged poll before building to coalesce multi-file saves.
const timer = setInterval(() => {
  try {
    const current = snapshot();
    if (current !== previous) {
      previous = current;
      pending = true;
    } else if (pending) {
      pending = false;
      build();
    }
  } catch (error) {
    console.error(`Could not check for changes: ${error.message}`);
  }
}, 400);

for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  clearInterval(timer);
  process.exit(0);
});
