import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';

/* ===================== EYE WORLD (story mode) =====================
   Ch.1  Supercycle HQ: the briefing.   Ch.2  Launch the ship, fly to the Eye World.
   Ch.3  Land and fight through eye-styled sentries.   Ch.4  The Overseer Eye: wired into the grid. Solve the power sequence. */

if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
const BASE=new URL('.',import.meta.url).href;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=x=>x*x*(3-2*x),lerp=(a,b,t)=>a+(b-a)*t;
const V3=THREE.Vector3;
const PL_Z=-1400,ARRIVE_Z=-1010,BOSS=new V3(0,0,-172),ZB=[-40,-80,-120],NODE_COL=[0xff4d4f,0xc8ff43,0x4dd2ff,0xffc83d],NODE_HZ=[330,392,494,587];

const CSS=`
.st{position:fixed;inset:0;z-index:12;background:#030804;color:#eaf6ec;font-family:'Space Grotesk',system-ui,sans-serif;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.st.st-off{display:none}.st *{box-sizing:border-box}
.st-stage{position:absolute;inset:0}.st-stage canvas{display:block;width:100%;height:100%}
.st-bar{position:absolute;left:0;right:0;height:0;background:#000;z-index:4;transition:height .6s;pointer-events:none}.st-bar.t{top:0}.st-bar.b{bottom:0}.st.cine .st-bar{height:9%}
.st-hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;padding:14px clamp(12px,3vw,34px);z-index:3;pointer-events:none;transition:opacity .4s}
.st.cine .st-hud,.st.home .st-hud{opacity:0}
.st-panel{padding:10px 16px;border-radius:16px;border:1px solid rgba(190,255,90,.16);background:linear-gradient(145deg,rgba(16,38,21,.8),rgba(5,12,7,.88));backdrop-filter:blur(14px);min-width:170px}
.st-panel span{display:block;font:9px 'DM Mono',monospace;letter-spacing:.24em;color:#8fa896;margin-bottom:6px}
.st-hp{height:9px;border-radius:6px;background:rgba(255,255,255,.1);overflow:hidden}.st-hp i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#7ddc1f,#d4ff3a);transform-origin:left;transition:transform .15s}.st-hp.low i{background:linear-gradient(90deg,#ff4d4f,#ff9a3a)}
.st-cd{height:5px;border-radius:5px;background:rgba(255,255,255,.1);margin-top:7px;overflow:hidden}.st-cd i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#4dd2ff,#c8ff43);transform-origin:left}
.st-obj{flex:1;max-width:520px;text-align:center}
.st-obj b{display:inline-block;padding:10px 20px;border-radius:999px;border:1px solid rgba(190,255,90,.25);background:rgba(7,17,10,.85);font-size:12px;letter-spacing:.16em;backdrop-filter:blur(12px)}
.st-obj b.red{border-color:#ff4d4f;color:#ff8486;box-shadow:0 0 24px rgba(255,77,79,.3)}
.st-score{text-align:right;min-width:120px}.st-score b{font-size:26px;letter-spacing:-.04em;color:#d4ff3a}
.st-dlg{position:absolute;left:50%;bottom:calc(9% + 18px);transform:translate(-50%,20px);width:min(92vw,780px);padding:16px 20px;border-radius:20px;border:1px solid rgba(212,255,58,.3);background:linear-gradient(145deg,rgba(14,34,18,.94),rgba(4,10,6,.95));box-shadow:0 20px 70px #000b,0 0 40px rgba(125,220,31,.12);z-index:5;opacity:0;pointer-events:none;transition:.35s;cursor:pointer}
.st-dlg.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
.st-dlg small{display:block;font:9px 'DM Mono',monospace;letter-spacing:.28em;color:#d4ff3a;margin-bottom:8px}.st-dlg p{margin:0;font-size:16px;line-height:1.6;min-height:52px}.st-dlg em{position:absolute;right:16px;bottom:10px;font:9px 'DM Mono',monospace;letter-spacing:.2em;color:#8aa690;font-style:normal;animation:stb 1.2s infinite}
@keyframes stb{50%{opacity:.3}}
.st-title{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);text-align:center;z-index:6;opacity:0;pointer-events:none;transition:opacity .6s}.st-title.on{opacity:1}
.st-title small{display:block;font:11px 'DM Mono',monospace;letter-spacing:.4em;color:#d4ff3a;margin-bottom:10px}.st-title b{display:block;font-size:clamp(34px,7vw,76px);letter-spacing:-.05em;text-shadow:0 0 50px rgba(125,220,31,.5)}
.st-toast{position:absolute;left:50%;bottom:120px;transform:translateX(-50%);padding:10px 18px;border-radius:999px;background:rgba(7,17,10,.9);border:1px solid rgba(190,255,90,.3);font:700 11px 'Space Grotesk';letter-spacing:.16em;opacity:0;transition:opacity .2s;pointer-events:none;z-index:6;white-space:nowrap;color:#d4ff3a}.st-toast.on{opacity:1}.st-toast.bad{border-color:#ff4d4f;color:#ff8486}
.st-prompt{position:absolute;left:50%;bottom:170px;transform:translateX(-50%);padding:9px 16px;border-radius:12px;background:rgba(7,17,10,.9);border:1px solid #4dd2ff;color:#9be6ff;font:700 11px 'Space Grotesk';letter-spacing:.16em;opacity:0;pointer-events:none;z-index:6;transition:opacity .15s}.st-prompt.on{opacity:1}
.st-flash{position:absolute;inset:0;background:#eaffc0;opacity:0;pointer-events:none;z-index:8;transition:opacity .5s}
.st-hit{position:absolute;inset:0;pointer-events:none;z-index:7;opacity:0;background:radial-gradient(transparent 45%,rgba(255,40,50,.6));transition:opacity .4s}
.st-btns{position:absolute;right:clamp(12px,3vw,34px);bottom:18px;display:flex;gap:8px;z-index:6}
.st-btns button,.st-top button{font:700 10px 'Space Grotesk';letter-spacing:.16em;padding:11px 15px;border-radius:12px;border:1px solid rgba(185,255,90,.25);background:rgba(11,22,14,.85);color:#d6e9d9;cursor:pointer;backdrop-filter:blur(10px)}
.st-btns button:hover,.st-top button:hover{border-color:#d4ff3a;color:#d4ff3a}
.st-top{position:absolute;left:clamp(12px,3vw,34px);bottom:18px;display:flex;gap:8px;z-index:6}
.st-act{display:none!important;width:74px;height:74px;border-radius:50%!important;font-size:11px!important}
.st-joy{position:absolute;left:26px;bottom:90px;width:130px;height:130px;border-radius:50%;border:1px solid rgba(190,255,90,.28);background:radial-gradient(rgba(125,220,31,.1),rgba(5,12,7,.4));display:none;z-index:6;touch-action:none}
.st-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px;border-radius:50%;background:linear-gradient(#e6ff58,#7ddc1f);box-shadow:0 0 24px rgba(125,220,31,.6)}
.st.play .st-joy{display:none}
@media(pointer:coarse){.st.play .st-joy{display:block}.st.play .st-act{display:block!important}.st-hint{display:none}}
.st-hint{position:absolute;left:50%;bottom:20px;transform:translateX(-50%);font:9px 'DM Mono',monospace;letter-spacing:.2em;color:#8aa690;z-index:2;pointer-events:none;white-space:nowrap;opacity:0;transition:opacity .4s}.st.play .st-hint{opacity:1}
.st-hint b{display:inline-block;padding:3px 7px;border-radius:6px;border:1px solid rgba(185,255,90,.25);background:#0e1d12;color:#eef9ea;margin:0 3px}
.st-home{position:absolute;inset:0;z-index:9;display:flex;align-items:center;padding:0 clamp(18px,6vw,96px);background:linear-gradient(90deg,rgba(4,10,6,.95) 0%,rgba(5,13,8,.78) 42%,rgba(5,13,8,.15) 74%,transparent 100%);transition:opacity .45s,transform .45s}
.st-home.hidden,.st-card.hidden{opacity:0;pointer-events:none;transform:translateX(-24px)}
.st-home-in{max-width:600px;max-height:100%;overflow:auto;padding:18px 0;scrollbar-width:none}
.st-eyebrow{font:10px 'DM Mono',monospace;letter-spacing:.3em;color:#d4ff3a;margin-bottom:14px}
.st-home h1{font-size:clamp(54px,9.5vw,112px);line-height:.86;letter-spacing:-.07em;margin:0 0 16px;text-shadow:0 10px 50px #000a}
.st-home h1 span{background:linear-gradient(100deg,#ff7476,#ff4d4f 50%,#a3162a);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 28px rgba(255,77,79,.45))}
.st-home p{font-size:14px;line-height:1.7;color:#b3c7b8;max-width:460px;margin:0 0 18px}
.st-chap{display:flex;flex-direction:column;gap:7px;margin-bottom:20px}.st-chap div{display:flex;gap:12px;align-items:center;font-size:12px;color:#cfe0d2;padding:9px 12px;border-radius:12px;border:1px solid rgba(190,255,90,.12);background:rgba(8,18,11,.72);max-width:460px}
.st-chap b{flex:none;width:26px;height:26px;border-radius:8px;background:linear-gradient(#e6ff58,#7ddc1f);color:#0a1405;display:grid;place-items:center;font-size:12px}
.st-cta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.st-play{border:0;cursor:pointer;border-radius:14px;padding:17px 30px;font:800 13px 'Space Grotesk';letter-spacing:.18em;color:#0a1405;background:linear-gradient(110deg,#e0ff4a,#8fe321 60%,#7ddc1f);box-shadow:0 9px 32px rgba(125,220,31,.4),inset 0 1px rgba(255,255,255,.65)}.st-play:hover{filter:brightness(1.1)}
.st-ghost{border:1px solid rgba(185,255,90,.3);background:rgba(11,22,14,.8);color:#d6e9d9;border-radius:14px;padding:16px 22px;font:700 11px 'Space Grotesk';letter-spacing:.16em;cursor:pointer}.st-ghost:hover{border-color:#d4ff3a;color:#d4ff3a}
.st-how{max-height:0;overflow:hidden;transition:max-height .35s;font-size:12px;line-height:1.7;color:#aab6c6}.st-how.open{max-height:260px;margin-bottom:16px}.st-how ol{margin:0;padding-left:18px}.st-how b{color:#e9f3ff}
.st-stats{display:flex;gap:26px}.st-stats b{display:block;font-size:26px;letter-spacing:-.05em;background:linear-gradient(#d4ff3a,#7ddc1f);-webkit-background-clip:text;background-clip:text;color:transparent}.st-stats span{font:8px 'DM Mono',monospace;letter-spacing:.22em;color:#8ba592}
.st-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10;width:min(92vw,480px);padding:34px 30px;border-radius:26px;border:1px solid rgba(212,255,58,.2);background:linear-gradient(145deg,rgba(18,42,24,.95),rgba(5,11,7,.96));box-shadow:0 35px 110px #000b,0 0 80px rgba(125,220,31,.12);text-align:center;transition:opacity .4s,transform .4s}
.st-card.hidden{transform:translate(-50%,-46%)}.st-card h2{font-size:clamp(38px,8vw,58px);line-height:.9;letter-spacing:-.06em;margin:6px 0 12px}.st-card p{color:#b3c7b8;font-size:13px;line-height:1.7;margin:0 0 22px}.st-card.bad h2{color:#ff6b6e}.st-card.good h2{color:#d4ff3a}
@media(max-width:650px){.st-home{align-items:flex-end;padding-bottom:14px;background:linear-gradient(0deg,rgba(4,10,6,.97) 0%,rgba(5,13,8,.86) 58%,rgba(5,13,8,.3) 100%)}.st-home h1{font-size:54px}.st-home p{font-size:12px}.st-panel{min-width:120px;padding:8px 12px}.st-obj b{font-size:10px;padding:8px 12px}.st-dlg p{font-size:14px}}
@media(max-height:700px){.st-home h1{font-size:clamp(40px,7vw,64px)}.st-home p,.st-stats{display:none}}
`;
const HTML=`
<div class="st-stage"></div><div class="st-bar t"></div><div class="st-bar b"></div>
<div class="st-hud"><div class="st-panel"><span>SUPER · HEALTH</span><div class="st-hp" id="stHp"><i></i></div><div class="st-cd"><i id="stCd"></i></div></div>
<div class="st-obj"><b id="stObj">—</b></div><div class="st-panel st-score"><span>SCORE</span><b id="stScore">0</b></div></div>
<div class="st-title" id="stTitle"><small></small><b></b></div>
<div class="st-dlg" id="stDlg"><small id="stWho"></small><p id="stTxt"></p><em>SPACE / TAP ▶</em></div>
<div class="st-toast" id="stToast"></div><div class="st-prompt" id="stPrompt">PRESS E TO ACTIVATE</div>
<div class="st-hint"><b>WASD</b> MOVE · <b>SPACE</b> DASH · <b>E</b> SUPER BURST / ACTIVATE · AUTO-FIRE ON</div>
<div class="st-joy" id="stJoy"><i></i></div>
<div class="st-btns"><button id="stDash">DASH</button><button class="st-act" id="stAct">E</button></div>
<div class="st-top"><button id="stBack">◂ SUPER GAMES</button><button id="stHome">HOME</button><button id="stSkip" style="display:none">SKIP ▸▸</button><button id="stSound">SOUND: ON</button></div>
<div class="st-hit" id="stHit"></div><div class="st-flash" id="stFlash"></div>
<section class="st-home" id="stHomeP"><div class="st-home-in"><div class="st-eyebrow">✳ &nbsp; SUPER GAMES · GAME 04 · STORY MODE</div><h1>EYE<br><span>WORLD.</span></h1>
<p>The grid has gone dark. Something with a thousand eyes is draining the Supercycle. Fly the mission, fight through the watchers, and shut down the Overseer Eye wired into the power.</p>
<div class="st-chap"><div><b>1</b>Brief at Supercycle HQ</div><div><b>2</b>Roam HQ, board the ship and fly it to the Eye World</div><div><b>3</b>Land. Destroy every sentry eye on the way</div><div><b>4</b>Crack the Overseer's power sequence</div></div>
<div class="st-cta"><button class="st-play" id="stPlay">START MISSION &nbsp;↗</button><button class="st-ghost" id="stHow">HOW TO PLAY</button><button class="st-ghost" id="stAll">◂ ALL GAMES</button></div>
<div class="st-how" id="stHowBox"><ol><li><b>Pilot the ship</b>: WASD / joystick to steer, hold <b>SPACE</b> to boost, fly through the green rings. Get close and the Eye notices you.</li><li><b>WASD / arrows</b> or the joystick to fly. Your blaster <b>auto-fires</b> at the nearest eye.</li><li><b>SPACE</b> dashes (brief invulnerability). <b>E</b> unleashes a Super Burst.</li><li>Sentinels only take damage while their lid is <b>open</b>.</li><li>At the Overseer, <b>watch the power nodes light up</b>, then press <b>E</b> at each node in the same order.</li></ol></div>
<div class="st-stats"><div><b id="stBest">--</b><span>BEST TIME</span></div><div><b id="stClears">0</b><span>MISSIONS DONE</span></div><div><b>4</b><span>CHAPTERS</span></div></div></div></section>
<section class="st-card hidden" id="stCard"></section>`;

