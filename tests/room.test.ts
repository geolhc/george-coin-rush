import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import WebSocket from 'ws';
test('two clients share an authoritative machine, alternate turns and resume a seat',{timeout:18000},async()=>{
 const server=spawn(process.execPath,['--import','tsx','server/server.ts'],{env:{...process.env,PORT:'19879'},stdio:['ignore','pipe','pipe']});
 const clients:WebSocket[]=[];
 const connect=async()=>{const ws=new WebSocket('ws://127.0.0.1:19879',{origin:'http://localhost:5173'});clients.push(ws);await once(ws,'open');return ws};
 const until=(ws:WebSocket,pred:(m:any)=>boolean)=>new Promise<any>((resolve,reject)=>{
  const timer=setTimeout(()=>{ws.off('message',listener);reject(new Error('Snapshot timeout'))},4000);
  function listener(raw:Buffer){const m=JSON.parse(raw.toString());if(pred(m)){clearTimeout(timer);ws.off('message',listener);resolve(m)}}
  ws.on('message',listener)
 });
 try{
  await once(server.stdout!,'data');const a=await connect(),b=await connect();
  a.send(JSON.stringify({type:'create'}));const room=await until(a,m=>m.welcome);
  b.send(JSON.stringify({type:'join',code:room.welcome}));const seat=await until(b,m=>m.welcome);assert.equal(seat.player,1);
  b.send(JSON.stringify({type:'drop',x:1}));const initial=await until(a,m=>m.online===2);assert.equal(initial.frame.drops,0);
  a.send(JSON.stringify({type:'drop',x:1}));const [one,two]=await Promise.all([until(a,m=>m.frame?.drops===1),until(b,m=>m.frame?.drops===1)]);assert.deepEqual(one.frame,two.frame);assert.equal(two.turn,1);
  const offline=until(a,m=>m.online===1);b.close();await offline;
  const c=await connect();c.send(JSON.stringify({type:'join',code:room.welcome,token:seat.token}));const resumed=await until(c,m=>m.welcome);assert.equal(resumed.player,1);assert.equal(resumed.token,seat.token);
 }finally{for(const ws of clients)ws.terminate();server.kill()}
});
