import test from 'node:test';
import assert from 'node:assert/strict';
import { Vector3 } from 'three';
import { refract,glassIndex,tracePrism,spectrumRays } from '../src/utils/OpticalRayTracer.ts';

test('Snell refraction matches independent air/glass 30 degree calculation and detects TIR',()=>{
 const r=refract(new Vector3(.5,-Math.sqrt(.75),0),new Vector3(0,1,0),1,1.5);
 assert.ok(Math.abs(r.x-1/3)<1e-12);assert.ok(Math.abs(r.y+Math.sqrt(8/9))<1e-12);
 assert.equal(refract(new Vector3(Math.sqrt(.75),-.5,0),new Vector3(0,1,0),1.5,1),null);
});
test('SCHOTT N-BK7 reference index at 587.6 nm and normal dispersion',()=>{
 assert.ok(Math.abs(glassIndex(587.6)-1.51680)<1e-5);
 assert.ok(glassIndex(380)>glassIndex(550));assert.ok(glassIndex(550)>glassIndex(700));
 for(const n of [0,NaN,Infinity,750])assert.throws(()=>glassIndex(n),RangeError);
});
test('finite rotated prism intersections have continuous Snell paths and correct color order',()=>{
 const rays=spectrumRays(64),red=tracePrism(700),violet=tracePrism(380);
 assert.ok(Math.acos(violet.outgoing.x)>Math.acos(red.outgoing.x));
 for(const r of rays){
  assert.ok(r.exit.clone().sub(r.entry).normalize().distanceTo(r.inside)<1e-9);
  const angleIn=Math.acos(Math.abs(new Vector3(1,0,0).dot(r.entryNormal)));
  const angleGlass=Math.acos(Math.abs(r.inside.dot(r.entryNormal)));
  assert.ok(Math.abs(Math.sin(angleIn)-r.index*Math.sin(angleGlass))<1e-9);
  const angleOut=Math.acos(Math.abs(r.outgoing.dot(r.exitNormal)));
  const angleInternal=Math.acos(Math.abs(r.inside.dot(r.exitNormal)));
  assert.ok(Math.abs(r.index*Math.sin(angleInternal)-Math.sin(angleOut))<1e-9);
  assert.ok(Math.abs(r.outgoing.length()-1)<1e-12);
 }
 assert.deepEqual(tracePrism(550),tracePrism(550));
});
