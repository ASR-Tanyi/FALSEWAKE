import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('.build',{recursive:true});
for(const caseName of ['nightfall','borrowed']){
 const binary=`.build/${caseName}-native`;
 execFileSync(process.env.CXX||'clang++',['-std=c++17','-O1','-g','-Wall','-Wextra','-Werror','-fsanitize=address,undefined','-fno-omit-frame-pointer',`tests/${caseName}-native.cpp`,'-o',binary],{stdio:'inherit'});
 execFileSync(binary,[],{stdio:'inherit'});
}
