#include <initializer_list>
#include <cassert>
#include <cstdio>
#include "../core/engine.cpp"
int main(){
    using namespace fw;
    assert(fw_version()==2);assert(fw_reset(0)==0);
    for(int i=0;i<N;++i)for(int j=i+1;j<N;++j){assert(p[i].role!=p[j].role);assert(p[i].claim!=p[j].claim);}
    assert(fw_reset(-1)==1&&seed==0&&day==1);
    // Skip dead seats and do not count the last survivor twice.
    p[1].alive=p[11].alive=0;assert(neighbors(0)==(bit(2)|bit(10)));
    for(int i=1;i<N;++i)p[i].alive=i==5;
    assert(neighbors(0)==bit(5));report_count(0);assert(events[size-1].value<=1);
    p[5].alive=0;assert(neighbors(0)==0);report_count(0);assert(events[size-1].value==0);
    reset(0);assert(command(2,11,8)==0);assert(events[size-1].value==1); // Good Devilmask looks Evil.
    assert(command(2,5,2)==0&&events[size-1].value==1); // Auditor sees the disguise.
    assert(command(2,10,2)==0);p[5].used=0;
    assert(command(2,5,2)==0&&events[size-1].value==0);
    reset(0);assert(command(2,3,4)==0);int wrong=events[size-1].value;
    assert(wrong==0);assert(command(2,7,3)==0);p[3].used=0;
    assert(command(2,3,4)==0&&events[size-1].value==wrong&&p[3].role==Drunk);
    reset(0);assert(command(2,1,7)==0);assert(command(4,0,0)==0);
    assert(p[7].alive&&p[7].taint&&p[4].taint);assert(command(2,7,4)==0);
    assert(command(3,4,0)==0&&!p[4].alive&&resolve==2);
    reset(0);assert(command(3,4,0)==0&&p[4].alive&&resolve==3);
    // Information never includes the source, even when a broad range wraps around them.
    for(int role:{Lookout,Bellkeeper,Kinseeker,Gatekeeper}){
        reset(0);p[0].claim=role;assert(command(2,0,10)==0);
        auto e=events[size-1];assert(!(e.subjects&1));assert(e.value==0||e.value==1);
        assert(pop(e.subjects)==(role==Bellkeeper?6:role==Lookout?3:2));
    }
    reset(0);assert(command(2,11,11)==8&&actions==4);
    // Frozen history remains unchanged after deaths and new readings.
    Event opening=events[0];command(3,1,0);command(4,0,0);
    assert(events[0].subjects==opening.subjects&&events[0].value==opening.value);
    // Direct C ABI boundaries are also checked under native sanitizers.
    for(int i=-20;i<30;++i){fw_person(i,99);fw_event(i,99);}
    assert(fw_person(0,9)==-1&&fw_event(0,6)==-1);
    std::puts("Native rules v2: registration, living neighbors, historical scopes, survival and bounds passed.");
}
