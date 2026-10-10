import { AdditiveBlending,BufferAttribute,BufferGeometry,CanvasTexture,DoubleSide,Group,Mesh,Points,ShaderMaterial,Sprite,SpriteMaterial,Vector3,type PerspectiveCamera } from 'three';
import { disposeGroup,type ChapterScene } from '../core/SceneManager';
import { LightSpeedScene } from './LightSpeedScene';
import { spectrumRays,displayDirection,tracePrism,type OpticalRay } from '../utils/OpticalRayTracer';
import { propagationPosition } from '../utils/propagation';
import { smooth } from '../utils/cinematic';
import { random } from '../utils/random';
import { spectrumVertex,spectrumFragment,dustVertex,dustFragment } from '../shaders/spectrum';

/** The existing prism/environment stays spatially identical at the shot boundary.
 * Geometry is sampled once; only wavefront uniforms and captions change during playback. */
export class PrismDispersionScene implements ChapterScene {
 readonly root=new Group();private base:LightSpeedScene;private optics=new Group();private time=90;private opacity=1;
 private labels:Sprite[]=[];private textures:CanvasTexture[]=[];private labelPoint=new Vector3();
 private shared={uTime:{value:90},uReveal:{value:0},uLength:{value:0},uOpacity:{value:1},uInside:{value:0}};
 private inside={...this.shared,uReveal:{value:0},uLength:{value:4},uOpacity:{value:.34},uInside:{value:1}};
 private incoming={...this.shared,uReveal:{value:0},uLength:{value:40},uOpacity:{value:.65},uInside:{value:1}};
 private dust={uTime:this.shared.uTime,uOpacity:{value:0}};private receiving:Mesh;private warm:Mesh;
 constructor(mobile:boolean){
  this.base=new LightSpeedScene(mobile,true);this.root.add(this.base.root);propagationPosition(58,mobile,this.optics.position);this.root.add(this.optics);
  const rays=spectrumRays(mobile?40:64);
  this.optics.add(this.sheet(rays,0),this.sheet(rays,.09,.16),this.sheet(rays,-.09,.16));
  this.optics.add(this.filaments(rays));
  const insideRays=this.ribbons(rays.map(r=>[r.entry,r.exit,r.nm] as const),this.inside,.006);this.optics.add(insideRays);
  const entry=rays[0].entry,beams=Array.from({length:17},(_,i)=>{
   const offset=new Vector3(0,(i%5-2)*.011,(Math.floor(i/5)-1)*.012);
   return [new Vector3(160,0,-3).add(offset),entry.clone().add(offset),550] as const;
  });this.optics.add(this.ribbons(beams,this.incoming,.003));
  const rng=random(70707),n=mobile?600:1600,p=new Float32Array(n*3),seed=new Float32Array(n);
  const reference=tracePrism(550);
  for(let i=0;i<n;i++){
   const t=rng()*95,center=reference.exit.clone().addScaledVector(reference.outgoing,t),band=i%4;
   p.set([center.x+(rng()-.5)*25,center.y+(rng()-.5)*(band===0?6:35),center.z-(band===0?2:8)-rng()*(band===3?80:20)],i*3);seed[i]=rng();
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new BufferAttribute(p,3));geometry.setAttribute('aSeed',new BufferAttribute(seed,1));
  this.optics.add(new Points(geometry,new ShaderMaterial({uniforms:this.dust,vertexShader:dustVertex,fragmentShader:dustFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending})));
  // A receiving strip at the physically ordered fan terminus; only weak reflected illumination.
  const receivePaths=rays.map(r=>{const end=r.exit.clone().addScaledVector(displayDirection(r),58);return [end.clone().add(new Vector3(0,0,-.45)),end.clone().add(new Vector3(0,0,.45)),r.nm] as const;});
  this.receiving=this.ribbons(receivePaths,{...this.shared,uReveal:{value:1},uLength:{value:2},uOpacity:{value:0}},.022);this.optics.add(this.receiving);
  this.label('红光 · 较长波长',rays[rays.length-1].exit.clone().addScaledVector(displayDirection(rays[rays.length-1]),26).add(new Vector3(0,1.1,0)),0xffbaa5);
  this.label('紫光 · 较短波长',rays[0].exit.clone().addScaledVector(displayDirection(rays[0]),26).add(new Vector3(0,-1.2,0)),0xc9b4ff);
  // Warm, distant illumination planes, not a completed stellar sphere.
  const warmPosition=reference.exit.clone().addScaledVector(reference.outgoing,95),wg=new BufferGeometry();wg.setAttribute('position',new BufferAttribute(new Float32Array([-18,-12,0,18,-12,0,-18,12,0,18,12,0]),3));wg.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,0,1,1,1]),2));wg.setIndex([0,1,2,2,1,3]);
  this.warm=new Mesh(wg,new ShaderMaterial({uniforms:{uTime:this.shared.uTime,uOpacity:{value:0}},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uTime,uOpacity;void main(){vec2 p=(vUv-.5)*2.;float fog=exp(-dot(p,p)*3.);float shafts=pow(.5+.5*sin(p.y*20.+sin(p.x*7.+uTime*.2)*2.),9.);gl_FragColor=vec4(1.,.58,.17,uOpacity*fog*(.08+shafts*.12));}',transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));this.warm.position.copy(warmPosition);this.optics.add(this.warm);
 }
 private sheet(rays:OpticalRay[],offset:number,strength=.68){
  const p:number[]=[],d:number[]=[],w:number[]=[],edge:number[]=[],indices:number[]=[],steps=72;
  const directions=rays.map(displayDirection);
  for(let i=0;i<rays.length;i++)for(let j=0;j<=steps;j++){
   const r=rays[i],distance=j/steps*120,point=r.exit.clone().addScaledVector(directions[i],distance);point.z+=offset;p.push(...point.toArray());d.push(distance);w.push(r.nm);edge.push(i/(rays.length-1));
   if(i<rays.length-1&&j<steps){const a=i*(steps+1)+j,b=a+steps+1;indices.push(a,b,a+1,a+1,b,b+1);}
  }
  return this.mesh(p,d,w,edge,indices,{...this.shared,uOpacity:{value:strength}});
 }
 private filaments(rays:OpticalRay[]){return this.ribbons(rays.map(r=>[r.exit,r.exit.clone().addScaledVector(displayDirection(r),120),r.nm] as const),{...this.shared,uOpacity:{value:.09}},.004);}
 private ribbons(paths:readonly (readonly [Vector3,Vector3,number])[],uniforms:typeof this.shared,width:number){
  const p:number[]=[],d:number[]=[],w:number[]=[],e:number[]=[],indices:number[]=[];
  for(const [start,end,nm] of paths){const length=start.distanceTo(end),segments=80;
   for(let j=0;j<=segments;j++){const a=p.length/3,point=start.clone().lerp(end,j/segments);for(const sign of [-1,1]){p.push(point.x,point.y+width*sign,point.z);d.push(length*j/segments);w.push(nm);e.push(.5);}if(j<segments)indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }return this.mesh(p,d,w,e,indices,uniforms);
 }
 private mesh(p:number[],d:number[],w:number[],e:number[],indices:number[],uniforms:typeof this.shared){const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('aDistance',new BufferAttribute(new Float32Array(d),1));g.setAttribute('aWavelength',new BufferAttribute(new Float32Array(w),1));g.setAttribute('aEdge',new BufferAttribute(new Float32Array(e),1));g.setIndex(indices);return new Mesh(g,new ShaderMaterial({uniforms,vertexShader:spectrumVertex,fragmentShader:spectrumFragment,transparent:true,depthWrite:false,depthTest:true,side:DoubleSide}));}
 private label(text:string,point:Vector3,color:number){const c=document.createElement('canvas');c.width=768;c.height=96;const ctx=c.getContext('2d')!;ctx.font='40px Microsoft YaHei,sans-serif';ctx.textAlign='center';ctx.fillStyle='#'+color.toString(16);ctx.fillText(text,384,58);const texture=new CanvasTexture(c),label=new Sprite(new SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false,opacity:0}));label.position.copy(point);this.optics.add(label);this.labels.push(label);this.textures.push(texture);}
 updateView(camera:PerspectiveCamera){for(const label of this.labels){const distance=label.getWorldPosition(this.labelPoint).distanceTo(camera.position);label.scale.set(distance*.32,distance*.04,1);this.labelPoint.project(camera);label.visible=Math.abs(this.labelPoint.x)<.9&&Math.abs(this.labelPoint.y)<.78&&Math.abs(this.labelPoint.z)<1;}}
 update(time:number,_progress:number){
  this.time=time;this.base.update(time,0);this.base.setOpacity(this.opacity*(1-smooth(110,115,time)));this.shared.uTime.value=time;this.shared.uReveal.value=this.opacity*smooth(93,98,time)*(1-smooth(110,114,time));this.shared.uLength.value=120*smooth(94,106,time);this.inside.uReveal.value=this.opacity*smooth(90,94,time);this.incoming.uReveal.value=this.opacity*smooth(90,92,time);this.dust.uOpacity.value=this.opacity*smooth(90,94,time);
  for(const label of this.labels)(label.material as SpriteMaterial).opacity=this.opacity*smooth(102,104,time)*(1-smooth(106,108,time));
  (this.receiving.material as ShaderMaterial).uniforms.uOpacity.value=.18*smooth(101,103,time)*(1-smooth(106,108,time));(this.warm.material as ShaderMaterial).uniforms.uOpacity.value=this.opacity*smooth(107,110,time)*(1-smooth(111,115,time));
 }
 setOpacity(value:number){this.opacity=value;this.update(this.time,0);}
 dispose(){this.base.dispose();this.labels.forEach(s=>(s.material as SpriteMaterial).dispose());this.textures.forEach(t=>t.dispose());disposeGroup(this.optics);this.root.clear();}
}
