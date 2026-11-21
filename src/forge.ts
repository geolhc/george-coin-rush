import * as T from 'three';
import {CpuRenderer} from './cpu';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {Reactor,cores,socketAt,angleOf} from './reactor';
type Paint=T.MeshStandardMaterial;
export function forge(host:HTMLElement){
 const scene=new T.Scene(),cam=new T.OrthographicCamera(-5,5,6,-6,.1,80);
 let gl:T.WebGLRenderer|undefined,cpu:CpuRenderer|undefined,reflection:T.WebGLRenderTarget|undefined;
 try{gl=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});const room=new RoomEnvironment(),pm=new T.PMREMGenerator(gl);reflection=pm.fromScene(room,.05);scene.environment=reflection.texture;room.dispose();pm.dispose()}catch{cpu=new CpuRenderer()}
 const renderer=gl??cpu!;host.prepend(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const mat=(c:string,m=.52,e=0)=>new T.MeshStandardMaterial({color:c,metalness:m,roughness:.36,emissive:c,emissiveIntensity:e,flatShading:true});
 const voidMetal=mat('#121b29'),gun=mat('#39455a'),steel=mat('#a8b6c5'),ivory=mat('#e7e4d1'),yellow=mat('#f6ac36'),orange=mat('#e86735'),cyan=mat('#4bfbec',.2,.55),purple=mat('#ae7dff',.2,.43),dark=mat('#141c25');
 const boxG=new T.BoxGeometry(),tubeG=new T.CylinderGeometry(1,1,1,16),ballG=new T.IcosahedronGeometry(1,1),parts=new Set<T.BufferGeometry>(),paints=new Set<T.Material>();
 function mesh(geom:T.BufferGeometry,paint:T.Material,parent:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number){
 const o=new T.Mesh(geom,paint);o.position.set(x,y,z);o.scale.set(w,h,d);parent.add(o);parts.add(geom);paints.add(paint);return o}
 const box=(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:Paint)=>mesh(boxG,m,p,x,y,z,w,h,d);
 const cyl=(p:T.Object3D,x:number,y:number,z:number,r:number,h:number,m:Paint)=>mesh(tubeG,m,p,x,y,z,r,h,r);
 function group(p:T.Object3D,x=0,y=0,z=0){const g=new T.Group();p.add(g);g.position.set(x,y,z);return g}
 function armour(p:T.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,m:Paint,cut=.17){
 const s=new T.Shape();const pts=[[-.5+cut,-.5],[.5-cut,-.5],[.5,-.5+cut],[.5,.5-cut],[.5-cut,.5],[-.5+cut,.5],[-.5,.5-cut],[-.5,-.5+cut]];
 pts.forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();const geom=new T.ExtrudeGeometry(s,{depth:1,bevelEnabled:false});geom.translate(0,0,-.5);return mesh(geom,m,p,x,y,z,w,h,d)}
 function pipe(p:T.Object3D,a:T.Vector3,b:T.Vector3,r:number,m:Paint){const v=b.clone().sub(a),mid=a.clone().lerp(b,.5);const o=cyl(p,mid.x,mid.y,mid.z,r,v.length(),m);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return o}
 const V=(x:number,y:number,z:number)=>new T.Vector3(x,y,z);
 const arena=group(scene);box(arena,0,-.28,0,7.77,.55,8.9,voidMetal).renderOrder=-12;
 box(arena,0,-.065,0,7.4,.13,8.6,gun).renderOrder=-11;
 for(let i=-3;i<=3;i++){box(arena,i,.009,0,.012,.008,8.51,steel).renderOrder=-10;box(arena,0,.009,i,7.3,.008,.012,steel).renderOrder=-10}
 for(const side of [-1,1]){
 box(arena,side*3.73,.19,0,.2,.45,8.7,steel);box(arena,side*3.8,.12,0,.13,.42,8.87,voidMetal);
 for(let j=0;j<8;j++)box(arena,side*3.74,.435,j-3.5,.10,.035,.57,j%3===0?yellow:cyan);
 box(arena,0,.20,side*4.32,7.58,.44,.15,steel);box(arena,0,.445,side*4.32,7.1,.02,.08,side>0?yellow:cyan);
 }
 const docked:T.Mesh[]=[],rings:T.Mesh[]=[],lamps=cores.map(c=>mat(c.color,.23,.29));
 for(let i=0;i<4;i++){
 const s=socketAt(i),d=group(arena,s.x,0,s.z);d.rotation.y=angleOf(cores[i].angle);
 cyl(d,0,.026,0,.72,.045,dark).renderOrder=-8;cyl(d,0,.062,0,.60,.035,steel).renderOrder=-7;cyl(d,0,.09,0,.50,.035,dark).renderOrder=-6;
 const ring=mesh(new T.TorusGeometry(.51,.067,5,24),lamps[i],d,0,.12,0,1,1,1);ring.rotation.x=-Math.PI/2;rings.push(ring);
 docked.push(mesh(ballG,lamps[i],d,0,.27,0,.25,.25,.25));
 for(let n=0;n<=i;n++)box(d,(n-i/2)*.12,.125,0,.055,.013,.28,lamps[i]);
 for(let j=0;j<3;j++)box(d,0,.022,-.88-j*.3,.19,.012,.105,lamps[i]);
 }
 const rotor=group(arena);cyl(rotor,0,.07,0,1.31,.14,dark).renderOrder=-8;cyl(rotor,0,.145,0,1.22,.025,steel).renderOrder=-7;cyl(rotor,0,.164,0,1.08,.018,gun).renderOrder=-6;
 for(let i=0;i<12;i++){const v=group(rotor);v.rotation.y=i*Math.PI/6;box(v,0,.17,1.17,.11,.03,.15,i%3?dark:yellow)}
 for(const side of [-1,1]){box(rotor,side*.42,.28,0,.15,.40,2.1,yellow);box(rotor,side*.42,.49,0,.07,.015,1.88,ivory)}
 const pointer=mesh(new T.ConeGeometry(.17,.34,3),cyan,rotor,0,.177,.84,1,1,.25);pointer.rotation.x=Math.PI/2;
 const lift=cyl(arena,0,.14,0,.33,.12,steel);
 const gate=group(arena,-Math.SQRT2,0,-Math.SQRT2);gate.rotation.y=angleOf(2);box(gate,0,0,0,1.56,.74,.22,orange);
 for(let i=-2;i<=2;i++)box(gate,i*.28,0,.117,.13,.59,.03,dark).rotation.z=-.33;
 const ramp=group(arena,2.36,.025,-1.25);box(ramp,0,0,0,1.14,.13,1.5,steel);
 for(let i=-2;i<=2;i++)box(ramp,0,.07,i*.24,.97,.015,.062,dark);
 const conveyor=group(arena,2.36,.018,.18);box(conveyor,0,0,0,1.30,.035,1.52,dark);const slats:T.Mesh[]=[];
 for(let i=0;i<6;i++)slats.push(box(conveyor,0,.023,0,1.08,.02,.08,steel));
 for(const side of [-1,1]){
 for(let i=0;i<5;i++)box(arena,side*3.36,.035,-1.02+i*.34,.37,.022,.07,dark).rotation.y=side*.45;
 for(const z of [-3.94,3.94]){cyl(arena,side*3.32,.04,z,.115,.055,steel);box(arena,side*3.32,.078,z,.13,.015,.028,dark)}
 }
 const gear=group(arena,-2.88,.18,.05);cyl(gear,0,0,0,.38,.28,steel);for(let i=0;i<3;i++)box(gear,0,0,0,1.02,.27,.21,steel).rotation.y=i*Math.PI/3;cyl(gear,0,.16,0,.16,.05,yellow);
 // An industrial guardian with a segmented breastplate, hydraulic shoulders and split crown.
 const mech=group(scene,0,0,-4.68),chest=group(mech,0,1.50,0),head=group(mech,0,3.22,.12),arms:T.Group[]=[];
 armour(chest,0,0,0,2.05,1.92,.91,gun);armour(chest,0,.29,.51,2.34,1.05,.32,ivory);
 armour(chest,0,-.33,.63,1.55,.60,.21,voidMetal);for(let j=0;j<3;j++)box(chest,0,-.55+j*.17,.79,1.04,.06,.11,steel);
 const heart=mesh(new T.OctahedronGeometry(.42),cyan,chest,0,.37,.86,1,1,.52);
 for(const side of [-1,1]){
 const a=group(mech,side*1.43,2.0,-.03);arms.push(a);armour(a,0,.12,0,1.2,.91,1.03,yellow);
 armour(a,side*.1,.27,.56,.89,.38,.12,ivory);box(a,0,-.51,0,.64,.80,.59,voidMetal);
 armour(a,side*.10,-1,.12,.8,.81,.78,steel);armour(a,side*.12,-1.58,.19,.66,.43,.61,voidMetal);
 pipe(chest,V(side*.55,-.48,.6),V(side*1.09,.12,.61),.074,yellow);
 armour(head,side*.67,.13,0,.31,.76,.67,steel);
 const horn=armour(head,side*.48,.70,.13,.17,.92,.21,yellow);horn.rotation.z=-side*.56;
 }
 armour(head,0,.10,0,1.38,1.0,.92,ivory);armour(head,0,.05,.49,1.22,.52,.13,voidMetal);
 const eyes=[-1,1].map(side=>{const o=box(head,side*.32,.11,.575,.42,.12,.05,cyan);o.rotation.z=side*.13;return o});
 armour(head,0,-.29,.50,.5,.39,.23,gun);armour(head,0,.48,.42,.29,.34,.26,yellow);
 const orb=mesh(ballG,lamps[0],arena,0,0,0,.255,.255,.255);
 const field=mesh(new T.TorusGeometry(2.45,.018,4,48),purple,arena,0,.07,0,1,1,1);field.rotation.x=-Math.PI/2;
 const aimRing=mesh(new T.TorusGeometry(.25,.025,4,24),cyan,arena,0,.11,0,1,1,1);aimRing.rotation.x=-Math.PI/2;
 const sights=Array.from({length:5},()=>mesh(ballG,cyan,arena,0,0,0,.037,.022,.037));
 const trail=Array.from({length:10},()=>mesh(ballG,cyan,arena,0,-5,0,.055,.055,.055));
 const sparks=Array.from({length:14},()=>mesh(ballG,yellow,arena,0,-5,0,.045,.045,.045));
 let pulse=0,origin=V(0,0,0),trailTick=0,ending=0;
 scene.add(new T.HemisphereLight(0xf6f8ff,0x617489,1.4));const key=new T.DirectionalLight(0xfff1cf,2.2);key.position.set(-5,9,6);scene.add(key);
 
 const rim=new T.DirectionalLight(0x65bdff,1.5);rim.position.set(4,5,-4);scene.add(rim);
 const camBase=V(0,13,10.7),focus=V(0,.95,-.95);cam.position.copy(camBase);cam.lookAt(focus);
 let ratio=Math.min(devicePixelRatio,1.65),lastCpu=-1,dead=false;
 function fit(){const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const aspect=w/h,vertical=Math.max(6.05,4.12/aspect);cam.left=-vertical*aspect;cam.right=vertical*aspect;cam.top=vertical;cam.bottom=-vertical;cam.updateProjectionMatrix();gl?.setPixelRatio(ratio);renderer.setSize(w,h)}
 const observer=new ResizeObserver(fit);observer.observe(host);fit();const ray=new T.Raycaster(),plane=new T.Plane(V(0,1,0),-.12);
 return {hit(x:number,y:number){const r=host.getBoundingClientRect();ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,1-(y-r.top)/r.height*2),cam);return ray.ray.intersectPlane(plane,new T.Vector3())??V(0,0,0)},
 burst(x:number,z:number){origin.set(x,.25,z);pulse=1},lower(){if(cpu&&cpu.quality>.7){cpu.quality-=.1;fit()}if(ratio>1){ratio=Math.max(1,ratio-.2);fit()}},
 draw(r:Reactor,aim:{x:number,z:number},reduced:boolean,dt:number){
 if(dead)return;const t=r.ticks/60;rotor.rotation.y=r.angle;gear.rotation.y=t*.94;gate.position.y=r.gateHeight;ramp.rotation.x=r.rampAngle;lift.position.y=r.lift.translation().y;
 slats.forEach((o,i)=>o.position.z=.7-((i*.24+t*.7)%1.44));
 orb.visible=!r.won;const b=r.ball.translation();orb.position.set(b.x,b.y,b.z);orb.quaternion.copy(r.ball.rotation());orb.material=lamps[Math.min(3,r.connected)];
 sights.forEach((o,i)=>{const f=(i+1)/6;o.visible=!r.won;o.position.set(b.x+(aim.x-b.x)*f,.18,b.z+(aim.z-b.z)*f)});
 aimRing.position.set(aim.x,.13,aim.z);aimRing.visible=!r.won;
 field.visible=r.field>0;field.position.set(r.fieldAt.x,.15,r.fieldAt.z);field.scale.setScalar(reduced?1:.94+.06*Math.sin(t*13));
 docked.forEach((o,i)=>o.visible=i<r.connected);rings.forEach((o,i)=>o.scale.setScalar(!reduced&&i===r.connected?1+.06*Math.sin(t*5):1));lamps.forEach((m,i)=>m.emissiveIntensity=i<r.connected?.78:.27);
 pulse=Math.max(0,pulse-dt*1.7);sparks.forEach((s,i)=>{s.visible=pulse>0&&!reduced;if(s.visible){const a=i*2.4,u=1-pulse;s.position.set(origin.x+Math.cos(a)*u*1.15,.25+Math.sin(u*Math.PI)*.68,origin.z+Math.sin(a)*u*1.15)}});
 if(!reduced&&r.ticks!==trailTick&&r.ticks%3===0){trailTick=r.ticks;for(let i=trail.length-1;i>0;i--)trail[i].position.copy(trail[i-1].position);trail[0].position.copy(orb.position)}
 trail.forEach((p,i)=>{p.visible=!reduced&&!r.won&&Math.hypot(r.ball.linvel().x,r.ball.linvel().z)>1;p.scale.setScalar(.065-i*.004)});
 ending=r.won?Math.min(1,ending+dt*.52):0;const e=reduced?Number(r.won):ending;
 head.position.y=3.22+e*.32;head.rotation.y=reduced?0:Math.sin(e*Math.PI)*.36;arms.forEach((a,i)=>a.rotation.z=(i?1:-1)*e*.65);eyes.forEach(o=>o.scale.x=r.won?.42:.19);
 heart.rotation.y=t*.7+ending*4;heart.scale.setScalar(.77+(r.connected*.10));cam.zoom=1+(!reduced?Math.sin(ending*Math.PI)*.12:0);cam.position.x=reduced?0:Math.sin(t*62)*pulse*.032;cam.updateProjectionMatrix();
 if(cpu&&performance.now()-lastCpu<32)return;lastCpu=performance.now();renderer.render(scene,cam)
 },dispose(){dead=true;observer.disconnect();parts.forEach(g=>g.dispose());paints.forEach(m=>m.dispose());reflection?.dispose();gl?.dispose();cpu?.dispose();renderer.domElement.remove()}}
}
