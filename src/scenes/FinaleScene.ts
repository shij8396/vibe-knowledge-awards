import {Group} from 'three';
import {RecoveredEnergy} from './RecoveredEnergy';
import {disposeGroup,type ChapterScene} from '../core/SceneManager';
import {FINALE_CENTER} from '../utils/finale';
import {propagationPosition} from '../utils/propagation';
import {smooth} from '../utils/cinematic';
/** Reuses the opening flow texture, branching geometry and GPU particles verbatim. */
export class FinaleScene implements ChapterScene{
 readonly root=new Group();private energy:RecoveredEnergy;private time=150;private opacity=1;
 constructor(mobile:boolean){this.energy=new RecoveredEnergy(mobile);this.root.add(this.energy.root);propagationPosition(58,mobile,this.root.position);this.root.position.add(FINALE_CENTER);}
 update(t:number,_p:number){this.time=t;const local=2+5*smooth(155,164,t)+.12*smooth(164,168,t);this.energy.updateFilm(local,.2+.8*smooth(155,163,t));this.energy.setOpacity(this.opacity*smooth(154,160,t)*(1-smooth(168,170,t)));this.energy.root.rotation.y=-.2+.15*smooth(155,165,t);}
 setOpacity(v:number){this.opacity=v;this.update(this.time,0);}
 dispose(){this.energy.dispose();disposeGroup(this.root);}
}
