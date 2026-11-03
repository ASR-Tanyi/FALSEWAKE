import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
process.chdir(fileURLToPath(new URL('../',import.meta.url)));
await mkdir('.build',{recursive:true});
execFileSync(process.env.CXX||'clang++',['-std=c++17','-O1','-g','-Wall','-Wextra','-Werror',
  '-fsanitize=address,undefined','-fno-omit-frame-pointer','core/cases.cpp','tests/cases-native.cpp','-o','.build/cases-native'],{stdio:'inherit'});
execFileSync('.build/cases-native',[],{stdio:'inherit'});
