import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('.build',{recursive:true});
execFileSync(process.env.CXX||'clang++',['-std=c++17','-g','-O1','-Wall','-Wextra','-Werror','-fsanitize=address,undefined','-fno-omit-frame-pointer','tests/hollow-native.cpp','-o','.build/hollow-native'],{stdio:'inherit'});
execFileSync('.build/hollow-native',[],{stdio:'inherit'});
console.log('The hollow ward: all 24 worlds have a safe evidence-only win policy; removal and compatibility passed.');
