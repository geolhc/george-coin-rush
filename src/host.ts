import type {Signal} from './reactor';
export const dialogue={
 open:['各位！準備好未？開機！'],push:['食我一記推力！','行喇，睇準個位！'],magnet:['磁力全開！','攝返埋嚟！'],rotate:['轉軌！對準先好推！'],near:['差少少！就嚟搞掂！'],blocked:['對到位喇，扭啱條軌先接到電！'],recover:['返廠執一執，再嚟！'],connect:['靚呀！成功接駁！','嘩！咁都俾你諗到？'],transform:['注意！機台開始變身！'],awake:['嘩！成部機醒晒喇！'],victory:['搞掂！任務完成！']
} as const;
export type Cue=keyof typeof dialogue;
type Bus='music'|'sfx'|'voice';
export const recordings=import.meta.glob('/public/audio/gbot/*.mp3');
export class Host{
 ctx?:AudioContext;buses?:Record<Bus,GainNode>;voice?:HTMLAudioElement;timer?:ReturnType<typeof setInterval>;beat=0;last=-Infinity;counts=new Map<Cue,number>();
 levels={music:.20,sfx:.6,voice:.85};muted=false;
 unlock(){try{if(!this.ctx){this.ctx=new AudioContext();this.buses={music:this.ctx.createGain(),sfx:this.ctx.createGain(),voice:this.ctx.createGain()};for(const b of Object.values(this.buses))b.connect(this.ctx.destination);this.mix();
 this.timer=setInterval(()=>{if(this.ctx?.state==='running'&&!document.hidden&&!this.muted&&this.levels.music){this.tone([110,0,164.8,0,130.8,0,146.8,196][this.beat++%8],.26,'music',.16,'triangle')}},315)}
 void this.ctx.resume().catch(()=>{})}catch{}}
 mix(){for(const key of ['music','sfx','voice'] as Bus[])if(this.buses)this.buses[key].gain.value=this.muted?0:this.levels[key];if(this.voice)this.voice.volume=this.muted?0:this.levels.voice}
 tone(f:number,d:number,bus:Bus='sfx',v=.20,w:OscillatorType='sine',delay=0,end=f){if(!f||!this.ctx||!this.buses)return;const c=this.ctx,t=c.currentTime+delay,o=c.createOscillator(),g=c.createGain();o.type=w;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+d);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g).connect(this.buses[bus]);o.start(t);o.stop(t+d+.02);o.onended=()=>{o.disconnect();g.disconnect()}}
 fx(cue:Signal){if(cue==='push')this.tone(210,.24,'sfx',.32,'sawtooth',0,44);else if(cue==='magnet')this.tone(155,.42,'sfx',.23,'sine',0,730);else if(cue==='rotate')this.tone(82,.33,'sfx',.2,'triangle',0,52);else if(['awake','transform','connect'].includes(cue)){const n=cue==='awake'?8:4;for(let i=0;i<n;i++)this.tone([261,330,392,523,659,784,988,1046][i],.34,'sfx',.2,'triangle',i*.065)}else this.tone(330,.09)}
 say(key:Cue,priority=false){const now=performance.now();if(!priority&&now-this.last<2350)return;this.last=now;const n=(this.counts.get(key)??0)%dialogue[key].length;this.counts.set(key,n+1);const file=key+'-'+(n+1)+'.mp3';if(recordings['/public/audio/gbot/'+file]&&!this.muted){this.voice?.pause();this.voice=new Audio(import.meta.env.BASE_URL+'audio/gbot/'+file);this.mix();void this.voice.play().catch(()=>{})}return dialogue[key][n]}
 dispose(){clearInterval(this.timer);this.voice?.pause();if(this.ctx)void this.ctx.close()}
}
