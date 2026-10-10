import { LIGHT_SPEED } from './physics.ts';

export const NM_TO_SCENE = .005;
export const DISPLAY_SPEED = .85;
export const MIN_WAVELENGTH = 380;
export const MAX_WAVELENGTH = 750;
export function wavelengthFromTHz(frequency: number) {
    if (!Number.isFinite(frequency) || frequency <= 0) throw new RangeError('频率必须为正数');
    return LIGHT_SPEED / (frequency * 1e3);
}
export function waveParameters(wavelengthNm: number) {
    if (!Number.isFinite(wavelengthNm) || wavelengthNm < MIN_WAVELENGTH || wavelengthNm > MAX_WAVELENGTH)
        throw new RangeError('可见光演示波长须在 380–750 nm 之间');
    const period = wavelengthNm * NM_TO_SCENE;
    const k = 2 * Math.PI / period;
    return { period, k, omega: k * DISPLAY_SPEED };
}
/** Smooth illustrative RGB mapping, not colorimetry or a display-gamut guarantee. */
export function visibleRGB(nm: number): [number, number, number] {
    const stops = [[380,.38,.12,.9],[440,.2,.25,1],[490,.05,.8,1],[530,.15,1,.3],[580,1,.85,.1],[620,1,.27,.05],[750,.7,.04,.02]];
    const n = Math.max(380, Math.min(750, nm));
    const i = Math.min(stops.length - 2, Math.max(0, stops.findIndex((s, index) => index > 0 && n <= s[0]) - 1));
    const a = stops[i], b = stops[i + 1], t = (n - a[0]) / (b[0] - a[0]);
    return [a[1] + (b[1]-a[1])*t, a[2] + (b[2]-a[2])*t, a[3] + (b[3]-a[3])*t];
}
