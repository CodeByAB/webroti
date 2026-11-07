// PostToolUse (Edit/Write): run Prettier on the file that was just changed,
// so formatting never piles up until commit time (lefthook only checks).
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const FORMATTED = /\.(js|json|html|css|md|ya?ml)$/;

let input = '';
process.stdin.on('data', (d) => (input += d));
process.stdin.on('end', () => {
  let file = '';
  try {
    file = JSON.parse(input).tool_input?.file_path ?? '';
  } catch {
    process.exit(0);
  }
  const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  if (!FORMATTED.test(file) || path.relative(root, file).startsWith('..')) process.exit(0);
  try {
    // --ignore-path keeps public/vendor/ and CHANGELOG.md untouched.
    execFileSync(
      path.join(root, 'node_modules', '.bin', 'prettier'),
      ['--write', '--ignore-path', '.prettierignore', file],
      {
        cwd: root,
        stdio: ['ignore', 'ignore', 'pipe'],
        timeout: 25000,
      },
    );
  } catch (e) {
    // A syntax error mid-edit is normal; say so but don't block.
    process.stderr.write(`prettier skipped ${file}: ${e.stderr?.toString().split('\n')[0] ?? e.message}\n`);
  }
  process.exit(0);
});
