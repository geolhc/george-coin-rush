import R from '@dimforge/rapier3d-compat/rapier.es.js';
export type Kind='coin'|'gem'|'core';
export type Piece={id:number,kind:Kind,p:number[],q:number[]};
export const initPhysics=()=>R.init();
export const goals=['Collect 8 medals','Collect a crystal','Land a 3× chain','Collect a rush core','Reach 2,500 points'];
export class Machine {
  world=new R.World({x:0,y:-13,z:0});
  queue=new R.EventQueue(true);
  shelf:R.RigidBody;
  items=new Map<number,{body:R.RigidBody,kind:Kind}>();
  id=0; time=0; shelfZ=-3; score=0; chain=0; lastWin=-100; drops=0; medals=0; gems=0; cores=0; maxChain=0; stage=0; progress=0; lastDrop=-1;
  wins:{kind:Kind,x:number,value:number}[]=[]; hits=0;
  constructor(seed=true){
    this.world.timestep=1/60;
    const wall=(x:number,y:number,z:number,a:number,b:number,c:number)=>this.world.createCollider(R.ColliderDesc.cuboid(a,b,c).setTranslation(x,y,z).setFriction(.34));
    wall(0,-.2,-.25,3.6,.2,3.85);
    for(const x of [-3.68,3.68])wall(x,.6,-.15,.08,.8,3.95);
    wall(0,.7,-4,3.6,.8,.12);
    this.shelf=this.world.createRigidBody(R.RigidBodyDesc.kinematicPositionBased().setTranslation(0,.22,-3));
    this.world.createCollider(R.ColliderDesc.cuboid(3.59,.22,1.22).setFriction(.55),this.shelf);
    if(seed){
      for(let row=0;row<9;row++)for(let col=0;col<9;col++){
        const x=(col-4)*.76+(row%2-.5)*.24,z=3.52-row*.66;
        const kind=row===1&&col===6||row===3&&col===2?'gem':row===2&&col===4?'core':'coin';
        this.spawn(kind,x,z< -1.4?.62:.18,z);
      }
      for(let i=0;i<15;i++)this.spawn('coin',(i%5-2)*1.1,.64,2.98-Math.floor(i/5)*1.45);
    }
  }
  spawn(kind:Kind,x:number,y:number,z:number){
    if(this.items.size>=150)return;
    const b=this.world.createRigidBody(R.RigidBodyDesc.dynamic().setTranslation(x,y,z).setCcdEnabled(true).setAngularDamping(.55).setLinearDamping(.1));
    const shape=kind==='gem'?R.ColliderDesc.convexHull(new Float32Array([0,.48,0,0,-.32,0,.38,0,0,-.38,0,0,0,0,.38,0,0,-.38]))!:R.ColliderDesc.cylinder(kind==='core'?.14:.079,kind==='core'?.42:.365);
    this.world.createCollider(shape.setFriction(.38).setRestitution(.03).setActiveEvents(R.ActiveEvents.COLLISION_EVENTS),b);
    this.items.set(++this.id,{body:b,kind});return b;
  }
  drop(x:number){
    if(!Number.isFinite(x)||this.time-this.lastDrop<.22)return false;
    // An arcade feeder recirculates a rear medal when the tray reaches capacity.
    // Keep crystals, cores and everything near the collection lip on the bed.
    if(this.items.size>=150){
      let rearId=-1,rearZ=Infinity;
      for(const [id,item] of this.items){
        const z=item.body.translation().z;
        if(item.kind==='coin'&&z<rearZ){rearId=id;rearZ=z}
      }
      const rear=this.items.get(rearId);if(!rear)return false;
      this.world.removeRigidBody(rear.body);this.items.delete(rearId);
    }
    const kind=(this.drops+1)%13===0?'core':(this.drops+1)%7===0?'gem':'coin';
    const b=this.spawn(kind,Math.max(-3.12,Math.min(3.12,x)),1.9,this.shelfZ+1.34)!;
    b.setLinvel({x:0,y:-1,z:1.25},true); b.setAngvel({x:1.3,y:.3,z:.2},true);
    this.drops++;this.lastDrop=this.time;return true;
  }
  award(kind:Kind,x:number){
    this.chain=this.time-this.lastWin<1.5?Math.min(9,this.chain+1):1;
    this.maxChain=Math.max(this.maxChain,this.chain);this.lastWin=this.time;
    const value=({coin:100,gem:400,core:600}[kind])*this.chain;this.score+=value;
    if(kind==='coin')this.medals++;if(kind==='gem')this.gems++;if(kind==='core')this.cores++;
    this.wins.push({kind,x,value});
    const advance=[kind==='coin'?1:0,kind==='gem'?1:0,this.chain>=3?1:0,kind==='core'?1:0,value];
    this.progress+=advance[this.stage]??0;
    if(this.progress>=([8,1,1,1,2500][this.stage]??Infinity)){this.stage++;this.progress=0;}
    if(kind==='core')for(let i=0;i<7;i++)this.spawn('coin',(i-3)*.88,2+i*.16,-.7);
  }
  step(){
    this.time+=1/60; this.shelfZ=-2.96-.69*Math.cos(this.time*2);
    this.shelf.setNextKinematicTranslation({x:0,y:.22,z:this.shelfZ});
    this.world.step(this.queue);
    this.queue.drainCollisionEvents((_a,_b,started)=>{if(started)this.hits++});
    for(const [id,{kind,body}] of this.items){
      const p=body.translation();
      if(p.y>-.58)continue;
      if(p.z>3.6&&Math.abs(p.x)<3.65&&this.drops)this.award(kind,p.x);
      this.world.removeRigidBody(body);this.items.delete(id);
    }
    if(this.time-this.lastWin>1.5)this.chain=0;
  }
  snapshot(){
    const pieces:Piece[]=[];
    for(const [id,{body,kind}] of this.items){const p=body.translation(),q=body.rotation();pieces.push({id,kind,p:[p.x,p.y,p.z],q:[q.x,q.y,q.z,q.w]})}
    return {pieces,shelfZ:this.shelfZ,score:this.score,stage:this.stage,progress:this.progress,chain:this.chain,maxChain:this.maxChain,gems:this.gems,cores:this.cores,medals:this.medals,drops:this.drops};
  }
  dispose(){this.queue.free();this.world.free()}
}
export type Frame=ReturnType<Machine['snapshot']>;
