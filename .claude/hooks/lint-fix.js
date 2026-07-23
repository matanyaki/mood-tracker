const path = require('path');
const { execFileSync } = require('child_process');

let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(input);
  } catch {
    return;
  }

  const file = payload?.tool_input?.file_path ?? payload?.tool_response?.filePath;
  if (!file || !/\.tsx?$/.test(file)) return;

  const repoRoot = path.resolve(__dirname, '..', '..');
  const inServer = /[\\/]server[\\/]/.test(file);
  const cwd = inServer ? path.join(repoRoot, 'server') : repoRoot;

  try {
    execFileSync('npx', ['eslint', '--fix', '--no-warn-ignored', file], {
      cwd,
      stdio: 'ignore',
      shell: true,
    });
  } catch {
    // eslint exits non-zero on remaining lint errors after --fix; that's fine, not a hook failure
  }
});
