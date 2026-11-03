// FALSEWAKE sealed dawn v0.4. Numeric ABI v2; no true-team investigation.
// Only opened testimony and public rules constrain the exhaustive solver.
namespace fd {
constexpr int N=12,ALL=(1<<N)-1,CAP=32;
// presence, exact living-neighbor count, single, same, both, Burden, impaired, XOR.
struct Clue {int type,targets,value;};
struct Case {int evil,drunk,mask;int claims[N];Clue clues[N];};
constexpr Case cases[]={
  {1408,9,-1,{4,11,8,9,3,12,6,5,7,1,2,10},{
    {1,3584,1},
    {6,512,1},
    {1,56,0},
    {1,7,0},
    {1,4032,1},
    {7,512,1},
    {8,2050,0},
    {4,3072,1},
    {5,513,1},
    {2,1280,0},
    {3,2048,1},
    {3,32,0}
  }},
  {2208,10,3,{8,3,7,1,6,4,9,10,11,5,12,2},{
    {1,14,1},
    {1,4032,1},
    {5,160,1},
    {2,20,0},
    {8,2560,1},
    {1,1792,0},
    {1,56,1},
    {3,2,1},
    {6,8,1},
    {4,12,0},
    {7,128,1},
    {3,1,1}
  }},
};
struct Entry {int op,target,result;};
Entry journal[CAP];
int active=0,opened=0,resolve=3,status=0,size=0;
int rejected[3],rejectedSize=0;
bool dirty=true;
int worlds=0,teams=0,good=0,evil=0,drunk=0,mask=0,support[N][4];
bool valid(int i){return i>=0&&i<N;}
int bit(int i){return valid(i)?1<<i:0;}
int pop(int x){int n=0;for(;x;x&=x-1)++n;return n;}
int actual(const Clue &c,int e,int d,int m){
    const int observed=e|bit(m),n=pop(observed&c.targets);
    switch(c.type){
      case 1:case 3:return n>0;
      case 2:return n;
      case 4:return n==0||n==2;
      case 5:return n==2;
      case 6:return ((bit(d)|bit(m))&c.targets)!=0;
      case 7:return (bit(d)&c.targets)!=0;
      case 8:return n==1;
      default:return -1;
    }
}
bool compatible(int e,int d,int m){
    if(e<0||e>ALL||pop(e)!=3||!valid(d)||(e&bit(d)))return false;
    if(active==0){if(m!=-1)return false;}
    else if(!valid(m)||m==d||(e&bit(m)))return false;
    for(int i=0;i<rejectedSize;++i)if(rejected[i]==e)return false;
    for(int i=0;i<N;++i)if(opened&bit(i)){
        if(e&bit(i))continue; // Evil may truthfully corroborate a useful clue.
        bool matches=cases[active].clues[i].value==actual(cases[active].clues[i],e,d,m);
        if(i==d?matches:!matches)return false;
    }
    return true;
}
void analyze(){
    if(!dirty)return;
    worlds=teams=0;good=evil=drunk=mask=ALL;
    for(int i=0;i<N;++i)for(int r=0;r<4;++r)support[i][r]=0;
    for(int e=0;e<=ALL;++e)if(pop(e)==3){bool seen=false;
        for(int d=0;d<N;++d)if(!(e&bit(d)))
            for(int m=active==0?-1:0;m<(active==0?0:N);++m)if(compatible(e,d,m)){
                ++worlds;seen=true;good&=ALL^e;evil&=e;drunk&=bit(d);mask&=bit(m);
                for(int i=0;i<N;++i)++support[i][e&bit(i)?3:i==d?1:i==m?2:0];
            }
        if(seen)++teams;
    }
    if(!worlds)good=evil=drunk=mask=0;dirty=false;
}
int reset(int id){
    if(id<1||id>2)return 1;
    active=id-1;opened=0;resolve=3;status=0;size=0;rejectedSize=0;dirty=true;return 0;
}
int command(int op,int target){
    if(status)return 2;if(size>=CAP)return 6;
    if(op==1){if(!valid(target))return 1;if(opened&bit(target))return 3;
        opened|=bit(target);journal[size++]={op,target,0};
    }else if(op==2){
        if(target<0||target>ALL||pop(target)!=3)return 4;
        for(int i=0;i<rejectedSize;++i)if(rejected[i]==target)return 5;
        if(target==cases[active].evil)status=1;
        else{rejected[rejectedSize++]=target;--resolve;if(!resolve)status=2;}
        journal[size++]={op,target,status==1?1:0};
    }else return 1;
    dirty=true;return 0;
}
}
extern "C" {
int fd_version(){return 2;}
int fd_reset(int id){return fd::reset(id);}
int fd_command(int op,int target){return fd::command(op,target);}
int fd_claim(int seat){return fd::valid(seat)?fd::cases[fd::active].claims[seat]:-1;}
int fd_state(int f){switch(f){case 0:return fd::active+1;case 1:return fd::opened;
    case 2:return fd::resolve;case 3:return fd::status;case 4:return fd::size;default:return -1;}}
int fd_clue(int seat,int f){
    if(!fd::valid(seat)||(!(fd::opened&fd::bit(seat))&&!fd::status))return -1;
    auto &c=fd::cases[fd::active].clues[seat];
    switch(f){case 0:return c.type;case 1:return c.targets;case 2:return c.value;default:return -1;}
}
int fd_entry(int i,int f){if(i<0||i>=fd::size)return -1;auto &e=fd::journal[i];
    switch(f){case 0:return e.op;case 1:return e.target;case 2:return e.result;default:return -1;}}
int fd_analysis(int f){fd::analyze();switch(f){case 0:return fd::worlds;case 1:return fd::teams;
    case 2:return fd::good;case 3:return fd::evil;case 4:return fd::drunk;case 5:return fd::mask;default:return -1;}}
int fd_compatible(int e,int d,int m){return fd::compatible(e,d,m)?1:0;}
int fd_support(int seat,int role){if(!fd::valid(seat)||role<1||role>4)return -1;
    fd::analyze();return fd::support[seat][role-1];}
int fd_reveal(int seat,int f){
    if(!fd::valid(seat)||!fd::status)return -1;const auto &c=fd::cases[fd::active];
    int value=fd::actual(c.clues[seat],c.evil,c.drunk,c.mask);
    int family=(c.evil&fd::bit(seat))?4:seat==c.drunk?2:seat==c.mask?3:1;
    // Unique enemy characters have no active night powers in a frozen-dawn case.
    int character=family==1?c.claims[seat]:family==2?101:family==3?102:
        103+fd::pop(c.evil&((1<<seat)-1));
    switch(f){case 0:return family;case 1:return value;case 2:return value==c.clues[seat].value;
        case 3:return character;default:return -1;}
}
int fd_theory(int good,int evil){
    if(good<0||good>fd::ALL||evil<0||evil>fd::ALL||(good&evil))return -1;int result=0;
    for(int e=0;e<=fd::ALL;++e)if(fd::pop(e)==3&&!(e&good)&&(e&evil)==evil)
        for(int d=0;d<fd::N;++d)if(!(e&fd::bit(d)))
            for(int m=fd::active==0?-1:0;m<(fd::active==0?0:fd::N);++m)
                if(fd::compatible(e,d,m))++result;
    return result;
}
}
