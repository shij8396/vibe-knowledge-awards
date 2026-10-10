import { FILM_DURATION } from './utils/film';
import './styles/main.css';
import { SceneManager } from './core/SceneManager';
import { CinematicCameraRig } from './core/CinematicCameraRig';
import { RendererManager } from './core/RendererManager';
import { MasterTimeline } from './core/MasterTimeline';
import { AudioManager } from './components/AudioManager';
import { mountUI } from './components/UI';

document.body.className='';
mountUI();
document.title='LUMEN · 光的诞生 · 完整影片';
const $=<T extends HTMLElement=HTMLElement>(id:string)=>document.querySelector<T>(id)!;
const abort=new AbortController(),options={signal:abort.signal};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// Opt-in QA capture hook: synchronous copy after rendering, never a second animation loop.
const captureFrames=new URLSearchParams(location.search).get('capture')==='1';
const camera=new CinematicCameraRig(),audio=new AudioManager();
const manager=new SceneManager(innerWidth<760);
let renderer:RendererManager|undefined,master:MasterTimeline|undefined;
let frame=0,disposed=false,lost=false,statusTimer=0,lastInteraction=performance.now();
const message=(text:string)=>{clearTimeout(statusTimer);$('#status').textContent=text;statusTimer=window.setTimeout(()=>$('#status').textContent='',5000);};
const cleanup=()=>{if(disposed)return;disposed=true;cancelAnimationFrame(frame);clearTimeout(statusTimer);abort.abort();master?.dispose();manager.dispose();renderer?.dispose();audio.dispose();};
$('#retry').addEventListener('click',()=>location.reload(),options);
try {
    renderer=new RendererManager($<HTMLCanvasElement>('#universe'),manager.scene,camera.camera);
    master=new MasterTimeline();
    const movie=master,render=renderer;
    const progress=$<HTMLInputElement>('#film-progress');
    const wake=()=>{lastInteraction=performance.now();document.body.classList.remove('controls-hidden');};
    ['pointermove','pointerdown','keydown','focusin'].forEach(event=>document.addEventListener(event,wake,options));
    const toggle=()=>{if(movie.time===movie.duration)movie.restart();else movie.paused=!movie.paused;wake();};
    $('#pause').addEventListener('click',toggle,options);
    $('#replay').addEventListener('click',()=>{movie.restart();wake();},options);
    progress.addEventListener('input',()=>{movie.seek(Number(progress.value));wake();},options);
    document.addEventListener('keydown',event=>{
        if(event.target instanceof HTMLInputElement||event.target instanceof HTMLButtonElement)return;
        if(event.code==='Space'){event.preventDefault();toggle();}
        if(event.key==='ArrowLeft'){movie.seek(movie.time-5);wake();}
        if(event.key==='ArrowRight'){movie.seek(movie.time+5);wake();}
    },options);
    $('#audio').addEventListener('click',async()=>{try{const enabled=await audio.toggle();$('#audio').textContent=enabled?'声音开启':'声音关闭';$('#audio').setAttribute('aria-pressed',String(enabled));$('#audio').setAttribute('aria-label',enabled?'静音':'开启声音');}catch{message('此浏览器暂时无法播放声音。');}},options);
    $('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else message('此浏览器暂不支持全屏。');}catch{message('浏览器未允许进入全屏。');}},options);
    document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏'),options);
    addEventListener('resize',()=>{camera.resize();render.resize();},options);
    let last=performance.now(),sampleTime=0,sampleFrames=0,lowSamples=0;
    const renderFrame=(now:number)=>{
        const raw=Math.max(0,(now-last)/1000);last=now;
        movie.advance(raw);
        // Resize clears framebuffers: adapt quality before drawing, never after a completed frame.
        sampleTime+=raw;sampleFrames++;
        if(sampleTime>=2){const fps=sampleFrames/sampleTime;$('#universe').dataset.fps=fps.toFixed(0);lowSamples=fps<40?lowSamples+1:0;if(lowSamples>=3){render.lowerQuality();lowSamples=0;}sampleTime=0;sampleFrames=0;}
        camera.update(movie.sourceTime,reduced.matches);
        manager.renderFrame(movie.sourceTime,movie.state,reduced.matches,movie.opening,camera.camera);
        render.render();
        const levels=manager.projectLevels(camera.camera);
        for(let i=0;i<2;i++){const el=$(i===0?'#level-low':'#level-high'),label=levels?.[i];el.hidden=!label?.visible;if(label?.visible)el.style.transform=`translate(${label.x.toFixed(1)}px,${label.y.toFixed(1)}px)`;}
        document.querySelector<HTMLElement>('.film-brand')!.style.opacity=String(movie.time<168?1:Math.max(0,(170-movie.time)/2));
        const caption=movie.caption;
        $('#subtitle').dataset.layout=caption?.layout??'bottom';
        $('#subtitle-main').textContent=caption?.text??'';$('#subtitle-sub').textContent=caption?.sub??'';
        $('#subtitle').style.opacity=String(caption?.opacity??0);$('#subtitle').style.letterSpacing=`${caption?.spacing??0}px`;
        progress.value=String(movie.time);progress.style.setProperty('--progress',`${movie.time/movie.duration*100}%`);progress.setAttribute('aria-valuetext',`${movie.time.toFixed(1)} 秒，共 ${movie.duration} 秒`);
        $('#time-readout').textContent=`${String(Math.floor(movie.time/60)).padStart(2,'0')}:${String(Math.floor(movie.time%60)).padStart(2,'0')} / ${String(Math.floor(FILM_DURATION/60)).padStart(2,'0')}:${String(FILM_DURATION%60).padStart(2,'0')}`;
        const ended=movie.time===movie.duration;
        $('#pause').textContent=ended?'↺':movie.paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',ended?'重新播放':movie.paused?'继续':'暂停');$('#pause').setAttribute('aria-pressed',String(movie.paused));
        document.body.classList.toggle('controls-hidden',!movie.paused&&now-lastInteraction>3000);
        // Read-only DOM diagnostics for development and browser verification, no additional clock.
        const canvas=$('#universe');const d=manager.diagnostics;
        canvas.dataset.filmTime=movie.time.toFixed(4);canvas.dataset.shot=movie.time<12?'01':movie.time<27?'02':movie.time<45?'03':movie.time<58?'04':movie.time<76?'05':movie.time<=90?'06':movie.time<110?'07':movie.time<135?'08':movie.time<155?'09':'10';canvas.dataset.sourceTime=movie.sourceTime.toFixed(4);canvas.dataset.activeScenes=d.active.join(',');canvas.dataset.liveScenes=String(d.live);canvas.dataset.created=String(d.created);canvas.dataset.released=String(d.released);
        canvas.dataset.assets=d.assets?JSON.stringify(d.assets):'';
        canvas.dataset.drawCalls=String(render.renderer.info.render.calls);canvas.dataset.geometries=String(render.renderer.info.memory.geometries);canvas.dataset.textures=String(render.renderer.info.memory.textures);canvas.dataset.triangles=String(render.renderer.info.render.triangles);canvas.dataset.camera=JSON.stringify({position:camera.camera.position.toArray(),quaternion:camera.camera.quaternion.toArray(),fov:camera.camera.fov});canvas.dataset.cached=String(d.cached);
        if(captureFrames)document.dispatchEvent(new Event('lumen-frame'));
        frame=requestAnimationFrame(renderFrame);
    };
    const start=()=>{if(disposed||lost||document.hidden)return;cancelAnimationFrame(frame);last=performance.now();sampleTime=0;sampleFrames=0;frame=requestAnimationFrame(renderFrame);};
    document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);audio.suspend();}else{audio.resume();start();}},options);
    $('#universe').addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;cancelAnimationFrame(frame);message('图形上下文暂时丢失，恢复后会重新加载。');},options);
    $('#universe').addEventListener('webglcontextrestored',()=>location.reload(),options);
    addEventListener('pagehide',cleanup,{once:true,signal:abort.signal});
    addEventListener('pageshow',event=>{if(event.persisted)location.reload();});
    import.meta.hot?.dispose(cleanup);
    void (async()=>{movie.paused=true;message("正在准备电影画面……");try{await manager.prepareFilm(render.renderer,camera.camera,movie.state,movie.opening);if(disposed)return;movie.restart();$("#status").textContent="";clearTimeout(statusTimer);start();}catch(error){console.error(error);message("部分资源预热失败，尝试继续播放。");movie.restart();start();}})();
} catch(error){cleanup();$('#fallback').hidden=false;$('#fallback p').textContent=error instanceof Error?error.message:String(error);$('#retry').addEventListener('click',()=>location.reload());}
