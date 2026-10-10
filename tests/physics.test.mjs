import test from 'node:test';
import assert from 'node:assert/strict';
import { photonProperties, TRANSITIONS, LIGHT_SPEED, PLANCK, ELEMENTARY_CHARGE } from '../src/utils/physics.ts';
import { waveParameters, wavelengthFromTHz, DISPLAY_SPEED, visibleRGB } from '../src/utils/wave.ts';

test('SI constants and independent 500 nm reference', () => {
  assert.equal(LIGHT_SPEED, 299792458);
  assert.equal(PLANCK, 6.62607015e-34);
  assert.equal(ELEMENTARY_CHARGE, 1.602176634e-19);
  const p = photonProperties(500);
  assert.ok(Math.abs(p.frequencyHz / 1e12 - 599.584916) < 1e-6);
  assert.ok(Math.abs(p.energyEv - 2.479683968664) < 1e-10);
});
test('shorter wavelength gives larger frequency and energy for every selectable gap', () => {
  const values = TRANSITIONS.map(t => photonProperties(t.wavelengthNm));
  for(let i=1;i<values.length;i++) {
    assert.ok(values[i].energyEv > values[i-1].energyEv);
    assert.ok(values[i].frequencyHz > values[i-1].frequencyHz);
  }
});
test('invalid wavelengths are rejected rather than displayed as Infinity or NaN', () => {
  for(const wavelength of [0,-1,NaN,Infinity]) assert.throws(()=>photonProperties(wavelength),RangeError);
});
test('visible range endpoints and frequency control preserve the vacuum speed', () => {
  for(const nm of [380,450,530,650,750]) {
    const frequency=photonProperties(nm).frequencyHz;
    assert.ok(Math.abs(frequency*nm*1e-9-LIGHT_SPEED)<1e-6);
    assert.ok(Math.abs(wavelengthFromTHz(frequency/1e12)-nm)<1e-9);
  }
  assert.ok(Math.abs(photonProperties(380).frequencyHz/1e12-788.9275210526)<1e-8);
  assert.ok(Math.abs(photonProperties(750).frequencyHz/1e12-399.7232773333)<1e-8);
});
test('shorter spatial periods oscillate faster, with the same forward phase velocity',()=>{
  const short=waveParameters(380),long=waveParameters(750);
  assert.ok(short.period<long.period);
  assert.ok(short.omega>long.omega);
  for(const nm of [380,530,750]) {
    const {k,omega,period}=waveParameters(nm);
    assert.ok(Math.abs(k*period-2*Math.PI)<1e-12);
    assert.ok(Math.abs(omega/k-DISPLAY_SPEED)<1e-12);
    // At x=v*t the phase k*x-omega*t stays zero: the crest moves toward +x.
    assert.ok(Math.abs(k*DISPLAY_SPEED*4-omega*4)<1e-12);
  }
});
test('wavelength and RGB bounds prevent invalid shader inputs',()=>{
  for(const nm of [379,751,NaN,Infinity]) assert.throws(()=>waveParameters(nm),RangeError);
  for(const f of [0,-1,NaN,Infinity]) assert.throws(()=>wavelengthFromTHz(f),RangeError);
  for(const nm of [380,440,490,530,580,620,750]) for(const v of visibleRGB(nm)) assert.ok(v>=0&&v<=1);
});
