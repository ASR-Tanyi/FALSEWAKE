// FALSEWAKE v0.1. Freestanding, deterministic, allocation-free core.
// The C ABI exposes public observations only; see docs in README.md.
// Seat indices are zero-based. UI labels are one-based.
namespace fw {
constexpr int N = 12, CAP = 512;
enum Role { Countkeeper=1, Wardmaker, Archivist, Neverdead, Auditor,
            Courier, Cleanser, Trueglass, Drunk, Devilmask, Smokescreen,
            Rotmonger, Whisperer };
enum Kind { Testimony=1, Count, Team, Audit, Mark, Ward, Cleanse,
            Verification, Executed, Survived, Night, Killed, Saved, Dawn, End };
struct Person { int role, claim, evil, alive, asked, used, spent, taint, marked, ward, promised; };
struct Event { int kind, day, source, target, value, truth; };
Person p[N];
Event events[CAP];
int day, resolve, actions, status, execution, size;
constexpr int roles[N] = {Countkeeper,Wardmaker,Smokescreen,Drunk,Neverdead,Auditor,
                         Rotmonger,Cleanser,Devilmask,Whisperer,Courier,Trueglass};
constexpr int claims[N] = {Countkeeper,Wardmaker,Archivist,Countkeeper,Neverdead,Auditor,
                          Courier,Cleanser,Devilmask,Countkeeper,Courier,Trueglass};
bool valid(int i) { return i>=0 && i<N; }
bool bad(int i) { return p[i].evil || p[i].taint || p[i].role==Drunk; }
int registered(int i) {
    if (!p[i].alive) return p[i].evil;
    if (p[i].role==Devilmask && !p[i].taint) return 1;
    if (p[i].role==Smokescreen && !p[i].marked) return 0;
    return p[i].evil;
}
int count(int i) { return registered((i+N-1)%N)+registered((i+1)%N); }
void emit(int kind, int source=-1, int target=-1, int value=0, int truth=1) {
    if (size<CAP) events[size++]={kind,day,source,target,value,truth};
}
void recount() {
    int good=0, evil=0;
    for (int i=0;i<N;++i) if (p[i].alive) { if(p[i].evil) ++evil; else ++good; }
    if (!evil) status=1;
    else if (resolve<=0 || !good || day>12) status=2;
    if (status) emit(End,-1,-1,status);
}
void report_count(int i) {
    int actual=count(i), value=bad(i)?(actual+1)%3:actual;
    emit(Count,i,i,value,value==actual);
}
int last_report(int source) {
    for (int i=size-1;i>=0;--i) {
        int k=events[i].kind;
        if(events[i].source==source && (k==Testimony || k==Count || k==Team || k==Audit || k==Verification)) return i;
    }
    return -1;
}
void testimony(int i) {
    if (p[i].claim==Countkeeper) report_count(i);
    else emit(Testimony,i,i,i,i!=6);
}
void reset() {
    day=1; resolve=3; actions=4; status=0; execution=0; size=0;
    for(int i=0;i<N;++i) p[i]={roles[i],claims[i],roles[i]>=Smokescreen,1,0,0,0,0,0,0,0};
    p[0].asked=1;
    testimony(0); // One opening clue, free of action cost.
}
int use(int a,int b) {
    if (!valid(a)||!valid(b)) return 1;
    if (!p[a].alive||!p[b].alive) return 3;
    if (actions<=0) return 4;
    if (p[a].used==day || (p[a].claim==Trueglass && p[a].spent)) return 5;
    int role=p[a].claim, ref=-1;
    if (role==Neverdead || role==Devilmask) return 6;
    if (role==Wardmaker && a==b) return 8;
    if (role==Archivist) { ref=last_report(b); if(ref<0) return 9; }
    --actions; p[a].used=day;
    if(role==Countkeeper) report_count(a);
    else if(role==Wardmaker) {
        p[b].promised=1; if(!bad(a)) p[b].ward=1;
        emit(Ward,a,b,0,!bad(a));
    } else if(role==Courier) {
        // A tangible mark can be forged by an evil claimant. It proves no allegiance.
        if(!p[a].taint) p[b].marked=1;
        emit(Mark,a,b,0,!p[a].taint);
    } else if(role==Cleanser) {
        if(!bad(a)) p[b].taint=0;
        emit(Cleanse,a,b,0,!bad(a));
    } else if(role==Trueglass) {
        int v=p[b].evil; if(bad(a)) v=1-v;
        p[a].spent=1; emit(Team,a,b,v,v==p[b].evil);
    } else if(role==Auditor) {
        int v=p[b].role==p[b].claim; if(bad(a)) v=1-v;
        emit(Audit,a,b,v,v==(p[b].role==p[b].claim));
    } else if(role==Archivist) {
        int v=events[ref].truth; if(bad(a)) v=1-v;
        emit(Verification,a,ref,v,v==events[ref].truth);
    }
    return 0;
}
int command(int op,int a,int b) {
    if(status) return 2;
    // Reserve room for a complete command and its bounded reactions.
    if(size>CAP-32) return 10;
    if(op==1) {
        if(!valid(a)) return 1;
        if(!p[a].alive) return 3;
        if(actions<=0) return 4;
        if(p[a].asked) return 5;
        --actions; p[a].asked=1; testimony(a); return 0;
    }
    if(op==2) return use(a,b);
    if(op==3) {
        if(!valid(a)) return 1;
        if(!p[a].alive) return 3;
        if(execution) return 7;
        execution=1;
        if(p[a].role==Neverdead && !p[a].taint) emit(Survived,a,a);
        else {
            p[a].alive=0; if(!p[a].evil) --resolve;
            emit(Executed,a,a,p[a].evil); recount();
        }
        return 0;
    }
    if(op==4) {
        emit(Night);
        for(int i=0;i<N;++i) p[i].taint=0;
        // Rotmonger corrupts one living Citizen. The effect lasts to next night.
        if(p[6].alive) for(int j=0;j<N;++j) {
            int i=(day*2+j)%N;
            if(p[i].alive && !p[i].evil && p[i].role!=Drunk && p[i].role!=Devilmask) {
                p[i].taint=1; break;
            }
        }
        if(p[9].alive) {
            int victim=-1;
            for(int i=0;i<N;++i) if(p[i].alive && !p[i].evil && p[i].marked) { victim=i; break; }
            constexpr int priority[N]={7,1,11,5,0,10,4,3,8,2,6,9};
            if(victim<0) for(int i:priority) if(p[i].alive&&!p[i].evil) { victim=i; break; }
            if(victim>=0) {
                bool immortal=p[victim].role==Neverdead && !p[victim].taint;
                if(immortal || p[victim].ward) {
                    if(!immortal) p[victim].ward=0;
                    emit(Saved,-1,victim,immortal?1:0);
                    p[victim].taint=1; // Whisperer's surviving victim is impaired.
                } else { p[victim].alive=0; emit(Killed,-1,victim); }
            }
        }
        for(int i=0;i<N;++i) { p[i].ward=0; p[i].promised=0; }
        ++day; actions=4; execution=0;
        emit(Dawn,-1,-1,day); recount(); return 0;
    }
    return 1;
}
}
extern "C" {
int fw_version() { return 1; }
void fw_reset() { fw::reset(); }
int fw_command(int op,int source,int target) { return fw::command(op,source,target); }
// Global fields: day, resolve, actions, status(0 playing/1 won/2 lost), execution used, event count.
int fw_state(int field) {
    switch(field) {case 0:return fw::day;case 1:return fw::resolve;case 2:return fw::actions;
        case 3:return fw::status;case 4:return fw::execution;case 5:return fw::size;default:return -1;}
}
// Person fields: alive, claim, asked, used today, marked, ward promised, revealed role/team, spent.
int fw_person(int i,int field) {
    if(!fw::valid(i)) return -1;
    auto &p=fw::p[i]; bool revealed=!p.alive||fw::status;
    switch(field) {case 0:return p.alive;case 1:return p.claim;case 2:return p.asked;
        case 3:return p.used==fw::day;case 4:return p.marked;case 5:return p.promised;
        case 6:return revealed?p.role:0;case 7:return revealed?p.evil:-1;case 8:return p.spent;default:return -1;}
}
// Event fields: kind, day, source, target, value. Truth is deliberately not public.
int fw_event(int i,int field) {
    if(i<0||i>=fw::size) return -1;
    auto &e=fw::events[i];
    switch(field) {case 0:return e.kind;case 1:return e.day;case 2:return e.source;
        case 3:return e.target;case 4:return e.value;default:return -1;}
}
}
