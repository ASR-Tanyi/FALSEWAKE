#include <cassert>
#include <cstdio>
#include "../core/cases.cpp"
int main(){
 using namespace fd;
 assert(fd_version()==2);
 for(int id=1;id<=2;++id){
  reset(id);assert(fd_analysis(0)==(id==1?1980:15840));
  const auto &c=cases[id-1];
  for(int i=0;i<N;++i){
   assert(fd_clue(i,0)==-1&&fd_reveal(i,0)==-1);assert(fd_claim(i)>0);
   for(int j=i+1;j<N;++j)assert(fd_claim(i)!=fd_claim(j));
   assert(!(c.clues[i].targets&bit(i)));assert(command(1,i)==0);
   const auto &q=c.clues[i];
   if(q.type==2){assert(pop(q.targets)==2);assert(q.targets==(bit((i+11)%12)|bit((i+1)%12)));}
   else assert(q.value==0||q.value==1);
   if(pop(q.targets)>2)assert(q.type==1);
  }
  assert(fd_analysis(0)==1&&fd_analysis(1)==1);
  assert(fd_analysis(3)==c.evil&&fd_analysis(4)==bit(c.drunk)&&fd_analysis(5)==bit(c.mask));
  assert(command(2,fd_analysis(3))==0&&status==1&&resolve==3);
  for(int i=0;i<N;++i)for(int j=i+1;j<N;++j)assert(fd_reveal(i,3)!=fd_reveal(j,3));
  assert(command(1,0)==2);
 }
 reset(2);assert(fd_reset(3)==1&&fd_state(0)==2);
 assert(fd_clue(-1,0)==-1&&fd_clue(12,0)==-1&&fd_claim(12)==-1);
 assert(fd_compatible(99999,1,2)==0&&fd_theory(1,1)==-1);
 std::puts("Native sealed cases v2: simple scopes, distinct claims, no self-targeting, exhaustive solutions passed.");
}
