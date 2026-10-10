import type { MasterTimeline } from './MasterTimeline';
import { scenesAt, type FilmSceneId } from '../utils/film';
import { IntroScene } from '../scenes/IntroScene';
import { AtomicScene } from '../scenes/AtomicScene';
import { WaveScene } from '../scenes/WaveScene';
import {EarthIlluminationScene} from '../scenes/EarthIlluminationScene';
import {FinaleScene} from '../scenes/FinaleScene';
import { StellarScene } from '../scenes/StellarScene';
import { PrismDispersionScene } from '../scenes/PrismDispersionScene';
import { LightSpeedScene } from '../scenes/LightSpeedScene';
import { ElectromagneticFieldScene } from '../scenes/ElectromagneticFieldScene';
import { PhotonPropagationScene } from '../scenes/PhotonPropagationScene';
import { Scene, Group, Mesh, Points, Material, InstancedMesh, WebGLRenderTarget, type WebGLRenderer, type PerspectiveCamera } from 'three';
export interface ChapterScene {
    readonly root: Group;
    update(time: number, progress: number): void;
    setOpacity(value: number): void;
    dispose(): void;
}
export function disposeGroup(root: Group) {
    const materials = new Set<Material>();
    root.traverse(object => {
        if (object instanceof Mesh || object instanceof Points) {
            object.geometry.dispose();
            if (object instanceof InstancedMesh)
                object.dispose();
            (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m));
        }
    });
    materials.forEach(m => m.dispose());
    root.clear();
}
export class SceneManager {
    readonly scene = new Scene();
    private live = new Map<FilmSceneId, ChapterScene>();
    private cache=new Map<FilmSceneId,ChapterScene>();
    private disposed=false;private created=0;private released=0;
    constructor(private mobile:boolean) {}
    private obtain(id:FilmSceneId){let chapter=this.cache.get(id);if(chapter)return chapter;
      chapter=id==='intro'?new IntroScene(this.mobile):id==='atomic'?new AtomicScene(this.mobile):id==='propagation'?new PhotonPropagationScene(this.mobile):id==='electromagnetic'?new ElectromagneticFieldScene(this.mobile):id==='lightSpeed'?new LightSpeedScene(this.mobile):id==='dispersion'?new PrismDispersionScene(this.mobile):id==='stellar'?new StellarScene(this.mobile):id==='earth'?new EarthIlluminationScene(this.mobile):id==='finale'?new FinaleScene(this.mobile):new WaveScene(this.mobile);
      this.cache.set(id,chapter);this.created++;return chapter;
    }
    /** Bounded film asset pool: allocate once before playback, reuse for seeks, release on app exit. */
    async prepareFilm(renderer:WebGLRenderer,camera:PerspectiveCamera,state:MasterTimeline['state'],opening:MasterTimeline['opening']){
      for(const id of ['intro','atomic','propagation','electromagnetic','lightSpeed','dispersion','stellar','earth','finale'] as FilmSceneId[]){if(this.disposed)return;this.obtain(id);await new Promise(resolve=>setTimeout(resolve,0));}
      await (this.cache.get('earth') as EarthIlluminationScene).ready;
      const speed=this.cache.get('lightSpeed') as LightSpeedScene;
      for(let i=0;i<100&&Object.values(speed.assetStatus).includes('loading');i++)await new Promise(resolve=>setTimeout(resolve,50));
      const stagingCamera=camera.clone(),target=new WebGLRenderTarget(8,8),previous=renderer.getRenderTarget();
      const culling=new Map<import('three').Object3D,boolean>();
      try{for(const t of [0,13,23,45,49,59,65,77,84,90.2,106,115,133,143,153,163]){
        if(this.disposed)return;this.renderFrame(t,state,false,opening);const active=[...this.live.values()];
        stagingCamera.position.copy(active.at(-1)!.root.position).addScalar(20);stagingCamera.lookAt(active.at(-1)!.root.position);stagingCamera.updateProjectionMatrix();
        active.forEach(c=>c.root.traverse(o=>{if(!culling.has(o))culling.set(o,o.frustumCulled);o.frustumCulled=false;}));
        await renderer.compileAsync(this.scene,stagingCamera);
        for(const c of active)if(c instanceof StellarScene||c instanceof EarthIlluminationScene)c.prepareTextures(renderer);
        renderer.setRenderTarget(target);renderer.render(this.scene,stagingCamera);renderer.setRenderTarget(previous);await new Promise(resolve=>setTimeout(resolve,0));
      }}finally{culling.forEach((value,o)=>o.frustumCulled=value);renderer.setRenderTarget(previous);target.dispose();this.scene.clear();this.live.clear();}
    }
    renderFrame(time:number,state:MasterTimeline['state'],reduced:boolean,opening:MasterTimeline['opening'],camera?:PerspectiveCamera){
        const required=scenesAt(time);
        for(const [id,chapter] of this.live) if(!required.includes(id)) {
            this.scene.remove(chapter.root);this.live.delete(id);
        }
        for(const id of required) {
            let chapter=this.live.get(id);
            if(!chapter){chapter=this.obtain(id);this.live.set(id,chapter);this.scene.add(chapter.root);}
            const shaderTime=reduced?0:time;
            if(chapter instanceof IntroScene){chapter.updateFilm(shaderTime,state.birth,opening,reduced);if(camera)chapter.setFocus(camera.position.length());}
            if(chapter instanceof AtomicScene){
                Object.assign(chapter.state,{excitation:state.excitation,photon:state.photon,photonVisible:state.photonVisible,incoming:state.incoming});
                chapter.updateFilm(shaderTime);
                chapter.updateOpening(time,opening,reduced);
            }
            if(chapter instanceof WaveScene) chapter.updateFilm(reduced?48:time,state.waveAmplitude);
            if(chapter instanceof PhotonPropagationScene) chapter.update(reduced?45:time,0);
            if(chapter instanceof ElectromagneticFieldScene) chapter.update(reduced?66:time,0);
            if(chapter instanceof LightSpeedScene){chapter.update(reduced?84:time,0);if(camera)chapter.updateView(camera);}
            if(chapter instanceof PrismDispersionScene){chapter.update(reduced?101:time,0);if(camera)chapter.updateView(camera);}
            if(chapter instanceof StellarScene){chapter.update(reduced?123:time,0);if(camera)chapter.updateView(camera);}
            if(chapter instanceof EarthIlluminationScene)chapter.update(time,0);
            if(chapter instanceof FinaleScene)chapter.update(reduced?165:time,0);
            chapter.setOpacity(state[id]);
        }
    }
    get diagnostics(){return {active:[...this.live.keys()],created:this.created,released:this.released,live:this.live.size,assets:{earth:(this.cache.get('earth') as EarthIlluminationScene|undefined)?.assetStatus,scale:(this.cache.get('lightSpeed') as LightSpeedScene|undefined)?.assetStatus},cached:this.cache.size};}
    projectLevels(camera:PerspectiveCamera){const atom=this.live.get('atomic');return atom instanceof AtomicScene?atom.projectLevels(camera):undefined;}
    dispose(){this.disposed=true;for(const chapter of this.cache.values()){this.scene.remove(chapter.root);chapter.dispose();this.released++;}this.cache.clear();this.live.clear();}
}
