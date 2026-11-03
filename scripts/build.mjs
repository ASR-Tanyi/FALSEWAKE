import { mkdir, rm, cp, writeFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.chdir(root);
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
const exports = ['fw_version', 'fw_reset', 'fw_command', 'fw_state', 'fw_person', 'fw_event'];
try {
  execFileSync(process.env.CXX || 'clang++', [
    '--target=wasm32', '-std=c++17', '-O2', '-nostdlib', '-fno-exceptions',
    '-fno-rtti', '-fno-builtin', '-fno-stack-protector', '-Wall', '-Wextra', '-Werror',
    '-Wl,--no-entry', '-Wl,--strip-all', '-Wl,--initial-memory=131072',
    '-Wl,--max-memory=131072', ...exports.map(e => `-Wl,--export=${e}`),
    'core/engine.cpp', '-o', 'dist/core.wasm'
  ], { stdio: 'inherit' });
} catch (error) {
  console.error('WASM build failed. Install Clang and LLD, or set CXX to a compatible clang++ executable.');
  process.exit(1);
}
await cp('web', 'dist', { recursive: true });
await writeFile('dist/.nojekyll', '');
console.log(`Built dist/ (WASM: ${(await stat('dist/core.wasm')).size} bytes). No runtime dependencies.`);
