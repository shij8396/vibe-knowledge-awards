export const earthVertex=`varying vec2 vUv;varying vec3 vN,vWorld;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`;
export const earthFragment=`uniform sampler2D uMap,uCloud;uniform vec3 uSun;uniform float uOpacity,uReady;varying vec2 vUv;varying vec3 vN,vWorld;
void main(){if(uReady<.5)discard;vec3 n=normalize(vN),l=normalize(uSun-vWorld),v=normalize(cameraPosition-vWorld);vec3 albedo=texture2D(uMap,vUv).rgb;float day=max(dot(n,l),0.);float ocean=smoothstep(.01,.07,albedo.b-max(albedo.r,albedo.g));float glint=pow(max(dot(n,normalize(l+v)),0.),100.)*ocean*day;float shadow=texture2D(uCloud,vUv+vec2(.002,-.001)).r;vec3 c=albedo*(.016+1.4*day)*(1.-.22*shadow)+vec3(1.,.82,.57)*glint*.7;gl_FragColor=vec4(c,uOpacity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export const earthCloudFragment=`uniform sampler2D uCloud;uniform vec3 uSun;uniform float uOpacity,uReady;varying vec2 vUv;varying vec3 vN,vWorld;void main(){if(uReady<.5)discard;float a=texture2D(uCloud,vUv).r;float day=max(dot(normalize(vN),normalize(uSun-vWorld)),0.);gl_FragColor=vec4(vec3(.68,.78,.88)*(.025+day*1.3),smoothstep(.07,.8,a)*uOpacity*.83);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
export const earthAtmosphereFragment=`uniform vec3 uSun;uniform float uOpacity;varying vec2 vUv;varying vec3 vN,vWorld;void main(){vec3 n=normalize(vN),v=normalize(cameraPosition-vWorld),l=normalize(uSun-vWorld);float mu=max(dot(n,v),0.);float rim=pow(1.-mu,5.);float sun=dot(n,l);float twilight=exp(-pow(sun/.15,2.));float day=smoothstep(-.22,.5,sun);vec3 c=mix(vec3(.035,.24,.85),vec3(1.1,.42,.09),twilight*.7);gl_FragColor=vec4(c,rim*(.04+.58*day+.15*twilight)*uOpacity);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;
