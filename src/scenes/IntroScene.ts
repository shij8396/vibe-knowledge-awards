import { AdditiveBlending, BufferAttribute, BufferGeometry, DoubleSide, Euler, Group, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh, LineCurve3, Matrix4, Mesh, PlaneGeometry, Points, Quaternion, ShaderMaterial, SphereGeometry, TubeGeometry, Vector3 } from 'three';
import { disposeGroup, type ChapterScene } from '../core/SceneManager';
import type { MasterTimeline } from '../core/MasterTimeline';
import { domainVertex, domainFragment, fieldVertex, fieldFragment, beamVertex, beamFragment, packetVertex, packetFragment, dustVertex, dustFragment } from '../shaders/intro';
import { random } from '../utils/random';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { openingPacket, smooth } from '../utils/cinematic';
import { RecoveredEnergy } from './RecoveredEnergy';

/** Environment and opening mechanism. The central atom is owned by SceneManager and persists. */
export class IntroScene implements ChapterScene {
    readonly root=new Group();
    private packet:Mesh;
    private recoveredEnergy:RecoveredEnergy;
    private packetPosition=new Vector3();
    private uniforms={uTime:{value:0},uReveal:{value:0},uCutaway:{value:0},uArrival:{value:0},uPacket:{value:0},uPacketVisible:{value:0},uRatio:{value:1},uFocus:{value:12},uOpacity:{value:1},uShellWeight:{value:.035},uMicro:{value:0}};
    constructor(mobile:boolean){
        this.recoveredEnergy=new RecoveredEnergy(mobile);
        this.root.add(this.recoveredEnergy.root);
        const rng=random(41023);
        const locations=[[-5,1.5,3,1.8],[5,-1.7,5,2.2],[-5,-3,-3,1.6],[5,2,-4,2],[-3,4,-9,2.1],[4,-3,-10,2.4],[-9,-1,-8,2.5],[9,1,-12,2.8],[-7,5,-17,2.5],[2,5,-18,2.4],[-2,-5,-16,2.3],[8,-5,-20,2.7],[-11,4,-23,2.8],[12,5,-26,3],[-12,-5,-25,2.8],[0,0,-28,3]];
        const count=mobile?10:locations.length;
        // Smooth separated lobes with a node, avoiding a singular pinched triangulation.
        const upperLobe=new SphereGeometry(1,mobile?20:32,mobile?14:24);
        upperLobe.scale(.55,.7,.55);upperLobe.translate(0,.8,0);
        const lowerLobe=upperLobe.clone();lowerLobe.translate(0,-1.6,0);
        const domainGeometry=mergeGeometries([upperLobe,lowerLobe]);upperLobe.dispose();lowerLobe.dispose();
        const domainSeeds=new Float32Array(count);for(let i=0;i<count;i++)domainSeeds[i]=rng();
        domainGeometry.setAttribute('aSeed',new InstancedBufferAttribute(domainSeeds,1));
        const domains=new InstancedMesh(domainGeometry,new ShaderMaterial({uniforms:this.uniforms,vertexShader:domainVertex,fragmentShader:domainFragment,transparent:true,depthWrite:false}),count);
        const matrix=new Matrix4(),position=new Vector3(),scale=new Vector3(),rotation=new Quaternion();
        for(let i=0;i<count;i++){
            const [x,y,z,r]=locations[i];position.set(x,y,z);scale.set(r,r*(.7+rng()*.3),r*(.7+rng()*.6));rotation.setFromEuler(new Euler(rng()*2,rng()*3,rng()*3));
            matrix.compose(position,rotation,scale);domains.setMatrixAt(i,matrix);
        }
        domains.instanceMatrix.needsUpdate=true;this.root.add(domains);
        // Two surfaces provide an explanatory density cutaway; they are not classical energy orbits.
        for(const radius of [3.55,2.8])this.root.add(new Mesh(new IcosahedronGeometry(radius,mobile?3:4),new ShaderMaterial({uniforms:this.uniforms,vertexShader:fieldVertex,fragmentShader:fieldFragment,transparent:true,depthWrite:false,side:DoubleSide})));
        this.root.add(new Mesh(new TubeGeometry(new LineCurve3(new Vector3(-8,.65,3.15),new Vector3(-1.05,.2,.9)),80,.025,8,false),new ShaderMaterial({uniforms:this.uniforms,vertexShader:beamVertex,fragmentShader:beamFragment,transparent:true,depthWrite:false,blending:AdditiveBlending})));
        this.packet=new Mesh(new PlaneGeometry(3,3),new ShaderMaterial({uniforms:this.uniforms,vertexShader:packetVertex,fragmentShader:packetFragment,transparent:true,depthWrite:false,blending:AdditiveBlending}));this.packet.frustumCulled=false;this.root.add(this.packet);
        // Density is concentrated inside the surrounding domains, with only sparse foreground dust.
        const particles=mobile?1200:2800,points=new Float32Array(particles*3),sizes=new Float32Array(particles),seeds=new Float32Array(particles),layers=new Float32Array(particles);
        for(let i=0;i<particles;i++){
            const foreground=i<particles*.20;layers[i]=foreground?1:0;
            if(foreground){points[i*3]=(rng()-.5)*18;points[i*3+1]=(rng()-.5)*12;points[i*3+2]=2+rng()*11;}
            else if(i<particles*.55){const a=rng()*Math.PI*2,r=1.8+rng()*6;points[i*3]=Math.cos(a)*r*1.4;points[i*3+1]=Math.sin(a)*r*.5;points[i*3+2]=(rng()-.5)*12;}
            else {const [x,y,z,r]=locations[i%count],radius=r*Math.cbrt(rng()),a=rng()*Math.PI*2,c=rng()*2-1;
                points[i*3]=x+radius*Math.sqrt(1-c*c)*Math.cos(a);points[i*3+1]=y+radius*c*.8;points[i*3+2]=z+radius*Math.sqrt(1-c*c)*Math.sin(a);}
            sizes[i]=foreground?1+rng()*2:.3+rng()*.8;seeds[i]=rng();
        }
        const dust=new BufferGeometry();dust.setAttribute('position',new BufferAttribute(points,3));dust.setAttribute('aSize',new BufferAttribute(sizes,1));dust.setAttribute('aSeed',new BufferAttribute(seeds,1));dust.setAttribute('aLayer',new BufferAttribute(layers,1));
        this.root.add(new Points(dust,new ShaderMaterial({uniforms:this.uniforms,vertexShader:dustVertex,fragmentShader:dustFragment,transparent:true,depthWrite:false,blending:AdditiveBlending})));
    }
    update(time:number,progress:number){this.uniforms.uTime.value=time;this.uniforms.uReveal.value=progress;}
    updateFilm(time:number,progress:number,opening:MasterTimeline['opening'],reduced=false){
        this.recoveredEnergy.updateFilm(time,progress,reduced);
        this.uniforms.uShellWeight.value=.008+.012*smooth(12,18,time);
        this.uniforms.uMicro.value=smooth(10,16,time);
        this.uniforms.uTime.value=time;this.uniforms.uReveal.value=opening.reveal;this.uniforms.uCutaway.value=opening.cutaway;
        this.uniforms.uArrival.value=reduced?0:opening.arrival;this.uniforms.uPacket.value=opening.packet;this.uniforms.uPacketVisible.value=opening.packetVisible*.2;
        this.uniforms.uRatio.value=Math.min(devicePixelRatio,innerWidth<760?1.25:1.75);
        openingPacket(opening.packet,this.packetPosition);this.packet.position.copy(this.packetPosition);
    }
    setFocus(distance:number){this.uniforms.uFocus.value=distance;}
    setOpacity(value:number){this.uniforms.uOpacity.value=value;this.recoveredEnergy.setOpacity(value);}
    dispose(){this.recoveredEnergy.dispose();disposeGroup(this.root);}
}
