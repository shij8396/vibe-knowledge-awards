import { AdditiveBlending,BufferAttribute,CatmullRomCurve3,DoubleSide,Group,Mesh,RingGeometry,ShaderMaterial,TubeGeometry,Vector3,type IUniform } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { random } from '../utils/random';
import { STELLAR_RADIUS as R } from '../utils/stellar';
import { solarVertex,interiorFragment,filamentVertex,filamentFragment } from '../shaders/solar';

export class StellarInterior{
 readonly root=new Group();
 constructor(mobile:boolean,uniforms:Record<string,IUniform>){
  const face=new RingGeometry(0,R,mobile?96:160,32,-Math.PI/2,Math.PI);const pos=face.getAttribute('position');for(let i=0;i<pos.count;i++){const r=Math.hypot(pos.getX(i),pos.getY(i));pos.setZ(i,.006+.003*(1-r/R));}face.computeVertexNormals();
  const section=new Mesh(face,new ShaderMaterial({uniforms:{...uniforms,uSide:{value:0}},vertexShader:`uniform float uCut,uSide;varying vec3 vLocal,vNormal,vWorld;void main(){vLocal=position;if(uSide>.5){float b=1.-uCut;vLocal*=sqrt(max(0.,1.-b*b));vLocal.x+=12.5*b;}vNormal=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(vLocal,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,fragmentShader:interiorFragment,side:DoubleSide,transparent:true,depthWrite:true,depthTest:true}));section.frustumCulled=false;this.root.add(section);
  const sideFace=face.clone();sideFace.rotateY(-Math.PI/2);const sideMaterial=(section.material as ShaderMaterial).clone();sideMaterial.uniforms={...uniforms,uSide:{value:1}};const sideSection=new Mesh(sideFace,sideMaterial);sideSection.frustumCulled=false;this.root.add(sideSection);
  const rng=random(80829),paths:TubeGeometry[]=[];
  // Jagged radiative paths express repeated absorption/re-emission, not a single escaping photon.
  for(let i=0;i<(mobile?9:17);i++){
   const points:Vector3[]=[],angle=(i/(mobile?8:16)-.5)*2.2;
   for(let j=0;j<=44;j++){const r=R*Math.max(.255,Math.min(.705,.26+j/44*.44+(j>0&&j<44?(rng()-.5)*.05:0))),a=angle+(rng()-.5)*.14;points.push(new Vector3(Math.cos(a)*r,Math.sin(a)*r,.42));}
   const g=new TubeGeometry(new CatmullRomCurve3(points),mobile?70:110,.012,3,false);g.setAttribute('aSeed',new BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(rng()),1));paths.push(g);
  }
  // Separate closed rising/returning cells occupy only the convective layer.
  for(let i=0;i<(mobile?9:15);i++){
   const a=-1.18+i/(mobile?8:14)*2.36,points:Vector3[]=[];
   for(let j=0;j<=24;j++){const phase=j/24*Math.PI*2,r=R*(.845+.12*Math.sin(phase)),angle=a+.045*Math.cos(phase);points.push(new Vector3(Math.cos(angle)*r,Math.sin(angle)*r,.43));}
   const g=new TubeGeometry(new CatmullRomCurve3(points),48,.015,3,false);g.setAttribute('aSeed',new BufferAttribute(new Float32Array(g.getAttribute('position').count).fill(rng()),1));paths.push(g);
  }
  const merged=mergeGeometries(paths)!;paths.forEach(g=>g.dispose());const flows=new Mesh(merged,new ShaderMaterial({uniforms:{...uniforms,uKind:{value:1}},vertexShader:filamentVertex,fragmentShader:filamentFragment,transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));flows.frustumCulled=false;this.root.add(flows);
 }
}