const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

const EYE_V=`varying vec3 vO;varying vec3 vN;varying vec3 vV;void main(){vO=position;vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;gl_Position=projectionMatrix*mv;}`;
const EYE_F=`uniform vec3 iris,glow;uniform float time,hurt,pupil,power;varying vec3 vO;varying vec3 vN;varying vec3 vV;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float nz(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
void main(){vec3 n=normalize(vO);float a=acos(clamp(n.z,-1.,1.));float ph=atan(n.y,n.x);
 vec3 col=mix(vec3(.93,.86,.84),vec3(.5,.34,.4),smoothstep(.6,1.7,a));
 float vein=smoothstep(.6,.82,nz(vec2(ph*6.,a*9.)))*smoothstep(.5,1.4,a);col=mix(col,vec3(.8,.1,.16),vein*.75);
 float ir=.64;
 if(a<ir){float t=a/ir;float fib=nz(vec2(ph*16.,t*7.+time*.25));vec3 ic=iris*(.4+1.0*fib)*(1.25-t*.55);ic+=glow*pow(1.-t,3.)*.7;col=mix(ic,vec3(.02),smoothstep(ir-.07,ir,a)*.85);}
 if(a<.27*pupil)col=vec3(.01,0.,.02);
 vec3 nn=normalize(vN);float spec=pow(max(0.,dot(nn,normalize(vec3(.4,.6,.7)))),34.);col+=spec*.7;
 float fr=pow(1.-max(0.,dot(nn,normalize(vV))),3.);col+=glow*fr*.9*power;col=mix(col,vec3(1.,.25,.25),hurt*.65);col*=.55+.45*power;gl_FragColor=vec4(col,1.);}`;

