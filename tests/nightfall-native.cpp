#include <cassert>
#include <cstdio>
#include "../core/nightfall.cpp"
static void act(int op,int a=0,int b=0){assert(fn_command(op,a,b)==0);}
int main(){
    int checked=0;
    for(int a=0;a<4;++a)for(int b=0;b<4;++b)if(b!=a)
    for(int c=0;c<4;++c)if(c!=a&&c!=b)for(int d=0;d<4;++d)if(d!=a&&d!=b&&d!=c){
        nf::reset_world(a,b,c,d);assert(fn_analysis(0)==24);
        int foundDrunk=-1;
        for(int day=1;day<=3;++day){
            if(day>1)act(2,7,11); // Always cleanse before trusting a rescued reader.
            const int seat=nf::suspects[day-1];
            act(2,11,seat);int looksEvil=fw::events[fw::size-1].value;
            act(2,5,seat);int matches=fw::events[fw::size-1].value;
            if(!looksEvil&&!matches)foundDrunk=seat;
            if(day<3){act(2,1,11);act(4);}
        }
        if(foundDrunk<0)foundDrunk=nf::suspects[3]; // Exactly one Good suspect is a public premise.
        int trio=nf::POOL^fw::bit(foundDrunk);
        assert(fn_analysis(1)==1);assert(fn_analysis(3)==trio);assert(fn_analysis(4)==fw::bit(foundDrunk));
        act(5,trio);assert(fn_state(3)==1);assert(fn_state(1)==3);
        for(int i=0;i<12;++i)assert(fn_person(i,0));
        assert(fn_command(4,0,0)==2);++checked;
    }
    assert(checked==24);
    fn_reset();act(2,11,2);assert(fn_report_truth(1)==-1);
    act(2,1,11);act(4); // Save the reader; they are now Tainted.
    act(2,11,3);int poisonedReport=fw::size-1;assert(fw::events[poisonedReport].value==1);
    act(2,7,11); // Cleansing must never rewrite this earlier statement.
    assert(fw::events[poisonedReport].value==1);
    act(2,1,11);act(4);act(2,7,11);act(2,11,3);
    assert(fw::events[fw::size-1].value==0);
    act(5,(1<<2)|(1<<6)|(1<<9));assert(fn_report_truth(poisonedReport)==0);
    fn_reset();act(4);assert(fn_state(3)==2);assert(!fn_person(11,0));
    fn_reset();act(2,10,3);act(2,1,11);act(4); // An innocent mark redirects the attack.
    assert(fn_state(3)==2);assert(!fn_person(3,0));assert(fn_person(11,0));
    // Source-death behavior is role-based, not hardcoded to a seat.
    fw::reset(0);fw::p[6].role=fw::Drunk;fw::p[3].role=fw::Rotmonger;
    fw::p[3].alive=0;fw::command(4,0,0);assert(fw::p[4].taint==0);
    std::printf("Nightfall: all %d public-roster worlds have a zero-loss evidence-only policy; phase/counterexample checks passed.\n",checked);
}
