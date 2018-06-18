function PIC(PC,port_num){PC.register_ioport_write(port_num,2,1,this.ioport_write.bind(this));PC.register_ioport_read(port_num,2,1,this.ioport_read.bind(this));this.reset();}
PIC.prototype.reset=function(){this.last_irr=0;this.irr=0;this.imr=0;this.isr=0;this.priority_add=0;this.irq_base=0;this.read_reg_select=0;this.special_mask=0;this.init_state=0;this.auto_eoi=0;this.rotate_on_autoeoi=0;this.init4=0;this.elcr=0;this.elcr_mask=0;};PIC.prototype.set_irq1=function(irq,Qf){var ir_register;ir_register=1<<irq;if(Qf){if((this.last_irr&ir_register)==0)
this.irr|=ir_register;this.last_irr|=ir_register;}else{this.last_irr&=~ir_register;}};PIC.prototype.get_priority=function(ir_register){var priority;if(ir_register==0)
return-1;priority=7;while((ir_register&(1<<((priority+this.priority_add)&7)))==0)
priority--;return priority;};PIC.prototype.get_irq=function(){var ir_register,in_service_priority,priority;ir_register=this.irr&~this.imr;priority=this.get_priority(ir_register);if(priority<0)
return-1;in_service_priority=this.get_priority(this.isr);if(priority>in_service_priority){return priority;}else{return-1;}};PIC.prototype.intack=function(irq){if(this.auto_eoi){if(this.rotate_on_auto_eoi)
this.priority_add=(irq+1)&7;}else{this.isr|=(1<<irq);}
if(!(this.elcr&(1<<irq)))
this.irr&=~(1<<irq);};PIC.prototype.ioport_write=function(mem8_loc,x){var priority;mem8_loc&=1;if(mem8_loc==0){if(x&0x10){this.reset();this.init_state=1;this.init4=x&1;if(x&0x02)
throw"single mode not supported";if(x&0x08)
throw"level sensitive irq not supported";}else if(x&0x08){if(x&0x02)
this.read_reg_select=x&1;if(x&0x40)
this.special_mask=(x>>5)&1;}else{switch(x){case 0x00:case 0x80:this.rotate_on_autoeoi=x>>7;break;case 0x20:case 0xa0:priority=this.get_priority(this.isr);if(priority>=0){this.isr&=~(1<<((priority+this.priority_add)&7));}
if(x==0xa0)
this.priority_add=(this.priority_add+1)&7;break;case 0x60:case 0x61:case 0x62:case 0x63:case 0x64:case 0x65:case 0x66:case 0x67:priority=x&7;this.isr&=~(1<<priority);break;case 0xc0:case 0xc1:case 0xc2:case 0xc3:case 0xc4:case 0xc5:case 0xc6:case 0xc7:this.priority_add=(x+1)&7;break;case 0xe0:case 0xe1:case 0xe2:case 0xe3:case 0xe4:case 0xe5:case 0xe6:case 0xe7:priority=x&7;this.isr&=~(1<<priority);this.priority_add=(priority+1)&7;break;}}}else{switch(this.init_state){case 0:this.imr=x;this.update_irq();break;case 1:this.irq_base=x&0xf8;this.init_state=2;break;case 2:if(this.init4){this.init_state=3;}else{this.init_state=0;}
break;case 3:this.auto_eoi=(x>>1)&1;this.init_state=0;break;}}};PIC.prototype.ioport_read=function(Ug){var mem8_loc,return_register;mem8_loc=Ug&1;if(mem8_loc==0){if(this.read_reg_select)
return_register=this.isr;else
return_register=this.irr;}else{return_register=this.imr;}
return return_register;};function PIC_Controller(PC,master_PIC_port,slave_PIC_port,cpu_set_irq_callback){this.pics=new Array();this.pics[0]=new PIC(PC,master_PIC_port);this.pics[1]=new PIC(PC,slave_PIC_port);this.pics[0].elcr_mask=0xf8;this.pics[1].elcr_mask=0xde;this.irq_requested=0;this.cpu_set_irq=cpu_set_irq_callback;this.pics[0].update_irq=this.update_irq.bind(this);this.pics[1].update_irq=this.update_irq.bind(this);}
PIC_Controller.prototype.update_irq=function(){var slave_irq,irq;slave_irq=this.pics[1].get_irq();if(slave_irq>=0){this.pics[0].set_irq1(2,1);this.pics[0].set_irq1(2,0);}
irq=this.pics[0].get_irq();if(irq>=0){this.cpu_set_irq(1);}else{this.cpu_set_irq(0);}};PIC_Controller.prototype.set_irq=function(irq,Qf){this.pics[irq>>3].set_irq1(irq&7,Qf);this.update_irq();};PIC_Controller.prototype.get_hard_intno=function(){var irq,slave_irq,intno;irq=this.pics[0].get_irq();if(irq>=0){this.pics[0].intack(irq);if(irq==2){slave_irq=this.pics[1].get_irq();if(slave_irq>=0){this.pics[1].intack(slave_irq);}else{slave_irq=7;}
intno=this.pics[1].irq_base+slave_irq;irq=slave_irq+8;}else{intno=this.pics[0].irq_base+irq;}}else{irq=7;intno=this.pics[0].irq_base+irq;}
this.update_irq();return intno;};
