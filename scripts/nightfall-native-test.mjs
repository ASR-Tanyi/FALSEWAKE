import {mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('.build',{recursive:true});
execFileSync(process.env.CXX||'clang++',['-std=c++17','-O1','-g','-Wall','-Wextra','-Werror','-fsanitize=address,undefined','-fno-omit-frame-pointer','tests/nightfall-native.cpp','-o','.build/nightfall-native'],{stdio:'inherit'});
execFileSync('.build/nightfall-native',[],{stdio:'inherit'});
