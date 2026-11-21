import * as T from 'three';
// Small depth-buffered orthographic renderer for the same opaque Three.js meshes.
// Flat shading and shared geometry keep the no-WebGL path usable on low-end GPUs.
export class CpuRenderer{
 domElement=document.createElement('canvas');ctx=this.domElement.getContext('2d',{alpha:true})!;
 image!:ImageData;depth!:Float32Array;width=0;height=0;quality=1;
 projection=new T.Matrix4();matrix=new T.Matrix4();vertex=new T.Vector3();
 light=new T.Vector3(-.38,.84,.48).normalize();normal=new T.Vector3();normalMatrix=new T.Matrix3();
 buffers=new Map<T.BufferGeometry,Float32Array>();
 setSize(w:number,h:number){const scale=Math.min(1,700/w,670/h)*this.quality;this.width=this.domElement.width=Math.max(1,Math.floor(w*scale));this.height=this.domElement.height=Math.max(1,Math.floor(h*scale));this.image=this.ctx.createImageData(this.width,this.height);this.depth=new Float32Array(this.width*this.height)}
 render(scene:T.Scene,cam:T.Camera){
 scene.updateMatrixWorld();cam.updateMatrixWorld();this.projection.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse);this.depth.fill(Infinity);const pixels=new Uint32Array(this.image.data.buffer);pixels.fill(0);
 scene.traverseVisible(node=>{if(!(node instanceof T.Mesh))return;
 const g=node.geometry as T.BufferGeometry,pos=g.getAttribute('position'),norm=g.getAttribute('normal'),index=g.index,mat=node.material as T.MeshStandardMaterial;
 let pts=this.buffers.get(g);if(!pts){pts=new Float32Array(pos.count*3);this.buffers.set(g,pts)}
 this.matrix.multiplyMatrices(this.projection,node.matrixWorld);this.normalMatrix.getNormalMatrix(node.matrixWorld);
 for(let i=0;i<pos.count;i++){const v=this.vertex.fromBufferAttribute(pos,i).applyMatrix4(this.matrix);pts[3*i]=(v.x*.5+.5)*this.width;pts[3*i+1]=(.5-v.y*.5)*this.height;pts[3*i+2]=v.z}
 const base=mat.color.getHex(T.SRGBColorSpace),count=index?.count??pos.count;
 for(let k=0;k<count;k+=3){const ia=index?index.getX(k):k,ib=index?index.getX(k+1):k+1,ic=index?index.getX(k+2):k+2;
 const a=3*ia,b=3*ib,c=3*ic,x=pts[a],y=pts[a+1],bx=pts[b]-x,by=pts[b+1]-y,cx=pts[c]-x,cy=pts[c+1]-y,area=bx*cy-by*cx;if(area>=-.018)continue;
 const xmin=Math.max(0,Math.floor(x+Math.min(0,bx,cx))),xmax=Math.min(this.width-1,Math.ceil(x+Math.max(0,bx,cx))),ymin=Math.max(0,Math.floor(y+Math.min(0,by,cy))),ymax=Math.min(this.height-1,Math.ceil(y+Math.max(0,by,cy)));
 const light=.55+.54*Math.max(0,this.normal.fromBufferAttribute(norm,ia).applyNormalMatrix(this.normalMatrix).dot(this.light))+mat.emissiveIntensity*.28;
 const channel=(shift:number)=>Math.min(255,Math.round(((base>>shift)&255)*light));
 const rgba=(255<<24)|(channel(0)<<16)|(channel(8)<<8)|channel(16);
 const uStep=cy/area,vStep=-by/area,z0=pts[a+2],zb=pts[b+2]-z0,zc=pts[c+2]-z0;
 for(let row=ymin;row<=ymax;row++){const dy=row+.5-y,dx=xmin+.5-x;let u=(dx*cy-dy*cx)/area,v=(bx*dy-by*dx)/area;let off=row*this.width+xmin;
 for(let col=xmin;col<=xmax;col++,off++,u+=uStep,v+=vStep){if(u<0||v<0||u+v>1)continue;const z=z0+u*zb+v*zc;if(z>=this.depth[off])continue;this.depth[off]=z;pixels[off]=rgba}}
 }
 });this.ctx.putImageData(this.image,0,0)
 }
 dispose(){this.buffers.clear()}
}
