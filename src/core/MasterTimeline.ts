import gsap from 'gsap';
import { FILM_DURATION, clampFilmTime, CAPTIONS } from '../utils/film.ts';

export class MasterTimeline {
    readonly duration=FILM_DURATION;
    get sourceTime(){return this.time;}
    readonly state={intro:1,atomic:0,wave:0,propagation:1,electromagnetic:1,lightSpeed:1,dispersion:1,stellar:1,earth:1,finale:1,birth:0,excitation:0,photon:0,photonVisible:0,incoming:1,waveAmplitude:0};
    readonly opening={reveal:0,cutaway:0,detail:0,arrival:0,packet:0,packetVisible:0};
    readonly timeline:gsap.core.Timeline;
    paused=false;
    time=0;
    private captionState=CAPTIONS.map(()=>({opacity:0,spacing:4}));
    constructor(){
        this.timeline=gsap.timeline({paused:true,defaults:{ease:'sine.inOut'}});
        this.timeline.to(this.opening,{reveal:1,duration:2.7,ease:'sine.inOut'},.25)
          .to(this.opening,{packetVisible:1,duration:.8},3)
          .to(this.opening,{packet:1,duration:7.4,ease:'none'},3.6)
          .to(this.opening,{detail:1,duration:5,ease:'sine.inOut'},6)
          .to(this.opening,{cutaway:1,duration:5.2,ease:'sine.inOut'},7.2)
          .to(this.opening,{arrival:1,duration:.3,ease:'power2.out'},11)
          .to(this.opening,{packetVisible:0,duration:.5},11)
          .to(this.opening,{arrival:0,duration:1.8,ease:'sine.out'},12);
        this.timeline.to(this.state,{birth:1,duration:8,ease:'power1.out'},0)
          .to(this.state,{intro:0,duration:8},14)
          .to(this.state,{atomic:1,duration:6},10)
          .to(this.state,{photonVisible:1,duration:1},30)
          .to(this.state,{photon:1,duration:4,ease:'power1.in'},30)
          .to(this.state,{photonVisible:0,duration:.6},34)
          .to(this.state,{excitation:1,duration:4},30)
          .set(this.state,{incoming:0,photon:0},38)
          .to(this.state,{excitation:0,duration:3},38)
          .to(this.state,{photonVisible:1,duration:.6},41.5)
          .to(this.state,{photon:1,duration:3,ease:'power1.in'},42)
          .to(this.state,{atomic:0,duration:2},48);
        CAPTIONS.forEach((c,i)=>{
            this.timeline.to(this.captionState[i],{opacity:1,spacing:1.4,duration:1.2},c.start);
            this.timeline.to(this.captionState[i],{opacity:0,duration:1.1},c.end-1.1);
        });
        this.timeline.to({},{duration:1},169);
        this.seek(0);
    }
    seek(time:number){this.time=clampFilmTime(time);this.timeline.time(this.sourceTime,true);}
    advance(dt:number){if(!this.paused){this.seek(this.time+Math.max(0,dt));if(this.time===this.duration)this.paused=true;}}
    restart(){this.paused=false;this.seek(0);}
    get caption(){const i=CAPTIONS.findIndex((c,index)=>this.sourceTime>=c.start&&(this.sourceTime<c.end||(index===CAPTIONS.length-1&&this.sourceTime===c.end)));return i<0?undefined:{...CAPTIONS[i],...this.captionState[i]};}
    dispose(){this.timeline.kill();}
}
