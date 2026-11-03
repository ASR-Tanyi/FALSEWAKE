import {t} from './i18n.js';
// Sealed-case ABI v2. The UI never reimplements the deduction rules.
const ERRORS=['','Invalid case, action, or seat.','This case is closed.','That testimony is already open.',
  'Choose exactly three different suspects.','That trio was already ruled out.','The case journal is full.'];
const integer=n=>Number.isInteger(n)&&n>=-2147483648&&n<=2147483647;
export class CaseEngine {
  constructor(api) {
    for(const key of ['fd_claim','fd_version','fd_reset','fd_command','fd_state','fd_clue','fd_entry','fd_analysis','fd_support','fd_reveal','fd_theory','fd_compatible'])
      if(typeof api[key]!=='function')throw new Error(t('Missing case engine export: {key}',{key}));
    if(api.fd_version()!==2)throw new Error(t('Incompatible case engine.'));
    this.api=api;this.history=[];this.reset(1);
  }
  reset(id=this.api.fd_state(0)) {
    if(!integer(id))throw new Error(t('Invalid case ID.'));
    const result=this.api.fd_reset(id);if(result)throw new Error(t(ERRORS[result]));
    this.history=[];return this.snapshot();
  }
  command(op,target) {
    if(![op,target].every(integer))throw new Error(t('Actions require integer arguments.'));
    const result=this.api.fd_command(op,target);if(result)throw new Error(t(ERRORS[result]||'Rejected action.'));
    this.history.push([op,target]);return this.snapshot();
  }
  replay(data) {
    if(!data||data.version!==2||![1,2].includes(data.caseId)||!Array.isArray(data.commands)||data.commands.length>15)
      throw new Error(t('Invalid or incompatible case replay.'));
    const before=this.export();
    try {
      this.reset(data.caseId);
      for(const command of data.commands) {
        if(!Array.isArray(command)||command.length!==2)throw new Error(t('Malformed replay command.'));
        this.command(...command);
      }
      return this.snapshot();
    } catch(error) {
      this.reset(before.caseId);for(const command of before.commands)this.command(...command);
      throw error; // Invalid imports are atomic: the existing investigation survives.
    }
  }
  export() {return {version:2,caseId:this.api.fd_state(0),commands:this.history.map(c=>[...c])};}
  theory(good,evil) {
    if(![good,evil].every(integer))throw new Error(t('Theory masks must be integers.'));
    const result=this.api.fd_theory(good,evil);
    if(result<0)throw new Error(t('Invalid theory.'));
    return result;
  }
  analysis() {
    const a=this.api;
    return {worlds:a.fd_analysis(0),teams:a.fd_analysis(1),good:a.fd_analysis(2),evil:a.fd_analysis(3),
      drunk:a.fd_analysis(4),mask:a.fd_analysis(5),support:Array.from({length:12},(_,i)=>[1,2,3,4].map(r=>a.fd_support(i,r)))};
  }
  snapshot() {
    const a=this.api;const status=a.fd_state(3),opened=a.fd_state(1);
    return {caseId:a.fd_state(0),opened,resolve:a.fd_state(2),status,
      clues:Array.from({length:12},(_,i)=>({id:i,claim:a.fd_claim(i),character:a.fd_reveal(i,3),read:!!(opened&(1<<i)),type:a.fd_clue(i,0),targets:a.fd_clue(i,1),value:a.fd_clue(i,2),
        role:a.fd_reveal(i,0),actual:a.fd_reveal(i,1),truth:a.fd_reveal(i,2)})),
      journal:Array.from({length:a.fd_state(4)},(_,i)=>({id:i,op:a.fd_entry(i,0),target:a.fd_entry(i,1),result:a.fd_entry(i,2)}))};
  }
}
export async function loadCases() {
  const response=await fetch(new URL('./cases.wasm',import.meta.url));
  if(!response.ok)throw new Error(t('Case engine download failed ({status}).',{status:response.status}));
  let module;try{module=await WebAssembly.instantiateStreaming(response.clone(),{});}
  catch{module=await WebAssembly.instantiate(await response.arrayBuffer(),{});}
  return new CaseEngine(module.instance.exports);
}
