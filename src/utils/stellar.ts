import { Vector3 } from 'three';
import { smooth } from './cinematic.ts';
export const STELLAR_CENTER=new Vector3(278,-79,-1);
export const STELLAR_RADIUS=12.5;
// Approximate solar radii, not a universal model of all stars.
export const CORE_FRACTION=.25, RADIATIVE_FRACTION=.71;
export const FUSION_STEPS=[
 {start:125,end:126.4,equation:'¹H + ¹H → ²H + e⁺ + νₑ'},
 {start:126.4,end:127.8,equation:'²H + ¹H → ³He + γ'},
 {start:127.8,end:129.8,equation:'³He + ³He → ⁴He + 2¹H'},
] as const;
export function stellarState(t:number){return {reveal:smooth(110,114,t),cut:smooth(120,123,t)*(1-smooth(132.5,134.5,t)),transport:smooth(129.8,132,t),radiation:smooth(133,135,t)};}
export function fusionProgress(t:number,index:number){const s=FUSION_STEPS[index];return smooth(s.start,s.end,t);}
