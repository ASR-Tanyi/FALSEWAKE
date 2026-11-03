#include <cassert>
#include <cstdio>
extern "C" {
int fd_version();int fd_reset(int);int fd_command(int,int);int fd_state(int);
int fd_clue(int,int);int fd_entry(int,int);int fd_analysis(int);
int fd_reveal(int,int);int fd_compatible(int,int,int);int fd_theory(int,int);
}
int main() {
    assert(fd_version()==1);
    for(int id=1;id<=2;++id) {
        assert(fd_reset(id)==0);
        assert(fd_analysis(0)==(id==1?1980:15840));
        assert(fd_analysis(1)==220);
        for(int i=0;i<12;++i){assert(fd_clue(i,0)==-1);assert(fd_reveal(i,0)==-1);}
        assert(fd_command(1,-1)==1);assert(fd_command(1,12)==1);
        assert(fd_command(2,4096)==4);assert(fd_command(2,-1)==4);
        assert(fd_reset(0)==1);assert(fd_state(0)==id);
        assert(fd_theory(-1,0)==-1);assert(fd_compatible(-1,0,-1)==0);
        for(int i=0;i<12;++i)assert(fd_command(1,i)==0);
        assert(fd_analysis(0)==1);assert(fd_analysis(1)==1);
        const int solution=fd_analysis(3);
        assert(fd_command(2,solution)==0);assert(fd_state(3)==1);
        for(int i=0;i<12;++i)assert(fd_reveal(i,0)>0);
        assert(fd_command(1,0)==2);
    }
    assert(fd_reset(2)==0);
    assert(fd_command(2,7)==0);assert(fd_command(2,7)==5);
    assert(fd_command(2,11)==0);assert(fd_command(2,13)==0);
    assert(fd_state(2)==0);assert(fd_state(3)==2);
    puts("Sealed-case native assertions passed (ASan + UBSan).");
}
