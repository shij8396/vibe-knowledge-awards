import {Vector3} from 'three';
import {STELLAR_CENTER} from './stellar.ts';
export const EARTH_CENTER=STELLAR_CENTER.clone().add(new Vector3(110,-45,12));
export const EARTH_FILM_RADIUS=7;
export const FINALE_CENTER=EARTH_CENTER.clone().add(new Vector3(110,-25,-4));
