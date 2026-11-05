import {execFileSync} from 'node:child_process';
import {mkdir,stat} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('dist',{recursive:true});
const exports=['fn_version','fn_reset','fn_select','fn_command','fn_state','fn_person','fn_event','fn_entry','fn_analysis','fn_report_truth'];
execFileSync(process.env.CXX||'clang++',['--target=wasm32','-std=c++17','-O2','-nostdlib','-fno-exceptions','-fno-rtti','-fno-builtin','-fno-stack-protector','-Wall','-Wextra','-Werror','-Wl,--no-entry','-Wl,--strip-all','-Wl,--initial-memory=131072','-Wl,--max-memory=131072',...exports.map(e=>`-Wl,--export=${e}`),'core/nightfall.cpp','-o','dist/nightfall.wasm'],{stdio:'inherit'});
console.log(`nightfall.wasm: ${(await stat('dist/nightfall.wasm')).size} bytes; two shared-core cases.`);
