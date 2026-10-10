// Opening fields are qualitative probability/energy symbols, not electron paths.
export const noiseGLSL=`
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){return .57*noise(p)+.28*noise(p*2.13)+.15*noise(p*4.31);}`;

export const domainVertex = /* glsl */ `
uniform float uTime; attribute float aSeed;
varying vec3 vNormal,vView,vLocal; varying float vSeed,vDepth;
void main(){
 vec3 p=position;
 vec4 mv=modelViewMatrix*instanceMatrix*vec4(p,1.);
 vNormal=normalize(normalMatrix*mat3(instanceMatrix)*normal);vView=normalize(-mv.xyz);vLocal=p;vSeed=aSeed;vDepth=-mv.z;
 gl_Position=projectionMatrix*mv;
}`;
export const domainFragment = /* glsl */ `
uniform float uTime,uReveal,uOpacity,uFocus,uShellWeight;varying vec3 vNormal,vView,vLocal;varying float vSeed,vDepth;
${noiseGLSL}
void main(){
 float rim=pow(max(0.,1.-abs(dot(normalize(vNormal),normalize(vView)))),2.6);
 float n=noise(vLocal*7.+vSeed*18.);float lambert=.25+.75*max(0.,dot(normalize(vNormal),normalize(vec3(-.4,.7,1.))));
 vec3 color=mix(vec3(.018,.055,.12),vec3(.11,.25,.4),n)*lambert+vec3(.12,.34,.55)*rim*.65;
 float depthFade=smoothstep(.35,1.8,vDepth)*exp(-max(0.,vDepth-14.)*.055);
 float focus=exp(-abs(vDepth-uFocus)*.10);
 float stagger=smoothstep(vSeed*.7,vSeed*.7+1.2,uTime);
 gl_FragColor=vec4(color,(.12+rim*.24)*uReveal*uOpacity*depthFade*stagger*(.25+.75*focus)*uShellWeight);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const fieldVertex = /* glsl */ `
uniform float uTime,uCutaway;varying vec3 vNormal,vView,vLocal;${noiseGLSL}
void main(){vec3 p=position;float n=fbm(normal*3.5);p*=1.+(n-.5)*.16;
 vec4 mv=modelViewMatrix*vec4(p,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);vLocal=p;
 gl_Position=projectionMatrix*mv;}`;
export const fieldFragment = /* glsl */ `
uniform float uTime,uReveal,uCutaway,uArrival,uOpacity,uShellWeight;
varying vec3 vNormal,vView,vLocal;${noiseGLSL}
void main(){
 // An explanatory cutaway, not a physical shell rupturing.
 float threshold=mix(4.5,-4.5,uCutaway);float cut=1.-smoothstep(threshold-.12,threshold+.12,vLocal.z);
 float cutEdge=exp(-pow((vLocal.z-threshold)*12.,2.))*smoothstep(.05,.2,uCutaway)*(1.-smoothstep(.85,1.,uCutaway));
 float facing=abs(dot(normalize(vNormal),normalize(vView)));float rim=pow(max(0.,1.-facing),2.7);
 float n=noise(vLocal*4.);float strata=pow(1.-abs(fract(n*7.)-.5)*2.,12.);
 float arrival=exp(-pow((length(vLocal)-max(0.,uTime-11.)*2.)*5.,2.))*uArrival;
 vec3 color=vec3(.075,.2,.34)*(.25+n*.65)+vec3(.15,.43,.7)*(rim*.7+strata*.17);
 color+=vec3(.9,.53,.12)*arrival*.5+vec3(.35,.67,.85)*cutEdge*.5;
 gl_FragColor=vec4(color,(.045+rim*.22+strata*.025+cutEdge*.3)*cut*uReveal*uOpacity*uShellWeight);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const beamVertex = /* glsl */ `varying float vT;varying vec3 vNormal,vView;
void main(){vT=uv.x;vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`;
export const beamFragment = /* glsl */ `
uniform float uPacket,uPacketVisible,uOpacity;varying float vT;varying vec3 vNormal,vView;
void main(){float front=exp(-pow((vT-uPacket)*32.,2.));float tail=exp(-max(0.,uPacket-vT)*20.)*step(vT,uPacket);
 float edge=.3+.7*pow(max(0.,1.-abs(dot(normalize(vNormal),normalize(vView)))),2.);
 vec3 color=mix(vec3(.32,.6,.9),vec3(1.,.8,.43),front);
 gl_FragColor=vec4(color*(.35+front*2.),(front*.8+tail*.3)*edge*uPacketVisible*uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const packetVertex = /* glsl */ `varying vec2 vUv;
void main(){vUv=uv;vec4 center=modelViewMatrix*vec4(0.,0.,0.,1.);center.xy+=position.xy;gl_Position=projectionMatrix*center;}`;
export const packetFragment = /* glsl */ `
uniform float uPacketVisible,uOpacity;varying vec2 vUv;
void main(){vec2 p=(vUv-.5)*2.;float r=length(p);float core=exp(-r*r*950.);float glow=exp(-r*24.)*.2;
 float streak=exp(-abs(p.y)*140.)*exp(-abs(p.x)*14.)*.11;
 vec3 color=vec3(1.,.91,.65)*core*2.+vec3(1.,.65,.25)*(glow+streak);
 gl_FragColor=vec4(color*uPacketVisible*uOpacity,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const dustVertex = /* glsl */ `
uniform float uRatio,uTime;attribute float aSize,aSeed,aLayer;varying float vSeed,vLayer,vDepth;
void main(){vec3 p=position; p.y+=sin(uTime*.12+aSeed*30.)*.16; p.x+=cos(uTime*.09+aSeed*20.)*.13;vec4 mv=modelViewMatrix*vec4(p,1.);vSeed=aSeed;vLayer=aLayer;vDepth=-mv.z;
 gl_PointSize=clamp(aSize*uRatio*19./max(.2,-mv.z),1.,18.);gl_Position=projectionMatrix*mv;}`;
export const dustFragment = /* glsl */ `
uniform float uReveal,uOpacity,uMicro;varying float vSeed,vLayer,vDepth;
void main(){float r=length(gl_PointCoord-.5);float soft=exp(-r*r*(vLayer>.5?18.:28.));
 vec3 color=mix(vec3(.16,.3,.48),vec3(.46,.61,.72),vSeed);
 color=mix(mix(vec3(.65,.29,.055),vec3(1.,.72,.32),vSeed),color,uMicro*.8);
 float alpha=soft*(vLayer>.5?.1:.15)*uReveal*uOpacity*smoothstep(.4,1.5,vDepth);
 gl_FragColor=vec4(color,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
