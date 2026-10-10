import { CatmullRomCurve3, PerspectiveCamera, Vector3 } from 'three';
import { clampFilmTime, FILM_DURATION } from '../utils/film.ts';

/** Absolute curve sampling: seeking, pausing and replaying never depend on a previous frame. */
export class CinematicCameraController {
    readonly camera=new PerspectiveCamera(42,innerWidth/innerHeight,.1,120);
    private path=new CatmullRomCurve3([
        new Vector3(0,0,19),new Vector3(1,.5,16),new Vector3(1.4,.4,12),
        new Vector3(2,1,12),new Vector3(.5,.6,14),new Vector3(2,.7,15),
        new Vector3(1.4,1.5,16),new Vector3(-1,1.2,17),new Vector3(0,0,20)
    ],false,'centripetal');
    private position=new Vector3();
    private target=new Vector3();
    update(time:number,reduced=false){
        const p=clampFilmTime(time)/FILM_DURATION;
        this.path.getPoint(p,this.position);
        if(reduced)this.position.set(0,0,17);
        const follow=Math.sin(Math.PI*Math.max(0,Math.min(1,(time-37)/15)))*.8;
        this.target.set(follow,.08*Math.sin(p*Math.PI),0);
        if(reduced)this.target.set(0,0,0);
        this.camera.position.copy(this.position);
        // Portrait needs enough width for the same wave model, without changing its science.
        if(innerWidth<760)this.camera.position.z*=1.18;
        this.camera.lookAt(this.target);
        this.camera.fov=reduced?42:42-3*Math.sin(p*Math.PI);
        this.camera.updateProjectionMatrix();
    }
    resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
}
