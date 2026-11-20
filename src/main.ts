import './style.css';
import {initPhysics,Machine,goals,type Frame,type Kind} from './machine';
import {cabinet} from './view';
import {AudioRack,lines} from './audio';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const dialog=document.querySelector('dialog')!,rack=new AudioRack();
function read(key:string){try{return JSON.parse(localStorage.getItem('gcr-'+key)??'null')}catch{return null}}
function save(key:string,value:unknown){try{localStorage.setItem('gcr-'+key,JSON.stringify(value))}catch{}}
const medals=new Set<string>(Array.isArray(read('achievements'))?read('achievements'):[]);
let best=Number(read('best'))||0,aim=0;
rack.enabled=read('sound')!==false;rack.volume=Math.max(0,Math.min(1,Number(read('volume')??.36)));
function audioUI(){$('sound').textContent=rack.enabled?'Sound ON':'Sound OFF';$('volume') .setAttribute('value',String(rack.volume*100));rack.level()}
audioUI();$('sound').onclick=()=>{rack.enabled=!rack.enabled;rack.unlock();audioUI();save('sound',rack.enabled)};
$('volume').oninput=e=>{rack.unlock();rack.volume=Number((e.target as HTMLInputElement).value)/100;rack.level();save('volume',rack.volume)};
$('settings').onclick=()=>{rack.unlock();$('ach').textContent=[...medals].join(' · ')||'First medal, Crystal keeper, Rush driver and Chain master are waiting.';dialog.showModal()};
let noticeTimer:ReturnType<typeof setTimeout>,burstTimer:ReturnType<typeof setTimeout>;
function notice(s:string){clearTimeout(noticeTimer);$('notice').textContent=s;noticeTimer=setTimeout(()=>$('notice').textContent='',2300)}
function cheer(key:keyof typeof lines){rack.host(key);notice(lines[key])}
async function start(){
 await initPhysics();let game=new Machine();const view=cabinet($('bay'));let frame=game.snapshot(),live=false,remote=false,online=0,player=-1,turn=-1,socket:WebSocket|undefined,retry:ReturnType<typeof setTimeout>|undefined;
 let roomCode='',token='',lastHost=0,lastStage=0,nearMissAt=-1;
 const wsURL=import.meta.env.VITE_ROOM_SERVER||(import.meta.env.DEV?'ws://'+location.hostname+':8787':'');
 const paint=(f:Frame)=>{
  $('score').textContent=String(f.score).padStart(6,'0');$('chain').textContent='×'+f.chain;
  if(f.score>best){best=f.score;save('best',best)}$('best').textContent=String(best).padStart(6,'0');
  $('stage').textContent=f.stage>=5?'FREE PLAY':'STAGE 0'+(f.stage+1);$('goal').textContent=goals[f.stage]??'All challenges cleared';$('progress').textContent=f.stage>=5?'★':f.progress+' / '+[8,1,1,1,2500][f.stage];
  const a=medals.size;if(f.medals)medals.add('First medal');if(f.gems)medals.add('Crystal keeper');if(f.cores)medals.add('Rush driver');if(f.maxChain>=3)medals.add('Chain master');if(f.stage===5)medals.add('Harbour champion');if(medals.size!==a)save('achievements',[...medals]);
  if(f.stage>lastStage){notice('STAGE CLEAR!');rack.win(5)}lastStage=f.stage;
  $<HTMLButtonElement>('drop').disabled=remote&&(online<2||turn!==player||socket?.readyState!==1);
 };
 function effects(wins:{kind:Kind,x:number,value:number}[],chain:number){
 if(!wins.length)return;rack.win(chain);if(performance.now()-lastHost>2500){cheer(chain>=3?'rush':'nice');lastHost=performance.now()}
 $('burst').textContent='+'+wins.reduce((sum,w)=>sum+w.value,0)+(chain>=3?'  CHAIN ×'+chain:'');clearTimeout(burstTimer);burstTimer=setTimeout(()=>$('burst').textContent='',800);
 if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 for(let i=0;i<Math.min(24,5+wins.length*2);i++){const p=document.createElement('i');p.className='spark';$('bay').append(p);const anim=p.animate([{transform:'translate(0,0)',opacity:1},{transform:'translate('+((Math.random()-.5)*220)+'px,'+(-20-Math.random()*115)+'px) rotate(220deg)',opacity:0}],{duration:520+Math.random()*320,easing:'ease-out'});anim.onfinish=()=>p.remove()}
 }
 function lane(x:number){aim=x;view.aim(x);$<HTMLInputElement>('lane').value=String(x*100)}
 function drop(){rack.unlock();if(remote){if(online>=2&&turn===player&&socket?.readyState===1)socket.send(JSON.stringify({type:'drop',x:aim}));return}
 if(game.drop(aim)){nearMissAt=game.time+2.7;rack.tone(720,.14,.15,0,'triangle',250);if(!live)cheer('ready');live=true}else if(game.items.size>=150)notice('Shelf full · wait for the next push')}
 $('drop').onclick=drop;$('lane').oninput=e=>lane(Number((e.target as HTMLInputElement).value)/100);
 const bay=$('bay');let pointer:number|null=null;
 bay.onpointerdown=e=>{if(pointer!==null)return;rack.unlock();pointer=e.pointerId;bay.setPointerCapture(pointer);lane(view.lane(e.clientX,e.clientY))};
 bay.onpointermove=e=>{if(pointer===e.pointerId)lane(view.lane(e.clientX,e.clientY))};bay.onpointercancel=()=>pointer=null;bay.onpointerup=e=>{if(pointer===e.pointerId){pointer=null;drop()}};
 window.addEventListener('keydown',e=>{if(dialog.open||e.repeat||['INPUT','BUTTON'].includes((e.target as HTMLElement).tagName))return;if(e.code==='Space'){e.preventDefault();drop()}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();lane(Math.min(3.12,Math.max(-3.12,aim+(e.key==='ArrowRight'?.27:-.27))))}});
 function leave(){clearTimeout(retry);remote=false;if(socket){socket.onclose=null;socket.onmessage=null;socket.close();socket=undefined}roomCode='';token='';online=0;turn=-1;history.replaceState(null,'',location.pathname);$('mode').textContent='● SOLO PLAY'}
 $('reset').onclick=()=>{leave();game.dispose();game=new Machine();live=false;lastStage=0;frame=game.snapshot();paint(frame);dialog.close();notice('Fresh medal bed');roomUI()};
 function connect(code:string,reconnect=false){
  if(!wsURL)return;clearTimeout(retry);if(socket){socket.onclose=null;socket.onmessage=null;socket.close()}remote=true;online=0;paint(frame);
  const ws=new WebSocket(wsURL);socket=ws;
  ws.onopen=()=>ws.send(JSON.stringify({type:code?'join':'create',code,token:reconnect?token:undefined}));
  ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.error){leave();roomUI();notice(m.error);paint(frame);return}
  if(m.welcome){roomCode=m.welcome;token=m.token;player=m.player;try{sessionStorage.setItem('seat-'+roomCode,token)}catch{}history.replaceState(null,'','?room='+roomCode);roomUI();dialog.close();return}
  if(m.frame){frame=m.frame;turn=m.turn;online=m.online;effects(m.wins,frame.chain);paint(frame);$('mode').textContent=roomCode+' · '+(online<2?'WAITING FOR PLAYER 2':turn===player?'YOUR TURN':'PLAYER '+(turn+1)+' TURN')}};
  ws.onclose=()=>{online=0;paint(frame);if(roomCode){$('mode').textContent='RECONNECTING';retry=setTimeout(()=>connect(roomCode,true),1800)}else{leave();roomUI();notice('Room server unavailable');paint(frame)}};
 }
 function roomUI(){
 const n=$('network');n.replaceChildren();if(!wsURL){n.textContent='Private co-op requires a room server. This cabinet runs solo.';return}
 if(roomCode){const b=document.createElement('button');b.textContent='Copy invite · '+roomCode;b.onclick=()=>navigator.clipboard.writeText(location.href).then(()=>notice('Invite copied')).catch(()=>notice(roomCode));n.append(b);return}
 const create=document.createElement('button'),join=document.createElement('button'),input=document.createElement('input');create.textContent='Create room';join.textContent='Join';input.placeholder='Room code';input.setAttribute('aria-label','Room code');input.maxLength=7;create.onclick=()=>connect('');join.onclick=()=>{if(input.value.trim())connect(input.value.trim().toUpperCase())};n.append(create,input,join);
 }
 roomUI();const code=new URLSearchParams(location.search).get('room');if(code&&wsURL){try{token=sessionStorage.getItem('seat-'+code)??''}catch{}connect(code,true)}
 $('notice').textContent='';paint(frame);let prev=performance.now(),acc=0,hudTime=0,slow=0,lastMotor=0;
 function loop(t:number){requestAnimationFrame(loop);const delta=(t-prev)/1000;prev=t;if(document.hidden||(!remote&&dialog.open)){acc=0;return}
 if(delta>.032&&delta<.25){if(++slow>=80){view.lowerQuality();slow=0}}else slow=Math.max(0,slow-1);
 if(!remote){acc+=Math.min(delta,.08);while(acc>=1/60){game.step();acc-=1/60}if(game.hits&&live)rack.hit();game.hits=0;
 if(live&&game.time-lastMotor>Math.PI){rack.push();lastMotor=game.time}
 if(nearMissAt>0&&game.time>=nearMissAt){nearMissAt=-1;if(game.lastWin<game.lastDrop&&game.drops%4===0&&performance.now()-lastHost>3000){cheer('close');lastHost=performance.now()}}
 effects(game.wins.splice(0),game.chain);frame=game.snapshot();if(t-hudTime>90){paint(frame);hudTime=t}}
 view.draw(frame)}
 requestAnimationFrame(loop);
}
start().catch(e=>{console.error(e);$('notice').textContent='3D could not start. Enable WebGL and reload.'});
