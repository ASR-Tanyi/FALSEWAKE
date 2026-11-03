// FALSEWAKE v0.4. Allocation-free, deterministic public C ABI v2.
// Allegiance powers read registration. Reports retain their original subjects.
#include "bluffs.h"
namespace fw {
constexpr int N=12, CAP=512;
enum Role { Countkeeper=1,Wardmaker,Archivist,Neverdead,Auditor,Courier,
    Cleanser,Lantern,Drunk,Devilmask,Smokescreen,Rotmonger,Whisperer,
    Lookout,Bellkeeper,Kinseeker,Taintreader,Gatekeeper,HollowEye };
enum Kind { Testimony=1,Count,Registration,Audit,Mark,Ward,Cleanse,
    Verification,Executed,Survived,Night,Killed,Saved,Dawn,End,
    Presence,Relation,Impairment,Burden,Exclusive };
struct Person {int role,claim,evil,alive,asked,used,spent,taint,marked,ward,promised;};
struct Event {int kind,day,source,target,value,subjects,truth;};
Person p[N]; Event events[CAP];
int day,resolve,actions,status,execution,size,seed;
constexpr int roles[N]={Countkeeper,Wardmaker,Smokescreen,Drunk,Neverdead,Auditor,
    Rotmonger,Cleanser,Devilmask,Whisperer,Courier,Lantern};
constexpr int claims[N]={Countkeeper,Wardmaker,Archivist,Lookout,Neverdead,Auditor,
    Bellkeeper,Cleanser,Devilmask,Kinseeker,Courier,Lantern};
bool valid(int i){return i>=0&&i<N;}
int bit(int i){return valid(i)?1<<i:0;}
bool impaired(int i){return p[i].taint||p[i].role==Drunk;}
bool bad(int i){return p[i].evil||impaired(i);}
bool lies(int i){return impaired(i)||(p[i].evil&&((unsigned(seed)+unsigned(day+i))%5!=0));}
int registered(int i){
    if(!p[i].alive)return p[i].evil;
    if(p[i].role==Devilmask&&!p[i].taint)return 1;
    if(p[i].role==Smokescreen&&!p[i].marked)return 0;
    return p[i].evil;
}
int registered_role(int i){
    return p[i].alive&&p[i].role==Smokescreen&&!p[i].marked?p[i].claim:p[i].role;
}
int next_alive(int from,int direction,int exclude=-1){
    for(int n=1;n<N;++n){int i=(from+N+direction*n)%N;
        if(p[i].alive&&i!=exclude)return i;}
    return -1;
}
int neighbors(int source){return bit(next_alive(source,1))|bit(next_alive(source,-1));}
int subjects(int source,int start,int limit){
    int mask=0,added=0;
    for(int n=0;n<N&&added<limit;++n){int i=(start+n)%N;
        if(i!=source&&p[i].alive){mask|=bit(i);++added;}}
    return mask;
}
int pop(int mask){int result=0;for(;mask;mask&=mask-1)++result;return result;}
int count(int mask){int result=0;for(int i=0;i<N;++i)if(mask&bit(i))result+=registered(i);return result;}
void emit(int kind,int source=-1,int target=-1,int value=0,int subjects=0,int truth=1){
    if(size<CAP)events[size++]={kind,day,source,target,value,subjects,truth};
}
void recount(){
    int good=0,evil=0;for(int i=0;i<N;++i)if(p[i].alive){if(p[i].evil)++evil;else ++good;}
    if(!evil)status=1;else if(resolve<=0||!good||day>12)status=2;
    if(status)emit(End,-1,-1,status);
}
void report_count(int source){
    int mask=neighbors(source),actual=count(mask),value=actual;
    if(lies(source)&&mask)value=(actual+1)%(pop(mask)+1);
    emit(Count,source,source,value,mask,value==actual);
}
void binary(int kind,int a,int b,int actual,int mask){
    int value=lies(a)?1-actual:actual;emit(kind,a,b,value,mask,value==actual);
}
bool informational(int role){return role==Countkeeper||role==Auditor||role==Lantern||role>=Lookout;}
void information(int a,int b){
    const int role=p[a].claim;
    if(role==Countkeeper){report_count(a);return;}
    if(role==Lantern)binary(Registration,a,b,registered(b),bit(b));
    else if(role==Auditor)binary(Audit,a,b,registered_role(b)==p[b].claim,bit(b));
    else if(role==Lookout||role==Bellkeeper){int mask=subjects(a,b,role==Lookout?3:6);
        binary(Presence,a,b,count(mask)>0,mask);}
    else if(role==Kinseeker||role==Gatekeeper){int mask=subjects(a,b,2),n=count(mask);
        binary(role==Kinseeker?Relation:Exclusive,a,b,role==Kinseeker?(n==0||n==2):(n==1),mask);}
    else if(role==Taintreader)binary(Impairment,a,b,impaired(b),bit(b));
    else if(role==HollowEye)binary(Burden,a,b,p[b].role==Drunk||p[b].role==Devilmask,bit(b));
}
int last_report(int source){
    for(int i=size-1;i>=0;--i){int k=events[i].kind;
        if(events[i].source==source&&((k>=Count&&k<=Audit)||k==Verification||k>=Presence))return i;}
    return -1;
}
void testimony(int a){
    int b=next_alive(a,1);
    if(informational(p[a].claim)&&b>=0)information(a,b);
    else if(p[a].claim==Countkeeper)report_count(a);
    else emit(Testimony,a,a,p[a].claim); // Ability description, not a fabricated memory.
}
int reset(int value){
    if(value<0)return 1;
    seed=value;day=1;resolve=3;actions=4;status=0;execution=0;size=0;
    for(int i=0;i<N;++i)p[i]={roles[i],claims[i],roles[i]>=Smokescreen&&roles[i]<=Whisperer,1,0,0,0,0,0,0,0};
    if(seed){
        unsigned random=unsigned(seed);int used=0,copies[N],copyCount=0;
        for(int i=0;i<N;++i)if(!p[i].evil){used|=1<<p[i].claim;if(p[i].claim!=Devilmask)copies[copyCount++]=p[i].claim;}
        constexpr int pool[]={Countkeeper,Wardmaker,Archivist,Neverdead,Auditor,Courier,Cleanser,Lantern,
            Lookout,Bellkeeper,Kinseeker,Taintreader,Gatekeeper,HollowEye};
        for(int i=0;i<N;++i)if(p[i].evil){int unused[20],n=0;
            for(int role:pool)if(!(used&(1<<role)))unused[n++]=role;
            p[i].claim=bluff::choose(random,unused,n,copies,copyCount);used|=1<<p[i].claim;}
    }
    p[0].asked=1;testimony(0);return 0;
}
int use(int a,int b){
    if(!valid(a)||!valid(b))return 1;
    if(!p[a].alive||!p[b].alive)return 3;
    if(actions<=0)return 4;
    if(p[a].used==day)return 5;
    int role=p[a].claim,ref=-1;
    if(role==Neverdead||role==Devilmask)return 6;
    if(role!=Countkeeper&&a==b)return 8;
    if((role==Kinseeker||role==Gatekeeper)&&pop(subjects(a,b,2))!=2)return 8;
    if(role==Archivist){ref=last_report(b);if(ref<0)return 9;}
    --actions;p[a].used=day;
    if(informational(role))information(a,b);
    else if(role==Wardmaker){p[b].promised=1;if(!bad(a))p[b].ward=1;emit(Ward,a,b);}
    else if(role==Courier){if(!impaired(a))p[b].marked=1;emit(Mark,a,b);}
    else if(role==Cleanser){if(!bad(a))p[b].taint=0;emit(Cleanse,a,b);}
    else if(role==Archivist)binary(Verification,a,ref,events[ref].truth,events[ref].subjects);
    return 0;
}
int command(int op,int a,int b){
    if(status)return 2;
    if(size>CAP-32)return 10;
    if(op==1){
        if(!valid(a))return 1;if(!p[a].alive)return 3;if(actions<=0)return 4;if(p[a].asked)return 5;
        if((p[a].claim==Kinseeker||p[a].claim==Gatekeeper)&&pop(subjects(a,(a+1)%N,2))!=2)return 8;
        --actions;p[a].asked=1;testimony(a);return 0;
    }
    if(op==2)return use(a,b);
    if(op==3){
        if(!valid(a))return 1;if(!p[a].alive)return 3;if(execution)return 7;
        execution=1;
        if(p[a].role==Neverdead&&!impaired(a))emit(Survived,a,a);
        else {p[a].alive=0;if(!p[a].evil)--resolve;emit(Executed,a,a,p[a].evil);recount();}
        return 0;
    }
    if(op==4){
        emit(Night);for(int i=0;i<N;++i)p[i].taint=0;
        if(p[6].alive)for(int j=0;j<N;++j){int i=(day*2+j)%N;
            if(p[i].alive&&!p[i].evil&&p[i].role!=Drunk&&p[i].role!=Devilmask){p[i].taint=1;break;}}
        if(p[9].alive){
            int victim=-1;for(int i=0;i<N;++i)if(p[i].alive&&!p[i].evil&&p[i].marked){victim=i;break;}
            constexpr int priority[N]={7,1,11,5,0,10,4,3,8,2,6,9};
            if(victim<0)for(int i:priority)if(p[i].alive&&!p[i].evil){victim=i;break;}
            if(victim>=0){bool immortal=p[victim].role==Neverdead&&!impaired(victim);
                if(immortal||p[victim].ward){if(!immortal)p[victim].ward=0;
                    emit(Saved,-1,victim,immortal?1:0);p[victim].taint=1;}
                else {p[victim].alive=0;emit(Killed,-1,victim);}}
        }
        for(int i=0;i<N;++i){p[i].ward=0;p[i].promised=0;}
        ++day;actions=4;execution=0;emit(Dawn,-1,-1,day);recount();return 0;
    }
    return 1;
}
}
extern "C" {
int fw_version(){return 2;}
int fw_reset(int seed){return fw::reset(seed);}
int fw_command(int op,int source,int target){return fw::command(op,source,target);}
int fw_state(int f){switch(f){case 0:return fw::day;case 1:return fw::resolve;case 2:return fw::actions;
    case 3:return fw::status;case 4:return fw::execution;case 5:return fw::size;case 6:return fw::seed;default:return -1;}}
int fw_person(int i,int f){
    if(!fw::valid(i))return -1;auto &p=fw::p[i];bool revealed=!p.alive||fw::status;
    switch(f){case 0:return p.alive;case 1:return p.claim;case 2:return p.asked;case 3:return p.used==fw::day;
      case 4:return p.marked;case 5:return p.promised;case 6:return revealed?p.role:0;
      case 7:return revealed?p.evil:-1;case 8:return p.spent;default:return -1;}
}
int fw_event(int i,int f){
    if(i<0||i>=fw::size)return -1;auto &e=fw::events[i];
    switch(f){case 0:return e.kind;case 1:return e.day;case 2:return e.source;case 3:return e.target;
        case 4:return e.value;case 5:return e.subjects;default:return -1;}
}
}
