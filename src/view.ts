import * as T from 'three';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {medal,marquee,strip} from './art';
import {type Frame,type Kind} from './machine';
export function cabinet(host:HTMLElement){
 const scene=new T.Scene(),cam=new T.PerspectiveCamera(37,1,.1,80);
 const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});host.prepend(renderer.domElement);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const env=new T.PMREMGenerator(renderer);const room=new RoomEnvironment();scene.environment=env.fromScene(room,.03).texture;room.dispose();env.dispose();
 const metal=(color:number,m=.7,r=.3)=>new T.MeshStandardMaterial({color,metalness:m,roughness:r});
 const ink=metal(0x17243c),blue=metal(0x25366c),steel=metal(0x8192ac),deck=metal(0x3c5465,.65,.42),gold=metal(0xf1b536);
 const lamp=(color:number)=>new T.MeshBasicMaterial({color});const ice=lamp(0x77ffff),purple=lamp(0xb77aff),amber=lamp(0xffcf66);
 function box(x:number,y:number,z:number,w:number,h:number,d:number,mat:T.Material,parent:T.Object3D=scene){
 const o=new T.Mesh(new T.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o}
 function label(x:number,y:number,z:number,w:number,h:number,map:T.Texture,parent:T.Object3D=scene){
 const o=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map}));o.position.set(x,y,z);parent.add(o);return o}
 box(0,-.65,0,7.95,1.18,8.9,blue);box(0,-.1,-.22,7.22,.2,7.65,deck);
 box(0,-.46,3.99,7.23,.14,.74,ink);box(0,-.53,4.49,7.9,.34,.14,ink);label(0,-.53,4.57,7.5,.29,strip('▼   COLLECTION   ▼'));
 box(0,1.44,-4.14,7.94,3.34,.44,blue);box(0,1.56,-3.87,7.44,2.88,.12,ink);label(0,1.58,-3.79,7.19,2.63,marquee());
 box(0,3.14,-4.08,7.96,.18,.56,steel);box(0,3.24,-4.05,7.66,.035,.42,ice);
 for(const side of [-1,1]){
  const x=side*3.81;box(x,.1,.16,.45,.87,8.65,ink);box(x,.56,.15,.5,.13,8.67,blue);
  box(x,.637,.14,.075,.02,8.5,ice);box(x+side*.24,.14,.14,.028,.09,8.4,purple);
  box(x,1.49,-3.97,.38,3.38,.42,blue);box(x,1.53,-3.73,.09,2.97,.055,purple);
  for(let i=0;i<9;i++)box(x-side*.115,.642,i*.9-3.55,.07,.025,.42,i%3===0?amber:steel);
 }
 const shelf=new T.Group();scene.add(shelf);box(0,.22,0,7.16,.44,2.44,steel,shelf);box(0,.446,0,7.12,.012,2.39,blue,shelf);label(0,.22,1.227,7.05,.34,strip('G C R   //   PUSH DRIVE'),shelf);
 for(let i=0;i<9;i++)box((i-4)*.75,.46,0,.035,.015,2.04,steel,shelf);
 const guide=new T.Group();scene.add(guide);box(0,1.78,-2.7,.85,.23,.49,steel,guide);box(0,1.78,-2.43,.58,.09,.04,ice,guide);
 const beam=box(0,.98,-2.48,.045,1.4,.045,new T.MeshBasicMaterial({color:0x6bfff6,transparent:true,opacity:.4}),guide);beam.renderOrder=2;
 const face=metal(0xffde80,.66,.28);face.map=medal();
 const coinGeom=new T.CylinderGeometry(.365,.365,.158,32);
 const sets={} as Record<Kind,T.InstancedMesh>;
 for(const k of ['coin','gem','core'] as Kind[]){
  const geom=k==='coin'?coinGeom:k==='gem'?new T.OctahedronGeometry(.43):new T.CylinderGeometry(.42,.42,.28,8);
  const mat=k==='coin'?[gold,face,face]:k==='gem'?new T.MeshPhysicalMaterial({color:0x43e6ff,metalness:.33,roughness:.12,flatShading:true,emissive:0x09526c,clearcoat:1}):[metal(0xb730fa),lamp(0xef91ff),purple];
  const inst=new T.InstancedMesh(geom,mat,150);inst.count=0;inst.castShadow=true;inst.receiveShadow=true;inst.frustumCulled=false;scene.add(inst);sets[k]=inst;
 }
 const hemi=new T.HemisphereLight(0xfff1d9,0x414578,1.5);scene.add(hemi);const light=new T.DirectionalLight(0xffeac5,2.6);light.position.set(-3,7,4);light.castShadow=true;light.shadow.mapSize.set(512,512);Object.assign(light.shadow.camera,{left:-6,right:6,top:6,bottom:-6,near:.1,far:22});light.shadow.normalBias=.015;light.shadow.bias=-.0003;scene.add(light);
 const dummy=new T.Object3D();let ratio=Math.min(devicePixelRatio,1.65);
 const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setPixelRatio(ratio);renderer.setSize(w,h);cam.aspect=w/h;
 cam.position.set(0,9,12.8);cam.lookAt(0,.58,-.16);cam.updateMatrixWorld();
 const extent=new T.Vector3();let factor=0;cam.zoom=1;cam.updateProjectionMatrix();
 for(const x of [-4.1,4.1])for(const [y,z] of [[3.35,-4.35],[-1.35,4.65],[.64,4.5]]){extent.set(x,y,z).project(cam);factor=Math.max(factor,Math.abs(extent.x),Math.abs(extent.y))}
 cam.zoom=.975/factor;cam.updateProjectionMatrix();
 if(w<620){
  // A portrait cabinet uses a taller faceplate, while maintaining the full width of the tray.
  const top=new T.Vector3(0,3.35,-4.35).project(cam).y,bottom=new T.Vector3(0,-1.35,4.65).project(cam).y;
  const stretch=Math.min(1.38,1.92/(top-bottom));cam.projectionMatrix.elements[5]*=stretch;
  cam.projectionMatrix.elements[9]+=(top+bottom)*stretch/2;
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
 }};
 new ResizeObserver(resize).observe(host);resize();
 const ray=new T.Raycaster(),plane=new T.Plane(new T.Vector3(0,1,0),0);
 return {aim(x:number){guide.position.x=x},lane(px:number,py:number){const r=host.getBoundingClientRect();ray.setFromCamera(new T.Vector2((px-r.left)/r.width*2-1,1-(py-r.top)/r.height*2),cam);const p=new T.Vector3();ray.ray.intersectPlane(plane,p);return Math.max(-3.12,Math.min(3.12,p.x))},
 lowerQuality(){if(ratio>.85){ratio=Math.max(.85,ratio-.25);if(ratio<=1)renderer.shadowMap.enabled=false;resize()}},
 draw(frame:Frame){shelf.position.z=frame.shelfZ;guide.position.z=frame.shelfZ+3.85;
 for(const k of Object.values(sets))k.count=0;
 for(const p of frame.pieces){dummy.position.fromArray(p.p);dummy.quaternion.fromArray(p.q);dummy.updateMatrix();const mesh=sets[p.kind];mesh.setMatrixAt(mesh.count++,dummy.matrix)}
 for(const k of Object.values(sets))k.instanceMatrix.needsUpdate=true;renderer.render(scene,cam)}};
}