function create(){
  const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
  const root=document.createElement('section');root.id='st';root.className='st st-off home';root.innerHTML=HTML;document.body.appendChild(root);
  const $=s=>root.querySelector(s);
  const api={onExit:null};
  let visible=false,raf=0,last=0,time=0,soundOn=true;

  /* ---------- renderer ---------- */
  const stage=$('.st-stage');
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  let pr=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pr);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07140c,.01);
  const camera=new THREE.PerspectiveCamera(55,1,.1,4000);
  const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:2}));
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.6,.6,1.0);composer.addPass(bloom);
  const U={time:{value:0}};
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},ca:{value:.0011},vig:{value:.58}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform float time,ca,vig;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=dot(c,c);vec2 off=c*ca*(.5+d*4.);
      vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);col*=1.-vig*smoothstep(.1,.55,d*2.);
      col+=(fract(sin(dot(vUv*(time+1.),vec2(12.9898,78.233)))*43758.5453)-.5)*.016;gl_FragColor=vec4(col,1.);}`});
  composer.addPass(grade);composer.addPass(new OutputPass());
  let baseFov=55;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;baseFov=w/h<.8?70:55;camera.fov=baseFov;camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);

  /* ---------- helpers ---------- */
  const radialTex=(stops,size=128)=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const glowTex=radialTex([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,0)']]);
  const tl=new THREE.TextureLoader();
  const loadTex=(u,cb)=>tl.load(BASE+u,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;cb&&cb(t)});
  const labelSprite=(text,{w=4,size=60,color='#e9ffb0',glow='#c8ff43'}={})=>{const c=document.createElement('canvas');c.width=512;c.height=112;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';x.shadowColor=glow;x.shadowBlur=20;x.fillStyle=color;x.font='800 '+size+'px sans-serif';x.fillText(text,256,56);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false,blending:THREE.AdditiveBlending}));s.scale.set(w,w*112/512,1);return s};
  const metalM=new THREE.MeshStandardMaterial({color:0x17261c,roughness:.35,metalness:.85});
  const limeM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,3,.5)}),redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.4,.45)}),greenM=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.6,.8)});
  const hotM=new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,.35,.5)});

  /* ---------- eyes ---------- */
  function makeEye(r,iris,glow,segs=36){
    const u={iris:{value:new THREE.Color(iris)},glow:{value:new THREE.Color(glow)},time:U.time,hurt:{value:0},pupil:{value:1},power:{value:1}};
    const g=new THREE.Group(),m=new THREE.Mesh(new THREE.SphereGeometry(r,segs,Math.round(segs*.7)),new THREE.ShaderMaterial({uniforms:u,vertexShader:EYE_V,fragmentShader:EYE_F}));g.add(m);
    return{g,m,u,r,lids:null,open:1};
  }
  const lidM=new THREE.MeshStandardMaterial({color:0x3a0a14,roughness:.4,metalness:.6,emissive:0x2a0610,side:THREE.DoubleSide});
  function addLids(e){
    const r=e.r*1.07,top=new THREE.Mesh(new THREE.SphereGeometry(r,28,14,0,Math.PI*2,0,Math.PI/2),lidM),bot=new THREE.Mesh(new THREE.SphereGeometry(r,28,14,0,Math.PI*2,Math.PI/2,Math.PI/2),lidM);
    e.g.add(top,bot);e.lids={top,bot};setLid(e,e.open);
  }
  function setLid(e,o){e.open=o;if(e.lids){e.lids.top.rotation.x=-o*1.25;e.lids.bot.rotation.x=o*1.25}}

  /* ---------- sky / light / world groups ---------- */
  const tint={value:new V3(.2,1,.4)};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1100,32,16),new THREE.ShaderMaterial({uniforms:{tint,time:U.time},side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vP;uniform vec3 tint;uniform float time;void main(){float h=vP.y;vec3 hor=vec3(.02,.05,.04)+tint*.1,mid=vec3(.008,.02,.02)+tint*.02,top=vec3(.002,.005,.008),low=vec3(.01,.015,.015);
      vec3 c=mix(hor,mid,smoothstep(0.,.4,h));c=mix(c,top,smoothstep(.35,1.,h));c=mix(c,low,smoothstep(0.,-.3,h));
      float a=smoothstep(.08,.4,h)*(1.-smoothstep(.5,.85,h));float w=.5+.5*sin(vP.x*7.+time*.2+sin(vP.z*5.+time*.12)*2.);c+=tint*a*w*.25;gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-10;scene.add(sky);const starGrp=new THREE.Group();scene.add(starGrp);
  {const n=2400,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*6.283,y=Math.random()*1.4-.4,s=Math.sqrt(Math.max(0,1-y*y)),r=1000;p.set([Math.cos(th)*s*r,y*r,Math.sin(th)*s*r],i*3);const k=rnd(.5,1);c.set([k,k,k],i*3)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));starGrp.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.7,sizeAttenuation:false,vertexColors:true,fog:false,transparent:true,opacity:.9,depthWrite:false})))}
  const hemi=new THREE.HemisphereLight(0x7fd08f,0x08120c,1.0);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xa6e8b8,2.0);sun.position.set(-20,40,16);scene.add(sun);
  const G={hq:new THREE.Group(),sp:new THREE.Group(),eye:new THREE.Group()};scene.add(G.hq,G.sp,G.eye);G.sp.visible=G.eye.visible=false;

  /* ===== HQ ===== */
  const floorTex=(()=>{const S=1024,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),h=S/2;const g=x.createRadialGradient(h,h,0,h,h,h);g.addColorStop(0,'#17381e');g.addColorStop(.6,'#0d2214');g.addColorStop(1,'#061009');x.fillStyle=g;x.fillRect(0,0,S,S);
    x.strokeStyle='rgba(190,255,70,.3)';x.lineWidth=3;for(const f of[.14,.34,.56,.8,.96]){x.beginPath();x.arc(h,h,h*f,0,6.283);x.stroke()}
    for(let i=0;i<48;i++){const a=i/48*6.283,r=h*.985;x.fillStyle=i%2?'rgba(255,77,79,.75)':'rgba(204,255,0,.75)';x.save();x.translate(h+Math.cos(a)*r,h+Math.sin(a)*r);x.rotate(a);x.fillRect(-16,-6,32,12);x.restore()}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t})();
  const hqR=14;
  const hqFloor=new THREE.Mesh(new THREE.CircleGeometry(hqR,80),new THREE.MeshStandardMaterial({map:floorTex,roughness:.5,metalness:.35}));hqFloor.rotation.x=-Math.PI/2;G.hq.add(hqFloor);
  for(let i=0;i<7;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(hqR+.2,.1,6,72,Math.PI),metalM);r.rotation.y=i*Math.PI/7;G.hq.add(r);const l=new THREE.Mesh(new THREE.TorusGeometry(hqR+.1,.03,6,72,Math.PI),i%2?redM:greenM);l.rotation.y=i*Math.PI/7;G.hq.add(l)}
  {const pa=new THREE.Mesh(new THREE.CylinderGeometry(hqR+.15,hqR+.15,1.1,80,1,true),new THREE.MeshStandardMaterial({color:0x10201a,roughness:.4,metalness:.8,side:THREE.DoubleSide,transparent:true,opacity:.55}));pa.position.y=.55;G.hq.add(pa);
   const rt=new THREE.Mesh(new THREE.TorusGeometry(hqR+.15,.07,8,100),limeM);rt.rotation.x=Math.PI/2;rt.position.y=1.12;G.hq.add(rt)}
  // holo table with the Eye World
  const table=new THREE.Group();table.position.set(0,0,-1);G.hq.add(table);
  {const b=new THREE.Mesh(new THREE.CylinderGeometry(2,2.4,.7,40),metalM);b.position.y=.35;table.add(b);for(const [r,m] of[[1.95,limeM],[1.5,redM]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,64),m);t.rotation.x=Math.PI/2;t.position.y=.72;table.add(t)}}
  const holoEye=makeEye(1.5,0xff4d4f,0xff6a70);holoEye.g.position.y=2.6;table.add(holoEye.g);addLids(holoEye);
  const holoRing=new THREE.Mesh(new THREE.TorusGeometry(2.3,.025,8,80),hotM);holoRing.position.y=2.6;holoRing.rotation.x=1.2;table.add(holoRing);
  const holoLbl=labelSprite('EYE WORLD',{w:3.6,size:60,color:'#ffb3b5',glow:'#ff4d4f'});holoLbl.position.set(0,4.6,0);table.add(holoLbl);
  // commander hologram (Supercycle logo)
  const cmd=new THREE.Group();cmd.position.set(-6.2,0,.6);G.hq.add(cmd);
  {const b=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.5,.45,32),metalM);b.position.y=.22;cmd.add(b);const t=new THREE.Mesh(new THREE.TorusGeometry(1.15,.04,8,48),limeM);t.rotation.x=Math.PI/2;t.position.y=.48;cmd.add(t)}
  const cmdMat=new THREE.ShaderMaterial({uniforms:{map:{value:null},time:U.time},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    fragmentShader:`uniform sampler2D map;uniform float time;varying vec2 vUv;void main(){vec4 t=texture2D(map,vUv);float scan=.8+.2*sin(vUv.y*240.+time*7.);float sw=exp(-pow((fract(time*.33)-vUv.y)*14.,2.));float e=min(min(vUv.x,1.-vUv.x),min(vUv.y,1.-vUv.y));gl_FragColor=vec4(t.rgb*scan*vec3(.8,1.3,.9)+vec3(.3,1.,.5)*(smoothstep(.04,0.,e)*1.6+sw*.3),.9);}`});
  const cmdPlane=new THREE.Mesh(new THREE.PlaneGeometry(3,3),cmdMat);cmdPlane.position.y=2.4;cmd.add(cmdPlane);loadTex('assets/lobby/supercycle-logo.webp',t=>{cmdMat.uniforms.map.value=t});
  const cmdLbl=labelSprite('CYCLE-OS',{w:2.6,size:56});cmdLbl.position.y=4.4;cmd.add(cmdLbl);
  // hangar gate
  const gate=new THREE.Group();gate.position.set(0,0,-hqR+.6);G.hq.add(gate);
  {const fr=new THREE.Mesh(new THREE.TorusGeometry(6.4,.26,10,60,Math.PI),metalM);gate.add(fr);const ln=new THREE.Mesh(new THREE.TorusGeometry(6.4,.08,8,60,Math.PI),limeM);ln.position.z=.2;gate.add(ln);for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.5,.8,.5),metalM);p.position.set(s*6.4,.4,0);gate.add(p)}
   const lb=labelSprite('HANGAR · LAUNCH BAY',{w:5,size:48,color:'#bfe6c6'});lb.position.set(0,7.8,.3);gate.add(lb)}
  {const pad=new THREE.Mesh(new THREE.CircleGeometry(5.2,48),new THREE.MeshStandardMaterial({color:0x0c1a12,roughness:.4,metalness:.8}));pad.rotation.x=-Math.PI/2;pad.position.set(0,.03,-8.6);G.hq.add(pad);
   for(const [r,m] of[[5.1,limeM],[4.2,redM]]){const t=new THREE.Mesh(new THREE.TorusGeometry(r,.05,8,64),m);t.rotation.x=Math.PI/2;t.position.set(0,.06,-8.6);G.hq.add(t)}
   for(let i=0;i<10;i++){const a=i/10*6.283,l=new THREE.Mesh(new THREE.BoxGeometry(.3,.1,.9),i%2?redM:limeM);l.position.set(Math.cos(a)*5.1,.07,-8.6+Math.sin(a)*5.1);l.rotation.y=-a;G.hq.add(l)}
   for(let i=0;i<7;i++){const a=.35+i*(Math.PI-.7)/6,g=new THREE.Group();g.position.set(Math.cos(a)*12.2,0,Math.sin(a)*12.2);g.lookAt(0,0,0);const b=new THREE.Mesh(new THREE.BoxGeometry(2.6,1.1,1),metalM);b.position.y=.55;g.add(b);const sc=new THREE.Mesh(new THREE.BoxGeometry(2.3,.7,.06),i%2?redM:limeM);sc.position.set(0,1.45,.2);sc.rotation.x=-.5;g.add(sc);G.hq.add(g)}}
  // outside the dome
  {const abyss=new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),new THREE.ShaderMaterial({uniforms:U,vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
     fragmentShader:`varying vec3 vW;uniform float time;void main(){vec2 p=vec2(vW.x,vW.z+time*2.)/4.;vec2 g=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(g.x,g.y),1.);float d=length(vW.xz);vec3 col=vec3(.004,.02,.012)+vec3(.45,1.,.2)*line*(.15+.3*sin(d*.15-time))*exp(-d*.008);col+=vec3(.02,.3,.1)*exp(-d*.02)*.6;gl_FragColor=vec4(col,1.);}`}));abyss.rotation.x=-Math.PI/2;abyss.position.y=-40;G.hq.add(abyss);
   const rockM=new THREE.MeshStandardMaterial({color:0x0d1a12,roughness:.95,flatShading:true}),n=80,im=new THREE.InstancedMesh(new THREE.CylinderGeometry(.55,1.2,1,6,1),rockM,n),d=new THREE.Object3D();
   for(let i=0;i<n;i++){const a=rnd(0,6.283),r=rnd(30,170),top=rnd(-30,10),h=top+52,w=rnd(2,7);d.position.set(Math.cos(a)*r,top-h/2,Math.sin(a)*r);d.scale.set(w,h,w);d.updateMatrix();im.setMatrixAt(i,d.matrix)}G.hq.add(im)}

  /* ===== the ship (upgraded fighter) ===== */
  const ship=new THREE.Group();scene.add(ship);const flames=[];
  {const hullM=new THREE.MeshStandardMaterial({color:0xcfe8d2,roughness:.26,metalness:.88,emissive:0x0a1a0e,side:THREE.DoubleSide}),darkM=new THREE.MeshStandardMaterial({color:0x101d15,roughness:.35,metalness:.85,side:THREE.DoubleSide}),
     glassM=new THREE.MeshStandardMaterial({color:0x7bff3a,emissive:0x2fbf3a,emissiveIntensity:.9,roughness:.05,metalness:.3,transparent:true,opacity:.78}),engM=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.8,3)});
   const prof=[[0,4.5],[.2,4.2],[.55,3.3],[.85,2.1],[1,.6],[1.05,-.8],[.95,-2.1],[.72,-3],[0,-3.15]].map(([r,y])=>new THREE.Vector2(r,y));
   const fus=new THREE.Mesh(new THREE.LatheGeometry(prof,32),hullM);fus.rotation.x=-Math.PI/2;fus.scale.set(1,1,.6);ship.add(fus);
   const can=new THREE.Mesh(new THREE.SphereGeometry(.8,24,16),glassM);can.position.set(0,.5,-1.3);can.scale.set(.85,.6,2.1);ship.add(can);
   for(const s of[-1,1]){const st=new THREE.Mesh(new THREE.BoxGeometry(.08,.05,4.4),s>0?limeM:redM);st.position.set(s*.42,.58,.4);ship.add(st)}
   const ws=new THREE.Shape();ws.moveTo(.5,-1.6);ws.lineTo(5,1.9);ws.lineTo(5,2.7);ws.lineTo(.5,2.3);ws.closePath();
   const wg=new THREE.ExtrudeGeometry(ws,{depth:.14,bevelEnabled:false});wg.rotateX(Math.PI/2);
   for(const s of[-1,1]){const w=new THREE.Mesh(wg,darkM);w.position.set(0,-.15,.3);w.scale.x=s;ship.add(w);
    const le=new THREE.Mesh(new THREE.BoxGeometry(.09,.09,5.7),s>0?limeM:redM);le.position.set(s*2.75,-.12,.45);le.rotation.y=s*.907;ship.add(le);
    const tip=new THREE.Mesh(new THREE.BoxGeometry(.25,.25,.9),s>0?limeM:redM);tip.position.set(s*5,-.2,2.35);ship.add(tip);
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.1,1.6,1.5),darkM);fin.position.set(s*.75,.85,2.5);fin.rotation.z=-s*.28;ship.add(fin);const ft=new THREE.Mesh(new THREE.BoxGeometry(.12,.12,1.5),redM);ft.position.set(s*1.15,1.6,2.5);ft.rotation.z=-s*.28;ship.add(ft);
    const eng=new THREE.Mesh(new THREE.CylinderGeometry(.42,.52,2.4,18),darkM);eng.rotation.x=Math.PI/2;eng.position.set(s*1.25,-.15,2.3);ship.add(eng);
    const noz=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.06,18),engM);noz.rotation.x=Math.PI/2;noz.position.set(s*1.25,-.15,3.52);ship.add(noz);
    const f=new THREE.Mesh(new THREE.ConeGeometry(.38,3,14,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.6,2.8,1),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));f.rotation.x=Math.PI/2;f.position.set(s*1.25,-.15,5);ship.add(f);flames.push(f)}
   const eL=new THREE.PointLight(0x4dd2ff,6,14,2);eL.position.set(0,0,4.2);ship.add(eL);ship.userData.eL=eL}
  ship.scale.setScalar(1);

  /* ===== space (piloted flight) ===== */
  const planet=makeEye(150,0xff4d4f,0xff6a70,64);planet.g.position.set(0,0,PL_Z);G.sp.add(planet.g);addLids(planet);const planetRings=[];
  {const h=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff3a4a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.55}));h.scale.set(900,900,1);h.position.set(0,0,PL_Z-40);G.sp.add(h);
   for(const [r,t,m] of[[240,.5,0],[285,.3,1]]){const o=new THREE.Mesh(new THREE.TorusGeometry(r,t*4,8,120),m?limeM:hotM);o.position.set(0,0,PL_Z);o.rotation.set(1.25,.2,m?.4:-.3);G.sp.add(o);planetRings.push(o)}}
  const streaks=[];for(let i=0;i<160;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:i%3?0xc8ff43:0x8affc0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.8}));s.scale.set(.5,.5,1);G.sp.add(s);streaks.push({s,x:rnd(-70,70),y:rnd(-40,40),z:rnd(-420,40)})}
  const astM=new THREE.MeshStandardMaterial({color:0x4a3038,roughness:.9,metalness:.2,flatShading:true,emissive:0x1a0408}),AST=[],astIM=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),astM,90),astD=new THREE.Object3D();astIM.frustumCulled=false;G.sp.add(astIM);
  for(let i=0;i<90;i++){let x=rnd(-55,55),y=rnd(-30,30);const z=rnd(-130,-1000);if(Math.abs(x)<9&&Math.abs(y)<7)x+=Math.sign(x||1)*14;AST.push({x,y,z,s:rnd(2,8),sx:rnd(.7,1.3),sz:rnd(.7,1.3),rx:rnd(0,6),ry:rnd(0,6),vx:rnd(-.6,.6),vy:rnd(-.6,.6)})}
  const BR=[];for(let i=0;i<18;i++){const g=new THREE.Group();g.position.set(Math.sin(i*.62)*20,Math.cos(i*.83)*11,-90-i*50);const a=new THREE.Mesh(new THREE.TorusGeometry(6,.35,10,48),limeM),b=new THREE.Mesh(new THREE.TorusGeometry(6.8,.08,6,48),redM);g.add(a,b);
   const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xc8ff43,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.35}));gl.scale.set(18,18,1);g.add(gl);G.sp.add(g);BR.push({g,x:g.position.x,y:g.position.y,z:g.position.z,done:false})}
  for(let i=0;i<14;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:[0xff2a5a,0x2aff7a,0x4d6aff,0xffc83d][i%4],transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:rnd(.15,.3)}));const sc=rnd(260,520);s.scale.set(sc,sc,1);s.position.set((i%2?1:-1)*rnd(120,320),rnd(-120,120),-i*95-100);G.sp.add(s)}
  const spEyes=[];for(let i=0;i<12;i++){const e=makeEye(rnd(7,15),[0xff4d4f,0xff2a9a,0xffc83d][i%3],[0xff6a70,0xff5ab8,0xffd870][i%3],24);e.g.position.set((i%2?1:-1)*rnd(90,220),rnd(-90,90),-i*80-200);G.sp.add(e.g);spEyes.push(e)}
  const spLights=[];

  /* ===== Eye World ===== */
  const eyeR=makeEye; // alias
  const flowTex=(()=>{const c=document.createElement('canvas');c.width=128;c.height=8;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,128,0);g.addColorStop(0,'rgba(255,255,255,.12)');g.addColorStop(.3,'rgba(255,255,255,.12)');g.addColorStop(.5,'rgba(255,255,255,1)');g.addColorStop(.7,'rgba(255,255,255,.12)');g.addColorStop(1,'rgba(255,255,255,.12)');x.fillStyle=g;x.fillRect(0,0,128,8);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t})();
  const cables=[];
  function addCable(curve,color,r=.22,rep=14){const t=flowTex.clone();t.needsUpdate=true;t.repeat.set(rep,1);const m=new THREE.MeshBasicMaterial({map:t,color:new THREE.Color(color).multiplyScalar(1.8),transparent:true,depthWrite:false});const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,64,r,8),m);G.eye.add(mesh);const c={mesh,t,m,color:new THREE.Color(color),power:1,spd:1};cables.push(c);return c}
  const pathGround=new THREE.Mesh(new THREE.PlaneGeometry(34,300),new THREE.ShaderMaterial({uniforms:{time:U.time,tint},
    vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float time;uniform vec3 tint;void main(){vec2 p=vW.xz/2.;vec2 g=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(g.x,g.y),1.);float edge=smoothstep(14.,17.,abs(vW.x));float c=smoothstep(.2,0.,abs(vW.x))*.9;
      vec3 col=vec3(.07,.012,.02)+tint*line*(.14+.1*sin(vW.z*.2-time*2.))+tint*c*.4;float vv=pow(abs(sin(vW.x*.55+sin(vW.z*.21+time*.4)*2.2)),40.);col+=vec3(1.,.15,.25)*vv*.55*(1.-edge);col=mix(col,vec3(.02,0.,.01),edge);gl_FragColor=vec4(col,1.);}`}));
  pathGround.rotation.x=-Math.PI/2;pathGround.position.set(0,0,-110);G.eye.add(pathGround);
  const arena=new THREE.Mesh(new THREE.CircleGeometry(27,80),new THREE.MeshStandardMaterial({color:0x180610,roughness:.4,metalness:.7,emissive:0x1a0408}));arena.rotation.x=-Math.PI/2;arena.position.set(BOSS.x,.02,BOSS.z);G.eye.add(arena);
  for(const [rr,m] of[[26.6,hotM],[20,hotM],[9,limeM]]){const t=new THREE.Mesh(new THREE.TorusGeometry(rr,.14,8,100),m);t.rotation.x=Math.PI/2;t.position.set(BOSS.x,.08,BOSS.z);G.eye.add(t)}
  // abyss + pillars with embedded eyes
  {const ab=new THREE.Mesh(new THREE.PlaneGeometry(900,900),new THREE.ShaderMaterial({uniforms:{time:U.time,tint},vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
     fragmentShader:`varying vec3 vW;uniform float time;uniform vec3 tint;void main(){vec2 p=vW.xz/4.;vec2 g=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(g.x,g.y),1.);float pulse=.5+.5*sin(vW.z*.05-time*1.2);gl_FragColor=vec4(vec3(.02,0.,.01)+tint*line*(.08+.3*pulse)*exp(-length(vW.xz-vec2(0.,-110.))*.006),1.);}`}));ab.rotation.x=-Math.PI/2;ab.position.set(0,-34,-110);G.eye.add(ab)}
  const rockM=new THREE.MeshStandardMaterial({color:0x1a0a10,roughness:.95,flatShading:true});
  {const n=130,im=new THREE.InstancedMesh(new THREE.CylinderGeometry(.55,1.2,1,6,1),rockM,n),d=new THREE.Object3D();
   for(let i=0;i<n;i++){const side=i%2?1:-1,x=side*rnd(20,80),z=rnd(30,-290),top=rnd(-6,30),h=top+44,r=rnd(2,6);d.position.set(x,top-h/2,z);d.scale.set(r,h,r);d.rotation.y=Math.random()*6;d.updateMatrix();im.setMatrixAt(i,d.matrix)}G.eye.add(im)}
  const wallEyes=[];for(let i=0;i<22;i++){const e=makeEye(rnd(1.4,3.2),[0xff4d4f,0xc8ff43,0xff2a9a][i%3],[0xff6a70,0xd4ff3a,0xff5ab8][i%3]);const side=i%2?1:-1;e.g.position.set(side*rnd(18,40),rnd(1.5,16),rnd(24,-250));e.next=rnd(2,7);e.lid=0;G.eye.add(e.g);wallEyes.push(e)}
  const skyEyes=[makeEye(34,0xff4d4f,0xff6a70,40),makeEye(24,0xff2a9a,0xff5ab8,40)];skyEyes[0].g.position.set(-190,110,-420);skyEyes[1].g.position.set(230,85,-500);for(const e of skyEyes)G.eye.add(e.g);
  {const cm=[new THREE.MeshBasicMaterial({color:new THREE.Color(.8,2.8,.4)}),redM];for(let i=0;i<48;i++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(1),cm[i%2]),side=i%2?1:-1;c.scale.set(rnd(.2,.5),rnd(1,3),rnd(.2,.5));c.position.set(side*rnd(17,60),rnd(-5,8),rnd(30,-260));c.rotation.set(rnd(-.4,.4),Math.random()*6,rnd(-.4,.4));G.eye.add(c)}}
  // power cables: out to the world, along the path edges
  for(let i=0;i<9;i++){const a=i/9*Math.PI*2+.3,end=new V3(Math.cos(a)*rnd(70,150),rnd(-6,2),BOSS.z+Math.sin(a)*rnd(70,150)),mid=new V3((end.x+BOSS.x)/2,rnd(14,34),(end.z+BOSS.z)/2);
    addCable(new THREE.QuadraticBezierCurve3(new V3(BOSS.x,6,BOSS.z),mid,end),[0xff4d4f,0xff2a9a,0xffc83d][i%3],.32,12);
    const py=new THREE.Mesh(new THREE.CylinderGeometry(.8,1.4,14,8),metalM);py.position.set(end.x,end.y-4,end.z);G.eye.add(py);const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff4d4f,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));gl.scale.set(10,10,1);gl.position.set(end.x,end.y+3.4,end.z);G.eye.add(gl)}
  for(const s of[-1,1])addCable(new THREE.CatmullRomCurve3([new V3(s*14,.3,20),new V3(s*13,.3,-30),new V3(s*15,.3,-80),new V3(s*14,.3,-140),new V3(s*12,.4,-165)]),0xff4d4f,.16,40);
  // zone barriers (wired force fields)
  const barriers=ZB.map(z=>{const g=new THREE.Group();g.position.set(0,0,z);G.eye.add(g);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(30,9),new THREE.ShaderMaterial({uniforms:{time:U.time,k:{value:1}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
      fragmentShader:`varying vec2 vUv;uniform float time,k;void main(){float l=smoothstep(.06,0.,abs(fract(vUv.x*30.)-.5)-.44);float s=smoothstep(.1,0.,abs(fract(vUv.y*9.-time*.6)-.5)-.4);float e=1.-smoothstep(.0,.15,min(vUv.y,1.-vUv.y));gl_FragColor=vec4(vec3(1.,.15,.25)*(l*.7+s*.3+.15)*k+vec3(1.,.3,.3)*e*.4*k,(.12+l*.5+s*.2)*k);}`}));f.position.y=4.5;g.add(f);
    for(const x of[-15,15]){const p=new THREE.Mesh(new THREE.BoxGeometry(.7,10,.7),metalM);p.position.set(x,5,0);g.add(p);const t=new THREE.Mesh(new THREE.SphereGeometry(.5,12,10),redM);t.position.set(x,10.3,0);g.add(t)}
    return{g,f,open:false,k:1}});
  // boss
  const boss=makeEye(6.2,0xff4d4f,0xff6a70,56);boss.g.position.set(BOSS.x,9,BOSS.z);addLids(boss);G.eye.add(boss.g);boss.base=new THREE.Color(0xff4d4f);
  {const b=new THREE.Mesh(new THREE.CylinderGeometry(3.2,5,5,24),metalM);b.position.set(BOSS.x,2.5,BOSS.z);G.eye.add(b);const t=new THREE.Mesh(new THREE.TorusGeometry(4.4,.18,8,60),hotM);t.rotation.x=Math.PI/2;t.position.set(BOSS.x,5,BOSS.z);G.eye.add(t)}
  const bossGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff4d4f,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.55}));bossGlow.scale.set(34,34,1);bossGlow.position.set(BOSS.x,9,BOSS.z);G.eye.add(bossGlow);
  const nodes=[0,1,2,3].map(i=>{const a=i*Math.PI/2+Math.PI/4,p=new V3(BOSS.x+Math.cos(a)*15,0,BOSS.z+Math.sin(a)*15),g=new THREE.Group();g.position.copy(p);G.eye.add(g);
    const col=new THREE.Color(NODE_COL[i]);const b=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.6,.8,20),metalM);b.position.y=.4;g.add(b);
    const pil=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,3.6,14),metalM);pil.position.y=2.4;g.add(pil);
    const orbM=new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(.5)});const orb=new THREE.Mesh(new THREE.SphereGeometry(1.1,24,18),orbM);orb.position.y=5;g.add(orb);
    const ring=new THREE.Mesh(new THREE.RingGeometry(2.1,2.5,48),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.06;g.add(ring);
    const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.4}));gl.scale.set(7,7,1);gl.position.y=5;g.add(gl);
    const lbl=labelSprite(String(i+1),{w:1.4,size:80,color:'#fff',glow:'#'+col.getHexString()});lbl.position.y=7.2;g.add(lbl);
    const cab=addCable(new THREE.QuadraticBezierCurve3(new V3(p.x,6,p.z),new V3((p.x+BOSS.x)/2,15,(p.z+BOSS.z)/2),new V3(BOSS.x,9,BOSS.z)),NODE_COL[i],.3,10);
    return{g,p,col,orbM,ring,gl,cab,glow:0,i}});

  /* ===== Eye World upgrades ===== */
  const fleshM=new THREE.MeshStandardMaterial({color:0x2a0c14,roughness:.55,metalness:.5,emissive:0x2a0510,flatShading:true}),veinM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.35,.5)});
  for(let z=10,i=0;z>-150;z-=15.5,i++){if(ZB.some(b=>Math.abs(z-b)<5))continue;const a=new THREE.Mesh(new THREE.TorusGeometry(17.5,.55,8,40,Math.PI),fleshM);a.position.set(0,-.5,z);G.eye.add(a);const v=new THREE.Mesh(new THREE.TorusGeometry(17.5,.12,6,40,Math.PI),i%2?veinM:limeM);v.position.set(0,-.5,z+.5);G.eye.add(v);
   for(const s of[-1,1]){const sp=new THREE.Mesh(new THREE.ConeGeometry(.7,3.2,6),fleshM);sp.position.set(s*17.5,2.2,z);sp.rotation.z=s*.35;G.eye.add(sp)}}
  {const n=80,im=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,5),new THREE.MeshBasicMaterial({color:0xffffff}),n),d=new THREE.Object3D(),cc=[new THREE.Color(3,.5,.6),new THREE.Color(.9,2.8,.5),new THREE.Color(3,.4,1.6)];
   for(let i=0;i<n;i++){const sd=i%2?1:-1,h=rnd(2,9);d.position.set(sd*rnd(15.5,26),h/2-.3,rnd(25,-200));d.scale.set(rnd(.5,1.3),h,rnd(.5,1.3));d.rotation.set(rnd(-.25,.25),0,sd*rnd(.1,.4));d.updateMatrix();im.setMatrixAt(i,d.matrix);im.setColorAt(i,cc[i%3])}im.instanceColor.needsUpdate=true;G.eye.add(im)}
  const floatEyes=[];for(let i=0;i<12;i++){const e=makeEye(rnd(2,4.5),[0xff4d4f,0xff2a9a,0xffc83d][i%3],[0xff6a70,0xff5ab8,0xffd870][i%3],28);e.base=new V3(rnd(-45,45),rnd(22,50),rnd(20,-230));if(Math.abs(e.base.x)<20)e.base.x+=Math.sign(e.base.x||1)*20;e.ph=rnd(0,6);e.g.position.copy(e.base);G.eye.add(e.g);floatEyes.push(e)}
  for(const e of skyEyes){const ap=e.g.position,bs=new V3(0,0,-110),dir=ap.clone().sub(bs),len=dir.length();const c=new THREE.Mesh(new THREE.ConeGeometry(34,len,28,1,true),new THREE.MeshBasicMaterial({color:0xff2a3a,transparent:true,opacity:.045,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));c.position.copy(ap).add(bs).multiplyScalar(.5);c.quaternion.setFromUnitVectors(new V3(0,1,0),dir.normalize());G.eye.add(c)}
  const mist=[];for(let i=0;i<36;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff3a4a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:.08}));sp.scale.set(26,12,1);const x=rnd(-22,22),z=rnd(30,-200);sp.position.set(x,rnd(1,6),z);G.eye.add(sp);mist.push({s:sp,x,p:rnd(0,6)})}
  const DN=260,dustGeo=new THREE.BufferGeometry(),dp=new Float32Array(DN*3);for(let i=0;i<DN;i++)dp.set([rnd(-40,40),rnd(0,34),rnd(30,-200)],i*3);dustGeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
  {const dust=new THREE.Points(dustGeo,new THREE.PointsMaterial({size:.5,map:glowTex,color:0xff8a7a,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));dust.frustumCulled=false;G.eye.add(dust)}
  const gyros=[0,1,2].map(i=>{const r=new THREE.Mesh(new THREE.TorusGeometry(9+i*1.8,.14,8,80),i%2?limeM:hotM);r.position.set(BOSS.x,9,BOSS.z);G.eye.add(r);return r});
  const shards=[];for(let i=0;i<26;i++){const m=new THREE.Mesh(new THREE.OctahedronGeometry(1),i%2?veinM:fleshM);m.userData={a:rnd(0,6.28),r:rnd(12,20),y:rnd(3,16),sp:rnd(.2,.6)};m.scale.set(.5,1.4,.5);G.eye.add(m);shards.push(m)}
  {const bl=new THREE.PointLight(0xff3a4a,120,70,2);bl.position.set(BOSS.x,10,BOSS.z);G.eye.add(bl);for(const z of[10,-60,-110]){const l=new THREE.PointLight(0xff4d4f,40,40,2);l.position.set(0,8,z);G.eye.add(l)}}

  /* ---------- hero (the flyer) ---------- */
  const FL={cw:392,ch:311},FH=2.5,FW=FH*FL.cw/FL.ch;
  const flyF=[];const heroMat=new THREE.ShaderMaterial({uniforms:{map:{value:null},r:{value:new THREE.Vector4(0,.5,.25,.25)},op:{value:1}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D map;uniform vec4 r;uniform float op;varying vec2 vUv;void main(){vec4 t=texture2D(map,vUv*r.zw+r.xy);if(t.a<.04)discard;gl_FragColor=vec4(t.rgb,t.a*op);}`,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const hero=new THREE.Mesh(new THREE.PlaneGeometry(FW,FH),heroMat);hero.renderOrder=3;hero.visible=false;hero.frustumCulled=false;scene.add(hero);
  const heroShadow=new THREE.Mesh(new THREE.CircleGeometry(.9,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));heroShadow.rotation.x=-Math.PI/2;heroShadow.position.y=.04;scene.add(heroShadow);
  loadTex('assets/lobby/flyer.webp',t=>{heroMat.uniforms.map.value=t;flyF.length=1;});
  const P={x:0,z:12,y:2.4,vx:0,vz:0,row:1,ph:0,hp:100,hpMax:100,inv:0,dash:0,dashCd:0,burstCd:0,aimx:0,aimz:-1,moving:false,fire:0,vis:true};

  /* ---------- particles ---------- */
  const MAXP=700,pPos=new Float32Array(MAXP*3),pCol=new Float32Array(MAXP*3),pVel=new Float32Array(MAXP*3),pLife=new Float32Array(MAXP),pMax=new Float32Array(MAXP),pBase=new Float32Array(MAXP*3),pG=new Float32Array(MAXP);pPos.fill(-9999);let pHead=0;
  const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  const pPts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.55,map:glowTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));pPts.frustumCulled=false;scene.add(pPts);
  function emit(x,y,z,n,color,sp=4,up=1,grav=6,life=1){const c=new THREE.Color(color);for(let k=0;k<n;k++){const i=pHead;pHead=(pHead+1)%MAXP;const a=rnd(0,6.283),s=sp*rnd(.3,1),u=rnd(-1,1);pPos.set([x,y,z],i*3);pVel.set([Math.cos(a)*s*Math.sqrt(1-u*u*.5),up*sp*rnd(.2,1.1)*(u>0?1:.4),Math.sin(a)*s*Math.sqrt(1-u*u*.5)],i*3);pBase.set([c.r,c.g,c.b],i*3);pLife[i]=pMax[i]=life*rnd(.6,1.3);pG[i]=grav}}
  function updP(dt){for(let i=0;i<MAXP;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;if(pLife[i]<=0){pPos[j+1]=-9999;pCol[j]=pCol[j+1]=pCol[j+2]=0;continue}pVel[j+1]-=pG[i]*dt;pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f*2;pCol[j+1]=pBase[j+1]*f*2;pCol[j+2]=pBase[j+2]*f*2}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
  const rings=[];function ringFx(x,y,z,color,max=9,speed=14){const m=new THREE.Mesh(new THREE.RingGeometry(.4,.55,48),new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(2),transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);scene.add(m);rings.push({m,t:0,max,speed})}

  /* ---------- audio ---------- */
  const mHQ=new Audio(BASE+'Avalanche_Route.mp3'),mFight=new Audio(BASE+'Locked_In_The_Green.mp3');for(const a of[mHQ,mFight]){a.loop=true;a.volume=0;a.preload='auto'}
  let want=null;
  function music(which){want=which==='hq'?mHQ:which==='fight'?mFight:null;for(const a of[mHQ,mFight])if(a===want&&soundOn)a.play().catch(()=>{})}
  function mixMusic(dt){for(const a of[mHQ,mFight]){const t=(a===want&&soundOn)?.42:0;a.volume=clamp(a.volume+(t-a.volume)*Math.min(1,dt*2.5),0,1);if(a.volume<.01&&a!==want&&!a.paused)a.pause()}}
  let actx=null;const ac=()=>actx??=new (window.AudioContext||window.webkitAudioContext)();
  function tone(f,d,type='sine',v=.05,f2){if(!soundOn)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,a.currentTime);if(f2)o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+d);g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}catch{}}
  function boom(v=.4){if(!soundOn)return;try{const a=ac(),n=Math.floor(a.sampleRate*.45),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=900;const g=a.createGain();g.gain.value=v;s.connect(f);f.connect(g);g.connect(a.destination);s.start();tone(120,.4,'sine',.1,40)}catch{}}
  $('#stSound').onclick=()=>{soundOn=!soundOn;$('#stSound').textContent='SOUND: '+(soundOn?'ON':'OFF');if(soundOn&&want)want.play().catch(()=>{})};

  /* ---------- combat objects ---------- */
  const bolts=[...Array(48)].map(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.2,10,8),new THREE.MeshBasicMaterial({color:new THREE.Color(1.6,3.2,.6)}));m.scale.z=2.4;m.visible=false;scene.add(m);return{m,on:false,vx:0,vz:0,life:0}});
  const orbs=[...Array(60)].map(()=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.34,12,10),new THREE.MeshBasicMaterial({color:new THREE.Color(3.2,.4,.55)}));m.visible=false;scene.add(m);return{m,on:false,vx:0,vz:0,life:0}});
  const picks=[];
  const en=[];
  const SPEC={watcher:{hp:3,r:.9,iris:0xff4d4f,glow:0xff6a70,score:100},blinker:{hp:1,r:.55,iris:0xff2a9a,glow:0xff5ab8,score:60},sentinel:{hp:7,r:1.5,iris:0xffc83d,glow:0xffd870,score:250}};
  function spawn(type,x,z){const sp=SPEC[type],e=makeEye(sp.r,sp.iris,sp.glow,28);const o={type,e,hp:sp.hp,hpMax:sp.hp,r:sp.r,x,z,y:type==='blinker'?2.2:type==='sentinel'?3.2:2.8,vx:0,vz:0,t:rnd(0,3),cool:rnd(1,2.5),alive:true,phase:rnd(0,6),open:0,state:'idle',st:0,zone:curZone};
    if(type==='sentinel'){addLids(e);setLid(e,0)}
    if(type==='blinker'){const w=new THREE.Mesh(new THREE.TorusGeometry(sp.r*1.3,.05,6,24),hotM);w.rotation.x=Math.PI/2;e.g.add(w);o.halo=w}
    e.g.position.set(x,o.y,z);e.g.scale.setScalar(.01);G.eye.add(e.g);en.push(o);emit(x,o.y,z,14,sp.iris,4,.6,2,.7);return o}
  function killEnemy(o,silent){o.alive=false;G.eye.remove(o.e.g);o.e.m.geometry.dispose();o.e.m.material.dispose();emit(o.x,o.y,o.z,34,SPEC[o.type].iris,7,1,6,1.1);emit(o.x,o.y,o.z,16,0xffffff,5,1,6,.7);ringFx(o.x,o.y,o.z,SPEC[o.type].iris,5,12);boom(.25);
    if(!silent){score+=SPEC[o.type].score;if(Math.random()<(o.type==='sentinel'?.9:.3))dropPick(o.x,o.z)}}
  function dropPick(x,z){const m=new THREE.Mesh(new THREE.OctahedronGeometry(.45),new THREE.MeshBasicMaterial({color:new THREE.Color(.8,3,.8)}));m.position.set(x,1.2,z);scene.add(m);picks.push({m,x,z,t:0})}
  function fireBolt(tx,tz){const b=bolts.find(b=>!b.on);if(!b)return;const dx=tx-P.x,dz=tz-P.z,d=Math.hypot(dx,dz)||1;b.on=true;b.life=1.2;b.vx=dx/d*34;b.vz=dz/d*34;b.m.visible=true;b.m.position.set(P.x,P.y,P.z);b.m.rotation.y=Math.atan2(b.vx,b.vz);tone(780,.06,'square',.02,520)}
  function fireOrb(x,y,z,tx,tz,sp=9.5){const o=orbs.find(o=>!o.on);if(!o)return;const dx=tx-x,dz=tz-z,d=Math.hypot(dx,dz)||1;o.on=true;o.life=4;o.vx=dx/d*sp;o.vz=dz/d*sp;o.y=y;o.m.visible=true;o.m.position.set(x,y,z)}

  /* ---------- state ---------- */
  let mode='home',mt=0,curZone=0,score=0,t0=0,zoneClear=false,zoneTitle=0,cineSkip=null,shake=0;
  let best=load('eyeworld-best',null),clears=load('eyeworld-clears',0);
  const camP=new V3(0,6,16),camL=new V3(0,2,0),tgtP=new V3(),tgtL=new V3();camera.position.copy(camP);
  const keys=new Set();let joy={x:0,z:0};
  const el={dlg:$('#stDlg'),who:$('#stWho'),txt:$('#stTxt'),obj:$('#stObj'),hp:$('#stHp'),cd:$('#stCd'),score:$('#stScore'),toast:$('#stToast'),prompt:$('#stPrompt'),flash:$('#stFlash'),hit:$('#stHit'),title:$('#stTitle'),card:$('#stCard'),home:$('#stHomeP'),skip:$('#stSkip'),hint:$('.st-hint')};
  const fmt=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
  function stats(){$('#stBest').textContent=best==null?'--':fmt(best);$('#stClears').textContent=clears}
  let toastT=0;function toast(t,bad){el.toast.textContent=t;el.toast.className='st-toast on'+(bad?' bad':'');toastT=1.8}
  function flash(a=1){el.flash.style.transition='none';el.flash.style.opacity=a;requestAnimationFrame(()=>{el.flash.style.transition='opacity .6s';el.flash.style.opacity=0})}
  function titleCard(small,big,dur=2.6){el.title.querySelector('small').textContent=small;el.title.querySelector('b').textContent=big;el.title.classList.add('on');setTimeout(()=>el.title.classList.remove('on'),dur*1000)}
  function setObj(t,red){el.obj.textContent=t;el.obj.className=red?'red':''}
  function cine(on){root.classList.toggle('cine',on);root.classList.toggle('play',!on&&(mode==='zone'||mode==='boss'||mode==='roam'||mode==='pilot'));el.skip.style.display=on?'':'none'}
  const camPreset={wide:[[0,5.5,13],[0,2,-2]],cmd:[[-1.5,3.4,6.5],[-6.2,3,.6]],table:[[3,4.2,5],[0,2.6,-1]],hero:[[2.8,2.6,8],[4.4,1.9,2.6]],ship:[[7,3.4,-2],[0,1.5,-9.5]]};
  function camTo(name,snap){const [p,l]=camPreset[name];tgtP.set(...p);tgtL.set(...l);if(snap){camP.copy(tgtP);camL.copy(tgtL)}}

  const HINTS={fight:el.hint.innerHTML,roam:'<b>WASD</b> WALK · <b>SPACE</b> FLY UP · <b>E</b> INTERACT / BOARD THE SHIP',pilot:'<b>WASD</b> STEER · HOLD <b>SPACE</b> TO BOOST · FLY THROUGH THE GREEN RINGS'};
  const setHint=k=>{el.hint.innerHTML=HINTS[k]};
  const F={x:0,y:0,z:0,vx:0,vy:0,spd:0,en:1,hit:0,hitCd:0,boost:0},R={alt:1.7,vy:0},arr={z0:0,x0:0,y0:0,said:0};let boostT=0,roamNear='',subT=0;
  const RC=[[0,-1,2.8],[-6.2,.6,1.9],[0,-8.6,3.5]];

  /* ---------- dialogue ---------- */
  let dq=[],di=0,typed=0,dcb=null,dtxt='';
  function say(lines,cb){dq=lines;di=0;dcb=cb;showLine()}
  function showLine(){const l=dq[di];if(!l){el.dlg.classList.remove('on');const cb=dcb;dcb=null;cb&&cb();return}el.dlg.classList.add('on');el.who.textContent=l.who;dtxt=l.t;typed=0;el.txt.textContent='';if(l.cam)camTo(l.cam);if(l.fx)l.fx()}
  function advance(){if(!el.dlg.classList.contains('on'))return;if(typed<dtxt.length){typed=dtxt.length;el.txt.textContent=dtxt}else{di++;showLine()}}
  el.dlg.onclick=advance;
  function sub(who,t,dur=3){dq=[];dcb=null;el.who.textContent=who;el.txt.textContent=t;dtxt=t;typed=t.length;el.dlg.classList.add('on');subT=dur}
  function typeTick(dt){if(!el.dlg.classList.contains('on')||typed>=dtxt.length)return;const before=Math.floor(typed);typed=Math.min(dtxt.length,typed+dt*58);if(Math.floor(typed)!==before){el.txt.textContent=dtxt.slice(0,Math.floor(typed));if(Math.floor(typed)%3===0)tone(900+Math.random()*120,.025,'square',.008)}}

  /* ---------- chapter flow ---------- */
  function showGroup(k){G.hq.visible=k==='hq';G.sp.visible=k==='sp';G.eye.visible=k==='eye'}
  function env(k){
    if(k==='hq'){scene.fog.color.setHex(0x07140c);scene.fog.density=.01;tint.value.set(.2,1,.4);hemi.color.setHex(0x7fd08f);sun.color.setHex(0xa6e8b8)}
    else if(k==='sp'){scene.fog.color.setHex(0x02040a);scene.fog.density=.0008;tint.value.set(.2,.6,.9);hemi.color.setHex(0x6a8fd0);sun.color.setHex(0xc0d8ff)}
    else{scene.fog.color.setHex(0x1a0508);scene.fog.density=.006;tint.value.set(1,.12,.22);hemi.color.setHex(0xd06a7a);sun.color.setHex(0xff9aa6)}
  }
  function toHome(){
    mode='home';roamNear='';subT=0;el.prompt.classList.remove('on');setHint('fight');mt=0;showGroup('hq');env('hq');cine(false);root.classList.add('home');root.classList.remove('play');el.dlg.classList.remove('on');el.card.classList.add('hidden');el.home.classList.remove('hidden');el.title.classList.remove('on');
    ship.visible=true;ship.position.set(0,.9,-8.6);ship.rotation.set(0,0,0);ship.scale.setScalar(1);P.vis=true;P.x=4.4;P.z=2.6;P.y=1.7;P.row=1;resetCombat();stats();music('hq');camTo('wide',true);setObj('—')
  }
  function resetCombat(){for(const o of en)if(o.alive){G.eye.remove(o.e.g)}en.length=0;for(const b of bolts){b.on=false;b.m.visible=false}for(const o of orbs){o.on=false;o.m.visible=false}for(const p of picks)scene.remove(p.m);picks.length=0;P.hp=P.hpMax;P.inv=0;P.dash=0;P.dashCd=0;P.burstCd=0;P.vx=P.vz=0;
    barriers.forEach(b=>{b.open=false;b.k=1;b.f.visible=true;b.f.material.uniforms.k.value=1});setLid(boss,1);boss.u.power.value=1;boss.u.pupil.value=1;boss.u.iris.value.set(0xff4d4f);bossGlow.material.opacity=.55;for(const c of cables){c.power=1}puz.on=false;nodes.forEach(n=>{n.glow=0});scene.getObjectByName&&0}
  function startMission(){
    el.home.classList.add('hidden');root.classList.remove('home');score=0;resetCombat();t0=0;
    mode='brief';mt=0;showGroup('hq');env('hq');cine(true);music('hq');P.vis=true;P.x=4.4;P.z=2.6;P.y=1.7;P.row=1;ship.position.set(0,.9,-8.6);ship.rotation.set(0,0,0);setObj('BRIEFING');
    titleCard('CHAPTER 1','SUPERCYCLE HQ');camTo('wide',true);
    say([
      {who:'CYCLE-OS',cam:'cmd',t:'Super. The Supercycle grid just went dark across three sectors. Power is bleeding out of the network and I can see where it is going.'},
      {who:'CYCLE-OS',cam:'table',t:'The Eye World. A swarm of watcher eyes is siphoning our power through a web of cables, and every cable ends at one place: the Overseer.',fx:()=>tone(220,.5,'sawtooth',.03,110)},
      {who:'CYCLE-OS',cam:'table',t:'Shooting the Overseer does nothing. It is wired straight into the grid, locked behind a power sequence. Watch its nodes, repeat the pattern, and the wires go dark.'},
      {who:'CYCLE-OS',cam:'hero',t:'Fight through the sentry eyes first. Sentinels only take damage when their lids are open. Your blaster locks on by itself, so keep moving.'},
      {who:'SUPER',cam:'hero',t:'Understood. Fuel the ship. I am going in.'},
      {who:'CYCLE-OS',cam:'ship',t:'Launch bay is open. Look around HQ if you need to, then board the ship. You are flying this one yourself. Bring the light back, Super.',fx:()=>tone(660,.3,'triangle',.04,990)}
    ],()=>startRoam());
  }
  function startLaunch(){mode='launch';mt=0;cine(true);P.vis=false;setHint('fight');titleCard('CHAPTER 2','LAUNCH');music('hq');camTo('ship',true)}
  function startRoam(){mode='roam';mt=0;cine(false);root.classList.remove('home');el.dlg.classList.remove('on');P.vis=true;P.x=3.5;P.z=5;P.y=1.7;P.vx=P.vz=0;R.alt=1.7;R.vy=0;ship.visible=true;ship.position.set(0,1,-8.6);ship.rotation.set(0,0,0);ship.scale.setScalar(1);showGroup('hq');env('hq');setObj('FREE ROAM · BOARD THE SHIP');setHint('roam');titleCard('SUPERCYCLE HQ','EXPLORE · THEN BOARD THE SHIP',3.2);camP.set(P.x*.6,8.4,P.z*.6+10.5);camL.set(P.x*.8,1.9,P.z*.8-3);tgtP.copy(camP);tgtL.copy(camL);toast('WALK UP TO THE SHIP AND PRESS E')}
  function interact(){if(mode!=='roam')return;if(roamNear==='ship')board();else if(roamNear==='cmd')sub('CYCLE-OS','The Overseer is wired into the grid. Reach the Eye World, fight the watchers, then crack its power sequence. The ship is ready when you are.',6);else if(roamNear==='table')sub('CYCLE-OS','Scan complete: three sectors of sentry eyes and one Overseer at the end. You will pilot the ship in yourself. Stay sharp.',6)}
  function board(){el.prompt.classList.remove('on');P.vis=false;tone(520,.4,'triangle',.06,1040);startLaunch();sub('SUPER','All systems green. I have the stick.',2.8)}
  function resetSpace(){for(const b of BR){b.done=false;b.g.visible=true;b.g.scale.setScalar(1)}for(const a of AST){a.x0=a.x0??a.x;a.y0=a.y0??a.y}}
  function startPilot(){mode='pilot';mt=0;showGroup('sp');env('sp');cine(false);ship.visible=true;ship.scale.setScalar(1);F.x=F.y=F.z=F.vx=F.vy=F.hit=F.hitCd=F.boost=0;F.spd=70;F.en=1;boostT=0;ship.position.set(0,0,0);ship.rotation.set(0,0,0);P.vis=false;resetSpace();flash(.9);titleCard('CHAPTER 2','YOU HAVE THE CONTROLS',3.2);setHint('pilot');setObj('FLY TO THE EYE WORLD');tone(150,1.2,'sawtooth',.05,600);camP.set(0,3.4,12);camL.set(0,.5,-40);tgtP.copy(camP);tgtL.copy(camL);toast('STEER WITH WASD · HOLD SPACE TO BOOST')}
  function startArrive(){mode='arrive';mt=0;cine(true);arr.z0=F.z;arr.x0=F.x;arr.y0=F.y;arr.said=0;setObj('INCOMING');shake=.3;boom(.3);titleCard('WARNING','THE EYE SEES YOU',3);tone(90,1.6,'sawtooth',.08,60);flash(.3)}
  function startLand(){mode='land';mt=0;ship.scale.setScalar(1);cine(true);showGroup('eye');env('eye');ship.position.set(0,46,16);ship.rotation.set(.0,0,0);P.vis=false;P.x=0;P.z=14;P.y=2.4;flash(.8);titleCard('CHAPTER 3','THE EYE WORLD',3);music('fight');camP.set(-12,26,40);camL.set(0,16,16)}
  function startZone(z){mode='zone';mt=0;curZone=z;zoneClear=false;setHint('fight');cine(false);root.classList.add('play');P.vis=true;ship.position.set(0,.9,16);ship.rotation.set(0,0,0);ship.scale.setScalar(1);
    const sets={1:[['watcher',-8,-22],['watcher',8,-26],['watcher',0,-32],['watcher',-12,-30],['watcher',12,-18]],2:[['watcher',-10,-60],['watcher',10,-62],['watcher',0,-68],['blinker',-6,-56],['blinker',6,-56],['blinker',0,-52],['sentinel',0,-70]],3:[['sentinel',-9,-104],['sentinel',9,-106],['watcher',0,-112],['watcher',-13,-100],['watcher',13,-100],['blinker',-4,-96],['blinker',4,-96],['blinker',0,-92]]};
    for(const [t,x,zz] of sets[z])spawn(t,x,zz);
    titleCard('ZONE '+z+' / 3','DESTROY THE EYES',2.2);toast('ZONE '+z+' · SENTRIES AHEAD')}
  function startBoss(){mode='boss';mt=0;curZone=4;cine(false);root.classList.add('play');titleCard('CHAPTER 4','THE OVERSEER',3);setObj('WATCH THE NODES');puz.on=true;puz.round=0;puz.state='intro';puz.t=0;puz.minion=6;el.prompt.textContent='PRESS E TO ACTIVATE';toast('THE OVERSEER AWAKENS')}
  function startWin(){mode='win';mt=0;cine(true);el.dlg.classList.remove('on');puz.on=false;setObj('POWER OFF');flash(.8)}
  function doWin(){const sec=t0;clears++;save('eyeworld-clears',clears);if(best==null||sec<best){best=sec;save('eyeworld-best',best)}stats();
    el.card.className='st-card good';el.card.innerHTML=`<div class="st-eyebrow">✳ &nbsp; MISSION COMPLETE</div><h2>GRID<br>RESTORED.</h2><p>The Overseer is dark and the Eye World is offline. Mission time ${fmt(sec)}. Score ${score}.${best===sec?'<br><b style="color:#d4ff3a">NEW BEST TIME</b>':''}</p><div class="st-cta" style="justify-content:center;margin:0"><button class="st-play" id="stAgain">PLAY AGAIN &nbsp;↗</button><button class="st-ghost" id="stAll2">ALL GAMES</button></div>`;
    el.card.querySelector('#stAgain').onclick=()=>{el.card.classList.add('hidden');startMission()};el.card.querySelector('#stAll2').onclick=()=>api.onExit&&api.onExit();mode='end'}
  function die(){mode='dead';mt=0;cine(false);root.classList.remove('play');flash(.6);boom(.5);emit(P.x,P.y,P.z,40,0x7bff3a,8,1,6,1.2);P.vis=false;
    el.card.className='st-card bad';el.card.innerHTML=`<div class="st-eyebrow">✕ &nbsp; SIGNAL LOST</div><h2>SUPER<br>DOWN.</h2><p>The eyes got you. Reboot from ${curZone===4?'the Overseer':'zone '+curZone} and try again.</p><div class="st-cta" style="justify-content:center;margin:0"><button class="st-play" id="stRetry">RETRY &nbsp;↗</button><button class="st-ghost" id="stAll3">ALL GAMES</button></div>`;
    el.card.querySelector('#stRetry').onclick=retry;el.card.querySelector('#stAll3').onclick=()=>api.onExit&&api.onExit()}
  function retry(){el.card.classList.add('hidden');const z=curZone;for(const o of en)if(o.alive)G.eye.remove(o.e.g);en.length=0;for(const o of orbs){o.on=false;o.m.visible=false}P.hp=P.hpMax;P.inv=1.5;P.vis=true;P.vx=P.vz=0;
    if(z===4){mode='boss';cine(false);root.classList.add('play');P.x=0;P.z=BOSS.z+16;puz.on=true;puz.state='intro';puz.t=0;puz.round=Math.min(puz.round,2);puz.minion=6;setObj('WATCH THE NODES')}
    else{P.x=0;P.z=z===1?14:ZB[z-2]-3;startZone(z)}}

  /* ---------- the puzzle (Overseer power sequence) ---------- */
  const puz={on:false,round:0,state:'intro',t:0,seq:[],idx:0,show:0,minion:6,near:-1,wait:0};
  const SEQ_LEN=[3,4,5];
  function newSeq(){const n=SEQ_LEN[puz.round];puz.seq=[];let prev=-1;for(let i=0;i<n;i++){let k;do{k=Math.floor(Math.random()*4)}while(k===prev);puz.seq.push(k);prev=k}}
  function lightNode(i,dur=.7){nodes[i].glow=dur;tone(NODE_HZ[i],.45,'triangle',.08);const c=nodes[i].col;boss.u.iris.value.copy(c);boss.u.glow.value.copy(c);emit(nodes[i].p.x,5,nodes[i].p.z,16,NODE_COL[i],4,1,3,.8)}
  function updatePuzzle(dt){
    if(!puz.on)return;puz.t+=dt;
    // minions keep the pressure on
    puz.minion-=dt;if(puz.minion<=0&&(puz.state==='input'||puz.state==='show')&&en.filter(e=>e.alive).length<2){puz.minion=rnd(8,12);const a=rnd(0,6.283);spawn('blinker',BOSS.x+Math.cos(a)*22,BOSS.z+Math.sin(a)*22)}
    if(puz.state==='intro'){if(puz.t>3.2){newSeq();puz.state='show';puz.show=0;puz.t=0;setObj('WATCH ROUND '+(puz.round+1)+' / 3')}}
    else if(puz.state==='show'){
      const slot=puz.t-.8,step=slot/1.0;
      if(slot>=0){const k=Math.floor(step);if(k<puz.seq.length&&k!==puz.show-1&&step-k<.12){puz.show=k+1;lightNode(puz.seq[k],.65)}
        if(k>=puz.seq.length){puz.state='input';puz.idx=0;puz.t=0;setObj('REPEAT THE SEQUENCE · '+puz.seq.length+' NODES',false);toast('YOUR TURN · PRESS E AT THE NODES')}}
    }
    else if(puz.state==='ok'){if(puz.t>2.2){puz.round++;if(puz.round>=3){puz.on=false;startWin()}else{newSeq();puz.state='show';puz.show=0;puz.t=0;setObj('WATCH ROUND '+(puz.round+1)+' / 3')}}}
    else if(puz.state==='bad'){if(puz.t>1.8){puz.state='show';puz.show=0;puz.t=0;setObj('WATCH AGAIN · ROUND '+(puz.round+1)+' / 3')}}
    // proximity prompt
    puz.near=-1;if(puz.state==='input'){let bd=4.2;nodes.forEach((n,i)=>{const d=Math.hypot(P.x-n.p.x,P.z-n.p.z);if(d<bd){bd=d;puz.near=i}})}
    el.prompt.classList.toggle('on',puz.near>=0);
  }
  function activate(){
    if(puz.state!=='input'||puz.near<0)return false;const i=puz.near;
    if(i===puz.seq[puz.idx]){lightNode(i,.5);puz.idx++;if(puz.idx>=puz.seq.length){puz.state='ok';puz.t=0;const c=cables.filter(c=>c.power>0);boss.u.power.value=1-(puz.round+1)/3*.85;toast('WIRE CUT · POWER DOWN '+Math.round((puz.round+1)/3*100)+'%');flash(.3);shake=.5;boom(.35);for(const n of nodes)ringFx(n.p.x,.2,n.p.z,0x7bff3a,6,10);setLid(boss,1);const kill=nodes[puz.round].cab;kill.power=0.0;setObj('SEQUENCE ACCEPTED',false);tone(880,.3,'triangle',.07,1320)}}
    else{puz.state='bad';puz.t=0;toast('WRONG NODE · SHOCK!',true);boom(.4);for(const n of nodes){n.glow=.5;emit(n.p.x,5,n.p.z,10,0xff4d4f,4,1,3,.6)}hurt(22,BOSS.x,BOSS.z);shake=.6;setObj('SEQUENCE FAILED',true)}
    return true;
  }

  /* ---------- player actions ---------- */
  function hurt(d,sx,sz){if(P.inv>0||P.hp<=0||mode==='win')return;P.hp-=d;P.inv=.9;shake=Math.max(shake,.4);el.hit.style.transition='none';el.hit.style.opacity=1;requestAnimationFrame(()=>{el.hit.style.transition='opacity .45s';el.hit.style.opacity=0});tone(120,.25,'sawtooth',.07,60);
    const dx=P.x-sx,dz=P.z-sz,dd=Math.hypot(dx,dz)||1;P.vx+=dx/dd*9;P.vz+=dz/dd*9;emit(P.x,P.y,P.z,12,0xff4d4f,5,.8,6,.6);if(P.hp<=0){P.hp=0;die()}}
  function burst(){if(P.burstCd>0||!(mode==='zone'||mode==='boss'))return;P.burstCd=8;shake=.5;boom(.4);flash(.25);ringFx(P.x,.3,P.z,0xc8ff43,12,22);ringFx(P.x,1.5,P.z,0x4dd2ff,12,16);emit(P.x,P.y,P.z,60,0xc8ff43,10,.6,3,.9);tone(200,.5,'sawtooth',.08,900);
    for(const o of en)if(o.alive&&Math.hypot(o.x-P.x,o.z-P.z)<12)damage(o,o.type==='sentinel'&&o.open<.6?0:4,true);for(const b of orbs)if(b.on&&Math.hypot(b.m.position.x-P.x,b.m.position.z-P.z)<12){b.on=false;b.m.visible=false;emit(b.m.position.x,b.m.position.y,b.m.position.z,6,0xff4d4f,3,1,3,.4)}}
  function dash(){if(P.dashCd>0||!(mode==='zone'||mode==='boss'))return;P.dash=.28;P.dashCd=1.1;P.inv=Math.max(P.inv,.3);tone(300,.2,'sawtooth',.05,900);emit(P.x,P.y,P.z,16,0x7bff3a,5,.3,2,.5);
    let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;const m=Math.hypot(ix,iz);if(m<.1){ix=P.aimx;iz=P.aimz}else{ix/=m;iz/=m}P.dvx=ix*22;P.dvz=iz*22}
  function damage(o,d,silent){if(!o.alive||d<=0)return;o.hp-=d;o.e.u.hurt.value=1;emit(o.x,o.y,o.z,6,0xffffff,4,.8,5,.4);tone(260+Math.random()*80,.07,'square',.03);if(o.hp<=0)killEnemy(o)}

  /* ---------- update: modes ---------- */
  function updatePlayer(dt){
    let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m}
    const k=1-Math.exp(-dt*10);P.vx+=(ix*8.2-P.vx)*k;P.vz+=(iz*8.2-P.vz)*k;
    if(P.dash>0){P.dash-=dt;P.vx=P.dvx;P.vz=P.dvz;if(Math.random()<.8)emit(P.x,P.y,P.z,1,0x7bff3a,.6,.2,1,.5)}
    if(m>.1){P.aimx=ix/m;P.aimz=iz/m}
    P.x+=P.vx*dt;P.z+=P.vz*dt;
    // bounds: the corridor, current barrier, boss arena
    const maxZ=21;let minZ=curZone>=1&&curZone<=3&&!barriers[curZone-1].open?ZB[curZone-1]+2.2:-1e9;
    if(curZone===4){const dx=P.x-BOSS.x,dz=P.z-BOSS.z,d=Math.hypot(dx,dz);if(d>24){P.x=BOSS.x+dx/d*24;P.z=BOSS.z+dz/d*24}const bd=Math.hypot(dx,dz);if(bd<5.2){P.x=BOSS.x+dx/bd*5.2;P.z=BOSS.z+dz/bd*5.2}}
    else{P.x=clamp(P.x,-13.2,13.2);P.z=clamp(P.z,minZ,maxZ)}
    const spd=Math.hypot(P.vx,P.vz);P.moving=spd>.8;
    if(P.moving)P.row=Math.abs(P.vx)>Math.abs(P.vz)*.8?(P.vx>0?0:2):(P.vz>0?1:3);else P.row=1;
    P.ph+=dt*(P.moving?12:6);P.inv=Math.max(0,P.inv-dt);P.dashCd=Math.max(0,P.dashCd-dt);P.burstCd=Math.max(0,P.burstCd-dt);
    // auto-fire
    P.fire-=dt;if(P.fire<=0){let best=null,bd=22;for(const o of en)if(o.alive&&o.e.g.scale.x>.9){const d=Math.hypot(o.x-P.x,o.z-P.z);if(d<bd){bd=d;best=o}}if(best){P.fire=.2;fireBolt(best.x,best.z)}}
    if(P.moving&&Math.random()<dt*20)emit(P.x+rnd(-.3,.3),P.y-.8,P.z+rnd(-.3,.3),1,0x7bff3a,.7,.2,2,.5);
    // pickups
    for(let i=picks.length-1;i>=0;i--){const p=picks[i];p.t+=dt;p.m.position.y=1.2+Math.sin(p.t*4)*.25;p.m.rotation.y+=dt*3;if(Math.hypot(p.x-P.x,p.z-P.z)<2){P.hp=Math.min(P.hpMax,P.hp+25);scene.remove(p.m);picks.splice(i,1);toast('+25 HEALTH');tone(700,.15,'triangle',.06,1200);emit(P.x,P.y,P.z,16,0x7bff3a,4,1,3,.7)}}
  }
  function updateEnemies(dt){
    for(const o of en){if(!o.alive)continue;o.t+=dt;const e=o.e;e.g.scale.setScalar(Math.min(1,e.g.scale.x+dt*3));e.u.hurt.value=Math.max(0,e.u.hurt.value-dt*5);
      const dx=P.x-o.x,dz=P.z-o.z,d=Math.hypot(dx,dz)||1;
      if(o.type==='watcher'){const want=11,dirv=d>want+2?1:d<want-2?-1:0;o.vx+=((dx/d*dirv+Math.cos(o.t*.9+o.phase)*.5)*3.2-o.vx)*Math.min(1,dt*2);o.vz+=((dz/d*dirv+Math.sin(o.t*.7+o.phase)*.35)*3.2-o.vz)*Math.min(1,dt*2);
        o.cool-=dt;if(o.cool<.45)e.u.glow.value.setRGB(1+Math.sin(o.t*40)*.4,.2,.25);else e.u.glow.value.set(0xff6a70);if(o.cool<=0&&d<26){o.cool=rnd(2,3);fireOrb(o.x,o.y,o.z,P.x,P.z,9)}}
      else if(o.type==='blinker'){const sp=7.2+curZone*.4;o.vx+=(dx/d*sp-o.vx)*Math.min(1,dt*2.4);o.vz+=(dz/d*sp-o.vz)*Math.min(1,dt*2.4);o.halo.rotation.z+=dt*8;if(d<1.7){hurt(16,o.x,o.z);emit(o.x,o.y,o.z,24,0xff2a9a,7,1,5,.8);ringFx(o.x,o.y,o.z,0xff2a9a,4,12);o.hp=0;killEnemy(o,true);continue}}
      else{ // sentinel: lid cycle, fires when open
        const want=14,dirv=d>want+3?1:d<want-3?-1:0;o.vx+=((dx/d*dirv)*2.4-o.vx)*Math.min(1,dt*2);o.vz+=((dz/d*dirv)*2.4-o.vz)*Math.min(1,dt*2);
        o.st+=dt;const cyc=o.st%5.2;let tgt=0;if(cyc>2.4&&cyc<4.6)tgt=1;if(tgt!==(o.wasOpen?1:0)){if(tgt===1&&d<30){for(const a of[-.28,0,.28]){const ang=Math.atan2(dz,dx)+a;fireOrb(o.x,o.y,o.z,o.x+Math.cos(ang)*20,o.z+Math.sin(ang)*20,8.5)}}o.wasOpen=tgt===1}
        o.open+=(tgt-o.open)*Math.min(1,dt*6);setLid(e,o.open);e.u.power.value=.7+.5*o.open;if(cyc>3.4&&cyc<3.55&&o.open>.9){for(const a of[-.14,.14]){const ang=Math.atan2(dz,dx)+a;fireOrb(o.x,o.y,o.z,o.x+Math.cos(ang)*20,o.z+Math.sin(ang)*20,9.5)}}}
      o.x+=o.vx*dt;o.z+=o.vz*dt;o.x=clamp(o.x,-14,14);if(curZone!==4&&curZone>=1)o.z=Math.min(o.z,20);
      const bob=Math.sin(o.t*2+o.phase)*.35;e.g.position.set(o.x,o.y+bob,o.z);e.g.lookAt(P.x,P.y,P.z)}
    // projectiles
    for(const b of bolts){if(!b.on)continue;b.life-=dt;b.m.position.x+=b.vx*dt;b.m.position.z+=b.vz*dt;let hit=false;
      for(const o of en){if(!o.alive)continue;const dd=Math.hypot(o.x-b.m.position.x,o.z-b.m.position.z);if(dd<o.r+.35){if(o.type==='sentinel'&&o.open<.55){emit(b.m.position.x,b.m.position.y,b.m.position.z,5,0xffc83d,3,.5,3,.3);tone(1500,.04,'square',.02);o.e.u.hurt.value=.25}else damage(o,1);hit=true;break}}
      if(hit||b.life<=0){b.on=false;b.m.visible=false}}
    for(const o of orbs){if(!o.on)continue;o.life-=dt;o.m.position.x+=o.vx*dt;o.m.position.z+=o.vz*dt;o.m.position.y=o.y;const s=1+Math.sin(time*20)*.12;o.m.scale.setScalar(s);
      if(P.vis&&Math.hypot(o.m.position.x-P.x,o.m.position.z-P.z)<1.0&&Math.abs(o.y-P.y)<2){hurt(10,o.m.position.x,o.m.position.z);o.on=false;o.m.visible=false;emit(P.x,P.y,P.z,10,0xff4d4f,4,1,4,.5)}
      else if(o.life<=0){o.on=false;o.m.visible=false}}
    for(let i=en.length-1;i>=0;i--)if(!en[i].alive)en.splice(i,1);
  }
  function updateZones(){
    if(mode!=='zone')return;const alive=en.filter(e=>e.alive&&e.zone===curZone).length,total=curZone===1?5:curZone===2?7:8;
    setObj(zoneClear?'ADVANCE ▸':'DESTROY THE EYES · '+(total-alive)+' / '+total,false);
    if(!zoneClear&&alive===0){zoneClear=true;const b=barriers[curZone-1];b.open=true;flash(.2);boom(.3);tone(520,.4,'triangle',.06,1040);toast('BARRIER DOWN · ADVANCE');ringFx(0,.3,ZB[curZone-1],0x7bff3a,20,20)}
    if(zoneClear){const nz=curZone<3?ZB[curZone]:BOSS.z+34;if(P.z<ZB[curZone-1]-3&&curZone<3){startZone(curZone+1)}else if(curZone===3&&P.z<-138){startBoss()}}
  }
  function updateWorld(dt){
    for(const c of cables){c.t.offset.x-=dt*(.6+c.power*.6)*c.spd;const p=c.power;c.m.color.copy(c.color).multiplyScalar(.15+1.7*p);c.m.opacity=.35+.65*p}
    for(const b of barriers){const tgt=b.open?0:1;b.k+=(tgt-b.k)*Math.min(1,dt*3);b.f.material.uniforms.k.value=b.k;b.f.visible=b.k>.02}
    for(const e of wallEyes){e.g.lookAt(P.x,P.y,P.z);e.next-=dt;if(e.next<0&&!e.lids){e.lids=1;e.next=rnd(2,7)}if(e.lids){e.g.scale.y=1-.9*Math.sin(Math.min(1,e.lid/.2)*Math.PI);e.lid+=dt;if(e.lid>.2){e.lid=0;e.lids=0;e.g.scale.y=1}}}
    for(const e of skyEyes)e.g.lookAt(P.x,P.y,P.z);
    if(G.eye.visible){for(const e of floatEyes){e.g.position.y=e.base.y+Math.sin(time*.8+e.ph)*2.5;e.g.lookAt(P.x,P.y,P.z)}
      gyros.forEach((g,i)=>{g.rotation.x=time*(.5+i*.25)*(i%2?-1:1);g.rotation.y=time*(.3+i*.2)});
      for(const m of shards){const u=m.userData;u.a+=dt*u.sp;m.position.set(BOSS.x+Math.cos(u.a)*u.r,u.y+Math.sin(time+u.a*3)*1.2,BOSS.z+Math.sin(u.a)*u.r);m.rotation.y+=dt*2}
      for(const m of mist){m.s.position.x=m.x+Math.sin(time*.15+m.p)*6;m.s.material.opacity=.07+.05*Math.sin(time*.4+m.p)}
      {const a=dustGeo.attributes.position.array;for(let i=0;i<DN;i++){a[i*3+1]+=dt*(.4+(i%5)*.15);if(a[i*3+1]>34)a[i*3+1]=0}dustGeo.attributes.position.needsUpdate=true}}
    boss.g.lookAt(P.x,P.y+1,P.z);bossGlow.material.opacity=(.35+.2*Math.sin(time*3))*boss.u.power.value;
    for(const n of nodes){n.glow=Math.max(0,n.glow-dt);const g=Math.min(1,n.glow*1.6);n.orbM.color.copy(n.col).multiplyScalar(.45+2.4*g);n.gl.material.opacity=.3+.7*g;n.ring.material.opacity=.3+.6*g;n.gl.scale.setScalar(6+g*5);
      n.cab.c=n.cab;if(n.glow>0){n.cab.power=Math.max(n.cab.power,.9)}else if(n.cab.power>0&&puz.state!=='ok'){}}
  }
  function updateBossFX(dt){
    if(mode==='win'){boss.u.power.value=Math.max(0,boss.u.power.value-dt*.4);setLid(boss,Math.max(0,boss.open-dt*.45));boss.u.pupil.value=Math.max(.2,boss.u.pupil.value-dt*.3);for(const c of cables)c.power=Math.max(0,c.power-dt*.5);if(Math.random()<dt*14)emit(BOSS.x+rnd(-4,4),rnd(5,13),BOSS.z+rnd(-4,4),6,0xff9a3a,5,1,5,.8)}
  }
  function placeHero(){
    const fr=Math.floor(P.ph)%4;heroMat.uniforms.r.value.set(fr*.25,1-(P.row+1)*.25,.25,.25);hero.quaternion.copy(camera.quaternion);
    const vis=P.vis&&flyF.length>0&&(P.inv<=0||Math.floor(time*20)%2===0);hero.visible=vis;heroShadow.visible=P.vis&&P.y<7;
    hero.position.set(P.x,P.y+Math.sin(time*2.4)*.12,P.z);heroShadow.position.set(P.x,.04,P.z);const sh=Math.max(.4,1-(P.y-1.7)*.12);heroShadow.scale.setScalar(sh);
  }

  /* ---------- main update ---------- */
  function update(dt){
    time+=dt;mt+=dt;U.time.value=time;grade.uniforms.time.value=time%100;
    typeTick(dt);mixMusic(dt);
    if(toastT>0){toastT-=dt;if(toastT<=0)el.toast.classList.remove('on')}
    shake=Math.max(0,shake-dt*1.4);
    holoEye.g.lookAt(camera.position.x,camera.position.y*.6,camera.position.z);holoRing.rotation.z+=dt*.6;
    cmdPlane.rotation.y=Math.sin(time*.5)*.25;
    flames.forEach((f,i)=>{f.scale.y=(1+.3*Math.sin(time*30+i))*(1+F.boost*1.2);f.visible=mode==='launch'||mode==='pilot'||mode==='arrive'||mode==='land'});ship.userData.eL.intensity=(mode==='launch'||mode==='pilot'||mode==='arrive'||mode==='land')?6+F.boost*10:0;
    sky.position.copy(camera.position);starGrp.position.copy(camera.position);
    if(subT>0){subT-=dt;if(subT<=0&&!dq.length)el.dlg.classList.remove('on')}
    for(let i=0;i<planetRings.length;i++)planetRings[i].rotation.z+=dt*(.05+i*.03);
    if(mode==='pilot'||mode==='arrive')for(const e of spEyes)e.g.lookAt(ship.position);
    let heroActive=false;
    switch(mode){
      case'home':{const a=time*.15;tgtP.set(Math.sin(a)*13,5.5,Math.cos(a)*13+1);tgtL.set(0,2,-2);P.vis=true;P.row=1;P.ph+=dt*6;break}
      case'brief':{P.ph+=dt*6;if(P.x>2){P.x=4.4}break}
      case'launch':{const t=mt;if(t<1.4){ship.position.set(0,.9+Math.sin(t*3)*.03,-8.6);ship.position.y+=ease(Math.min(1,t/1.4))*.6;tgtP.set(6,3.2,-4);tgtL.set(0,1.6,-9)}
        else{const u=t-1.4;ship.position.z=-8.6-u*u*7;ship.position.y=1.5+u*.6;tgtP.set(ship.position.x+5,3.4,ship.position.z+9);tgtL.copy(ship.position).add(new V3(0,0,-4));if(Math.random()<dt*50)emit(ship.position.x+rnd(-1,1),ship.position.y,ship.position.z+4,1,0x7bff3a,2,.2,1,.6)}
        gate.scale.setScalar(1);if(t>3.6)startPilot();break}
      case'roam':{heroActive=true;
        let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m}
        const k=1-Math.exp(-dt*12);P.vx+=(ix*6.4-P.vx)*k;P.vz+=(iz*6.4-P.vz)*k;P.x+=P.vx*dt;P.z+=P.vz*dt;
        const d=Math.hypot(P.x,P.z);if(d>hqR-1.3){P.x*=(hqR-1.3)/d;P.z*=(hqR-1.3)/d}
        for(const [cx,cz,cr] of RC){const dx=P.x-cx,dz=P.z-cz,dd=Math.hypot(dx,dz);if(dd<cr){const q=cr/Math.max(dd,.01);P.x=cx+dx*q;P.z=cz+dz*q}}
        const rise=keys.has(' ');R.vy+=((rise?4.4:(R.alt>1.75?-2.6:0))-R.vy)*Math.min(1,dt*6);R.alt=clamp(R.alt+R.vy*dt,1.7,6.2);if(!rise&&R.alt<=1.7)R.vy=0;P.y=R.alt;
        P.moving=Math.hypot(P.vx,P.vz)>.8;if(P.moving)P.row=Math.abs(P.vx)>Math.abs(P.vz)*.8?(P.vx>0?0:2):(P.vz>0?1:3);else P.row=1;P.ph+=dt*(P.moving?11:6);
        if((P.moving||rise)&&Math.random()<dt*18)emit(P.x+rnd(-.25,.25),P.y-.8,P.z+rnd(-.25,.25),1,0x7bff3a,.7,.2,2,.5);
        const ds=Math.hypot(P.x,P.z+8.6),dc=Math.hypot(P.x+6.2,P.z-.6),dtb=Math.hypot(P.x,P.z+1);
        roamNear=ds<7.4?'ship':dc<4.8?'cmd':dtb<4.8?'table':'';
        el.prompt.textContent=roamNear==='ship'?'PRESS E TO BOARD THE SHIP':roamNear==='cmd'?'PRESS E · TALK TO CYCLE-OS':'PRESS E · EYE WORLD SCAN';el.prompt.classList.toggle('on',!!roamNear);
        tgtP.set(P.x*.6,8.4+(P.y-1.7)*.3,Math.min(P.z*.6+10.5,13));tgtL.set(P.x*.8,1.9+(P.y-1.7)*.4,P.z*.8-3);break}
      case'pilot':{
        let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,iy=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-joy.z;const m=Math.hypot(ix,iy);if(m>1){ix/=m;iy/=m}
        const wantB=(keys.has(' ')||boostT>0)&&F.en>.02;boostT=Math.max(0,boostT-dt);F.boost+=((wantB?1:0)-F.boost)*Math.min(1,dt*4);F.en=clamp(F.en+(wantB?-.22:.08)*dt,0,1);
        const k=1-Math.exp(-dt*5);F.vx+=(ix*36-F.vx)*k;F.vy+=(iy*22-F.vy)*k;F.x=clamp(F.x+F.vx*dt,-40,40);F.y=clamp(F.y+F.vy*dt,-24,24);
        F.hit=Math.max(0,F.hit-dt*1.6);F.hitCd=Math.max(0,F.hitCd-dt);const target=82+F.boost*70-F.hit*45;F.spd+=(target-F.spd)*Math.min(1,dt*3);const pz=F.z;F.z-=F.spd*dt;
        ship.position.set(F.x,F.y,F.z);ship.rotation.set(F.vy*.012,-F.vx*.006,-F.vx*.014);
        // asteroids
        for(let i=0;i<AST.length;i++){const a=AST[i];a.rx+=dt*a.vx;a.ry+=dt*a.vy;astD.position.set(a.x,a.y,a.z);astD.rotation.set(a.rx,a.ry,0);astD.scale.set(a.s*a.sx,a.s,a.s*a.sz);astD.updateMatrix();astIM.setMatrixAt(i,astD.matrix);
          if(F.hitCd<=0&&Math.abs(a.z-F.z)<a.s+4){const dx=F.x-a.x,dy=F.y-a.y,dz=F.z-a.z,dd=Math.hypot(dx,dy,dz);if(dd<a.s*1.05+1.8){F.hit=1;F.hitCd=.9;F.vx+=dx/(dd||1)*26;F.vy+=dy/(dd||1)*16;shake=.9;boom(.35);emit(F.x,F.y,F.z,26,0xffc83d,8,.5,2,.8);emit(F.x,F.y,F.z,12,0xff4d4f,6,.5,2,.6);el.hit.style.transition='none';el.hit.style.opacity=.8;requestAnimationFrame(()=>{el.hit.style.transition='opacity .5s';el.hit.style.opacity=0});toast('HULL IMPACT · SLOWED',true)}}}
        astIM.instanceMatrix.needsUpdate=true;
        // boost rings
        for(const r of BR){r.g.rotation.z+=dt*.8;if(!r.done&&F.z<=r.z&&pz>=r.z){r.done=true;if(Math.hypot(F.x-r.x,F.y-r.y)<7.2){F.en=Math.min(1,F.en+.4);boostT=1.2;score+=50;emit(r.x,r.y,r.z,34,0xc8ff43,10,.3,1,.8);ringFx(r.x,r.y,r.z,0xc8ff43,10,18);tone(660,.2,'triangle',.06,1320);toast('+50 · BOOST RING')}else{r.g.scale.setScalar(.7)}}if(r.done)r.g.scale.multiplyScalar(1-dt*.5)}
        for(const st of streaks){st.z+=dt*F.spd*1.2;if(st.z>20){st.z=-420;st.x=rnd(-70,70);st.y=rnd(-40,40)}st.s.position.set(F.x+st.x,F.y+st.y,F.z+st.z)}
        if(Math.random()<dt*70)emit(F.x+(Math.random()<.5?-1.25:1.25),F.y-.15,F.z+4,1,0x4dd2ff,2,0,0,.5);
        planet.g.lookAt(ship.position);setLid(planet,clamp((F.z+120)/-700,0,1));
        tgtP.set(F.x*.75,F.y*.75+3.4,F.z+12+F.boost*3);tgtL.set(F.x*.9,F.y*.9+.5,F.z-40);camP.z=tgtP.z;camL.z=tgtL.z;shake=Math.max(shake,.05+F.boost*.22);
        setObj('EYE WORLD · '+Math.max(0,Math.round(F.z-ARRIVE_Z)*3)+' KM');
        if(F.z<=ARRIVE_Z)startArrive();break}
      case'arrive':{const u=clamp(mt/7.4,0,1),e=ease(u),k2=ease(clamp(mt/2.5,0,1));
        F.z=lerp(arr.z0,PL_Z+165,e);F.x=lerp(arr.x0,0,k2);F.y=lerp(arr.y0,0,k2);ship.position.set(F.x,F.y,F.z);ship.rotation.set(0,0,Math.sin(mt*1.3)*.1);
        planet.g.lookAt(ship.position);setLid(planet,1);planet.u.pupil.value=mt<4.5?lerp(1,.55,clamp(mt/3,0,1)):lerp(.55,1.7,clamp((mt-4.5)/2,0,1));planet.u.glow.value.setRGB(1+Math.sin(mt*14)*.3,.2,.25);
        for(const s of streaks){s.z+=dt*(40+e*160);if(s.z>20){s.z=-420;s.x=rnd(-70,70);s.y=rnd(-40,40)}s.s.position.set(F.x+s.x,F.y+s.y,F.z+s.z)}
        const a=1.35*ease(clamp(mt/4.2,0,1))-1.05*ease(clamp((mt-5.4)/1.8,0,1));
        tgtP.set(F.x+Math.sin(a)*16,F.y+3+Math.sin(a)*2,F.z+Math.cos(a)*16);tgtL.set(F.x,F.y,F.z-lerp(2,70,ease(clamp(mt/4,0,1))));
        shake=.15+u*.5;if(Math.random()<dt*70)emit(F.x+(Math.random()<.5?-1.25:1.25),F.y-.15,F.z+4,1,0x4dd2ff,2,0,0,.5);
        if(arr.said===0&&mt>.4){arr.said=1;sub('CYCLE-OS','Proximity alert. The Overseer has locked on to your ship.',3)}
        if(arr.said===1&&mt>2.6){arr.said=2;sub('CYCLE-OS','Hold your course, Super. Every eye on that planet is watching you.',3)}
        if(arr.said===2&&mt>4.9){arr.said=3;sub('SUPER','Then let them look. Diving in.',2.2);tone(300,1.2,'sawtooth',.06,1400)}
        if(arr.said===3&&mt>6.9){arr.said=4;flash(1)}
        if(mt>7.4)startLand();break}
      case'land':{const u=clamp(mt/5,0,1),e=ease(u);ship.position.set(0,lerp(46,.9,e),lerp(16,16,e));ship.rotation.x=Math.sin(u*Math.PI)*-.15;
        tgtP.set(lerp(-14,10,u),lerp(24,5,e),lerp(40,28,u));tgtL.set(0,lerp(14,2,e),12);
        if(mt>3.8){heroActive=true;P.vis=true;const k=clamp((mt-3.8)/1.1,0,1);P.x=lerp(1,0,k);P.z=lerp(15.5,13,k);P.y=lerp(1.2,2.4,k);P.row=1}
        if(Math.random()<dt*40)emit(ship.position.x+rnd(-1,1),ship.position.y-.4,ship.position.z+3,1,0x7bff3a,2,-.2,1,.6);
        if(mt>5.2){camP.set(0,12,P.z+14);camL.set(0,.5,P.z-9);startZone(1)}break}
      case'zone':case'boss':{heroActive=true;updatePlayer(dt);updateEnemies(dt);updateZones();updatePuzzle(dt);
        tgtP.set(P.x*.5,mode==='boss'?15:12,P.z+(mode==='boss'?17:14));tgtL.set(P.x*.5,.5,P.z-(mode==='boss'?10:9));if(mode==='boss'){tgtP.x=P.x*.45;tgtL.z=lerp(P.z-9,BOSS.z,.25)}
        if(P.z>-170&&mode==='zone'&&curZone===3&&P.z<-130){}break}
      case'win':{updateBossFX(dt);const u=mt;tgtP.set(0,14,BOSS.z+30);tgtL.set(0,8,BOSS.z);if(mt>2.6&&!puz.done){puz.done=true;flash(1);boom(.6);emit(BOSS.x,9,BOSS.z,120,0xffc83d,16,1,3,1.6);ringFx(BOSS.x,.4,BOSS.z,0xc8ff43,40,26);
          tint.value.set(.2,1,.4);scene.fog.color.setHex(0x07140c);hemi.color.setHex(0x7fd08f);sun.color.setHex(0xa6e8b8)}
        if(mt>3.2&&!puz.sayd){puz.sayd=true;say([{who:'CYCLE-OS',t:'The Overseer is dark. Power is flowing back into the grid. Every eye in the Eye World just closed.'},{who:'CYCLE-OS',t:'Outstanding work, Super. Bring the ship home. The Supercycle is real again.'}],()=>doWin())}
        P.ph+=dt*6;if(!puz.sayd||true){tgtP.y=14+Math.sin(mt*.4)}break}
      case'dead':{break}
    }
    if(mode!=='win')puz.done=puz.sayd=false;
    if(mode!=='zone'&&mode!=='boss'&&mode!=='land'&&mode!=='dead'&&mode!=='win'){}
    // world
    updateWorld(dt);if(mode==='zone'||mode==='boss'||mode==='win'||mode==='land')updateBossFX(dt);
    updP(dt);for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.t+=dt;const s=1+r.t*r.speed;r.m.scale.set(s,s,s);r.m.material.opacity=Math.max(0,.9*(1-r.t*s/ r.max/ (1+r.t)));if(r.t*r.speed>r.max||r.m.material.opacity<=.01){scene.remove(r.m);r.m.geometry.dispose();r.m.material.dispose();rings.splice(i,1)}}
    // HUD
    el.hp.firstElementChild.style.transform='scaleX('+(P.hp/P.hpMax).toFixed(3)+')';el.hp.classList.toggle('low',P.hp/P.hpMax<.3);
    el.cd.style.transform='scaleX('+(mode==='pilot'?F.en:(1-P.burstCd/8)).toFixed(3)+')';el.score.textContent=score;
    if(mode==='zone'||mode==='boss')t0+=dt;
    placeHero();
  }
  function camUpdate(dt){
    const k=1-Math.exp(-dt*(mode==='zone'||mode==='boss'?5:mode==='pilot'?8:mode==='roam'?4:2.6));
    camP.lerp(tgtP,k);camL.lerp(tgtL,k);const sh=shake*.6;camera.position.set(camP.x+(Math.random()-.5)*sh,camP.y+(Math.random()-.5)*sh,camP.z);camera.lookAt(camL);
    const fv=baseFov+(mode==='pilot'?8+F.boost*16:mode==='arrive'?10:0);if(Math.abs(camera.fov-fv)>.02){camera.fov=fv;camera.updateProjectionMatrix()}
  }
  const perf={a:0,n:0,t:performance.now()};
  function frame(now){
    raf=requestAnimationFrame(frame);const nt=now||performance.now(),dt=Math.min((nt-last)/1000,.05);last=nt;
    update(dt);camUpdate(dt);composer.render();
    perf.a+=(nt-perf.t)/1000;perf.t=nt;perf.n++;if(perf.a>2.5){const fps=perf.n/perf.a;perf.a=0;perf.n=0;if(fps<42&&pr>1){pr=Math.max(1,pr-.25);renderer.setPixelRatio(pr);composer.setPixelRatio(pr);resize()}else if(fps<26&&bloom.enabled){bloom.enabled=false;grade.enabled=false}}
  }

  /* ---------- input ---------- */
  const kd=e=>{if(!visible)return;const k=e.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','e','enter'].includes(k)){e.preventDefault();e.stopImmediatePropagation()}
    if(k==='escape'){if(mode!=='home'&&mode!=='end'){toHome()}e.stopImmediatePropagation();return}
    if(mode==='home'){if(k==='enter'||k===' ')startMission();return}
    if(el.dlg.classList.contains('on')&&subT<=0&&mode!=='roam'&&mode!=='pilot'){if(k===' '||k==='enter'||k==='e')advance();return}
    if(mode==='roam'){if(k==='e')interact();else keys.add(k);return}
    if(mode==='pilot'){keys.add(k);return}
    if(mode==='zone'||mode==='boss'){if(k===' ')dash();else if(k==='e'){if(!activate())burst()}else if(k.length>1||'wasd'.includes(k))keys.add(k)}
  };
  addEventListener('keydown',kd,true);addEventListener('keyup',e=>{if(visible)keys.delete(e.key.toLowerCase())},true);addEventListener('blur',()=>keys.clear());
  const kdMove=e=>{if(!visible||mode==='home')return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k))keys.add(k)};addEventListener('keydown',kdMove,true);
  const joyEl=$('#stJoy'),knob=joyEl.firstElementChild;let jid=null;
  const jset=e=>{const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}joy.x=dx;joy.z=dy;knob.style.transform=`translate(${dx*38}px,${dy*38}px)`};
  joyEl.addEventListener('pointerdown',e=>{jid=e.pointerId;joyEl.setPointerCapture(jid);jset(e);e.preventDefault()});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
  for(const ev of['pointerup','pointercancel'])joyEl.addEventListener(ev,()=>{jid=null;joy.x=joy.z=0;knob.style.transform=''});
  $('#stDash').onclick=()=>{if(mode==='zone'||mode==='boss')dash();else if(mode==='pilot')boostT=1.4};$('#stAct').onclick=()=>{if(mode==='roam')interact();else if(!activate())burst()};
  $('#stPlay').onclick=startMission;$('#stHow').onclick=()=>$('#stHowBox').classList.toggle('open');
  $('#stAll').onclick=$('#stBack').onclick=()=>api.onExit&&api.onExit();$('#stHome').onclick=toHome;
  $('#stSkip').onclick=()=>{if(mode==='brief'){dq=[];el.dlg.classList.remove('on');dcb=null;startRoam()}else if(mode==='launch')startPilot();else if(mode==='arrive')startLand();else if(mode==='land'){camP.set(0,12,28);camL.set(0,.5,5);startZone(1)}else if(mode==='win'){dq=[];el.dlg.classList.remove('on');dcb=null;doWin()}};

  /* ---------- public ---------- */
  api.show=()=>{root.classList.remove('st-off');visible=true;resize();toHome();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)};
  api.hide=()=>{visible=false;cancelAnimationFrame(raf);root.classList.add('st-off');for(const a of[mHQ,mFight]){a.pause();a.volume=0}want=null;keys.clear()};
  api.debug=(where)=>{root.classList.remove('home');el.home.classList.add('hidden');resetCombat();score=0;if(where==='boss'){showGroup('eye');env('eye');curZone=4;P.vis=true;P.x=0;P.z=BOSS.z+16;P.y=2.4;barriers.forEach(b=>{b.open=true;b.k=0});startBoss();puz.t=3.3;camP.set(0,15,BOSS.z+34);camL.set(0,.5,BOSS.z+4)}
    else if(where==='zone'){showGroup('eye');env('eye');P.vis=true;P.x=0;P.z=14;startZone(2);P.z=-40;camP.set(0,12,-24);camL.set(0,.5,-48)}else if(where==='fly'){startPilot()}else if(where==='land'){startLand();mt=2}};
  return api;
}

let inst=null;
export function open(onExit){if(!inst)inst=create();inst.onExit=onExit;inst.show()}
export function close(){if(inst)inst.hide()}
export function debug(w){if(inst)inst.debug(w)}
