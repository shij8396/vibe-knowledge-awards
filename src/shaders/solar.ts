export const noiseGLSL=`
vec3 hash3(vec3 p){return fract(sin(vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6))))*43758.5453);}
float noise3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash3(i).x,hash3(i+vec3(1,0,0)).x,f.x),mix(hash3(i+vec3(0,1,0)).x,hash3(i+vec3(1,1,0)).x,f.x),f.y),mix(mix(hash3(i+vec3(0,0,1)).x,hash3(i+vec3(1,0,1)).x,f.x),mix(hash3(i+vec3(0,1,1)).x,hash3(i+vec3(1,1,1)).x,f.x),f.y),f.z);}
vec2 cells(vec3 p){vec3 base=floor(p),f=fract(p);float first=8.,second=8.;for(int z=-1;z<=1;z++)for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec3 o=vec3(float(x),float(y),float(z));vec3 point=o+hash3(base+o)*.82+.09-f;float d=dot(point,point);if(d<first){second=first;first=d;}else second=min(second,d);}return vec2(sqrt(first),sqrt(second));}
`;
export const solarVertex=`varying vec3 vLocal,vNormal,vWorld;void main(){vLocal=position;vNormal=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
export const solarSurfaceFragment=`
uniform float uTime,uReveal,uCut,uDetail;varying vec3 vLocal,vNormal,vWorld;
${noiseGLSL}
void main(){if(uReveal<.001)discard;vec3 n=normalize(vLocal);if(n.z>0.&&n.x>1.-uCut)discard;
 vec3 p=n*uDetail;p+=vec3(.18*sin(uTime*.12+n.y*5.),.12*cos(uTime*.09+n.z*7.),.1*sin(uTime*.08));
 vec2 c=cells(p);float lane=smoothstep(.015,.28,c.y-c.x);float fine=noise3(p*4.2);float meso=noise3(n*17.);float rounded=pow(1.-smoothstep(.12,.74,c.x),.7);float hot=(.12+.88*(rounded*.7+lane*.3))*(.64+.48*fine);
 float spots=1.-.7*smoothstep(.68,.86,noise3(n*9.))*smoothstep(.54,.76,meso);
 float mu=max(0.,dot(normalize(vNormal),normalize(cameraPosition-vWorld)));float limb=.32+.68*pow(mu,.35);
 vec3 color=mix(vec3(.26,.048,.005),vec3(1.15,.36,.025),hot)*spots*limb;
 color+=vec3(.45,.21,.04)*pow(hot,6.)*.25;
 gl_FragColor=vec4(color,uReveal);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const interiorFragment=`
uniform float uTime,uReveal,uCut,uTransport,uFusion,uSide;varying vec3 vLocal,vNormal,vWorld;
${noiseGLSL}
void main(){if(uReveal<.001||uCut<.001)discard;float r=length(vLocal)/12.5;if(uSide<.5&&vLocal.x<12.5*(1.-uCut))discard;
 float fine=noise3(vLocal*9.+vec3(uTime*.025,0,0));float flow=.5+.5*sin(r*110.-uTime*.7+noise3(vLocal*2.)*5.);
 vec3 c;if(r<.25){c=mix(mix(vec3(.65,.17,.018),vec3(1.6,.95,.38),fine*.6+.4),mix(vec3(.10,.018,.003),vec3(.32,.095,.009),fine),uFusion);}
 else if(r<.71){float strata=noise3(vLocal*2.4+vec3(0.,uTime*.015,0.));c=mix(vec3(.25,.028,.008),vec3(.85,.28,.035),strata*.5+fine*.25);c+=uTransport*flow*vec3(.22,.13,.03);}
 else{vec2 g=cells(vLocal*2.8);float lane=smoothstep(.015,.13,g.y-g.x);c=mix(vec3(.13,.025,.008),vec3(.7,.24,.045),lane*.7+fine*.2);}
 float border=1.-smoothstep(.012,.023,min(abs(r-.25),abs(r-.71)));c+=vec3(.24,.13,.025)*border;
 gl_FragColor=vec4(c,uReveal);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const filamentVertex=`attribute float aSeed;varying float vAlong,vSeed;void main(){vAlong=uv.x;vSeed=aSeed;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
export const filamentFragment=`uniform float uTime,uReveal,uCut,uTransport,uKind;varying float vAlong,vSeed;
void main(){if(uReveal<.001)discard;float pulse=pow(.5+.5*sin(vAlong*18.-uTime*(.55+vSeed)+vSeed*30.),8.);float envelope=sin(vAlong*3.14159);float activation=uKind<.5?1.:uCut*(.1+.9*uTransport);float a=(.15+.75*pulse)*(.3+.7*envelope)*activation*uReveal;gl_FragColor=vec4(mix(vec3(1.2,.22,.028),vec3(1.4,.84,.3),pulse),a*.65);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const coronaFragment=`uniform float uTime,uReveal;varying vec3 vLocal,vNormal,vWorld;${noiseGLSL}
void main(){if(uReveal<.001)discard;vec3 v=normalize(cameraPosition-vWorld);float rim=pow(1.-abs(dot(v,normalize(vNormal))),3.);float irregular=.35+.65*noise3(normalize(vLocal)*14.+uTime*.014);gl_FragColor=vec4(1.1,.4,.045,rim*irregular*uReveal*.19);}`;
export const nuclearVertex=`varying vec3 vLocal,vNormal,vWorld,vColor;void main(){vLocal=position;vec4 p=vec4(position,1.);
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;vColor=instanceColor;
 #else
 vColor=vec3(1.);
 #endif
 vec4 w=modelMatrix*p;vWorld=w.xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
export const nuclearFragment=`uniform float uReveal;varying vec3 vLocal,vNormal,vWorld,vColor;${noiseGLSL}
void main(){if(uReveal<.001)discard;float mu=max(0.,dot(normalize(vNormal),normalize(cameraPosition-vWorld)));float texture=noise3(vLocal*35.);float light=max(.1,dot(normalize(vNormal),normalize(vec3(-.4,.6,1.))));vec3 c=vColor*(.2+light*.6)*( .7+.3*texture)+vColor*pow(1.-mu,3.)*.4;gl_FragColor=vec4(c,uReveal);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;

