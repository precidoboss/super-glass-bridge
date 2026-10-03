import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

/* ===================== MINGLE =====================
   Music plays, everybody mingles. Music stops, a number is called, form groups of exactly that size.
   Anyone left outside a full group is eliminated. Front-view hero sprites; bots are the other players. */

if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
const BASE=new URL('.',import.meta.url).href;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const R=26,PLAYERS=30,FINAL=4,SW=2.2,SH=2.5;

const CSS=`
.mg{position:fixed;inset:0;z-index:12;background:#030804;color:#eaf6ec;font-family:'Space Grotesk',system-ui,sans-serif;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.mg.mg-off{display:none}.mg *{box-sizing:border-box}
.mg-stage{position:absolute;inset:0}.mg-stage canvas{display:block;width:100%;height:100%}
.mg-hud{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:14px clamp(12px,3vw,34px);pointer-events:none;z-index:2;gap:10px}
.mg-stat{min-width:104px;padding:10px 16px;border-radius:16px;border:1px solid rgba(190,255,90,.16);background:linear-gradient(145deg,rgba(16,38,21,.8),rgba(5,12,7,.88));backdrop-filter:blur(14px);position:relative}
.mg-stat:after{content:"";position:absolute;left:0;top:14px;bottom:14px;width:3px;border-radius:3px;background:linear-gradient(#d4ff3a,#7ddc1f)}
.mg-stat.r{text-align:right}.mg-stat.r:after{left:auto;right:0;background:linear-gradient(#ff4d4f,#b42b30)}
.mg-stat span{display:block;font:9px 'DM Mono',monospace;letter-spacing:.24em;color:#8fa896}
.mg-stat b{font-size:30px;letter-spacing:-.05em;color:#d4ff3a;text-shadow:0 0 18px rgba(125,220,31,.5)}.mg-stat i{font-style:normal;color:#788393;font-size:13px;margin-left:4px}
.mg-mid{flex:1;max-width:560px;text-align:center}
.mg-phase{display:inline-block;padding:10px 20px;border-radius:999px;border:1px solid rgba(190,255,90,.2);background:rgba(7,17,10,.82);font-weight:700;letter-spacing:.16em;font-size:13px;color:#e9f6ea;backdrop-filter:blur(12px);transition:.25s}
.mg-phase.call{border-color:#d4ff3a;color:#d4ff3a;box-shadow:0 0 26px rgba(125,220,31,.4)}.mg-phase.bad{border-color:#ff4d4f;color:#ff7476;box-shadow:0 0 26px rgba(255,77,79,.35)}
.mg-timer{height:5px;border-radius:5px;background:rgba(255,255,255,.1);margin:10px auto 0;max-width:340px;overflow:hidden;opacity:0;transition:opacity .25s}.mg-timer.on{opacity:1}
.mg-timer i{display:block;height:100%;width:100%;background:linear-gradient(90deg,#7ddc1f,#d4ff3a);transform-origin:left}.mg-timer.low i{background:linear-gradient(90deg,#ff4d4f,#ff9a3a)}
.mg-call{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) scale(.6);text-align:center;opacity:0;pointer-events:none;z-index:3;transition:opacity .3s,transform .45s cubic-bezier(.2,1.4,.4,1)}
.mg-call.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
.mg-call small{display:block;font:700 13px 'DM Mono',monospace;letter-spacing:.4em;color:#cfe4d2;text-shadow:0 4px 20px #000}
.mg-call b{display:block;font-size:clamp(120px,24vw,260px);line-height:.9;letter-spacing:-.08em;background:linear-gradient(#e6ff58,#7ddc1f);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 40px rgba(125,220,31,.6)) drop-shadow(0 10px 30px #000)}
.mg-call em{display:block;font-style:normal;font:11px 'DM Mono',monospace;letter-spacing:.3em;color:#ff7476;margin-top:6px}
.mg-toast{position:absolute;left:50%;bottom:92px;transform:translateX(-50%);padding:9px 16px;border-radius:999px;background:rgba(7,17,10,.88);border:1px solid rgba(190,255,90,.25);font:700 11px 'Space Grotesk';letter-spacing:.16em;opacity:0;transition:opacity .2s;pointer-events:none;z-index:3;white-space:nowrap}
.mg-toast.on{opacity:1}.mg-toast.bad{border-color:#ff4d4f;color:#ff7476}.mg-toast.good{border-color:#7ddc1f;color:#d4ff3a}
.mg-feed{position:absolute;left:clamp(12px,3vw,34px);top:98px;display:flex;flex-direction:column;gap:5px;z-index:2;pointer-events:none}
.mg-feed div{font:10px 'DM Mono',monospace;letter-spacing:.14em;padding:5px 10px;border-radius:8px;background:rgba(7,17,10,.7);border-left:3px solid #ff4d4f;color:#ffb3b4;animation:mgf 3.4s forwards}
@keyframes mgf{0%{opacity:0;transform:translateX(-10px)}8%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}
.mg-bar{position:absolute;right:clamp(12px,3vw,34px);bottom:16px;display:flex;gap:8px;z-index:4}
.mg-bar button,.mg-btn2{font:700 10px 'Space Grotesk';letter-spacing:.16em;padding:11px 15px;border-radius:12px;border:1px solid rgba(185,255,90,.25);background:rgba(11,22,14,.85);color:#d6e9d9;cursor:pointer;backdrop-filter:blur(10px)}
.mg-bar button:hover,.mg-btn2:hover{border-color:#d4ff3a;color:#d4ff3a}
.mg-hint{position:absolute;left:clamp(12px,3vw,34px);bottom:22px;font:9px 'DM Mono',monospace;letter-spacing:.2em;color:#8aa690;z-index:2;pointer-events:none}
.mg-hint b{display:inline-block;padding:3px 7px;border-radius:6px;border:1px solid rgba(185,255,90,.25);background:#0e1d12;color:#eef9ea;margin:0 3px}
.mg-joy{position:absolute;left:26px;bottom:26px;width:132px;height:132px;border-radius:50%;border:1px solid rgba(190,255,90,.28);background:radial-gradient(rgba(125,220,31,.1),rgba(5,12,7,.4));display:none;z-index:4;touch-action:none}
.mg-joy i{position:absolute;left:50%;top:50%;width:54px;height:54px;margin:-27px;border-radius:50%;background:linear-gradient(#e6ff58,#7ddc1f);box-shadow:0 0 24px rgba(125,220,31,.6)}
@media(pointer:coarse){.mg-joy{display:block}.mg-hint{display:none}.mg-bar{bottom:auto;top:84px;right:12px}}
.mg-flash{position:absolute;inset:0;pointer-events:none;z-index:5;opacity:0;background:radial-gradient(transparent 40%,rgba(255,40,50,.55));transition:opacity .6s}
.mg-home{position:absolute;inset:0;z-index:6;display:flex;align-items:center;padding:0 clamp(18px,6vw,96px);background:linear-gradient(90deg,rgba(4,10,6,.95) 0%,rgba(5,13,8,.78) 40%,rgba(5,13,8,.2) 72%,transparent 100%);transition:opacity .45s,transform .45s}
.mg-home.hidden,.mg-card.hidden{opacity:0;pointer-events:none;transform:translateX(-24px)}
.mg-home-in{max-width:580px;max-height:100%;overflow:auto;padding:18px 0;scrollbar-width:none}
.mg-eyebrow{font:10px 'DM Mono',monospace;letter-spacing:.3em;color:#d4ff3a;margin-bottom:14px}
.mg-home h1{font-size:clamp(54px,9.5vw,112px);line-height:.86;letter-spacing:-.07em;margin:0 0 16px;text-shadow:0 10px 50px #000a}
.mg-home h1 span{background:linear-gradient(100deg,#e6ff58,#7ddc1f 55%,#4fb312);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 28px rgba(125,220,31,.35))}
.mg-home p{font-size:14px;line-height:1.7;color:#b3c7b8;max-width:440px;margin:0 0 18px}
.mg-rules{display:flex;flex-direction:column;gap:7px;margin-bottom:20px}
.mg-rules div{display:flex;gap:12px;align-items:center;font-size:12px;color:#cfe0d2;padding:9px 12px;border-radius:12px;border:1px solid rgba(190,255,90,.12);background:rgba(8,18,11,.72);max-width:440px}
.mg-rules b{flex:none;width:26px;height:26px;border-radius:8px;background:linear-gradient(#e6ff58,#7ddc1f);color:#0a1405;display:grid;place-items:center;font-size:12px}
.mg-cta{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px}
.mg-play{border:0;cursor:pointer;border-radius:14px;padding:17px 30px;font:800 13px 'Space Grotesk';letter-spacing:.18em;color:#0a1405;background:linear-gradient(110deg,#e0ff4a,#8fe321 60%,#7ddc1f);box-shadow:0 9px 32px rgba(125,220,31,.4),inset 0 1px rgba(255,255,255,.65)}
.mg-play:hover{filter:brightness(1.1)}
.mg-ghost{border:1px solid rgba(185,255,90,.3);background:rgba(11,22,14,.8);color:#d6e9d9;border-radius:14px;padding:16px 22px;font:700 11px 'Space Grotesk';letter-spacing:.16em;cursor:pointer}.mg-ghost:hover{border-color:#d4ff3a;color:#d4ff3a}
.mg-how{max-height:0;overflow:hidden;transition:max-height .35s;font-size:12px;line-height:1.7;color:#aab6c6}.mg-how.open{max-height:240px;margin-bottom:16px}.mg-how ol{margin:0;padding-left:18px}.mg-how b{color:#e9f3ff}
.mg-stats{display:flex;gap:26px}.mg-stats b{display:block;font-size:26px;letter-spacing:-.05em;background:linear-gradient(#d4ff3a,#7ddc1f);-webkit-background-clip:text;background-clip:text;color:transparent}.mg-stats span{font:8px 'DM Mono',monospace;letter-spacing:.22em;color:#8ba592}
.mg-card{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:7;width:min(92vw,470px);padding:34px 30px;border-radius:26px;border:1px solid rgba(212,255,58,.2);background:linear-gradient(145deg,rgba(18,42,24,.95),rgba(5,11,7,.96));box-shadow:0 35px 110px #000b,0 0 80px rgba(125,220,31,.12);text-align:center;transition:opacity .4s,transform .4s}
.mg-card.hidden{transform:translate(-50%,-46%)}
.mg-card h2{font-size:clamp(40px,8vw,60px);line-height:.9;letter-spacing:-.06em;margin:6px 0 12px}.mg-card p{color:#b3c7b8;font-size:13px;line-height:1.7;margin:0 0 22px}
.mg-card.bad h2{color:#ff6b6e}.mg-card.good h2{color:#d4ff3a}
@media(max-width:650px){.mg-home{align-items:flex-end;padding-bottom:14px;background:linear-gradient(0deg,rgba(4,10,6,.97) 0%,rgba(5,13,8,.86) 58%,rgba(5,13,8,.3) 100%)}.mg-home h1{font-size:54px}.mg-home p{font-size:12px}.mg-stat{min-width:78px;padding:8px 12px}.mg-stat b{font-size:24px}.mg-phase{font-size:10px;padding:8px 12px}}
@media(max-height:700px){.mg-home h1{font-size:clamp(40px,7vw,64px)}.mg-home p,.mg-stats{display:none}}
`;
const HTML=`
<div class="mg-stage"></div>
<div class="mg-hud"><div class="mg-stat"><span>ALIVE</span><b id="mgAlive">30</b><i>/ 30</i></div>
<div class="mg-mid"><div class="mg-phase" id="mgPhase">MINGLE</div><div class="mg-timer" id="mgTimerW"><i id="mgTimer"></i></div></div>
<div class="mg-stat r"><span>ROUND</span><b id="mgRound">1</b></div></div>
<div class="mg-feed" id="mgFeed"></div>
<div class="mg-call" id="mgCall"><small>FORM GROUPS OF</small><b id="mgNum">3</b><em id="mgSub"></em></div>
<div class="mg-toast" id="mgToast"></div><div class="mg-flash" id="mgFlash"></div>
<div class="mg-hint"><b>W A S D</b> / <b>ARROWS</b> MOVE &nbsp;·&nbsp; FILL A GROUP CIRCLE BEFORE IT CLOSES</div>
<div class="mg-joy" id="mgJoy"><i></i></div>
<div class="mg-bar"><button id="mgBack">◂ SUPER GAMES</button><button id="mgHomeBtn">HOME</button><button id="mgSound">SOUND: ON</button></div>
<section class="mg-home" id="mgHome"><div class="mg-home-in">
<div class="mg-eyebrow">✳ &nbsp; SUPER GAMES · GAME 03</div><h1>MIN<br><span>GLE.</span></h1>
<p>Thirty players. The music plays and everyone mingles. When it stops, a number is called. Find friends, fill a group circle with exactly that many, or you're out.</p>
<div class="mg-rules"><div><b>♪</b>Music plays, so keep moving and find your spot.</div><div><b>#</b>Music stops, a number is called, and group circles appear.</div><div><b>✕</b>No seat in a full group of exactly that size? Eliminated.</div></div>
<div class="mg-cta"><button class="mg-play" id="mgPlay">PLAY &nbsp;↗</button><button class="mg-ghost" id="mgHow">HOW TO PLAY</button><button class="mg-ghost" id="mgAll">◂ ALL GAMES</button></div>
<div class="mg-how" id="mgHowBox"><ol><li><b>WASD / arrows</b> or the joystick to move.</li><li>When the number is called, run into a circle. It shows seats taken, like <b>2/4</b>.</li><li>A full circle locks. Bots are racing you for the last seats.</li><li>Survive until only <b>4</b> players remain.</li></ol></div>
<div class="mg-stats"><div><b id="mgBest">0</b><span>BEST ROUND</span></div><div><b id="mgWins">0</b><span>SURVIVALS</span></div><div><b>30</b><span>PLAYERS</span></div></div>
</div></section>
<section class="mg-card hidden" id="mgCard"></section>`;

