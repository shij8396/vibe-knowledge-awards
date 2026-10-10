/** SI defining constants (exact); wavelength here always means vacuum wavelength. */
export const PLANCK = 6.62607015e-34;
export const LIGHT_SPEED = 299792458;
export const ELEMENTARY_CHARGE = 1.602176634e-19;
export const TRANSITIONS = [
    { id: 'red', label: '暖红', wavelengthNm: 650, color: '#ff633d' },
    { id: 'green', label: '翠绿', wavelengthNm: 530, color: '#78efad' },
    { id: 'blue', label: '冰蓝', wavelengthNm: 450, color: '#6f9fff' },
] as const;
export type TransitionId = typeof TRANSITIONS[number]['id'];
export function photonProperties(wavelengthNm: number) {
    if (!Number.isFinite(wavelengthNm) || wavelengthNm <= 0)
        throw new RangeError('波长必须为正数');
    const frequencyHz = LIGHT_SPEED / (wavelengthNm * 1e-9);
    const energyJ = PLANCK * frequencyHz;
    return { wavelengthNm, frequencyHz, energyJ, energyEv: energyJ / ELEMENTARY_CHARGE };
}
