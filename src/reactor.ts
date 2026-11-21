import R from '@dimforge/rapier3d-compat/rapier.es.js';
export const DT=1/60;
export const cores=[
 {name:'Ion',color:'#50e8ef',mark:'I',angle:3},
 {name:'Solar',color:'#ffb53f',mark:'II',angle:0},
 {name:'Violet',color:'#bf81ff',mark:'III',angle:2},
 {name:'Ember',color:'#ff7959',mark:'IV',angle:1}
] as const;
export const angleOf=(slot:number)=>Math.PI/4+slot*Math.PI/2;
export const direction=(slot:number)=>({x:Math.sin(angleOf(slot)),z:Math.cos(angleOf(slot))});
export const socketAt=(i:number)=>{const d=direction(cores[i].angle);return {x:d.x*3.4,z:d.z*3.4}};
export type Power='push'|'magnet'|'rotate';
export type Command={power:Power|'recover',x?:number,z?:number,strength?:number};
export type Signal='push'|'magnet'|'rotate'|'connect'|'transform'|'awake'|'recover'|'near'|'blocked';
export const cooldown={push:.65,magnet:1.65,rotate:.78};
const yaw=(a:number)=>({x:0,y:Math.sin(a/2),z:0,w:Math.cos(a/2)});
const clamp=(v:number,l:number,h:number)=>Math.max(l,Math.min(h,v));
export class Reactor{
 world=new R.World({x:0,y:-11,z:0});
 rotor:R.RigidBody;lift:R.RigidBody;gate:R.RigidBody;ramp:R.RigidBody;gear:R.RigidBody;
 ball:R.RigidBody;ballShape:R.Collider;sensors:R.Collider[]=[];
 ticks=0;elapsed=0;started=false;connected=0;uses=0;rescues=0;slot=0;angle=angleOf(0);feed=0;field=0;fieldAt={x:0,z:0};events:Signal[]=[];ready={push:0,magnet:0,rotate:0};lastNear=-999;gateHeight=.36;rampAngle=0;
 constructor(){
 this.world.timestep=DT;
 const box=(x:number,y:number,z:number,w:number,h:number,d:number)=>this.world.createCollider(R.ColliderDesc.cuboid(w/2,h/2,d/2).setTranslation(x,y,z).setFriction(.2));
 box(0,-.13,0,7.4,.26,8.6);
 for(const side of [-1,1]){box(3.73*side,.27,0,.15,.55,8.72);box(0,.27,4.32*side,7.5,.55,.15)}
 const movable=(x:number,y:number,z:number)=>this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(x,y,z));
 this.rotor=movable(0,.07,0);this.rotor.setRotation(yaw(this.angle),true);
 this.world.createCollider(R.ColliderDesc.cylinder(.07,1.31).setFriction(.82),this.rotor);
 for(const side of [-1,1])this.world.createCollider(R.ColliderDesc.cuboid(.075,.20,1.05).setTranslation(.42*side,.20,0),this.rotor);
 this.lift=movable(0,.14,0);this.world.createCollider(R.ColliderDesc.cylinder(.06,.33),this.lift);
 const g=direction(2);this.gate=movable(g.x*2,.36,g.z*2);this.gate.setRotation(yaw(angleOf(2)),true);this.world.createCollider(R.ColliderDesc.cuboid(.78,.37,.11),this.gate);
 this.ramp=movable(2.36,.025,-1.25);this.world.createCollider(R.ColliderDesc.cuboid(.57,.065,.75),this.ramp);
 this.gear=movable(-2.88,.18,.05);this.world.createCollider(R.ColliderDesc.cylinder(.14,.38),this.gear);for(let i=0;i<3;i++)this.world.createCollider(R.ColliderDesc.cuboid(.51,.14,.105).setRotation(yaw(i*Math.PI/3)),this.gear);
 for(let i=0;i<4;i++){const s=socketAt(i);this.sensors.push(this.world.createCollider(R.ColliderDesc.cylinder(.44,.48).setTranslation(s.x,.27,s.z).setSensor(true)))}
 this.ball=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(0,.48,0).setCcdEnabled(true).setLinearDamping(1.05).setAngularDamping(2));
 this.ballShape=this.world.createCollider(R.ColliderDesc.ball(.25).setDensity(5).setFriction(.28).setRestitution(.25),this.ball);
 }
 get won(){return this.connected===4}
 get aligned(){return !this.won&&this.slot%4===cores[this.connected].angle&&Math.abs(this.angle-angleOf(this.slot))<.035}
 get phase(){return this.won?3:this.connected>=2?2:1}
 respawn(){this.ball.setTranslation({x:0,y:.62,z:0},true);this.ball.setLinvel({x:0,y:0,z:0},true);this.ball.setAngvel({x:0,y:0,z:0},true);this.field=0;this.feed=1}
 command(cmd:Command){
 if(this.won)return false;
 const p=cmd.power;if(p==='recover'){this.rescues++;this.respawn();this.events.push('recover');return true}
 if(this.ticks<this.ready[p]||this.feed>.12)return false;
 const s=socketAt(this.connected),x=clamp(cmd.x??s.x,-3.45,3.45),z=clamp(cmd.z??s.z,-4.02,4.02),strength=clamp(cmd.strength??1,.3,1);
 if(![x,z,strength].every(Number.isFinite))return false;
 this.started=true;this.ready[p]=this.ticks+Math.ceil(cooldown[p]/DT);this.uses++;this.events.push(p);
 if(p==='rotate'){this.slot++;return true}
 const b=this.ball.translation(),dx=x-b.x,dz=z-b.z,len=Math.hypot(dx,dz);
 if(p==='magnet'){this.field=.95;this.fieldAt={x,z};return true}
 if(len>.01){const speed=(2.8+3.7*strength)*this.ball.mass();this.ball.applyImpulse({x:dx/len*speed,y:.025,z:dz/len*speed},true)}return true
 }
 step(){
 if(this.won)return;
 this.ticks++;if(this.started)this.elapsed+=DT;
 this.feed=Math.max(0,this.feed-DT);this.angle+=clamp(angleOf(this.slot)-this.angle,-3.8*DT,3.8*DT);
 this.rotor.setNextKinematicRotation(yaw(this.angle));
 this.lift.setNextKinematicTranslation({x:0,y:.14+this.feed*.19,z:0});
 const dest=this.connected>=2?-.53:.36;this.gateHeight+=clamp(dest-this.gateHeight,-DT,DT);
 const g=direction(2);this.gate.setNextKinematicTranslation({x:g.x*2,y:this.gateHeight,z:g.z*2});
 this.rampAngle+=clamp((this.connected>=2?-.13:0)-this.rampAngle,-DT*.4,DT*.4);
 this.ramp.setNextKinematicRotation({x:Math.sin(this.rampAngle/2),y:0,z:0,w:Math.cos(this.rampAngle/2)});
 this.gear.setNextKinematicRotation(yaw(this.ticks*DT*.94));
 const b=this.ball.translation(),v=this.ball.linvel(),mass=this.ball.mass();
 if(b.x>1.72&&b.x<3.02&&b.z>-.58&&b.z<.94&&b.y<.43)this.ball.applyImpulse({x:0,y:0,z:-mass*DT*2.3},true);
 if(this.field>0){this.field-=DT;const dx=this.fieldAt.x-b.x,dz=this.fieldAt.z-b.z;
 if(Math.hypot(dx,dz)<2.45)this.ball.applyImpulse({x:mass*DT*(dx*17-v.x*6),y:0,z:mass*DT*(dz*17-v.z*6)},true)}
 this.world.step();
 const pos=this.ball.translation(),s=socketAt(this.connected);const d=Math.hypot(pos.x-s.x,pos.z-s.z);
 if(pos.y< -1||Math.abs(pos.x)>4.2||Math.abs(pos.z)>5){this.command({power:'recover'});return}
 if(this.world.intersectionPair(this.ballShape,this.sensors[this.connected])&&d<.46&&pos.y<.63&&this.aligned){
 this.connected++;this.events.push('connect');if(this.connected===2)this.events.push('transform');
 if(this.won){this.events.push('awake');this.ball.setEnabled(false)}else this.respawn();
 }else if(d<.9&&this.ticks-this.lastNear>180){this.events.push(this.aligned?'near':'blocked');this.lastNear=this.ticks}
 }
 result(){if(!this.won)return null;const score=Math.max(100,12000-Math.round(this.elapsed*15)-this.uses*45-this.rescues*250);return {score,grade:score>=9400?'S':score>=8000?'A':score>=5900?'B':'C',time:Math.round(this.elapsed),actions:this.uses,recoveries:this.rescues}}
 dispose(){this.world.free()}
}
