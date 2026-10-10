import test from 'node:test';
import assert from 'node:assert/strict';
import { CORE_FRACTION,RADIATIVE_FRACTION,stellarState,fusionProgress,FUSION_STEPS } from '../src/utils/stellar.ts';

test('solar cutaway separates core, radiative layer and convection, and closes before exit',()=>{
 assert.ok(0<CORE_FRACTION&&CORE_FRACTION<RADIATIVE_FRACTION&&RADIATIVE_FRACTION<1);
 assert.equal(stellarState(106).reveal,0);assert.equal(stellarState(110).reveal,0);assert.equal(stellarState(115).reveal,1);
 assert.equal(stellarState(119).cut,0);assert.equal(stellarState(123).cut,1);assert.equal(stellarState(135).cut,0);
 assert.equal(stellarState(129).transport,0);assert.equal(stellarState(132).transport,1);assert.equal(stellarState(132).radiation,0);assert.equal(stellarState(135).radiation,1);
});
test('pp-I chain is staged through deuterium and helium-3, not four protons colliding at once',()=>{
 assert.match(FUSION_STEPS[0].equation,/²H.*e⁺.*ν/);assert.match(FUSION_STEPS[1].equation,/³He.*γ/);assert.match(FUSION_STEPS[2].equation,/⁴He.*2¹H/);
 for(let i=0;i<3;i++){assert.equal(fusionProgress(124,i),0);assert.equal(fusionProgress(130,i),1);let previous=0;for(let t=124;t<=130;t+=.1){const p=fusionProgress(t,i);assert.ok(p>=previous&&p>=0&&p<=1);previous=p;}}
 assert.equal(fusionProgress(126,1),0);assert.equal(fusionProgress(127,2),0);
});
