// Shared curve atlas drives deterministic transport on the filament geometry.
export const organizedParticleVertex=/* glsl */`
uniform float uTime,uBirth,uRatio,uMicro,uFlowCount;uniform sampler2D uFlow;
attribute float aSize,aSeed,aArm,aPhase,aKind,aFlowSeed;attribute vec3 aTarget;
varying float vSeed,vDepth,vGain,vKind;
vec3 sampleFlow(float t){
 float x=clamp(t,0.,1.)*127.,i=floor(x),y=(aArm+.5)/uFlowCount;
 return mix(texture2D(uFlow,vec2((i+.5)/128.,y)).xyz,texture2D(uFlow,vec2((min(i+1.,127.)+.5)/128.,y)).xyz,fract(x));
}
void main(){
 float speed=mix(.055,.14,aFlowSeed),t=fract(aPhase+uTime*speed);
 vec3 center=sampleFlow(t),tangent=normalize(sampleFlow(min(.999,t+.008))-sampleFlow(max(.001,t-.008)));
 vec3 ref=abs(tangent.y)>.9?vec3(1,0,0):vec3(0,1,0);
 vec3 normal=normalize(cross(tangent,ref)),binormal=cross(tangent,normal);
 float cluster=.22+.78*pow(.5+.5*sin(t*24.+aArm*2.7),4.);
 float width=mix(.4,.13,step(1.5,aKind))*(.45+cluster);
 float angle=aSeed*93.+uTime*(.2+aSeed*.3);
 vec3 p=center+(normal*cos(angle)+binormal*sin(angle))*width*sqrt(aSize*.6);
 if(aKind>2.5)p=position+vec3(sin(uTime*.12+aSeed*18.),cos(uTime*.09+aSeed*12.),sin(uTime*.08+aSeed*20.))*.13;
 p=mix(p,aTarget,uMicro);
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
 float nearFade=smoothstep(.12,.6,-mv.z);
 // Subpixel pinpoints otherwise alternate between bright and dark raster samples.
 float desiredSize=clamp(aSize*uRatio*24./max(.15,-mv.z),1.,16.);
 gl_PointSize=max(3.,desiredSize);
 vSeed=aSeed;vKind=aKind;vDepth=nearFade*exp(-max(0.,-mv.z-9.)*.035);
 float packet=exp(-pow((fract(t-uTime*speed+aFlowSeed*3.)-.5)*15.,2.));
 vGain=(.55+.45*cluster)*(.7+.3*packet)*smoothstep(0.,.055,t)*(1.-smoothstep(.92,1.,t));
 if(aKind>2.5)vGain=.2;
 vGain*=pow(desiredSize/gl_PointSize,2.);
}`;
export const organizedParticleFragment=/* glsl */`
uniform float uBirth,uOpacity,uMicro;varying float vSeed,vDepth,vGain,vKind;
void main(){
 vec2 p=gl_PointCoord-.5;float r=dot(p,p);if(r>.25)discard;
 float glow=exp(-r*32.),pin=exp(-r*180.);
 vec3 gold=mix(vec3(.7,.24,.035),vec3(1.6,1.03,.43),vSeed);
 gold=mix(gold,vec3(.25,.48,.85),uMicro*.32);
 float emission=(glow*.5+pin*.75)*vGain*uBirth*vDepth*uOpacity;
 gl_FragColor=vec4(gold,emission);
}`;

// Layered local scattering approximation. Normal alpha blending preserves dark gaps between layers.
export const interiorVertex=/* glsl */`
varying vec2 vUv;varying float vDepth;
void main(){vUv=uv;vec4 p=modelViewMatrix*vec4(position,1.);vDepth=-p.z;gl_Position=projectionMatrix*p;}`;
export const interiorFragment=/* glsl */`
uniform float uTime,uBirth,uMicro,uOpacity,uSlice;varying vec2 vUv;varying float vDepth;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);}
void main(){
 vec2 p=(vUv-.5)*2.;float n=noise(p*7.+vec2(uSlice*21.,uTime*.15));
 float edge=exp(-dot(p,p)*4.5),strata=smoothstep(.55,.85,n);
 float alpha=edge*(.006+strata*.025)*uBirth*uOpacity*(1.-uMicro*.8)*smoothstep(.1,.7,vDepth);
 vec3 color=mix(vec3(.35,.12,.025),vec3(1.4,.73,.2),strata);
 gl_FragColor=vec4(color,alpha);
}`;
