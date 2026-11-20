const files=import.meta.glob('/public/audio/host/*.mp3');
export const lines={nice:'嘩！呢下推得靚！',close:'差少少呀！再嚟！',ready:'嚟喇嚟喇！一齊推！',rush:'嘩！一嘢推晒落嚟！'};
export class AudioRack{
 ctx?:AudioContext;gain?:GainNode;enabled=true;volume=.36;lastHit=0;voice?:HTMLAudioElement;
 unlock(){try{this.ctx??=new AudioContext();if(!this.gain){this.gain=this.ctx.createGain();this.gain.connect(this.ctx.destination)}this.level();void this.ctx.resume().catch(()=>{})}catch{}}
 level(){if(this.gain)this.gain.gain.value=this.enabled?this.volume:0;if(this.voice)this.voice.volume=this.enabled?this.volume:0}
 tone(f:number,d:number,v:number,delay=0,type:OscillatorType='sine',end=f){
 if(!this.ctx||!this.gain||!this.enabled)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),a=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+d);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(v,t+.005);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a).connect(this.gain);o.start(t);o.stop(t+d+.01);o.onended=()=>{a.disconnect();o.disconnect()}}
 hit(){if(performance.now()-this.lastHit<110)return;this.lastHit=performance.now();const f=1100+Math.random()*500;this.tone(f,.09,.12);this.tone(f*2.43,.06,.055)}
 push(){this.tone(85,.45,.045,0,'triangle',51)}
 win(chain:number){[620,830,1040,...(chain>=3?[1240,1660]:[])].forEach((f,i)=>this.tone(f,.19,.12,i*.052,'triangle'))}
 host(key:keyof typeof lines){if(!this.enabled||!(('/public/audio/host/'+key+'.mp3') in files))return;this.voice?.pause();this.voice=new Audio(import.meta.env.BASE_URL+'audio/host/'+key+'.mp3');this.level();void this.voice.play().catch(()=>{})}
}
