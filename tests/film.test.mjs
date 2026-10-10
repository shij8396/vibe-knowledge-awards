import test from 'node:test';
import assert from 'node:assert/strict';
import { MasterTimeline } from '../src/core/MasterTimeline.ts';
import { scenesAt, clampFilmTime } from '../src/utils/film.ts';
import { CinematicCameraRig } from '../src/core/CinematicCameraRig.ts';
import { propagationPosition,propagationDistance } from '../src/utils/propagation.ts';
import { Vector3 } from 'three';

test('one film crosses all ten shots without pausing at boundaries',()=>{
 const movie=new MasterTimeline();try{assert.equal(movie.duration,170);movie.advance(12);assert.equal(movie.paused,false);movie.advance(15);assert.equal(movie.time,27);assert.equal(movie.paused,false);movie.advance(18);assert.equal(movie.time,45);assert.equal(movie.paused,false);movie.advance(13);assert.equal(movie.time,58);assert.equal(movie.paused,false);movie.advance(18);assert.equal(movie.time,76);assert.equal(movie.paused,false);movie.advance(14);assert.equal(movie.time,90);assert.equal(movie.paused,false);movie.advance(20);assert.equal(movie.time,110);assert.equal(movie.paused,false);movie.advance(25);assert.equal(movie.time,135);assert.equal(movie.paused,false);movie.advance(20);assert.equal(movie.time,155);assert.equal(movie.paused,false);movie.advance(15);assert.equal(movie.time,170);assert.equal(movie.paused,true);movie.restart();assert.equal(movie.time,0);assert.equal(movie.paused,false);}finally{movie.dispose();}
 assert.equal(clampFilmTime(200),170);assert.throws(()=>clampFilmTime(NaN),RangeError);
});
test('arbitrary seeks and pause preserve deterministic state and captions',()=>{
 const movie=new MasterTimeline(),targets=[0,3,8,12,18,27,30,35,38,42,45,48,51,54,58];
 const capture=()=>({state:{...movie.state},opening:{...movie.opening},caption:movie.caption});
 try{const reference=targets.map(t=>{movie.seek(t);return capture();});for(const i of [14,10,2,8,1,7,13,0,5,3,11,9,4,12,6]){movie.seek(targets[i]);assert.deepEqual(capture(),reference[i]);}movie.paused=true;const before=capture();movie.advance(10);assert.deepEqual(capture(),before);}finally{movie.dispose();}
});
test('excitation is held then released before directed photon emission',()=>{
 const movie=new MasterTimeline();try{movie.seek(27);assert.equal(movie.state.excitation,0);movie.seek(35);assert.equal(movie.state.excitation,1);movie.seek(39);assert.ok(movie.state.excitation>0&&movie.state.excitation<1);movie.seek(42);assert.equal(movie.state.excitation,0);assert.equal(movie.state.incoming,0);assert.equal(movie.state.photon,0);movie.seek(44);assert.ok(movie.state.photon>0);assert.ok(movie.state.photonVisible>.9);}finally{movie.dispose();}
});
test('the same atom survives both transitions, and only departed opening assets are released',()=>{
 for(let t=0;t<=45;t+=.1){const active=scenesAt(t);assert.ok(active.includes('atomic'));assert.ok(!active.includes('wave'));assert.ok(active.length<=2);}assert.deepEqual(scenesAt(23),['atomic']);
 const movie=new MasterTimeline();try{movie.seek(0);assert.equal(movie.state.atomic,0);movie.seek(12);assert.ok(movie.state.atomic>0);movie.seek(16);assert.equal(movie.state.atomic,1);movie.seek(22);assert.equal(movie.state.intro,0);}finally{movie.dispose();}
});
test('camera remains continuous at shot boundaries and reproducible in landscape and portrait',()=>{
 for(const [width,height] of [[1280,720],[390,844]]){globalThis.innerWidth=width;globalThis.innerHeight=height;const rig=new CinematicCameraRig();
  for(const t of [2,4,6,8,10,12,15,18,22,25,27,30,34,38,42,45,47,50,53,56]){rig.update(t-.001);const p=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(t+.001);assert.ok(p.distanceTo(rig.camera.position)<.04,`position at ${t}`);assert.ok(q.angleTo(rig.camera.quaternion)<.03,`orientation at ${t}`);}
  rig.update(35);const p=rig.camera.position.clone();rig.update(0);rig.update(45);rig.update(35);assert.ok(p.distanceTo(rig.camera.position)<1e-12);
 }
});

