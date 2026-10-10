import { Vector3 } from 'three';
import { smooth } from './cinematic.ts';
const flight=[[45,0,8.8],[47,18,10],[50,55,14],[53,96,12],[56,121,5],[58,128,2]];
/** Straight propagation, cinematic units. Camera movement never defines the photon trajectory. */
export function propagationDistance(time:number){
 const t=Math.max(45,Math.min(58,time));let i=0;while(i<flight.length-2&&t>flight[i+1][0])i++;
 const a=flight[i],b=flight[i+1],dt=b[0]-a[0],u=(t-a[0])/dt;
 return (2*u*u*u-3*u*u+1)*a[1]+(u*u*u-2*u*u+u)*dt*a[2]+(-2*u*u*u+3*u*u)*b[1]+(u*u*u-u*u)*dt*b[2];
}
export function propagationPosition(t:number,mobile:boolean,out:Vector3){
 const scale=mobile?.95:1.65,angle=.05*Math.sin(45*.09),x=9.75*scale,z=.25*scale;
 return out.set(x*Math.cos(angle)+z*Math.sin(angle)+propagationDistance(t),-.72*scale,-x*Math.sin(angle)+z*Math.cos(angle));
}
export const propagationReveal=(t:number)=>smooth(45,46.5,t);
