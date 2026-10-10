export const SHOTS = {
 '01':{title:'黑暗中的第一束光',start:0,duration:12},
 '02':{title:'进入微观原子世界',start:12,duration:15},
 '03':{title:'能量激发与电子跃迁',start:27,duration:18},
 '04':{title:'追随光子的释放',start:45,duration:13},
 '05':{title:'光的波粒二象性',start:58,duration:18},
 '06':{title:'光速与传播',start:76,duration:14},
 '07':{title:'光为什么有颜色？',start:90,duration:20},
 '08':{title:'恒星为什么会发光？',start:110,duration:25},
 '09':{title:'光照亮世界',start:135,duration:20},
 '10':{title:'光，让宇宙被看见',start:155,duration:15},
} as const;
export type ShotId=keyof typeof SHOTS;
export type FilmSceneId='intro'|'atomic'|'wave'|'propagation'|'electromagnetic'|'lightSpeed'|'dispersion'|'stellar'|'earth'|'finale';
// Internal source coordinates for retained camera/shader assets; no full-film playback route.
export const FILM_DURATION=170;
export function clampFilmTime(time:number){if(!Number.isFinite(time))throw new RangeError('播放时间必须为有限数值');return Math.max(0,Math.min(FILM_DURATION,time));}
export function scenesAt(time:number):FilmSceneId[]{return time<=22?['intro','atomic']:time<44?['atomic']:time<50?['atomic','propagation']:time<=58?['propagation']:time<62?['propagation','electromagnetic']:time<=76?['electromagnetic']:time<80?['electromagnetic','lightSpeed']:time<=90?['lightSpeed']:time<106?['dispersion']:time<115?['dispersion','stellar']:time<132?['stellar']:time<150?['stellar','earth']:time<164?['earth','finale']:['finale'];}
export const CAPTIONS=[
 {start:2,end:6,layout:'left',text:'在黑暗之中……',sub:'能量结构为艺术化示意'},
 {start:7,end:11.8,layout:'right',text:'光，悄然出现。',sub:'LUMEN · 光的诞生'},
 {start:15,end:21,layout:'upper-left',text:'深入物质的微观世界。',sub:'电子云是概率分布 · 尺度与结构为概念示意'},
 {start:23,end:26.8,layout:'lower-right',text:'能量，以离散的状态存在。',sub:'量子能级示意，不是经典行星轨道'},
 {start:29,end:35,layout:'left',text:'当原子吸收能量……',sub:'激发态 · 概率分布发生改变'},
 {start:37,end:41.8,layout:'right',text:'能级跃迁，可以释放光子。',sub:'原子跃迁只是光产生的机制之一'},
 {start:42,end:45,layout:'lower-left',text:'ΔE = hν',sub:'能级差决定光子能量 · 发光符号为概念示意'},
 {start:47.5,end:52,layout:'upper-left',text:'光子，携带着能量向前传播。',sub:'脉冲与光迹为艺术化示意 · 时间与尺度经过缩放'},
 {start:53.5,end:58,layout:'lower-left',text:'它的传播，连接着微观与宏观。',sub:'蓝紫曲线表示电磁场，不是光子的运动轨迹'},
 {start:58.6,end:63,layout:'lower-left',text:'光，具有波动性。',sub:'经典电磁场描述 · 蓝紫场线为可视化示意'},
 {start:64.5,end:68,layout:'upper-left',text:'电场与磁场相互垂直，并共同向前传播。',sub:'E 沿 Y · B 沿 Z · 同相振荡 · E × B 指向 +X'},
 {start:68.5,end:72.5,layout:'lower-right',text:'而光的探测结果，又呈现量子特征。',sub:'单次探测是局部离散事件 · 均匀照明探测示意，无干涉装置'},
 {start:73,end:76,layout:'upper-left',text:'同一种光，连接两种描述。',sub:'场的振荡并非光子的运动轨迹 · 传播空间与时间经过缩放'},
 {start:79.1,end:83.3,layout:'speed',text:'299,792,458 m/s',sub:'真空中的光速 · 每秒约三十万公里 · 光迹为艺术化示意'},
 {start:83.3,end:86.8,layout:'upper-left',text:'跨越地月平均距离，光只需要约1.28秒。',sub:'384,400 km · 中心平均间距 · 统一空间比例尺'},
 {start:88.2,end:90,layout:'lower-left',text:'光，继续前行。',sub:'进入光学展示尺度 · 时间与空间经过缩放'},
 {start:90.3,end:94.6,layout:'lower-left',text:'白光，包含着不同波长的可见光。',sub:'光迹为艺术化示意 · 玻璃改变方向，不创造颜色'},
 {start:98,end:103,layout:'spectrum',text:'不同波长的光，在玻璃中发生不同程度的折射。',sub:'N-BK7 · Snell 定律 · 出射色散角差放大2.5倍示意'},
 {start:103,end:107.5,layout:'spectrum',text:'波长不同，我们感知到的颜色也不同。',sub:'可见光约380–700 nm · c = λf（真空波长）· 进入玻璃时频率不变'},
 {start:108,end:110,layout:'upper-left',text:'光谱，揭示着光的组成。',sub:'前方：恒星的光'},
 {start:110.8,end:115.2,layout:'upper-left',text:'恒星，为什么能够持续发光？',sub:'以太阳这样的主序星为例 · 暖色为科学可视化配色'},
 {start:116,end:119.7,layout:'lower-left',text:'流动的等离子体，构成光球层。',sub:'米粒组织、日珥与日冕 · 结构及尺度为艺术化示意'},
 {start:120.7,end:124.8,layout:'upper-right',text:'答案，藏在恒星的核心。',sub:'高温、高压 · 局部剖切展示 · 分层半径为太阳近似示意'},
 {start:125,end:130,layout:'spectrum',text:'核聚变，将一部分质量转化为能量。',sub:'E = Δmc² · pp-I链简化示意 · 前两步各发生两次 · γ为高能辐射，并非可见光'},
 {start:130,end:133.5,layout:'upper-right',text:'能量经过内部传输，最终由光球层向外辐射。',sub:'辐射传输与对流 · 时间高度压缩 · 并非单个光子直线穿透恒星'},
 {start:134,end:135,layout:'right',text:'恒星的光，走向宇宙。',sub:'离开光球层的电磁辐射 · 光迹为艺术化示意'},
 {start:135.2,end:139.7,layout:'upper-left',text:'来自恒星的光，穿越宇宙空间。',sub:'太阳光抵达地球约需8分20秒 · 距离、天体尺度与电影时间经过缩放'},
 {start:144,end:149,layout:'upper-left',text:'光，让我们看见这颗蓝色星球。',sub:'大气散射与云层受光 · 太阳照亮朝向它的一侧'},
 {start:150,end:154.5,layout:'lower-left',text:'昼与夜，在光中交替。',sub:'地球自转与摄影机运动经过时间缩放'},
 {start:159,end:163,layout:'upper-left',text:'从微观世界，到浩瀚宇宙。',sub:''},
 {start:163.3,end:166.3,layout:'upper-left',text:'光，让宇宙被看见。',sub:''},
 {start:166.3,end:170,layout:'title',text:'LUMEN',sub:'光 的 诞 生 · 一场关于光的科学探索'},
] as const;