const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};

function create(){
  const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
  const root=document.createElement('section');root.id='mg';root.className='mg mg-off';root.innerHTML=HTML;document.body.appendChild(root);
  const $=s=>root.querySelector(s);
  const api={onExit:null};
  let visible=false,raf=0,ready=null,soundOn=true,last=0,time=0;

  /* ---------- renderer ---------- */
  const stage=$('.mg-stage');
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  let pr=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pr);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07140c,.011);
  const camera=new THREE.PerspectiveCamera(50,1,.1,600);
  const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:2}));
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.5,.6,1.0);composer.addPass(bloom);composer.addPass(new OutputPass());
  let baseFov=50;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;baseFov=w/h<.8?64:50;camera.fov=baseFov;camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);

  /* ---------- helpers ---------- */
  const radialTex=(stops,size=128)=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const glowTex=radialTex([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,0)']]);

  /* ---------- sky / world ---------- */
  const skyU={time:{value:0}};
  const sky=new THREE.Mesh(new THREE.SphereGeometry(300,32,16),new THREE.ShaderMaterial({uniforms:skyU,side:THREE.BackSide,depthWrite:false,fog:false,
    vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vP;uniform float time;void main(){float h=vP.y;vec3 hor=vec3(.03,.11,.07),mid=vec3(.008,.04,.035),top=vec3(.002,.01,.012),low=vec3(.01,.025,.02);
      vec3 c=mix(hor,mid,smoothstep(0.,.4,h));c=mix(c,top,smoothstep(.35,1.,h));c=mix(c,low,smoothstep(0.,-.3,h));
      float a=smoothstep(.12,.4,h)*(1.-smoothstep(.5,.85,h));float w=.5+.5*sin(vP.x*7.+time*.25+sin(vP.z*5.+time*.15)*2.);
      c+=vec3(.05,.45,.2)*a*w*.35+vec3(.4,.05,.08)*a*(1.-w)*.12;gl_FragColor=vec4(c,1.);}`}));
  sky.renderOrder=-10;scene.add(sky);
  {const n=1600,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*6.283,y=Math.random()*.9+.1,s=Math.sqrt(1-y*y),r=280;p.set([Math.cos(th)*s*r,y*r,Math.sin(th)*s*r],i*3);const k=rnd(.5,1);c.set([k,k,k],i*3)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));
    scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,vertexColors:true,fog:false,transparent:true,opacity:.9,depthWrite:false})));}
  {const m=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTex([[0,'rgba(235,255,240,1)'],[.12,'rgba(210,255,225,1)'],[.16,'rgba(150,255,200,.35)'],[.5,'rgba(90,255,150,.08)'],[1,'rgba(90,255,150,0)']],256),fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));m.scale.set(110,110,1);m.position.set(-90,90,-200);scene.add(m)}
  scene.add(new THREE.HemisphereLight(0x7fd08f,0x08120c,1.0));
  const sun=new THREE.DirectionalLight(0xa6e8b8,2.0);sun.position.set(-20,40,16);scene.add(sun);
  const pl1=new THREE.PointLight(0xc8ff43,60,50,2);pl1.position.set(0,9,0);scene.add(pl1);

  // arena floor
  const floorTex=(()=>{const S=1024,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),h=S/2;
    const g=x.createRadialGradient(h,h,0,h,h,h);g.addColorStop(0,'#17381e');g.addColorStop(.7,'#0c2013');g.addColorStop(1,'#061009');x.fillStyle=g;x.fillRect(0,0,S,S);
    x.strokeStyle='rgba(190,255,70,.28)';x.lineWidth=3;for(const f of[.18,.38,.58,.78,.94]){x.beginPath();x.arc(h,h,h*f,0,6.283);x.stroke()}
    x.strokeStyle='rgba(190,255,70,.12)';x.lineWidth=2;for(let i=0;i<24;i++){const a=i/24*6.283;x.beginPath();x.moveTo(h+Math.cos(a)*h*.18,h+Math.sin(a)*h*.18);x.lineTo(h+Math.cos(a)*h*.94,h+Math.sin(a)*h*.94);x.stroke()}
    x.fillStyle='rgba(212,255,58,.55)';x.font='bold 220px sans-serif';x.textAlign='center';x.textBaseline='middle';x.shadowColor='#b6ff3a';x.shadowBlur=40;x.fillText('✳',h,h+8);
    x.shadowBlur=0;for(let i=0;i<36;i++){const a=i/36*6.283,r=h*.97;x.fillStyle=i%2?'rgba(255,77,79,.7)':'rgba(204,255,0,.7)';x.save();x.translate(h+Math.cos(a)*r,h+Math.sin(a)*r);x.rotate(a);x.fillRect(-14,-5,28,10);x.restore()}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t})();
  const floor=new THREE.Mesh(new THREE.CircleGeometry(R,96),new THREE.MeshStandardMaterial({map:floorTex,roughness:.55,metalness:.25}));floor.rotation.x=-Math.PI/2;scene.add(floor);
  const limeM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,3,.5)}),redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.4,.45)});
  for(let i=0;i<16;i++){const m=new THREE.Mesh(new THREE.TorusGeometry(R+.3,.16,8,12,Math.PI*2/16*.92),i%2?redM:limeM);m.rotation.x=-Math.PI/2;m.rotation.z=i/16*Math.PI*2;m.position.y=.1;scene.add(m)}
  const wall=new THREE.Mesh(new THREE.CylinderGeometry(R+.9,R+1.2,.8,96,1,true),new THREE.MeshStandardMaterial({color:0x10201a,roughness:.5,metalness:.7,side:THREE.DoubleSide}));wall.position.y=.1;scene.add(wall);
  // outer ground + grid
  const gu={time:{value:0}};
  const ground=new THREE.Mesh(new THREE.CircleGeometry(220,64),new THREE.ShaderMaterial({uniforms:gu,
    vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float time;void main(){vec2 p=vW.xz/4.;vec2 g=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(g.x,g.y),1.);float d=length(vW.xz);float pulse=.5+.5*sin(d*.18-time*1.3);
      vec3 col=vec3(.004,.018,.01)+vec3(.45,1.,.2)*line*(.15+.45*pulse)*exp(-d*.018);col+=vec3(.02,.3,.1)*exp(-d*.03)*.5;gl_FragColor=vec4(col,1.);}`}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-.6;scene.add(ground);
  // pillars
  {const N=36,geo=new THREE.BoxGeometry(1.4,16,1.4),mat=new THREE.MeshStandardMaterial({color:0x0f1e16,roughness:.45,metalness:.8}),im=new THREE.InstancedMesh(geo,mat,N);
   const sg=new THREE.BoxGeometry(.18,13,.18),ra=new THREE.InstancedMesh(sg,limeM,N/2),rb=new THREE.InstancedMesh(sg,redM,N/2),d=new THREE.Object3D();let ia=0,ib=0;
   for(let i=0;i<N;i++){const a=i/N*Math.PI*2,r=R+6;d.position.set(Math.cos(a)*r,7,Math.sin(a)*r);d.rotation.y=-a;d.updateMatrix();im.setMatrixAt(i,d.matrix);
     d.position.set(Math.cos(a)*(r-.8),7,Math.sin(a)*(r-.8));d.updateMatrix();(i%2?rb:ra).setMatrixAt(i%2?ib++:ia++,d.matrix)}
   scene.add(im,ra,rb)}
  // spot beams
  const beams=[];for(let i=0;i<8;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.3,2,30,16,1,true),new THREE.MeshBasicMaterial({color:i%2?0xff4d4f:0xc8ff43,transparent:true,opacity:.035,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));
    const a=i/8*Math.PI*2;m.position.set(Math.cos(a)*14,15,Math.sin(a)*14);m.userData={a,ph:rnd(0,6)};scene.add(m);beams.push(m)}
  // skyline
  {const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.fillStyle='#0a1118';x.fillRect(0,0,64,128);for(let j=0;j<128;j+=6)for(let i=0;i<64;i+=6)if(Math.random()<.4){x.fillStyle=Math.random()<.7?'#ffd98a':'#9dff7a';x.globalAlpha=rnd(.3,1);x.fillRect(i+1,j+1,3,3)}
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const N=70,im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({map:t,color:0x6a7a8c,fog:false}),N),d=new THREE.Object3D();
   for(let i=0;i<N;i++){const a=rnd(0,6.283),r=rnd(95,170),h=rnd(18,70),w=rnd(7,14);d.position.set(Math.cos(a)*r,-.6+h/2,Math.sin(a)*r);d.scale.set(w,h,w);d.updateMatrix();im.setMatrixAt(i,d.matrix)}scene.add(im)}

  /* ---------- sprites ---------- */
  const mats=[];
  function loadSprites(){
    return Promise.all([...Array(8)].map((_,v)=>new Promise((res,rej)=>{
      new THREE.TextureLoader().load(BASE+`assets/mingle/p${v}.webp`,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;
        mats[v]=[...Array(8)].map((_,f)=>{const c=t.clone();c.needsUpdate=true;c.repeat.set(1/8,1);c.offset.set(f/8,0);return new THREE.SpriteMaterial({map:c,alphaTest:.35,fog:false})});res()},undefined,rej)})));
  }
  const shadowGeo=new THREE.CircleGeometry(.85,20),shadowMat=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.38,depthWrite:false});
  function tagTex(text,you){const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');
    x.fillStyle=you?'#d4ff3a':'rgba(6,14,9,.82)';x.beginPath();x.roundRect(8,10,112,44,14);x.fill();x.strokeStyle=you?'#fff':'rgba(190,255,90,.5)';x.lineWidth=3;x.stroke();
    x.fillStyle=you?'#0a1405':'#e9f6ea';x.font='bold 30px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,64,33);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  const arrowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');x.fillStyle='#d4ff3a';x.shadowColor='#b6ff3a';x.shadowBlur=14;x.beginPath();x.moveTo(12,14);x.lineTo(52,14);x.lineTo(32,52);x.closePath();x.fill();const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();

  /* ---------- state ---------- */
  let phase='boot',pt=0,round=1,N=3,G=1,T=10,ents=[],slots=[],player=null,musicLen=8,callShown=0,resolveDone=false,earlyT=-1,runActive=false;
  const keys=new Set();let joy={x:0,z:0};
  let best=load('mingle-best',0),wins=load('mingle-wins',0);

  function makeEntity(i){
    const e={id:i+1,player:i===0,variant:i===0?0:1+((i-1)%7),x:0,z:0,vx:0,vz:0,face:1,ph:rnd(0,1),alive:true,state:'wander',speed:rnd(2.1,3.3),run:rnd(5.2,6.5),wait:0,tx:0,tz:0,slot:null,tgt:null,rd:0,dead:0,seat:null,mark:0};
    e.sprite=new THREE.Sprite(mats[e.variant][3]);e.sprite.scale.set(SW,SH,1);e.sprite.renderOrder=2;scene.add(e.sprite);
    e.shadow=new THREE.Mesh(shadowGeo,shadowMat);e.shadow.rotation.x=-Math.PI/2;e.shadow.position.y=.05;scene.add(e.shadow);
    e.tag=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTex(e.player?'YOU':String(e.id).padStart(3,'0'),e.player),transparent:true,depthWrite:false,fog:false}));
    e.tag.scale.set(e.player?1.25:1.05,.62,1);e.tag.renderOrder=3;scene.add(e.tag);
    if(e.player){e.arrow=new THREE.Sprite(new THREE.SpriteMaterial({map:arrowTex,transparent:true,depthWrite:false,fog:false}));e.arrow.scale.set(.8,.8,1);scene.add(e.arrow)}
    return e;
  }
  function pickTarget(e){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*(R-3.5);e.tx=Math.cos(a)*r;e.tz=Math.sin(a)*r}
  function scatter(){
    ents.forEach((e,i)=>{const a=rnd(0,6.283),r=Math.sqrt(Math.random())*(R-4);e.x=Math.cos(a)*r;e.z=Math.sin(a)*r;e.vx=e.vz=0;e.alive=true;e.dead=0;e.state='wander';e.slot=null;e.tgt=null;e.wait=rnd(0,1);
      e.sprite.visible=e.shadow.visible=e.tag.visible=true;if(e.arrow)e.arrow.visible=true;
      e.sprite.material=mats[e.variant][3];e.sprite.material.color&&e.sprite.material.color.set(0xffffff);e.sprite.material.opacity=1;e.sprite.material.rotation=0;pickTarget(e)});
  }

  /* ---------- group slots ---------- */
  const slotPool=[];
  function labelTex(){const c=document.createElement('canvas');c.width=256;c.height=128;const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
  for(let i=0;i<16;i++){
    const g=new THREE.Group(),dm=new THREE.MeshBasicMaterial({color:0xc8ff43,transparent:true,opacity:.16,blending:THREE.AdditiveBlending,depthWrite:false});
    const disc=new THREE.Mesh(new THREE.CircleGeometry(1,48),dm);disc.rotation.x=-Math.PI/2;disc.position.y=.06;g.add(disc);
    const rm=new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,3,.6),transparent:true,opacity:.95});
    const ring=new THREE.Mesh(new THREE.RingGeometry(.94,1,64),rm);ring.rotation.x=-Math.PI/2;ring.position.y=.09;g.add(ring);
    const bm=new THREE.MeshBasicMaterial({color:0xc8ff43,transparent:true,opacity:.1,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
    const beam=new THREE.Mesh(new THREE.CylinderGeometry(1,1,12,28,1,true),bm);beam.position.y=6;g.add(beam);
    const lt=labelTex(),label=new THREE.Sprite(new THREE.SpriteMaterial({map:lt,transparent:true,depthWrite:false,fog:false}));label.scale.set(3.4,1.7,1);label.position.y=4.2;label.renderOrder=4;g.add(label);
    g.visible=false;scene.add(g);slotPool.push({g,dm,rm,bm,disc,ring,beam,label,lt,members:[],x:0,z:0,r:2,rot:0,full:false,drawn:''});
  }
  function drawLabel(s){const k=s.members.length+'/'+N,key=k+s.full;if(s.drawn===key)return;s.drawn=key;const c=s.lt.image,x=c.getContext('2d');x.clearRect(0,0,256,128);
    x.fillStyle=s.full?'rgba(20,80,40,.92)':'rgba(6,16,10,.88)';x.beginPath();x.roundRect(20,18,216,92,28);x.fill();x.strokeStyle=s.full?'#5dff9a':'#d4ff3a';x.lineWidth=5;x.stroke();
    x.fillStyle=s.full?'#8bffb5':'#eaffb0';x.font='bold 62px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(s.full?'✓ '+k:k,128,66);s.lt.needsUpdate=true}
  const seatPos=(s,i)=>{const a=s.rot+i/N*Math.PI*2,r=N<=1?0:s.r*.52;return[s.x+Math.cos(a)*r,s.z+Math.sin(a)*r]};
  function placeSlots(){
    const sr=1.5+.24*N,out=[];
    for(let i=0;i<G;i++){let p=null;for(let k=0;k<90&&!p;k++){const a=rnd(0,6.283),rr=Math.sqrt(Math.random())*(R-sr-2.2),x=Math.cos(a)*rr,z=Math.sin(a)*rr;
        if(out.every(o=>Math.hypot(o.x-x,o.z-z)>sr*2+(k>60?.4:2.0)))p={x,z}}
      p=p||{x:rnd(-8,8),z:rnd(-8,8)};out.push(p)}
    slotPool.forEach((s,i)=>{if(i<G){s.x=out[i].x;s.z=out[i].z;s.r=sr;s.rot=rnd(0,6.28);s.members=[];s.full=false;s.drawn='';
      s.g.position.set(s.x,0,s.z);s.disc.scale.set(sr,sr,1);s.ring.scale.set(sr,sr,1);s.beam.scale.set(sr*.96,1,sr*.96);s.g.visible=true;drawLabel(s);s.active=true}else{s.g.visible=false;s.active=false}});
  }
  const activeSlots=()=>slotPool.filter(s=>s.active);

  /* ---------- particles ---------- */
  const MAXP=500,pPos=new Float32Array(MAXP*3),pCol=new Float32Array(MAXP*3),pVel=new Float32Array(MAXP*3),pLife=new Float32Array(MAXP),pMax=new Float32Array(MAXP),pBase=new Float32Array(MAXP*3);pPos.fill(-999);let pHead=0;
  const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  const pPts=new THREE.Points(pGeo,new THREE.PointsMaterial({size:.5,map:glowTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));pPts.frustumCulled=false;scene.add(pPts);
  function burst(x,y,z,n,color,sp=4,up=1){const c=new THREE.Color(color);for(let k=0;k<n;k++){const i=pHead;pHead=(pHead+1)%MAXP;const a=rnd(0,6.283),s=sp*rnd(.3,1);pPos.set([x,y,z],i*3);pVel.set([Math.cos(a)*s,rnd(.5,1.4)*sp*up,Math.sin(a)*s],i*3);pBase.set([c.r,c.g,c.b],i*3);pLife[i]=pMax[i]=rnd(.6,1.3)}}
  function updateParticles(dt){for(let i=0;i<MAXP;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;if(pLife[i]<=0){pPos[j+1]=-999;pCol[j]=pCol[j+1]=pCol[j+2]=0;continue}
    pVel[j+1]-=9*dt;pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f*2;pCol[j+1]=pBase[j+1]*f*2;pCol[j+2]=pBase[j+2]*f*2}
    pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}
  const ripples=[];
  function ripple(x,z,color){const m=new THREE.Mesh(new THREE.RingGeometry(.3,.4,40),new THREE.MeshBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:.9,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));m.rotation.x=-Math.PI/2;m.position.set(x,.12,z);scene.add(m);ripples.push({m,t:0})}

  /* ---------- audio ---------- */
  let actx=null;const music=new Audio(BASE+'Four_Seats_Total.mp3');music.loop=true;music.volume=.5;music.preload='auto';
  const ac=()=>actx??=new (window.AudioContext||window.webkitAudioContext)();
  function tone(f,d,type='sine',v=.06,f2){if(!soundOn)return;try{const a=ac(),o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,a.currentTime);if(f2)o.frequency.exponentialRampToValueAtTime(f2,a.currentTime+d);g.gain.setValueAtTime(v,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+d)}catch{}}
  function thud(){if(!soundOn)return;try{const a=ac(),n=Math.floor(a.sampleRate*.4),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2);const s=a.createBufferSource();s.buffer=b;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=700;const g=a.createGain();g.gain.value=.5;s.connect(f);f.connect(g);g.connect(a.destination);s.start();tone(140,.35,'sine',.12,40)}catch{}}
  const whistle=()=>{tone(1500,.18,'square',.05,1100);setTimeout(()=>tone(1200,.34,'square',.05,900),170)};
  const startMusic=()=>{if(soundOn)music.play().catch(()=>{});music.volume=.5};
  function stopMusic(){let v=music.volume;const iv=setInterval(()=>{v-=.1;if(v<=0){clearInterval(iv);music.pause();music.volume=.5}else music.volume=v},30)}
  function say(t){if(!soundOn||!('speechSynthesis' in window))return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=1.05;u.pitch=.9;speechSynthesis.speak(u)}catch{}}
  $('#mgSound').onclick=()=>{soundOn=!soundOn;$('#mgSound').textContent='SOUND: '+(soundOn?'ON':'OFF');if(!soundOn){music.pause();try{speechSynthesis.cancel()}catch{}}else if(phase==='music'||phase==='intro')startMusic()};

  /* ---------- HUD ---------- */
  const el={alive:$('#mgAlive'),round:$('#mgRound'),phase:$('#mgPhase'),tw:$('#mgTimerW'),tm:$('#mgTimer'),call:$('#mgCall'),num:$('#mgNum'),sub:$('#mgSub'),toast:$('#mgToast'),flash:$('#mgFlash'),feed:$('#mgFeed'),home:$('#mgHome'),card:$('#mgCard')};
  const hc={};
  function setText(k,node,v,cls){if(hc[k]!==v){hc[k]=v;node.textContent=v}if(cls!==undefined&&hc[k+'c']!==cls){hc[k+'c']=cls;node.className=cls}}
  let toastT=0;function toast(t,kind=''){el.toast.textContent=t;el.toast.className='mg-toast on '+kind;toastT=1.4}
  function feed(t){const d=document.createElement('div');d.textContent=t;el.feed.appendChild(d);setTimeout(()=>d.remove(),3400);while(el.feed.children.length>4)el.feed.firstChild.remove()}
  const aliveCount=()=>ents.filter(e=>e.alive).length;
  function stats(){$('#mgBest').textContent=best;$('#mgWins').textContent=wins}

  /* ---------- flow ---------- */
  function chooseN(A){
    const c=[];for(let n=2;n<=Math.min(9,A-1);n++){const L=A%n;if(L>0){const g=Math.floor(A/n);c.push([n,Math.pow(L,1.3)*(g>=2?1.4:1)])}}
    if(!c.length)return Math.max(2,Math.min(A-1,3));let sum=c.reduce((s,x)=>s+x[1],0),r=Math.random()*sum;for(const[n,w]of c){r-=w;if(r<=0)return n}return c[0][0];
  }
  function setPhase(p){phase=p;pt=0}
  function startRun(){
    root.classList.remove('mg-off');if(ac().state==='suspended')ac().resume();
    el.home.classList.add('hidden');el.card.classList.add('hidden');runActive=true;round=1;scatter();slotPool.forEach(s=>{s.g.visible=false;s.active=false});
    el.num.parentElement.classList.remove('show');startRound();
  }
  function startRound(){
    ents.forEach(e=>{if(e.alive){e.state='wander';e.slot=null;e.tgt=null;e.wait=rnd(0,.8);pickTarget(e);e.speed=rnd(2.1,3.3)}});
    slotPool.forEach(s=>{s.g.visible=false;s.active=false});
    musicLen=rnd(7,11)-Math.min(2,round*.12);setPhase('intro');toast('ROUND '+round+' · MOVE AROUND','good');startMusic();
  }
  function startCall(){
    const A=aliveCount();N=chooseN(A);G=Math.floor(A/N);T=clamp(6.5+N*1.0+G*.15,9,15)*(1-Math.min(.2,round*.015));earlyT=-1;callShown=0;
    placeSlots();stopMusic();whistle();thud();say('Groups of '+N);
    el.num.textContent=N;el.sub.textContent=A-G*N+' WILL BE ELIMINATED';el.call.classList.add('show');
    ents.forEach(e=>{if(!e.alive)return;e.state='react';e.rd=e.player?0:rnd(.3,1.25)*(1-Math.min(.35,round*.04));e.run=rnd(5.0,6.6)+round*.06;e.slot=null;e.tgt=null});
    setPhase('call');
  }
  function endCall(){
    const survivors=[],out=[];
    for(const e of ents){if(!e.alive)continue;(e.slot&&e.slot.members.includes(e)?survivors:out).push(e)}
    for(const e of out){e.alive=false;e.dead=.001;e.state='dead';e.sprite.material=e.sprite.material.clone();e.sprite.material.color.set(0xff5a5a);e.sprite.material.transparent=true;burst(e.x,1.2,e.z,26,0xff4d4f,5);ripple(e.x,e.z,0xff4d4f);if(!e.player)feed('#'+String(e.id).padStart(3,'0')+' ELIMINATED')}
    for(const e of survivors){burst(e.x,1.4,e.z,10,0x7bff3a,3);}
    if(out.length)thud();
    if(!player.alive){el.flash.style.opacity=1;setTimeout(()=>el.flash.style.opacity=0,600);feed('YOU WERE ELIMINATED')}
    activeSlots().forEach(s=>{s.dm.opacity=.1});
    el.call.classList.remove('show');setPhase('resolve');
  }
  function afterResolve(){
    if(!player.alive){runActive=false;best=Math.max(best,round-1);save('mingle-best',best);stats();return showCard('bad','ELIMINATED','You didn\'t make a group of '+N+' in round '+round+'.<br>You survived '+(round-1)+' round'+(round===2?'':'s')+'.','TRY AGAIN')}
    if(aliveCount()<=FINAL){runActive=false;wins++;best=Math.max(best,round);save('mingle-wins',wins);save('mingle-best',best);stats();ents.forEach(e=>e.alive&&burst(e.x,1.5,e.z,18,0xd4ff3a,6));return showCard('good','YOU SURVIVED','Only '+aliveCount()+' players left standing after '+round+' rounds. The Supercycle lives on.','PLAY AGAIN')}
    best=Math.max(best,round);save('mingle-best',best);round++;startRound();
  }
  function showCard(kind,h,p,btn){setPhase(kind==='good'?'win':'over');el.card.className='mg-card '+kind;el.card.innerHTML=`<div class="mg-eyebrow">${kind==='good'?'✳ &nbsp; SURVIVOR':'✕ &nbsp; RUN ENDED'}</div><h2>${h}</h2><p>${p}</p><div class="mg-cta" style="justify-content:center;margin:0"><button class="mg-play" id="mgAgain">${btn} &nbsp;↗</button><button class="mg-ghost" id="mgAll2">ALL GAMES</button></div>`;
    el.card.querySelector('#mgAgain').onclick=startRun;el.card.querySelector('#mgAll2').onclick=()=>api.onExit&&api.onExit()}
  function toHome(){runActive=false;el.card.classList.add('hidden');el.home.classList.remove('hidden');el.call.classList.remove('show');stats();music.pause();scatter();setPhase('home');slotPool.forEach(s=>{s.g.visible=false;s.active=false})}

  /* ---------- simulation ---------- */
  function steer(e,tx,tz,spd,dt,stop=.3){const dx=tx-e.x,dz=tz-e.z,d=Math.hypot(dx,dz);let vx=0,vz=0;if(d>stop){vx=dx/d*spd;vz=dz/d*spd}const k=1-Math.exp(-dt*9);e.vx+=(vx-e.vx)*k;e.vz+=(vz-e.vz)*k;return d}
  function chooseSlot(e){let best=null,bs=1e9;for(const s of activeSlots())if(s.members.length<N){const sc=Math.hypot(s.x-e.x,s.z-e.z)+rnd(0,4.5);if(sc<bs){bs=sc;best=s}}
    if(best){e.tgt=best;e.state='goto'}else{e.state='lost';pickTarget(e)}}
  function seat(e,s){s.members.push(e);e.slot=s;e.state='seated';if(s.members.length>=N){s.full=true;ripple(s.x,s.z,0x5dff9a);burst(s.x,1,s.z,18,0x5dff9a,4)}drawLabel(s);if(e.player){tone(660,.14,'triangle',.06);setTimeout(()=>tone(990,.2,'triangle',.05),90);toast(s.full?'GROUP LOCKED ✓':'SEAT TAKEN · WAIT FOR THE GROUP','good')}}
  function unseat(e){const s=e.slot;if(!s)return;const i=s.members.indexOf(e);if(i>=0)s.members.splice(i,1);s.full=s.members.length>=N;e.slot=null;drawLabel(s)}
  function botAI(e,dt){
    switch(e.state){
      case'wander':{if(e.wait>0){e.wait-=dt;steer(e,e.x,e.z,0,dt)}else{const d=steer(e,e.tx,e.tz,e.speed,dt,.5);if(d<.7){e.wait=Math.random()<.35?rnd(.3,1.3):0;pickTarget(e);if(Math.random()<.25)e.speed=rnd(1.8,3.5)}}break}
      case'react':{e.rd-=dt;const d=steer(e,e.tx,e.tz,e.speed*.6,dt,.5);if(d<.7)pickTarget(e);if(e.rd<=0)chooseSlot(e);break}
      case'goto':{const s=e.tgt;if(s.members.length>=N&&Math.hypot(s.x-e.x,s.z-e.z)>s.r*1.6){chooseSlot(e);break}
        const d=steer(e,s.x,s.z,e.run,dt,s.r*.4);if(d<s.r*.78){if(s.members.length<N)seat(e,s);else chooseSlot(e)}break}
      case'seated':{const s=e.slot,i=s.members.indexOf(e),[sx,sz]=seatPos(s,i),k=1-Math.exp(-dt*9);e.vx=(sx-e.x)*9;e.vz=(sz-e.z)*9;const sp=Math.hypot(e.vx,e.vz);if(sp>7){e.vx*=7/sp;e.vz*=7/sp}break}
      case'lost':{const d=steer(e,e.tx,e.tz,e.run*.75,dt,.8);if(d<1){const a=rnd(0,6.283),r=rnd(R*.3,R-3);e.tx=Math.cos(a)*r;e.tz=Math.sin(a)*r}
        if(phase==='call'&&Math.random()<dt*.8){for(const s of activeSlots())if(s.members.length<N){e.tgt=s;e.state='goto';break}}break}
    }
  }
  function playerInput(dt){
    let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
    ix+=joy.x;iz+=joy.z;const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m}
    const can=phase==='music'||phase==='call'||phase==='intro',sp=6.4,k=1-Math.exp(-dt*12);
    player.vx+=((can?ix*sp:0)-player.vx)*k;player.vz+=((can?iz*sp:0)-player.vz)*k;
  }
  function update(dt){
    pt+=dt;time+=dt;skyU.time.value=time;gu.time.value=time;
    if(toastT>0){toastT-=dt;if(toastT<=0)el.toast.classList.remove('on')}
    const attract=phase==='home'||phase==='boot';
    if(!attract&&player)playerInput(dt);
    for(const e of ents){
      if(!e.alive){if(e.dead>0){e.dead+=dt}continue}
      if(e.player&&!attract){ /* handled by input */ }else botAI(e,dt);
      if(phase==='resolve'||phase==='over'||phase==='win'){if(e.state!=='seated'){e.vx*=.9;e.vz*=.9}}
    }
    // phase logic
    if(phase==='intro'&&pt>2.0)setPhase('music');
    else if(phase==='music'&&pt>musicLen)startCall();
    else if(phase==='call'){
      const pl=player;
      if(pl.alive){
        if(!pl.slot){for(const s of activeSlots())if(s.members.length<N&&Math.hypot(pl.x-s.x,pl.z-s.z)<s.r*.8){seat(pl,s);break}}
        else if(Math.hypot(pl.x-pl.slot.x,pl.z-pl.slot.z)>pl.slot.r*1.05){unseat(pl);toast('LEFT THE GROUP','bad')}
      }
      // full group repulsion
      for(const s of activeSlots())if(s.members.length>=N)for(const e of ents){if(!e.alive||e.slot===s)continue;const dx=e.x-s.x,dz=e.z-s.z,d=Math.hypot(dx,dz);if(d<s.r+.3){const k=(s.r+.35)/Math.max(d,.01);e.x=s.x+dx*k;e.z=s.z+dz*k;if(e.player&&Math.random()<.05)toast('GROUP FULL','bad')}}
      const filled=activeSlots().reduce((n,s)=>n+s.members.length,0);
      if(earlyT<0&&filled>=G*N){earlyT=pt+1.1;toast('ALL GROUPS FORMED','good')}
      const left=Math.max(0,T-pt);if(left<=3&&Math.ceil(left)!==hc.tick&&left>0){hc.tick=Math.ceil(left);tone(880,.08,'square',.04)}
      if(callShown===0&&pt>1.9){callShown=1;el.call.classList.remove('show')}
      if(pt>=T||(earlyT>0&&pt>=earlyT))endCall();
    }
    else if(phase==='resolve'&&pt>2.6)afterResolve();
    // integrate + separation
    const live=ents.filter(e=>e.alive);
    for(let i=0;i<live.length;i++){const a=live[i];if(a.state==='seated'&&!a.player)continue;
      for(let j=i+1;j<live.length;j++){const b=live[j];if(b.state==='seated'&&!b.player)continue;const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;if(d2<.64&&d2>1e-4){const d=Math.sqrt(d2),o=(.8-d)*.5;a.x-=dx/d*o;a.z-=dz/d*o;b.x+=dx/d*o;b.z+=dz/d*o}}}
    for(const e of live){e.x+=e.vx*dt;e.z+=e.vz*dt;const d=Math.hypot(e.x,e.z);if(d>R-1.1){e.x*=(R-1.1)/d;e.z*=(R-1.1)/d}
      const sp=Math.hypot(e.vx,e.vz);if(e.vx>.3)e.face=1;else if(e.vx<-.3)e.face=-1;e.ph+=sp*dt*.34;e.moving=sp>.5}
    for(let i=ripples.length-1;i>=0;i--){const r=ripples[i];r.t+=dt;const s=1+r.t*9;r.m.scale.set(s,s,s);r.m.material.opacity=Math.max(0,.9*(1-r.t/.8));if(r.t>.8){scene.remove(r.m);r.m.geometry.dispose();r.m.material.dispose();ripples.splice(i,1)}}
    updateParticles(dt);
    // slots visuals
    for(const s of activeSlots()){const pulse=.5+.5*Math.sin(time*5+s.x);const open=!s.full&&phase==='call';
      s.dm.opacity=s.full?.28:open?.12+.12*pulse:.08;const col=s.full?0x5dff9a:0xc8ff43;s.dm.color.setHex(col);s.bm.color.setHex(col);s.bm.opacity=s.full?.16:.07+.06*pulse;s.rm.color.setRGB(s.full?.4:2.4,s.full?3:3,s.full?1.2:.6);
      s.label.position.y=4.2+Math.sin(time*2+s.z)*.15}
    beams.forEach((b,i)=>{b.rotation.z=Math.sin(time*.6+b.userData.ph)*.18;b.rotation.x=Math.cos(time*.5+b.userData.ph)*.18});
  }
  function render3(dt){
    for(const e of ents){
      const sp=e.sprite;
      if(!e.alive){
        if(e.dead>0){const k=Math.min(1,e.dead/1.2);sp.material.rotation=-k*1.4*e.face;sp.material.opacity=1-k;sp.position.set(e.x,SH/2-k*.9,e.z);e.shadow.position.set(e.x,.05,e.z);e.shadow.material===shadowMat;if(k>=1){sp.visible=e.shadow.visible=e.tag.visible=false}}
        continue}
      const moving=e.moving&&phase!=='resolve',cyc=e.ph%1;
      let f=3,hop=0;
      if(moving){f=Math.floor(cyc*4)%4;hop=Math.abs(Math.sin(cyc*Math.PI*2))*.32}
      else hop=Math.sin(time*3+e.id)*.02+.02;
      if(e.state==='seated'&&phase==='resolve')hop=Math.abs(Math.sin(pt*9+e.id))*.35;
      sp.material=mats[e.variant][(e.face>0?0:4)+f];
      sp.position.set(e.x,SH/2+hop,e.z);
      e.shadow.position.set(e.x,.05,e.z);e.shadow.scale.setScalar(1-hop*.6);
      e.tag.position.set(e.x,SH+.55+hop,e.z);
      if(e.arrow)e.arrow.position.set(e.x,SH+1.35+Math.sin(time*5)*.18,e.z);
    }
  }
  function camUpdate(dt){
    const p=player||{x:0,z:0};let px,py,pz,lx,ly,lz;
    if(phase==='home'||phase==='boot'){const a=time*.13;px=Math.sin(a)*36;py=19;pz=Math.cos(a)*36;lx=0;ly=1;lz=0}
    else if(phase==='call'){px=p.x*.45;py=31;pz=p.z*.45+21;lx=p.x*.45;ly=0;lz=p.z*.45}
    else{px=p.x*.75;py=19;pz=p.z*.75+19;lx=p.x*.75;ly=0;lz=p.z*.75-1}
    const k=1-Math.exp(-dt*3);camera.position.x+=(px-camera.position.x)*k;camera.position.y+=(py-camera.position.y)*k;camera.position.z+=(pz-camera.position.z)*k;
    cl.x+=(lx-cl.x)*k;cl.y+=(ly-cl.y)*k;cl.z+=(lz-cl.z)*k;camera.lookAt(cl);
  }
  const cl=new THREE.Vector3(0,0,0);camera.position.set(0,20,36);
  function hud(){
    setText('al',el.alive,String(aliveCount()));setText('rd',el.round,String(round));
    let t,cls='mg-phase';
    if(phase==='music'||phase==='intro')t='♪  MUSIC PLAYING · KEEP MOVING';
    else if(phase==='call'){t='FORM GROUPS OF '+N;cls+=' call'}
    else if(phase==='resolve'){t=player&&!player.alive?'YOU ARE OUT':'ROUND CLEARED';cls+=player&&!player.alive?' bad':' call'}
    else if(phase==='over'){t='ELIMINATED';cls+=' bad'}else if(phase==='win'){t='SURVIVED';cls+=' call'}else t='MINGLE';
    setText('ph',el.phase,t,cls);
    const on=phase==='call';if(hc.tw!==on){hc.tw=on;el.tw.classList.toggle('on',on)}
    if(on){const f=clamp(1-pt/T,0,1);el.tm.style.transform='scaleX('+f.toFixed(3)+')';const low=f<.3;if(hc.low!==low){hc.low=low;el.tw.classList.toggle('low',low)}}
  }
  function frame(now){
    raf=requestAnimationFrame(frame);
    const nt=now||performance.now(),dt=Math.min((nt-last)/1000,.05);last=nt;
    if(!ents.length)return;
    update(dt);render3(dt);camUpdate(dt);hud();
    if(Math.abs(camera.fov-baseFov)>.02){camera.fov=baseFov;camera.updateProjectionMatrix()}
    composer.render();
    perf.acc+=(nt-perf.last)/1000;perf.last=nt;perf.n++;
    if(perf.acc>2.5){const fps=perf.n/perf.acc;perf.acc=0;perf.n=0;if(fps<42&&pr>1){pr=Math.max(1,pr-.25);renderer.setPixelRatio(pr);composer.setPixelRatio(pr);resize()}else if(fps<26&&bloom.enabled)bloom.enabled=false}
  }
  const perf={acc:0,n:0,last:performance.now()};

  /* ---------- input ---------- */
  const kd=e=>{if(!visible)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)){keys.add(k);e.preventDefault();e.stopImmediatePropagation()}
    if(k==='escape'&&phase!=='home'){toHome();e.stopImmediatePropagation()}else if((k==='enter'||k===' ')&&phase==='home'){startRun();}};
  addEventListener('keydown',kd,true);addEventListener('keyup',e=>{if(!visible)return;keys.delete(e.key.toLowerCase())},true);addEventListener('blur',()=>keys.clear());
  const joyEl=$('#mgJoy'),knob=joyEl.firstElementChild;let jid=null;
  const jset=e=>{const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}joy.x=dx;joy.z=dy;knob.style.transform=`translate(${dx*38}px,${dy*38}px)`};
  joyEl.addEventListener('pointerdown',e=>{jid=e.pointerId;joyEl.setPointerCapture(jid);jset(e);e.preventDefault()});
  joyEl.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
  for(const ev of['pointerup','pointercancel'])joyEl.addEventListener(ev,()=>{jid=null;joy.x=joy.z=0;knob.style.transform=''});
  $('#mgPlay').onclick=startRun;$('#mgHow').onclick=()=>$('#mgHowBox').classList.toggle('open');
  $('#mgAll').onclick=$('#mgBack').onclick=()=>api.onExit&&api.onExit();$('#mgHomeBtn').onclick=toHome;

  /* ---------- public ---------- */
  api.show=async()=>{
    root.classList.remove('mg-off');visible=true;resize();
    if(!ready)ready=loadSprites().then(()=>{ents=[...Array(PLAYERS)].map((_,i)=>makeEntity(i));player=ents[0];scatter();setPhase('home');stats()}).catch(err=>{console.warn('Mingle sprites failed',err);ready=null});
    await ready;toHome();last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
  };
  api.hide=()=>{visible=false;cancelAnimationFrame(raf);root.classList.add('mg-off');music.pause();try{speechSynthesis.cancel()}catch{}keys.clear()};
  return api;
}

let inst=null;
export function open(onExit){if(!inst)inst=create();inst.onExit=onExit;return inst.show()}
export function close(){if(inst)inst.hide()}
