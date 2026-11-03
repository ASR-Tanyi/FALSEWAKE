import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
process.chdir(fileURLToPath(new URL('../', import.meta.url)));
await mkdir('.build', { recursive: true });
execFileSync(process.env.CXX || 'clang++', ['-std=c++17', '-Wall', '-Wextra', '-Werror',
  '-fsanitize=address,undefined', '-g', 'tests/native.cpp', '-o', '.build/native-test'], { stdio: 'inherit' });
execFileSync('.build/native-test', [], { stdio: 'inherit' });
