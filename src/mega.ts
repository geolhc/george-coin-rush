import './mega.css';
import {initPhysics} from './machine';
import {Reactor,DT,cores,socketAt,type Power,type Signal} from './reactor';
import {forge} from './forge';
import {Host,type Cue} from './host';
const el=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const panel=el<HTMLDialogElement>('panel'),arena=el('arena'),host=new Host();
function read<T>(key:string,fallback:T):T{try{return JSON.parse(localStorage.getItem('gcr-mega-'+key)??'null')??fallback}catch{return fallback}}
function save(key:string,v:unknown){try{localStorage.setItem('gcr-mega-'+key,JSON.stringify(v))}catch{}}
const pref=read('mix',{...host.levels,muted:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});
for(const k of ['sfx','music','voice'] as const)host.levels[k]=Math.min(1,Math.max(0,Number(pref[k])||0));
host.muted=pref.muted;let reduced=pref.reduced;
function persist(){save('mix',{...host.levels,muted:host.muted,reduced});host.mix();el('sound').textContent=host.muted?'♪̸':'♪';el('sound').setAttribute('aria-label',host.muted?'Enable audio':'Mute audio')}
persist();el('sound').onclick=()=>{host.muted=!host.muted;host.unlock();persist()};
el('close').onclick=()=>panel.close();
function sheet(html:string){el('content').innerHTML=html;if(!panel.open)panel.showModal()}
const defaults={best:0,fastest:0,badges:[] as string[],trophies:[] as string[]};
const record=read('record',defaults);
const time=(s:number)=>Math.floor(s/60).toString().padStart(2,'0')+':'+Math.floor(s%60).toString().padStart(2,'0');
async function start(){
 await initPhysics();let r=new Reactor();const view=forge(arena);el('loading').remove();let aim=socketAt(0),strength=.85,lastCore=0,ending=0,resultShown=false,acc=0,last=performance.now(),slow=0,raf=0,impact=0,active=true,uiTick=0;
 function speak(key:Cue,important=false){const line=host.say(key,important);if(!line)return;el('caption').textContent=line;document.querySelector('.bot')?.classList.toggle('cheer',!['recover','blocked','near'].includes(key))}
 function handle(events:Signal[]){for(const e of events){host.fx(e);if(e==='connect'||e==='awake'){const p=socketAt(Math.min(3,r.connected-1));view.burst(p.x,p.z);impact=.22}if(e==='push'){const p=r.ball.translation();view.burst(p.x,p.z)}
 speak(e,e==='connect'||e==='transform'||e==='awake'||e==='blocked')}
 if(lastCore!==r.connected){lastCore=r.connected;if(!r.won)aim=socketAt(r.connected)}
 }
 function controls(){
 el('clock').textContent=time(r.elapsed);el('linked').textContent=r.connected+' / 4';
 el('phase').textContent=['','CORE TRANSPORT','MACHINE TRANSFORMATION','ROBOT AWAKENING'][r.phase];
 const s=cores[Math.min(3,r.connected)],turns=(s.angle-r.slot%4+4)%4;
 el('objective').textContent=r.won?'Neon Robot online':(r.feed>.12?'Elevator loading':turns?'Rotate '+turns+'× to align':'Circuit aligned')+' · '+s.name+' '+s.mark;
 el('objective').style.color=s.color;el('strength').textContent='PUSH '+Math.round(strength*100)+'%';
 for(const p of ['magnet','push','rotate'] as Power[]){const b=el<HTMLButtonElement>(p),wait=Math.max(0,(r.ready[p]-r.ticks)*DT,r.feed-.12);b.disabled=r.won||wait>.005;b.querySelector('small')!.textContent=wait>.005?wait.toFixed(1)+' s':({magnet:'磁力',push:'推力',rotate:'旋轉'}[p])}
 }
 function power(p:Power){if(panel.open)return;host.unlock();r.command({power:p,...aim,strength});handle(r.events.splice(0));controls()}
 for(const p of ['magnet','push','rotate'] as Power[])el(p).onclick=()=>power(p);
 const resetAim=()=>{if(!r.won){aim=socketAt(r.connected);strength=.85;controls()}};
 el('target').onclick=resetAim;el('recover').onclick=()=>{host.unlock();r.command({power:'recover'});resetAim();handle(r.events.splice(0));controls()};
 function restart(){r.dispose();r=new Reactor();ending=0;resultShown=false;lastCore=0;impact=0;uiTick=0;acc=0;resetAim();panel.close();speak('open',true);controls()}
 let touch:number|null=null,startX=0,startY=0;
 function point(e:PointerEvent){const p=view.hit(e.clientX,e.clientY);aim={x:Math.max(-3.45,Math.min(3.45,p.x)),z:Math.max(-4.02,Math.min(4.02,p.z))}}
 arena.onpointerdown=e=>{if(touch!==null||r.won)return;host.unlock();touch=e.pointerId;arena.setPointerCapture(touch);startX=e.clientX;startY=e.clientY;point(e)};
 arena.onpointermove=e=>{if(e.pointerId!==touch)return;point(e);const d=Math.hypot(e.clientX-startX,e.clientY-startY);if(d>6)strength=Math.min(1,.30+d/125);controls()};
 arena.onpointerup=arena.onpointercancel=()=>{touch=null};
 arena.onkeydown=e=>{const keys:Record<string,Power>={'1':'magnet','2':'push','3':'rotate'};if(keys[e.key]){e.preventDefault();power(keys[e.key])}else if(e.key.startsWith('Arrow')){e.preventDefault();aim.x=Math.max(-3.45,Math.min(3.45,aim.x+((e.key==='ArrowRight'?1:0)-(e.key==='ArrowLeft'?1:0))*.23));aim.z=Math.max(-4.02,Math.min(4.02,aim.z+((e.key==='ArrowDown'?1:0)-(e.key==='ArrowUp'?1:0))*.23))}};
 el('help').onclick=()=>{host.unlock();sheet('<h2>Route the four cores</h2><ol><li><b>Rotate</b> until the guide aligns with the matching socket. The counter shows the quarter-turns left.</li><li><b>Push</b> while the core sits between the rails. The reticle starts on its socket. Tap the deck to aim elsewhere. Drag farther for a stronger push.</li><li><b>Magnet</b> as the core enters the field around your reticle. The pull lasts just under a second.</li></ol><p>Two connections lower the striped gate and tilt the return ramp. The right belt carries cores toward the rear. Recover returns a loose core to the lift.</p><p>Keyboard: focus the deck, aim with arrows, use 1 / 2 / 3 for powers. Optional badges: finish under 90 seconds, use 24 actions or fewer, or avoid recovery.</p>')};
 el('settings').onclick=()=>{host.unlock();sheet('<h2>Machine settings</h2>'+(['sfx','music','voice'] as const).map(k=>'<label>'+({sfx:'Sound effects',music:'Music',voice:'G-BOT voice'}[k])+' <input type="range" id="vol-'+k+'" min="0" max="100" value="'+Math.round(host.levels[k]*100)+'"></label>').join('')+'<p>G-BOT captions active. Recorded voice pack pending.</p><label>Reduced motion <input id="motion" type="checkbox"></label><h3>Trophy case</h3><p id="collection"></p><button id="again">Restart mission</button><button id="full">Fullscreen</button>');
 for(const k of ['sfx','music','voice'] as const)el('vol-'+k).oninput=e=>{host.levels[k]=Number((e.target as HTMLInputElement).value)/100;persist();if(k==='sfx')host.tone(400,.08)};
 el<HTMLInputElement>('motion').checked=reduced;el('motion').onchange=e=>{reduced=(e.target as HTMLInputElement).checked;persist()};
 el('collection').textContent=record.best?'Best '+record.best+' · Fastest '+time(record.fastest)+' · '+record.trophies.join(', ')+' · '+record.badges.join(', '):'Awaken the robot to earn its first trophy.';
 el('again').onclick=restart;el('full').hidden=!document.fullscreenEnabled;el('full').onclick=()=>{panel.close();void document.documentElement.requestFullscreen().catch(()=>{})}};
 function finish(){const result=r.result();if(!result)return;resultShown=true;speak('victory',true);record.best=Math.max(record.best,result.score);record.fastest=record.fastest?Math.min(record.fastest,result.time):result.time;
 const badges=['Four circuits',...(result.time<90?['Quick start']:[]),...(result.actions<=24?['Efficient engineer']:[]),...(!result.recoveries?['Clean circuit']:[])];record.badges=[...new Set([...record.badges,...badges])];record.trophies=[...new Set([...record.trophies,'Neon Robot · '+result.grade])];save('record',record);
 sheet('<h2>Neon Robot awakened</h2><output>GRADE '+result.grade+'</output><p>'+result.score+' points · '+time(result.time)+' · '+result.actions+' actions · '+result.recoveries+' recoveries</p><p>'+badges.join(' · ')+'</p><p>Best '+record.best+' · Fastest '+time(record.fastest)+'</p><button id="replay">Replay mission</button>');el('replay').onclick=restart}
 function loop(t:number){if(!active)return;raf=requestAnimationFrame(loop);const dt=Math.min(.08,(t-last)/1000);last=t;if(document.hidden||panel.open){acc=0;return}
 if(dt>.035){if(++slow>50){view.lower();slow=0}}else slow=Math.max(0,slow-1);
 impact=Math.max(0,impact-dt);acc+=dt*(impact>0&&!reduced?.55:1);
 while(acc>=DT){r.step();acc-=DT}handle(r.events.splice(0));view.draw(r,aim,reduced,dt);
 if((uiTick++%5)===0)controls();if(r.won&&!resultShown&&(ending+=dt)>(reduced?.55:2.4))finish()}
 controls();speak('open',true);raf=requestAnimationFrame(loop);
 const pause=()=>{if(document.hidden){void host.ctx?.suspend();host.voice?.pause()}else if(host.ctx)void host.ctx.resume().catch(()=>{})};
 document.addEventListener('visibilitychange',pause);
 window.addEventListener('pagehide',e=>{if(e.persisted)return;active=false;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',pause);r.dispose();view.dispose();host.dispose()},{once:true})
}
start().catch(e=>{console.error(e);el('loading').textContent='Machine could not boot. Reload to retry.'});
