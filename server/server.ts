import {randomBytes,randomInt} from 'node:crypto';
import {WebSocketServer,WebSocket} from 'ws';
import {Machine,initPhysics} from '../src/machine';
await initPhysics();
const origins=new Set((process.env.ORIGINS??'http://localhost:5173,http://127.0.0.1:5173').split(','));
const server=new WebSocketServer({port:Number(process.env.PORT??8787),maxPayload:1024,verifyClient:(i:{origin:string})=>origins.has(i.origin)});
server.on("listening",()=>console.log("Room server ready"));
type Seat={token:string,socket:WebSocket|null};
type Room={machine:Machine,seats:Seat[],turn:number,emptySince:number};
const rooms=new Map<string,Room>();
const alphabet='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function advance(r:Room){for(let i=1;i<=r.seats.length;i++){const next=(r.turn+i)%r.seats.length;if(r.seats[next].socket){r.turn=next;return}}}
server.on('connection',socket=>{
 let room:Room|undefined,seat:Seat|undefined,windowStart=Date.now(),count=0;
 const send=(data:unknown)=>socket.send(JSON.stringify(data));
 const timeout=setTimeout(()=>{if(!room)socket.close()},10000);
 socket.on('error',()=>socket.terminate());
 socket.on('message',raw=>{
  if(Date.now()-windowStart>1000){count=0;windowStart=Date.now()}if(++count>20){socket.close(1008);return}
  try{
   const m=JSON.parse(raw.toString());
   if(!room){
    let code=String(m.code??'').toUpperCase();
    if(m.type==='create'){if(rooms.size>=32)return send({error:'Arcade busy'});do{code=Array.from({length:7},()=>alphabet[randomInt(alphabet.length)]).join('')}while(rooms.has(code));rooms.set(code,{machine:new Machine(),seats:[],turn:0,emptySince:0})}
    else if(m.type!=='join')return;
    const r=rooms.get(code);if(!r)return send({error:'Room expired or unknown'});
    let s=r.seats.find(s=>s.token===m.token);
    if(!s){if(r.seats.length>=4)return send({error:'Room full'});s={token:randomBytes(24).toString('hex'),socket:null};r.seats.push(s)}
    s.socket?.close();s.socket=socket;room=r;seat=s;r.emptySince=0;if(!r.seats[r.turn].socket)advance(r);
    send({welcome:code,token:s.token,player:r.seats.indexOf(s)});return;
   }
   if(m.type==='drop'&&room.seats[room.turn]===seat&&seat?.socket===socket&&room.seats.filter(s=>s.socket).length>=2&&typeof m.x==='number'&&room.machine.drop(m.x))advance(room);
  }catch{socket.close(1003)}
 });
 socket.on('close',()=>{clearTimeout(timeout);if(!room||seat?.socket!==socket)return;seat.socket=null;if(room.seats[room.turn]===seat)advance(room);if(!room.seats.some(s=>s.socket))room.emptySince=Date.now()});
});
let tick=0;
setInterval(()=>{tick++;for(const [code,r] of rooms){
 if(r.emptySince){if(Date.now()-r.emptySince>120000){r.machine.dispose();rooms.delete(code)}continue}
 if(r.seats.filter(s=>s.socket).length>=2)r.machine.step();
 if(tick%4)continue;
 const data=JSON.stringify({frame:r.machine.snapshot(),wins:r.machine.wins.splice(0),turn:r.turn,online:r.seats.filter(s=>s.socket).length});r.machine.hits=0;
 for(const s of r.seats)if(s.socket?.readyState===WebSocket.OPEN&&s.socket.bufferedAmount<60000)s.socket.send(data)
}},1000/60);
