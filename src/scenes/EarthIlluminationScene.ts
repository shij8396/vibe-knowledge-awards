import {AdditiveBlending,BufferAttribute,BufferGeometry,Group,Mesh,Points,ShaderMaterial,SphereGeometry,SRGBColorSpace,Texture,TextureLoader,Vector3,type WebGLRenderer} from 'three';
import {disposeGroup,type ChapterScene} from '../core/SceneManager';
import {EARTH_CENTER,EARTH_FILM_RADIUS as R} from '../utils/finale';
import {STELLAR_CENTER} from '../utils/stellar';
import {propagationPosition} from '../utils/propagation';
import {smooth} from '../utils/cinematic';
import {random} from '../utils/random';
import {earthVertex,earthFragment,earthCloudFragment,earthAtmosphereFragment} from '../shaders/earthIllumination';
import {dustVertex,dustFragment} from '../shaders/spectrum';
export class EarthIlluminationScene implements ChapterScene{
 readonly root=new Group();private globe=new Group();private textures:Texture[]=[];private time=132;private opacity=1;private disposed=false;readonly ready:Promise<void>;private asset='loading';
 private uniforms={uMap:{value:null as Texture|null},uCloud:{value:null as Texture|null},uSun:{value:new Vector3()},uOpacity:{value:0},uReady:{value:0}};
 private stars={uTime:{value:135},uOpacity:{value:0}};
 constructor(mobile:boolean){
  propagationPosition(58,mobile,this.root.position);this.root.position.add(EARTH_CENTER);this.uniforms.uSun.value.copy(STELLAR_CENTER).add(propagationPosition(58,mobile,new Vector3()));
  const loader=new TextureLoader();this.ready=Promise.all(['/textures/earth-day.jpg','/textures/earth-clouds.jpg'].map((url,i)=>new Promise<void>(resolve=>{const t=loader.load(url,()=>{if(!this.disposed){if(i===0)t.colorSpace=SRGBColorSpace;t.anisotropy=4;}resolve();},undefined,()=>{this.asset='fallback';resolve();});this.textures.push(t);if(i===0)this.uniforms.uMap.value=t;else this.uniforms.uCloud.value=t;}))).then(()=>{if(!this.disposed){this.uniforms.uReady.value=this.asset==='fallback'?0:1;this.asset=this.asset==='fallback'?'纹理失败：地球表面隐藏':'ready';}});
  this.globe.add(new Mesh(new SphereGeometry(R,mobile?80:128,mobile?56:88),new ShaderMaterial({uniforms:this.uniforms,vertexShader:earthVertex,fragmentShader:earthFragment,transparent:true,depthWrite:true})));
  this.globe.add(new Mesh(new SphereGeometry(R*1.006,80,56),new ShaderMaterial({uniforms:this.uniforms,vertexShader:earthVertex,fragmentShader:earthCloudFragment,transparent:true,depthWrite:false})));
  const atmosphere=new Mesh(new SphereGeometry(R*1.025,80,56),new ShaderMaterial({uniforms:this.uniforms,vertexShader:earthVertex,fragmentShader:earthAtmosphereFragment,transparent:true,depthWrite:false,blending:AdditiveBlending}));this.root.add(this.globe,atmosphere);
  const rng=random(90901),count=mobile?700:1800,p=new Float32Array(count*3),seed=new Float32Array(count);for(let i=0;i<count;i++){p.set([(rng()-.5)*330,(rng()-.5)*220,-80-rng()*180],i*3);seed[i]=rng();}const g=new BufferGeometry();g.setAttribute('position',new BufferAttribute(p,3));g.setAttribute('aSeed',new BufferAttribute(seed,1));this.root.add(new Points(g,new ShaderMaterial({uniforms:this.stars,vertexShader:dustVertex,fragmentShader:dustFragment,transparent:true,depthWrite:false,blending:AdditiveBlending})));
 }
 update(t:number,_p:number){this.time=t;this.uniforms.uOpacity.value=this.opacity*smooth(133,139,t)*(1-smooth(159,164,t));this.stars.uOpacity.value=this.opacity*smooth(135,141,t)*(1-smooth(159,164,t))*.45;this.stars.uTime.value=t;this.globe.rotation.y=1.5+(t-135)*.009;}
 prepareTextures(renderer:WebGLRenderer){this.textures.forEach(t=>renderer.initTexture(t));}
 get assetStatus(){return this.asset;}
 setOpacity(v:number){this.opacity=v;this.update(this.time,0);}
 dispose(){this.disposed=true;this.textures.forEach(t=>t.dispose());disposeGroup(this.root);}
}
