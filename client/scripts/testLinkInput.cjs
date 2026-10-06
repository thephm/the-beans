const { mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const { spawnSync } = require('node:child_process')

const root = resolve(__dirname, '..')
const output = mkdtempSync(join(tmpdir(), 'beans-link-input-'))
try {
  const compile = spawnSync(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--module', 'commonjs', '--target', 'es2022', '--lib', 'es2022,dom',
    '--jsx', 'react-jsx', '--esModuleInterop', '--strict', '--skipLibCheck',
    '--outDir', output, 'test/testLinkInput.tsx',
  ], { cwd: root, stdio: 'inherit' })
  if (compile.error) throw compile.error
  if (compile.status !== 0) {
    process.exitCode = compile.status || 1
  } else {
    const tests = spawnSync(process.execPath, [
      '--test', join(output, 'test', 'testLinkInput.js'),
    ], {
      cwd: root,
      env: { ...process.env, NODE_PATH: join(root, 'node_modules') },
      stdio: 'inherit',
    })
    if (tests.error) throw tests.error
    process.exitCode = tests.status || 0
    if (tests.signal) process.exitCode = 1
  }
} finally {
  rmSync(output, { recursive: true, force: true })
}
