import { FILM_DURATION } from '../utils/film';
export function mountUI(){
    document.querySelector<HTMLDivElement>('#app')!.innerHTML=`
      <canvas id="universe" aria-label="LUMEN 实时三维科学动画"></canvas><div class="vignette" aria-hidden="true"></div>
      <header class="film-brand">LUMEN <span>光 的 诞 生</span></header>
      <div id="subtitle" aria-live="off"><p id="subtitle-main"></p><small id="subtitle-sub"></small></div>
      <div class="level-label" id="level-low" hidden>E₁</div><div class="level-label" id="level-high" hidden>E₂ <small>能级示意</small></div>
      <div id="film-controls" class="film-controls" aria-label="电影播放控制">
        <div class="transport"><button id="pause" aria-label="暂停" aria-pressed="false">Ⅱ</button><button id="replay" aria-label="重播">↺</button><span id="time-readout">00:00 / ${String(Math.floor(FILM_DURATION/60)).padStart(2,'0')}:${String(FILM_DURATION%60).padStart(2,'0')}</span><span class="transport-spacer"></span><button id="audio" aria-label="开启声音" aria-pressed="false">声音关闭</button><button id="fullscreen" aria-label="进入全屏">⛶</button></div>
        <label class="sr-only" for="film-progress">播放进度</label><input id="film-progress" type="range" min="0" max="${FILM_DURATION}" step="0.1" value="0" aria-valuetext="0 秒，共 ${FILM_DURATION} 秒">
      </div><p id="status" role="status"></p>
      <section id="fallback" role="alert" hidden><h1>此设备暂时无法呈现 LUMEN</h1><p></p><button id="retry">重新加载</button></section>`;
}
