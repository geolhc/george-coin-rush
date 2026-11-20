import test from 'node:test';
import assert from 'node:assert/strict';
import {initPhysics,Machine} from '../src/machine';
await initPhysics();
test('rigid medals stack and a kinematic contact moves a medal',()=>{
 const m=new Machine(false);const a=m.spawn('coin',0,.11,1)!,b=m.spawn('coin',0,.64,1)!,c=m.spawn('coin',1,.1,-1.45)!;
 for(let i=0;i<180;i++)m.step();
 assert.ok(a.translation().y>.05);assert.ok(b.translation().y-a.translation().y>.12);assert.ok(c.translation().z>-1.2);m.dispose()
});
test('only the front collection edge awards once and side falls are lost',()=>{
 const m=new Machine(false);m.drop(0);m.spawn('gem',0,.1,4.3);m.spawn('core',5,.1,2);
 for(let i=0;i<120;i++)m.step();assert.equal(m.score,400);assert.equal(m.gems,1);assert.equal(m.cores,0);m.dispose()
});
test('successive objectives, chain expiry and physical shower',()=>{
 const m=new Machine(false);for(let i=0;i<8;i++)m.award('coin',0);assert.equal(m.stage,1);m.award('gem',0);m.award('coin',0);m.award('core',0);assert.equal(m.stage,4);assert.equal(m.items.size,7);
 for(let i=0;i<4;i++)m.award('coin',0);assert.equal(m.stage,5);for(let i=0;i<100;i++)m.step();m.award('coin',0);assert.equal(m.chain,1);m.dispose()
});
test('drops enforce cooldown and rigid body cap',()=>{const m=new Machine(false);assert.equal(m.drop(0),true);assert.equal(m.drop(0),false);for(let i=0;i<155;i++)m.spawn('coin',0,1,0);assert.equal(m.items.size,150);m.dispose()});
