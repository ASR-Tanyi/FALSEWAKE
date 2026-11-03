import {execFileSync} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
await mkdir('.build',{recursive:true});
execFileSync(process.env.CXX||'clang++',['-std=c++17','-O1','-g','-Wall','-Wextra','-Werror','-fno-omit-frame-pointer','-fsanitize=address,undefined','tests/native.cpp','-o','.build/native-test'],{stdio:'inherit'});
execFileSync('.build/native-test',[],{stdio:'inherit'});
