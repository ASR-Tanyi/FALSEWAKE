#include <algorithm>
#include <cassert>
#include <cstdio>
#include "../core/nightfall.cpp"

static void act(int op,int source=0,int target=0){
    assert(fn_command(op,source,target)==0);
}
static int report(int source,int target){
    act(2,source,target);
    const int last=fn_state(5)-1;
    assert(fn_report_truth(last)==-1);
    return fn_event(last,4);
}

// This policy reads only the public ABI. Seats are zero-based here.
static void solve(){
    constexpr int courier=10, reader=11, auditor=5, neverdead=4;
    assert(fn_analysis(0)==48 && fn_analysis(1)==4 && fn_analysis(4)==0);
    act(2,courier,neverdead);
    const bool reverse=report(auditor,reader)==0;
    assert(fn_analysis(0)==24 && fn_analysis(1)==4);
    assert(fn_analysis(4)==(reverse?fw::bit(reader):0));
    const bool firstLooksGood=report(reader,2)==reverse;
    act(4);

    const bool firstMismatches=report(auditor,2)==0;
    act(2,courier,6);
    const bool seventhIsGood=report(reader,6)==reverse;
    act(4);

    act(2,courier,3);
    const bool fourthIsGood=report(reader,3)==reverse;
    int cleared=0;
    if(firstLooksGood&&firstMismatches)cleared|=fw::bit(2);
    if(seventhIsGood)cleared|=fw::bit(6);
    if(fourthIsGood)cleared|=fw::bit(3);
    if(!cleared)cleared=fw::bit(9);
    assert(fw::pop(cleared)==1);
    const int trio=nf::POOL^cleared;
    assert(fn_analysis(1)==1 && fn_analysis(3)==trio);
    assert(fn_analysis(4)==(reverse?fw::bit(reader):cleared));
    act(5,trio);
    assert(fn_state(3)==1 && fn_state(1)==3);
    for(int seat=0;seat<12;++seat)assert(fn_person(seat,0)==1);
}

int main(){
    assert(fn_select(nf::BorrowedLight)==0);
    int order[]={0,1,2,3}, checked=0;
    do{
        for(bool drunkReader:{false,true}){
            nf::reset_world(order[0],order[1],order[2],order[3],drunkReader);
            solve();
            ++checked;
        }
    }while(std::next_permutation(order,order+4));
    assert(checked==48);
    std::puts("The borrowed light: a public-evidence policy wins in all 48 worlds with everyone alive and full Resolve.");
}