test('shot04 preserves a straight propagation axis and camera velocity at the 45s handoff',()=>{
 for(const [width,height] of [[1280,720],[390,844]]){
  globalThis.innerWidth=width;globalThis.innerHeight=height;const rig=new CinematicCameraRig();
  rig.update(44.999);const before=rig.camera.position.clone();rig.update(45);const at=rig.camera.position.clone();rig.update(45.001);
  const left=at.clone().sub(before).multiplyScalar(1000),right=rig.camera.position.clone().sub(at).multiplyScalar(1000);
  assert.ok(left.distanceTo(right)<.12,'camera velocity must not reset at handoff');
  const anchor=propagationPosition(45,width<760,new Vector3());let previous=0;
  for(let t=45;t<=58;t+=.1){const p=propagationPosition(t,width<760,new Vector3()),d=propagationDistance(t);assert.equal(p.y,anchor.y);assert.equal(p.z,anchor.z);assert.ok(d>=previous);previous=d;}
 }
});

test('shot05 handoff preserves camera velocity and releases previous scene',()=>{
 for(const width of [1280,390]){globalThis.innerWidth=width;const rig=new CinematicCameraRig();rig.update(57.999);const before=rig.camera.position.clone();rig.update(58);const at=rig.camera.position.clone();rig.update(58.001);assert.ok(at.clone().sub(before).multiplyScalar(1000).distanceTo(rig.camera.position.clone().sub(at).multiplyScalar(1000))<.12);for(const t of [62,66,70,74]){rig.update(t-.001);const p=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(t+.001);assert.ok(p.distanceTo(rig.camera.position)<.05);assert.ok(q.angleTo(rig.camera.quaternion)<.04);}}
 assert.deepEqual(scenesAt(58),['propagation']);assert.deepEqual(scenesAt(59),['propagation','electromagnetic']);assert.deepEqual(scenesAt(62),['electromagnetic']);
 const movie=new MasterTimeline();try{movie.seek(70);const caption=movie.caption;assert.match(caption.text,/量子/);movie.seek(60);movie.seek(70);assert.deepEqual(movie.caption,caption);}finally{movie.dispose();}
});

 test('shot06 handoff is continuous, and Earth/Moon ruler has a single physical scale',async()=>{
  const {EARTH_RADIUS,MOON_RADIUS,EARTH_MOON_DISTANCE,EARTH_MOON_LIGHT_SECONDS,scalePulseX,SCALE_PULSE_START,EARTH_X,MOON_X}=await import('../src/utils/lightSpeed.ts');
  assert.ok(Math.abs(EARTH_MOON_DISTANCE/EARTH_RADIUS-384400/6371)<1e-12);assert.ok(Math.abs(MOON_RADIUS/EARTH_RADIUS-1737/6371)<1e-12);assert.ok(Math.abs(EARTH_MOON_LIGHT_SECONDS-1.28222038)<1e-7);assert.equal(scalePulseX(SCALE_PULSE_START),EARTH_X);assert.ok(Math.abs(scalePulseX(SCALE_PULSE_START+EARTH_MOON_LIGHT_SECONDS)-MOON_X)<1e-10);
  for(const width of [1280,390]){globalThis.innerWidth=width;const rig=new CinematicCameraRig();rig.update(75.999);const p=rig.camera.position.clone();rig.update(76);const a=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(76.001);assert.ok(a.clone().sub(p).multiplyScalar(1000).distanceTo(rig.camera.position.clone().sub(a).multiplyScalar(1000))<.12);assert.ok(q.angleTo(rig.camera.quaternion)<.01);for(const t of [79,82,84,86,87,88]){rig.update(t-.001);const a=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(t+.001);assert.ok(a.distanceTo(rig.camera.position)<.2);assert.ok(q.angleTo(rig.camera.quaternion)<.04);}}
  assert.deepEqual(scenesAt(76),['electromagnetic']);assert.deepEqual(scenesAt(77),['electromagnetic','lightSpeed']);assert.deepEqual(scenesAt(80),['lightSpeed']);
 });


