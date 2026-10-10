import { AdditiveBlending,BufferAttribute,BufferGeometry,CanvasTexture,DoubleSide,Group,Mesh,MeshBasicMaterial,NormalBlending,PlaneGeometry,Points,ShaderMaterial,Sprite,SpriteMaterial,Texture,Vector3 } from 'three';
import { disposeGroup,type ChapterScene } from '../core/SceneManager';
import { propagationPosition } from '../utils/propagation';
import { smooth } from '../utils/cinematic';
import { random } from '../utils/random';
import { fieldVertex,fieldFragment,cloudVertex,cloudFragment,detectionVertex,detectionFragment,sampleVertex,sampleFragment,hazeVertex,hazeFragment } from '../shaders/electromagnetic';
/** Classical fields and a separate, uniform-illumination detection schematic. No interference apparatus is implied. */
export class ElectromagneticFieldScene implements ChapterScene {
 readonly root=new Group();private textures:Texture[]=[];private detector=new Group();private labels:Sprite[]=[];
 private common={uTime:{value:58},uSpread:{value:0},uPortrait:{value:0},uCollapse:{value:1},uOpacity:{value:0}};
 private detectorOpacity={value:0};private panel:Mesh;private opacity=1;
 constructor(mobile:boolean){
  this.common.uPortrait.value=mobile?1:0;propagationPosition(58,mobile,this.root.position);
  const p:number[]=[],axes:number[]=[],along:number[]=[],offsets:number[]=[],magnitudes:number[]=[],widths:number[]=[],kinds:number[]=[],idx:number[]=[];
  // A fine core, soft edge and separated neighbouring field samples; never helices.
  for(let axis=0;axis<2;axis++)for(let layer=0;layer<22;layer++){
   const kind=layer===0?0:layer===1?.5:1,offset=layer<8&&layer>1?(layer-4.5)*.045:0,width=layer===0?.009:layer===1?.055:.003;const magnitude=layer<8?1:.1+(layer-8)/14*.86;
   for(let j=0;j<=768;j++){const n=p.length/3,u=j/768;for(const sign of [-1,1]){p.push(sign,0,0);axes.push(axis);along.push(u);offsets.push(offset);magnitudes.push(magnitude);widths.push(width);kinds.push(kind);}if(j<768)idx.push(n,n+2,n+1,n+1,n+2,n+3);}
  }
  // Field direction samples: attached to the axis, not extra photon paths.
  for(let axis=0;axis<2;axis++)for(let j=0;j<=64;j++){
   const n=p.length/3,u=j/64;
   for(const [sign,fraction] of [[-1,0],[1,0],[-1,1],[1,1]]){p.push(sign,fraction,0);axes.push(axis);along.push(u);offsets.push(0);magnitudes.push(1);widths.push(.004);kinds.push(2);}
   idx.push(n,n+2,n+1,n+1,n+2,n+3);
  }
  // Translucent field sheets fill the space between each field vector and its axis.
  for(let axis=0;axis<2;axis++)for(let j=0;j<768;j++){const n=p.length/3;for(const [u,f] of [[j/768,0],[j/768,1],[(j+1)/768,0],[(j+1)/768,1]]){p.push(0,f,0);axes.push(axis);along.push(u);offsets.push(0);magnitudes.push(1);widths.push(0);kinds.push(3);}idx.push(n,n+2,n+1,n+1,n+2,n+3);}
  const g=new BufferGeometry();for(const [name,array,size] of [['position',p,3],['aAxis',axes,1],['aAlong',along,1],['aOffset',offsets,1],['aMagnitude',magnitudes,1],['aWidth',widths,1],['aKind',kinds,1]] as [string,number[],number][]){g.setAttribute(name,new BufferAttribute(new Float32Array(array),size));}g.setIndex(idx);
  const fields=new Mesh(g,new ShaderMaterial({uniforms:this.common,vertexShader:fieldVertex,fragmentShader:fieldFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));fields.frustumCulled=false;this.root.add(fields);
  const rng=random(50621),count=mobile?750:2300,cp=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){const x=(rng()-.5)*72,a=rng()*6.283,r=3+Math.pow(rng(),.7)*19;cp.set([x,Math.cos(a)*r,Math.sin(a)*r-5],i*3);seeds[i]=rng();}
  const cg=new BufferGeometry();cg.setAttribute('position',new BufferAttribute(cp,3));cg.setAttribute('aSeed',new BufferAttribute(seeds,1));const stars=new Points(cg,new ShaderMaterial({uniforms:this.common,vertexShader:cloudVertex,fragmentShader:cloudFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));stars.frustumCulled=false;this.root.add(stars);
  const samples=mobile?850:2400,sp=new Float32Array(samples*3),sa=new Float32Array(samples),sm=new Float32Array(samples),ss=new Float32Array(samples);
  for(let i=0;i<samples;i++){sp.set([(rng()-.5)*24,(rng()-.5)*.07,(rng()-.5)*.07],i*3);sa[i]=i%2;sm[i]=.05+Math.pow(rng(),.5)*.95;ss[i]=rng();}
  const sg=new BufferGeometry();sg.setAttribute('position',new BufferAttribute(sp,3));sg.setAttribute('aAxis',new BufferAttribute(sa,1));sg.setAttribute('aMagnitude',new BufferAttribute(sm,1));sg.setAttribute('aSeed',new BufferAttribute(ss,1));const sampling=new Points(sg,new ShaderMaterial({uniforms:this.common,vertexShader:sampleVertex,fragmentShader:sampleFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));sampling.frustumCulled=false;this.root.add(sampling);
  for(let layer=0;layer<3;layer++){const haze=new Mesh(new PlaneGeometry(65,28),new ShaderMaterial({uniforms:this.common,vertexShader:hazeVertex,fragmentShader:hazeFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));haze.position.set(layer*3,(layer-1)*5,-10-layer*8);haze.rotation.z=layer*.3-.3;this.root.add(haze);}
  // Reference plane normal +X; a subtle beam axis and arrow indicate E cross B.
  const axis=new Mesh(new PlaneGeometry(25,.008),new MeshBasicMaterial({color:0xb57c36,transparent:true,opacity:.24,depthWrite:false,side:DoubleSide}));axis.material.userData.baseOpacity=.24;this.root.add(axis);
  const arrowGeo=new BufferGeometry();arrowGeo.setAttribute('position',new BufferAttribute(new Float32Array([12,0,0,11.45,.18,0,11.45,-.18,0]),3));arrowGeo.setIndex([0,1,2]);const arrow=new Mesh(arrowGeo,new MeshBasicMaterial({color:0xffca6d,transparent:true,opacity:.5,side:DoubleSide,depthWrite:false}));arrow.material.userData.baseOpacity=.5;this.root.add(arrow);
  this.label('E · 电场',new Vector3(-4,3,0),'#62d4ff');this.label('B · 磁场',new Vector3(1,-.5,3),'#b784ff');this.label('+X · 传播方向',new Vector3(10,-1,0),'#e4bc7a');
  this.detector.position.set(9,0,-5);this.root.add(this.detector);
  this.panel=new Mesh(new PlaneGeometry(5.4,5.4),new MeshBasicMaterial({color:0x254e6b,transparent:true,opacity:0,depthWrite:false,depthTest:true,side:DoubleSide,blending:NormalBlending}));this.panel.rotation.y=Math.PI/2;this.detector.add(this.panel);
  const dp=new Float32Array(96*3),events=new Float32Array(96);
  for(let i=0;i<96;i++){dp.set([.015,(rng()-.5)*4.7,(rng()-.5)*4.7],i*3);events[i]=i<6?i*.22:1.32+(i-6)*.026;}
  const dg=new BufferGeometry();dg.setAttribute('position',new BufferAttribute(dp,3));dg.setAttribute('aEvent',new BufferAttribute(events,1));const dots=new Points(dg,new ShaderMaterial({uniforms:{uTime:this.common.uTime,uOpacity:this.detectorOpacity},vertexShader:detectionVertex,fragmentShader:detectionFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));dots.frustumCulled=false;this.detector.add(dots);
  this.label('探测面 · 离散事件',new Vector3(9,3.15,-5),'#f7d494',true);
 }
 private label(text:string,position:Vector3,color:string,detect=false){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const context=canvas.getContext('2d')!;context.font='28px sans-serif';context.fillStyle=color;context.textAlign='center';context.fillText(text,256,48);const texture=new CanvasTexture(canvas);this.textures.push(texture);const sprite=new Sprite(new SpriteMaterial({map:texture,transparent:true,depthTest:true,depthWrite:false,opacity:0}));sprite.position.copy(position);sprite.scale.set(4.5,.7,1);sprite.userData.detect=detect;this.labels.push(sprite);this.root.add(sprite);}
 update(time:number,_progress:number){this.common.uTime.value=time;this.common.uSpread.value=smooth(58,64,time);this.common.uCollapse.value=1-smooth(76,79.5,time);this.common.uOpacity.value=this.opacity*smooth(58,60.8,time)*(1-smooth(77,80,time));this.detectorOpacity.value=this.opacity*smooth(67.4,68.5,time)*(1-smooth(72,74,time));(this.panel.material as MeshBasicMaterial).opacity=this.detectorOpacity.value*.12;this.root.traverse(o=>{if(o instanceof Mesh&&o.material instanceof MeshBasicMaterial&&o.material.userData.baseOpacity)o.material.opacity=o.material.userData.baseOpacity*this.common.uOpacity.value;});for(const label of this.labels)(label.material as SpriteMaterial).opacity=label.userData.detect?this.detectorOpacity.value:this.common.uOpacity.value*.75;}
 setOpacity(value:number){this.opacity=value;this.update(this.common.uTime.value,0);}
 dispose(){this.labels.forEach(s=>(s.material as SpriteMaterial).dispose());this.textures.forEach(t=>t.dispose());disposeGroup(this.root);}
}
