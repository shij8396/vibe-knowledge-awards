import { AdditiveBlending,BufferAttribute,BufferGeometry,CanvasTexture,Group,Mesh,Points,ShaderMaterial,SphereGeometry,Sprite,SpriteMaterial,Vector3,type WebGLRenderer,type PerspectiveCamera } from 'three';
import { disposeGroup,type ChapterScene } from '../core/SceneManager';
import { SolarCorona } from './SolarCorona';
import { StellarInterior } from './StellarInterior';
import { FusionVisualization } from './FusionVisualization';
import { solarVertex,solarSurfaceFragment } from '../shaders/solar';
import { dustVertex,dustFragment } from '../shaders/spectrum';
import { STELLAR_CENTER,STELLAR_RADIUS as R,stellarState } from '../utils/stellar';
import { propagationPosition } from '../utils/propagation';
import { smooth } from '../utils/cinematic';
import { random } from '../utils/random';

export class StellarScene implements ChapterScene{
 readonly root=new Group();private time=106;private opacity=1;private fusion=new FusionVisualization();private labels:Sprite[]=[];private textures:CanvasTexture[]=[];private labelPosition=new Vector3();
 private shared={uTime:{value:106},uReveal:{value:0},uCut:{value:0},uTransport:{value:0},uFusion:{value:0},uDetail:{value:74}};
 private dust={uTime:this.shared.uTime,uOpacity:{value:0}};private outgoing={uTime:this.shared.uTime,uReveal:{value:0}};
 constructor(mobile:boolean){
  propagationPosition(58,mobile,this.root.position);this.root.position.add(STELLAR_CENTER);this.shared.uDetail.value=mobile?52:74;
  const surface=new Mesh(new SphereGeometry(R,mobile?80:128,mobile?56:88),new ShaderMaterial({uniforms:this.shared,vertexShader:solarVertex,fragmentShader:solarSurfaceFragment,transparent:true,depthWrite:true,depthTest:true}));surface.frustumCulled=false;this.root.add(surface,new SolarCorona(mobile,this.shared).root,new StellarInterior(mobile,this.shared).root,this.fusion.root);
  const rng=random(80801),count=mobile?900:2600,positions=new Float32Array(count*3),seeds=new Float32Array(count);
  for(let i=0;i<count;i++){const band=i%4;positions.set([(rng()-.5)*240,(rng()-.5)*190,band===0?12+rng()*30:-25-rng()*190],i*3);seeds[i]=rng();}
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(positions,3));g.setAttribute('aSeed',new BufferAttribute(seeds,1));const stars=new Points(g,new ShaderMaterial({uniforms:this.dust,vertexShader:dustVertex,fragmentShader:dustFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));stars.frustumCulled=false;this.root.add(stars);
  // Short, outward wavefront streaks start at the photosphere, never at the core.
  const p:number[]=[],a:number[]=[],seed:number[]=[],indices:number[]=[];
  for(let i=0;i<24;i++){const angle=i*2.399,dir=new Vector3(Math.cos(angle),Math.sin(angle),(rng()-.5)*1.5).normalize();for(let j=0;j<=24;j++){const u=j/24,point=dir.clone().multiplyScalar(R+u*44),n=p.length/3;for(const sign of [-1,1]){p.push(point.x,point.y+.008*sign,point.z);a.push(u);seed.push(i/24);}if(j<24)indices.push(n,n+2,n+1,n+1,n+2,n+3);}}
  const rays=new BufferGeometry();rays.setAttribute('position',new BufferAttribute(new Float32Array(p),3));rays.setAttribute('aAlong',new BufferAttribute(new Float32Array(a),1));rays.setAttribute('aSeed',new BufferAttribute(new Float32Array(seed),1));rays.setIndex(indices);
  const emission=new Mesh(rays,new ShaderMaterial({uniforms:this.outgoing,vertexShader:'attribute float aAlong,aSeed;varying float vAlong,vSeed;void main(){vAlong=aAlong;vSeed=aSeed;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uTime,uReveal;varying float vAlong,vSeed;void main(){if(uReveal<.001)discard;float head=fract((uTime-133.)*.18+vSeed);float a=exp(-pow((vAlong-head)*12.,2.))*(1.-vAlong)*uReveal*.34;gl_FragColor=vec4(1.4,.85,.38,a);}',transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));emission.frustumCulled=false;this.root.add(emission);
  this.label('核心',new Vector3(2.2,-2.3,.6));this.label('辐射区',new Vector3(6.2,-4,.6));this.label('对流区',new Vector3(10.4,-3,.6));this.label('光球层',new Vector3(12.6,1,.6));
 }
 private label(text:string,position:Vector3){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d')!;ctx.font='32px Microsoft YaHei,sans-serif';ctx.fillStyle=text==='核心'?'#4d2b15':'#ddcdb5';ctx.textAlign='center';ctx.fillText(text,256,58);const t=new CanvasTexture(c),s=new Sprite(new SpriteMaterial({map:t,depthWrite:false,depthTest:false,transparent:true,opacity:0}));s.renderOrder=16;s.position.copy(position);this.labels.push(s);this.textures.push(t);this.root.add(s);}
 updateView(camera:PerspectiveCamera){for(const label of this.labels){const d=label.getWorldPosition(this.labelPosition).distanceTo(camera.position);label.scale.set(d*.2,d*.0375,1);this.labelPosition.project(camera);label.visible=Math.abs(this.labelPosition.x)<.87&&Math.abs(this.labelPosition.y)<.78&&Math.abs(this.labelPosition.z)<1;}}
 update(t:number,_progress:number){this.time=t;const s=stellarState(t);this.shared.uTime.value=t;this.shared.uReveal.value=s.reveal*this.opacity;this.shared.uCut.value=s.cut;this.shared.uTransport.value=s.transport;this.shared.uFusion.value=smooth(124.2,125,t)*(1-smooth(130,132,t));this.dust.uOpacity.value=this.opacity*smooth(110,115,t);this.outgoing.uReveal.value=s.radiation*this.opacity;this.fusion.update(t);for(const label of this.labels)(label.material as SpriteMaterial).opacity=s.cut*smooth(121,123,t)*(1-smooth(124.5,125,t))*.85;}
 prepareTextures(renderer:WebGLRenderer){this.textures.forEach(t=>renderer.initTexture(t));this.fusion.prepareTextures(renderer);}
 setOpacity(value:number){this.opacity=value;this.update(this.time,0);}
 dispose(){this.fusion.dispose();this.labels.forEach(s=>(s.material as SpriteMaterial).dispose());this.textures.forEach(t=>t.dispose());disposeGroup(this.root);}
}
