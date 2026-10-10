import { AdditiveBlending,BufferAttribute,BufferGeometry,CatmullRomCurve3,DoubleSide,Group,Mesh,ShaderMaterial,TubeGeometry,Vector3,type IUniform } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { random } from '../utils/random';
import { STELLAR_RADIUS as R } from '../utils/stellar';
import { noiseGLSL,filamentVertex,filamentFragment } from '../shaders/solar';

export class SolarCorona{
 readonly root=new Group();
 constructor(mobile:boolean,uniforms:Record<string,IUniform>){
  const rng=random(80813),geometries:TubeGeometry[]=[];
  // Distinct footpoints and scales, each arch lies in a different local magnetic plane.
  for(let i=0;i<(mobile?13:25);i++){
   const angle=i*2.399+.3*rng(),z=(rng()-.5)*1.25,base=new Vector3(Math.cos(angle),Math.sin(angle),z).normalize();
   const tangent=new Vector3(-base.y,base.x,(rng()-.5)*.5).normalize(),span=.1+rng()*.18,height=.08+rng()**2*.31,points:Vector3[]=[];
   for(let j=0;j<=8;j++){const u=j/8,normal=base.clone().addScaledVector(tangent,(u-.5)*span*2).normalize();points.push(normal.multiplyScalar(R*(i<7?1+height*Math.sin(Math.PI*u):1+u*(.18+height*1.4))).addScaledVector(new Vector3(0,0,1),Math.sin(u*Math.PI*2)*R*.025));}
   const g=new TubeGeometry(new CatmullRomCurve3(points),mobile?32:56,.012+rng()*.034,mobile?3:5,false);g.setAttribute('aSeed',new BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(rng()),1));geometries.push(g);
  }
  const merged=mergeGeometries(geometries)!;geometries.forEach(g=>g.dispose());
  const filament=new Mesh(merged,new ShaderMaterial({uniforms:{...uniforms,uKind:{value:0}},vertexShader:filamentVertex,fragmentShader:filamentFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));filament.frustumCulled=false;this.root.add(filament);
  const p:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let i=0;i<(mobile?9:17);i++){
   const angle=i*2.399,base=new Vector3(Math.cos(angle),Math.sin(angle),(rng()-.5)*.6).normalize(),tangent=new Vector3(-base.y,base.x,0).normalize(),length=.16+rng()*.6,width=.015+rng()*.085;
   for(let j=0;j<=24;j++){const u=j/24,n=p.length/3,center=base.clone().multiplyScalar(R*(.985+u*length)).addScaledVector(tangent,R*.035*Math.sin(u*4+i));for(const sign of [-1,1]){const v=center.clone().addScaledVector(tangent,R*width*(1+u)*sign);p.push(...v.toArray());uv.push((sign+1)/2,u);}if(j<24)indices.push(n,n+2,n+1,n+1,n+2,n+3);}
  }
  const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(new Float32Array(p),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(uv),2));g.setIndex(indices);
  const mist=new Mesh(g,new ShaderMaterial({uniforms,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float uTime,uReveal;varying vec2 vUv;${noiseGLSL}void main(){if(uReveal<.001)discard;float edge=exp(-pow((vUv.x-.5)*5.,2.));float decay=pow(1.-vUv.y,2.);float texture=.3+.7*noise3(vec3(vUv*vec2(9.,22.),uTime*.035));gl_FragColor=vec4(1.1,.38,.035,edge*decay*texture*uReveal*.16);}`,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending,side:DoubleSide}));mist.frustumCulled=false;this.root.add(mist);
 }
}
