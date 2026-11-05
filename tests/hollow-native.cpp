#include <cassert>
#include "../core/nightfall.cpp"
int main(){
 int verified=0;
 for(int a=0;a<4;++a)for(int b=0;b<4;++b)if(b!=a)
 for(int c=0;c<4;++c)if(c!=a&&c!=b)for(int d=0;d<4;++d)if(d!=a&&d!=b&&d!=c){
  nf::activeCase=2;nf::reset_world(a,b,c,d);int found=-1;
  assert(nf::command(2,10,4)==0); // A public, certified Neverdead receives a mark.
  for(int day=1;day<=3;++day){
   const int target=nf::suspects[day-1];
   assert(nf::command(2,11,target)==0);int team=fw::events[fw::size-1].value;
   assert(nf::command(2,5,target)==0);int match=fw::events[fw::size-1].value;
   if(team==0&&match==0)found=target;
   if(day<3){assert(nf::command(2,1,4)==0);assert(nf::command(4,0,0)==0);assert(fw::status==0);}
  }
  if(found<0)found=nf::suspects[3];
  nf::analyze();assert(nf::teams==1);assert(nf::forcedEvil==(nf::POOL^fw::bit(found)));
  assert(nf::activeCase==2);assert(nf::command(5,nf::forcedEvil,0)==0);
  assert(fw::status==1&&fw::resolve==3);for(auto &p:fw::p)assert(p.alive);
  ++verified;
 }
 assert(verified==24);
 // A Ward removed by sabotage cannot block a lethal attack.
 assert(fn_select(2)==0);assert(nf::command(2,1,11)==0);assert(nf::command(4,0,0)==0);
 assert(fw::status==2&&!fw::p[11].alive);bool removal=false;
 for(int i=0;i<fw::size;++i)if(fw::events[i].kind==fw::WardRemoved){removal=true;assert(fw::events[i].source==-1);}
 assert(removal);
 // Selection rejects unknown IDs atomically, and legacy reset still means case 1.
 int n=fw::size;assert(fn_select(3)==1&&fn_state(10)==2&&fw::size==n);
 fn_reset();assert(fn_state(10)==1);
 // A dead saboteur no longer strips protection (shared-core source-death semantics).
 fn_select(2);fw::p[fw::living_role(fw::Wardbreaker)].alive=0;
 assert(fw::command(2,1,11)==0);assert(fw::command(4,0,0)==0);assert(fw::p[11].alive);
 for(int i=0;i<fw::size;++i)assert(fw::events[i].kind!=fw::WardRemoved);
 // A promise without a real Ward is neither removed nor consumed.
 fn_select(2);fw::p[11].promised=1;assert(fw::command(4,0,0)==0);
 assert(!fw::p[11].alive);for(int i=0;i<fw::size;++i)assert(fw::events[i].kind!=fw::WardRemoved);
 // New role is not accidentally classified as an information ability.
 assert(!fw::informational(fw::Wardbreaker));
}
