import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initPhysics} from '../src/machine';
import {Reactor,cores,socketAt} from '../src/reactor';
await initPhysics();
const advance=(r:Reactor,n:number)=>{for(let i=0;i<n;i++)r.step()};
test('public commands solve all four cores without resetting or editing bodies',()=>{
 const r=new Reactor();const signals:string[]=[];
 for(let i=0;i<4;i++){
 advance(r,65);while(r.slot%4!==cores[i].angle){assert.ok(r.command({power:'rotate'}));advance(r,52)}
 const s=socketAt(i);r.command({power:'push',...s,strength:.85});advance(r,30);r.command({power:'magnet',...s});advance(r,110);
 assert.equal(r.connected,i+1,JSON.stringify(r.ball.translation()));signals.push(...r.events.splice(0));
 }assert.equal(r.rescues,0);assert.equal(signals.filter(x=>x==='awake').length,1);assert.ok(r.result());r.dispose()
});
test('socket rejects wrong identity, above-socket objects and unaligned circuit',()=>{
 const r=new Reactor();for(const [id,y] of [[1,.3],[0,2],[0,.3]]){r.ball.setTranslation({...socketAt(id),y},true);advance(r,2);assert.equal(r.connected,0)}assert.equal(r.result(),null);r.dispose()
});
test('powers change physical state, enforce distinct cooldowns and permit recovery',()=>{
 const r=new Reactor();advance(r,30);r.command({power:'magnet',x:0,z:.9});advance(r,25);assert.ok(r.ball.translation().z>.15);r.command({power:'push',x:0,z:3});assert.ok(r.ball.linvel().z>2);assert.equal(r.command({power:'push'}),false);r.command({power:'rotate'});advance(r,30);assert.ok(r.angle>1);r.command({power:'recover'});assert.equal(r.ball.translation().x,0);assert.equal(r.rescues,1);r.dispose()
});
