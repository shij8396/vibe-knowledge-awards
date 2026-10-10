import { microNoise, materialOutput } from './microDetail';
export const pulseVertex=/* glsl */`
varying vec3 vLocal,vNormal,vView;varying float vDepth;
void main(){vLocal=position;vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);vDepth=-p.z;gl_Position=projectionMatrix*p;}`;
export const pulseFragment=/* glsl */`
uniform float uTime,uOpacity,uField,uLayer;varying vec3 vLocal,vNormal,vView;varying float vDepth;
${microNoise}
void main(){
 float n=fbm(vLocal*vec3(7.,23.,23.)-vec3(uTime*2.,0.,0.));
 float vein=pow(.5+.5*sin(vLocal.x*38.-uTime*12.+n*8.),9.);
 float facing=abs(dot(normalize(vNormal),normalize(vView)));
 float rim=pow(max(0.,1.-facing),2.);
 float head=exp(-pow((vLocal.x-.2)*2.,2.));
 vec3 c=mix(vec3(.75,.22,.025),vec3(2.,1.6,.9),head*(.35+.65*n));
 c+=vec3(1.2,.6,.12)*vein*.65;
 if(uLayer<0.)c=vec3(4.,2.7,1.25)*head*(.6+n*.4);
 float a=(.09+rim*.32+vein*.25)*head*uOpacity*(1.-uField*.65)/(1.+uLayer*1.5);
 gl_FragColor=vec4(c,a*smoothstep(.12,.5,vDepth));${materialOutput}
}`;
export const trailVertex=/* glsl */`
uniform float uTime,uSpeed;attribute float aSeed,aAlong;varying float vSeed,vAlong,vDepth;
void main(){vec3 p=position;vSeed=aSeed;vAlong=aAlong;
 p.y+=sin(aAlong*12.+aSeed*36.-uTime*.8)*.008;p.z+=cos(aAlong*9.+aSeed*19.-uTime*.7)*.008;
 vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;
export const trailFragment=/* glsl */`
uniform float uTime,uOpacity,uField;varying float vSeed,vAlong,vDepth;
void main(){float along=clamp(vAlong,0.,1.);float envelope=pow(along,1.8)*smoothstep(0.,.15,along)*(1.-smoothstep(.95,1.,along));
 float packet=.25+.75*pow(.5+.5*sin(vAlong*29.-uTime*(3.+vSeed)+vSeed*30.),8.);
 vec3 c=mix(vec3(.7,.2,.015),vec3(1.8,1.08,.35),packet);
 gl_FragColor=vec4(c,envelope*packet*uOpacity*(1.-uField*.6)*smoothstep(.15,.9,vDepth));${materialOutput}}`;
export const environmentVertex=/* glsl */`
uniform float uTime,uSpeed,uRatio;uniform vec3 uSource;attribute vec3 aCenter;attribute float aSeed,aLayer,aSize;
varying vec2 vUv;varying float vLayer,vSeed,vDepth,vIllumination;
void main(){vec3 p=aCenter;p.y+=sin(uTime*.08+aSeed*29.)*.07;p.z+=cos(uTime*.06+aSeed*21.)*.09;
 vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;vLayer=aLayer;vSeed=aSeed;vUv=uv;
 vIllumination=exp(-dot(p-uSource,p-uSource)/45.);
 vec3 velocity=(modelViewMatrix*vec4(uSpeed,0.,0.,0.)).xyz;
 vec2 motion=-velocity.xy+mv.xy*velocity.z/max(.5,-mv.z);
 vec2 axis=length(motion)>.001?normalize(motion):vec2(1,0),perp=vec2(-axis.y,axis.x);
 float radius=aSize*mix(.024,.055,1.-step(.5,aLayer));
 float exposure=mix(.025,.004,aLayer/2.);
 float streak=min(.7,length(motion)*exposure);
 mv.xy+=axis*position.x*(radius+streak)+perp*position.y*radius;
 gl_Position=projectionMatrix*mv;
}`;
export const environmentFragment=/* glsl */`
uniform float uOpacity,uTime;varying vec2 vUv;varying float vLayer,vSeed,vDepth,vIllumination;
void main(){vec2 p=(vUv-.5)*2.;float shape=exp(-p.y*p.y*7.)*exp(-p.x*p.x*3.5);
 vec3 cool=mix(vec3(.025,.12,.38),vec3(.28,.12,.5),vSeed);
 vec3 c=mix(vec3(1.,.52,.14),cool,step(.62,vSeed));
 c=mix(c,vec3(1.3,.83,.32),vIllumination*.5);
 float brightness=mix(.3,.085,vLayer/2.)*(.35+.65*vSeed);
 float depth=smoothstep(.2,1.4,vDepth)*exp(-max(0.,vDepth-17.)*.025);
 gl_FragColor=vec4(c,shape*brightness*depth*uOpacity*(1.+vIllumination*1.2));${materialOutput}}`;
export const fieldVertex=/* glsl */`
uniform float uTime,uField;attribute float aAxis,aAlong;varying float vAxis,vAlong,vDepth;
void main(){vec3 p=position;float amplitude=uField*.7;float wave=sin(p.x*2.2-uTime*3.6)*amplitude;
 p.y+=wave*(1.-aAxis);p.z+=wave*aAxis;
 vec4 mv=modelViewMatrix*vec4(p,1.);vAxis=aAxis;vAlong=aAlong;vDepth=-mv.z;gl_Position=projectionMatrix*mv;}`;
export const fieldFragment=/* glsl */`
uniform float uField,uOpacity;varying float vAxis,vAlong,vDepth;
void main(){vec3 c=mix(vec3(.1,.5,1.6),vec3(.7,.16,1.4),vAxis);float ends=smoothstep(0.,.14,vAlong)*(1.-smoothstep(.86,1.,vAlong));gl_FragColor=vec4(c,uField*ends*uOpacity*.6*smoothstep(.15,.7,vDepth));${materialOutput}}`;
