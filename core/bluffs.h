#pragma once
// Portable deterministic randomness for disguises, not hidden-team generation.
// A positive seed uses a 90% unused / 10% existing-Citizen-claim policy.
// Seed 0 is the curated, duplicate-free introductory script.
namespace bluff {
inline unsigned next(unsigned &state) {
    state ^= state << 13; state ^= state >> 17; state ^= state << 5;
    return state;
}
inline unsigned bounded(unsigned &state,unsigned bound) {
    // Rejection sampling avoids modulo bias. Xorshift never returns zero.
    const unsigned limit=0xffffffffu-(0xffffffffu%bound);
    unsigned value; do {value=next(state)-1u;} while(value>=limit);
    return value%bound;
}
inline int choose(unsigned &state,const int *unused,int unusedCount,
                  const int *copies,int copyCount) {
    bool copy=bounded(state,10)==0;
    if(copy&&copyCount)return copies[bounded(state,unsigned(copyCount))];
    if(unusedCount)return unused[bounded(state,unsigned(unusedCount))];
    return copyCount?copies[bounded(state,unsigned(copyCount))]:0;
}
}
