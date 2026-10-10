import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, ShaderMaterial, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { disposeGroup, type ChapterScene } from '../core/SceneManager';
import { random } from '../utils/random';
import { smooth } from '../utils/cinematic';
import { propagationDistance, propagationPosition, propagationReveal } from '../utils/propagation';
import { environmentVertex,environmentFragment,pulseVertex,pulseFragment,trailVertex,trailFragment,fieldVertex,fieldFragment } from '../shaders/propagation';

/** Spatial emission envelope and bounded trails: artistic symbols, never material ejected by a photon. */
export class PhotonPropagationScene implements ChapterScene {
 readonly root=new Group();private carrier=new Group();private mobile:boolean;
 private common={uTime:{value:45},uOpacity:{value:0},uField:{value:0},uSpeed:{value:8.8},uRatio:{value:1},uSource:{value:this.carrier.position}};
 private environmentOpacity={value:0};private envelopeOpacity={value:0};
 constructor(mobile:boolean){
  this.mobile=mobile;const rng=random(490371);this.root.add(this.carrier);
  const envelope=new BufferGeometry(),positions:number[]=[],indices:number[]=[];
  for(let j=0;j<=48;j++){const u=j/48,x=-1.1+u*2,rad=.018+Math.pow(Math.sin(u*Math.PI),1.5)*.18*(.8+.2*Math.sin(u*15));
   for(let k=0;k<=24;k++){const a=k/24*Math.PI*2;positions.push(x,Math.cos(a)*rad,Math.sin(a)*rad*.8);if(j<48&&k<24){const i=j*25+k;indices.push(i,i+25,i+1,i+1,i+25,i+26);}}
  }
  envelope.setAttribute('position',new BufferAttribute(new Float32Array(positions),3));envelope.setIndex(indices);envelope.computeVertexNormals();
  for(let layer=0;layer<3;layer++){const mesh=new Mesh(envelope,new ShaderMaterial({uniforms:{...this.common,uOpacity:this.envelopeOpacity,uLayer:{value:layer}},vertexShader:pulseVertex,fragmentShader:pulseFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));mesh.scale.set(1+layer*.12,1+layer*.8,1+layer*.8);this.carrier.add(mesh);}
  const axisCore=new Mesh(envelope,new ShaderMaterial({uniforms:{...this.common,uOpacity:this.envelopeOpacity,uLayer:{value:-.35}},vertexShader:pulseVertex,fragmentShader:pulseFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));axisCore.scale.set(.8,.4,.4);this.carrier.add(axisCore);
  const trails:BufferGeometry[]=[];
  for(let i=0;i<(mobile?26:58);i++){
   const p:number[]=[],seed:number[]=[],along:number[]=[],idx:number[]=[],phase=rng()*Math.PI*2,length=2+rng()*9,radius=.035+rng()*.24,width=.0015+rng()*.003;
   for(let j=0;j<=60;j++){const u=j/60,x=-length*(1-u),r=radius*(.3+.7*(1-u)),a=phase+Math.sin(u*7+phase)*.2,y=Math.cos(a)*r,z=Math.sin(a)*r;
    p.push(x,y-width,z,x,y+width,z);seed.push(i/58,i/58);along.push(u,u);if(j<60){const n=j*2;idx.push(n,n+2,n+1,n+1,n+2,n+3);}
   }
   const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('aSeed',new BufferAttribute(new Float32Array(seed),1));g.setAttribute('aAlong',new BufferAttribute(new Float32Array(along),1));g.setIndex(idx);trails.push(g);
  }
  const trail=mergeGeometries(trails)!;trails.forEach(g=>g.dispose());this.carrier.add(new Mesh(trail,new ShaderMaterial({uniforms:{...this.common,uOpacity:this.envelopeOpacity},vertexShader:trailVertex,fragmentShader:trailFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide})));
  const count=mobile?1800:5600,centers=new Float32Array(count*3),sizes=new Float32Array(count),seeds=new Float32Array(count),layers=new Float32Array(count);
  for(let i=0;i<count;i++){
   const layer=i<count*.13?0:i<count*.66?1:2,x=8+rng()*160;
   const a=rng()*Math.PI*2,r=layer===0?3+rng()*6:layer===1?2+rng()*9:11+rng()*17;
   const knot=1+.35*Math.sin(x*.22)+.2*Math.sin(x*.7);
   centers.set([x,Math.cos(a)*r*knot-1,Math.sin(a)*r*(layer===2?1.3:1)],i*3);sizes[i]=.4+rng()*1.5;seeds[i]=rng();layers[i]=layer;
  }
  const particles=new InstancedBufferGeometry();particles.setAttribute('position',new BufferAttribute(new Float32Array([-1,-1,0,1,-1,0,-1,1,0,1,1,0]),3));particles.setAttribute('uv',new BufferAttribute(new Float32Array([0,0,1,0,0,1,1,1]),2));particles.setIndex([0,1,2,2,1,3]);
  particles.setAttribute('aCenter',new InstancedBufferAttribute(centers,3));particles.setAttribute('aSize',new InstancedBufferAttribute(sizes,1));particles.setAttribute('aSeed',new InstancedBufferAttribute(seeds,1));particles.setAttribute('aLayer',new InstancedBufferAttribute(layers,1));particles.instanceCount=count;
  const environment=new Mesh(particles,new ShaderMaterial({uniforms:{...this.common,uOpacity:this.environmentOpacity},vertexShader:environmentVertex,fragmentShader:environmentFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));environment.frustumCulled=false;this.root.add(environment);
  const wisps=new BufferGeometry(),wp:number[]=[],wa:number[]=[],ws:number[]=[],wi:number[]=[];
  for(let i=0;i<(mobile?10:24);i++){
   const start=10+rng()*130,length=8+rng()*20,phase=rng()*6.28,height=(rng()-.5)*16,depth=-4-rng()*15;
   for(let j=0;j<=48;j++){const u=j/48,n=wp.length/3,x=start+u*length,y=height+Math.sin(u*4+phase)*1.2,z=depth+Math.sin(u*3+phase)*2;
    wp.push(x,y-.008,z,x,y+.008,z);wa.push(u,u);ws.push(phase,phase);if(j<48)wi.push(n,n+2,n+1,n+1,n+2,n+3);
   }
  }
  wisps.setAttribute('position',new BufferAttribute(new Float32Array(wp),3));wisps.setAttribute('aAlong',new BufferAttribute(new Float32Array(wa),1));wisps.setAttribute('aSeed',new BufferAttribute(new Float32Array(ws),1));wisps.setIndex(wi);
  this.root.add(new Mesh(wisps,new ShaderMaterial({uniforms:{...this.common,uOpacity:this.environmentOpacity},vertexShader:trailVertex,fragmentShader:`uniform float uTime,uOpacity;varying float vSeed,vAlong,vDepth;void main(){float ends=sin(vAlong*3.14159);float pulse=.2+.8*pow(.5+.5*sin(vAlong*15.-uTime*.5+vSeed),6.);gl_FragColor=vec4(mix(vec3(.06,.22,.7),vec3(.32,.1,.55),sin(vSeed)*.5+.5),ends*pulse*uOpacity*.16*smoothstep(.3,1.5,vDepth));}`,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide})));
  // Only the germ of shot05: perpendicular E/B fields, not a sinusoidal photon trajectory.
  const p:number[]=[],axes:number[]=[],along:number[]=[],idx:number[]=[];
  for(let axis=0;axis<2;axis++)for(let j=0;j<=180;j++){const u=j/180,x=-4+u*9,n=p.length/3;for(const sign of [-1,1]){p.push(x,axis===0?0:sign*.008,axis===0?sign*.008:0);axes.push(axis);along.push(u);}if(j<180)idx.push(n,n+2,n+1,n+1,n+2,n+3);}
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('aAxis',new BufferAttribute(new Float32Array(axes),1));g.setAttribute('aAlong',new BufferAttribute(new Float32Array(along),1));g.setIndex(idx);
  const field=new Mesh(g,new ShaderMaterial({uniforms:this.common,vertexShader:fieldVertex,fragmentShader:fieldFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));field.frustumCulled=false;this.carrier.add(field);
 }
 update(time:number,_progress:number){
  this.common.uTime.value=time;this.common.uField.value=smooth(55.8,58,time)*(1-smooth(58,61,time));
  this.common.uSpeed.value=(propagationDistance(time+.01)-propagationDistance(time-.01))/.02;
  this.common.uRatio.value=Math.min(devicePixelRatio,this.mobile?1.25:1.75);
  propagationPosition(time,this.mobile,this.carrier.position);
  this.environmentOpacity.value=this.common.uOpacity.value*smooth(44,47,time)*(1-.22*smooth(53,56,time))*(1-smooth(59,62,time));
  this.envelopeOpacity.value=this.common.uOpacity.value*propagationReveal(time)*(1-smooth(58,60.5,time));
 }
 setOpacity(value:number){this.common.uOpacity.value=value;this.update(this.common.uTime.value,0);}
 dispose(){disposeGroup(this.root);}
}
