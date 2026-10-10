import { defineConfig } from 'vite';
export default defineConfig({build:{rollupOptions:{output:{manualChunks:{three:['three'],postprocessing:['three/addons/postprocessing/EffectComposer.js','three/addons/postprocessing/UnrealBloomPass.js','three/addons/postprocessing/OutputPass.js'],animation:['gsap']}}}}});
