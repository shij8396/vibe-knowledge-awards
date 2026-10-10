import { CatmullRomCurve3, Vector3 } from 'three';
import { CinematicCameraController } from './CinematicCameraController.ts';
import { sampleShot, type ShotKey } from '../utils/cinematic.ts';
import { EARTH_CENTER,FINALE_CENTER } from '../utils/finale.ts';
import { STELLAR_CENTER } from '../utils/stellar.ts';
import { propagationPosition } from '../utils/propagation.ts';
const key=(time:number,p:number[],t:number[],fov=47):ShotKey=>({time,position:new Vector3(...p),target:new Vector3(...t),fov});
/** Continuous spatial spline, paced by a C1 monotone time parameter. */
export class CinematicCameraRig extends CinematicCameraController {
 private keys=[
   key(0,[3.8,1.1,17],[-1.6,.15,-.8]),key(2,[3.5,1,15.8],[-1.2,.1,-.8]),
   key(4,[2.8,.9,13],[-.9,.15,-.8]),key(6,[.6,1.3,9.7],[-.45,.2,-1]),
   key(8,[-1.1,.85,6.2],[-.2,.1,-1.4]),key(10,[-.5,.32,2.55],[.05,.05,-1.7]),
   key(12,[.25,.15,.7],[.02,0,-2]),key(15,[-3.3,1.6,5.3],[.4,.1,0]),
  key(18,[-4.5,2.1,6],[.4,.1,0]),key(22,[-2.2,1.1,4.3],[.3,.05,0],44),
  key(25,[.6,3.5,7],[.3,-.1,0],45),key(27,[1.8,3.8,8],[.6,.25,0],46),
  key(30,[3,2.7,8.2],[.7,.4,0]),key(34,[3.5,2.1,6.4],[.8,.7,0],45),
  key(38,[3,1.4,6.6],[1,.5,0],46),key(42,[3.4,.9,7.3],[1.3,.4,0]),
  key(45,[14,1.1,6.8],[16,-1.2,0],49),
 ];
 private endingKeys:ShotKey[][]=[];private endingVelocity:Vector3[]=[];private endingAimVelocity:Vector3[]=[];
 private stellarKeys:ShotKey[][]=[];private stellarVelocity:Vector3[]=[];private stellarAimVelocity:Vector3[]=[];private stellarFovVelocity:number[]=[];
 private dispersionKeys:ShotKey[][]=[];private dispersionVelocity:Vector3[]=[];private dispersionAimVelocity:Vector3[]=[];
 private filmPath=new CatmullRomCurve3(this.keys.map(k=>k.position),false,'centripetal');
 private aims=new CatmullRomCurve3(this.keys.map(k=>k.target),false,'centripetal');
 private pos=new Vector3();private aim=new Vector3();private scratch=new Vector3();
 private entryVelocity=new Vector3();private entryAimVelocity=new Vector3();private entryFovVelocity=0;
 private trackingKeys:ShotKey[][]=[];private fieldKeys:ShotKey[][]=[];private fieldVelocity:Vector3[]=[];private fieldAimVelocity:Vector3[]=[];private speedKeys:ShotKey[][]=[];private speedVelocity:Vector3[]=[];private speedAimVelocity:Vector3[]=[];
 constructor(){
  super();this.update(44.999);this.entryVelocity.copy(this.pos);this.entryAimVelocity.copy(this.aim);const f=this.camera.fov;
  this.update(45);this.entryVelocity.subVectors(this.pos,this.entryVelocity).multiplyScalar(1000);this.entryAimVelocity.subVectors(this.aim,this.entryAimVelocity).multiplyScalar(1000);this.entryFovVelocity=(this.camera.fov-f)*1000;
  if(innerWidth<760){this.entryVelocity.z/=1.42;this.entryAimVelocity.x/=.35;}
  // Store world paths for both aspect regimes; the pre-45 spline is never extended or altered.
  this.trackingKeys=[false,true].map(mobile=>{
   const keys=[key(45,[14,1.1,mobile?6.8*1.42:6.8],[mobile?5.6:16,-1.2,0],49)];
   for(const [t,x,y,z,look,fov] of [[47,-3,2,7.5,1,49],[50,-4,1.7,6.5,2,48],[53,-5,1.3,7.5,2,47],[56,-9,2.5,12,1,47],[58,-14,3.5,16,0,48]]){
    const p=propagationPosition(t,mobile,new Vector3()),aim=p.clone().add(new Vector3(-look*(mobile?.18:1),0,0));p.add(new Vector3(x,y,z*(mobile?1.2:1)));
    keys.push({time:t,position:p,target:aim,fov});
   }return keys;
  });
  this.fieldKeys=[false,true].map((mobile,index)=>{
   const keys=this.trackingKeys[index],end=keys[keys.length-1],p=new Vector3(),a=new Vector3();sampleShot(keys,57.999,p,a);
   this.fieldVelocity.push(end.position.clone().sub(p).multiplyScalar(1000));this.fieldAimVelocity.push(end.target.clone().sub(a).multiplyScalar(1000));
   const origin=propagationPosition(58,mobile,new Vector3()),result=[end];
   for(const [time,x,y,z,tx,ty,tz] of [[62,-8,4,18,-1,0,0],[66,-1,7,20,0,0,0],[70,18,4,15,8,0,-4],[74,19,3,8,26,0,0],[76,29,2,6,40,0,0]])result.push({time,position:origin.clone().add(new Vector3(x,y,z*(mobile?1.6:1))),target:origin.clone().add(new Vector3(tx,ty,tz)),fov:48});return result;
  });
  this.speedKeys=[false,true].map((mobile,index)=>{
   const keys=this.fieldKeys[index],end=keys[keys.length-1],p=new Vector3(),a=new Vector3();sampleShot(keys,75.999,p,a);this.speedVelocity.push(end.position.clone().sub(p).multiplyScalar(1000));this.speedAimVelocity.push(end.target.clone().sub(a).multiplyScalar(1000));
   const origin=propagationPosition(58,mobile,new Vector3()),result=[end];
   for(const [time,x,y,z,tx,ty,tz,fov] of [[79,52,4,12,60,0,0,48],[82,54,3,7,60,0,0,48],[84,98,12,58,98,0,0,mobile?54:48],[86,132,2,7,136.88,0,0,48],[87,148,7,23,160,0,-3,48],[88,166,4,14,180,0,-3,48],[90,178,2.5,9,184,0,-3,48]])result.push({time,position:origin.clone().add(new Vector3(x,y,z*(mobile?(time===84?3.6:1.7):1))),target:origin.clone().add(new Vector3(tx,ty,tz)),fov});return result;
  });

  this.dispersionKeys=[false,true].map((mobile,index)=>{
   const keys=this.speedKeys[index],end=keys[keys.length-1],p=new Vector3(),a=new Vector3();sampleShot(keys,89.999,p,a);
   this.dispersionVelocity.push(end.position.clone().sub(p).multiplyScalar(1000));this.dispersionAimVelocity.push(end.target.clone().sub(a).multiplyScalar(1000));
   const origin=propagationPosition(58,mobile,new Vector3()),result=[end];
   for(const [time,x,y,z,tx,ty,tz,fov] of [[94,183,1.8,8,184,-.3,-3,44],[97,185,3.8,10,185,-1,-3,44],[101,193,3,28,197,-9,-3,48],[105,205,-9,19,207,-20,-2.5,48],[108,220,-24,12,232,-40,-1.5,50],[110,239,-39,9,255,-61,-1,50]])result.push({time,position:origin.clone().add(new Vector3(x-(mobile&&time===101?2:0),y,z*(mobile?(time===101?2.5:1.9):1))),target:origin.clone().add(new Vector3(tx-(mobile&&time===101?4:0),ty+(mobile&&time===101?4:0),tz)),fov});return result;
  });

  this.stellarKeys=[false,true].map((mobile,index)=>{
   const keys=this.dispersionKeys[index],end=keys[keys.length-1],p=new Vector3(),a=new Vector3(),f=sampleShot(keys,109.999,p,a);
   this.stellarVelocity.push(end.position.clone().sub(p).multiplyScalar(1000));this.stellarAimVelocity.push(end.target.clone().sub(a).multiplyScalar(1000));this.stellarFovVelocity.push((end.fov-f)*1000);
   const center=propagationPosition(58,mobile,new Vector3()).add(STELLAR_CENTER),result=[end];
   for(const [time,x,y,z,tx,ty,tz,fov] of [[115,-14,8,28,0,1,0,47],[119,-12,5,25,-11,1,0,45],[123,15,5,24,4,0,.4,44],[127,5,.4,7,1.5,0,1,44],[130,7,1.4,12,3,.5,0,44],[132,14,6,22,4,1,0,46],[135,-8,6,37,10,-5,0,48],[137,10,-2,48,25,-15,0,48]])result.push({time,position:center.clone().add(new Vector3(x,y,z*(mobile?(time===115||time===123||time===132?2.5:2):1))),target:center.clone().add(new Vector3(tx,ty,tz)),fov});return result;
  });

  this.endingKeys=[false,true].map((mobile,index)=>{
   const p=new Vector3(),a=new Vector3(),fov=sampleShot(this.stellarKeys[index],135,p,a),start={time:135,position:p.clone(),target:a.clone(),fov};
   const prev=new Vector3(),aimPrev=new Vector3();sampleShot(this.stellarKeys[index],134.999,prev,aimPrev);this.endingVelocity.push(p.clone().sub(prev).multiplyScalar(1000));this.endingAimVelocity.push(a.clone().sub(aimPrev).multiplyScalar(1000));
   const origin=propagationPosition(58,mobile,new Vector3()),earth=origin.clone().add(EARTH_CENTER),finale=origin.clone().add(FINALE_CENTER),result=[start];
   for(const [time,x,y,z,tx,ty,tz] of [[139,-32,12,46,-3,0,0],[143,-14,5,22,-2,0,0],[145,-8,4,17,-2,0,0],[148,-1,5,14,0,0,0],[151,8,4,19,0,0,0],[155,27,-3,38,13,-3,0]])result.push({time,position:earth.clone().add(new Vector3(x,y,z*(mobile?1.9:1))),target:earth.clone().add(new Vector3(tx,ty,tz)),fov:48});
   for(const [time,x,y,z,tx] of [[159,-9,3,26,-3],[162,-4,2,18,-3],[166,-3,1.2,18,-3.2],[170,-3,1.2,18,-3.2]])result.push({time,position:finale.clone().add(new Vector3(x,y,z*(mobile?1.5:1))),target:finale.clone().add(new Vector3(tx,0,0)),fov:48});return result;
  });

 }
 private parameter(t:number){
  let i=0;while(i<this.keys.length-2&&t>this.keys[i+1].time)i++;
  const a=this.keys[i],b=this.keys[i+1],dt=b.time-a.time,u=Math.max(0,Math.min(1,(t-a.time)/dt));
  const prev=this.keys[Math.max(0,i-1)],next=this.keys[Math.min(this.keys.length-1,i+2)];
  const m0=i===0?1/dt:2/(b.time-prev.time),m1=i===this.keys.length-2?1/dt:2/(next.time-a.time);
  const offset=(-2*u*u*u+3*u*u)+(u*u*u-2*u*u+u)*dt*m0+(u*u*u-u*u)*dt*m1;
  return Math.max(0,Math.min(1,(i+offset)/(this.keys.length-1)));
 }
 override update(time:number,reduced=false){
  this.camera.far=time>76?600:120;
  if(time>135){
   const index=innerWidth<760?1:0,keys=this.endingKeys[index],t=Math.min(170,time);this.camera.fov=sampleShot(keys,t,this.pos,this.aim);
   if(t<139){const a=keys[0],b=keys[1],next=keys[2],u=(t-135)/4,h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const){this.pos[axis]=h0*a.position[axis]+h1*4*this.endingVelocity[index][axis]+h2*b.position[axis]+h3*4*(next.position[axis]-a.position[axis])/8;this.aim[axis]=h0*a.target[axis]+h1*4*this.endingAimVelocity[index][axis]+h2*b.target[axis]+h3*4*(next.target[axis]-a.target[axis])/8;}
   }
   if(reduced){this.pos.copy(keys[t<155?3:9].position);this.aim.copy(keys[t<155?3:9].target);}
   this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();return;
  }
  if(time>110){
   const index=innerWidth<760?1:0,keys=this.stellarKeys[index],t=Math.min(137,time);this.camera.fov=sampleShot(keys,t,this.pos,this.aim);
   if(t<115){const a=keys[0],b=keys[1],next=keys[2],u=(t-110)/5,h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const){this.pos[axis]=h0*a.position[axis]+h1*5*this.stellarVelocity[index][axis]+h2*b.position[axis]+h3*5*(next.position[axis]-a.position[axis])/9;this.aim[axis]=h0*a.target[axis]+h1*5*this.stellarAimVelocity[index][axis]+h2*b.target[axis]+h3*5*(next.target[axis]-a.target[axis])/9;}
    this.camera.fov=h0*a.fov+h1*5*this.stellarFovVelocity[index]+h2*b.fov+h3*5*(next.fov-a.fov)/9;
   }
   if(reduced){this.pos.copy(keys[3].position);this.aim.copy(keys[3].target);}
   this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();return;
  }
  if(time>90){
   const index=innerWidth<760?1:0,keys=this.dispersionKeys[index],t=Math.min(110,time);this.camera.fov=sampleShot(keys,t,this.pos,this.aim);
   if(t<94){const a=keys[0],b=keys[1],next=keys[2],u=(t-90)/4,h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const){this.pos[axis]=h0*a.position[axis]+h1*4*this.dispersionVelocity[index][axis]+h2*b.position[axis]+h3*4*(next.position[axis]-a.position[axis])/7;this.aim[axis]=h0*a.target[axis]+h1*4*this.dispersionAimVelocity[index][axis]+h2*b.target[axis]+h3*4*(next.target[axis]-a.target[axis])/7;}
   }
   if(reduced){this.pos.copy(keys[3].position);this.aim.copy(keys[3].target);}
   this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();return;
  }
  if(time>76){
   const index=innerWidth<760?1:0,keys=this.speedKeys[index],t=Math.min(90,time);this.camera.fov=sampleShot(keys,t,this.pos,this.aim);
   if(t<79){const a=keys[0],b=keys[1],next=keys[2],u=(t-76)/3,h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const){this.pos[axis]=h0*a.position[axis]+h1*3*this.speedVelocity[index][axis]+h2*b.position[axis]+h3*3*(next.position[axis]-a.position[axis])/6;this.aim[axis]=h0*a.target[axis]+h1*3*this.speedAimVelocity[index][axis]+h2*b.target[axis]+h3*3*(next.target[axis]-a.target[axis])/6;}
   }
   if(reduced){this.pos.copy(keys[3].position);this.aim.copy(keys[3].target);}
   this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();return;
  }
  if(time>58){
   const index=innerWidth<760?1:0,keys=this.fieldKeys[index],t=Math.min(76,time);this.camera.fov=sampleShot(keys,t,this.pos,this.aim);
   if(t<62){const a=keys[0],b=keys[1],next=keys[2],u=(t-58)/4,h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const){this.pos[axis]=h0*a.position[axis]+h1*4*this.fieldVelocity[index][axis]+h2*b.position[axis]+h3*4*(next.position[axis]-a.position[axis])/8;this.aim[axis]=h0*a.target[axis]+h1*4*this.fieldAimVelocity[index][axis]+h2*b.target[axis]+h3*4*(next.target[axis]-a.target[axis])/8;}
   }
   if(reduced){this.pos.copy(keys[2].position);this.aim.copy(keys[2].target);}
   this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();return;
  }
  if(time>45){
   const mobile=innerWidth<760,keys=this.trackingKeys[mobile?1:0],t=Math.min(58,time);
   this.camera.fov=sampleShot(keys,t,this.pos,this.aim);
   if(t<47){
    const a=keys[0],b=keys[1],next=keys[2],u=(t-45)/2,h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const){
     const pv=this.entryVelocity[axis]*(mobile&&axis==='z'?1.42:1),tv=this.entryAimVelocity[axis]*(mobile&&axis==='x'?.35:1);
     this.pos[axis]=h0*a.position[axis]+h1*2*pv+h2*b.position[axis]+h3*2*(next.position[axis]-a.position[axis])/5;
     this.aim[axis]=h0*a.target[axis]+h1*2*tv+h2*b.target[axis]+h3*2*(next.target[axis]-a.target[axis])/5;
    }
    this.camera.fov=h0*a.fov+h1*2*this.entryFovVelocity+h2*b.fov+h3*2*(next.fov-a.fov)/5;
   }
   if(reduced){const p=propagationPosition(t,mobile,this.scratch);this.pos.copy(p);this.pos.x-=5;this.pos.y+=2;this.pos.z+=12;this.aim.copy(p);}
   this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();return;
  }
  const t=Math.max(0,Math.min(45,time)),u=this.parameter(t);
  this.filmPath.getPoint(u,this.pos);this.aims.getPoint(u,this.aim);
  this.camera.fov=sampleShot(this.keys,t,this.scratch,this.scratch);
  if(reduced){this.pos.set(0,1,10);this.aim.set(0,0,0);}
  if(innerWidth<760){this.pos.z*=1.42;this.aim.x*=.35;}
  this.camera.position.copy(this.pos);this.camera.lookAt(this.aim);this.camera.updateProjectionMatrix();
 }
}

