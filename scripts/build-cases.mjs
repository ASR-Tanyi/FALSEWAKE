import {execFileSync} from 'node:child_process';
import {mkdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('dist',{recursive:true});
const exports=['fd_version','fd_reset','fd_command','fd_state','fd_clue','fd_entry','fd_analysis','fd_compatible','fd_support','fd_reveal','fd_theory'];
execFileSync(process.env.CXX||'clang++',[
  '--target=wasm32','-std=c++17','-O2','-nostdlib','-fno-exceptions','-fno-rtti',
  '-fno-builtin','-fno-stack-protector','-Wall','-Wextra','-Werror','-Wl,--no-entry',
  '-Wl,--strip-all','-Wl,--initial-memory=131072','-Wl,--max-memory=131072',
  ...exports.map(e=>`-Wl,--export=${e}`),'core/cases.cpp','-o','dist/cases.wasm'
],{stdio:'inherit'});
console.log(`Built sealed-case rules and solver: ${(await stat('dist/cases.wasm')).size} bytes.`);
