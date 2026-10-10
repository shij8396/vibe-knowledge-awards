import { microNoise,materialOutput } from './microDetail';
export const atmosphereVertex=/* glsl */`varying vec3 vNormal,vView,vLocal;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);vLocal=normalize(position);gl_Position=projectionMatrix*mv;}`;
export const atmosphereFragment=/* glsl */`
uniform float uTime,uOpacity;varying vec3 vNormal,vView,vLocal;${microNoise}
void main(){float facing=abs(dot(normalize(vNormal),normalize(vView)));float rim=pow(max(0.,1.-facing),3.);float day=max(0.,dot(vLocal,normalize(vec3(-.5,.4,.8))));vec3 c=mix(vec3(.025,.09,.3),vec3(.14,.55,1.1),day);gl_FragColor=vec4(c,rim*(.12+day*.7)*uOpacity);${materialOutput}}
`;
export const cloudsFragment=/* glsl */`
uniform float uTime,uOpacity;varying vec3 vNormal,vView,vLocal;${microNoise}
void main(){float n=fbm(vLocal*13.+vec3(0,uTime*.003,0));float cloud=smoothstep(.52,.66,n);float lit=max(.02,dot(vLocal,normalize(vec3(-.5,.4,.8))));gl_FragColor=vec4(vec3(.8,.85,.9)*lit,cloud*.18*uOpacity);${materialOutput}}
`;
export const flightVertex=/* glsl */`attribute float aAlong,aSeed;varying float vAlong,vSeed;void main(){vAlong=aAlong;vSeed=aSeed;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const flightFragment=/* glsl */`
uniform float uTime,uOpacity,uHead,uWhite,uCut;varying float vAlong,vSeed;
void main(){float x=35.+vAlong*149.;if(uCut>0.&&x>uCut)discard;float head=exp(-pow((x-uHead)/2.5,2.));float tail=exp(-max(0.,uHead-x)*.12)*step(x,uHead);float pulse=.3+.7*pow(.5+.5*sin(x*1.3-uTime*6.+vSeed*11.),8.);vec3 c=mix(vec3(1.4,.68,.14),vec3(1.6,1.45,1.2),uWhite);gl_FragColor=vec4(c,(head*.45+tail*pulse*.3)*uOpacity*(.5+vSeed*.5));${materialOutput}}
`;
export const scaleFragment=/* glsl */`
uniform float uHead,uOpacity;varying float vAlong,vSeed;void main(){float fill=1.-smoothstep(uHead-.02,uHead+.02,vAlong);gl_FragColor=vec4(mix(vec3(.12,.15,.2),vec3(1.3,.82,.3),fill),(.25+fill*.55)*uOpacity);${materialOutput}}
`;
export const starVertex=/* glsl */`
uniform float uTime;attribute float aSize,aLayer,aSeed;varying float vSeed,vLayer,vDepth;
void main(){vec3 p=position;p.y+=sin(uTime*.03+aSeed*23.)*.08;vec4 mv=modelViewMatrix*vec4(p,1.);vDepth=-mv.z;gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*60./max(1.,-mv.z),1.,9.);vSeed=aSeed;vLayer=aLayer;}
`;
export const starFragment=/* glsl */`
uniform float uOpacity;varying float vSeed,vLayer,vDepth;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;vec3 c=mix(vec3(.12,.26,.6),vec3(.72,.6,.42),vSeed);gl_FragColor=vec4(c,exp(-r*r*5.)*(.15+vSeed*.5)*uOpacity*smoothstep(.25,2.,vDepth));${materialOutput}}
`;

export const glassVertex=/* glsl */`varying vec3 vWorld,vNormal;void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*world;}`;
// Spatial environment refraction approximation: surface normals + IOR + Schlick Fresnel.
export const glassFragment=/* glsl */`
uniform samplerCube uEnvironment;uniform float uSurface;varying vec3 vWorld,vNormal;
void main(){vec3 view=normalize(cameraPosition-vWorld),n=normalize(vNormal);if(!gl_FrontFacing)n=-n;float facing=max(0.,dot(n,view));float fresnel=.035+.965*pow(1.-facing,5.);
 vec3 reflected=textureCube(uEnvironment,reflect(-view,n)).rgb;
 vec3 transmitted=textureCube(uEnvironment,refract(-view,n,1./1.46)).rgb;
 vec3 c=mix(transmitted*vec3(.78,.88,1.)*.8,reflected*1.8,fresnel)+vec3(.01,.025,.05);
 gl_FragColor=vec4(c,(.14+fresnel*.68)*uSurface);${materialOutput}}
`;
