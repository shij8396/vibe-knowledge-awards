import { microNoise } from './microDetail';
export const cloudVertex = /* glsl */ `
uniform float uTime; uniform float uRatio,uBackground;
attribute float aSize; attribute float aSeed;
varying float vSeed; varying vec3 vPosition;
void main(){
  // Fixed probability samples. No animated electron trajectory or orbital motion.
  vec3 local=position;if(uBackground>.5){local.x+=sin(uTime*.06+aSeed*3.)*.3;}
  vec4 p=modelViewMatrix*vec4(local,1.);
  gl_Position=projectionMatrix*p;
  gl_PointSize=clamp(aSize*uRatio*22./max(.2,-p.z),1.,mix(3.2,12.,uBackground));
  vSeed=aSeed;vPosition=position;
}`;
export const cloudFragment = /* glsl */ `
uniform float uTime; uniform float uOpacity; uniform float uWeight; uniform vec3 uColor;
uniform float uOpening,uReveal,uDetail,uArrival,uOpeningTime,uModelScale;
varying float vSeed; varying vec3 vPosition;
void main(){
  float r=length(gl_PointCoord-.5);
  float softness=exp(-r*r*22.);
  float density=.35+.65*smoothstep(.2,.85,sin(vPosition.x*4.+vPosition.z*3.+sin(vPosition.y*4.))*.5+.5);
  float twinkle=.82+.18*sin(uTime*.6+vSeed*43.);
  float reveal=mix(1.,uReveal*(.025+.975*uDetail),uOpening);
  float response=exp(-pow((length(vPosition*uModelScale-vec3(-1.05,.2,.9))-max(0.,uOpeningTime-11.)*2.)*2.8,2.))*uArrival*uOpening;
  vec3 color=mix(uColor+vec3(.6,.75,.9)*pow(vSeed,14.)*.3,vec3(1.1,.65,.17),response);
  gl_FragColor=vec4(color*(.55+vSeed*.8+response*1.7),softness*uWeight*uOpacity*twinkle*(.28+.02*uOpening)*density*reveal*(1.+response*2.));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
export const nucleusVertex = /* glsl */ `
attribute float aSpecies;varying float vSpecies;varying vec3 vNormal,vView,vPosition,vLocal;
void main(){vec3 local=position+normal*sin(position.x*270.+position.y*190.+position.z*170.)*.0011;vec4 p=instanceMatrix*vec4(local,1.);vec4 mv=modelViewMatrix*p;vSpecies=aSpecies;vLocal=position/.085;vPosition=p.xyz;vView=normalize(-mv.xyz);vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*mv;}`;
export const nucleusFragment = /* glsl */ `
varying float vSpecies;varying vec3 vNormal,vView,vPosition,vLocal;
uniform float uTime,uOpacity,uExcitation,uOpening,uReveal,uDetail,uArrival,uOpeningTime,uModelScale;
${microNoise}
void main(){
 vec3 N=normalize(vNormal),V=normalize(vView),L=normalize(vec3(-.6,.7,1.));
 float grain=fbm(vLocal*8.+vSpecies*17.);
 float fissure=pow(1.-abs(sin(grain*19.+vLocal.y*12.)),10.);
 N=normalize(N+vec3(sin(vLocal.y*54.),cos(vLocal.z*48.),sin(vLocal.x*63.))*.045);
 float diffuse=.13+.75*max(0.,dot(N,L));float rim=pow(max(0.,1.-abs(dot(N,V))),3.);
 float spec=pow(max(0.,dot(reflect(-L,N),V)),18.)*(.2+.8*grain);
 vec3 metal=mix(vec3(.11,.20,.38),vec3(.43,.25,.095),vSpecies);
 vec3 emission=mix(vec3(.08,.23,.42),vec3(.55,.27,.06),vSpecies);
 float hot=.45+.55*sin(uTime*.7+vPosition.x*19.+grain*7.);
 vec3 color=metal*diffuse*(.45+grain)+vec3(.55,.65,.78)*spec*.45+emission*(rim*.55+fissure*.3)*(1.+uExcitation*hot);
 float reveal=smoothstep(9.8,15.,uOpeningTime);
 if(uOpacity*reveal<.002)discard;
 gl_FragColor=vec4(color,uOpacity*reveal);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const envelopeVertex = /* glsl */ `
varying vec3 vNormal;varying vec3 vView;varying vec3 vPosition;
void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);vPosition=position;gl_Position=projectionMatrix*mv;}`;
export const envelopeFragment = /* glsl */ `
varying vec3 vNormal,vView,vPosition;uniform vec3 uColor;uniform float uTime,uOpacity,uWeight;
uniform float uOpening,uReveal,uDetail,uArrival,uOpeningTime,uModelScale;
${microNoise}
void main(){
 float rim=pow(max(0.,1.-abs(dot(normalize(vNormal),normalize(vView)))),3.);
 float fog=fbm(vPosition*3.2+vec3(uTime*.035,0.,uTime*.02));
 float layers=smoothstep(.32,.68,fog)*pow(1.-rim,1.5);
 float texture=exp(-pow((fog-.52)*70.,2.))*layers;
 float reveal=smoothstep(11.,17.,uOpeningTime);
 vec3 col=uColor*(.5+layers*.6)+vec3(.4,.65,.9)*texture*.25;
 float centerDensity=pow(abs(dot(normalize(vNormal),normalize(vView))),6.);
 float alpha=(layers*.045+texture*.008)*centerDensity*uWeight*uOpacity*reveal;
 gl_FragColor=vec4(col,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const photonVertex = /* glsl */ `varying vec2 vUv;void main(){vUv=uv;vec4 c=modelViewMatrix*vec4(0.,0.,0.,1.);c.xy+=position.xy*length(modelMatrix[0].xyz);gl_Position=projectionMatrix*c;}`;
export const photonFragment = /* glsl */ `
varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity,uVisible,uTime;
${microNoise}
void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);
 float core=exp(-r*r*240.);float halo=exp(-r*10.);
 float filament=exp(-pow((r-.21-.017*sin(a*5.-uTime*1.3))*70.,2.));
 float braid=pow(.5+.5*sin(a*3.-r*24.+uTime),8.)*exp(-r*8.);
 vec3 c=vec3(1.,.94,.78)*core*2.+uColor*(halo*.3+filament*.7+braid*.22);
 gl_FragColor=vec4(c*uVisible*uOpacity,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
