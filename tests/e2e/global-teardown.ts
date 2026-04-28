import * as fs from 'fs';
import * as path from 'path';

/**
 * After the run, copy the fresh HTML report into an archive folder
 * stamped with the run timestamp so history is preserved across runs.
 */
export default async function globalTeardown() {
  const reportDir = path.join(__dirname, 'html-report');
  if (!fs.existsSync(reportDir)) return;

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
  const archiveRoot = path.join(__dirname, 'html-report-archive');
  const target = path.join(archiveRoot, stamp);

  if (!fs.existsSync(archiveRoot)) fs.mkdirSync(archiveRoot, { recursive: true });
  fs.mkdirSync(target, { recursive: true });

  copyDir(reportDir, target);

  // Also copy the JSON results for machine consumption
  const jsonResults = path.join(__dirname, 'test-results', 'results.json');
  if (fs.existsSync(jsonResults)) {
    fs.copyFileSync(jsonResults, path.join(target, 'results.json'));
  }
  console.log(`[global-teardown] HTML report archived → ${target}`);
}

function copyDir(src: string, dest: string) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}
