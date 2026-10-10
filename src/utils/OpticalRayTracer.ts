import { Euler, Matrix4, Quaternion, Vector3 } from 'three';

export const PRISM_POSITION=new Vector3(184,0,-3);
export const PRISM_ROTATION=new Euler(.04,.2,-.035);
const transform=new Matrix4().compose(PRISM_POSITION,new Quaternion().setFromEuler(PRISM_ROTATION),new Vector3(1,1,1));
const inverse=transform.clone().invert();
const vertices=[new Vector3(-2.4,-2,0),new Vector3(2.4,-2,0),new Vector3(0,2.5,0)];
/** SCHOTT N-BK7 Sellmeier coefficients. Vacuum wavelength converted nm -> micrometres.
 * Source: https://media.schott.com/api/public/content/41e799d0bf874807a0bb8e702fbb75b5?v=54856406
 */
export function glassIndex(nm:number){
 if(!Number.isFinite(nm)||nm<380||nm>700)throw new RangeError('Visible vacuum wavelength must be 380–700 nm');
 const l2=(nm*.001)**2;
 return Math.sqrt(1+1.03961212*l2/(l2-.00600069867)+.231792344*l2/(l2-.0200179144)+1.01046945*l2/(l2-103.560653));
}
/** Normal points into incident medium; null explicitly represents total internal reflection. */
export function refract(direction:Vector3,normal:Vector3,n1:number,n2:number){
 const d=direction.clone().normalize(),n=normal.clone().normalize(),cos=-d.dot(n),eta=n1/n2,k=1-eta*eta*(1-cos*cos);
 if(k<0)return null;
 return d.multiplyScalar(eta).addScaledVector(n,eta*cos-Math.sqrt(k)).normalize();
}
function intersection(origin:Vector3,d:Vector3){
 let closest=Infinity,result:{point:Vector3;normal:Vector3}|undefined;
 const consider=(point:Vector3,normal:Vector3,t:number)=>{if(t>1e-5&&t<closest){closest=t;result={point,normal};}};
 for(let i=0;i<3;i++){
  const a=vertices[i],b=vertices[(i+1)%3],edge=b.clone().sub(a),normal=new Vector3(edge.y,-edge.x,0).normalize(),den=normal.dot(d);
  if(Math.abs(den)<1e-8)continue;
  const t=normal.dot(a.clone().sub(origin))/den,p=origin.clone().addScaledVector(d,t),u=p.clone().sub(a).dot(edge)/edge.lengthSq();
  if(u>=0&&u<=1&&Math.abs(p.z)<=1.1+1e-7)consider(p,normal,t);
 }
 for(const sign of [-1,1]){
  if(Math.abs(d.z)<1e-8)continue;
  const t=(sign*1.1-origin.z)/d.z,p=origin.clone().addScaledVector(d,t);
  if(vertices.every((a,i)=>{const b=vertices[(i+1)%3];return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x)>=-1e-8;}))consider(p,new Vector3(0,0,sign),t);
 }
 if(!result)throw new Error('Ray misses finite prism');return result;
}
export interface OpticalRay{nm:number;index:number;entry:Vector3;exit:Vector3;inside:Vector3;outgoing:Vector3;entryNormal:Vector3;exitNormal:Vector3;}
export function tracePrism(nm:number):OpticalRay{
 const index=glassIndex(nm),origin=new Vector3(150,0,-3).applyMatrix4(inverse),d=new Vector3(1,0,0).transformDirection(inverse);
 const first=intersection(origin,d),inside=refract(d,first.normal,1,index);if(!inside)throw new Error('Invalid entry');
 const second=intersection(first.point.clone().addScaledVector(inside,1e-4),inside),outgoing=refract(inside,second.normal.clone().negate(),index,1);if(!outgoing)throw new Error('Prism configuration causes total internal reflection');
 return {nm,index,entry:first.point.applyMatrix4(transform),exit:second.point.applyMatrix4(transform),inside:inside.transformDirection(transform),outgoing:outgoing.transformDirection(transform),entryNormal:first.normal.transformDirection(transform),exitNormal:second.normal.transformDirection(transform)};
}
export function spectrumRays(count=64){return Array.from({length:count},(_,i)=>tracePrism(380+320*i/(count-1)));}
/** Rendering only: enlarge deviation from the mean ray, never the Snell solution inside glass. */
export function displayDirection(ray:OpticalRay){const mean=tracePrism(550).outgoing;return mean.add(ray.outgoing.clone().sub(mean).multiplyScalar(2.5)).normalize();}
