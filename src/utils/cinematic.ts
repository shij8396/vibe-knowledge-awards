import { Vector3 } from 'three';

export const smooth = (a:number,b:number,t:number) => {
    const u=Math.max(0,Math.min(1,(t-a)/(b-a)));
    return u*u*(3-2*u);
};
export interface ShotKey { time:number; position:Vector3; target:Vector3; fov:number; }

/** Time-parametrized Hermite interpolation; neighbouring segments share their velocity. */
export function sampleShot(keys:readonly ShotKey[],time:number,position:Vector3,target:Vector3):number {
    let i=0;
    while(i<keys.length-2&&time>keys[i+1].time)i++;
    const a=keys[i],b=keys[i+1],previous=keys[Math.max(0,i-1)],next=keys[Math.min(keys.length-1,i+2)];
    const dt=b.time-a.time,u=Math.max(0,Math.min(1,(time-a.time)/dt));
    const h0=2*u*u*u-3*u*u+1,h1=u*u*u-2*u*u+u,h2=-2*u*u*u+3*u*u,h3=u*u*u-u*u;
    for(const axis of ['x','y','z'] as const) {
        position[axis]=h0*a.position[axis]+h1*dt*(b.position[axis]-previous.position[axis])/(b.time-previous.time)
            +h2*b.position[axis]+h3*dt*(next.position[axis]-a.position[axis])/(next.time-a.time);
        target[axis]=h0*a.target[axis]+h1*dt*(b.target[axis]-previous.target[axis])/(b.time-previous.time)
            +h2*b.target[axis]+h3*dt*(next.target[axis]-a.target[axis])/(next.time-a.time);
    }
    return h0*a.fov+h1*dt*(b.fov-previous.fov)/(b.time-previous.time)+h2*b.fov+h3*dt*(next.fov-a.fov)/(next.time-a.time);
}
/** Straight direction of travel; the envelope is a visual symbol, not a photon trajectory. */
export function openingPacket(progress:number,out:Vector3) {
    return out.set(-8+6.95*progress,.65-.45*progress,3.15-2.25*progress);
}
