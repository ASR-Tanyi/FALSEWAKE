// Sealed-dawn deduction rules. No DOM, allocation, time, or random imports.
// Every solver input is public: case rules, opened statements, rejected trios.
// It never consults the authored solution while enumerating possible worlds.
namespace fd {
constexpr int N=12, ALL=(1<<N)-1, CAP=32;
struct Clue { int type, targets, value; }; // 1 true Evil; 2 registered Evil; 3 Good Burdens.
struct Case { int evil, drunk, mask; Clue clues[N]; };
constexpr Case cases[] = {
  {1154,5,-1,{
    {1,2084,0},
    {1,1064,3},
    {1,1896,1},
    {1,2084,0},
    {1,3074,2},
    {1,644,0},
    {1,3666,2},
    {1,644,3},
    {1,1434,3},
    {1,2672,0},
    {1,3074,2},
    {1,524,0}
  }},
  {577,2,8,{
    {3,2084,1},
    {2,14,0},
    {2,1034,3},
    {1,1326,0},
    {3,14,1},
    {2,2564,1},
    {1,2144,1},
    {2,74,1},
    {3,74,0},
    {1,44,1},
    {2,1266,1},
    {2,644,1}
  }}
};
struct Entry {int op, target, result;};
Entry journal[CAP];
int active=0, opened=0, resolve=3, status=0, size=0;
int rejected[3], rejectedSize=0;
bool dirty=true;
int worlds=0, teams=0, good=0, evil=0, drunk=0, mask=0;
int support[N][4]; // Witness, Drunk, Devilmask, Conspirator.
bool valid(int i) {return i>=0 && i<N;}
int bit(int i) {return i<0?0:(1<<i);}
int pop(int x) {int n=0;for(;x;x&=x-1)++n;return n;}
int actual(const Clue &c,int e,int d,int m) {
    const int subjects=c.type==1?e:c.type==2?(e|bit(m)):(bit(d)|bit(m));
    return pop(subjects & c.targets);
}
bool compatible(int e,int d,int m) {
    if(e<0 || e>ALL || pop(e)!=3 || !valid(d) || (e&bit(d))) return false;
    // Which roles exist is a public case rule, not a hidden roster lookup.
    if(active==0) {if(m!=-1) return false;}
    else if(!valid(m)||m==d||(e&bit(m))) return false;
    for(int i=0;i<rejectedSize;++i) if(rejected[i]==e) return false;
    for(int i=0;i<N;++i) if(opened&bit(i)) {
        if(e&bit(i)) continue; // Evil may tell the truth OR lie.
        const auto &c=cases[active].clues[i];
        const bool matches=c.value==actual(c,e,d,m);
        if(i==d?matches:!matches) return false;
    }
    return true;
}
void analyze() {
    if(!dirty) return;
    worlds=teams=0;good=evil=drunk=mask=ALL;
    for(int i=0;i<N;++i) for(int r=0;r<4;++r) support[i][r]=0;
    for(int e=0;e<=ALL;++e) if(pop(e)==3) {
        bool seen=false;
        for(int d=0;d<N;++d) if(!(e&bit(d))) {
            const int start=active==0?-1:0, end=active==0?0:N;
            for(int m=start;m<end;++m) if(compatible(e,d,m)) {
                ++worlds;seen=true;
                good&=(ALL^e);evil&=e;drunk&=bit(d);mask&=bit(m);
                for(int i=0;i<N;++i) ++support[i][e&bit(i)?3:i==d?1:i==m?2:0];
            }
        }
        if(seen) ++teams;
    }
    if(!worlds) good=evil=drunk=mask=0;
    dirty=false;
}
int reset(int id) {
    if(id<1||id>2) return 1;
    active=id-1;opened=0;resolve=3;status=0;size=0;rejectedSize=0;dirty=true;
    return 0;
}
int command(int op,int target) {
    if(status) return 2;
    if(size>=CAP) return 6;
    if(op==1) {
        if(!valid(target)) return 1;
        if(opened&bit(target)) return 3;
        opened|=bit(target);journal[size++]={op,target,0};
    } else if(op==2) {
        if(target<0||target>ALL||pop(target)!=3) return 4;
        for(int i=0;i<rejectedSize;++i) if(rejected[i]==target) return 5;
        if(target==cases[active].evil) status=1;
        else {rejected[rejectedSize++]=target;--resolve;if(!resolve)status=2;}
        journal[size++]={op,target,status==1?1:0};
    } else return 1;
    dirty=true;
    return 0;
}
}
extern "C" {
int fd_version() {return 1;}
int fd_reset(int id) {return fd::reset(id);}
int fd_command(int op,int target) {return fd::command(op,target);}
// case ID, opened bitset, Resolve, status (0 playing, 1 won, 2 lost), journal size.
int fd_state(int field) {
    switch(field) {case 0:return fd::active+1;case 1:return fd::opened;case 2:return fd::resolve;
      case 3:return fd::status;case 4:return fd::size;default:return -1;}
}
// No statement data is exposed before reading it, except during the debrief.
int fd_clue(int seat,int field) {
    if(!fd::valid(seat)||(!(fd::opened&fd::bit(seat))&&!fd::status)) return -1;
    const auto &c=fd::cases[fd::active].clues[seat];
    switch(field) {case 0:return c.type;case 1:return c.targets;case 2:return c.value;default:return -1;}
}
int fd_entry(int index,int field) {
    if(index<0||index>=fd::size) return -1;
    const auto &e=fd::journal[index];
    switch(field) {case 0:return e.op;case 1:return e.target;case 2:return e.result;default:return -1;}
}
// Evidence-only analysis: assignment count, distinct evil trios, forced Good/Evil/Drunk/Mask.
int fd_analysis(int field) {
    fd::analyze();
    switch(field) {case 0:return fd::worlds;case 1:return fd::teams;case 2:return fd::good;
      case 3:return fd::evil;case 4:return fd::drunk;case 5:return fd::mask;default:return -1;}
}
// Test a complete hypothetical assignment against public evidence, NOT actual identity.
int fd_compatible(int evil,int drunk,int mask) {return fd::compatible(evil,drunk,mask)?1:0;}
int fd_support(int seat,int role) {
    if(!fd::valid(seat)||role<1||role>4) return -1;
    fd::analyze();return fd::support[seat][role-1];
}
// Truth is only available after the case ends: role (1..4), actual value, report true.
int fd_reveal(int seat,int field) {
    if(!fd::valid(seat)||!fd::status) return -1;
    const auto &c=fd::cases[fd::active];
    const int value=fd::actual(c.clues[seat],c.evil,c.drunk,c.mask);
    switch(field) {case 0:return (c.evil&fd::bit(seat))?4:seat==c.drunk?2:seat==c.mask?3:1;
      case 1:return value;case 2:return value==c.clues[seat].value;default:return -1;}
}
}
extern "C" int fd_theory(int good,int evil) {
    if(good<0||good>fd::ALL||evil<0||evil>fd::ALL||(good&evil)) return -1;
    int count=0;
    for(int e=0;e<=fd::ALL;++e) if(fd::pop(e)==3&&!(e&good)&&(e&evil)==evil)
        for(int d=0;d<fd::N;++d) if(!(e&fd::bit(d)))
            for(int m=fd::active==0?-1:0;m<(fd::active==0?0:fd::N);++m)
                if(fd::compatible(e,d,m)) ++count;
    return count;
}
