import {marquee,medal,strip} from './art';
import {type Frame} from './machine';
import {Quaternion,Vector3} from 'three';
// CPU projection for browsers without a GPU context. All piece transforms come from Rapier.
export function softwareCabinet(host:HTMLElement){
 const canvas=document.createElement('canvas');host.prepend(canvas);const c=canvas.getContext('2d')!;
 const banner=marquee().image,face=medal().image,trim=strip('▼   COLLECTION   ▼').image,ramLabel=strip('G C R   //   PUSH DRIVE').image;
 let w=0,h=0,aim=0,scale=1,sy=1;
 const resize=()=>{w=host.clientWidth;h=host.clientHeight;const d=Math.min(devicePixelRatio,1.5);canvas.width=w*d;canvas.height=h*d;canvas.style.width=w+'px';canvas.style.height=h+'px';c.setTransform(d,0,0,d,0,0);scale=Math.min((w-14)/10,(h-12)/8.3);sy=Math.min((h-12)/10.8,scale*1.37)};
 new ResizeObserver(resize).observe(host);resize();
 function pt(x:number,y:number,z:number){const perspective=1+z*.043;return [w/2+x*scale*perspective,h*.57+(z*.72-y*.93+.15)*sy] as const}
 function polygon(p:ReadonlyArray<readonly [number,number]>,fill:string){c.beginPath();c.moveTo(...p[0]);for(const a of p.slice(1))c.lineTo(...a);c.closePath();c.fillStyle=fill;c.fill()}
 function block(x:number,y:number,z:number,a:number,b:number,d:number,top:string,front:string,side:string){
 const l=x-a/2,r=x+a/2,f=z+d/2,k=z-d/2;
 polygon([pt(l,y,k),pt(l,y,f),pt(l,y-b,f),pt(l,y-b,k)],side);
 polygon([pt(r,y,k),pt(r,y,f),pt(r,y-b,f),pt(r,y-b,k)],side);
 polygon([pt(l,y,k),pt(r,y,k),pt(r,y,f),pt(l,y,f)],top);
 polygon([pt(l,y,f),pt(r,y,f),pt(r,y-b,f),pt(l,y-b,f)],front)}
 function panel(img:HTMLCanvasElement,x:number,y:number,z:number,a:number,b:number){const [px,py]=pt(x-a/2,y,z),[ex,ey]=pt(x+a/2,y-b,z);c.drawImage(img,px,py,ex-px,ey-py)}
 const q=new Quaternion(),axisX=new Vector3(),axisZ=new Vector3();
 return {aim(x:number){aim=x},lane(px:number,py:number){const r=host.getBoundingClientRect(),z=((py-r.top-h*.57)/sy-.15)/.72;return Math.max(-3.12,Math.min(3.12,(px-r.left-w/2)/(scale*(1+.043*z))))},lowerQuality(){},
 draw(f:Frame){
 c.clearRect(0,0,w,h);block(0,-.05,.08,8,.98,9,'#334665','#1c294b','#263149');block(0,3.24,-4.08,7.95,3.5,.5,'#9daac4','#263957','#111a30');
 panel(banner,0,3,-3.81,7.28,2.73);
 for(const x of [-3.8,3.8]){block(x,3.24,-3.83,.22,3.28,.25,'#b7afff','#5f4993','#373052');block(x,3.06,-3.66,.052,2.88,.04,'#cc99ff','#c897ff','#a974e8')}
 block(0,.003,-.23,7.2,.16,7.67,'#344b60','#9babaf','#53647e');
 for(let i=-3;i<=3;i++)block(i,.008,-.22,.015,.005,7.5,'#4e647a','#4d6275','#4d6275');
 block(0,.44,f.shelfZ,7.17,.44,2.44,'#687a94','#8c9eaf','#4e6483');panel(ramLabel,0,.41,f.shelfZ+1.225,7.1,.34);
 for(let i=-3;i<=3;i++)block(i,.45,f.shelfZ,.055,.02,2.34,'#b0c4d6','#9fabc9','#778a99');
 const pieces=f.pieces.slice().sort((a,b)=>(a.p[2]+a.p[1]*1.55)-(b.p[2]+b.p[1]*1.55));
 for(const p of pieces){
 const [x,y,z]=p.p,[cx,cy]=pt(x,y,z),s=scale*(1+z*.043);
 if(p.kind==='gem'){const left=pt(x-.39,y,z),right=pt(x+.39,y,z),top=pt(x,y+.61,z),bottom=pt(x+.06,y-.26,z+.14),mid=pt(x+.11,y+.05,z+.22);polygon([left,top,mid],'#90fff4');polygon([mid,top,right],'#44afeb');polygon([left,mid,bottom],'#23bad5');polygon([mid,right,bottom],'#3076c9');continue}
 const core=p.kind==='core',r=core?.42:.365;q.fromArray(p.q);axisX.set(r,0,0).applyQuaternion(q);axisZ.set(0,0,r).applyQuaternion(q);
 const u=pt(x+axisX.x,y+axisX.y,z+axisX.z),v=pt(x+axisZ.x,y+axisZ.y,z+axisZ.z);
 c.save();c.translate(cx,cy);c.transform((u[0]-cx)/128,(u[1]-cy)/128,(v[0]-cx)/128,(v[1]-cy)/128,0,0);
 c.beginPath();c.arc(0,0,128,0,Math.PI*2);c.fillStyle=core?'#8d46a9':'#83541f';c.fill();c.restore();
 c.save();c.translate(cx,cy-s*(core?.14:.087));c.transform((u[0]-cx)/128,(u[1]-cy)/128,(v[0]-cx)/128,(v[1]-cy)/128,0,0);
 c.beginPath();c.arc(0,0,128,0,Math.PI*2);c.clip();if(core){c.fillStyle='#be66ff';c.fillRect(-128,-128,256,256);c.fillStyle='#ffdcff';c.font='bold 150px Arial';c.textAlign='center';c.fillText('✦',0,53)}else c.drawImage(face,-128,-128,256,256);c.restore();
 }
 for(const x of [-3.82,3.82]){block(x,.55,.2,.47,.84,8.56,'#47547a','#354468','#1c2c45');block(x,.565,.2,.077,.03,8.45,'#77fff8','#6edeee','#3ab6d1');for(let i=0;i<9;i++)block(x+.13,.57,-3.6+i*.94,.05,.015,.36,'#d4b570','#a89362','#b2a16d')}
 block(0,-.42,4.41,7.99,.48,.26,'#5b7093','#253650','#16263c');panel(trim,0,-.44,4.55,7.66,.38);
 const z=f.shelfZ+1.34;block(aim,1.94,z,.8,.23,.38,'#abc1d6','#5f718c','#455b6e');block(aim,1.86,z+.21,.56,.07,.02,'#d0ffff','#76fff7','#8df2ee');
 const [ax,ay]=pt(aim,1.68,z),[bx,by]=pt(aim,.64,z);c.strokeStyle='#93fff9a8';c.setLineDash([3,4]);c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.stroke();c.setLineDash([])
 }};
}
