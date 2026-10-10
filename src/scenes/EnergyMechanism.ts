import { AdditiveBlending, BufferAttribute, BufferGeometry, CatmullRomCurve3, DoubleSide, Float32BufferAttribute, Group, Mesh, PlaneGeometry, Points, ShaderMaterial, TubeGeometry, Vector3 } from 'three';
import { random } from '../utils/random';
import { microNoise, materialOutput } from '../shaders/microDetail';
import { smooth } from '../utils/cinematic';

/** Schematic energy diagram, separate from the spatial probability cloud.
 * A luminous mark denotes occupation of an energy state, not an orbiting electron. */
export class EnergyMechanism {
 readonly root=new Group();
 private marker:Mesh;
 private pulse:Mesh;
 private common={uTime:{value:0},uOpacity:{value:0},uExcitation:{value:0},uPulse:{value:0},uIncoming:{value:1},uFlight:{value:0}};
 private flowOpacity={value:0};
 constructor(mobile:boolean){
  for(const [y,upper] of [[-.72,0],[.72,1]]){
   const plate=new Mesh(new PlaneGeometry(1.3,.9),new ShaderMaterial({uniforms:{...this.common,uUpper:{value:upper}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float uOpacity,uUpper,uExcitation,uTime;varying vec2 vUv;void main(){vec2 p=clamp((vUv-.5)*2.,vec2(-1.),vec2(1.));float edge=exp(-max(0.,min(1.-abs(p.x),1.-abs(p.y)))*95.);float grid=pow(.5+.5*cos(p.x*22.),16.)+pow(.5+.5*cos(p.y*14.),16.);float occupancy=mix(1.-uExcitation,uExcitation,uUpper);vec3 c=mix(vec3(.12,.5,1.),vec3(.58,.27,1.),uUpper);gl_FragColor=vec4(c*(.4+occupancy*.3),clamp(.008+edge*.16+grid*.009,0.,.2)*uOpacity);${materialOutput}}`,transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide}));
   plate.rotation.x=-Math.PI/2;plate.position.set(1.75,y,.2);this.root.add(plate);
  }
  const rail=new BufferGeometry().setAttribute('position',new Float32BufferAttribute([2.45,-.72,.2,2.45,.72,.2],3));
  // A narrow schematic ladder next to the probability cloud, not a spatial orbit.
  const ladder=new Mesh(new TubeGeometry(new CatmullRomCurve3([new Vector3(2.45,-.72,.2),new Vector3(2.45,.72,.2)]),16,.004,4,false),new ShaderMaterial({uniforms:this.common,vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`uniform float uOpacity;void main(){gl_FragColor=vec4(.6,.72,1.,uOpacity*.3);${materialOutput}}`,transparent:true,depthWrite:false}));this.root.add(ladder);rail.dispose();
  const markerMaterial=new ShaderMaterial({uniforms:this.common,vertexShader:`varying vec2 vUv;void main(){vUv=uv;vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);c.xy+=position.xy;gl_Position=projectionMatrix*c;}`,fragmentShader:`uniform float uTime,uOpacity,uExcitation;varying vec2 vUv;void main(){vec2 p=vUv-.5;float r=length(p);float rim=exp(-pow((r-.16)*55.,2.));float core=exp(-r*r*220.);vec3 c=mix(vec3(.3,.65,1.),vec3(1.,.6,.15),uExcitation);gl_FragColor=vec4(c*(core*2.+rim),uOpacity*(core+rim*.45));${materialOutput}}`,transparent:true,depthWrite:false,blending:AdditiveBlending});
  this.marker=new Mesh(new PlaneGeometry(.7,.7),markerMaterial);this.root.add(this.marker);
  this.pulse=new Mesh(new PlaneGeometry(4,4),new ShaderMaterial({uniforms:this.common,vertexShader:markerMaterial.vertexShader,fragmentShader:`uniform float uPulse,uOpacity;varying vec2 vUv;void main(){float r=length(vUv-.5);float wave=exp(-pow((r-uPulse*.4)*55.,2.))*(1.-uPulse);float rays=pow(abs(sin(atan(vUv.y-.5,vUv.x-.5)*7.)),20.)*exp(-r*17.)*(1.-uPulse);gl_FragColor=vec4(vec3(1.6,.8,.2),uOpacity*(wave*.5+rays*.25));${materialOutput}}`,transparent:true,depthWrite:false,blending:AdditiveBlending}));this.pulse.position.set(1.75,-.72,.2);this.root.add(this.pulse);
  for(let layer=0;layer<2;layer++){
   const p:number[]=[],uv:number[]=[];
   for(const [u,v] of [[0,-1],[1,-1],[0,1],[0,1],[1,-1],[1,1]]){p.push(-6+u*18,v*(layer?.09:.018),.25);uv.push(u,v);}
   const mesh=new Mesh(new BufferGeometry().setAttribute('position',new Float32BufferAttribute(p,3)).setAttribute('uv',new Float32BufferAttribute(uv,2)),new ShaderMaterial({uniforms:{...this.common,uOpacity:this.flowOpacity,uLayer:{value:layer}},vertexShader:`uniform float uIncoming;varying vec2 vUv;varying float vX;void main(){vUv=uv;vX=position.x;vec3 p=position;p.y+=.72*uIncoming;p.z-=.25*uIncoming;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`uniform float uTime,uOpacity,uIncoming,uFlight,uLayer;varying vec2 vUv;varying float vX;${microNoise}
void main(){float incoming=(1.-smoothstep(-.2,.3,vX))*smoothstep(-6.,-5.,vX);float outgoing=smoothstep(1.65,1.9,vX)*(1.-smoothstep(1.75+uFlight*8.,2.+uFlight*8.,vX));float gate=mix(outgoing,incoming,uIncoming);float cross=exp(-abs(vUv.y)*(uLayer>.5?3.:5.));float flow=.15+pow(.5+.5*sin(vX*16.-uTime*9.),7.);vec3 c=mix(vec3(1.,.48,.08),vec3(.24,.59,1.),uIncoming);gl_FragColor=vec4(c*(1.+flow),cross*(.2+flow)*gate*uOpacity*(uLayer>.5?.25:1.));${materialOutput}}`,transparent:true,depthWrite:false,blending:AdditiveBlending,side:DoubleSide}));mesh.position.y=-.72;this.root.add(mesh);
  }
  const rng=random(26591),n=mobile?450:1100,p=new Float32Array(n*3),seed=new Float32Array(n);
  for(let i=0;i<n;i++){p[i*3]=rng()*18-6;p[i*3+1]=(rng()-.5)*.3;p[i*3+2]=(rng()-.5)*.3+.25;seed[i]=rng();}
  this.root.add(new Points(new BufferGeometry().setAttribute('position',new BufferAttribute(p,3)).setAttribute('aSeed',new BufferAttribute(seed,1)),new ShaderMaterial({uniforms:{...this.common,uOpacity:this.flowOpacity},vertexShader:`uniform float uTime,uIncoming,uFlight;attribute float aSeed;varying float vSeed,vX;void main(){vec3 p=position;p.x=mod(p.x+6.+uTime*1.6,18.)-6.;vX=p.x;vSeed=aSeed;p.y-=.72*(1.-uIncoming);p.z-=.25*uIncoming;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=clamp(9./max(.2,-mv.z),1.,4.);gl_Position=projectionMatrix*mv;}`,fragmentShader:`uniform float uOpacity,uIncoming,uFlight;varying float vSeed,vX;void main(){float gate=mix(step(1.75,vX)*(1.-step(2.+uFlight*8.,vX)),1.-step(0.,vX),uIncoming);float soft=exp(-dot(gl_PointCoord-.5,gl_PointCoord-.5)*28.);gl_FragColor=vec4(mix(vec3(1.,.66,.2),vec3(.25,.65,1.),uIncoming),soft*gate*vSeed*uOpacity);${materialOutput}}`,transparent:true,depthWrite:false,blending:AdditiveBlending})));
 }
 update(t:number,excitation:number,photon:number,incoming:number,opacity:number){
  this.common.uTime.value=t;this.common.uExcitation.value=excitation;this.common.uIncoming.value=incoming;this.common.uFlight.value=photon;
  this.common.uOpacity.value=opacity*smooth(24,29,t);
  this.common.uPulse.value=smooth(38,41,t);
  this.marker.position.set(1.75,-.72+1.44*excitation,.2);
  this.pulse.visible=t>=38&&t<=41.5;
  this.flowOpacity.value=opacity*(smooth(30,31,t)*(1-smooth(34,35,t))+smooth(41.5,42,t));
 }
}

