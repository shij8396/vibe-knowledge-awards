import { Group, BufferGeometry, Float32BufferAttribute, Mesh, ShaderMaterial, DoubleSide, Color, InstancedBufferGeometry, InstancedBufferAttribute, Points } from 'three';
import { disposeGroup, type ChapterScene } from '../core/SceneManager';
import { fieldVertex, fieldFragment, arrowVertex, arrowFragment } from '../shaders/wave';
import { random } from '../utils/random';
import { waveParameters, visibleRGB } from '../utils/wave';

export class WaveScene implements ChapterScene {
    readonly root = new Group();
    private model = new Group();
    readonly state = { wavelength: 530, amplitude: 1, speed: 1, paused: false, phase: 0 };
    private uniforms = { uK: { value: waveParameters(530).k }, uPhase: { value: 0 }, uAmplitude: { value: 1 }, uOpacity: { value: 1 } };
    private beamColor = new Color();
    private lastWavelength = -1;
    private omega = waveParameters(530).omega;
    constructor(mobile: boolean) {
        this.root.add(this.model);
        // Both fields undergo the same rigid transform; their orthogonality is preserved.
        this.model.rotation.set(.63, -.32, -.09);
        for (let plane = 0; plane < 2; plane++) {
            const color = new Color(plane === 0 ? '#83d6ff' : '#a185ef');
            for (let kind = 0; kind < 2; kind++) {
                const positions: number[] = [], indices: number[] = [];
                const segments = mobile ? 240 : 420;
                for (let i = 0; i <= segments; i++) {
                    const x = -5.6 + i / segments * 11.2;
                    positions.push(x, kind === 0 ? 0 : -1, 0, x, 1, 0);
                    if (i < segments) { const j=i*2; indices.push(j,j+1,j+2,j+1,j+3,j+2); }
                }
                const geo=new BufferGeometry(); geo.setAttribute('position',new Float32BufferAttribute(positions,3)); geo.setIndex(indices);
                const mesh=new Mesh(geo,new ShaderMaterial({ vertexShader:fieldVertex,fragmentShader:fieldFragment,
                    uniforms:{...this.uniforms,uPlane:{value:plane},uKind:{value:kind},uColor:{value:color}},transparent:true,depthWrite:false,side:DoubleSide }));
                mesh.frustumCulled=false; this.model.add(mesh);
            }
            // One instanced draw per field for all arrow shafts and arrowheads.
            const arrows = new InstancedBufferGeometry();
            arrows.setAttribute('position',new Float32BufferAttribute([-.007,0,0,.007,0,0,-.007,.87,0,.007,.87,0,-.045,.87,0,.045,.87,0,0,1,0],3));
            arrows.setIndex([0,1,2,1,3,2,4,5,6]);
            arrows.setAttribute('aX',new InstancedBufferAttribute(Float32Array.from({length:41},(_,i)=>-5.4+i*.27),1)); arrows.instanceCount=41;
            const mesh=new Mesh(arrows,new ShaderMaterial({vertexShader:arrowVertex,fragmentShader:arrowFragment,uniforms:{...this.uniforms,uPlane:{value:plane},uColor:{value:color}},transparent:true,depthWrite:false,side:DoubleSide}));
            mesh.frustumCulled=false;this.model.add(mesh);
        }
        const beam=new Mesh(new BufferGeometry().setAttribute('position',new Float32BufferAttribute([-6,-.014,0,6,-.014,0,-6,.014,0,6,.014,0,5.8,-.09,0,6.15,0,0,5.8,.09,0],3)).setIndex([0,1,2,1,3,2,4,5,6]),
            new ShaderMaterial({uniforms:{uColor:{value:this.beamColor},uOpacity:this.uniforms.uOpacity},vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 uColor;uniform float uOpacity;void main(){gl_FragColor=vec4(uColor*1.4,.8*uOpacity);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',transparent:true,depthWrite:false,side:DoubleSide}));
        this.model.add(beam);
        const rng=random(28541);
        const stars=new Float32Array((mobile?400:1000)*3);
        for(let i=0;i<stars.length;i+=3){stars[i]=(rng()-.5)*45;stars[i+1]=(rng()-.5)*28;stars[i+2]=-4-rng()*25;}
        this.root.add(new Points(new BufferGeometry().setAttribute('position',new Float32BufferAttribute(stars,3)),new ShaderMaterial({uniforms:{uOpacity:this.uniforms.uOpacity},vertexShader:'void main(){vec4 p=modelViewMatrix*vec4(position,1.);gl_PointSize=1.4;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform float uOpacity;void main(){gl_FragColor=vec4(.35,.48,.7,.35*uOpacity);}',transparent:true,depthWrite:false})));
    }
    reset() { Object.assign(this.state,{wavelength:530,amplitude:1,speed:1,paused:false,phase:0}); }
    update(time: number) {
        if(this.lastWavelength!==this.state.wavelength){
            const p=waveParameters(this.state.wavelength);
            this.uniforms.uK.value=p.k;this.omega=p.omega;
            this.beamColor.setRGB(...visibleRGB(this.state.wavelength));this.lastWavelength=this.state.wavelength;
        }
        this.state.phase=(time*this.omega)%(2*Math.PI);
        this.uniforms.uPhase.value=this.state.phase;this.uniforms.uAmplitude.value=this.state.amplitude;
        const mobile=innerWidth<760;
        this.model.scale.setScalar(mobile ? Math.min(.48,innerWidth/1000) : Math.min(1.1,innerWidth/1400));
        this.model.position.set(mobile?0:1.9,mobile?1.6:.65,0);
    }
    updateFilm(time:number,amplitude:number) {
        this.state.amplitude=amplitude;
        this.update(Math.max(0,time-48));
        this.model.position.set(0,0,0);
        this.model.scale.setScalar(innerWidth<760?Math.min(.75,innerWidth/800):1.15);
        this.model.rotation.set(.63,-.32+.08*Math.sin(time*.07),-.09);
    }
    setOpacity(value:number){this.uniforms.uOpacity.value=value;}
    dispose(){disposeGroup(this.root);}
}
