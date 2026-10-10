import { AdditiveBlending, BufferAttribute, Group, Mesh, NormalBlending, ShaderMaterial, TubeGeometry, type IUniform } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { energyVertex,energyFragment } from '../shaders/energyStructure';
import type { EnergyChannel } from '../utils/openingFlow';

/** Batched dim structure and local emission share identical spatial channels. */
export class OpeningEnergyStructure {
 readonly root=new Group();
 constructor(mobile:boolean,uniforms:Record<string,IUniform>,channels:EnergyChannel[]){
  const geometries:TubeGeometry[]=[];
  channels.forEach((channel,i)=>{
   if(mobile&&channel.kind!==0&&i%2===0)return;
   const geometry=new TubeGeometry(channel.curve,mobile?48:96,channel.width,mobile?4:6,false);
   const pos=geometry.getAttribute('position'),norm=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');
   const seeds=new Float32Array(pos.count),kinds=new Float32Array(pos.count),radii=new Float32Array(pos.count);
   for(let j=0;j<pos.count;j++){
    const t=uv.getX(j),width=.45+.55*Math.pow(.5+.5*Math.sin(t*17+channel.seed*23),2);
    const delta=channel.width*(width-1);
    pos.setXYZ(j,pos.getX(j)+norm.getX(j)*delta,pos.getY(j)+norm.getY(j)*delta,pos.getZ(j)+norm.getZ(j)*delta);
   }
   seeds.fill(channel.seed);kinds.fill(channel.kind);radii.fill(channel.width);
   geometry.setAttribute('aSeed',new BufferAttribute(seeds,1));geometry.setAttribute('aKind',new BufferAttribute(kinds,1));geometry.setAttribute('aRadius',new BufferAttribute(radii,1));geometries.push(geometry);
  });
  const geometry=mergeGeometries(geometries)!;geometries.forEach(g=>g.dispose());
  const base=new Mesh(geometry,new ShaderMaterial({uniforms:{...uniforms,uStructural:{value:1}},vertexShader:energyVertex,fragmentShader:energyFragment,transparent:true,depthTest:true,depthWrite:false,blending:NormalBlending}));
  const emission=new Mesh(geometry,new ShaderMaterial({uniforms:{...uniforms,uStructural:{value:0}},vertexShader:energyVertex,fragmentShader:energyFragment,transparent:true,depthTest:true,depthWrite:false,blending:AdditiveBlending}));
  base.renderOrder=1;emission.renderOrder=2;this.root.add(base,emission);
 }
}
