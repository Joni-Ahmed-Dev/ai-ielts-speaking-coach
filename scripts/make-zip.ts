import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function createProjectBundles() {
  const outputDir = path.resolve('public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const zipPath = path.join(outputDir, 'ai-ielts-speaking-coach.zip');
  const tarPath = path.join(outputDir, 'ai-ielts-speaking-coach.tar.gz');

  // Remove old archives if they exist
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  if (fs.existsSync(tarPath)) fs.unlinkSync(tarPath);

  console.log('Generating updated project archives for GitHub deployment...');

  // Create zip using system zip command
  execSync(
    'zip -q -r public/ai-ielts-speaking-coach.zip . -x "node_modules/*" ".git/*" "dist/*" ".playwright-cli/*" ".aistudio/*" "public/ai-ielts-speaking-coach.zip" "public/ai-ielts-speaking-coach.tar.gz" "*.log"',
    { stdio: 'inherit' }
  );

  // Create tar.gz using system tar command
  execSync(
    'tar -czf public/ai-ielts-speaking-coach.tar.gz --exclude="./node_modules" --exclude="./.git" --exclude="./dist" --exclude="./.playwright-cli" --exclude="./.aistudio" --exclude="./public/ai-ielts-speaking-coach.zip" --exclude="./public/ai-ielts-speaking-coach.tar.gz" .',
    { stdio: 'inherit' }
  );

  const zipStat = fs.statSync(zipPath);
  const tarStat = fs.statSync(tarPath);

  console.log(`Zip archive updated: ${(zipStat.size / 1024).toFixed(1)} KB at ${zipPath}`);
  console.log(`Tar.gz archive updated: ${(tarStat.size / 1024).toFixed(1)} KB at ${tarPath}`);
}

createProjectBundles().catch((err) => {
  console.error('Failed to create bundles:', err);
  process.exit(1);
});
