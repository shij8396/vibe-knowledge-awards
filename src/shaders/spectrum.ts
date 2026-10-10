export const spectrumVertex=`
attribute float aDistance;attribute float aWavelength;attribute float aEdge;
varying float vDistance;varying float vWavelength;varying float vEdge;
void main(){vDistance=aDistance;vWavelength=aWavelength;vEdge=aEdge;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const spectrumFragment=`
uniform float uTime,uReveal,uLength,uOpacity,uInside;
varying float vDistance,vWavelength,vEdge;
vec3 spectral(float l){
 vec3 c=l<440.?vec3((440.-l)/60.,0.,1.):l<490.?vec3(0.,(l-440.)/50.,1.):l<510.?vec3(0.,1.,(510.-l)/20.):l<580.?vec3((l-510.)/70.,1.,0.):l<645.?vec3(1.,(645.-l)/65.,0.):vec3(1.,0.,0.);
 return c*mix(.42,1.,smoothstep(380.,425.,l))*(1.-.65*smoothstep(660.,700.,l));
}
void main(){
 float front=1.-smoothstep(uLength-.7,uLength+.7,vDistance);
 float grain=.965+.035*sin(vDistance*13.-uTime*3.+vWavelength*.27);
 float pulse=.8+.2*pow(.5+.5*sin(vDistance*.65-uTime*2.),5.);
 float edge=smoothstep(0.,.06,vEdge)*smoothstep(0.,.06,1.-vEdge);
 float handoff=smoothstep(107.,110.,uTime)*smoothstep(45.,80.,vDistance);
 float alpha=uReveal*uOpacity*front*edge*exp(-vDistance*.009)*grain*(1.-smoothstep(90.,120.,vDistance))*mix(1.,.12,handoff);
 if(alpha<.002)discard;
 vec3 c=mix(spectral(vWavelength),vec3(.86,.94,1.),uInside*.72);
 c=mix(c,vec3(1.,.75,.42),handoff*.8);gl_FragColor=vec4(c*pulse*1.3,alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const dustVertex=`
attribute float aSeed;uniform float uTime;varying float vSeed;
void main(){vSeed=aSeed;vec3 p=position;p.y+=.06*sin(uTime*.6+aSeed*21.);vec4 v=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*v;gl_PointSize=clamp((1.+aSeed*2.)*90./max(1.,-v.z),1.,12.);}`;
export const dustFragment=`
varying float vSeed;uniform float uOpacity;
void main(){float r=length(gl_PointCoord-.5);float a=exp(-r*r*24.)*(1.-smoothstep(.35,.5,r))*uOpacity;if(a<.004)discard;gl_FragColor=vec4(mix(vec3(.18,.32,.7),vec3(1.,.63,.22),step(.82,vSeed)),a*.32);}`;
