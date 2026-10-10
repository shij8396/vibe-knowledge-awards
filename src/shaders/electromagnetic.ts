import { materialOutput,microNoise } from './microDetail';
// Local +X propagation. E along Y and B along Z, with identical phase.
export const fieldVertex=/* glsl */`
uniform float uTime,uSpread,uOpacity,uPortrait,uCollapse;attribute float aAxis,aAlong,aOffset,aMagnitude,aWidth,aKind;varying float vAxis,vAlong,vOffset,vKind,vAcross,vX,vFraction;
void main(){
 float x=mix(-4.+aAlong*9.,-12.+aAlong*24.,uSpread);
 x+=smoothstep(72.,76.,uTime)*aAlong*38.;
 float k=mix(2.2,.82,uSpread);float phase=x*k-uTime*3.6,amplitude=mix(.7,2.3,uSpread)*aMagnitude;
 float wave=sin(phase)*amplitude;
 wave*=mix(1.,1.3,uPortrait*uSpread)*uCollapse;
 vec3 p=vec3(x*mix(1.,.72,uPortrait*uSpread),(1.-aAxis)*wave,aAxis*wave);
 if(aKind<1.5){p.y+=aOffset*(1.-aAxis);p.z+=aOffset*aAxis;}
 if(aKind>1.5){p.y=(1.-aAxis)*wave*position.y;p.z=aAxis*wave*position.y;}
 vec4 mv=modelViewMatrix*vec4(p,1.);
 vec3 tangent=vec3(1.,(1.-aAxis)*cos(phase)*amplitude*k,aAxis*cos(phase)*amplitude*k);
 if(aKind>1.5)tangent=vec3(0.,(1.-aAxis)*wave,aAxis*wave);
 vec2 direction=normalize((modelViewMatrix*vec4(tangent,0.)).xy+vec2(.00001));
 mv.xy+=vec2(-direction.y,direction.x)*position.x*aWidth;
 gl_Position=projectionMatrix*mv;vAxis=aAxis;vAlong=aAlong;vOffset=aOffset;vKind=aKind;vAcross=position.x;vX=x;vFraction=position.y;
}`;
export const fieldFragment=/* glsl */`
uniform float uTime,uOpacity;varying float vAxis,vAlong,vOffset,vKind,vAcross,vX,vFraction;
void main(){float edge=exp(-vAcross*vAcross*3.);float ends=smoothstep(0.,.07,vAlong)*(1.-smoothstep(.93,1.,vAlong));
 float pulse=.5+.5*pow(.5+.5*sin(vAlong*29.-uTime*3.6),6.);
 vec3 color=mix(vec3(.08,.7,1.9),vec3(.72,.13,1.55),vAxis);
 float detail=vKind<.25?.85:vKind<.75?.085:vKind<1.5?.18:vKind<2.5?.18:.04;
 if(vKind>2.5){float grid=pow(.5+.5*cos(vX*16.),16.)+pow(.5+.5*cos(vFraction*60.),16.);edge=.45+grid*.35;pulse=.65+.35*sin(vX*.8-uTime*3.6);}
 gl_FragColor=vec4(color,edge*ends*pulse*detail*uOpacity);${materialOutput}}
`;
export const cloudVertex=/* glsl */`
uniform float uTime,uOpacity;attribute float aSeed;varying float vSeed,vDepth;
void main(){vec3 p=position;p.y+=sin(uTime*.12+aSeed*40.)*.13;p.z+=cos(uTime*.1+aSeed*33.)*.15;
 vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(22./max(1.,-mv.z)*(1.+aSeed*2.),1.,7.);vSeed=aSeed;vDepth=-mv.z;}
`;
export const cloudFragment=/* glsl */`
uniform float uOpacity;varying float vSeed,vDepth;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;
 vec3 c=mix(vec3(.035,.19,.53),vec3(.42,.15,.58),vSeed);
 gl_FragColor=vec4(c,exp(-r*r*5.)*(.1+vSeed*.15)*uOpacity*smoothstep(.5,2.,vDepth));${materialOutput}}
`;
export const detectionVertex=/* glsl */`
uniform float uTime,uOpacity;attribute float aEvent;varying float vAge;
void main(){vAge=uTime-(68.+aEvent);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_PointSize=clamp(65./max(1.,-p.z)*(1.+2.*exp(-max(0.,vAge)*5.)),2.,18.);}
`;
export const detectionFragment=/* glsl */`
uniform float uOpacity;varying float vAge;
void main(){if(vAge<0.)discard;float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;float flash=exp(-vAge*6.);
 gl_FragColor=vec4(vec3(1.8,1.1,.3)+flash*.6,exp(-r*r*5.)*(.3+.7*flash)*uOpacity);${materialOutput}}
`;

export const sampleVertex=/* glsl */`
uniform float uTime,uSpread,uPortrait,uCollapse;attribute float aAxis,aMagnitude,aSeed;varying float vSeed,vDepth;
void main(){float x=mix(-4.+(position.x+12.)/24.*9.,position.x,uSpread);x+=smoothstep(72.,76.,uTime)*(position.x+12.)/24.*38.;
 float k=mix(2.2,.82,uSpread),wave=sin(x*k-uTime*3.6)*mix(.7,2.3,uSpread)*aMagnitude;
 wave*=mix(1.,1.3,uPortrait*uSpread)*uCollapse;vec3 p=vec3(x*mix(1.,.72,uPortrait*uSpread),(1.-aAxis)*wave+position.y,aAxis*wave+position.z);vec4 mv=modelViewMatrix*vec4(p,1.);
 gl_Position=projectionMatrix*mv;gl_PointSize=clamp((24.+aSeed*28.)/max(1.,-mv.z),1.,5.);vSeed=aSeed+aAxis;vDepth=-mv.z;}
`;
export const sampleFragment=/* glsl */`
uniform float uOpacity,uTime;varying float vSeed,vDepth;
void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;vec3 c=mix(vec3(.16,.85,2.),vec3(.92,.28,1.8),step(1.,vSeed));float flicker=.35+.65*pow(.5+.5*sin(vSeed*43.-uTime*2.),4.);gl_FragColor=vec4(c,exp(-r*r*5.)*flicker*uOpacity*.65*smoothstep(.3,1.,vDepth));${materialOutput}}
`;
export const hazeVertex=/* glsl */`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const hazeFragment=/* glsl */`
uniform float uTime,uOpacity;varying vec2 vUv;${microNoise}
void main(){vec2 p=vUv-.5;float edge=exp(-dot(p*vec2(1.,2.),p*vec2(1.,2.))*10.);float n=fbm(vec3(vUv*vec2(5.,9.),uTime*.02));float band=exp(-pow((p.y+.12*sin(p.x*9.+n*2.))*12.,2.));vec3 c=mix(vec3(.015,.075,.18),vec3(.13,.035,.19),n);gl_FragColor=vec4(c,edge*band*n*uOpacity*.18);${materialOutput}}
`;
