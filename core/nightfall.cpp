// Nightfall v1: a bounded dynamic case using the SAME sandbox simulation.
// Certified helpers and the four-suspect roster are public premises.
// The analyst replays all 24 permitted worlds; it never reads the authored answer.
#include "engine.cpp"
namespace nf {
constexpr int CAP=32, POOL=(1<<2)|(1<<3)|(1<<6)|(1<<9), ALL=(1<<12)-1;
constexpr int suspects[]={2,3,6,9};
constexpr int hidden[]={fw::Smokescreen,fw::Drunk,fw::Rotmonger,fw::Whisperer};
constexpr int Verdict=21, Charter=22;
struct Command {int op,source,target;};
Command journal[CAP];
int size=0, rejected[3], rejectedSize=0;
bool dirty=true;
int worlds=0, teams=0, forcedGood=0, forcedEvil=0, forcedDrunk=0, forcedSmoke=0;
// A complete frame is only used for pure analysis. It is never a public getter.
struct Frame {
    fw::Person people[fw::N]; fw::Event events[fw::CAP];
    int day,resolve,actions,status,execution,eventSize,seed;
    Command commands[CAP]; int commandSize,wrong[3],wrongSize;
};
void capture(Frame &f){
    for(int i=0;i<fw::N;++i)f.people[i]=fw::p[i];
    for(int i=0;i<fw::size;++i)f.events[i]=fw::events[i];
    f.day=fw::day;f.resolve=fw::resolve;f.actions=fw::actions;f.status=fw::status;
    f.execution=fw::execution;f.eventSize=fw::size;f.seed=fw::seed;
    f.commandSize=size;f.wrongSize=rejectedSize;
    for(int i=0;i<size;++i)f.commands[i]=journal[i];
    for(int i=0;i<rejectedSize;++i)f.wrong[i]=rejected[i];
}
void restore(const Frame &f){
    for(int i=0;i<fw::N;++i)fw::p[i]=f.people[i];
    for(int i=0;i<f.eventSize;++i)fw::events[i]=f.events[i];
    fw::day=f.day;fw::resolve=f.resolve;fw::actions=f.actions;fw::status=f.status;
    fw::execution=f.execution;fw::size=f.eventSize;fw::seed=f.seed;
    size=f.commandSize;rejectedSize=f.wrongSize;
    for(int i=0;i<size;++i)journal[i]=f.commands[i];
    for(int i=0;i<rejectedSize;++i)rejected[i]=f.wrong[i];
}
// Internal only: no released export accepts a hidden world or identity.
void reset_world(int a,int b,int c,int d){
    fw::reset(0);const int order[]={a,b,c,d};
    for(int n=0;n<4;++n){auto &p=fw::p[suspects[n]];p.role=hidden[order[n]];p.evil=p.role!=fw::Drunk;}
    fw::size=0;fw::p[0].asked=0; // No gratuitous opening clue in this case.
    fw::p[11].marked=1;
    fw::emit(Charter,-1,11,1,1<<11); // Public starting mark; not an investigator action.
    size=0;rejectedSize=0;dirty=true;
}
void reset(){reset_world(0,1,2,3);}
bool suspect(int i){return fw::valid(i)&&(POOL&fw::bit(i));}
int command(int op,int source,int target){
    if(fw::status)return 2;
    if(size>=CAP)return 10;
    if(op==2){
        if(!fw::valid(source)||!fw::valid(target))return 1;
        if(suspect(source))return 11;
        int error=fw::command(op,source,target);if(error)return error;
    }else if(op==4){
        if(source!=0||target!=0)return 1;
        if(fw::day>=3)return 12;
        int error=fw::command(op,0,0);if(error)return error;
        for(int i=0;i<fw::N;++i)if(!fw::p[i].alive){fw::status=2;fw::emit(fw::End,-1,-1,2);break;}
    }else if(op==5){
        if(target!=0||source<0||source>ALL||(source&~POOL)||fw::pop(source)!=3)return 13;
        if(fw::day<3)return 14;
        for(int i=0;i<rejectedSize;++i)if(rejected[i]==source)return 15;
        int actual=0;for(int i=0;i<fw::N;++i)if(fw::p[i].evil)actual|=fw::bit(i);
        int correct=source==actual;
        fw::emit(Verdict,-1,-1,correct,source);
        if(correct)fw::status=1;
        else{rejected[rejectedSize++]=source;--fw::resolve;if(!fw::resolve)fw::status=2;}
        if(fw::status)fw::emit(fw::End,-1,-1,fw::status);
    }else return 1; // No executions or untrusted suspect powers in this exercise.
    journal[size++]={op,source,target};dirty=true;return 0;
}
bool public_equal(const fw::Event &a,const fw::Event &b){
    // Deliberately exclude internal truth. Registration is not true allegiance.
    return a.kind==b.kind&&a.day==b.day&&a.source==b.source&&a.target==b.target&&a.value==b.value&&a.subjects==b.subjects;
}
bool trace_matches(const Frame &live){
    if(size!=live.commandSize||fw::size!=live.eventSize||fw::day!=live.day||fw::resolve!=live.resolve||
       fw::actions!=live.actions||fw::status!=live.status)return false;
    for(int i=0;i<fw::size;++i)if(!public_equal(fw::events[i],live.events[i]))return false;
    // Only the non-secret board fields. Debrief identities are NOT solver evidence.
    for(int i=0;i<fw::N;++i){const auto &a=fw::p[i];const auto &b=live.people[i];
        if(a.alive!=b.alive||a.claim!=b.claim||a.used!=b.used||a.marked!=b.marked||a.promised!=b.promised)return false;}
    return true;
}
void analyze(){
    if(!dirty)return;
    Frame live;capture(live);
    int count=0,distinct=0,seen[4]={},good=ALL,evil=ALL,drunk=ALL,smoke=ALL;
    // Permutations arise solely from the PUBLIC roster: one of each hidden role.
    for(int a=0;a<4;++a)for(int b=0;b<4;++b)if(b!=a)
    for(int c=0;c<4;++c)if(c!=a&&c!=b)for(int d=0;d<4;++d)if(d!=a&&d!=b&&d!=c){
        reset_world(a,b,c,d);bool valid=true;
        for(int i=0;i<live.commandSize;++i){const auto &cmd=live.commands[i];
            if(command(cmd.op,cmd.source,cmd.target)){valid=false;break;}}
        if(!valid||!trace_matches(live))continue;
        ++count;int e=0,dr=0,sm=0,drIndex=0;
        for(int n=0;n<4;++n){int i=suspects[n];if(fw::p[i].evil)e|=fw::bit(i);
            if(fw::p[i].role==fw::Drunk){dr=fw::bit(i);drIndex=n;}
            if(fw::p[i].role==fw::Smokescreen)sm=fw::bit(i);}
        if(!seen[drIndex]){seen[drIndex]=1;++distinct;}
        good&=ALL^e;evil&=e;drunk&=dr;smoke&=sm;
    }
    restore(live);worlds=count;teams=distinct;
    forcedGood=count?good:0;forcedEvil=count?evil:0;forcedDrunk=count?drunk:0;forcedSmoke=count?smoke:0;
    dirty=false;
}
}
extern "C" {
int fn_version(){return 1;}
void fn_reset(){nf::reset();}
int fn_command(int op,int source,int target){return nf::command(op,source,target);}
int fn_state(int f){if(f==7)return nf::size;if(f==8)return 3-fw::day;if(f==9)return nf::POOL;return fw_state(f);}
int fn_person(int seat,int f){return fw_person(seat,f);}
int fn_event(int index,int f){return fw_event(index,f);}
int fn_entry(int i,int f){if(i<0||i>=nf::size)return -1;const auto &c=nf::journal[i];
    return f==0?c.op:f==1?c.source:f==2?c.target:-1;}
int fn_analysis(int f){nf::analyze();switch(f){case 0:return nf::worlds;case 1:return nf::teams;
    case 2:return nf::forcedGood;case 3:return nf::forcedEvil;case 4:return nf::forcedDrunk;
    case 5:return nf::forcedSmoke;default:return -1;}}
}
extern "C" int fn_report_truth(int i){
    if(!fw::status||i<0||i>=fw::size)return -1;
    int kind=fw::events[i].kind;
    return kind>=fw::Count&&kind<=fw::Audit?fw::events[i].truth:-1;
}
