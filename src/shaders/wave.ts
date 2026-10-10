export const fieldVertex = `
uniform float uK, uPhase, uAmplitude, uPlane, uKind;
varying float vEdge, vX;
void main(){
  float x=position.x;
  float value=sin(uK*x-uPhase)*uAmplitude;
  // A ribbon from the propagation axis to the field tip, or a thin luminous edge.
  float height=uKind<.5 ? value*position.y : value+position.y*.024;
  vec3 p=uPlane<.5 ? vec3(x,height,position.z) : vec3(x,position.z,height);
  vEdge=position.y; vX=x;
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
export const fieldFragment = `
uniform vec3 uColor;
uniform float uOpacity, uKind;
varying float vEdge, vX;
void main(){
 float fade=smoothstep(0.,.8,5.6-abs(vX));
 float alpha=uKind<.5 ? .13+.14*abs(vEdge) : .92;
 gl_FragColor=vec4(uColor*(uKind<.5 ? .75 : 1.6),alpha*fade*uOpacity);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
export const arrowVertex = `
uniform float uK,uPhase,uAmplitude,uPlane;
attribute float aX;
varying float vX;
void main(){
 float value=sin(uK*aX-uPhase)*uAmplitude;
 vec3 p=position; p.y*=value;
 p.x+=aX;
 if(uPlane>.5) p=vec3(p.x,p.z,p.y);
 vX=aX;
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
export const arrowFragment = `
uniform vec3 uColor; uniform float uOpacity;
varying float vX;
void main(){gl_FragColor=vec4(uColor, .65*uOpacity*smoothstep(0.,.6,5.6-abs(vX)));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
