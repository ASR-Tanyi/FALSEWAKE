#include <cassert>
#include <cstdio>
#include "../core/engine.cpp"
int main() {
    fw_reset();
    assert(fw_state(0)==1 && fw_state(2)==4);
    assert(fw_person(2,6)==0 && fw_person(2,7)==-1);
    assert(fw_command(2,0,0)==0 && fw_event(1,4)==0);
    fw_reset();
    assert(fw_command(2,10,2)==0 && fw::registered(2)==1); // Courier strips disguise.
    fw_reset();
    assert(fw_command(2,3,3)==0 && fw_event(1,4)==1); // Drunk's false neighbor count.
    assert(fw_command(2,7,3)==0);
    assert(fw::p[3].role==fw::Drunk); // Cleanser never cures a role.
    fw_reset();
    assert(fw_command(3,4,0)==0 && fw_person(4,0)==1 && fw_state(1)==3);
    fw_reset();
    assert(fw_command(2,1,7)==0);
    assert(fw_command(4,0,0)==0 && fw_person(7,0)==1 && fw::p[7].taint==1);
    assert(fw_command(2,7,7)==0 && fw::p[7].taint==1); // Impaired self-cleansing fails.
    fw_reset();
    assert(fw_command(3,2,0)==0); assert(fw_command(4,0,0)==0);
    assert(fw_command(3,6,0)==0); assert(fw_command(4,0,0)==0);
    assert(fw_command(3,9,0)==0 && fw_state(3)==1);
    assert(fw_command(4,0,0)==2);
    std::puts("Native core: assertions passed with address/undefined-behavior sanitizers.");
}
