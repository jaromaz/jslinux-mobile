var parity_LUT=[1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1,1,0,0,1,0,1,1,0,1,0,0,1,0,1,1,0,0,1,1,0,1,0,0,1];var shift16_LUT=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14];var shift8_LUT=[0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4,5,6,7,8,0,1,2,3,4];function CPU_X86(){var i,tlb_size;this.regs=new Array();for(i=0;i<8;i++){this.regs[i]=0;}
this.eip=0;this.cc_op=0;this.cc_dst=0;this.cc_src=0;this.cc_op2=0;this.cc_dst2=0;this.df=1;this.eflags=0x2;this.cycle_count=0;this.hard_irq=0;this.hard_intno=-1;this.cpl=0;this.cr0=(1<<0);this.cr2=0;this.cr3=0;this.cr4=0;this.segs=new Array();for(i=0;i<7;i++){this.segs[i]={selector:0,base:0,limit:0,flags:0};}
this.segs[2].flags=(1<<22);this.segs[1].flags=(1<<22);this.idt={base:0,limit:0};this.gdt={base:0,limit:0};this.ldt={selector:0,base:0,limit:0,flags:0};this.tr={selector:0,base:0,limit:0,flags:0};this.halted=0;this.phys_mem=null;tlb_size=0x100000;this.tlb_read_kernel=new Int32Array(tlb_size);this.tlb_write_kernel=new Int32Array(tlb_size);this.tlb_read_user=new Int32Array(tlb_size);this.tlb_write_user=new Int32Array(tlb_size);for(i=0;i<tlb_size;i++){this.tlb_read_kernel[i]=-1;this.tlb_write_kernel[i]=-1;this.tlb_read_user[i]=-1;this.tlb_write_user[i]=-1;}
this.tlb_pages=new Int32Array(2048);this.tlb_pages_count=0;}
CPU_X86.prototype.phys_mem_resize=function(new_mem_size){this.mem_size=new_mem_size;new_mem_size+=((15+3)&~3);this.phys_mem=new ArrayBuffer(new_mem_size);this.phys_mem8=new Uint8Array(this.phys_mem,0,new_mem_size);this.phys_mem16=new Uint16Array(this.phys_mem,0,new_mem_size/2);this.phys_mem32=new Int32Array(this.phys_mem,0,new_mem_size/4);};CPU_X86.prototype.ld8_phys=function(mem8_loc){return this.phys_mem8[mem8_loc];};CPU_X86.prototype.st8_phys=function(mem8_loc,x){this.phys_mem8[mem8_loc]=x;};CPU_X86.prototype.ld32_phys=function(mem8_loc){return this.phys_mem32[mem8_loc>>2];};CPU_X86.prototype.st32_phys=function(mem8_loc,x){this.phys_mem32[mem8_loc>>2]=x;};CPU_X86.prototype.tlb_set_page=function(mem8_loc,page_val,set_write_tlb,set_user_tlb){var i,x,j;page_val&=-4096;mem8_loc&=-4096;x=mem8_loc^page_val;i=mem8_loc>>>12;if(this.tlb_read_kernel[i]==-1){if(this.tlb_pages_count>=2048){this.tlb_flush_all1((i-1)&0xfffff);}
this.tlb_pages[this.tlb_pages_count++]=i;}
this.tlb_read_kernel[i]=x;if(set_write_tlb){this.tlb_write_kernel[i]=x;}else{this.tlb_write_kernel[i]=-1;}
if(set_user_tlb){this.tlb_read_user[i]=x;if(set_write_tlb){this.tlb_write_user[i]=x;}else{this.tlb_write_user[i]=-1;}}else{this.tlb_read_user[i]=-1;this.tlb_write_user[i]=-1;}};CPU_X86.prototype.tlb_flush_page=function(mem8_loc){var i;i=mem8_loc>>>12;this.tlb_read_kernel[i]=-1;this.tlb_write_kernel[i]=-1;this.tlb_read_user[i]=-1;this.tlb_write_user[i]=-1;};CPU_X86.prototype.tlb_flush_all=function(){var i,j,n,tlb_pages;tlb_pages=this.tlb_pages;n=this.tlb_pages_count;for(j=0;j<n;j++){i=tlb_pages[j];this.tlb_read_kernel[i]=-1;this.tlb_write_kernel[i]=-1;this.tlb_read_user[i]=-1;this.tlb_write_user[i]=-1;}
this.tlb_pages_count=0;};CPU_X86.prototype.tlb_flush_all1=function(la){var i,j,n,tlb_pages,new_n;tlb_pages=this.tlb_pages;n=this.tlb_pages_count;new_n=0;for(j=0;j<n;j++){i=tlb_pages[j];if(i==la){tlb_pages[new_n++]=i;}else{this.tlb_read_kernel[i]=-1;this.tlb_write_kernel[i]=-1;this.tlb_read_user[i]=-1;this.tlb_write_user[i]=-1;}}
this.tlb_pages_count=new_n;};CPU_X86.prototype.write_string=function(mem8_loc,str){var i;for(i=0;i<str.length;i++){this.st8_phys(mem8_loc++,str.charCodeAt(i)&0xff);}
this.st8_phys(mem8_loc,0);};function hex_rep(x,n){var i,s;var h="0123456789ABCDEF";s="";for(i=n-1;i>=0;i--){s=s+h[(x>>>(i*4))&15];}
return s;}
function _4_bytes_(n){return hex_rep(n,8);}
function _2_bytes_(n){return hex_rep(n,2);}
function _1_byte_(n){return hex_rep(n,4);}
CPU_X86.prototype.dump_short=function(){console.log(" EIP="+_4_bytes_(this.eip)+" EAX="+_4_bytes_(this.regs[0])
+" ECX="+_4_bytes_(this.regs[1])+" EDX="+_4_bytes_(this.regs[2])+" EBX="+_4_bytes_(this.regs[3]));console.log(" EFL="+_4_bytes_(this.eflags)+" ESP="+_4_bytes_(this.regs[4])
+" EBP="+_4_bytes_(this.regs[5])+" ESI="+_4_bytes_(this.regs[6])+" EDI="+_4_bytes_(this.regs[7]));};CPU_X86.prototype.dump=function(){var i,descriptor_table,str;var ta=[" ES"," CS"," SS"," DS"," FS"," GS","LDT"," TR"];this.dump_short();console.log("TSC="+_4_bytes_(this.cycle_count)+" OP="+_2_bytes_(this.cc_op)
+" SRC="+_4_bytes_(this.cc_src)+" DST="+_4_bytes_(this.cc_dst)
+" OP2="+_2_bytes_(this.cc_op2)+" DST2="+_4_bytes_(this.cc_dst2));console.log("CPL="+this.cpl+" CR0="+_4_bytes_(this.cr0)
+" CR2="+_4_bytes_(this.cr2)+" CR3="+_4_bytes_(this.cr3)+" CR4="+_4_bytes_(this.cr4));str="";for(i=0;i<8;i++){if(i==6)
descriptor_table=this.ldt;else if(i==7)
descriptor_table=this.tr;else
descriptor_table=this.segs[i];str+=ta[i]+"="+_1_byte_(descriptor_table.selector)+" "+_4_bytes_(descriptor_table.base)+" "
+_4_bytes_(descriptor_table.limit)+" "+_1_byte_((descriptor_table.flags>>8)&0xf0ff);if(i&1){console.log(str);str="";}else{str+=" ";}}
descriptor_table=this.gdt;str="GDT=     "+_4_bytes_(descriptor_table.base)+" "+_4_bytes_(descriptor_table.limit)+"      ";descriptor_table=this.idt;str+="IDT=     "+_4_bytes_(descriptor_table.base)+" "+_4_bytes_(descriptor_table.limit);console.log(str);};CPU_X86.prototype.exec_internal=function(N_cycles,interrupt){var cpu,mem8_loc,regs;var _src,_dst,_op,_op2,_dst2;var CS_flags,mem8,reg_idx0,OPbyte,reg_idx1,x,y,z,conditional_var,cycles_left,exit_code,v;var CS_base,SS_base,SS_mask,FS_usage_flag,init_CS_flags,iopl;var phys_mem8,last_tlb_val;var phys_mem16,phys_mem32;var tlb_read_kernel,tlb_write_kernel,tlb_read_user,tlb_write_user,_tlb_read_,_tlb_write_;function __ld_8bits_mem8_read(){var tlb_lookup;do_tlb_set_page(mem8_loc,0,cpu.cpl==3);tlb_lookup=_tlb_read_[mem8_loc>>>12]^mem8_loc;return phys_mem8[tlb_lookup];}
function ld_8bits_mem8_read(){var last_tlb_val;return(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
function __ld_16bits_mem8_read(){var x;x=ld_8bits_mem8_read();mem8_loc++;x|=ld_8bits_mem8_read()<<8;mem8_loc--;return x;}
function ld_16bits_mem8_read(){var last_tlb_val;return(((last_tlb_val=_tlb_read_[mem8_loc>>>12])|mem8_loc)&1?__ld_16bits_mem8_read():phys_mem16[(mem8_loc^last_tlb_val)>>1]);}
function __ld_32bits_mem8_read(){var x;x=ld_8bits_mem8_read();mem8_loc++;x|=ld_8bits_mem8_read()<<8;mem8_loc++;x|=ld_8bits_mem8_read()<<16;mem8_loc++;x|=ld_8bits_mem8_read()<<24;mem8_loc-=3;return x;}
function ld_32bits_mem8_read(){var last_tlb_val;return(((last_tlb_val=_tlb_read_[mem8_loc>>>12])|mem8_loc)&3?__ld_32bits_mem8_read():phys_mem32[(mem8_loc^last_tlb_val)>>2]);}
function __ld_8bits_mem8_write(){var tlb_lookup;do_tlb_set_page(mem8_loc,1,cpu.cpl==3);tlb_lookup=_tlb_write_[mem8_loc>>>12]^mem8_loc;return phys_mem8[tlb_lookup];}
function ld_8bits_mem8_write(){var tlb_lookup;return((tlb_lookup=_tlb_write_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_write():phys_mem8[mem8_loc^tlb_lookup];}
function __ld_16bits_mem8_write(){var x;x=ld_8bits_mem8_write();mem8_loc++;x|=ld_8bits_mem8_write()<<8;mem8_loc--;return x;}
function ld_16bits_mem8_write(){var tlb_lookup;return((tlb_lookup=_tlb_write_[mem8_loc>>>12])|mem8_loc)&1?__ld_16bits_mem8_write():phys_mem16[(mem8_loc^tlb_lookup)>>1];}
function __ld_32bits_mem8_write(){var x;x=ld_8bits_mem8_write();mem8_loc++;x|=ld_8bits_mem8_write()<<8;mem8_loc++;x|=ld_8bits_mem8_write()<<16;mem8_loc++;x|=ld_8bits_mem8_write()<<24;mem8_loc-=3;return x;}
function ld_32bits_mem8_write(){var tlb_lookup;return((tlb_lookup=_tlb_write_[mem8_loc>>>12])|mem8_loc)&3?__ld_32bits_mem8_write():phys_mem32[(mem8_loc^tlb_lookup)>>2];}
function __st8_mem8_write(x){var tlb_lookup;do_tlb_set_page(mem8_loc,1,cpu.cpl==3);tlb_lookup=_tlb_write_[mem8_loc>>>12]^mem8_loc;phys_mem8[tlb_lookup]=x;}
function st8_mem8_write(x){var last_tlb_val;{last_tlb_val=_tlb_write_[mem8_loc>>>12];if(last_tlb_val==-1){__st8_mem8_write(x);}else{phys_mem8[mem8_loc^last_tlb_val]=x;}}}
function __st16_mem8_write(x){st8_mem8_write(x);mem8_loc++;st8_mem8_write(x>>8);mem8_loc--;}
function st16_mem8_write(x){var last_tlb_val;{last_tlb_val=_tlb_write_[mem8_loc>>>12];if((last_tlb_val|mem8_loc)&1){__st16_mem8_write(x);}else{phys_mem16[(mem8_loc^last_tlb_val)>>1]=x;}}}
function __st32_mem8_write(x){st8_mem8_write(x);mem8_loc++;st8_mem8_write(x>>8);mem8_loc++;st8_mem8_write(x>>16);mem8_loc++;st8_mem8_write(x>>24);mem8_loc-=3;}
function st32_mem8_write(x){var last_tlb_val;{last_tlb_val=_tlb_write_[mem8_loc>>>12];if((last_tlb_val|mem8_loc)&3){__st32_mem8_write(x);}else{phys_mem32[(mem8_loc^last_tlb_val)>>2]=x;}}}
function __ld8_mem8_kernel_read(){var tlb_lookup;do_tlb_set_page(mem8_loc,0,0);tlb_lookup=tlb_read_kernel[mem8_loc>>>12]^mem8_loc;return phys_mem8[tlb_lookup];}
function ld8_mem8_kernel_read(){var tlb_lookup;return((tlb_lookup=tlb_read_kernel[mem8_loc>>>12])==-1)?__ld8_mem8_kernel_read():phys_mem8[mem8_loc^tlb_lookup];}
function __ld16_mem8_kernel_read(){var x;x=ld8_mem8_kernel_read();mem8_loc++;x|=ld8_mem8_kernel_read()<<8;mem8_loc--;return x;}
function ld16_mem8_kernel_read(){var tlb_lookup;return((tlb_lookup=tlb_read_kernel[mem8_loc>>>12])|mem8_loc)&1?__ld16_mem8_kernel_read():phys_mem16[(mem8_loc^tlb_lookup)>>1];}
function __ld32_mem8_kernel_read(){var x;x=ld8_mem8_kernel_read();mem8_loc++;x|=ld8_mem8_kernel_read()<<8;mem8_loc++;x|=ld8_mem8_kernel_read()<<16;mem8_loc++;x|=ld8_mem8_kernel_read()<<24;mem8_loc-=3;return x;}
function ld32_mem8_kernel_read(){var tlb_lookup;return((tlb_lookup=tlb_read_kernel[mem8_loc>>>12])|mem8_loc)&3?__ld32_mem8_kernel_read():phys_mem32[(mem8_loc^tlb_lookup)>>2];}
function __st8_mem8_kernel_write(x){var tlb_lookup;do_tlb_set_page(mem8_loc,1,0);tlb_lookup=tlb_write_kernel[mem8_loc>>>12]^mem8_loc;phys_mem8[tlb_lookup]=x;}
function st8_mem8_kernel_write(x){var tlb_lookup;tlb_lookup=tlb_write_kernel[mem8_loc>>>12];if(tlb_lookup==-1){__st8_mem8_kernel_write(x);}else{phys_mem8[mem8_loc^tlb_lookup]=x;}}
function __st16_mem8_kernel_write(x){st8_mem8_kernel_write(x);mem8_loc++;st8_mem8_kernel_write(x>>8);mem8_loc--;}
function st16_mem8_kernel_write(x){var tlb_lookup;tlb_lookup=tlb_write_kernel[mem8_loc>>>12];if((tlb_lookup|mem8_loc)&1){__st16_mem8_kernel_write(x);}else{phys_mem16[(mem8_loc^tlb_lookup)>>1]=x;}}
function __st32_mem8_kernel_write(x){st8_mem8_kernel_write(x);mem8_loc++;st8_mem8_kernel_write(x>>8);mem8_loc++;st8_mem8_kernel_write(x>>16);mem8_loc++;st8_mem8_kernel_write(x>>24);mem8_loc-=3;}
function st32_mem8_kernel_write(x){var tlb_lookup;tlb_lookup=tlb_write_kernel[mem8_loc>>>12];if((tlb_lookup|mem8_loc)&3){__st32_mem8_kernel_write(x);}else{phys_mem32[(mem8_loc^tlb_lookup)>>2]=x;}}
var eip,physmem8_ptr,eip_tlb_val,initial_mem_ptr,eip_offset;function ld16_mem8_direct(){var x,y;x=phys_mem8[physmem8_ptr++];y=phys_mem8[physmem8_ptr++];return x|(y<<8);}
function segment_translation(mem8){var base,mem8_loc,Qb,Rb,Sb,Tb;if(FS_usage_flag&&(CS_flags&(0x000f|0x0080))==0){switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:Qb=phys_mem8[physmem8_ptr++];base=Qb&7;if(base==5){{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}}else{mem8_loc=regs[base];}
Rb=(Qb>>3)&7;if(Rb!=4){mem8_loc=(mem8_loc+(regs[Rb]<<(Qb>>6)))>>0;}
break;case 0x0c:Qb=phys_mem8[physmem8_ptr++];mem8_loc=((phys_mem8[physmem8_ptr++]<<24)>>24);base=Qb&7;mem8_loc=(mem8_loc+regs[base])>>0;Rb=(Qb>>3)&7;if(Rb!=4){mem8_loc=(mem8_loc+(regs[Rb]<<(Qb>>6)))>>0;}
break;case 0x14:Qb=phys_mem8[physmem8_ptr++];{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
base=Qb&7;mem8_loc=(mem8_loc+regs[base])>>0;Rb=(Qb>>3)&7;if(Rb!=4){mem8_loc=(mem8_loc+(regs[Rb]<<(Qb>>6)))>>0;}
break;case 0x05:{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:base=mem8&7;mem8_loc=regs[base];break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:mem8_loc=((phys_mem8[physmem8_ptr++]<<24)>>24);base=mem8&7;mem8_loc=(mem8_loc+regs[base])>>0;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:default:{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
base=mem8&7;mem8_loc=(mem8_loc+regs[base])>>0;break;}
return mem8_loc;}else if(CS_flags&0x0080){if((mem8&0xc7)==0x06){mem8_loc=ld16_mem8_direct();Tb=3;}else{switch(mem8>>6){case 0:mem8_loc=0;break;case 1:mem8_loc=((phys_mem8[physmem8_ptr++]<<24)>>24);break;default:mem8_loc=ld16_mem8_direct();break;}
switch(mem8&7){case 0:mem8_loc=(mem8_loc+regs[3]+regs[6])&0xffff;Tb=3;break;case 1:mem8_loc=(mem8_loc+regs[3]+regs[7])&0xffff;Tb=3;break;case 2:mem8_loc=(mem8_loc+regs[5]+regs[6])&0xffff;Tb=2;break;case 3:mem8_loc=(mem8_loc+regs[5]+regs[7])&0xffff;Tb=2;break;case 4:mem8_loc=(mem8_loc+regs[6])&0xffff;Tb=3;break;case 5:mem8_loc=(mem8_loc+regs[7])&0xffff;Tb=3;break;case 6:mem8_loc=(mem8_loc+regs[5])&0xffff;Tb=2;break;case 7:default:mem8_loc=(mem8_loc+regs[3])&0xffff;Tb=3;break;}}
Sb=CS_flags&0x000f;if(Sb==0){Sb=Tb;}else{Sb--;}
mem8_loc=(mem8_loc+cpu.segs[Sb].base)>>0;return mem8_loc;}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:Qb=phys_mem8[physmem8_ptr++];base=Qb&7;if(base==5){{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
base=0;}else{mem8_loc=regs[base];}
Rb=(Qb>>3)&7;if(Rb!=4){mem8_loc=(mem8_loc+(regs[Rb]<<(Qb>>6)))>>0;}
break;case 0x0c:Qb=phys_mem8[physmem8_ptr++];mem8_loc=((phys_mem8[physmem8_ptr++]<<24)>>24);base=Qb&7;mem8_loc=(mem8_loc+regs[base])>>0;Rb=(Qb>>3)&7;if(Rb!=4){mem8_loc=(mem8_loc+(regs[Rb]<<(Qb>>6)))>>0;}
break;case 0x14:Qb=phys_mem8[physmem8_ptr++];{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
base=Qb&7;mem8_loc=(mem8_loc+regs[base])>>0;Rb=(Qb>>3)&7;if(Rb!=4){mem8_loc=(mem8_loc+(regs[Rb]<<(Qb>>6)))>>0;}
break;case 0x05:{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
base=0;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:base=mem8&7;mem8_loc=regs[base];break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:mem8_loc=((phys_mem8[physmem8_ptr++]<<24)>>24);base=mem8&7;mem8_loc=(mem8_loc+regs[base])>>0;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:default:{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
base=mem8&7;mem8_loc=(mem8_loc+regs[base])>>0;break;}
Sb=CS_flags&0x000f;if(Sb==0){if(base==4||base==5)
Sb=2;else
Sb=3;}else{Sb--;}
mem8_loc=(mem8_loc+cpu.segs[Sb].base)>>0;return mem8_loc;}}
function segmented_mem8_loc_for_MOV(){var mem8_loc,Sb;if(CS_flags&0x0080){mem8_loc=ld16_mem8_direct();}else{{mem8_loc=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}}
Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;mem8_loc=(mem8_loc+cpu.segs[Sb].base)>>0;return mem8_loc;}
function set_word_in_register(reg_idx1,x){if(reg_idx1&4)
regs[reg_idx1&3]=(regs[reg_idx1&3]&-65281)|((x&0xff)<<8);else
regs[reg_idx1&3]=(regs[reg_idx1&3]&-256)|(x&0xff);}
function set_lower_word_in_register(reg_idx1,x){regs[reg_idx1]=(regs[reg_idx1]&-65536)|(x&0xffff);}
function do_32bit_math(conditional_var,Yb,Zb){var ac;switch(conditional_var){case 0:_src=Zb;Yb=(Yb+Zb)>>0;_dst=Yb;_op=2;break;case 1:Yb=Yb|Zb;_dst=Yb;_op=14;break;case 2:ac=check_carry();_src=Zb;Yb=(Yb+Zb+ac)>>0;_dst=Yb;_op=ac?5:2;break;case 3:ac=check_carry();_src=Zb;Yb=(Yb-Zb-ac)>>0;_dst=Yb;_op=ac?11:8;break;case 4:Yb=Yb&Zb;_dst=Yb;_op=14;break;case 5:_src=Zb;Yb=(Yb-Zb)>>0;_dst=Yb;_op=8;break;case 6:Yb=Yb^Zb;_dst=Yb;_op=14;break;case 7:_src=Zb;_dst=(Yb-Zb)>>0;_op=8;break;default:throw"arith"+cc+": invalid op";}
return Yb;}
function do_16bit_math(conditional_var,Yb,Zb){var ac;switch(conditional_var){case 0:_src=Zb;Yb=(((Yb+Zb)<<16)>>16);_dst=Yb;_op=1;break;case 1:Yb=(((Yb|Zb)<<16)>>16);_dst=Yb;_op=13;break;case 2:ac=check_carry();_src=Zb;Yb=(((Yb+Zb+ac)<<16)>>16);_dst=Yb;_op=ac?4:1;break;case 3:ac=check_carry();_src=Zb;Yb=(((Yb-Zb-ac)<<16)>>16);_dst=Yb;_op=ac?10:7;break;case 4:Yb=(((Yb&Zb)<<16)>>16);_dst=Yb;_op=13;break;case 5:_src=Zb;Yb=(((Yb-Zb)<<16)>>16);_dst=Yb;_op=7;break;case 6:Yb=(((Yb^Zb)<<16)>>16);_dst=Yb;_op=13;break;case 7:_src=Zb;_dst=(((Yb-Zb)<<16)>>16);_op=7;break;default:throw"arith"+cc+": invalid op";}
return Yb;}
function increment_16bit(x){if(_op<25){_op2=_op;_dst2=_dst;}
_dst=(((x+1)<<16)>>16);_op=26;return _dst;}
function decrement_16bit(x){if(_op<25){_op2=_op;_dst2=_dst;}
_dst=(((x-1)<<16)>>16);_op=29;return _dst;}
function do_8bit_math(conditional_var,Yb,Zb){var ac;switch(conditional_var){case 0:_src=Zb;Yb=(((Yb+Zb)<<24)>>24);_dst=Yb;_op=0;break;case 1:Yb=(((Yb|Zb)<<24)>>24);_dst=Yb;_op=12;break;case 2:ac=check_carry();_src=Zb;Yb=(((Yb+Zb+ac)<<24)>>24);_dst=Yb;_op=ac?3:0;break;case 3:ac=check_carry();_src=Zb;Yb=(((Yb-Zb-ac)<<24)>>24);_dst=Yb;_op=ac?9:6;break;case 4:Yb=(((Yb&Zb)<<24)>>24);_dst=Yb;_op=12;break;case 5:_src=Zb;Yb=(((Yb-Zb)<<24)>>24);_dst=Yb;_op=6;break;case 6:Yb=(((Yb^Zb)<<24)>>24);_dst=Yb;_op=12;break;case 7:_src=Zb;_dst=(((Yb-Zb)<<24)>>24);_op=6;break;default:throw"arith"+cc+": invalid op";}
return Yb;}
function increment_8bit(x){if(_op<25){_op2=_op;_dst2=_dst;}
_dst=(((x+1)<<24)>>24);_op=25;return _dst;}
function decrement_8bit(x){if(_op<25){_op2=_op;_dst2=_dst;}
_dst=(((x-1)<<24)>>24);_op=28;return _dst;}
function shift8(conditional_var,Yb,Zb){var kc,ac;switch(conditional_var){case 0:if(Zb&0x1f){Zb&=0x7;Yb&=0xff;kc=Yb;Yb=(Yb<<Zb)|(Yb>>>(8-Zb));_src=conditional_flags_for_rot_shift_ops();_src|=(Yb&0x0001)|(((kc^Yb)<<4)&0x0800);_dst=((_src>>6)&1)^1;_op=24;}
break;case 1:if(Zb&0x1f){Zb&=0x7;Yb&=0xff;kc=Yb;Yb=(Yb>>>Zb)|(Yb<<(8-Zb));_src=conditional_flags_for_rot_shift_ops();_src|=((Yb>>7)&0x0001)|(((kc^Yb)<<4)&0x0800);_dst=((_src>>6)&1)^1;_op=24;}
break;case 2:Zb=shift8_LUT[Zb&0x1f];if(Zb){Yb&=0xff;kc=Yb;ac=check_carry();Yb=(Yb<<Zb)|(ac<<(Zb-1));if(Zb>1)
Yb|=kc>>>(9-Zb);_src=conditional_flags_for_rot_shift_ops();_src|=(((kc^Yb)<<4)&0x0800)|((kc>>(8-Zb))&0x0001);_dst=((_src>>6)&1)^1;_op=24;}
break;case 3:Zb=shift8_LUT[Zb&0x1f];if(Zb){Yb&=0xff;kc=Yb;ac=check_carry();Yb=(Yb>>>Zb)|(ac<<(8-Zb));if(Zb>1)
Yb|=kc<<(9-Zb);_src=conditional_flags_for_rot_shift_ops();_src|=(((kc^Yb)<<4)&0x0800)|((kc>>(Zb-1))&0x0001);_dst=((_src>>6)&1)^1;_op=24;}
break;case 4:case 6:Zb&=0x1f;if(Zb){_src=Yb<<(Zb-1);_dst=Yb=(((Yb<<Zb)<<24)>>24);_op=15;}
break;case 5:Zb&=0x1f;if(Zb){Yb&=0xff;_src=Yb>>>(Zb-1);_dst=Yb=(((Yb>>>Zb)<<24)>>24);_op=18;}
break;case 7:Zb&=0x1f;if(Zb){Yb=(Yb<<24)>>24;_src=Yb>>(Zb-1);_dst=Yb=(((Yb>>Zb)<<24)>>24);_op=18;}
break;default:throw"unsupported shift8="+conditional_var;}
return Yb;}
function shift16(conditional_var,Yb,Zb){var kc,ac;switch(conditional_var){case 0:if(Zb&0x1f){Zb&=0xf;Yb&=0xffff;kc=Yb;Yb=(Yb<<Zb)|(Yb>>>(16-Zb));_src=conditional_flags_for_rot_shift_ops();_src|=(Yb&0x0001)|(((kc^Yb)>>4)&0x0800);_dst=((_src>>6)&1)^1;_op=24;}
break;case 1:if(Zb&0x1f){Zb&=0xf;Yb&=0xffff;kc=Yb;Yb=(Yb>>>Zb)|(Yb<<(16-Zb));_src=conditional_flags_for_rot_shift_ops();_src|=((Yb>>15)&0x0001)|(((kc^Yb)>>4)&0x0800);_dst=((_src>>6)&1)^1;_op=24;}
break;case 2:Zb=shift16_LUT[Zb&0x1f];if(Zb){Yb&=0xffff;kc=Yb;ac=check_carry();Yb=(Yb<<Zb)|(ac<<(Zb-1));if(Zb>1)
Yb|=kc>>>(17-Zb);_src=conditional_flags_for_rot_shift_ops();_src|=(((kc^Yb)>>4)&0x0800)|((kc>>(16-Zb))&0x0001);_dst=((_src>>6)&1)^1;_op=24;}
break;case 3:Zb=shift16_LUT[Zb&0x1f];if(Zb){Yb&=0xffff;kc=Yb;ac=check_carry();Yb=(Yb>>>Zb)|(ac<<(16-Zb));if(Zb>1)
Yb|=kc<<(17-Zb);_src=conditional_flags_for_rot_shift_ops();_src|=(((kc^Yb)>>4)&0x0800)|((kc>>(Zb-1))&0x0001);_dst=((_src>>6)&1)^1;_op=24;}
break;case 4:case 6:Zb&=0x1f;if(Zb){_src=Yb<<(Zb-1);_dst=Yb=(((Yb<<Zb)<<16)>>16);_op=16;}
break;case 5:Zb&=0x1f;if(Zb){Yb&=0xffff;_src=Yb>>>(Zb-1);_dst=Yb=(((Yb>>>Zb)<<16)>>16);_op=19;}
break;case 7:Zb&=0x1f;if(Zb){Yb=(Yb<<16)>>16;_src=Yb>>(Zb-1);_dst=Yb=(((Yb>>Zb)<<16)>>16);_op=19;}
break;default:throw"unsupported shift16="+conditional_var;}
return Yb;}
function shift32(conditional_var,Yb,Zb){var kc,ac;switch(conditional_var){case 0:Zb&=0x1f;if(Zb){kc=Yb;Yb=(Yb<<Zb)|(Yb>>>(32-Zb));_src=conditional_flags_for_rot_shift_ops();_src|=(Yb&0x0001)|(((kc^Yb)>>20)&0x0800);_dst=((_src>>6)&1)^1;_op=24;}
break;case 1:Zb&=0x1f;if(Zb){kc=Yb;Yb=(Yb>>>Zb)|(Yb<<(32-Zb));_src=conditional_flags_for_rot_shift_ops();_src|=((Yb>>31)&0x0001)|(((kc^Yb)>>20)&0x0800);_dst=((_src>>6)&1)^1;_op=24;}
break;case 2:Zb&=0x1f;if(Zb){kc=Yb;ac=check_carry();Yb=(Yb<<Zb)|(ac<<(Zb-1));if(Zb>1)
Yb|=kc>>>(33-Zb);_src=conditional_flags_for_rot_shift_ops();_src|=(((kc^Yb)>>20)&0x0800)|((kc>>(32-Zb))&0x0001);_dst=((_src>>6)&1)^1;_op=24;}
break;case 3:Zb&=0x1f;if(Zb){kc=Yb;ac=check_carry();Yb=(Yb>>>Zb)|(ac<<(32-Zb));if(Zb>1)
Yb|=kc<<(33-Zb);_src=conditional_flags_for_rot_shift_ops();_src|=(((kc^Yb)>>20)&0x0800)|((kc>>(Zb-1))&0x0001);_dst=((_src>>6)&1)^1;_op=24;}
break;case 4:case 6:Zb&=0x1f;if(Zb){_src=Yb<<(Zb-1);_dst=Yb=Yb<<Zb;_op=17;}
break;case 5:Zb&=0x1f;if(Zb){_src=Yb>>>(Zb-1);_dst=Yb=Yb>>>Zb;_op=20;}
break;case 7:Zb&=0x1f;if(Zb){_src=Yb>>(Zb-1);_dst=Yb=Yb>>Zb;_op=20;}
break;default:throw"unsupported shift32="+conditional_var;}
return Yb;}
function op_16_SHRD_SHLD(conditional_var,Yb,Zb,pc){var bool;pc&=0x1f;if(pc){if(conditional_var==0){Zb&=0xffff;bool=Zb|(Yb<<16);_src=bool>>(32-pc);bool<<=pc;if(pc>16)
bool|=Zb<<(pc-16);Yb=_dst=bool>>16;_op=19;}else{bool=(Yb&0xffff)|(Zb<<16);_src=bool>>(pc-1);bool>>=pc;if(pc>16)
bool|=Zb<<(32-pc);Yb=_dst=(((bool)<<16)>>16);_op=19;}}
return Yb;}
function op_SHLD(Yb,Zb,pc){pc&=0x1f;if(pc){_src=Yb<<(pc-1);_dst=Yb=(Yb<<pc)|(Zb>>>(32-pc));_op=17;}
return Yb;}
function op_SHRD(Yb,Zb,pc){pc&=0x1f;if(pc){_src=Yb>>(pc-1);_dst=Yb=(Yb>>>pc)|(Zb<<(32-pc));_op=20;}
return Yb;}
function op_16_BT(Yb,Zb){Zb&=0xf;_src=Yb>>Zb;_op=19;}
function op_BT(Yb,Zb){Zb&=0x1f;_src=Yb>>Zb;_op=20;}
function op_16_BTS_BTR_BTC(conditional_var,Yb,Zb){var wc;Zb&=0xf;_src=Yb>>Zb;wc=1<<Zb;switch(conditional_var){case 1:Yb|=wc;break;case 2:Yb&=~wc;break;case 3:default:Yb^=wc;break;}
_op=19;return Yb;}
function op_BTS_BTR_BTC(conditional_var,Yb,Zb){var wc;Zb&=0x1f;_src=Yb>>Zb;wc=1<<Zb;switch(conditional_var){case 1:Yb|=wc;break;case 2:Yb&=~wc;break;case 3:default:Yb^=wc;break;}
_op=20;return Yb;}
function op_16_BSF(Yb,Zb){Zb&=0xffff;if(Zb){Yb=0;while((Zb&1)==0){Yb++;Zb>>=1;}
_dst=1;}else{_dst=0;}
_op=14;return Yb;}
function op_BSF(Yb,Zb){if(Zb){Yb=0;while((Zb&1)==0){Yb++;Zb>>=1;}
_dst=1;}else{_dst=0;}
_op=14;return Yb;}
function op_16_BSR(Yb,Zb){Zb&=0xffff;if(Zb){Yb=15;while((Zb&0x8000)==0){Yb--;Zb<<=1;}
_dst=1;}else{_dst=0;}
_op=14;return Yb;}
function op_BSR(Yb,Zb){if(Zb){Yb=31;while(Zb>=0){Yb--;Zb<<=1;}
_dst=1;}else{_dst=0;}
_op=14;return Yb;}
function op_DIV(OPbyte){var a,q,r;a=regs[0]&0xffff;OPbyte&=0xff;if((a>>8)>=OPbyte)
abort(0);q=(a/OPbyte)>>0;r=(a%OPbyte);set_lower_word_in_register(0,(q&0xff)|(r<<8));}
function op_IDIV(OPbyte){var a,q,r;a=(regs[0]<<16)>>16;OPbyte=(OPbyte<<24)>>24;if(OPbyte==0)
abort(0);q=(a/OPbyte)>>0;if(((q<<24)>>24)!=q)
abort(0);r=(a%OPbyte);set_lower_word_in_register(0,(q&0xff)|(r<<8));}
function op_16_DIV(OPbyte){var a,q,r;a=(regs[2]<<16)|(regs[0]&0xffff);OPbyte&=0xffff;if((a>>>16)>=OPbyte)
abort(0);q=(a/OPbyte)>>0;r=(a%OPbyte);set_lower_word_in_register(0,q);set_lower_word_in_register(2,r);}
function op_16_IDIV(OPbyte){var a,q,r;a=(regs[2]<<16)|(regs[0]&0xffff);OPbyte=(OPbyte<<16)>>16;if(OPbyte==0)
abort(0);q=(a/OPbyte)>>0;if(((q<<16)>>16)!=q)
abort(0);r=(a%OPbyte);set_lower_word_in_register(0,q);set_lower_word_in_register(2,r);}
function op_DIV32(Ic,Jc,OPbyte){var a,i,Kc;Ic=Ic>>>0;Jc=Jc>>>0;OPbyte=OPbyte>>>0;if(Ic>=OPbyte){abort(0);}
if(Ic>=0&&Ic<=0x200000){a=Ic*4294967296+Jc;v=(a%OPbyte)>>0;return(a/OPbyte)>>0;}else{for(i=0;i<32;i++){Kc=Ic>>31;Ic=((Ic<<1)|(Jc>>>31))>>>0;if(Kc||Ic>=OPbyte){Ic=Ic-OPbyte;Jc=(Jc<<1)|1;}else{Jc=Jc<<1;}}
v=Ic>>0;return Jc;}}
function op_IDIV32(Ic,Jc,OPbyte){var Mc,Nc,q;if(Ic<0){Mc=1;Ic=~Ic;Jc=(-Jc)>>0;if(Jc==0)
Ic=(Ic+1)>>0;}else{Mc=0;}
if(OPbyte<0){OPbyte=(-OPbyte)>>0;Nc=1;}else{Nc=0;}
q=op_DIV32(Ic,Jc,OPbyte);Nc^=Mc;if(Nc){if((q>>>0)>0x80000000)
abort(0);q=(-q)>>0;}else{if((q>>>0)>=0x80000000)
abort(0);}
if(Mc){v=(-v)>>0;}
return q;}
function op_MUL(a,OPbyte){var bool;a&=0xff;OPbyte&=0xff;bool=(regs[0]&0xff)*(OPbyte&0xff);_src=bool>>8;_dst=(((bool)<<24)>>24);_op=21;return bool;}
function op_IMUL(a,OPbyte){var bool;a=(((a)<<24)>>24);OPbyte=(((OPbyte)<<24)>>24);bool=(a*OPbyte)>>0;_dst=(((bool)<<24)>>24);_src=(bool!=_dst)>>0;_op=21;return bool;}
function op_16_MUL(a,OPbyte){var bool;bool=((a&0xffff)*(OPbyte&0xffff))>>0;_src=bool>>>16;_dst=(((bool)<<16)>>16);_op=22;return bool;}
function op_16_IMUL(a,OPbyte){var bool;a=(a<<16)>>16;OPbyte=(OPbyte<<16)>>16;bool=(a*OPbyte)>>0;_dst=(((bool)<<16)>>16);_src=(bool!=_dst)>>0;_op=22;return bool;}
function do_multiply32(a,OPbyte){var r,Jc,Ic,Tc,Uc,m;a=a>>>0;OPbyte=OPbyte>>>0;r=a*OPbyte;if(r<=0xffffffff){v=0;r&=-1;}else{Jc=a&0xffff;Ic=a>>>16;Tc=OPbyte&0xffff;Uc=OPbyte>>>16;r=Jc*Tc;v=Ic*Uc;m=Jc*Uc;r+=(((m&0xffff)<<16)>>>0);v+=(m>>>16);if(r>=4294967296){r-=4294967296;v++;}
m=Ic*Tc;r+=(((m&0xffff)<<16)>>>0);v+=(m>>>16);if(r>=4294967296){r-=4294967296;v++;}
r&=-1;v&=-1;}
return r;}
function op_MUL32(a,OPbyte){_dst=do_multiply32(a,OPbyte);_src=v;_op=23;return _dst;}
function op_IMUL32(a,OPbyte){var s,r;s=0;if(a<0){a=-a;s=1;}
if(OPbyte<0){OPbyte=-OPbyte;s^=1;}
r=do_multiply32(a,OPbyte);if(s){v=~v;r=(-r)>>0;if(r==0){v=(v+1)>>0;}}
_dst=r;_src=(v-(r>>31))>>0;_op=23;return r;}
function check_carry(){var Yb,bool,current_op,relevant_dst;if(_op>=25){current_op=_op2;relevant_dst=_dst2;}else{current_op=_op;relevant_dst=_dst;}
switch(current_op){case 0:bool=(relevant_dst&0xff)<(_src&0xff);break;case 1:bool=(relevant_dst&0xffff)<(_src&0xffff);break;case 2:bool=(relevant_dst>>>0)<(_src>>>0);break;case 3:bool=(relevant_dst&0xff)<=(_src&0xff);break;case 4:bool=(relevant_dst&0xffff)<=(_src&0xffff);break;case 5:bool=(relevant_dst>>>0)<=(_src>>>0);break;case 6:bool=((relevant_dst+_src)&0xff)<(_src&0xff);break;case 7:bool=((relevant_dst+_src)&0xffff)<(_src&0xffff);break;case 8:bool=((relevant_dst+_src)>>>0)<(_src>>>0);break;case 9:Yb=(relevant_dst+_src+1)&0xff;bool=Yb<=(_src&0xff);break;case 10:Yb=(relevant_dst+_src+1)&0xffff;bool=Yb<=(_src&0xffff);break;case 11:Yb=(relevant_dst+_src+1)>>>0;bool=Yb<=(_src>>>0);break;case 12:case 13:case 14:bool=0;break;case 15:bool=(_src>>7)&1;break;case 16:bool=(_src>>15)&1;break;case 17:bool=(_src>>31)&1;break;case 18:case 19:case 20:bool=_src&1;break;case 21:case 22:case 23:bool=_src!=0;break;case 24:bool=_src&1;break;default:throw"GET_CARRY: unsupported cc_op="+_op;}
return bool;}
function check_overflow(){var bool,Yb;switch(_op){case 0:Yb=(_dst-_src)>>0;bool=(((Yb^_src^-1)&(Yb^_dst))>>7)&1;break;case 1:Yb=(_dst-_src)>>0;bool=(((Yb^_src^-1)&(Yb^_dst))>>15)&1;break;case 2:Yb=(_dst-_src)>>0;bool=(((Yb^_src^-1)&(Yb^_dst))>>31)&1;break;case 3:Yb=(_dst-_src-1)>>0;bool=(((Yb^_src^-1)&(Yb^_dst))>>7)&1;break;case 4:Yb=(_dst-_src-1)>>0;bool=(((Yb^_src^-1)&(Yb^_dst))>>15)&1;break;case 5:Yb=(_dst-_src-1)>>0;bool=(((Yb^_src^-1)&(Yb^_dst))>>31)&1;break;case 6:Yb=(_dst+_src)>>0;bool=(((Yb^_src)&(Yb^_dst))>>7)&1;break;case 7:Yb=(_dst+_src)>>0;bool=(((Yb^_src)&(Yb^_dst))>>15)&1;break;case 8:Yb=(_dst+_src)>>0;bool=(((Yb^_src)&(Yb^_dst))>>31)&1;break;case 9:Yb=(_dst+_src+1)>>0;bool=(((Yb^_src)&(Yb^_dst))>>7)&1;break;case 10:Yb=(_dst+_src+1)>>0;bool=(((Yb^_src)&(Yb^_dst))>>15)&1;break;case 11:Yb=(_dst+_src+1)>>0;bool=(((Yb^_src)&(Yb^_dst))>>31)&1;break;case 12:case 13:case 14:bool=0;break;case 15:case 18:bool=((_src^_dst)>>7)&1;break;case 16:case 19:bool=((_src^_dst)>>15)&1;break;case 17:case 20:bool=((_src^_dst)>>31)&1;break;case 21:case 22:case 23:bool=_src!=0;break;case 24:bool=(_src>>11)&1;break;case 25:bool=(_dst&0xff)==0x80;break;case 26:bool=(_dst&0xffff)==0x8000;break;case 27:bool=(_dst==-2147483648);break;case 28:bool=(_dst&0xff)==0x7f;break;case 29:bool=(_dst&0xffff)==0x7fff;break;case 30:bool=_dst==0x7fffffff;break;default:throw"JO: unsupported cc_op="+_op;}
return bool;}
function check_below_or_equal(){var bool;switch(_op){case 6:bool=((_dst+_src)&0xff)<=(_src&0xff);break;case 7:bool=((_dst+_src)&0xffff)<=(_src&0xffff);break;case 8:bool=((_dst+_src)>>>0)<=(_src>>>0);break;case 24:bool=(_src&(0x0040|0x0001))!=0;break;default:bool=check_carry()|(_dst==0);break;}
return bool;}
function check_parity(){if(_op==24){return(_src>>2)&1;}else{return parity_LUT[_dst&0xff];}}
function check_less_than(){var bool;switch(_op){case 6:bool=((_dst+_src)<<24)<(_src<<24);break;case 7:bool=((_dst+_src)<<16)<(_src<<16);break;case 8:bool=((_dst+_src)>>0)<_src;break;case 12:case 25:case 28:case 13:case 26:case 29:case 14:case 27:case 30:bool=_dst<0;break;case 24:bool=((_src>>7)^(_src>>11))&1;break;default:bool=(_op==24?((_src>>7)&1):(_dst<0))^check_overflow();break;}
return bool;}
function check_less_or_equal(){var bool;switch(_op){case 6:bool=((_dst+_src)<<24)<=(_src<<24);break;case 7:bool=((_dst+_src)<<16)<=(_src<<16);break;case 8:bool=((_dst+_src)>>0)<=_src;break;case 12:case 25:case 28:case 13:case 26:case 29:case 14:case 27:case 30:bool=_dst<=0;break;case 24:bool=(((_src>>7)^(_src>>11))|(_src>>6))&1;break;default:bool=((_op==24?((_src>>7)&1):(_dst<0))^check_overflow())|(_dst==0);break;}
return bool;}
function check_adjust_flag(){var Yb,bool;switch(_op){case 0:case 1:case 2:Yb=(_dst-_src)>>0;bool=(_dst^Yb^_src)&0x10;break;case 3:case 4:case 5:Yb=(_dst-_src-1)>>0;bool=(_dst^Yb^_src)&0x10;break;case 6:case 7:case 8:Yb=(_dst+_src)>>0;bool=(_dst^Yb^_src)&0x10;break;case 9:case 10:case 11:Yb=(_dst+_src+1)>>0;bool=(_dst^Yb^_src)&0x10;break;case 12:case 13:case 14:bool=0;break;case 15:case 18:case 16:case 19:case 17:case 20:case 21:case 22:case 23:bool=0;break;case 24:bool=_src&0x10;break;case 25:case 26:case 27:bool=(_dst^(_dst-1))&0x10;break;case 28:case 29:case 30:bool=(_dst^(_dst+1))&0x10;break;default:throw"AF: unsupported cc_op="+_op;}
return bool;}
function check_status_bits_for_jump(gd){var bool;switch(gd>>1){case 0:bool=check_overflow();break;case 1:bool=check_carry();break;case 2:bool=(_dst==0);break;case 3:bool=check_below_or_equal();break;case 4:bool=(_op==24?((_src>>7)&1):(_dst<0));break;case 5:bool=check_parity();break;case 6:bool=check_less_than();break;case 7:bool=check_less_or_equal();break;default:throw"unsupported cond: "+gd;}
return bool^(gd&1);}
function conditional_flags_for_rot_shift_ops(){return(check_parity()<<2)|((_dst==0)<<6)|((_op==24?((_src>>7)&1):(_dst<0))<<7)|check_adjust_flag();}
function get_conditional_flags(){return(check_carry()<<0)|(check_parity()<<2)|((_dst==0)<<6)|((_op==24?((_src>>7)&1):(_dst<0))<<7)|(check_overflow()<<11)|check_adjust_flag();}
function get_FLAGS(){var flag_bits;flag_bits=get_conditional_flags();flag_bits|=cpu.df&0x00000400;flag_bits|=cpu.eflags;return flag_bits;}
function set_FLAGS(flag_bits,ld){_src=flag_bits&(0x0800|0x0080|0x0040|0x0010|0x0004|0x0001);_dst=((_src>>6)&1)^1;_op=24;cpu.df=1-(2*((flag_bits>>10)&1));cpu.eflags=(cpu.eflags&~ld)|(flag_bits&ld);}
function current_cycle_count(){return cpu.cycle_count+(N_cycles-cycles_left);}
function cpu_abort(str){throw"CPU abort: "+str;}
function cpu_dump(){cpu.eip=eip;cpu.cc_src=_src;cpu.cc_dst=_dst;cpu.cc_op=_op;cpu.cc_op2=_op2;cpu.cc_dst2=_dst2;cpu.dump();}
function cpu_dump_short(){cpu.eip=eip;cpu.cc_src=_src;cpu.cc_dst=_dst;cpu.cc_op=_op;cpu.cc_op2=_op2;cpu.cc_dst2=_dst2;cpu.dump_short();}
function abort_with_error_code(intno,error_code){cpu.cycle_count+=(N_cycles-cycles_left);cpu.eip=eip;cpu.cc_src=_src;cpu.cc_dst=_dst;cpu.cc_op=_op;cpu.cc_op2=_op2;cpu.cc_dst2=_dst2;throw{intno:intno,error_code:error_code};}
function abort(intno){abort_with_error_code(intno,0);}
function change_permission_level(sd){cpu.cpl=sd;if(cpu.cpl==3){_tlb_read_=tlb_read_user;_tlb_write_=tlb_write_user;}else{_tlb_read_=tlb_read_kernel;_tlb_write_=tlb_write_kernel;}}
function do_tlb_lookup(mem8_loc,ud){var tlb_lookup;if(ud){tlb_lookup=_tlb_write_[mem8_loc>>>12];}else{tlb_lookup=_tlb_read_[mem8_loc>>>12];}
if(tlb_lookup==-1){do_tlb_set_page(mem8_loc,ud,cpu.cpl==3);if(ud){tlb_lookup=_tlb_write_[mem8_loc>>>12];}else{tlb_lookup=_tlb_read_[mem8_loc>>>12];}}
return tlb_lookup^mem8_loc;}
function push_word_to_stack(x){var wd;wd=regs[4]-2;mem8_loc=((wd&SS_mask)+SS_base)>>0;st16_mem8_write(x);regs[4]=(regs[4]&~SS_mask)|((wd)&SS_mask);}
function push_dword_to_stack(x){var wd;wd=regs[4]-4;mem8_loc=((wd&SS_mask)+SS_base)>>0;st32_mem8_write(x);regs[4]=(regs[4]&~SS_mask)|((wd)&SS_mask);}
function pop_word_from_stack_read(){mem8_loc=((regs[4]&SS_mask)+SS_base)>>0;return ld_16bits_mem8_read();}
function pop_word_from_stack_incr_ptr(){regs[4]=(regs[4]&~SS_mask)|((regs[4]+2)&SS_mask);}
function pop_dword_from_stack_read(){mem8_loc=((regs[4]&SS_mask)+SS_base)>>0;return ld_32bits_mem8_read();}
function pop_dword_from_stack_incr_ptr(){regs[4]=(regs[4]&~SS_mask)|((regs[4]+4)&SS_mask);}
function operation_size_function(eip_offset,OPbyte){var n,CS_flags,l,mem8,local_OPbyte_var,base,conditional_var,stride;n=1;CS_flags=init_CS_flags;if(CS_flags&0x0100)
stride=2;else
stride=4;EXEC_LOOP:for(;;){switch(OPbyte){case 0x66:if(init_CS_flags&0x0100){stride=4;CS_flags&=~0x0100;}else{stride=2;CS_flags|=0x0100;}
case 0xf0:case 0xf2:case 0xf3:case 0x26:case 0x2e:case 0x36:case 0x3e:case 0x64:case 0x65:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;OPbyte=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
break;case 0x67:if(init_CS_flags&0x0080){CS_flags&=~0x0080;}else{CS_flags|=0x0080;}
{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;OPbyte=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
break;case 0x91:case 0x92:case 0x93:case 0x94:case 0x95:case 0x96:case 0x97:case 0x40:case 0x41:case 0x42:case 0x43:case 0x44:case 0x45:case 0x46:case 0x47:case 0x48:case 0x49:case 0x4a:case 0x4b:case 0x4c:case 0x4d:case 0x4e:case 0x4f:case 0x50:case 0x51:case 0x52:case 0x53:case 0x54:case 0x55:case 0x56:case 0x57:case 0x58:case 0x59:case 0x5a:case 0x5b:case 0x5c:case 0x5d:case 0x5e:case 0x5f:case 0x98:case 0x99:case 0xc9:case 0x9c:case 0x9d:case 0x06:case 0x0e:case 0x16:case 0x1e:case 0x07:case 0x17:case 0x1f:case 0xc3:case 0xcb:case 0x90:case 0xcc:case 0xce:case 0xcf:case 0xf5:case 0xf8:case 0xf9:case 0xfc:case 0xfd:case 0xfa:case 0xfb:case 0x9e:case 0x9f:case 0xf4:case 0xa4:case 0xa5:case 0xaa:case 0xab:case 0xa6:case 0xa7:case 0xac:case 0xad:case 0xae:case 0xaf:case 0x9b:case 0xec:case 0xed:case 0xee:case 0xef:case 0xd7:case 0x27:case 0x2f:case 0x37:case 0x3f:case 0x60:case 0x61:case 0x6c:case 0x6d:case 0x6e:case 0x6f:break EXEC_LOOP;case 0xb0:case 0xb1:case 0xb2:case 0xb3:case 0xb4:case 0xb5:case 0xb6:case 0xb7:case 0x04:case 0x0c:case 0x14:case 0x1c:case 0x24:case 0x2c:case 0x34:case 0x3c:case 0xa8:case 0x6a:case 0xeb:case 0x70:case 0x71:case 0x72:case 0x73:case 0x76:case 0x77:case 0x78:case 0x79:case 0x7a:case 0x7b:case 0x7c:case 0x7d:case 0x7e:case 0x7f:case 0x74:case 0x75:case 0xe0:case 0xe1:case 0xe2:case 0xe3:case 0xcd:case 0xe4:case 0xe5:case 0xe6:case 0xe7:case 0xd4:case 0xd5:n++;if(n>15)
abort(6);break EXEC_LOOP;case 0xb8:case 0xb9:case 0xba:case 0xbb:case 0xbc:case 0xbd:case 0xbe:case 0xbf:case 0x05:case 0x0d:case 0x15:case 0x1d:case 0x25:case 0x2d:case 0x35:case 0x3d:case 0xa9:case 0x68:case 0xe9:case 0xe8:n+=stride;if(n>15)
abort(6);break EXEC_LOOP;case 0x88:case 0x89:case 0x8a:case 0x8b:case 0x86:case 0x87:case 0x8e:case 0x8c:case 0xc4:case 0xc5:case 0x00:case 0x08:case 0x10:case 0x18:case 0x20:case 0x28:case 0x30:case 0x38:case 0x01:case 0x09:case 0x11:case 0x19:case 0x21:case 0x29:case 0x31:case 0x39:case 0x02:case 0x0a:case 0x12:case 0x1a:case 0x22:case 0x2a:case 0x32:case 0x3a:case 0x03:case 0x0b:case 0x13:case 0x1b:case 0x23:case 0x2b:case 0x33:case 0x3b:case 0x84:case 0x85:case 0xd0:case 0xd1:case 0xd2:case 0xd3:case 0x8f:case 0x8d:case 0xfe:case 0xff:case 0xd8:case 0xd9:case 0xda:case 0xdb:case 0xdc:case 0xdd:case 0xde:case 0xdf:case 0x62:case 0x63:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
break EXEC_LOOP;case 0xa0:case 0xa1:case 0xa2:case 0xa3:if(CS_flags&0x0100)
n+=2;else
n+=4;if(n>15)
abort(6);break EXEC_LOOP;case 0xc6:case 0x80:case 0x82:case 0x83:case 0x6b:case 0xc0:case 0xc1:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
n++;if(n>15)
abort(6);break EXEC_LOOP;case 0xc7:case 0x81:case 0x69:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
n+=stride;if(n>15)
abort(6);break EXEC_LOOP;case 0xf6:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
conditional_var=(mem8>>3)&7;if(conditional_var==0){n++;if(n>15)
abort(6);}
break EXEC_LOOP;case 0xf7:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
conditional_var=(mem8>>3)&7;if(conditional_var==0){n+=stride;if(n>15)
abort(6);}
break EXEC_LOOP;case 0xea:case 0x9a:n+=2+stride;if(n>15)
abort(6);break EXEC_LOOP;case 0xc2:case 0xca:n+=2;if(n>15)
abort(6);break EXEC_LOOP;case 0xc8:n+=3;if(n>15)
abort(6);break EXEC_LOOP;case 0xd6:case 0xf1:default:abort(6);case 0x0f:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;OPbyte=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
switch(OPbyte){case 0x06:case 0xa2:case 0x31:case 0xa0:case 0xa8:case 0xa1:case 0xa9:case 0xc8:case 0xc9:case 0xca:case 0xcb:case 0xcc:case 0xcd:case 0xce:case 0xcf:break EXEC_LOOP;case 0x80:case 0x81:case 0x82:case 0x83:case 0x84:case 0x85:case 0x86:case 0x87:case 0x88:case 0x89:case 0x8a:case 0x8b:case 0x8c:case 0x8d:case 0x8e:case 0x8f:n+=stride;if(n>15)
abort(6);break EXEC_LOOP;case 0x90:case 0x91:case 0x92:case 0x93:case 0x94:case 0x95:case 0x96:case 0x97:case 0x98:case 0x99:case 0x9a:case 0x9b:case 0x9c:case 0x9d:case 0x9e:case 0x9f:case 0x40:case 0x41:case 0x42:case 0x43:case 0x44:case 0x45:case 0x46:case 0x47:case 0x48:case 0x49:case 0x4a:case 0x4b:case 0x4c:case 0x4d:case 0x4e:case 0x4f:case 0xb6:case 0xb7:case 0xbe:case 0xbf:case 0x00:case 0x01:case 0x02:case 0x03:case 0x20:case 0x22:case 0x23:case 0xb2:case 0xb4:case 0xb5:case 0xa5:case 0xad:case 0xa3:case 0xab:case 0xb3:case 0xbb:case 0xbc:case 0xbd:case 0xaf:case 0xc0:case 0xc1:case 0xb0:case 0xb1:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
break EXEC_LOOP;case 0xa4:case 0xac:case 0xba:{{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;mem8=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if(CS_flags&0x0080){switch(mem8>>6){case 0:if((mem8&7)==6)
n+=2;break;case 1:n++;break;default:n+=2;break;}}else{switch((mem8&7)|((mem8>>3)&0x18)){case 0x04:{if((n+1)>15)
abort(6);mem8_loc=(eip_offset+(n++))>>0;local_OPbyte_var=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
if((local_OPbyte_var&7)==5){n+=4;}
break;case 0x0c:n+=2;break;case 0x14:n+=5;break;case 0x05:n+=4;break;case 0x00:case 0x01:case 0x02:case 0x03:case 0x06:case 0x07:break;case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0d:case 0x0e:case 0x0f:n++;break;case 0x10:case 0x11:case 0x12:case 0x13:case 0x15:case 0x16:case 0x17:n+=4;break;}}
if(n>15)
abort(6);}
n++;if(n>15)
abort(6);break EXEC_LOOP;case 0x04:case 0x05:case 0x07:case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0c:case 0x0d:case 0x0e:case 0x0f:case 0x10:case 0x11:case 0x12:case 0x13:case 0x14:case 0x15:case 0x16:case 0x17:case 0x18:case 0x19:case 0x1a:case 0x1b:case 0x1c:case 0x1d:case 0x1e:case 0x1f:case 0x21:case 0x24:case 0x25:case 0x26:case 0x27:case 0x28:case 0x29:case 0x2a:case 0x2b:case 0x2c:case 0x2d:case 0x2e:case 0x2f:case 0x30:case 0x32:case 0x33:case 0x34:case 0x35:case 0x36:case 0x37:case 0x38:case 0x39:case 0x3a:case 0x3b:case 0x3c:case 0x3d:case 0x3e:case 0x3f:case 0x50:case 0x51:case 0x52:case 0x53:case 0x54:case 0x55:case 0x56:case 0x57:case 0x58:case 0x59:case 0x5a:case 0x5b:case 0x5c:case 0x5d:case 0x5e:case 0x5f:case 0x60:case 0x61:case 0x62:case 0x63:case 0x64:case 0x65:case 0x66:case 0x67:case 0x68:case 0x69:case 0x6a:case 0x6b:case 0x6c:case 0x6d:case 0x6e:case 0x6f:case 0x70:case 0x71:case 0x72:case 0x73:case 0x74:case 0x75:case 0x76:case 0x77:case 0x78:case 0x79:case 0x7a:case 0x7b:case 0x7c:case 0x7d:case 0x7e:case 0x7f:case 0xa6:case 0xa7:case 0xaa:case 0xae:case 0xb8:case 0xb9:case 0xc2:case 0xc3:case 0xc4:case 0xc5:case 0xc6:case 0xc7:default:abort(6);}
break;}}
return n;}
function do_tlb_set_page(Gd,Hd,ja){var Id,Jd,error_code,Kd,Ld,Md,Nd,ud,Od;if(!(cpu.cr0&(1<<31))){cpu.tlb_set_page(Gd&-4096,Gd&-4096,1);}else{Id=(cpu.cr3&-4096)+((Gd>>20)&0xffc);Jd=cpu.ld32_phys(Id);if(!(Jd&0x00000001)){error_code=0;}else{if(!(Jd&0x00000020)){Jd|=0x00000020;cpu.st32_phys(Id,Jd);}
Kd=(Jd&-4096)+((Gd>>10)&0xffc);Ld=cpu.ld32_phys(Kd);if(!(Ld&0x00000001)){error_code=0;}else{Md=Ld&Jd;if(ja&&!(Md&0x00000004)){error_code=0x01;}else if(Hd&&!(Md&0x00000002)){error_code=0x01;}else{Nd=(Hd&&!(Ld&0x00000040));if(!(Ld&0x00000020)||Nd){Ld|=0x00000020;if(Nd)
Ld|=0x00000040;cpu.st32_phys(Kd,Ld);}
ud=0;if((Ld&0x00000040)&&(Md&0x00000002))
ud=1;Od=0;if(Md&0x00000004)
Od=1;cpu.tlb_set_page(Gd&-4096,Ld&-4096,ud,Od);return;}}}
error_code|=Hd<<1;if(ja)
error_code|=0x04;cpu.cr2=Gd;abort_with_error_code(14,error_code);}}
function set_CR0(Qd){if(!(Qd&(1<<0)))
cpu_abort("real mode not supported");if((Qd&((1<<31)|(1<<16)|(1<<0)))!=(cpu.cr0&((1<<31)|(1<<16)|(1<<0)))){cpu.tlb_flush_all();}
cpu.cr0=Qd|(1<<4);}
function set_CR3(new_pdb){cpu.cr3=new_pdb;if(cpu.cr0&(1<<31)){cpu.tlb_flush_all();}}
function set_CR4(newval){cpu.cr4=newval;}
function SS_mask_from_flags(descriptor_high4bytes){if(descriptor_high4bytes&(1<<22))
return-1;else
return 0xffff;}
function load_from_descriptor_table(selector){var descriptor_table,Rb,descriptor_low4bytes,descriptor_high4bytes;if(selector&0x4)
descriptor_table=cpu.ldt;else
descriptor_table=cpu.gdt;Rb=selector&~7;if((Rb+7)>descriptor_table.limit)
return null;mem8_loc=descriptor_table.base+Rb;descriptor_low4bytes=ld32_mem8_kernel_read();mem8_loc+=4;descriptor_high4bytes=ld32_mem8_kernel_read();return[descriptor_low4bytes,descriptor_high4bytes];}
function calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes){var limit;limit=(descriptor_low4bytes&0xffff)|(descriptor_high4bytes&0x000f0000);if(descriptor_high4bytes&(1<<23))
limit=(limit<<12)|0xfff;return limit;}
function calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes){return(((descriptor_low4bytes>>>16)|((descriptor_high4bytes&0xff)<<16)|(descriptor_high4bytes&0xff000000)))&-1;}
function set_descriptor_register(descriptor_table,descriptor_low4bytes,descriptor_high4bytes){descriptor_table.base=calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes);descriptor_table.limit=calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes);descriptor_table.flags=descriptor_high4bytes;}
function init_segment_local_vars(){CS_base=cpu.segs[1].base;SS_base=cpu.segs[2].base;if(cpu.segs[2].flags&(1<<22))
SS_mask=-1;else
SS_mask=0xffff;FS_usage_flag=(((CS_base|SS_base|cpu.segs[3].base|cpu.segs[0].base)==0)&&SS_mask==-1);if(cpu.segs[1].flags&(1<<22))
init_CS_flags=0;else
init_CS_flags=0x0100|0x0080;}
function set_segment_vars(ee,selector,base,limit,flags){cpu.segs[ee]={selector:selector,base:base,limit:limit,flags:flags};init_segment_local_vars();}
function init_segment_vars_with_selector(Sb,selector){set_segment_vars(Sb,selector,(selector<<4),0xffff,(1<<15)|(3<<13)|(1<<12)|(1<<8)|(1<<12)|(1<<9));}
function load_from_TR(he){var tr_type,Rb,is_32_bit,ke,le;if(!(cpu.tr.flags&(1<<15)))
cpu_abort("invalid tss");tr_type=(cpu.tr.flags>>8)&0xf;if((tr_type&7)!=1)
cpu_abort("invalid tss type");is_32_bit=tr_type>>3;Rb=(he*4+2)<<is_32_bit;if(Rb+(4<<is_32_bit)-1>cpu.tr.limit)
abort_with_error_code(10,cpu.tr.selector&0xfffc);mem8_loc=(cpu.tr.base+Rb)&-1;if(is_32_bit==0){le=ld16_mem8_kernel_read();mem8_loc+=2;}else{le=ld32_mem8_kernel_read();mem8_loc+=4;}
ke=ld16_mem8_kernel_read();return[ke,le];}
function do_interrupt_protected_mode(intno,ne,error_code,oe,pe){var descriptor_table,qe,descriptor_type,he,selector,re,cpl_var;var te,ue,is_32_bit;var e,descriptor_low4bytes,descriptor_high4bytes,ve,ke,le,we,xe;var ye,SS_mask;te=0;if(!ne&&!pe){switch(intno){case 8:case 10:case 11:case 12:case 13:case 14:case 17:te=1;break;}}
if(ne)
ye=oe;else
ye=eip;descriptor_table=cpu.idt;if(intno*8+7>descriptor_table.limit)
abort_with_error_code(13,intno*8+2);mem8_loc=(descriptor_table.base+intno*8)&-1;descriptor_low4bytes=ld32_mem8_kernel_read();mem8_loc+=4;descriptor_high4bytes=ld32_mem8_kernel_read();descriptor_type=(descriptor_high4bytes>>8)&0x1f;switch(descriptor_type){case 5:case 7:case 6:throw"unsupported task gate";case 14:case 15:break;default:abort_with_error_code(13,intno*8+2);break;}
dpl=(descriptor_high4bytes>>13)&3;cpl_var=cpu.cpl;if(ne&&dpl<cpl_var)
abort_with_error_code(13,intno*8+2);if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,intno*8+2);selector=descriptor_low4bytes>>16;ve=(descriptor_high4bytes&-65536)|(descriptor_low4bytes&0x0000ffff);if((selector&0xfffc)==0)
abort_with_error_code(13,0);e=load_from_descriptor_table(selector);if(!e)
abort_with_error_code(13,selector&0xfffc);descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];if(!(descriptor_high4bytes&(1<<12))||!(descriptor_high4bytes&((1<<11))))
abort_with_error_code(13,selector&0xfffc);dpl=(descriptor_high4bytes>>13)&3;if(dpl>cpl_var)
abort_with_error_code(13,selector&0xfffc);if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);if(!(descriptor_high4bytes&(1<<10))&&dpl<cpl_var){e=load_from_TR(dpl);ke=e[0];le=e[1];if((ke&0xfffc)==0)
abort_with_error_code(10,ke&0xfffc);if((ke&3)!=dpl)
abort_with_error_code(10,ke&0xfffc);e=load_from_descriptor_table(ke);if(!e)
abort_with_error_code(10,ke&0xfffc);we=e[0];xe=e[1];re=(xe>>13)&3;if(re!=dpl)
abort_with_error_code(10,ke&0xfffc);if(!(xe&(1<<12))||(xe&(1<<11))||!(xe&(1<<9)))
abort_with_error_code(10,ke&0xfffc);if(!(xe&(1<<15)))
abort_with_error_code(10,ke&0xfffc);ue=1;SS_mask=SS_mask_from_flags(xe);qe=calculate_descriptor_base(we,xe);}else if((descriptor_high4bytes&(1<<10))||dpl==cpl_var){if(cpu.eflags&0x00020000)
abort_with_error_code(13,selector&0xfffc);ue=0;SS_mask=SS_mask_from_flags(cpu.segs[2].flags);qe=cpu.segs[2].base;le=regs[4];dpl=cpl_var;}else{abort_with_error_code(13,selector&0xfffc);ue=0;SS_mask=0;qe=0;le=0;}
is_32_bit=descriptor_type>>3;if(is_32_bit==1){if(ue){if(cpu.eflags&0x00020000){{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[5].selector);}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[4].selector);}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[3].selector);}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[0].selector);}}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[2].selector);}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(regs[4]);}}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(get_FLAGS());}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[1].selector);}
{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(ye);}
if(te){{le=(le-4)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st32_mem8_kernel_write(error_code);}}}else{if(ue){if(cpu.eflags&0x00020000){{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[5].selector);}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[4].selector);}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[3].selector);}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[0].selector);}}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[2].selector);}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(regs[4]);}}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(get_FLAGS());}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[1].selector);}
{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(ye);}
if(te){{le=(le-2)&-1;mem8_loc=(qe+(le&SS_mask))&-1;st16_mem8_kernel_write(error_code);}}}
if(ue){if(cpu.eflags&0x00020000){set_segment_vars(0,0,0,0,0);set_segment_vars(3,0,0,0,0);set_segment_vars(4,0,0,0,0);set_segment_vars(5,0,0,0,0);}
ke=(ke&~3)|dpl;set_segment_vars(2,ke,qe,calculate_descriptor_limit(we,xe),xe);}
regs[4]=(regs[4]&~SS_mask)|((le)&SS_mask);selector=(selector&~3)|dpl;set_segment_vars(1,selector,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes),descriptor_high4bytes);change_permission_level(dpl);eip=ve,physmem8_ptr=initial_mem_ptr=0;if((descriptor_type&1)==0){cpu.eflags&=~0x00000200;}
cpu.eflags&=~(0x00000100|0x00020000|0x00010000|0x00004000);}
function do_interrupt_not_protected_mode(intno,ne,error_code,oe,pe){var descriptor_table,qe,selector,ve,le,ye;descriptor_table=cpu.idt;if(intno*4+3>descriptor_table.limit)
abort_with_error_code(13,intno*8+2);mem8_loc=(descriptor_table.base+(intno<<2))>>0;ve=ld16_mem8_kernel_read();mem8_loc=(mem8_loc+2)>>0;selector=ld16_mem8_kernel_read();le=regs[4];if(ne)
ye=oe;else
ye=eip;{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(get_FLAGS());}
{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(cpu.segs[1].selector);}
{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(ye);}
regs[4]=(regs[4]&~SS_mask)|((le)&SS_mask);eip=ve,physmem8_ptr=initial_mem_ptr=0;cpu.segs[1].selector=selector;cpu.segs[1].base=(selector<<4);cpu.eflags&=~(0x00000200|0x00000100|0x00040000|0x00010000);}
function do_interrupt(intno,ne,error_code,oe,pe){if(intno==0x06){var eip_tmp=eip;var eip_offset;str="do_interrupt: intno="+_2_bytes_(intno)+" error_code="+_4_bytes_(error_code)
+" EIP="+_4_bytes_(eip_tmp)+" ESP="+_4_bytes_(regs[4])+" EAX="+_4_bytes_(regs[0])
+" EBX="+_4_bytes_(regs[3])+" ECX="+_4_bytes_(regs[1]);if(intno==0x0e){str+=" CR2="+_4_bytes_(cpu.cr2);}
console.log(str);if(intno==0x06){var str,i,n;str="Code:";eip_offset=(eip_tmp+CS_base)>>0;n=4096-(eip_offset&0xfff);if(n>15)
n=15;for(i=0;i<n;i++){mem8_loc=(eip_offset+i)&-1;str+=" "+_2_bytes_(ld_8bits_mem8_read());}
console.log(str);}}
if(cpu.cr0&(1<<0)){do_interrupt_protected_mode(intno,ne,error_code,oe,pe);}else{do_interrupt_not_protected_mode(intno,ne,error_code,oe,pe);}}
function op_LDTR(selector){var descriptor_table,descriptor_low4bytes,descriptor_high4bytes,Rb,De;selector&=0xffff;if((selector&0xfffc)==0){cpu.ldt.base=0;cpu.ldt.limit=0;}else{if(selector&0x4)
abort_with_error_code(13,selector&0xfffc);descriptor_table=cpu.gdt;Rb=selector&~7;De=7;if((Rb+De)>descriptor_table.limit)
abort_with_error_code(13,selector&0xfffc);mem8_loc=(descriptor_table.base+Rb)&-1;descriptor_low4bytes=ld32_mem8_kernel_read();mem8_loc+=4;descriptor_high4bytes=ld32_mem8_kernel_read();if((descriptor_high4bytes&(1<<12))||((descriptor_high4bytes>>8)&0xf)!=2)
abort_with_error_code(13,selector&0xfffc);if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);set_descriptor_register(cpu.ldt,descriptor_low4bytes,descriptor_high4bytes);}
cpu.ldt.selector=selector;}
function op_LTR(selector){var descriptor_table,descriptor_low4bytes,descriptor_high4bytes,Rb,descriptor_type,De;selector&=0xffff;if((selector&0xfffc)==0){cpu.tr.base=0;cpu.tr.limit=0;cpu.tr.flags=0;}else{if(selector&0x4)
abort_with_error_code(13,selector&0xfffc);descriptor_table=cpu.gdt;Rb=selector&~7;De=7;if((Rb+De)>descriptor_table.limit)
abort_with_error_code(13,selector&0xfffc);mem8_loc=(descriptor_table.base+Rb)&-1;descriptor_low4bytes=ld32_mem8_kernel_read();mem8_loc+=4;descriptor_high4bytes=ld32_mem8_kernel_read();descriptor_type=(descriptor_high4bytes>>8)&0xf;if((descriptor_high4bytes&(1<<12))||(descriptor_type!=1&&descriptor_type!=9))
abort_with_error_code(13,selector&0xfffc);if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);set_descriptor_register(cpu.tr,descriptor_low4bytes,descriptor_high4bytes);descriptor_high4bytes|=(1<<9);st32_mem8_kernel_write(descriptor_high4bytes);}
cpu.tr.selector=selector;}
function set_protected_mode_segment_register(register,selector){var descriptor_low4bytes,descriptor_high4bytes,cpl_var,dpl,rpl,descriptor_table,selector_index;cpl_var=cpu.cpl;if((selector&0xfffc)==0){if(register==2)
abort_with_error_code(13,0);set_segment_vars(register,selector,0,0,0);}else{if(selector&0x4)
descriptor_table=cpu.ldt;else
descriptor_table=cpu.gdt;selector_index=selector&~7;if((selector_index+7)>descriptor_table.limit)
abort_with_error_code(13,selector&0xfffc);mem8_loc=(descriptor_table.base+selector_index)&-1;descriptor_low4bytes=ld32_mem8_kernel_read();mem8_loc+=4;descriptor_high4bytes=ld32_mem8_kernel_read();if(!(descriptor_high4bytes&(1<<12)))
abort_with_error_code(13,selector&0xfffc);rpl=selector&3;dpl=(descriptor_high4bytes>>13)&3;if(register==2){if((descriptor_high4bytes&(1<<11))||!(descriptor_high4bytes&(1<<9)))
abort_with_error_code(13,selector&0xfffc);if(rpl!=cpl_var||dpl!=cpl_var)
abort_with_error_code(13,selector&0xfffc);}else{if((descriptor_high4bytes&((1<<11)|(1<<9)))==(1<<11))
abort_with_error_code(13,selector&0xfffc);if(!(descriptor_high4bytes&(1<<11))||!(descriptor_high4bytes&(1<<10))){if(dpl<cpl_var||dpl<rpl)
abort_with_error_code(13,selector&0xfffc);}}
if(!(descriptor_high4bytes&(1<<15))){if(register==2)
abort_with_error_code(12,selector&0xfffc);else
abort_with_error_code(11,selector&0xfffc);}
if(!(descriptor_high4bytes&(1<<8))){descriptor_high4bytes|=(1<<8);st32_mem8_kernel_write(descriptor_high4bytes);}
set_segment_vars(register,selector,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes),descriptor_high4bytes);}}
function set_segment_register(register,selector){var descriptor_table;selector&=0xffff;if(!(cpu.cr0&(1<<0))){descriptor_table=cpu.segs[register];descriptor_table.selector=selector;descriptor_table.base=selector<<4;}else if(cpu.eflags&0x00020000){init_segment_vars_with_selector(register,selector);}else{set_protected_mode_segment_register(register,selector);}}
function do_JMPF_virtual_mode(selector,Le){eip=Le,physmem8_ptr=initial_mem_ptr=0;cpu.segs[1].selector=selector;cpu.segs[1].base=(selector<<4);init_segment_local_vars();}
function do_JMPF(selector,Le){var Ne,ie,descriptor_low4bytes,descriptor_high4bytes,cpl_var,dpl,rpl,limit,e;if((selector&0xfffc)==0)
abort_with_error_code(13,0);e=load_from_descriptor_table(selector);if(!e)
abort_with_error_code(13,selector&0xfffc);descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];cpl_var=cpu.cpl;if(descriptor_high4bytes&(1<<12)){if(!(descriptor_high4bytes&(1<<11)))
abort_with_error_code(13,selector&0xfffc);dpl=(descriptor_high4bytes>>13)&3;if(descriptor_high4bytes&(1<<10)){if(dpl>cpl_var)
abort_with_error_code(13,selector&0xfffc);}else{rpl=selector&3;if(rpl>cpl_var)
abort_with_error_code(13,selector&0xfffc);if(dpl!=cpl_var)
abort_with_error_code(13,selector&0xfffc);}
if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);limit=calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes);if((Le>>>0)>(limit>>>0))
abort_with_error_code(13,selector&0xfffc);set_segment_vars(1,(selector&0xfffc)|cpl_var,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),limit,descriptor_high4bytes);eip=Le,physmem8_ptr=initial_mem_ptr=0;}else{cpu_abort("unsupported jump to call or task gate");}}
function op_JMPF(selector,Le){if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000)){do_JMPF_virtual_mode(selector,Le);}else{do_JMPF(selector,Le);}}
function Pe(register,cpl_var){var dpl,descriptor_high4bytes;if((register==4||register==5)&&(cpu.segs[register].selector&0xfffc)==0)
return;descriptor_high4bytes=cpu.segs[register].flags;dpl=(descriptor_high4bytes>>13)&3;if(!(descriptor_high4bytes&(1<<11))||!(descriptor_high4bytes&(1<<10))){if(dpl<cpl_var){set_segment_vars(register,0,0,0,0);}}}
function op_CALLF_not_protected_mode(is_32_bit,selector,Le,oe){var le;le=regs[4];if(is_32_bit){{le=(le-4)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st32_mem8_write(cpu.segs[1].selector);}
{le=(le-4)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st32_mem8_write(oe);}}else{{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(cpu.segs[1].selector);}
{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(oe);}}
regs[4]=(regs[4]&~SS_mask)|((le)&SS_mask);eip=Le,physmem8_ptr=initial_mem_ptr=0;cpu.segs[1].selector=selector;cpu.segs[1].base=(selector<<4);init_segment_local_vars();}
function op_CALLF_protected_mode(is_32_bit,selector,Le,oe){var ue,i,e;var descriptor_low4bytes,descriptor_high4bytes,cpl_var,dpl,rpl,selector,ve,Se;var ke,we,xe,esp,descriptor_type,re,SS_mask;var x,limit,Ue;var qe,Ve,We;if((selector&0xfffc)==0)
abort_with_error_code(13,0);e=load_from_descriptor_table(selector);if(!e)
abort_with_error_code(13,selector&0xfffc);descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];cpl_var=cpu.cpl;We=regs[4];if(descriptor_high4bytes&(1<<12)){if(!(descriptor_high4bytes&(1<<11)))
abort_with_error_code(13,selector&0xfffc);dpl=(descriptor_high4bytes>>13)&3;if(descriptor_high4bytes&(1<<10)){if(dpl>cpl_var)
abort_with_error_code(13,selector&0xfffc);}else{rpl=selector&3;if(rpl>cpl_var)
abort_with_error_code(13,selector&0xfffc);if(dpl!=cpl_var)
abort_with_error_code(13,selector&0xfffc);}
if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);{esp=We;SS_mask=SS_mask_from_flags(cpu.segs[2].flags);qe=cpu.segs[2].base;if(is_32_bit){{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[1].selector);}
{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(oe);}}else{{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[1].selector);}
{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(oe);}}
limit=calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes);if(Le>limit)
abort_with_error_code(13,selector&0xfffc);regs[4]=(regs[4]&~SS_mask)|((esp)&SS_mask);set_segment_vars(1,(selector&0xfffc)|cpl_var,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),limit,descriptor_high4bytes);eip=Le,physmem8_ptr=initial_mem_ptr=0;}}else{descriptor_type=(descriptor_high4bytes>>8)&0x1f;dpl=(descriptor_high4bytes>>13)&3;rpl=selector&3;switch(descriptor_type){case 1:case 9:case 5:throw"unsupported task gate";return;case 4:case 12:break;default:abort_with_error_code(13,selector&0xfffc);break;}
is_32_bit=descriptor_type>>3;if(dpl<cpl_var||dpl<rpl)
abort_with_error_code(13,selector&0xfffc);if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);selector=descriptor_low4bytes>>16;ve=(descriptor_high4bytes&0xffff0000)|(descriptor_low4bytes&0x0000ffff);Se=descriptor_high4bytes&0x1f;if((selector&0xfffc)==0)
abort_with_error_code(13,0);e=load_from_descriptor_table(selector);if(!e)
abort_with_error_code(13,selector&0xfffc);descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];if(!(descriptor_high4bytes&(1<<12))||!(descriptor_high4bytes&((1<<11))))
abort_with_error_code(13,selector&0xfffc);dpl=(descriptor_high4bytes>>13)&3;if(dpl>cpl_var)
abort_with_error_code(13,selector&0xfffc);if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);if(!(descriptor_high4bytes&(1<<10))&&dpl<cpl_var){e=load_from_TR(dpl);ke=e[0];esp=e[1];if((ke&0xfffc)==0)
abort_with_error_code(10,ke&0xfffc);if((ke&3)!=dpl)
abort_with_error_code(10,ke&0xfffc);e=load_from_descriptor_table(ke);if(!e)
abort_with_error_code(10,ke&0xfffc);we=e[0];xe=e[1];re=(xe>>13)&3;if(re!=dpl)
abort_with_error_code(10,ke&0xfffc);if(!(xe&(1<<12))||(xe&(1<<11))||!(xe&(1<<9)))
abort_with_error_code(10,ke&0xfffc);if(!(xe&(1<<15)))
abort_with_error_code(10,ke&0xfffc);Ue=SS_mask_from_flags(cpu.segs[2].flags);Ve=cpu.segs[2].base;SS_mask=SS_mask_from_flags(xe);qe=calculate_descriptor_base(we,xe);if(is_32_bit){{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[2].selector);}
{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(We);}
for(i=Se-1;i>=0;i--){x=Xe(Ve+((We+i*4)&Ue));{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(x);}}}else{{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[2].selector);}
{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(We);}
for(i=Se-1;i>=0;i--){x=Ye(Ve+((We+i*2)&Ue));{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(x);}}}
ue=1;}else{esp=We;SS_mask=SS_mask_from_flags(cpu.segs[2].flags);qe=cpu.segs[2].base;ue=0;}
if(is_32_bit){{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(cpu.segs[1].selector);}
{esp=(esp-4)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st32_mem8_kernel_write(oe);}}else{{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(cpu.segs[1].selector);}
{esp=(esp-2)&-1;mem8_loc=(qe+(esp&SS_mask))&-1;st16_mem8_kernel_write(oe);}}
if(ue){ke=(ke&~3)|dpl;set_segment_vars(2,ke,qe,calculate_descriptor_limit(we,xe),xe);}
selector=(selector&~3)|dpl;set_segment_vars(1,selector,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes),descriptor_high4bytes);change_permission_level(dpl);regs[4]=(regs[4]&~SS_mask)|((esp)&SS_mask);eip=ve,physmem8_ptr=initial_mem_ptr=0;}}
function op_CALLF(is_32_bit,selector,Le,oe){if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000)){op_CALLF_not_protected_mode(is_32_bit,selector,Le,oe);}else{op_CALLF_protected_mode(is_32_bit,selector,Le,oe);}}
function do_return_not_protected_mode(is_32_bit,is_iret,imm16){var esp,selector,stack_eip,stack_eflags,SS_mask,qe,ef;SS_mask=0xffff;esp=regs[4];qe=cpu.segs[2].base;if(is_32_bit==1){{mem8_loc=(qe+(esp&SS_mask))&-1;stack_eip=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;selector=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
selector&=0xffff;if(is_iret){mem8_loc=(qe+(esp&SS_mask))&-1;stack_eflags=ld32_mem8_kernel_read();esp=(esp+4)&-1;}}else{{mem8_loc=(qe+(esp&SS_mask))&-1;stack_eip=ld16_mem8_kernel_read();esp=(esp+2)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;selector=ld16_mem8_kernel_read();esp=(esp+2)&-1;}
if(is_iret){mem8_loc=(qe+(esp&SS_mask))&-1;stack_eflags=ld16_mem8_kernel_read();esp=(esp+2)&-1;}}
regs[4]=(regs[4]&~SS_mask)|((esp+imm16)&SS_mask);cpu.segs[1].selector=selector;cpu.segs[1].base=(selector<<4);eip=stack_eip,physmem8_ptr=initial_mem_ptr=0;if(is_iret){if(cpu.eflags&0x00020000)
ef=0x00000100|0x00040000|0x00200000|0x00000200|0x00010000|0x00004000;else
ef=0x00000100|0x00040000|0x00200000|0x00000200|0x00003000|0x00010000|0x00004000;if(is_32_bit==0)
ef&=0xffff;set_FLAGS(stack_eflags,ef);}
init_segment_local_vars();}
function do_return_protected_mode(is_32_bit,is_iret,imm16){var selector,stack_eflags,gf;var hf,jf,kf,lf;var e,descriptor_low4bytes,descriptor_high4bytes,we,xe;var cpl_var,dpl,rpl,ef,iopl;var qe,esp,stack_eip,wd,SS_mask;SS_mask=SS_mask_from_flags(cpu.segs[2].flags);esp=regs[4];qe=cpu.segs[2].base;stack_eflags=0;if(is_32_bit==1){{mem8_loc=(qe+(esp&SS_mask))&-1;stack_eip=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;selector=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
selector&=0xffff;if(is_iret){{mem8_loc=(qe+(esp&SS_mask))&-1;stack_eflags=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
if(stack_eflags&0x00020000){{mem8_loc=(qe+(esp&SS_mask))&-1;wd=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;gf=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;hf=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;jf=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;kf=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;lf=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
set_FLAGS(stack_eflags,0x00000100|0x00040000|0x00200000|0x00000200|0x00003000|0x00020000|0x00004000|0x00080000|0x00100000);init_segment_vars_with_selector(1,selector&0xffff);change_permission_level(3);init_segment_vars_with_selector(2,gf&0xffff);init_segment_vars_with_selector(0,hf&0xffff);init_segment_vars_with_selector(3,jf&0xffff);init_segment_vars_with_selector(4,kf&0xffff);init_segment_vars_with_selector(5,lf&0xffff);eip=stack_eip&0xffff,physmem8_ptr=initial_mem_ptr=0;regs[4]=(regs[4]&~SS_mask)|((wd)&SS_mask);return;}}}else{{mem8_loc=(qe+(esp&SS_mask))&-1;stack_eip=ld16_mem8_kernel_read();esp=(esp+2)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;selector=ld16_mem8_kernel_read();esp=(esp+2)&-1;}
if(is_iret){mem8_loc=(qe+(esp&SS_mask))&-1;stack_eflags=ld16_mem8_kernel_read();esp=(esp+2)&-1;}}
if((selector&0xfffc)==0)
abort_with_error_code(13,selector&0xfffc);e=load_from_descriptor_table(selector);if(!e)
abort_with_error_code(13,selector&0xfffc);descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];if(!(descriptor_high4bytes&(1<<12))||!(descriptor_high4bytes&(1<<11)))
abort_with_error_code(13,selector&0xfffc);cpl_var=cpu.cpl;rpl=selector&3;if(rpl<cpl_var)
abort_with_error_code(13,selector&0xfffc);dpl=(descriptor_high4bytes>>13)&3;if(descriptor_high4bytes&(1<<10)){if(dpl>rpl)
abort_with_error_code(13,selector&0xfffc);}else{if(dpl!=rpl)
abort_with_error_code(13,selector&0xfffc);}
if(!(descriptor_high4bytes&(1<<15)))
abort_with_error_code(11,selector&0xfffc);esp=(esp+imm16)&-1;if(rpl==cpl_var){set_segment_vars(1,selector,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes),descriptor_high4bytes);}else{if(is_32_bit==1){{mem8_loc=(qe+(esp&SS_mask))&-1;wd=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;gf=ld32_mem8_kernel_read();esp=(esp+4)&-1;}
gf&=0xffff;}else{{mem8_loc=(qe+(esp&SS_mask))&-1;wd=ld16_mem8_kernel_read();esp=(esp+2)&-1;}
{mem8_loc=(qe+(esp&SS_mask))&-1;gf=ld16_mem8_kernel_read();esp=(esp+2)&-1;}}
if((gf&0xfffc)==0){abort_with_error_code(13,0);}else{if((gf&3)!=rpl)
abort_with_error_code(13,gf&0xfffc);e=load_from_descriptor_table(gf);if(!e)
abort_with_error_code(13,gf&0xfffc);we=e[0];xe=e[1];if(!(xe&(1<<12))||(xe&(1<<11))||!(xe&(1<<9)))
abort_with_error_code(13,gf&0xfffc);dpl=(xe>>13)&3;if(dpl!=rpl)
abort_with_error_code(13,gf&0xfffc);if(!(xe&(1<<15)))
abort_with_error_code(11,gf&0xfffc);set_segment_vars(2,gf,calculate_descriptor_base(we,xe),calculate_descriptor_limit(we,xe),xe);}
set_segment_vars(1,selector,calculate_descriptor_base(descriptor_low4bytes,descriptor_high4bytes),calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes),descriptor_high4bytes);change_permission_level(rpl);esp=wd;SS_mask=SS_mask_from_flags(xe);Pe(0,rpl);Pe(3,rpl);Pe(4,rpl);Pe(5,rpl);esp=(esp+imm16)&-1;}
regs[4]=(regs[4]&~SS_mask)|((esp)&SS_mask);eip=stack_eip,physmem8_ptr=initial_mem_ptr=0;if(is_iret){ef=0x00000100|0x00040000|0x00200000|0x00010000|0x00004000;if(cpl_var==0)
ef|=0x00003000;iopl=(cpu.eflags>>12)&3;if(cpl_var<=iopl)
ef|=0x00000200;if(is_32_bit==0)
ef&=0xffff;set_FLAGS(stack_eflags,ef);}}
function op_IRET(is_32_bit){var iopl;if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000)){if(cpu.eflags&0x00020000){iopl=(cpu.eflags>>12)&3;if(iopl!=3)
abort(13);}
do_return_not_protected_mode(is_32_bit,1,0);}else{if(cpu.eflags&0x00004000){throw"unsupported task gate";}else{do_return_protected_mode(is_32_bit,1,0);}}}
function op_RETF(is_32_bit,imm16){if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000)){do_return_not_protected_mode(is_32_bit,0,imm16);}else{do_return_protected_mode(is_32_bit,0,imm16);}}
function of(selector,is_lsl){var e,descriptor_low4bytes,descriptor_high4bytes,rpl,dpl,cpl_var,descriptor_type;if((selector&0xfffc)==0)
return null;e=load_from_descriptor_table(selector);if(!e)
return null;descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];rpl=selector&3;dpl=(descriptor_high4bytes>>13)&3;cpl_var=cpu.cpl;if(descriptor_high4bytes&(1<<12)){if((descriptor_high4bytes&(1<<11))&&(descriptor_high4bytes&(1<<10))){}else{if(dpl<cpl_var||dpl<rpl)
return null;}}else{descriptor_type=(descriptor_high4bytes>>8)&0xf;switch(descriptor_type){case 1:case 2:case 3:case 9:case 11:break;case 4:case 5:case 12:if(is_lsl)
return null;break;default:return null;}
if(dpl<cpl_var||dpl<rpl)
return null;}
if(is_lsl){return calculate_descriptor_limit(descriptor_low4bytes,descriptor_high4bytes);}else{return descriptor_high4bytes&0x00f0ff00;}}
function op_LAR_LSL(is_32_bit,is_lsl){var x,mem8,reg_idx1,selector;if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000))
abort(6);mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){selector=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);selector=ld_16bits_mem8_read();}
x=of(selector,is_lsl);_src=get_conditional_flags();if(x===null){_src&=~0x0040;}else{_src|=0x0040;if(is_32_bit)
regs[reg_idx1]=x;else
set_lower_word_in_register(reg_idx1,x);}
_dst=((_src>>6)&1)^1;_op=24;}
function segment_isnt_accessible(selector,is_verw){var e,descriptor_low4bytes,descriptor_high4bytes,rpl,dpl,cpl_var;if((selector&0xfffc)==0)
return 0;e=load_from_descriptor_table(selector);if(!e)
return 0;descriptor_low4bytes=e[0];descriptor_high4bytes=e[1];if(!(descriptor_high4bytes&(1<<12)))
return 0;rpl=selector&3;dpl=(descriptor_high4bytes>>13)&3;cpl_var=cpu.cpl;if(descriptor_high4bytes&(1<<11)){if(is_verw){return 0;}else{if(!(descriptor_high4bytes&(1<<9)))
return 1;if(!(descriptor_high4bytes&(1<<10))){if(dpl<cpl_var||dpl<rpl)
return 0;}}}else{if(dpl<cpl_var||dpl<rpl)
return 0;if(is_verw&&!(descriptor_high4bytes&(1<<9)))
return 0;}
return 1;}
function op_VERR_VERW(selector,is_verw){var z;z=segment_isnt_accessible(selector,is_verw);_src=get_conditional_flags();if(z)
_src|=0x0040;else
_src&=~0x0040;_dst=((_src>>6)&1)^1;_op=24;}
function op_ARPL(){var mem8,x,y,reg_idx0;if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000))
abort(6);mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();}
y=regs[(mem8>>3)&7];_src=get_conditional_flags();if((x&3)<(y&3)){x=(x&~3)|(y&3);if((mem8>>6)==3){set_lower_word_in_register(reg_idx0,x);}else{st16_mem8_write(x);}
_src|=0x0040;}else{_src&=~0x0040;}
_dst=((_src>>6)&1)^1;_op=24;}
function op_CPUID(){var eax;eax=regs[0];switch(eax){case 0:regs[0]=1;regs[3]=0x756e6547&-1;regs[2]=0x49656e69&-1;regs[1]=0x6c65746e&-1;break;case 1:default:regs[0]=(5<<8)|(4<<4)|3;regs[3]=8<<8;regs[1]=0;regs[2]=(1<<4);break;}}
function op_AAM(base){var wf,xf;if(base==0)
abort(0);wf=regs[0]&0xff;xf=(wf/base)&-1;wf=(wf%base);regs[0]=(regs[0]&~0xffff)|wf|(xf<<8);_dst=(((wf)<<24)>>24);_op=12;}
function op_AAD(base){var wf,xf;wf=regs[0]&0xff;xf=(regs[0]>>8)&0xff;wf=(xf*base+wf)&0xff;regs[0]=(regs[0]&~0xffff)|wf;_dst=(((wf)<<24)>>24);_op=12;}
function op_AAA(){var Af,wf,xf,Bf,flag_bits;flag_bits=get_conditional_flags();Bf=flag_bits&0x0010;wf=regs[0]&0xff;xf=(regs[0]>>8)&0xff;Af=(wf>0xf9);if(((wf&0x0f)>9)||Bf){wf=(wf+6)&0x0f;xf=(xf+1+Af)&0xff;flag_bits|=0x0001|0x0010;}else{flag_bits&=~(0x0001|0x0010);wf&=0x0f;}
regs[0]=(regs[0]&~0xffff)|wf|(xf<<8);_src=flag_bits;_dst=((_src>>6)&1)^1;_op=24;}
function op_AAS(){var Af,wf,xf,Bf,flag_bits;flag_bits=get_conditional_flags();Bf=flag_bits&0x0010;wf=regs[0]&0xff;xf=(regs[0]>>8)&0xff;Af=(wf<6);if(((wf&0x0f)>9)||Bf){wf=(wf-6)&0x0f;xf=(xf-1-Af)&0xff;flag_bits|=0x0001|0x0010;}else{flag_bits&=~(0x0001|0x0010);wf&=0x0f;}
regs[0]=(regs[0]&~0xffff)|wf|(xf<<8);_src=flag_bits;_dst=((_src>>6)&1)^1;_op=24;}
function op_DAA(){var wf,Bf,Ef,flag_bits;flag_bits=get_conditional_flags();Ef=flag_bits&0x0001;Bf=flag_bits&0x0010;wf=regs[0]&0xff;flag_bits=0;if(((wf&0x0f)>9)||Bf){wf=(wf+6)&0xff;flag_bits|=0x0010;}
if((wf>0x9f)||Ef){wf=(wf+0x60)&0xff;flag_bits|=0x0001;}
regs[0]=(regs[0]&~0xff)|wf;flag_bits|=(wf==0)<<6;flag_bits|=parity_LUT[wf]<<2;flag_bits|=(wf&0x80);_src=flag_bits;_dst=((_src>>6)&1)^1;_op=24;}
function op_DAS(){var wf,Gf,Bf,Ef,flag_bits;flag_bits=get_conditional_flags();Ef=flag_bits&0x0001;Bf=flag_bits&0x0010;wf=regs[0]&0xff;flag_bits=0;Gf=wf;if(((wf&0x0f)>9)||Bf){flag_bits|=0x0010;if(wf<6||Ef)
flag_bits|=0x0001;wf=(wf-6)&0xff;}
if((Gf>0x99)||Ef){wf=(wf-0x60)&0xff;flag_bits|=0x0001;}
regs[0]=(regs[0]&~0xff)|wf;flag_bits|=(wf==0)<<6;flag_bits|=parity_LUT[wf]<<2;flag_bits|=(wf&0x80);_src=flag_bits;_dst=((_src>>6)&1)^1;_op=24;}
function checkOp_BOUND(){var mem8,x,y,z;mem8=phys_mem8[physmem8_ptr++];if((mem8>>3)==3)
abort(6);mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();mem8_loc=(mem8_loc+4)&-1;y=ld_32bits_mem8_read();reg_idx1=(mem8>>3)&7;z=regs[reg_idx1];if(z<x||z>y)
abort(5);}
function op_16_BOUND(){var mem8,x,y,z;mem8=phys_mem8[physmem8_ptr++];if((mem8>>3)==3)
abort(6);mem8_loc=segment_translation(mem8);x=(ld_16bits_mem8_read()<<16)>>16;mem8_loc=(mem8_loc+2)&-1;y=(ld_16bits_mem8_read()<<16)>>16;reg_idx1=(mem8>>3)&7;z=(regs[reg_idx1]<<16)>>16;if(z<x||z>y)
abort(5);}
function op_16_PUSHA(){var x,y,reg_idx1;y=(regs[4]-16)>>0;mem8_loc=((y&SS_mask)+SS_base)>>0;for(reg_idx1=7;reg_idx1>=0;reg_idx1--){x=regs[reg_idx1];st16_mem8_write(x);mem8_loc=(mem8_loc+2)>>0;}
regs[4]=(regs[4]&~SS_mask)|((y)&SS_mask);}
function op_PUSHA(){var x,y,reg_idx1;y=(regs[4]-32)>>0;mem8_loc=((y&SS_mask)+SS_base)>>0;for(reg_idx1=7;reg_idx1>=0;reg_idx1--){x=regs[reg_idx1];st32_mem8_write(x);mem8_loc=(mem8_loc+4)>>0;}
regs[4]=(regs[4]&~SS_mask)|((y)&SS_mask);}
function op_16_POPA(){var reg_idx1;mem8_loc=((regs[4]&SS_mask)+SS_base)>>0;for(reg_idx1=7;reg_idx1>=0;reg_idx1--){if(reg_idx1!=4){set_lower_word_in_register(reg_idx1,ld_16bits_mem8_read());}
mem8_loc=(mem8_loc+2)>>0;}
regs[4]=(regs[4]&~SS_mask)|((regs[4]+16)&SS_mask);}
function op_POPA(){var reg_idx1;mem8_loc=((regs[4]&SS_mask)+SS_base)>>0;for(reg_idx1=7;reg_idx1>=0;reg_idx1--){if(reg_idx1!=4){regs[reg_idx1]=ld_32bits_mem8_read();}
mem8_loc=(mem8_loc+4)>>0;}
regs[4]=(regs[4]&~SS_mask)|((regs[4]+32)&SS_mask);}
function op_16_LEAVE(){var x,y;y=regs[5];mem8_loc=((y&SS_mask)+SS_base)>>0;x=ld_16bits_mem8_read();set_lower_word_in_register(5,x);regs[4]=(regs[4]&~SS_mask)|((y+2)&SS_mask);}
function op_LEAVE(){var x,y;y=regs[5];mem8_loc=((y&SS_mask)+SS_base)>>0;x=ld_32bits_mem8_read();regs[5]=x;regs[4]=(regs[4]&~SS_mask)|((y+4)&SS_mask);}
function op_16_ENTER(){var cf,Qf,le,Rf,x,Sf;cf=ld16_mem8_direct();Qf=phys_mem8[physmem8_ptr++];Qf&=0x1f;le=regs[4];Rf=regs[5];{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(Rf);}
Sf=le;if(Qf!=0){while(Qf>1){Rf=(Rf-2)>>0;mem8_loc=((Rf&SS_mask)+SS_base)>>0;x=ld_16bits_mem8_read();{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(x);}
Qf--;}
{le=(le-2)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st16_mem8_write(Sf);}}
le=(le-cf)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;ld_16bits_mem8_write();regs[5]=(regs[5]&~SS_mask)|(Sf&SS_mask);regs[4]=le;}
function op_ENTER(){var cf,Qf,le,Rf,x,Sf;cf=ld16_mem8_direct();Qf=phys_mem8[physmem8_ptr++];Qf&=0x1f;le=regs[4];Rf=regs[5];{le=(le-4)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st32_mem8_write(Rf);}
Sf=le;if(Qf!=0){while(Qf>1){Rf=(Rf-4)>>0;mem8_loc=((Rf&SS_mask)+SS_base)>>0;x=ld_32bits_mem8_read();{le=(le-4)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st32_mem8_write(x);}
Qf--;}
{le=(le-4)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;st32_mem8_write(Sf);}}
le=(le-cf)>>0;mem8_loc=((le&SS_mask)+SS_base)>>0;ld_32bits_mem8_write();regs[5]=(regs[5]&~SS_mask)|(Sf&SS_mask);regs[4]=(regs[4]&~SS_mask)|((le)&SS_mask);}
function op_16_load_far_pointer32(Sb){var x,y,mem8;mem8=phys_mem8[physmem8_ptr++];if((mem8>>3)==3)
abort(6);mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();mem8_loc+=4;y=ld_16bits_mem8_read();set_segment_register(Sb,y);regs[(mem8>>3)&7]=x;}
function op_16_load_far_pointer16(Sb){var x,y,mem8;mem8=phys_mem8[physmem8_ptr++];if((mem8>>3)==3)
abort(6);mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();mem8_loc+=2;y=ld_16bits_mem8_read();set_segment_register(Sb,y);set_lower_word_in_register((mem8>>3)&7,x);}
function stringOp_INSB(){var Xf,Yf,Zf,ag,iopl,x;iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];Zf=regs[2]&0xffff;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=cpu.ld8_port(Zf);mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;st8_mem8_write(x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=cpu.ld8_port(Zf);mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;st8_mem8_write(x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);}}
function stringOp_OUTSB(){var Xf,cg,Sb,ag,Zf,iopl,x;iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Zf=regs[2]&0xffff;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;x=ld_8bits_mem8_read();cpu.st8_port(Zf,x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;x=ld_8bits_mem8_read();cpu.st8_port(Zf,x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);}}
function stringOp_MOVSB(){var Xf,Yf,cg,ag,Sb,eg;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Yf=regs[7];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;eg=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;{x=ld_8bits_mem8_read();mem8_loc=eg;st8_mem8_write(x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}}else{x=ld_8bits_mem8_read();mem8_loc=eg;st8_mem8_write(x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);}}
function stringOp_STOSB(){var Xf,Yf,ag;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;{st8_mem8_write(regs[0]);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}}else{st8_mem8_write(regs[0]);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);}}
function stringOp_CMPSB(){var Xf,Yf,cg,ag,Sb,eg;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Yf=regs[7];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;eg=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_8bits_mem8_read();mem8_loc=eg;y=ld_8bits_mem8_read();do_8bit_math(7,x,y);regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(CS_flags&0x0010){if(!(_dst==0))
return;}else{if((_dst==0))
return;}
if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_8bits_mem8_read();mem8_loc=eg;y=ld_8bits_mem8_read();do_8bit_math(7,x,y);regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);}}
function stringOp_LODSB(){var Xf,cg,Sb,ag,x;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_8bits_mem8_read();regs[0]=(regs[0]&-256)|x;regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_8bits_mem8_read();regs[0]=(regs[0]&-256)|x;regs[6]=(cg&~Xf)|((cg+(cpu.df<<0))&Xf);}}
function stringOp_SCASB(){var Xf,Yf,ag,x;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_8bits_mem8_read();do_8bit_math(7,regs[0],x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(CS_flags&0x0010){if(!(_dst==0))
return;}else{if((_dst==0))
return;}
if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_8bits_mem8_read();do_8bit_math(7,regs[0],x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<0))&Xf);}}
function op_16_INS(){var Xf,Yf,Zf,ag,iopl,x;iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];Zf=regs[2]&0xffff;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=cpu.ld16_port(Zf);mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;st16_mem8_write(x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=cpu.ld16_port(Zf);mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;st16_mem8_write(x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);}}
function op_16_OUTS(){var Xf,cg,Sb,ag,Zf,iopl,x;iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Zf=regs[2]&0xffff;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;x=ld_16bits_mem8_read();cpu.st16_port(Zf,x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;x=ld_16bits_mem8_read();cpu.st16_port(Zf,x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);}}
function op_16_MOVS(){var Xf,Yf,cg,ag,Sb,eg;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Yf=regs[7];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;eg=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;{x=ld_16bits_mem8_read();mem8_loc=eg;st16_mem8_write(x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}}else{x=ld_16bits_mem8_read();mem8_loc=eg;st16_mem8_write(x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);}}
function op_16_STOS(){var Xf,Yf,ag;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;{st16_mem8_write(regs[0]);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}}else{st16_mem8_write(regs[0]);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);}}
function op_16_CMPS(){var Xf,Yf,cg,ag,Sb,eg;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Yf=regs[7];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;eg=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_16bits_mem8_read();mem8_loc=eg;y=ld_16bits_mem8_read();do_16bit_math(7,x,y);regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(CS_flags&0x0010){if(!(_dst==0))
return;}else{if((_dst==0))
return;}
if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_16bits_mem8_read();mem8_loc=eg;y=ld_16bits_mem8_read();do_16bit_math(7,x,y);regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);}}
function op_16_LODS(){var Xf,cg,Sb,ag,x;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_16bits_mem8_read();regs[0]=(regs[0]&-65536)|x;regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_16bits_mem8_read();regs[0]=(regs[0]&-65536)|x;regs[6]=(cg&~Xf)|((cg+(cpu.df<<1))&Xf);}}
function op_16_SCAS(){var Xf,Yf,ag,x;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_16bits_mem8_read();do_16bit_math(7,regs[0],x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(CS_flags&0x0010){if(!(_dst==0))
return;}else{if((_dst==0))
return;}
if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_16bits_mem8_read();do_16bit_math(7,regs[0],x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<1))&Xf);}}
function stringOp_INSD(){var Xf,Yf,Zf,ag,iopl,x;iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];Zf=regs[2]&0xffff;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=cpu.ld32_port(Zf);mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;st32_mem8_write(x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=cpu.ld32_port(Zf);mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;st32_mem8_write(x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);}}
function stringOp_OUTSD(){var Xf,cg,Sb,ag,Zf,iopl,x;iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Zf=regs[2]&0xffff;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;x=ld_32bits_mem8_read();cpu.st32_port(Zf,x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;x=ld_32bits_mem8_read();cpu.st32_port(Zf,x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);}}
function stringOp_MOVSD(){var Xf,Yf,cg,ag,Sb,eg;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Yf=regs[7];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;eg=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;if(Xf==-1&&cpu.df==1&&((mem8_loc|eg)&3)==0){var len,l,ug,vg,i,wg;len=ag>>>0;l=(4096-(mem8_loc&0xfff))>>2;if(len>l)
len=l;l=(4096-(eg&0xfff))>>2;if(len>l)
len=l;ug=do_tlb_lookup(mem8_loc,0);vg=do_tlb_lookup(eg,1);wg=len<<2;vg>>=2;ug>>=2;for(i=0;i<len;i++)
phys_mem32[vg+i]=phys_mem32[ug+i];regs[6]=(cg+wg)>>0;regs[7]=(Yf+wg)>>0;regs[1]=ag=(ag-len)>>0;if(ag)
physmem8_ptr=initial_mem_ptr;}else{x=ld_32bits_mem8_read();mem8_loc=eg;st32_mem8_write(x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}}else{x=ld_32bits_mem8_read();mem8_loc=eg;st32_mem8_write(x);regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);}}
function stringOp_STOSD(){var Xf,Yf,ag;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;if(Xf==-1&&cpu.df==1&&(mem8_loc&3)==0){var len,l,vg,i,wg,x;len=ag>>>0;l=(4096-(mem8_loc&0xfff))>>2;if(len>l)
len=l;vg=do_tlb_lookup(regs[7],1);x=regs[0];vg>>=2;for(i=0;i<len;i++)
phys_mem32[vg+i]=x;wg=len<<2;regs[7]=(Yf+wg)>>0;regs[1]=ag=(ag-len)>>0;if(ag)
physmem8_ptr=initial_mem_ptr;}else{st32_mem8_write(regs[0]);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}}else{st32_mem8_write(regs[0]);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);}}
function stringOp_CMPSD(){var Xf,Yf,cg,ag,Sb,eg;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];Yf=regs[7];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;eg=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_32bits_mem8_read();mem8_loc=eg;y=ld_32bits_mem8_read();do_32bit_math(7,x,y);regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(CS_flags&0x0010){if(!(_dst==0))
return;}else{if((_dst==0))
return;}
if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_32bits_mem8_read();mem8_loc=eg;y=ld_32bits_mem8_read();do_32bit_math(7,x,y);regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);}}
function stringOp_LODSD(){var Xf,cg,Sb,ag,x;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Sb=CS_flags&0x000f;if(Sb==0)
Sb=3;else
Sb--;cg=regs[6];mem8_loc=((cg&Xf)+cpu.segs[Sb].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_32bits_mem8_read();regs[0]=x;regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_32bits_mem8_read();regs[0]=x;regs[6]=(cg&~Xf)|((cg+(cpu.df<<2))&Xf);}}
function stringOp_SCASD(){var Xf,Yf,ag,x;if(CS_flags&0x0080)
Xf=0xffff;else
Xf=-1;Yf=regs[7];mem8_loc=((Yf&Xf)+cpu.segs[0].base)>>0;if(CS_flags&(0x0010|0x0020)){ag=regs[1];if((ag&Xf)==0)
return;x=ld_32bits_mem8_read();do_32bit_math(7,regs[0],x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);regs[1]=ag=(ag&~Xf)|((ag-1)&Xf);if(CS_flags&0x0010){if(!(_dst==0))
return;}else{if((_dst==0))
return;}
if(ag&Xf)
physmem8_ptr=initial_mem_ptr;}else{x=ld_32bits_mem8_read();do_32bit_math(7,regs[0],x);regs[7]=(Yf&~Xf)|((Yf+(cpu.df<<2))&Xf);}}
cpu=this;phys_mem8=this.phys_mem8;phys_mem16=this.phys_mem16;phys_mem32=this.phys_mem32;tlb_read_user=this.tlb_read_user;tlb_write_user=this.tlb_write_user;tlb_read_kernel=this.tlb_read_kernel;tlb_write_kernel=this.tlb_write_kernel;if(cpu.cpl==3){_tlb_read_=tlb_read_user;_tlb_write_=tlb_write_user;}else{_tlb_read_=tlb_read_kernel;_tlb_write_=tlb_write_kernel;}
if(cpu.halted){if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200)){cpu.halted=0;}else{return 257;}}
regs=this.regs;_src=this.cc_src;_dst=this.cc_dst;_op=this.cc_op;_op2=this.cc_op2;_dst2=this.cc_dst2;eip=this.eip;init_segment_local_vars();exit_code=256;cycles_left=N_cycles;if(interrupt){do_interrupt(interrupt.intno,0,interrupt.error_code,0,0);}
if(cpu.hard_intno>=0){do_interrupt(cpu.hard_intno,0,0,0,1);cpu.hard_intno=-1;}
if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200)){cpu.hard_intno=cpu.get_hard_intno();do_interrupt(cpu.hard_intno,0,0,0,1);cpu.hard_intno=-1;}
physmem8_ptr=0;initial_mem_ptr=0;OUTER_LOOP:do{eip=(eip+physmem8_ptr-initial_mem_ptr)>>0;eip_offset=(eip+CS_base)>>0;eip_tlb_val=_tlb_read_[eip_offset>>>12];if(((eip_tlb_val|eip_offset)&0xfff)>=(4096-15+1)){var Cg;if(eip_tlb_val==-1)
do_tlb_set_page(eip_offset,0,cpu.cpl==3);eip_tlb_val=_tlb_read_[eip_offset>>>12];initial_mem_ptr=physmem8_ptr=eip_offset^eip_tlb_val;OPbyte=phys_mem8[physmem8_ptr++];Cg=eip_offset&0xfff;if(Cg>=(4096-15+1)){x=operation_size_function(eip_offset,OPbyte);if((Cg+x)>4096){initial_mem_ptr=physmem8_ptr=this.mem_size;for(y=0;y<x;y++){mem8_loc=(eip_offset+y)>>0;phys_mem8[physmem8_ptr+y]=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
physmem8_ptr++;}}}else{initial_mem_ptr=physmem8_ptr=eip_offset^eip_tlb_val;OPbyte=phys_mem8[physmem8_ptr++];}
OPbyte|=(CS_flags=init_CS_flags)&0x0100;EXEC_LOOP:for(;;){switch(OPbyte){case 0x66:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);if(init_CS_flags&0x0100)
CS_flags&=~0x0100;else
CS_flags|=0x0100;OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0x67:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);if(init_CS_flags&0x0080)
CS_flags&=~0x0080;else
CS_flags|=0x0080;OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0xf0:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);CS_flags|=0x0040;OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0xf2:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);CS_flags|=0x0020;OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0xf3:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);CS_flags|=0x0010;OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0x26:case 0x2e:case 0x36:case 0x3e:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);CS_flags=(CS_flags&~0x000f)|(((OPbyte>>3)&3)+1);OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0x64:case 0x65:if(CS_flags==init_CS_flags)
operation_size_function(eip_offset,OPbyte);CS_flags=(CS_flags&~0x000f)|((OPbyte&7)+1);OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=(CS_flags&0x0100);break;case 0xb0:case 0xb1:case 0xb2:case 0xb3:case 0xb4:case 0xb5:case 0xb6:case 0xb7:x=phys_mem8[physmem8_ptr++];OPbyte&=7;last_tlb_val=(OPbyte&4)<<1;regs[OPbyte&3]=(regs[OPbyte&3]&~(0xff<<last_tlb_val))|(((x)&0xff)<<last_tlb_val);break EXEC_LOOP;case 0xb8:case 0xb9:case 0xba:case 0xbb:case 0xbc:case 0xbd:case 0xbe:case 0xbf:{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
regs[OPbyte&7]=x;break EXEC_LOOP;case 0x88:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;x=(regs[reg_idx1&3]>>((reg_idx1&4)<<1));if((mem8>>6)==3){reg_idx0=mem8&7;last_tlb_val=(reg_idx0&4)<<1;regs[reg_idx0&3]=(regs[reg_idx0&3]&~(0xff<<last_tlb_val))|(((x)&0xff)<<last_tlb_val);}else{mem8_loc=segment_translation(mem8);{last_tlb_val=_tlb_write_[mem8_loc>>>12];if(last_tlb_val==-1){__st8_mem8_write(x);}else{phys_mem8[mem8_loc^last_tlb_val]=x;}}}
break EXEC_LOOP;case 0x89:mem8=phys_mem8[physmem8_ptr++];x=regs[(mem8>>3)&7];if((mem8>>6)==3){regs[mem8&7]=x;}else{mem8_loc=segment_translation(mem8);{last_tlb_val=_tlb_write_[mem8_loc>>>12];if((last_tlb_val|mem8_loc)&3){__st32_mem8_write(x);}else{phys_mem32[(mem8_loc^last_tlb_val)>>2]=x;}}}
break EXEC_LOOP;case 0x8a:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
reg_idx1=(mem8>>3)&7;last_tlb_val=(reg_idx1&4)<<1;regs[reg_idx1&3]=(regs[reg_idx1&3]&~(0xff<<last_tlb_val))|(((x)&0xff)<<last_tlb_val);break EXEC_LOOP;case 0x8b:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])|mem8_loc)&3?__ld_32bits_mem8_read():phys_mem32[(mem8_loc^last_tlb_val)>>2]);}
regs[(mem8>>3)&7]=x;break EXEC_LOOP;case 0xa0:mem8_loc=segmented_mem8_loc_for_MOV();x=ld_8bits_mem8_read();regs[0]=(regs[0]&-256)|x;break EXEC_LOOP;case 0xa1:mem8_loc=segmented_mem8_loc_for_MOV();x=ld_32bits_mem8_read();regs[0]=x;break EXEC_LOOP;case 0xa2:mem8_loc=segmented_mem8_loc_for_MOV();st8_mem8_write(regs[0]);break EXEC_LOOP;case 0xa3:mem8_loc=segmented_mem8_loc_for_MOV();st32_mem8_write(regs[0]);break EXEC_LOOP;case 0xd7:mem8_loc=(regs[3]+(regs[0]&0xff))>>0;if(CS_flags&0x0080)
mem8_loc&=0xffff;reg_idx1=CS_flags&0x000f;if(reg_idx1==0)
reg_idx1=3;else
reg_idx1--;mem8_loc=(mem8_loc+cpu.segs[reg_idx1].base)>>0;x=ld_8bits_mem8_read();set_word_in_register(0,x);break EXEC_LOOP;case 0xc6:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=phys_mem8[physmem8_ptr++];set_word_in_register(mem8&7,x);}else{mem8_loc=segment_translation(mem8);x=phys_mem8[physmem8_ptr++];st8_mem8_write(x);}
break EXEC_LOOP;case 0xc7:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
regs[mem8&7]=x;}else{mem8_loc=segment_translation(mem8);{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
st32_mem8_write(x);}
break EXEC_LOOP;case 0x91:case 0x92:case 0x93:case 0x94:case 0x95:case 0x96:case 0x97:reg_idx1=OPbyte&7;x=regs[0];regs[0]=regs[reg_idx1];regs[reg_idx1]=x;break EXEC_LOOP;case 0x86:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));set_word_in_register(reg_idx0,(regs[reg_idx1&3]>>((reg_idx1&4)<<1)));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();st8_mem8_write((regs[reg_idx1&3]>>((reg_idx1&4)<<1)));}
set_word_in_register(reg_idx1,x);break EXEC_LOOP;case 0x87:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0];regs[reg_idx0]=regs[reg_idx1];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();st32_mem8_write(regs[reg_idx1]);}
regs[reg_idx1]=x;break EXEC_LOOP;case 0x8e:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if(reg_idx1>=6||reg_idx1==1)
abort(6);if((mem8>>6)==3){x=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
set_segment_register(reg_idx1,x);break EXEC_LOOP;case 0x8c:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if(reg_idx1>=6)
abort(6);x=cpu.segs[reg_idx1].selector;if((mem8>>6)==3){if((((CS_flags>>8)&1)^1)){regs[mem8&7]=x;}else{set_lower_word_in_register(mem8&7,x);}}else{mem8_loc=segment_translation(mem8);st16_mem8_write(x);}
break EXEC_LOOP;case 0xc4:op_16_load_far_pointer32(0);break EXEC_LOOP;case 0xc5:op_16_load_far_pointer32(3);break EXEC_LOOP;case 0x00:case 0x08:case 0x10:case 0x18:case 0x20:case 0x28:case 0x30:case 0x38:mem8=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;reg_idx1=(mem8>>3)&7;y=(regs[reg_idx1&3]>>((reg_idx1&4)<<1));if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,do_8bit_math(conditional_var,(regs[reg_idx0&3]>>((reg_idx0&4)<<1)),y));}else{mem8_loc=segment_translation(mem8);if(conditional_var!=7){x=ld_8bits_mem8_write();x=do_8bit_math(conditional_var,x,y);st8_mem8_write(x);}else{x=ld_8bits_mem8_read();do_8bit_math(7,x,y);}}
break EXEC_LOOP;case 0x01:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];if((mem8>>6)==3){reg_idx0=mem8&7;{_src=y;_dst=regs[reg_idx0]=(regs[reg_idx0]+_src)>>0;_op=2;}}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();{_src=y;_dst=x=(x+_src)>>0;_op=2;}
st32_mem8_write(x);}
break EXEC_LOOP;case 0x09:case 0x11:case 0x19:case 0x21:case 0x29:case 0x31:mem8=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;y=regs[(mem8>>3)&7];if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=do_32bit_math(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=do_32bit_math(conditional_var,x,y);st32_mem8_write(x);}
break EXEC_LOOP;case 0x39:mem8=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;y=regs[(mem8>>3)&7];if((mem8>>6)==3){reg_idx0=mem8&7;{_src=y;_dst=(regs[reg_idx0]-_src)>>0;_op=8;}}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();{_src=y;_dst=(x-_src)>>0;_op=8;}}
break EXEC_LOOP;case 0x02:case 0x0a:case 0x12:case 0x1a:case 0x22:case 0x2a:case 0x32:case 0x3a:mem8=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;y=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);y=ld_8bits_mem8_read();}
set_word_in_register(reg_idx1,do_8bit_math(conditional_var,(regs[reg_idx1&3]>>((reg_idx1&4)<<1)),y));break EXEC_LOOP;case 0x03:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
{_src=y;_dst=regs[reg_idx1]=(regs[reg_idx1]+_src)>>0;_op=2;}
break EXEC_LOOP;case 0x0b:case 0x13:case 0x1b:case 0x23:case 0x2b:case 0x33:mem8=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
regs[reg_idx1]=do_32bit_math(conditional_var,regs[reg_idx1],y);break EXEC_LOOP;case 0x3b:mem8=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
{_src=y;_dst=(regs[reg_idx1]-_src)>>0;_op=8;}
break EXEC_LOOP;case 0x04:case 0x0c:case 0x14:case 0x1c:case 0x24:case 0x2c:case 0x34:case 0x3c:y=phys_mem8[physmem8_ptr++];conditional_var=OPbyte>>3;set_word_in_register(0,do_8bit_math(conditional_var,regs[0]&0xff,y));break EXEC_LOOP;case 0x05:{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
{_src=y;_dst=regs[0]=(regs[0]+_src)>>0;_op=2;}
break EXEC_LOOP;case 0x0d:case 0x15:case 0x1d:case 0x25:case 0x2d:{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
conditional_var=OPbyte>>3;regs[0]=do_32bit_math(conditional_var,regs[0],y);break EXEC_LOOP;case 0x35:{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
{_dst=regs[0]=regs[0]^y;_op=14;}
break EXEC_LOOP;case 0x3d:{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
{_src=y;_dst=(regs[0]-_src)>>0;_op=8;}
break EXEC_LOOP;case 0x80:case 0x82:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;y=phys_mem8[physmem8_ptr++];set_word_in_register(reg_idx0,do_8bit_math(conditional_var,(regs[reg_idx0&3]>>((reg_idx0&4)<<1)),y));}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];if(conditional_var!=7){x=ld_8bits_mem8_write();x=do_8bit_math(conditional_var,x,y);st8_mem8_write(x);}else{x=ld_8bits_mem8_read();do_8bit_math(7,x,y);}}
break EXEC_LOOP;case 0x81:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if(conditional_var==7){if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
{_src=y;_dst=(x-_src)>>0;_op=8;}}else{if((mem8>>6)==3){reg_idx0=mem8&7;{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
regs[reg_idx0]=do_32bit_math(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
x=ld_32bits_mem8_write();x=do_32bit_math(conditional_var,x,y);st32_mem8_write(x);}}
break EXEC_LOOP;case 0x83:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if(conditional_var==7){if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
y=((phys_mem8[physmem8_ptr++]<<24)>>24);{_src=y;_dst=(x-_src)>>0;_op=8;}}else{if((mem8>>6)==3){reg_idx0=mem8&7;y=((phys_mem8[physmem8_ptr++]<<24)>>24);regs[reg_idx0]=do_32bit_math(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);y=((phys_mem8[physmem8_ptr++]<<24)>>24);x=ld_32bits_mem8_write();x=do_32bit_math(conditional_var,x,y);st32_mem8_write(x);}}
break EXEC_LOOP;case 0x40:case 0x41:case 0x42:case 0x43:case 0x44:case 0x45:case 0x46:case 0x47:reg_idx1=OPbyte&7;{if(_op<25){_op2=_op;_dst2=_dst;}
regs[reg_idx1]=_dst=(regs[reg_idx1]+1)>>0;_op=27;}
break EXEC_LOOP;case 0x48:case 0x49:case 0x4a:case 0x4b:case 0x4c:case 0x4d:case 0x4e:case 0x4f:reg_idx1=OPbyte&7;{if(_op<25){_op2=_op;_dst2=_dst;}
regs[reg_idx1]=_dst=(regs[reg_idx1]-1)>>0;_op=30;}
break EXEC_LOOP;case 0x6b:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
z=((phys_mem8[physmem8_ptr++]<<24)>>24);regs[reg_idx1]=op_IMUL32(y,z);break EXEC_LOOP;case 0x69:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
{z=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
regs[reg_idx1]=op_IMUL32(y,z);break EXEC_LOOP;case 0x84:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
reg_idx1=(mem8>>3)&7;y=(regs[reg_idx1&3]>>((reg_idx1&4)<<1));{_dst=(((x&y)<<24)>>24);_op=12;}
break EXEC_LOOP;case 0x85:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
y=regs[(mem8>>3)&7];{_dst=x&y;_op=14;}
break EXEC_LOOP;case 0xa8:y=phys_mem8[physmem8_ptr++];{_dst=(((regs[0]&y)<<24)>>24);_op=12;}
break EXEC_LOOP;case 0xa9:{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
{_dst=regs[0]&y;_op=14;}
break EXEC_LOOP;case 0xf6:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
y=phys_mem8[physmem8_ptr++];{_dst=(((x&y)<<24)>>24);_op=12;}
break;case 2:if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,~(regs[reg_idx0&3]>>((reg_idx0&4)<<1)));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();x=~x;st8_mem8_write(x);}
break;case 3:if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,do_8bit_math(5,0,(regs[reg_idx0&3]>>((reg_idx0&4)<<1))));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();x=do_8bit_math(5,0,x);st8_mem8_write(x);}
break;case 4:if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
set_lower_word_in_register(0,op_MUL(regs[0],x));break;case 5:if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
set_lower_word_in_register(0,op_IMUL(regs[0],x));break;case 6:if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
op_DIV(x);break;case 7:if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
op_IDIV(x);break;default:abort(6);}
break EXEC_LOOP;case 0xf7:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
{y=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
{_dst=x&y;_op=14;}
break;case 2:if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=~regs[reg_idx0];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=~x;st32_mem8_write(x);}
break;case 3:if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=do_32bit_math(5,0,regs[reg_idx0]);}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=do_32bit_math(5,0,x);st32_mem8_write(x);}
break;case 4:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
regs[0]=op_MUL32(regs[0],x);regs[2]=v;break;case 5:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
regs[0]=op_IMUL32(regs[0],x);regs[2]=v;break;case 6:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
regs[0]=op_DIV32(regs[2],regs[0],x);regs[2]=v;break;case 7:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
regs[0]=op_IDIV32(regs[2],regs[0],x);regs[2]=v;break;default:abort(6);}
break EXEC_LOOP;case 0xc0:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){y=phys_mem8[physmem8_ptr++];reg_idx0=mem8&7;set_word_in_register(reg_idx0,shift8(conditional_var,(regs[reg_idx0&3]>>((reg_idx0&4)<<1)),y));}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_8bits_mem8_write();x=shift8(conditional_var,x,y);st8_mem8_write(x);}
break EXEC_LOOP;case 0xc1:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){y=phys_mem8[physmem8_ptr++];reg_idx0=mem8&7;regs[reg_idx0]=shift32(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_32bits_mem8_write();x=shift32(conditional_var,x,y);st32_mem8_write(x);}
break EXEC_LOOP;case 0xd0:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,shift8(conditional_var,(regs[reg_idx0&3]>>((reg_idx0&4)<<1)),1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();x=shift8(conditional_var,x,1);st8_mem8_write(x);}
break EXEC_LOOP;case 0xd1:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=shift32(conditional_var,regs[reg_idx0],1);}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=shift32(conditional_var,x,1);st32_mem8_write(x);}
break EXEC_LOOP;case 0xd2:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;y=regs[1]&0xff;if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,shift8(conditional_var,(regs[reg_idx0&3]>>((reg_idx0&4)<<1)),y));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();x=shift8(conditional_var,x,y);st8_mem8_write(x);}
break EXEC_LOOP;case 0xd3:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;y=regs[1]&0xff;if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=shift32(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=shift32(conditional_var,x,y);st32_mem8_write(x);}
break EXEC_LOOP;case 0x98:regs[0]=(regs[0]<<16)>>16;break EXEC_LOOP;case 0x99:regs[2]=regs[0]>>31;break EXEC_LOOP;case 0x50:case 0x51:case 0x52:case 0x53:case 0x54:case 0x55:case 0x56:case 0x57:x=regs[OPbyte&7];if(FS_usage_flag){mem8_loc=(regs[4]-4)>>0;{last_tlb_val=_tlb_write_[mem8_loc>>>12];if((last_tlb_val|mem8_loc)&3){__st32_mem8_write(x);}else{phys_mem32[(mem8_loc^last_tlb_val)>>2]=x;}}
regs[4]=mem8_loc;}else{push_dword_to_stack(x);}
break EXEC_LOOP;case 0x58:case 0x59:case 0x5a:case 0x5b:case 0x5c:case 0x5d:case 0x5e:case 0x5f:if(FS_usage_flag){mem8_loc=regs[4];x=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])|mem8_loc)&3?__ld_32bits_mem8_read():phys_mem32[(mem8_loc^last_tlb_val)>>2]);regs[4]=(mem8_loc+4)>>0;}else{x=pop_dword_from_stack_read();pop_dword_from_stack_incr_ptr();}
regs[OPbyte&7]=x;break EXEC_LOOP;case 0x60:op_PUSHA();break EXEC_LOOP;case 0x61:op_POPA();break EXEC_LOOP;case 0x8f:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=pop_dword_from_stack_read();pop_dword_from_stack_incr_ptr();regs[mem8&7]=x;}else{x=pop_dword_from_stack_read();y=regs[4];pop_dword_from_stack_incr_ptr();z=regs[4];mem8_loc=segment_translation(mem8);regs[4]=y;st32_mem8_write(x);regs[4]=z;}
break EXEC_LOOP;case 0x68:{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
if(FS_usage_flag){mem8_loc=(regs[4]-4)>>0;st32_mem8_write(x);regs[4]=mem8_loc;}else{push_dword_to_stack(x);}
break EXEC_LOOP;case 0x6a:x=((phys_mem8[physmem8_ptr++]<<24)>>24);if(FS_usage_flag){mem8_loc=(regs[4]-4)>>0;st32_mem8_write(x);regs[4]=mem8_loc;}else{push_dword_to_stack(x);}
break EXEC_LOOP;case 0xc8:op_ENTER();break EXEC_LOOP;case 0xc9:if(FS_usage_flag){mem8_loc=regs[5];x=ld_32bits_mem8_read();regs[5]=x;regs[4]=(mem8_loc+4)>>0;}else{op_LEAVE();}
break EXEC_LOOP;case 0x9c:iopl=(cpu.eflags>>12)&3;if((cpu.eflags&0x00020000)&&iopl!=3)
abort(13);x=get_FLAGS()&~(0x00020000|0x00010000);if((((CS_flags>>8)&1)^1)){push_dword_to_stack(x);}else{push_word_to_stack(x);}
break EXEC_LOOP;case 0x9d:iopl=(cpu.eflags>>12)&3;if((cpu.eflags&0x00020000)&&iopl!=3)
abort(13);if((((CS_flags>>8)&1)^1)){x=pop_dword_from_stack_read();pop_dword_from_stack_incr_ptr();y=-1;}else{x=pop_word_from_stack_read();pop_word_from_stack_incr_ptr();y=0xffff;}
z=(0x00000100|0x00040000|0x00200000|0x00004000);if(cpu.cpl==0){z|=0x00000200|0x00003000;}else{if(cpu.cpl<=iopl)
z|=0x00000200;}
set_FLAGS(x,z&y);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x06:case 0x0e:case 0x16:case 0x1e:push_dword_to_stack(cpu.segs[OPbyte>>3].selector);break EXEC_LOOP;case 0x07:case 0x17:case 0x1f:set_segment_register(OPbyte>>3,pop_dword_from_stack_read()&0xffff);pop_dword_from_stack_incr_ptr();break EXEC_LOOP;case 0x8d:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3)
abort(6);CS_flags=(CS_flags&~0x000f)|(6+1);regs[(mem8>>3)&7]=segment_translation(mem8);break EXEC_LOOP;case 0xfe:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,increment_8bit((regs[reg_idx0&3]>>((reg_idx0&4)<<1))));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();x=increment_8bit(x);st8_mem8_write(x);}
break;case 1:if((mem8>>6)==3){reg_idx0=mem8&7;set_word_in_register(reg_idx0,decrement_8bit((regs[reg_idx0&3]>>((reg_idx0&4)<<1))));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();x=decrement_8bit(x);st8_mem8_write(x);}
break;default:abort(6);}
break EXEC_LOOP;case 0xff:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:if((mem8>>6)==3){reg_idx0=mem8&7;{if(_op<25){_op2=_op;_dst2=_dst;}
regs[reg_idx0]=_dst=(regs[reg_idx0]+1)>>0;_op=27;}}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();{if(_op<25){_op2=_op;_dst2=_dst;}
x=_dst=(x+1)>>0;_op=27;}
st32_mem8_write(x);}
break;case 1:if((mem8>>6)==3){reg_idx0=mem8&7;{if(_op<25){_op2=_op;_dst2=_dst;}
regs[reg_idx0]=_dst=(regs[reg_idx0]-1)>>0;_op=30;}}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();{if(_op<25){_op2=_op;_dst2=_dst;}
x=_dst=(x-1)>>0;_op=30;}
st32_mem8_write(x);}
break;case 2:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
y=(eip+physmem8_ptr-initial_mem_ptr);if(FS_usage_flag){mem8_loc=(regs[4]-4)>>0;st32_mem8_write(y);regs[4]=mem8_loc;}else{push_dword_to_stack(y);}
eip=x,physmem8_ptr=initial_mem_ptr=0;break;case 4:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
eip=x,physmem8_ptr=initial_mem_ptr=0;break;case 6:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
if(FS_usage_flag){mem8_loc=(regs[4]-4)>>0;st32_mem8_write(x);regs[4]=mem8_loc;}else{push_dword_to_stack(x);}
break;case 3:case 5:if((mem8>>6)==3)
abort(6);mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();mem8_loc=(mem8_loc+4)>>0;y=ld_16bits_mem8_read();if(conditional_var==3)
op_CALLF(1,y,x,(eip+physmem8_ptr-initial_mem_ptr));else
op_JMPF(y,x);break;default:abort(6);}
break EXEC_LOOP;case 0xeb:x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;break EXEC_LOOP;case 0xe9:{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
physmem8_ptr=(physmem8_ptr+x)>>0;break EXEC_LOOP;case 0xea:if((((CS_flags>>8)&1)^1)){{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}}else{x=ld16_mem8_direct();}
y=ld16_mem8_direct();op_JMPF(y,x);break EXEC_LOOP;case 0x70:if(check_overflow()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x71:if(!check_overflow()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x72:if(check_carry()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x73:if(!check_carry()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x74:if((_dst==0)){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x75:if(!(_dst==0)){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x76:if(check_below_or_equal()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x77:if(!check_below_or_equal()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x78:if((_op==24?((_src>>7)&1):(_dst<0))){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x79:if(!(_op==24?((_src>>7)&1):(_dst<0))){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x7a:if(check_parity()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x7b:if(!check_parity()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x7c:if(check_less_than()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x7d:if(!check_less_than()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x7e:if(check_less_or_equal()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0x7f:if(!check_less_or_equal()){x=((phys_mem8[physmem8_ptr++]<<24)>>24);physmem8_ptr=(physmem8_ptr+x)>>0;}else{physmem8_ptr=(physmem8_ptr+1)>>0;}
break EXEC_LOOP;case 0xe0:case 0xe1:case 0xe2:x=((phys_mem8[physmem8_ptr++]<<24)>>24);if(CS_flags&0x0080)
conditional_var=0xffff;else
conditional_var=-1;y=(regs[1]-1)&conditional_var;regs[1]=(regs[1]&~conditional_var)|y;OPbyte&=3;if(OPbyte==0)
z=!(_dst==0);else if(OPbyte==1)
z=(_dst==0);else
z=1;if(y&&z){if(CS_flags&0x0100){eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;}else{physmem8_ptr=(physmem8_ptr+x)>>0;}}
break EXEC_LOOP;case 0xe3:x=((phys_mem8[physmem8_ptr++]<<24)>>24);if(CS_flags&0x0080)
conditional_var=0xffff;else
conditional_var=-1;if((regs[1]&conditional_var)==0){if(CS_flags&0x0100){eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;}else{physmem8_ptr=(physmem8_ptr+x)>>0;}}
break EXEC_LOOP;case 0xc2:y=(ld16_mem8_direct()<<16)>>16;x=pop_dword_from_stack_read();regs[4]=(regs[4]&~SS_mask)|((regs[4]+4+y)&SS_mask);eip=x,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0xc3:if(FS_usage_flag){mem8_loc=regs[4];x=ld_32bits_mem8_read();regs[4]=(regs[4]+4)>>0;}else{x=pop_dword_from_stack_read();pop_dword_from_stack_incr_ptr();}
eip=x,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0xe8:{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
y=(eip+physmem8_ptr-initial_mem_ptr);if(FS_usage_flag){mem8_loc=(regs[4]-4)>>0;st32_mem8_write(y);regs[4]=mem8_loc;}else{push_dword_to_stack(y);}
physmem8_ptr=(physmem8_ptr+x)>>0;break EXEC_LOOP;case 0x9a:z=(((CS_flags>>8)&1)^1);if(z){{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}}else{x=ld16_mem8_direct();}
y=ld16_mem8_direct();op_CALLF(z,y,x,(eip+physmem8_ptr-initial_mem_ptr));{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xca:y=(ld16_mem8_direct()<<16)>>16;op_RETF((((CS_flags>>8)&1)^1),y);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xcb:op_RETF((((CS_flags>>8)&1)^1),0);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xcf:op_IRET((((CS_flags>>8)&1)^1));{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x90:break EXEC_LOOP;case 0xcc:y=(eip+physmem8_ptr-initial_mem_ptr);do_interrupt(3,1,0,y,0);break EXEC_LOOP;case 0xcd:x=phys_mem8[physmem8_ptr++];if((cpu.eflags&0x00020000)&&((cpu.eflags>>12)&3)!=3)
abort(13);y=(eip+physmem8_ptr-initial_mem_ptr);do_interrupt(x,1,0,y,0);break EXEC_LOOP;case 0xce:if(check_overflow()){y=(eip+physmem8_ptr-initial_mem_ptr);do_interrupt(4,1,0,y,0);}
break EXEC_LOOP;case 0x62:checkOp_BOUND();break EXEC_LOOP;case 0xf5:_src=get_conditional_flags()^0x0001;_dst=((_src>>6)&1)^1;_op=24;break EXEC_LOOP;case 0xf8:_src=get_conditional_flags()&~0x0001;_dst=((_src>>6)&1)^1;_op=24;break EXEC_LOOP;case 0xf9:_src=get_conditional_flags()|0x0001;_dst=((_src>>6)&1)^1;_op=24;break EXEC_LOOP;case 0xfc:cpu.df=1;break EXEC_LOOP;case 0xfd:cpu.df=-1;break EXEC_LOOP;case 0xfa:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);cpu.eflags&=~0x00000200;break EXEC_LOOP;case 0xfb:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);cpu.eflags|=0x00000200;{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x9e:_src=((regs[0]>>8)&(0x0080|0x0040|0x0010|0x0004|0x0001))|(check_overflow()<<11);_dst=((_src>>6)&1)^1;_op=24;break EXEC_LOOP;case 0x9f:x=get_FLAGS();set_word_in_register(4,x);break EXEC_LOOP;case 0xf4:if(cpu.cpl!=0)
abort(13);cpu.halted=1;exit_code=257;break OUTER_LOOP;case 0xa4:stringOp_MOVSB();break EXEC_LOOP;case 0xa5:stringOp_MOVSD();break EXEC_LOOP;case 0xaa:stringOp_STOSB();break EXEC_LOOP;case 0xab:stringOp_STOSD();break EXEC_LOOP;case 0xa6:stringOp_CMPSB();break EXEC_LOOP;case 0xa7:stringOp_CMPSD();break EXEC_LOOP;case 0xac:stringOp_LODSB();break EXEC_LOOP;case 0xad:stringOp_LODSD();break EXEC_LOOP;case 0xae:stringOp_SCASB();break EXEC_LOOP;case 0xaf:stringOp_SCASD();break EXEC_LOOP;case 0x6c:stringOp_INSB();{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x6d:stringOp_INSD();{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x6e:stringOp_OUTSB();{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x6f:stringOp_OUTSD();{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xd8:case 0xd9:case 0xda:case 0xdb:case 0xdc:case 0xdd:case 0xde:case 0xdf:if(cpu.cr0&((1<<2)|(1<<3))){abort(7);}
mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;reg_idx0=mem8&7;conditional_var=((OPbyte&7)<<3)|((mem8>>3)&7);set_lower_word_in_register(0,0xffff);if((mem8>>6)==3){}else{mem8_loc=segment_translation(mem8);}
break EXEC_LOOP;case 0x9b:break EXEC_LOOP;case 0xe4:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);x=phys_mem8[physmem8_ptr++];set_word_in_register(0,cpu.ld8_port(x));{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xe5:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);x=phys_mem8[physmem8_ptr++];regs[0]=cpu.ld32_port(x);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xe6:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);x=phys_mem8[physmem8_ptr++];cpu.st8_port(x,regs[0]&0xff);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xe7:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);x=phys_mem8[physmem8_ptr++];cpu.st32_port(x,regs[0]);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xec:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);set_word_in_register(0,cpu.ld8_port(regs[2]&0xffff));{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xed:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);regs[0]=cpu.ld32_port(regs[2]&0xffff);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xee:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);cpu.st8_port(regs[2]&0xffff,regs[0]&0xff);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0xef:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);cpu.st32_port(regs[2]&0xffff,regs[0]);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x27:op_DAA();break EXEC_LOOP;case 0x2f:op_DAS();break EXEC_LOOP;case 0x37:op_AAA();break EXEC_LOOP;case 0x3f:op_AAS();break EXEC_LOOP;case 0xd4:x=phys_mem8[physmem8_ptr++];op_AAM(x);break EXEC_LOOP;case 0xd5:x=phys_mem8[physmem8_ptr++];op_AAD(x);break EXEC_LOOP;case 0x63:op_ARPL();break EXEC_LOOP;case 0xd6:case 0xf1:abort(6);break;case 0x0f:OPbyte=phys_mem8[physmem8_ptr++];switch(OPbyte){case 0x80:case 0x81:case 0x82:case 0x83:case 0x84:case 0x85:case 0x86:case 0x87:case 0x88:case 0x89:case 0x8a:case 0x8b:case 0x8c:case 0x8d:case 0x8e:case 0x8f:{x=phys_mem8[physmem8_ptr]|(phys_mem8[physmem8_ptr+1]<<8)|(phys_mem8[physmem8_ptr+2]<<16)|(phys_mem8[physmem8_ptr+3]<<24);physmem8_ptr+=4;}
if(check_status_bits_for_jump(OPbyte&0xf))
physmem8_ptr=(physmem8_ptr+x)>>0;break EXEC_LOOP;case 0x90:case 0x91:case 0x92:case 0x93:case 0x94:case 0x95:case 0x96:case 0x97:case 0x98:case 0x99:case 0x9a:case 0x9b:case 0x9c:case 0x9d:case 0x9e:case 0x9f:mem8=phys_mem8[physmem8_ptr++];x=check_status_bits_for_jump(OPbyte&0xf);if((mem8>>6)==3){set_word_in_register(mem8&7,x);}else{mem8_loc=segment_translation(mem8);st8_mem8_write(x);}
break EXEC_LOOP;case 0x40:case 0x41:case 0x42:case 0x43:case 0x44:case 0x45:case 0x46:case 0x47:case 0x48:case 0x49:case 0x4a:case 0x4b:case 0x4c:case 0x4d:case 0x4e:case 0x4f:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_read();}
if(check_status_bits_for_jump(OPbyte&0xf))
regs[(mem8>>3)&7]=x;break EXEC_LOOP;case 0xb6:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1))&0xff;}else{mem8_loc=segment_translation(mem8);x=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
regs[reg_idx1]=x;break EXEC_LOOP;case 0xb7:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){x=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
regs[reg_idx1]=x;break EXEC_LOOP;case 0xbe:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=(((last_tlb_val=_tlb_read_[mem8_loc>>>12])==-1)?__ld_8bits_mem8_read():phys_mem8[mem8_loc^last_tlb_val]);}
regs[reg_idx1]=(((x)<<24)>>24);break EXEC_LOOP;case 0xbf:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
regs[reg_idx1]=(((x)<<16)>>16);break EXEC_LOOP;case 0x00:if(!(cpu.cr0&(1<<0))||(cpu.eflags&0x00020000))
abort(6);mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:case 1:if(conditional_var==0)
x=cpu.ldt.selector;else
x=cpu.tr.selector;if((mem8>>6)==3){set_lower_word_in_register(mem8&7,x);}else{mem8_loc=segment_translation(mem8);st16_mem8_write(x);}
break;case 2:case 3:if(cpu.cpl!=0)
abort(13);if((mem8>>6)==3){x=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
if(conditional_var==2)
op_LDTR(x);else
op_LTR(x);break;case 4:case 5:if((mem8>>6)==3){x=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
op_VERR_VERW(x,conditional_var&1);break;default:abort(6);}
break EXEC_LOOP;case 0x01:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 2:case 3:if((mem8>>6)==3)
abort(6);if(this.cpl!=0)
abort(13);mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();mem8_loc+=2;y=ld_32bits_mem8_read();if(conditional_var==2){this.gdt.base=y;this.gdt.limit=x;}else{this.idt.base=y;this.idt.limit=x;}
break;case 7:if(this.cpl!=0)
abort(13);if((mem8>>6)==3)
abort(6);mem8_loc=segment_translation(mem8);cpu.tlb_flush_page(mem8_loc&-4096);break;default:abort(6);}
break EXEC_LOOP;case 0x02:case 0x03:op_LAR_LSL((((CS_flags>>8)&1)^1),OPbyte&1);break EXEC_LOOP;case 0x20:if(cpu.cpl!=0)
abort(13);mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)!=3)
abort(6);reg_idx1=(mem8>>3)&7;switch(reg_idx1){case 0:x=cpu.cr0;break;case 2:x=cpu.cr2;break;case 3:x=cpu.cr3;break;case 4:x=cpu.cr4;break;default:abort(6);}
regs[mem8&7]=x;break EXEC_LOOP;case 0x22:if(cpu.cpl!=0)
abort(13);mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)!=3)
abort(6);reg_idx1=(mem8>>3)&7;x=regs[mem8&7];switch(reg_idx1){case 0:set_CR0(x);break;case 2:cpu.cr2=x;break;case 3:set_CR3(x);break;case 4:set_CR4(x);break;default:abort(6);}
break EXEC_LOOP;case 0x06:if(cpu.cpl!=0)
abort(13);set_CR0(cpu.cr0&~(1<<3));break EXEC_LOOP;case 0x23:if(cpu.cpl!=0)
abort(13);mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)!=3)
abort(6);reg_idx1=(mem8>>3)&7;x=regs[mem8&7];if(reg_idx1==4||reg_idx1==5)
abort(6);break EXEC_LOOP;case 0xb2:case 0xb4:case 0xb5:op_16_load_far_pointer32(OPbyte&7);break EXEC_LOOP;case 0xa2:op_CPUID();break EXEC_LOOP;case 0xa4:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];if((mem8>>6)==3){z=phys_mem8[physmem8_ptr++];reg_idx0=mem8&7;regs[reg_idx0]=op_SHLD(regs[reg_idx0],y,z);}else{mem8_loc=segment_translation(mem8);z=phys_mem8[physmem8_ptr++];x=ld_32bits_mem8_write();x=op_SHLD(x,y,z);st32_mem8_write(x);}
break EXEC_LOOP;case 0xa5:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];z=regs[1];if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=op_SHLD(regs[reg_idx0],y,z);}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=op_SHLD(x,y,z);st32_mem8_write(x);}
break EXEC_LOOP;case 0xac:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];if((mem8>>6)==3){z=phys_mem8[physmem8_ptr++];reg_idx0=mem8&7;regs[reg_idx0]=op_SHRD(regs[reg_idx0],y,z);}else{mem8_loc=segment_translation(mem8);z=phys_mem8[physmem8_ptr++];x=ld_32bits_mem8_write();x=op_SHRD(x,y,z);st32_mem8_write(x);}
break EXEC_LOOP;case 0xad:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];z=regs[1];if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=op_SHRD(regs[reg_idx0],y,z);}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();x=op_SHRD(x,y,z);st32_mem8_write(x);}
break EXEC_LOOP;case 0xba:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 4:if((mem8>>6)==3){x=regs[mem8&7];y=phys_mem8[physmem8_ptr++];}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_32bits_mem8_read();}
op_BT(x,y);break;case 5:case 6:case 7:if((mem8>>6)==3){reg_idx0=mem8&7;y=phys_mem8[physmem8_ptr++];regs[reg_idx0]=op_BTS_BTR_BTC(conditional_var&3,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_32bits_mem8_write();x=op_BTS_BTR_BTC(conditional_var&3,x,y);st32_mem8_write(x);}
break;default:abort(6);}
break EXEC_LOOP;case 0xa3:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);mem8_loc=(mem8_loc+((y>>5)<<2))>>0;x=ld_32bits_mem8_read();}
op_BT(x,y);break EXEC_LOOP;case 0xab:case 0xb3:case 0xbb:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];conditional_var=(OPbyte>>3)&3;if((mem8>>6)==3){reg_idx0=mem8&7;regs[reg_idx0]=op_BTS_BTR_BTC(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);mem8_loc=(mem8_loc+((y>>5)<<2))>>0;x=ld_32bits_mem8_write();x=op_BTS_BTR_BTC(conditional_var,x,y);st32_mem8_write(x);}
break EXEC_LOOP;case 0xbc:case 0xbd:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
if(OPbyte&1)
regs[reg_idx1]=op_BSR(regs[reg_idx1],y);else
regs[reg_idx1]=op_BSF(regs[reg_idx1],y);break EXEC_LOOP;case 0xaf:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_32bits_mem8_read();}
regs[reg_idx1]=op_IMUL32(regs[reg_idx1],y);break EXEC_LOOP;case 0x31:if((cpu.cr4&(1<<2))&&cpu.cpl!=0)
abort(13);x=current_cycle_count();regs[0]=x>>>0;regs[2]=(x/0x100000000)>>>0;break EXEC_LOOP;case 0xc0:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));y=do_8bit_math(0,x,(regs[reg_idx1&3]>>((reg_idx1&4)<<1)));set_word_in_register(reg_idx1,x);set_word_in_register(reg_idx0,y);}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();y=do_8bit_math(0,x,(regs[reg_idx1&3]>>((reg_idx1&4)<<1)));st8_mem8_write(y);set_word_in_register(reg_idx1,x);}
break EXEC_LOOP;case 0xc1:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0];y=do_32bit_math(0,x,regs[reg_idx1]);regs[reg_idx1]=x;regs[reg_idx0]=y;}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();y=do_32bit_math(0,x,regs[reg_idx1]);st32_mem8_write(y);regs[reg_idx1]=x;}
break EXEC_LOOP;case 0xb0:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));y=do_8bit_math(5,regs[0],x);if(y==0){set_word_in_register(reg_idx0,(regs[reg_idx1&3]>>((reg_idx1&4)<<1)));}else{set_word_in_register(0,x);}}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_write();y=do_8bit_math(5,regs[0],x);if(y==0){st8_mem8_write((regs[reg_idx1&3]>>((reg_idx1&4)<<1)));}else{set_word_in_register(0,x);}}
break EXEC_LOOP;case 0xb1:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0];y=do_32bit_math(5,regs[0],x);if(y==0){regs[reg_idx0]=regs[reg_idx1];}else{regs[0]=x;}}else{mem8_loc=segment_translation(mem8);x=ld_32bits_mem8_write();y=do_32bit_math(5,regs[0],x);if(y==0){st32_mem8_write(regs[reg_idx1]);}else{regs[0]=x;}}
break EXEC_LOOP;case 0xa0:case 0xa8:push_dword_to_stack(cpu.segs[(OPbyte>>3)&7].selector);break EXEC_LOOP;case 0xa1:case 0xa9:set_segment_register((OPbyte>>3)&7,pop_dword_from_stack_read()&0xffff);pop_dword_from_stack_incr_ptr();break EXEC_LOOP;case 0xc8:case 0xc9:case 0xca:case 0xcb:case 0xcc:case 0xcd:case 0xce:case 0xcf:reg_idx1=OPbyte&7;x=regs[reg_idx1];x=(x>>>24)|((x>>8)&0x0000ff00)|((x<<8)&0x00ff0000)|(x<<24);regs[reg_idx1]=x;break EXEC_LOOP;case 0x04:case 0x05:case 0x07:case 0x08:case 0x09:case 0x0a:case 0x0b:case 0x0c:case 0x0d:case 0x0e:case 0x0f:case 0x10:case 0x11:case 0x12:case 0x13:case 0x14:case 0x15:case 0x16:case 0x17:case 0x18:case 0x19:case 0x1a:case 0x1b:case 0x1c:case 0x1d:case 0x1e:case 0x1f:case 0x21:case 0x24:case 0x25:case 0x26:case 0x27:case 0x28:case 0x29:case 0x2a:case 0x2b:case 0x2c:case 0x2d:case 0x2e:case 0x2f:case 0x30:case 0x32:case 0x33:case 0x34:case 0x35:case 0x36:case 0x37:case 0x38:case 0x39:case 0x3a:case 0x3b:case 0x3c:case 0x3d:case 0x3e:case 0x3f:case 0x50:case 0x51:case 0x52:case 0x53:case 0x54:case 0x55:case 0x56:case 0x57:case 0x58:case 0x59:case 0x5a:case 0x5b:case 0x5c:case 0x5d:case 0x5e:case 0x5f:case 0x60:case 0x61:case 0x62:case 0x63:case 0x64:case 0x65:case 0x66:case 0x67:case 0x68:case 0x69:case 0x6a:case 0x6b:case 0x6c:case 0x6d:case 0x6e:case 0x6f:case 0x70:case 0x71:case 0x72:case 0x73:case 0x74:case 0x75:case 0x76:case 0x77:case 0x78:case 0x79:case 0x7a:case 0x7b:case 0x7c:case 0x7d:case 0x7e:case 0x7f:case 0xa6:case 0xa7:case 0xaa:case 0xae:case 0xb8:case 0xb9:case 0xc2:case 0xc3:case 0xc4:case 0xc5:case 0xc6:case 0xc7:case 0xd0:case 0xd1:case 0xd2:case 0xd3:case 0xd4:case 0xd5:case 0xd6:case 0xd7:case 0xd8:case 0xd9:case 0xda:case 0xdb:case 0xdc:case 0xdd:case 0xde:case 0xdf:case 0xe0:case 0xe1:case 0xe2:case 0xe3:case 0xe4:case 0xe5:case 0xe6:case 0xe7:case 0xe8:case 0xe9:case 0xea:case 0xeb:case 0xec:case 0xed:case 0xee:case 0xef:case 0xf0:case 0xf1:case 0xf2:case 0xf3:case 0xf4:case 0xf5:case 0xf6:case 0xf7:case 0xf8:case 0xf9:case 0xfa:case 0xfb:case 0xfc:case 0xfd:case 0xfe:case 0xff:default:abort(6);}
break;default:switch(OPbyte){case 0x189:mem8=phys_mem8[physmem8_ptr++];x=regs[(mem8>>3)&7];if((mem8>>6)==3){set_lower_word_in_register(mem8&7,x);}else{mem8_loc=segment_translation(mem8);st16_mem8_write(x);}
break EXEC_LOOP;case 0x18b:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
set_lower_word_in_register((mem8>>3)&7,x);break EXEC_LOOP;case 0x1b8:case 0x1b9:case 0x1ba:case 0x1bb:case 0x1bc:case 0x1bd:case 0x1be:case 0x1bf:set_lower_word_in_register(OPbyte&7,ld16_mem8_direct());break EXEC_LOOP;case 0x1a1:mem8_loc=segmented_mem8_loc_for_MOV();x=ld_16bits_mem8_read();set_lower_word_in_register(0,x);break EXEC_LOOP;case 0x1a3:mem8_loc=segmented_mem8_loc_for_MOV();st16_mem8_write(regs[0]);break EXEC_LOOP;case 0x1c7:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=ld16_mem8_direct();set_lower_word_in_register(mem8&7,x);}else{mem8_loc=segment_translation(mem8);x=ld16_mem8_direct();st16_mem8_write(x);}
break EXEC_LOOP;case 0x191:case 0x192:case 0x193:case 0x194:case 0x195:case 0x196:case 0x197:reg_idx1=OPbyte&7;x=regs[0];set_lower_word_in_register(0,regs[reg_idx1]);set_lower_word_in_register(reg_idx1,x);break EXEC_LOOP;case 0x187:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0];set_lower_word_in_register(reg_idx0,regs[reg_idx1]);}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();st16_mem8_write(regs[reg_idx1]);}
set_lower_word_in_register(reg_idx1,x);break EXEC_LOOP;case 0x1c4:op_16_load_far_pointer16(0);break EXEC_LOOP;case 0x1c5:op_16_load_far_pointer16(3);break EXEC_LOOP;case 0x101:case 0x109:case 0x111:case 0x119:case 0x121:case 0x129:case 0x131:case 0x139:mem8=phys_mem8[physmem8_ptr++];conditional_var=(OPbyte>>3)&7;y=regs[(mem8>>3)&7];if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,do_16bit_math(conditional_var,regs[reg_idx0],y));}else{mem8_loc=segment_translation(mem8);if(conditional_var!=7){x=ld_16bits_mem8_write();x=do_16bit_math(conditional_var,x,y);st16_mem8_write(x);}else{x=ld_16bits_mem8_read();do_16bit_math(7,x,y);}}
break EXEC_LOOP;case 0x103:case 0x10b:case 0x113:case 0x11b:case 0x123:case 0x12b:case 0x133:case 0x13b:mem8=phys_mem8[physmem8_ptr++];conditional_var=(OPbyte>>3)&7;reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_16bits_mem8_read();}
set_lower_word_in_register(reg_idx1,do_16bit_math(conditional_var,regs[reg_idx1],y));break EXEC_LOOP;case 0x105:case 0x10d:case 0x115:case 0x11d:case 0x125:case 0x12d:case 0x135:case 0x13d:y=ld16_mem8_direct();conditional_var=(OPbyte>>3)&7;set_lower_word_in_register(0,do_16bit_math(conditional_var,regs[0],y));break EXEC_LOOP;case 0x181:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;y=ld16_mem8_direct();regs[reg_idx0]=do_16bit_math(conditional_var,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);y=ld16_mem8_direct();if(conditional_var!=7){x=ld_16bits_mem8_write();x=do_16bit_math(conditional_var,x,y);st16_mem8_write(x);}else{x=ld_16bits_mem8_read();do_16bit_math(7,x,y);}}
break EXEC_LOOP;case 0x183:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;y=((phys_mem8[physmem8_ptr++]<<24)>>24);set_lower_word_in_register(reg_idx0,do_16bit_math(conditional_var,regs[reg_idx0],y));}else{mem8_loc=segment_translation(mem8);y=((phys_mem8[physmem8_ptr++]<<24)>>24);if(conditional_var!=7){x=ld_16bits_mem8_write();x=do_16bit_math(conditional_var,x,y);st16_mem8_write(x);}else{x=ld_16bits_mem8_read();do_16bit_math(7,x,y);}}
break EXEC_LOOP;case 0x140:case 0x141:case 0x142:case 0x143:case 0x144:case 0x145:case 0x146:case 0x147:reg_idx1=OPbyte&7;set_lower_word_in_register(reg_idx1,increment_16bit(regs[reg_idx1]));break EXEC_LOOP;case 0x148:case 0x149:case 0x14a:case 0x14b:case 0x14c:case 0x14d:case 0x14e:case 0x14f:reg_idx1=OPbyte&7;set_lower_word_in_register(reg_idx1,decrement_16bit(regs[reg_idx1]));break EXEC_LOOP;case 0x16b:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_16bits_mem8_read();}
z=((phys_mem8[physmem8_ptr++]<<24)>>24);set_lower_word_in_register(reg_idx1,op_16_IMUL(y,z));break EXEC_LOOP;case 0x169:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_16bits_mem8_read();}
z=ld16_mem8_direct();set_lower_word_in_register(reg_idx1,op_16_IMUL(y,z));break EXEC_LOOP;case 0x185:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
y=regs[(mem8>>3)&7];{_dst=(((x&y)<<16)>>16);_op=13;}
break EXEC_LOOP;case 0x1a9:y=ld16_mem8_direct();{_dst=(((regs[0]&y)<<16)>>16);_op=13;}
break EXEC_LOOP;case 0x1f7:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
y=ld16_mem8_direct();{_dst=(((x&y)<<16)>>16);_op=13;}
break;case 2:if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,~regs[reg_idx0]);}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=~x;st16_mem8_write(x);}
break;case 3:if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,do_16bit_math(5,0,regs[reg_idx0]));}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=do_16bit_math(5,0,x);st16_mem8_write(x);}
break;case 4:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
x=op_16_MUL(regs[0],x);set_lower_word_in_register(0,x);set_lower_word_in_register(2,x>>16);break;case 5:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
x=op_16_IMUL(regs[0],x);set_lower_word_in_register(0,x);set_lower_word_in_register(2,x>>16);break;case 6:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
op_16_DIV(x);break;case 7:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
op_16_IDIV(x);break;default:abort(6);}
break EXEC_LOOP;case 0x1c1:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){y=phys_mem8[physmem8_ptr++];reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,shift16(conditional_var,regs[reg_idx0],y));}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_16bits_mem8_write();x=shift16(conditional_var,x,y);st16_mem8_write(x);}
break EXEC_LOOP;case 0x1d1:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,shift16(conditional_var,regs[reg_idx0],1));}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=shift16(conditional_var,x,1);st16_mem8_write(x);}
break EXEC_LOOP;case 0x1d3:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;y=regs[1]&0xff;if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,shift16(conditional_var,regs[reg_idx0],y));}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=shift16(conditional_var,x,y);st16_mem8_write(x);}
break EXEC_LOOP;case 0x198:set_lower_word_in_register(0,(regs[0]<<24)>>24);break EXEC_LOOP;case 0x199:set_lower_word_in_register(2,(regs[0]<<16)>>31);break EXEC_LOOP;case 0x190:break EXEC_LOOP;case 0x150:case 0x151:case 0x152:case 0x153:case 0x154:case 0x155:case 0x156:case 0x157:push_word_to_stack(regs[OPbyte&7]);break EXEC_LOOP;case 0x158:case 0x159:case 0x15a:case 0x15b:case 0x15c:case 0x15d:case 0x15e:case 0x15f:x=pop_word_from_stack_read();pop_word_from_stack_incr_ptr();set_lower_word_in_register(OPbyte&7,x);break EXEC_LOOP;case 0x160:op_16_PUSHA();break EXEC_LOOP;case 0x161:op_16_POPA();break EXEC_LOOP;case 0x18f:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=pop_word_from_stack_read();pop_word_from_stack_incr_ptr();set_lower_word_in_register(mem8&7,x);}else{x=pop_word_from_stack_read();y=regs[4];pop_word_from_stack_incr_ptr();z=regs[4];mem8_loc=segment_translation(mem8);regs[4]=y;st16_mem8_write(x);regs[4]=z;}
break EXEC_LOOP;case 0x168:x=ld16_mem8_direct();push_word_to_stack(x);break EXEC_LOOP;case 0x16a:x=((phys_mem8[physmem8_ptr++]<<24)>>24);push_word_to_stack(x);break EXEC_LOOP;case 0x1c8:op_16_ENTER();break EXEC_LOOP;case 0x1c9:op_16_LEAVE();break EXEC_LOOP;case 0x106:case 0x10e:case 0x116:case 0x11e:push_word_to_stack(cpu.segs[(OPbyte>>3)&3].selector);break EXEC_LOOP;case 0x107:case 0x117:case 0x11f:set_segment_register((OPbyte>>3)&3,pop_word_from_stack_read());pop_word_from_stack_incr_ptr();break EXEC_LOOP;case 0x18d:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3)
abort(6);CS_flags=(CS_flags&~0x000f)|(6+1);set_lower_word_in_register((mem8>>3)&7,segment_translation(mem8));break EXEC_LOOP;case 0x1ff:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 0:if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,increment_16bit(regs[reg_idx0]));}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=increment_16bit(x);st16_mem8_write(x);}
break;case 1:if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,decrement_16bit(regs[reg_idx0]));}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=decrement_16bit(x);st16_mem8_write(x);}
break;case 2:if((mem8>>6)==3){x=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
push_word_to_stack((eip+physmem8_ptr-initial_mem_ptr));eip=x,physmem8_ptr=initial_mem_ptr=0;break;case 4:if((mem8>>6)==3){x=regs[mem8&7]&0xffff;}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
eip=x,physmem8_ptr=initial_mem_ptr=0;break;case 6:if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
push_word_to_stack(x);break;case 3:case 5:if((mem8>>6)==3)
abort(6);mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();mem8_loc=(mem8_loc+2)>>0;y=ld_16bits_mem8_read();if(conditional_var==3)
op_CALLF(0,y,x,(eip+physmem8_ptr-initial_mem_ptr));else
op_JMPF(y,x);break;default:abort(6);}
break EXEC_LOOP;case 0x1eb:x=((phys_mem8[physmem8_ptr++]<<24)>>24);eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x1e9:x=ld16_mem8_direct();eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x170:case 0x171:case 0x172:case 0x173:case 0x174:case 0x175:case 0x176:case 0x177:case 0x178:case 0x179:case 0x17a:case 0x17b:case 0x17c:case 0x17d:case 0x17e:case 0x17f:x=((phys_mem8[physmem8_ptr++]<<24)>>24);y=check_status_bits_for_jump(OPbyte&0xf);if(y)
eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x1c2:y=(ld16_mem8_direct()<<16)>>16;x=pop_word_from_stack_read();regs[4]=(regs[4]&~SS_mask)|((regs[4]+2+y)&SS_mask);eip=x,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x1c3:x=pop_word_from_stack_read();pop_word_from_stack_incr_ptr();eip=x,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x1e8:x=ld16_mem8_direct();push_word_to_stack((eip+physmem8_ptr-initial_mem_ptr));eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x162:op_16_BOUND();break EXEC_LOOP;case 0x1a5:op_16_MOVS();break EXEC_LOOP;case 0x1a7:op_16_CMPS();break EXEC_LOOP;case 0x1ad:op_16_LODS();break EXEC_LOOP;case 0x1af:op_16_SCAS();break EXEC_LOOP;case 0x1ab:op_16_STOS();break EXEC_LOOP;case 0x16d:op_16_INS();{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x16f:op_16_OUTS();{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x1e5:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);x=phys_mem8[physmem8_ptr++];set_lower_word_in_register(0,cpu.ld16_port(x));{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x1e7:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);x=phys_mem8[physmem8_ptr++];cpu.st16_port(x,regs[0]&0xffff);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x1ed:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);set_lower_word_in_register(0,cpu.ld16_port(regs[2]&0xffff));{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x1ef:iopl=(cpu.eflags>>12)&3;if(cpu.cpl>iopl)
abort(13);cpu.st16_port(regs[2]&0xffff,regs[0]&0xffff);{if(cpu.hard_irq!=0&&(cpu.eflags&0x00000200))
break OUTER_LOOP;}
break EXEC_LOOP;case 0x166:case 0x167:case 0x1f0:case 0x1f2:case 0x1f3:case 0x126:case 0x12e:case 0x136:case 0x13e:case 0x164:case 0x165:case 0x100:case 0x108:case 0x110:case 0x118:case 0x120:case 0x128:case 0x130:case 0x138:case 0x102:case 0x10a:case 0x112:case 0x11a:case 0x122:case 0x12a:case 0x132:case 0x13a:case 0x104:case 0x10c:case 0x114:case 0x11c:case 0x124:case 0x12c:case 0x134:case 0x13c:case 0x1a0:case 0x1a2:case 0x1d8:case 0x1d9:case 0x1da:case 0x1db:case 0x1dc:case 0x1dd:case 0x1de:case 0x1df:case 0x184:case 0x1a8:case 0x1f6:case 0x1c0:case 0x1d0:case 0x1d2:case 0x1fe:case 0x1cd:case 0x1ce:case 0x1f5:case 0x1f8:case 0x1f9:case 0x1fc:case 0x1fd:case 0x1fa:case 0x1fb:case 0x19e:case 0x19f:case 0x1f4:case 0x127:case 0x12f:case 0x137:case 0x13f:case 0x1d4:case 0x1d5:case 0x16c:case 0x16e:case 0x1a4:case 0x1a6:case 0x1aa:case 0x1ac:case 0x1ae:case 0x180:case 0x182:case 0x186:case 0x188:case 0x18a:case 0x18c:case 0x18e:case 0x19b:case 0x1b0:case 0x1b1:case 0x1b2:case 0x1b3:case 0x1b4:case 0x1b5:case 0x1b6:case 0x1b7:case 0x1c6:case 0x1cc:case 0x1d7:case 0x1e4:case 0x1e6:case 0x1ec:case 0x1ee:case 0x1cf:case 0x1ca:case 0x1cb:case 0x19a:case 0x19c:case 0x19d:case 0x1ea:case 0x1e0:case 0x1e1:case 0x1e2:case 0x1e3:OPbyte&=0xff;break;case 0x163:case 0x1d6:case 0x1f1:default:abort(6);case 0x10f:OPbyte=phys_mem8[physmem8_ptr++];OPbyte|=0x0100;switch(OPbyte){case 0x180:case 0x181:case 0x182:case 0x183:case 0x184:case 0x185:case 0x186:case 0x187:case 0x188:case 0x189:case 0x18a:case 0x18b:case 0x18c:case 0x18d:case 0x18e:case 0x18f:x=ld16_mem8_direct();if(check_status_bits_for_jump(OPbyte&0xf))
eip=(eip+physmem8_ptr-initial_mem_ptr+x)&0xffff,physmem8_ptr=initial_mem_ptr=0;break EXEC_LOOP;case 0x140:case 0x141:case 0x142:case 0x143:case 0x144:case 0x145:case 0x146:case 0x147:case 0x148:case 0x149:case 0x14a:case 0x14b:case 0x14c:case 0x14d:case 0x14e:case 0x14f:mem8=phys_mem8[physmem8_ptr++];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_read();}
if(check_status_bits_for_jump(OPbyte&0xf))
set_lower_word_in_register((mem8>>3)&7,x);break EXEC_LOOP;case 0x1b6:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1))&0xff;}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
set_lower_word_in_register(reg_idx1,x);break EXEC_LOOP;case 0x1be:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=(regs[reg_idx0&3]>>((reg_idx0&4)<<1));}else{mem8_loc=segment_translation(mem8);x=ld_8bits_mem8_read();}
set_lower_word_in_register(reg_idx1,(((x)<<24)>>24));break EXEC_LOOP;case 0x1af:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_16bits_mem8_read();}
set_lower_word_in_register(reg_idx1,op_16_IMUL(regs[reg_idx1],y));break EXEC_LOOP;case 0x1c1:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0];y=do_16bit_math(0,x,regs[reg_idx1]);set_lower_word_in_register(reg_idx1,x);set_lower_word_in_register(reg_idx0,y);}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();y=do_16bit_math(0,x,regs[reg_idx1]);st16_mem8_write(y);set_lower_word_in_register(reg_idx1,x);}
break EXEC_LOOP;case 0x1a0:case 0x1a8:push_word_to_stack(cpu.segs[(OPbyte>>3)&7].selector);break EXEC_LOOP;case 0x1a1:case 0x1a9:set_segment_register((OPbyte>>3)&7,pop_word_from_stack_read());pop_word_from_stack_incr_ptr();break EXEC_LOOP;case 0x1b2:case 0x1b4:case 0x1b5:op_16_load_far_pointer16(OPbyte&7);break EXEC_LOOP;case 0x1a4:case 0x1ac:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];conditional_var=(OPbyte>>3)&1;if((mem8>>6)==3){z=phys_mem8[physmem8_ptr++];reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,op_16_SHRD_SHLD(conditional_var,regs[reg_idx0],y,z));}else{mem8_loc=segment_translation(mem8);z=phys_mem8[physmem8_ptr++];x=ld_16bits_mem8_write();x=op_16_SHRD_SHLD(conditional_var,x,y,z);st16_mem8_write(x);}
break EXEC_LOOP;case 0x1a5:case 0x1ad:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];z=regs[1];conditional_var=(OPbyte>>3)&1;if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,op_16_SHRD_SHLD(conditional_var,regs[reg_idx0],y,z));}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();x=op_16_SHRD_SHLD(conditional_var,x,y,z);st16_mem8_write(x);}
break EXEC_LOOP;case 0x1ba:mem8=phys_mem8[physmem8_ptr++];conditional_var=(mem8>>3)&7;switch(conditional_var){case 4:if((mem8>>6)==3){x=regs[mem8&7];y=phys_mem8[physmem8_ptr++];}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_16bits_mem8_read();}
op_16_BT(x,y);break;case 5:case 6:case 7:if((mem8>>6)==3){reg_idx0=mem8&7;y=phys_mem8[physmem8_ptr++];regs[reg_idx0]=op_16_BTS_BTR_BTC(conditional_var&3,regs[reg_idx0],y);}else{mem8_loc=segment_translation(mem8);y=phys_mem8[physmem8_ptr++];x=ld_16bits_mem8_write();x=op_16_BTS_BTR_BTC(conditional_var&3,x,y);st16_mem8_write(x);}
break;default:abort(6);}
break EXEC_LOOP;case 0x1a3:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];if((mem8>>6)==3){x=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);mem8_loc=(mem8_loc+(((y&0xffff)>>4)<<1))>>0;x=ld_16bits_mem8_read();}
op_16_BT(x,y);break EXEC_LOOP;case 0x1ab:case 0x1b3:case 0x1bb:mem8=phys_mem8[physmem8_ptr++];y=regs[(mem8>>3)&7];conditional_var=(OPbyte>>3)&3;if((mem8>>6)==3){reg_idx0=mem8&7;set_lower_word_in_register(reg_idx0,op_16_BTS_BTR_BTC(conditional_var,regs[reg_idx0],y));}else{mem8_loc=segment_translation(mem8);mem8_loc=(mem8_loc+(((y&0xffff)>>4)<<1))>>0;x=ld_16bits_mem8_write();x=op_16_BTS_BTR_BTC(conditional_var,x,y);st16_mem8_write(x);}
break EXEC_LOOP;case 0x1bc:case 0x1bd:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){y=regs[mem8&7];}else{mem8_loc=segment_translation(mem8);y=ld_16bits_mem8_read();}
x=regs[reg_idx1];if(OPbyte&1)
x=op_16_BSR(x,y);else
x=op_16_BSF(x,y);set_lower_word_in_register(reg_idx1,x);break EXEC_LOOP;case 0x1b1:mem8=phys_mem8[physmem8_ptr++];reg_idx1=(mem8>>3)&7;if((mem8>>6)==3){reg_idx0=mem8&7;x=regs[reg_idx0];y=do_16bit_math(5,regs[0],x);if(y==0){set_lower_word_in_register(reg_idx0,regs[reg_idx1]);}else{set_lower_word_in_register(0,x);}}else{mem8_loc=segment_translation(mem8);x=ld_16bits_mem8_write();y=do_16bit_math(5,regs[0],x);if(y==0){st16_mem8_write(regs[reg_idx1]);}else{set_lower_word_in_register(0,x);}}
break EXEC_LOOP;case 0x100:case 0x101:case 0x102:case 0x103:case 0x120:case 0x122:case 0x106:case 0x123:case 0x1a2:case 0x131:case 0x190:case 0x191:case 0x192:case 0x193:case 0x194:case 0x195:case 0x196:case 0x197:case 0x198:case 0x199:case 0x19a:case 0x19b:case 0x19c:case 0x19d:case 0x19e:case 0x19f:case 0x1b0:OPbyte=0x0f;physmem8_ptr--;break;case 0x104:case 0x105:case 0x107:case 0x108:case 0x109:case 0x10a:case 0x10b:case 0x10c:case 0x10d:case 0x10e:case 0x10f:case 0x110:case 0x111:case 0x112:case 0x113:case 0x114:case 0x115:case 0x116:case 0x117:case 0x118:case 0x119:case 0x11a:case 0x11b:case 0x11c:case 0x11d:case 0x11e:case 0x11f:case 0x121:case 0x124:case 0x125:case 0x126:case 0x127:case 0x128:case 0x129:case 0x12a:case 0x12b:case 0x12c:case 0x12d:case 0x12e:case 0x12f:case 0x130:case 0x132:case 0x133:case 0x134:case 0x135:case 0x136:case 0x137:case 0x138:case 0x139:case 0x13a:case 0x13b:case 0x13c:case 0x13d:case 0x13e:case 0x13f:case 0x150:case 0x151:case 0x152:case 0x153:case 0x154:case 0x155:case 0x156:case 0x157:case 0x158:case 0x159:case 0x15a:case 0x15b:case 0x15c:case 0x15d:case 0x15e:case 0x15f:case 0x160:case 0x161:case 0x162:case 0x163:case 0x164:case 0x165:case 0x166:case 0x167:case 0x168:case 0x169:case 0x16a:case 0x16b:case 0x16c:case 0x16d:case 0x16e:case 0x16f:case 0x170:case 0x171:case 0x172:case 0x173:case 0x174:case 0x175:case 0x176:case 0x177:case 0x178:case 0x179:case 0x17a:case 0x17b:case 0x17c:case 0x17d:case 0x17e:case 0x17f:case 0x1a6:case 0x1a7:case 0x1aa:case 0x1ae:case 0x1b7:case 0x1b8:case 0x1b9:case 0x1bf:case 0x1c0:default:abort(6);}
break;}}}}while(--cycles_left);this.cycle_count+=(N_cycles-cycles_left);this.eip=(eip+physmem8_ptr-initial_mem_ptr);this.cc_src=_src;this.cc_dst=_dst;this.cc_op=_op;this.cc_op2=_op2;this.cc_dst2=_dst2;return exit_code;};CPU_X86.prototype.exec=function(N_cycles){var exit_code,final_cycle_count,interrupt;final_cycle_count=this.cycle_count+N_cycles;exit_code=256;interrupt=null;while(this.cycle_count<final_cycle_count){try{exit_code=this.exec_internal(final_cycle_count-this.cycle_count,interrupt);if(exit_code!=256)
break;interrupt=null;}catch(cpu_exception){if(cpu_exception.hasOwnProperty("intno")){interrupt=cpu_exception;}else{throw cpu_exception;}}}
return exit_code;};CPU_X86.prototype.load_binary=function(binary_array,mem8_loc){var len,i,typed_binary_array;len=binary_array.byteLength;typed_binary_array=new Uint8Array(binary_array,0,len);for(i=0;i<len;i++){this.st8_phys(mem8_loc+i,typed_binary_array[i]);}
return len;};