test('shot07 matches both position and velocity at90 and is deterministic after backwards seeks',()=>{
 for(const width of [1280,390]){globalThis.innerWidth=width;globalThis.innerHeight=810;const rig=new CinematicCameraRig();rig.update(89.999);const p=rig.camera.position.clone();rig.update(90);const at=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(90.001);assert.ok(at.clone().sub(p).multiplyScalar(1000).distanceTo(rig.camera.position.clone().sub(at).multiplyScalar(1000))<.12);assert.ok(q.angleTo(rig.camera.quaternion)<.01);
 for(const t of [94,97,101,105,108,110]){rig.update(t);const p=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(42);rig.update(t);assert.ok(p.distanceTo(rig.camera.position)<1e-10);assert.ok(q.angleTo(rig.camera.quaternion)<1e-7);}}
 assert.deepEqual(scenesAt(90),['lightSpeed']);assert.deepEqual(scenesAt(90.001),['dispersion']);
});


test('stellar camera has continuous entry/exit velocity, no orientation flips, and reproducible seeks',()=>{
 for(const width of [1440,390]){globalThis.innerWidth=width;globalThis.innerHeight=810;const rig=new CinematicCameraRig();
 for(const t of [110,115,119,123,127,130,132,135]){rig.update(t-.001);const p=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(t);const a=rig.camera.position.clone();rig.update(t+.001);assert.ok(a.clone().sub(p).multiplyScalar(1000).distanceTo(rig.camera.position.clone().sub(a).multiplyScalar(1000))<.16);assert.ok(q.angleTo(rig.camera.quaternion)<.02);}
 for(const t of [110,115,119,123,127,132,135,137]){rig.update(t);const p=rig.camera.position.clone(),q=rig.camera.quaternion.clone(),f=rig.camera.fov;rig.update(12);rig.update(t);assert.deepEqual(rig.camera.position,p);assert.ok(q.angleTo(rig.camera.quaternion)<1e-7);assert.equal(rig.camera.fov,f);}
 }
 assert.deepEqual(scenesAt(106),['dispersion','stellar']);assert.deepEqual(scenesAt(115),['stellar']);assert.deepEqual(scenesAt(137),['stellar','earth']);
});


test('ending camera is continuous and end title completes at170',()=>{
 for(const width of [1440,390]){globalThis.innerWidth=width;globalThis.innerHeight=810;const rig=new CinematicCameraRig();for(const t of [135,139,143,145,148,151,155,159,162,166]){rig.update(t-.001);const p=rig.camera.position.clone(),q=rig.camera.quaternion.clone();rig.update(t+.001);assert.ok(p.distanceTo(rig.camera.position)<.3,`position ${t}`);assert.ok(q.angleTo(rig.camera.quaternion)<.04,`angle ${t}`);}rig.update(168);const p=rig.camera.position.clone();rig.update(3);rig.update(168);assert.deepEqual(rig.camera.position,p);}
 const film=new MasterTimeline();film.seek(168);assert.equal(film.caption.text,'LUMEN');film.seek(170);assert.equal(film.caption.opacity,0);film.dispose();
});
