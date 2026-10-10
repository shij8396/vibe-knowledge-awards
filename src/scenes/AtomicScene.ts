import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Group, InstancedBufferAttribute, InstancedMesh, Matrix4, Mesh, PlaneGeometry, Points, ShaderMaterial, SphereGeometry, Vector3, type PerspectiveCamera } from 'three';
import { type ChapterScene, disposeGroup } from '../core/SceneManager';
import { random } from '../utils/random';
import { smooth } from '../utils/cinematic';
import type { MasterTimeline } from '../core/MasterTimeline';
import { cloudVertex, cloudFragment, nucleusVertex, nucleusFragment, envelopeVertex, envelopeFragment, photonVertex, photonFragment } from '../shaders/atomic';
import { EnergyMechanism } from './EnergyMechanism';
import { ProbabilityContours } from './ProbabilityContours';
import { TRANSITIONS, type TransitionId } from '../utils/physics';
import { propagationPosition,propagationReveal } from '../utils/propagation';
export type AtomPhase = 'ground' | 'absorbing' | 'excited' | 'emitting' | 'emitted';
export class AtomicScene implements ChapterScene {
    readonly root = new Group();
    readonly state = { excitation: 0, photon: 0, photonVisible: 0, incoming: 1 };
    phase: AtomPhase = 'ground';
    transitionId: TransitionId = 'green';
    private atom = new Group();
    private photon: Mesh;
    private mechanism:EnergyMechanism;
    private labelPoint=new Vector3();
    private labels=[{x:0,y:0,visible:false},{x:0,y:0,visible:false}];
    private common = { uTime: { value: 0 }, uOpacity: { value: 1 }, uRatio: { value: 1 }, uExcitation: { value: 0 }, uOpening: { value: 0 }, uReveal: { value: 1 }, uDetail: { value: 1 }, uArrival: { value: 0 }, uOpeningTime: { value: 0 }, uModelScale: { value: 1.65 }, uBackground:{value:0} };
    private lowerWeight = { value: 1 };
    private upperWeight = { value: 0 };
    private photonColor = new Color(TRANSITIONS[1].color);
    private photonVisible = { value: 0 };
    constructor(mobile: boolean) {
        const rng = random(17492);
        // Normal-distribution samples form a volumetric, qualitative probability map.
        // These are two illustrative distributions, not hydrogen eigenfunctions.
        const gaussian = () => Math.sqrt(-2 * Math.log(Math.max(1e-6, rng()))) * Math.cos(2 * Math.PI * rng());
        const count = mobile ? 7000 : 18000;
        const cloud = (upper: boolean) => {
            const positions = new Float32Array(count * 3), sizes = new Float32Array(count), seeds = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                let x = gaussian(), y = gaussian(), z = gaussian();
                // Restrict the display range by rejection sampling, avoiding a false dense shell.
                while (Math.hypot(x, y, z) > 3) {
                    x = gaussian();
                    y = gaussian();
                    z = gaussian();
                }
                const scale = upper ? .84 : .52;
                positions[i * 3] = x * scale;
                positions[i * 3 + 1] = y * scale;
                positions[i * 3 + 2] = z * scale;
                sizes[i] = .35 + rng() * 1.25;
                seeds[i] = rng();
            }
            const geometry = new BufferGeometry();
            geometry.setAttribute('position', new BufferAttribute(positions, 3));
            geometry.setAttribute('aSize', new BufferAttribute(sizes, 1));
            geometry.setAttribute('aSeed', new BufferAttribute(seeds, 1));
            const weight = upper ? this.upperWeight : this.lowerWeight;
            const color = new Color(upper ? '#b59aff' : '#68bfff');
            const material = new ShaderMaterial({ uniforms: { ...this.common, uWeight: weight, uColor: { value: color } }, vertexShader: cloudVertex, fragmentShader: cloudFragment, blending: AdditiveBlending, transparent: true, depthWrite: false });
            this.atom.add(new Points(geometry, material));
            this.atom.add(new Mesh(new SphereGeometry(upper ? 2.0 : 1.28, 48, 32), new ShaderMaterial({ uniforms: { ...this.common, uWeight: weight, uColor: { value: color } }, vertexShader: envelopeVertex, fragmentShader: envelopeFragment, transparent: true, depthWrite: false, blending: AdditiveBlending })));
        };
        cloud(false);
        cloud(true);
        this.atom.add(new ProbabilityContours(mobile,this.common).root);
        const nucleus = new InstancedMesh(new SphereGeometry(.085, mobile?20:32, mobile?16:24), new ShaderMaterial({ uniforms: this.common, vertexShader: nucleusVertex, fragmentShader: nucleusFragment, transparent: true, depthWrite: true }), 35);
        nucleus.geometry.setAttribute('aSpecies',new InstancedBufferAttribute(Float32Array.from({length:35},(_,i)=>i%2),1));
        const matrix = new Matrix4();
        for (let i = 0; i < 35; i++) {
            const layer=i<12?0:1,j=i<12?i:i-12,total=layer?23:12;
            const r=layer?.245:.115,azimuth=j*2.399963,cos=1-2*(j+.5)/total,sin=Math.sqrt(1-cos*cos);
            matrix.makeTranslation(r*sin*Math.cos(azimuth),r*cos,r*sin*Math.sin(azimuth));
            nucleus.setMatrixAt(i, matrix);
        }
        nucleus.renderOrder=-1;
        nucleus.instanceMatrix.needsUpdate = true;
        this.atom.add(nucleus);
        this.photon = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms: { ...this.common, uColor: { value: this.photonColor }, uVisible: this.photonVisible }, vertexShader: photonVertex, fragmentShader: photonFragment, blending: AdditiveBlending, transparent: true, depthWrite: false }));
        this.atom.add(this.photon);
        this.mechanism=new EnergyMechanism(mobile);this.atom.add(this.mechanism.root);
        this.root.add(this.atom);
        const starCount = mobile ? 450 : 1100;
        const positions = new Float32Array(starCount * 3), sizes = new Float32Array(starCount), seeds = new Float32Array(starCount);
        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (rng() - .5) * (i<starCount*.2?34:44)+5;
            positions[i * 3 + 1] = (rng() - .5) * (i<starCount*.2?8:22);
            positions[i * 3 + 2] = i<starCount*.2?1+rng()*8:-4-rng()*20;
            sizes[i] = rng() * .8 + .25;
            seeds[i] = rng();
        }
        const geo = new BufferGeometry();
        geo.setAttribute('position', new BufferAttribute(positions, 3));
        geo.setAttribute('aSize', new BufferAttribute(sizes, 1));
        geo.setAttribute('aSeed', new BufferAttribute(seeds, 1));
        this.root.add(new Points(geo, new ShaderMaterial({ uniforms: { ...this.common, uBackground:{value:1}, uWeight: { value: 1.1 }, uColor: { value: new Color('#4267b7') } }, vertexShader: cloudVertex, fragmentShader: cloudFragment, transparent: true, depthWrite: false, blending: AdditiveBlending })));
    }
    select(id: TransitionId) { this.transitionId = id; this.photonColor.set(TRANSITIONS.find(t => t.id === id)!.color); this.reset(); }
    reset() { this.phase = 'ground'; Object.assign(this.state, { excitation: 0, photon: 0, photonVisible: 0, incoming: 1 }); }
    setOpacity(value: number) { this.common.uOpacity.value = value; this.mechanism.update(this.common.uOpeningTime.value,this.state.excitation,this.state.photon,this.state.incoming,value); }
    update(time: number, _progress: number) {
        this.common.uTime.value = time;
        this.common.uRatio.value = Math.min(devicePixelRatio, 1.75);
        this.common.uExcitation.value = this.state.excitation;
        this.lowerWeight.value = 1 - this.state.excitation;
        this.upperWeight.value = this.state.excitation;
        this.photonVisible.value = this.state.photonVisible;
        this.photon.position.set(this.state.incoming ? -5 * (1 - this.state.photon) : 5 * this.state.photon, this.state.incoming ? -.25 : this.state.photon * .7, .9);
        const mobile = innerWidth < 760;
        this.atom.scale.setScalar(mobile ? (innerHeight < 740 ? .52 : .65) : Math.min(1.32, (innerWidth / innerHeight) * .85));
        this.atom.position.y = mobile ? (innerHeight < 740 ? 2.5 : 2.3) : .9;
    }
    updateFilm(time:number) {
        this.update(time,0);
        this.atom.position.set(0,0,0);
        this.atom.scale.setScalar(innerWidth<760?.95:1.65);
        this.atom.rotation.y=.05*Math.sin(time*.09);
        this.photonColor.set(this.state.incoming?'#36b8ff':'#ffb347');
        // Absorption terminates at the nucleus; emission starts at the separate energy diagram.
        this.photon.position.set(this.state.incoming?-5*(1-this.state.photon):1.75+8*this.state.photon,this.state.incoming?0:-.72,this.state.incoming?0:.25);
        this.photon.scale.setScalar(this.state.incoming?.65:.8);
    }
    updateOpening(time:number,opening:MasterTimeline['opening'],reduced=false) {
        this.common.uOpening.value=1-smooth(15,19,time);
        if(innerWidth<760)this.atom.scale.setScalar(.95+.35*this.common.uOpening.value);
        // The camera is inside the opening structure at 12s: reveal the atom at micro scale, then restore its existing scale.
        this.atom.scale.multiplyScalar(.12+.88*smooth(12,15,time));
        this.common.uModelScale.value=this.atom.scale.x;
        this.common.uReveal.value=opening.reveal*smooth(10,15,time);
        this.common.uDetail.value=opening.detail;
        this.common.uArrival.value=reduced?0:opening.arrival;
        this.common.uOpeningTime.value=time;
        if(time>45){
            this.atom.updateMatrixWorld(true);
            propagationPosition(time,innerWidth<760,this.photon.position);
            this.atom.worldToLocal(this.photon.position);
            this.photonVisible.value=this.state.photonVisible*(1-propagationReveal(time));
        }
    }
    projectLevels(camera:PerspectiveCamera){
        for(let i=0;i<2;i++){
            this.labelPoint.set(2.55,i===0?-.72:.72,.2);
            this.atom.localToWorld(this.labelPoint);this.labelPoint.project(camera);
            const label=this.labels[i];label.x=Math.max(20,Math.min(innerWidth-85,(this.labelPoint.x*.5+.5)*innerWidth));label.y=(-this.labelPoint.y*.5+.5)*innerHeight;
            label.visible=this.common.uOpeningTime.value>27&&this.labelPoint.z<1&&Math.abs(this.labelPoint.x)<.92&&Math.abs(this.labelPoint.y)<.82;
        }
        return this.labels;
    }
    dispose() { disposeGroup(this.root); }
}
