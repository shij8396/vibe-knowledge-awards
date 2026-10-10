import { ACESFilmicToneMapping, HalfFloatType, Scene, PerspectiveCamera, Vector2, WebGLRenderer, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export class RendererManager {
    readonly renderer: WebGLRenderer;
    readonly composer: EffectComposer;
    readonly bloom: UnrealBloomPass;
    readonly mobile = matchMedia('(max-width: 760px)').matches;
    private ratio = Math.min(devicePixelRatio, this.mobile ? 1.25 : 1.75);
    constructor(canvas: HTMLCanvasElement, scene: Scene, camera: PerspectiveCamera) {
        const context = canvas.getContext('webgl2', { antialias: false, alpha: false, powerPreference: 'high-performance' });
        if (!context)
            throw new Error('此设备未提供 WebGL 2.0。请使用支持 WebGL 2.0 的浏览器与设备。');
        this.renderer = new WebGLRenderer({ canvas, context, antialias: false });
        this.renderer.setClearColor(0x000001);
        this.renderer.info.autoReset=false;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
        const target=new WebGLRenderTarget(1,1,{type:HalfFloatType});
        target.samples=Math.min(this.renderer.capabilities.maxSamples,this.mobile?2:4);
        this.composer = new EffectComposer(this.renderer,target);
        this.composer.addPass(new RenderPass(scene, camera));
        this.bloom = new UnrealBloomPass(new Vector2(), this.mobile ? .28 : .42, .7, .8);
        this.composer.addPass(this.bloom);
        this.composer.addPass(new OutputPass());
        this.resize();
    }
    resize() {
        this.renderer.setPixelRatio(this.ratio);
        this.renderer.setSize(innerWidth, innerHeight, false);
        this.composer.setPixelRatio(this.ratio);
        this.composer.setSize(innerWidth, innerHeight);
    }
    lowerQuality() {
        if (this.ratio <= .85)
            return;
        this.ratio = Math.max(.85, this.ratio - .2);
        this.resize();
    }
    render() { this.renderer.info.reset();this.composer.render(); }
    dispose() {
        this.composer.passes.forEach(pass => pass.dispose());
        this.composer.dispose();
        this.renderer.dispose();
    }
}
