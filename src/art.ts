import * as T from 'three';
function texture(w:number,h:number,draw:(c:CanvasRenderingContext2D)=>void){
 const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d')!);
 const t=new T.CanvasTexture(canvas);t.colorSpace=T.SRGBColorSpace;return t;
}
export const medal=()=>texture(256,256,c=>{
 const g=c.createLinearGradient(0,0,210,250);g.addColorStop(0,'#fff7ab');g.addColorStop(.42,'#ffcd54');g.addColorStop(.65,'#c88525');g.addColorStop(1,'#fff19b');c.fillStyle=g;c.fillRect(0,0,256,256);
 for(const r of [120,113,94]){c.beginPath();c.arc(128,128,r,0,Math.PI*2);c.strokeStyle='#a86a23';c.lineWidth=4;c.stroke();c.translate(0,-2);c.strokeStyle='#fff0a4';c.stroke();c.translate(0,2)}
 for(let i=0;i<36;i++){c.save();c.translate(128,128);c.rotate(i*Math.PI/18);c.fillStyle='#a57129';c.fillRect(-2,101,4,7);c.restore()}
 c.font='italic 900 136px Arial';c.textAlign='center';c.fillStyle='#9f6424';c.fillText('G',125,179);c.fillStyle='#ffed96';c.fillText('G',123,174);
});
export const marquee=()=>texture(1024,384,c=>{
 let s=1989;const rnd=()=>((s=(s*1664525+1013904223)>>>0)/4294967296);
 const g=c.createLinearGradient(0,0,0,384);g.addColorStop(0,'#13113c');g.addColorStop(.54,'#6b276c');g.addColorStop(1,'#ff6b60');c.fillStyle=g;c.fillRect(0,0,1024,384);
 for(let i=0;i<160;i++){c.fillStyle='#fdeaff';c.fillRect(rnd()*1024,rnd()*280,2,2)}
 c.save();c.beginPath();c.arc(530,148,120,0,7);c.clip();const sun=c.createLinearGradient(0,28,0,268);sun.addColorStop(0,'#fff9a3');sun.addColorStop(.55,'#ffb658');sun.addColorStop(1,'#ff547d');c.fillStyle=sun;for(let y=28;y<268;y+=10)c.fillRect(400,y,260,y<130?10:6);c.restore();
 for(let layer=0;layer<2;layer++){
  let x=-10;while(x<1024){const w=13+rnd()*37,h=20+rnd()*100+(Math.abs(x-512)/512)*88;const y=384-h-layer*3;c.fillStyle=layer?'#101633':'#442a65';c.fillRect(x,y,w,h+8);c.fillRect(x+w*.48,y-10-rnd()*24,2,36);for(let j=4;j<w-2;j+=7)for(let k=7;k<h-4;k+=9)if(rnd()>.5){c.fillStyle=rnd()>.6?'#ff9b6c':'#539fc5';c.fillRect(x+j,y+k,3,3)}x+=w+2}
 }
 c.fillStyle='#140c2599';c.fillRect(0,144,1024,91);c.textAlign='center';c.font='italic 900 86px Arial';c.lineWidth=8;c.strokeStyle='#341533';c.strokeText('NEON HARBOUR',512,219);c.fillStyle='#fff4cb';c.fillText('NEON HARBOUR',512,219);
 c.font='bold 27px monospace';c.fillStyle='#9cffff';c.fillText('香 港   /   HONG KONG',512,269);
 for(let y=0;y<384;y+=4){c.fillStyle='rgba(0,0,25,.15)';c.fillRect(0,y,1024,1)}
});
export const strip=(title:string)=>texture(1024,96,c=>{c.fillStyle='#102338';c.fillRect(0,0,1024,96);c.fillStyle='#50eeeb';c.textAlign='center';c.font='bold 46px monospace';c.fillText(title,512,65);for(const side of [0,820])for(let i=0;i<8;i++){c.fillStyle=i%2?'#f9aa31':'#382744';c.beginPath();c.moveTo(side+i*25,0);c.lineTo(side+i*25+20,0);c.lineTo(side+i*25-9,96);c.lineTo(side+i*25-29,96);c.fill()}})
