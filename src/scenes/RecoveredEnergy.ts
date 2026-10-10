/** Recovered from the original film source in the local session record.
 * Owned and disposed by IntroScene; all animation uses MasterTimeline time/birth.
 * Energy arms are artistic symbols, not electron trajectories. */
import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, PlaneGeometry, Points, ShaderMaterial, SphereGeometry, Vector3 } from 'three';
import { coreFragment, coreVertex, haloFragment, haloVertex, particleFragment, particleVertex } from '../shaders/recoveredEnergy';
import { random } from '../utils/random';
import { smooth } from '../utils/cinematic.ts';
import { organizedParticleVertex, organizedParticleFragment, interiorVertex, interiorFragment } from '../shaders/organizedEnergy';
import { OpeningEnergyStructure } from './OpeningEnergyStructure';
import { createOpeningFlow } from '../utils/openingFlow';
export class RecoveredEnergy {
    readonly root = new Group();
    private energy = new Group();
    private flow=createOpeningFlow();
    private uniforms = { uTime: { value: 0 }, uBirth: { value: 0 }, uProgress: { value: 0 }, uRatio: { value: 1 }, uHeight: {value:innerHeight}, uOpacity: { value: 1 }, uMicro: { value: 0 },uFlow:{value:this.flow.texture},uFlowCount:{value:this.flow.channels.length} };
    private core: Mesh;
    private swarm: Points;
    // The retained camera now passes much closer than the original film.
    // Separate halo/core gain keeps the restored glow from covering the atom.
    private glowOpacity = { value: .22 };
    private coreOpacity = {value:1};
    constructor(mobile: boolean) {
        this.energy.add(new OpeningEnergyStructure(mobile,this.uniforms,this.flow.channels).root);
        const rng = random(), count = mobile ? 6500 : 17000;
        const positions = new Float32Array(count * 3), sizes = new Float32Array(count), seeds = new Float32Array(count),arms = new Float32Array(count),phases = new Float32Array(count),kinds=new Float32Array(count),flowSeeds=new Float32Array(count);
        for (let i = 0; i < count; i++) {
            const population=rng(),arm=population<.25?Math.floor(rng()*4):population<.5?4+Math.floor(rng()*28):32+Math.floor(rng()*(this.flow.channels.length-32));
            const t=rng(),channel=this.flow.channels[arm];arms[i]=arm;phases[i]=t;kinds[i]=population>.92?3:channel.kind;
            flowSeeds[i]=channel.seed;
            const p=population>.92?new Vector3((rng()-.5)*17,(rng()-.5)*12,(rng()-.5)*18):channel.curve.getPoint(t);
            positions[i*3]=p.x;positions[i*3+1]=p.y;positions[i*3+2]=p.z;
            sizes[i] = .35 + rng() * 1.1;
            seeds[i] = .25 + rng() * .75;
        }
        const geometry = new BufferGeometry();
        const targets=new Float32Array(count*3);
        const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(.00001,rng())))*Math.cos(rng()*Math.PI*2);
        for(let i=0;i<count;i++){targets[i*3]=gaussian()*.62;targets[i*3+1]=gaussian()*.62;targets[i*3+2]=gaussian()*.62;}
        geometry.setAttribute('aArm',new BufferAttribute(arms,1));geometry.setAttribute('aPhase',new BufferAttribute(phases,1));
        geometry.setAttribute('aKind',new BufferAttribute(kinds,1));
        geometry.setAttribute('aFlowSeed',new BufferAttribute(flowSeeds,1));
        geometry.setAttribute('aTarget',new BufferAttribute(targets,3));
        geometry.setAttribute('position', new BufferAttribute(positions, 3));
        geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
        geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
        this.swarm = new Points(geometry, new ShaderMaterial({ uniforms: this.uniforms, vertexShader: organizedParticleVertex, fragmentShader: organizedParticleFragment, transparent: true, depthWrite: false, blending: AdditiveBlending }));
        // GPU positions differ from the static seed coordinates. Do not cull the live flow using that seed box.
        this.swarm.frustumCulled=false;
        this.energy.add(this.swarm);
        const halo = new Mesh(new PlaneGeometry(11, 11), new ShaderMaterial({ uniforms: { ...this.uniforms, uOpacity: this.glowOpacity }, vertexShader: haloVertex, fragmentShader: haloFragment, transparent: true, depthWrite: false, blending: AdditiveBlending }));
        halo.position.set(-.12,.05,-.8);
        this.energy.add(halo);
        this.core = new Mesh(new SphereGeometry(.105, 32, 24), new ShaderMaterial({ uniforms: { ...this.uniforms, uOpacity: this.coreOpacity }, vertexShader: coreVertex, fragmentShader: coreFragment, transparent:true, depthWrite:false }));
        this.energy.add(this.core);
        this.core.position.set(-.12,.05,-.8);
        // Sparse intersecting scattering slices supplement the 3D particles, never an enclosing surface.
        const sliceGeometry=new PlaneGeometry(2.2,1.8);
        for(let i=0;i<(mobile?4:7);i++){
            const slice=new Mesh(sliceGeometry,new ShaderMaterial({uniforms:{...this.uniforms,uSlice:{value:i/7}},vertexShader:interiorVertex,fragmentShader:interiorFragment,transparent:true,depthWrite:false,depthTest:true,side:DoubleSide}));
            slice.position.set(Math.sin(i*2.4)*.12,Math.cos(i*1.7)*.13,1.05-i*.4);
            slice.rotation.set(Math.sin(i)*.3,Math.cos(i*1.4)*.35,i*.37);this.energy.add(slice);
        }
        this.root.add(this.energy);
        const starCount = mobile ? 650 : 1800, stars = new Float32Array(starCount * 3), starSizes = new Float32Array(starCount), starSeeds = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            stars[i * 3] = (rng() - .5) * 34;
            stars[i * 3 + 1] = (rng() - .5) * 24;
            stars[i * 3 + 2] = -3 - rng() * 25;
            starSizes[i] = .45 + rng() * 1.15;
            starSeeds[i] = rng();
        }
        const starGeo = new BufferGeometry();
        starGeo.setAttribute('position', new BufferAttribute(stars, 3));
        starGeo.setAttribute('aSize', new BufferAttribute(starSizes, 1));
        starGeo.setAttribute('aSeed', new BufferAttribute(starSeeds, 1));
        this.root.add(new Points(starGeo, new ShaderMaterial({ uniforms: this.uniforms, vertexShader: particleVertex, fragmentShader: particleFragment, transparent: true, depthWrite: false, blending: AdditiveBlending })));
    }
    update(time: number, progress: number) {
        const birth = Math.min(1, Math.max(0, (progress - .045) / .48));
        this.uniforms.uTime.value = time;
        this.uniforms.uBirth.value = birth;
        this.uniforms.uProgress.value = progress;
        this.uniforms.uRatio.value = Math.min(devicePixelRatio, 1.75);
        this.uniforms.uHeight.value=innerHeight*this.uniforms.uRatio.value;
        const mobileScale = innerHeight < 740 ? .48 : .6;
        const desktopScale = Math.min(1, (innerWidth / innerHeight) / 1.45);
        this.energy.scale.setScalar((.06 + .94 * birth) * (innerWidth < 760 ? mobileScale : desktopScale));
        this.core.scale.setScalar(.35 + .65 * birth);
        this.energy.rotation.z = -.26;
        this.energy.position.y = innerWidth < 760 ? 1.8 * Math.min(1, progress * 1.8) : .18;
    }
    updateFilm(time:number, progress:number, reduced=false) {
        this.update(time,progress);
        this.energy.position.set(0,0,0);
        this.uniforms.uMicro.value=smooth(10,16,time);
        this.coreOpacity.value=this.uniforms.uOpacity.value*(1-smooth(7.5,10.5,time))*.4;
        this.swarm.scale.setScalar(1);
        this.core.visible=time<15;
        this.energy.scale.setScalar((.06+.94*Math.min(1,Math.max(0,(progress-.045)/.48)))*(innerWidth<760?.8:1.5));
    }
    setOpacity(value: number) { this.uniforms.uOpacity.value = value; this.glowOpacity.value = value * .18;this.coreOpacity.value=value*(1-smooth(7.5,10.5,this.uniforms.uTime.value))*.4; }
    dispose(){this.flow.texture.dispose();}
}
