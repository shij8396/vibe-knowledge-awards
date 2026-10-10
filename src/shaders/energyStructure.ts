// Abstract energy transfer structure, not electron or photon trajectories.
export const energyVertex=/* glsl */ `
uniform float uTime,uHeight;attribute float aSeed,aKind,aRadius;
varying float vAlong,vSeed,vKind,vDepth,vCoverage;varying vec3 vNormal,vView;
void main(){vec3 p=position;
 // Perturbation must remain smaller than the channel radius; absolute offsets invert thin tubes.
 p+=normal*sin(p.x*3.1+p.z*2.7+uTime*.7+aSeed*20.)*aRadius*.12;
 vec4 mv=modelViewMatrix*vec4(p,1.);
 float pixelWorld=2.*max(.01,-mv.z)/(projectionMatrix[1][1]*max(1.,uHeight));
 float filteredRadius=max(aRadius,pixelWorld*.45);
 p+=normal*(filteredRadius-aRadius);
 vCoverage=aRadius/filteredRadius;
 mv=modelViewMatrix*vec4(p,1.);vAlong=uv.x;vSeed=aSeed;vKind=aKind;
 vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);vDepth=-mv.z;
 gl_Position=projectionMatrix*mv;
}`;
export const energyFragment=/* glsl */ `
uniform float uTime,uBirth,uMicro,uOpacity,uStructural;
varying float vAlong,vSeed,vKind,vDepth,vCoverage;varying vec3 vNormal,vView;
void main(){
 float phase=fract(vAlong-uTime*(.055+vSeed*.085)+vSeed*3.);
 float packet=exp(-pow((phase-.5)*15.,2.));
 float fine=.65+.35*sin(vAlong*145.+vSeed*30.-uTime*.9);
 float rim=pow(max(0.,1.-abs(dot(normalize(vNormal),normalize(vView)))),1.4);
 float corePulse=.75+.25*sin(uTime*2.3-vAlong*8.+vSeed*5.);
 float intensity=(.035+packet*.65)*fine*mix(1.,.8,step(1.5,vKind));
 vec3 warm=mix(vec3(.75,.25,.035),vec3(1.5,1.04,.45),packet*.75+vKind*.2);
 vec3 color=mix(warm,vec3(.19,.37,.85),uMicro*(1.-vKind)*.3);
 float envelope=smoothstep(0.,.07,vAlong)*(1.-smoothstep(.93,1.,vAlong));
 float reveal=smoothstep(.03,.35,uBirth);
 float alpha=intensity*(.45+.55*rim)*envelope*reveal*uOpacity*mix(1.,.25,uMicro);
 if(uStructural>.5){color=vec3(.095,.035,.008)*(.4+.6*rim);alpha=envelope*reveal*uOpacity*.12*mix(1.,.25,uMicro);}
 alpha*=vCoverage*smoothstep(.25,1.5,vDepth)*exp(-max(0.,vDepth-12.)*.025);
 gl_FragColor=vec4(color*mix(1.,corePulse,min(1.,vKind)),alpha);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
