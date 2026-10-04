const { mkdtempSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const { join, resolve } = require('node:path')
const { spawnSync } = require('node:child_process')

const output = mkdtempSync(join(tmpdir(), 'beans-request-diagnostics-'))
try {
  const compile = spawnSync(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--module', 'commonjs', '--target', 'es2022', '--lib', 'es2022,dom',
    '--esModuleInterop', '--strict', '--skipLibCheck', '--outDir', output,
    'test/testRequestDiagnostics.ts',
  ], { cwd: resolve(__dirname, '..'), stdio: 'inherit' })
  if (compile.error) throw compile.error
  if (compile.status !== 0) {
    process.exitCode = compile.status || 1
  } else {
    const tests = spawnSync(process.execPath, [
      '--test', join(output, 'test', 'testRequestDiagnostics.js'),
    ], { stdio: 'inherit' })
    if (tests.error) throw tests.error
    process.exitCode = tests.status || 0
    if (tests.signal) process.exitCode = 1
  }
} finally {
  rmSync(output, { recursive: true, force: true })
}
