import {mkdir,rm,cp,writeFile,stat} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const [source,name,exports] of [
 ['engine.cpp','core',['fw_version','fw_reset','fw_command','fw_state','fw_person','fw_event']],
 ['cases.cpp','cases',['fd_version','fd_reset','fd_command','fd_state','fd_clue','fd_claim','fd_entry','fd_analysis','fd_support','fd_reveal','fd_theory','fd_compatible']]
]){
 execFileSync(process.env.CXX||'clang++',['--target=wasm32','-std=c++17','-O2','-nostdlib','-fno-exceptions','-fno-rtti','-fno-builtin','-fno-stack-protector','-Wall','-Wextra','-Werror','-Wl,--no-entry','-Wl,--strip-all','-Wl,--initial-memory=131072','-Wl,--max-memory=131072',...exports.map(e=>`-Wl,--export=${e}`),`core/${source}`,'-o',`dist/${name}.wasm`],{stdio:'inherit'});
 console.log(`${name}.wasm: ${(await stat(`dist/${name}.wasm`)).size} bytes`);
}
await cp('web','dist',{recursive:true});await writeFile('dist/.nojekyll','');
