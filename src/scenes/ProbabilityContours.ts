import { AdditiveBlending, BufferAttribute, CatmullRomCurve3, Group, Mesh, Quaternion, ShaderMaterial, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { random } from '../utils/random';
import { materialOutput } from '../shaders/microDetail';

/** Qualitative probability-density contours, stationary in atom coordinates.
 * No moving electron markers, and not quantitative atomic orbitals. */
export class ProbabilityContours {
 readonly root=new Group();
 constructor(mobile:boolean,uniforms:Record<string,{value:number}>){
  const rng=random(81235),geometries:TubeGeometry[]=[];
  for(let i=0;i<6;i++){
   const orientation=new Quaternion().setFromAxisAngle(new Vector3(rng()-.5,rng()-.5,rng()-.5).normalize(),rng()*3),points:Vector3[]=[];
   for(let j=0;j<65;j++){const a=j/64*Math.PI*2,r=1.4+Math.sin(a*3+i)*.13;points.push(new Vector3(Math.cos(a)*r,Math.sin(a)*r*.72,Math.sin(a*2+i)*.22).applyQuaternion(orientation));}
   const g=new TubeGeometry(new CatmullRomCurve3(points,true),mobile?96:160,.0035,4,true),seed=new Float32Array(g.attributes.position.count);seed.fill(i/6);g.setAttribute('aSeed',new BufferAttribute(seed,1));geometries.push(g);
  }
  const geo=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());
  this.root.add(new Mesh(geo,new ShaderMaterial({uniforms,vertexShader:`attribute float aSeed;varying float vAlong,vSeed;void main(){vAlong=uv.x;vSeed=aSeed;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float uTime,uOpacity,uExcitation,uOpeningTime;varying float vAlong,vSeed;void main(){float reveal=smoothstep(11.,17.,uOpeningTime);float grain=pow(.5+.5*sin(vAlong*430.+vSeed*27.),5.);float local=pow(.5+.5*sin(vAlong*31.-uTime*.45+vSeed*8.),8.);vec3 c=mix(vec3(.06,.39,1.),vec3(.55,.2,1.),uExcitation);gl_FragColor=vec4(c*(1.+grain),(.025+.12*grain+.12*local)*reveal*uOpacity);${materialOutput}}`,transparent:true,depthWrite:false,blending:AdditiveBlending})));
 }
}
