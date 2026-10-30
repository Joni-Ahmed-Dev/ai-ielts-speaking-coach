import fs from 'fs';
import path from 'path';
import * as archiverModule from 'archiver';
const archiver = (archiverModule as any).default || archiverModule;

async function createProjectZip() {
  const outputDir = path.resolve('public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zipPath = path.join(outputDir, 'ai-ielts-speaking-coach.zip');
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', {
    zlib: { level: 9 },
  });

  output.on('close', () => {
    console.log(`Zip created successfully: ${archive.pointer()} total bytes at ${zipPath}`);
  });

  archive.on('error', (err) => {
    throw err;
  });

  archive.pipe(output);

  // Add all files from root
  const rootDir = path.resolve('.');
  archive.glob('**/*', {
    cwd: rootDir,
    ignore: [
      'node_modules/**',
      '.playwright-cli/**',
      'dist/**',
      '.aistudio/**',
      '.git/**',
      'public/ai-ielts-speaking-coach.zip',
      'public/ai-ielts-speaking-coach.tar.gz',
      '*.log',
      'coverage/**',
    ],
    dot: true, // include .github, .gitignore, .devcontainer
  });

  await archive.finalize();
}

createProjectZip().catch((err) => {
  console.error('Failed to create zip:', err);
  process.exit(1);
});
