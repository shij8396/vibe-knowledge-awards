import { CanvasTexture,Color,Group,InstancedMesh,Object3D,ShaderMaterial,PlaneGeometry,Mesh,AdditiveBlending,SphereGeometry,Sprite,SpriteMaterial,type WebGLRenderer } from 'three';
import { FUSION_STEPS,fusionProgress } from '../utils/stellar';
import { smooth } from '../utils/cinematic';
import { nuclearVertex,nuclearFragment } from '../shaders/solar';

export class FusionVisualization{
 readonly root=new Group();private mesh:InstancedMesh;private dummy=new Object3D();private color=new Color();private textures:CanvasTexture[]=[];private labels:Sprite[]=[];private uniforms={uReveal:{value:0}};private energy:Mesh;private pulse={value:0};
 constructor(){
  this.mesh=new InstancedMesh(new SphereGeometry(1,24,16),new ShaderMaterial({uniforms:this.uniforms,vertexShader:nuclearVertex,fragmentShader:nuclearFragment,transparent:true,depthWrite:true,depthTest:true}),11);this.mesh.frustumCulled=false;for(let i=0;i<11;i++)this.mesh.setColorAt(i,new Color(0xffbf68));this.root.add(this.mesh);this.root.position.set(2,0,.85);
  this.energy=new Mesh(new PlaneGeometry(2.4,2.4),new ShaderMaterial({uniforms:{uPulse:this.pulse},vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec2 vUv;uniform float uPulse;void main(){float r=length(vUv-.5)*2.;float a=exp(-r*r*8.)*uPulse*.32;gl_FragColor=vec4(1.6,.84,.23,a);}',transparent:true,depthWrite:false,depthTest:true,blending:AdditiveBlending}));this.energy.position.set(0,-1.38,.2);this.root.add(this.energy);
  for(let i=0;i<4;i++){const c=document.createElement('canvas');c.width=1024;c.height=100;const ctx=c.getContext('2d')!;ctx.font='38px Georgia,Microsoft YaHei,serif';ctx.textAlign='center';ctx.fillStyle='#f3dfb9';ctx.fillText(i<3?FUSION_STEPS[i].equation:"E = Δmc²",512,62);const t=new CanvasTexture(c),s=new Sprite(new SpriteMaterial({map:t,transparent:true,depthWrite:false,depthTest:false,opacity:0}));s.renderOrder=15;s.position.set(0,i<3?1.75-i*1.25:-1.8,.1);s.scale.set(4.5,.44,1);this.labels.push(s);this.textures.push(t);this.root.add(s);}
 }
 update(t:number){
  this.pulse.value=Math.exp(-(((t-127.45)/.28)**2))+Math.exp(-(((t-129.3)/.38)**2));this.energy.position.y=t<128?-.13:-1.38;
  this.uniforms.uReveal.value=smooth(124.5,125.2,t)*(1-smooth(130.5,132,t));let slot=0;
  for(let row=0;row<3;row++){
   const progress=fusionProgress(t,row),visible=smooth(FUSION_STEPS[row].start-.4,FUSION_STEPS[row].start+.2,t),n=row===0?2:row===1?3:6,y=1.12-row*1.25;
   for(let i=0;i<n;i++){
    let x=0,dy=0,neutron=false;
    if(row===0){x=(i===0?-1:1)*(.6*(1-progress)+.13*progress);neutron=i===1&&progress>.5;}
    else if(row===1){x=i<2?-.65*(1-progress)+(i===0?-.12:.12)*progress:.7*(1-progress);dy=i===2?.19*progress:0;neutron=i===1;}
    else{const group=i<3?-1:1,j=i%3;x=group*.72*(1-progress)+(i<4?(i%2===0?-.14:.14):i===4?-1.05:1.05)*progress;dy=(j===2?.19:-.04)*(1-progress)+(i<4?(i<2?-.12:.12):0)*progress;neutron=progress<.5?j===2:i===2||i===3;}
    this.dummy.position.set(x,y+dy,0);this.dummy.scale.setScalar(.155*visible);this.dummy.updateMatrix();this.mesh.setMatrixAt(slot,this.dummy.matrix);this.color.set(neutron?0xb9c4ca:0xffbf68);this.mesh.setColorAt(slot++,this.color);
   }
   (this.labels[row].material as SpriteMaterial).opacity=this.uniforms.uReveal.value*visible*(t>FUSION_STEPS[row].end?.48:1);
  }
  (this.labels[3].material as SpriteMaterial).opacity=this.uniforms.uReveal.value;
  this.mesh.instanceMatrix.needsUpdate=true;this.mesh.instanceColor!.needsUpdate=true;
 }
 prepareTextures(renderer:WebGLRenderer){this.textures.forEach(t=>renderer.initTexture(t));}
 dispose(){this.labels.forEach(s=>(s.material as SpriteMaterial).dispose());this.textures.forEach(t=>t.dispose());}
}
