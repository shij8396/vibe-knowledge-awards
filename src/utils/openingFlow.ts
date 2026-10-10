import { CatmullRomCurve3, DataTexture, FloatType, RGBAFormat, Vector3 } from 'three';
import { random } from './random';

export interface EnergyChannel { curve: CatmullRomCurve3; kind: number; width: number; seed: number }
export const FLOW_SAMPLES = 128;
/** Shared spatial channels for tubes and particles. Artistic energy imagery, not electron paths. */
export function createOpeningFlow() {
 const rng=random(932771),channels:EnergyChannel[]=[];
 const add=(points:Vector3[],kind:number,width:number)=>channels.push({curve:new CatmullRomCurve3(points,false,'centripetal'),kind,width,seed:rng()});
 const v=(x:number,y:number,z:number)=>new Vector3(x,y,z);
 const trunks=[
  [v(-10,-2,4),v(-6,-.5,2.8),v(-3,1.7,1),v(-1.3,.7,.5),v(.2,.1,-.5),v(.1,-.1,-1.5)],
  [v(8,5,-4),v(5,2,-2),v(2.8,-1.2,-.5),v(1,-.6,.3),v(.15,.05,-.7),v(-.2,.1,-1.6)],
  [v(2,-8,6),v(-2,-4,3),v(-2,-1.6,-.6),v(-.7,.1,-.8),v(.2,.15,-1.2),v(.1,0,-1.7)],
  [v(-5,7,-6),v(-1,4,-3),v(2,2,1),v(1,.5,1.1),v(.1,-.2,-.5),v(-.1,0,-1.4)],
 ];
 trunks.forEach(p=>add(p,0,.006));
 for(let i=0;i<28;i++){
  const parent=channels[i%4].curve,t=.25+rng()*.5,start=parent.getPoint(t),end=parent.getPoint(Math.min(.98,t+.15+rng()*.3));
  const direction=v(rng()-.5,rng()-.5,rng()-.5).normalize(),outside=start.clone().addScaledVector(direction,1+rng()*3.4);
  add([outside.clone().add(v((rng()-.5)*2,(rng()-.5)*2,(rng()-.5)*2)),outside,start.clone().addScaledVector(direction,.45),start,end],1,.0015+rng()*.002);
 }
 // Open, irregular internal channels surround the camera corridor; no enclosing sphere shell.
 for(let i=0;i<22;i++){
  const phase=rng()*Math.PI*2,radius=.25+rng()*.9,turn=(rng()-.5)*2.4,points:Vector3[]=[];
  for(let j=0;j<9;j++){
   const t=j/8,a=phase+turn*t+.18*Math.sin(t*8+phase),r=radius*(.7+.3*Math.sin(t*5+phase));
   points.push(v(Math.cos(a)*r+.12*Math.sin(t*6),Math.sin(a)*r*.8,1.25-t*2.8));
  }
  add(points,2,.0015+rng()*.002);
 }
 // Intermediate knots bridge outer channels and the internal corridor; they are not repeated orbit rings.
 for(let i=0;i<18;i++){
  const parent=channels[i%4].curve,start=parent.getPoint(.55+rng()*.22),end=channels[32+i%22].curve.getPoint(.35+rng()*.45);
  const offset=v((rng()-.5)*3,(rng()-.5)*3,(rng()-.5)*2.5);
  add([start,start.clone().addScaledVector(offset,.8),start.clone().lerp(end,.4).add(offset),end.clone().addScaledVector(offset,.25),end],2,.001+rng()*.0015);
 }
 const data=new Float32Array(FLOW_SAMPLES*channels.length*4);
 channels.forEach((channel,row)=>{
  for(let j=0;j<FLOW_SAMPLES;j++){
   const p=channel.curve.getPoint(j/(FLOW_SAMPLES-1)),offset=(row*FLOW_SAMPLES+j)*4;
   data.set([p.x,p.y,p.z,channel.width],offset);
  }
 });
 const texture=new DataTexture(data,FLOW_SAMPLES,channels.length,RGBAFormat,FloatType);texture.needsUpdate=true;
 return {channels,texture};
}
