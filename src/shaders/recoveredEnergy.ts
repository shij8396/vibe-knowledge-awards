// Original gold-particle, radial-halo and core shaders recovered verbatim.
export const particleVertex = /* glsl */ `
uniform float uTime; uniform float uBirth; uniform float uRatio;
attribute float aSize; attribute float aSeed;
varying float vSeed; varying float vDepth;
void main() {
 vec3 p=position; float angle=uTime*(.055+aSeed*.018);
 mat2 spin=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
 p.xz=spin*p.xz; p*=.08+.92*uBirth;
 p+=normalize(position+.001)*sin(uTime*.32+aSeed*38.)*.045*uBirth;
 vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
 float size=clamp(aSize*uRatio*22./max(.15,-mv.z),1.,7.);
 gl_PointSize=max(3.,size);
 vSeed=aSeed; vDepth=clamp(14./max(.15,-mv.z),.4,1.4)*pow(size/gl_PointSize,2.)*smoothstep(.12,.6,-mv.z);
}`;
export const particleFragment = /* glsl */ `
uniform float uBirth; uniform float uTime; uniform float uOpacity;
varying float vSeed; varying float vDepth;
void main(){
 float d=length(gl_PointCoord-.5); float glow=exp(-d*d*24.);
 float flicker=.72+.28*sin(uTime*.8+vSeed*90.);
 vec3 gold=mix(vec3(.28,.36,.60),vec3(1.,.66,.25),smoothstep(.15,.38,vSeed));
 gold=mix(gold,vec3(1.,.94,.76),pow(vSeed,5.));
 gl_FragColor=vec4(gold*(1.+vSeed),glow*flicker*uBirth*vDepth*.7*uOpacity);
}`;
export const haloVertex = /* glsl */ `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const haloFragment = /* glsl */ `
varying vec2 vUv; uniform float uBirth; uniform float uTime; uniform float uProgress; uniform float uOpacity;
void main(){
 vec2 p=(vUv-.5)*2.; float r=length(p); float a=atan(p.y,p.x);
 float core=exp(-r*r*1600.); float inner=exp(-r*32.); float haze=exp(-r*8.)*.065;
 float rays=pow(abs(sin(a*9.+sin(a*3.)*.6)),14.)*exp(-r*12.)*.11;
 float streak=exp(-abs(p.y)*180.)*exp(-abs(p.x)*7.)*.09;
 float waveRadius=max(0.,uProgress-.16)*1.5;
 float wave=exp(-pow((r-waveRadius)*120.,2.))*.11*(1.-smoothstep(.45,.82,uProgress));
 vec3 col=vec3(1.,.57,.18)*(inner*.5+haze+rays+streak+wave)+vec3(1.,.93,.73)*core*2.;
 gl_FragColor=vec4(col*uBirth*uOpacity,1.);
}`;
export const coreVertex = /* glsl */ `varying vec3 vNormal;varying vec3 vPosition;void main(){vNormal=normalMatrix*normal;vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const coreFragment = /* glsl */ `
varying vec3 vNormal;varying vec3 vPosition;uniform float uTime;uniform float uBirth;uniform float uOpacity;
void main(){float flow=sin(vPosition.x*45.+sin(vPosition.y*35.+uTime)*2.+uTime*.4)*.5+.5;
 float rim=pow(max(0.,1.-abs(normalize(vNormal).z)),2.);
 vec3 c=mix(vec3(1.,.38,.065),vec3(1.6,1.23,.69),flow*.55+.3);
 gl_FragColor=vec4((c+rim*.5)*uBirth,uOpacity);}`;
