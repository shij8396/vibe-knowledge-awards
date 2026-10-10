import { smooth } from './cinematic.ts';
/** Preserve shader motion while adding a brief inward gathering of the existing swarm.
 * Compensate its two birth scales; all positions remain absolute functions of film time. */
export function openingSwarmScale(time:number,birth:number):number {
    if(time>=11)return 1;
    const radius=.12+.72*smooth(.7,3,time)-.20*smooth(3,6,time)+.86*smooth(6,11,time);
    const original=(.06+.94*birth)*1.5*(.08+.92*birth);
    return radius/Math.max(.0072,original);
}
