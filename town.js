import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {createBenz} from './benz.js';
import {createUrus} from './urus.js';
import {dress} from './townscape.js';
import {makeFolk} from './townfolk.js';
import {makeGuards} from './townguard.js';

/* ===================== SUPER TOWN =====================
   A small open-world community on a floating island: fly (or hover-walk) as the flyer, meet bot residents,
   watch cars, planes and the Supercycle blimp go by, chat, and step into the Arcade / Ship Dock / HQ / Exchange. */

if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,h){this.rect(x,y,w,h)};
const BASE=new URL('.',import.meta.url).href;
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,pick=a=>a[Math.floor(Math.random()*a.length)];
const V3=THREE.Vector3,ISL=115,ROADS=[-36,0,36],RW=9;
const DEX_URL='https://dexscreener.com/avalanche/0x017c5608a8ab29ab23093726cf7c64e5ef88e191';

const NAMES=['nova','kairo','juno','zed','mika','bolt','ryn','astra','pixel','echo','sable','orbit','tidal','lumen','vex','onyx','fable','glitch','mango','sprout','quill','drift','ember','haze','ion','jett','koda','lyra','mochi','nyx','pip','rook','sol','tux','umbra','wren','yuki','zeta','blip','cosmo'];
const LINES=['gm gm','$SUPER to the moon','anyone up for mingle?','just beat the Eye World','this town is so clean','who wants to race to the dock','the glass bridge got me again','real ones fly','nice cape','wagmi','new community art is fire','gn frens','hop in the arcade','watch the blimp!','red light... green light!','supercycle (real)','cars are so fast here','buying the dip, flying the dip','love this place','meet at the fountain'];
const REPLIES=['gm!','hey hey','haha same','lets gooo','real','facts','ayy welcome','fr fr','see you at the fountain','send it','wagmi frens','lol nice'];

const CSS=`
.tw{position:fixed;inset:0;z-index:12;background:#030804;color:#eaf6ec;font-family:'Space Grotesk',system-ui,sans-serif;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.tw.tw-off{display:none}.tw *{box-sizing:border-box}
.tw-stage{position:absolute;inset:0}.tw-stage canvas{display:block;width:100%;height:100%;cursor:grab}.tw-stage canvas:active{cursor:grabbing}
.tw-top{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:flex-start;padding:14px clamp(12px,3vw,34px);z-index:3;pointer-events:none;gap:10px}
.tw-brand{display:flex;align-items:center;gap:12px;padding:8px 16px 8px 8px;border-radius:18px;border:1px solid rgba(190,255,90,.16);background:linear-gradient(145deg,rgba(16,38,21,.8),rgba(5,12,7,.88));backdrop-filter:blur(14px);font-weight:700;letter-spacing:.2em;font-size:13px}
.tw-brand img{width:44px;height:44px;border-radius:12px;object-fit:cover}.tw-brand small{display:block;font:9px 'DM Mono',monospace;letter-spacing:.22em;color:#9bb7a0;margin-top:3px}
.tw-mini{pointer-events:auto;border-radius:18px;border:1px solid rgba(190,255,90,.2);background:rgba(5,12,7,.82);backdrop-filter:blur(12px);padding:6px}
.tw-mini canvas{display:block;border-radius:12px}.tw-mini small{display:block;text-align:center;font:8px 'DM Mono',monospace;letter-spacing:.2em;color:#8aa690;margin-top:4px}
.tw-chat{position:absolute;left:clamp(12px,3vw,34px);bottom:64px;width:min(86vw,340px);z-index:4;display:flex;flex-direction:column;gap:5px}
.tw-log{display:flex;flex-direction:column;gap:4px;pointer-events:none}.tw-log div{font-size:12px;padding:6px 10px;border-radius:10px;background:rgba(5,12,7,.72);border-left:3px solid #7ddc1f;animation:twf 9s forwards;line-height:1.35}.tw-log b{color:#d4ff3a}
.tw-log div.me{border-left-color:#4dd2ff}.tw-log div.sys{border-left-color:#ffc83d;color:#ffe08a}
@keyframes twf{0%{opacity:0;transform:translateY(6px)}5%{opacity:1;transform:none}85%{opacity:1}100%{opacity:0}}
.tw-chat input{width:100%;padding:11px 14px;border-radius:12px;border:1px solid rgba(190,255,90,.25);background:rgba(5,12,7,.88);color:#eaf6ec;font:600 13px 'Space Grotesk';outline:none;backdrop-filter:blur(10px)}.tw-chat input:focus{border-color:#d4ff3a;box-shadow:0 0 22px rgba(125,220,31,.3)}
.tw-bar{position:absolute;right:clamp(12px,3vw,34px);bottom:16px;display:flex;gap:8px;z-index:5;flex-wrap:wrap;justify-content:flex-end}
.tw-bar button,.tw-menu button.g{font:700 10px 'Space Grotesk';letter-spacing:.14em;padding:11px 14px;border-radius:12px;border:1px solid rgba(185,255,90,.25);background:rgba(11,22,14,.85);color:#d6e9d9;cursor:pointer;backdrop-filter:blur(10px)}
.tw-bar button:hover,.tw-menu button.g:hover{border-color:#d4ff3a;color:#d4ff3a}.tw-bar .em{padding:10px 12px;font-size:15px}
.tw-hint{position:absolute;left:50%;top:84px;transform:translateX(-50%);font:9px 'DM Mono',monospace;letter-spacing:.2em;color:#8aa690;z-index:2;pointer-events:none;text-align:center;line-height:1.9;white-space:nowrap}
.tw-hint b{display:inline-block;padding:3px 7px;border-radius:6px;border:1px solid rgba(185,255,90,.25);background:#0e1d12;color:#eef9ea;margin:0 3px}
.tw-prompt{position:absolute;left:50%;bottom:130px;transform:translateX(-50%);padding:11px 20px;border-radius:14px;background:rgba(7,17,10,.92);border:1px solid #d4ff3a;color:#e9ffb0;font:700 12px 'Space Grotesk';letter-spacing:.14em;opacity:0;pointer-events:none;z-index:6;transition:opacity .15s;white-space:nowrap;box-shadow:0 0 30px rgba(125,220,31,.3)}.tw-prompt.on{opacity:1;pointer-events:auto;cursor:pointer}
.tw-toast{position:absolute;left:50%;bottom:190px;transform:translateX(-50%);padding:9px 18px;border-radius:999px;background:rgba(7,17,10,.9);border:1px solid rgba(190,255,90,.3);font:700 11px 'Space Grotesk';letter-spacing:.16em;opacity:0;transition:opacity .25s;pointer-events:none;z-index:6;color:#d4ff3a;white-space:nowrap}.tw-toast.on{opacity:1}
.tw-flash{position:absolute;inset:0;background:radial-gradient(circle,#eaffc0,#7ddc1f 60%,#041006);opacity:0;pointer-events:none;z-index:9;transition:opacity .35s}
.tw-elev{position:absolute;right:16px;top:50%;transform:translateY(-50%);display:none;flex-direction:column;gap:8px;z-index:6;padding:12px;border-radius:16px;border:1px solid rgba(190,255,90,.3);background:rgba(5,12,7,.9);backdrop-filter:blur(12px)}.tw-elev.on{display:flex}
.tw-elev span{font:9px 'DM Mono',monospace;letter-spacing:.26em;color:#8fa896;text-align:center}.tw-elev button{font:700 10px 'Space Grotesk';letter-spacing:.12em;padding:11px 14px;border-radius:10px;border:1px solid rgba(185,255,90,.25);background:rgba(11,22,14,.9);color:#d6e9d9;cursor:pointer;text-align:left}.tw-elev button.on,.tw-elev button:hover{border-color:#d4ff3a;color:#d4ff3a;background:rgba(212,255,58,.1)}
.tw-menu{position:absolute;inset:0;z-index:8;background:rgba(2,8,4,.82);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:20px}.tw-menu.on{display:flex}
.tw-menu>div{width:min(94vw,760px);padding:26px;border-radius:24px;border:1px solid rgba(212,255,58,.25);background:linear-gradient(145deg,rgba(18,42,24,.96),rgba(5,11,7,.97));box-shadow:0 35px 110px #000b}
.tw-menu h2{margin:0 0 4px;font-size:30px;letter-spacing:-.04em}.tw-menu p{margin:0 0 16px;color:#a9bdad;font-size:13px}
.tw-games{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:14px}
.tw-games button{position:relative;padding:0;border-radius:16px;border:1px solid rgba(190,255,90,.2);background:#06100a;overflow:hidden;cursor:pointer;color:#eaf6ec;font:700 11px 'Space Grotesk';letter-spacing:.12em;text-align:left;transition:.2s}
.tw-games button:hover{border-color:#d4ff3a;transform:translateY(-3px);box-shadow:0 12px 40px rgba(125,220,31,.25)}.tw-games img{display:block;width:100%;aspect-ratio:16/10;object-fit:cover}.tw-games span{display:block;padding:10px 12px}
.tw-joy{position:absolute;left:22px;bottom:70px;width:126px;height:126px;border-radius:50%;border:1px solid rgba(190,255,90,.28);background:radial-gradient(rgba(125,220,31,.1),rgba(5,12,7,.4));display:none;z-index:5;touch-action:none}
.tw-joy i{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px;border-radius:50%;background:linear-gradient(#e6ff58,#7ddc1f);box-shadow:0 0 24px rgba(125,220,31,.6)}
.tw-fly{position:absolute;right:16px;bottom:130px;display:none;flex-direction:column;gap:10px;z-index:5}.tw-fly button{width:62px;height:62px;border-radius:50%;border:1px solid rgba(185,255,90,.35);background:rgba(11,22,14,.88);color:#d4ff3a;font:800 18px 'Space Grotesk'}
@media(pointer:coarse){.tw-joy,.tw-fly{display:block}.tw-fly{display:flex}.tw-hint{display:none}.tw-chat{bottom:210px}}
@media(max-width:650px){.tw-brand{font-size:11px}.tw-brand img{width:36px;height:36px}}
`;
const HTML=`
<div class="tw-stage"></div>
<div class="tw-top"><div class="tw-brand"><img src="${BASE}assets/lobby/supercycle-logo-sm.png" alt=""><div>SUPER TOWN<small id="twPop">OPEN WORLD · COMMUNITY</small></div></div><div class="tw-mini"><canvas id="twMap" width="150" height="150"></canvas><small>MAP</small></div></div>
<div class="tw-hint"><b>WASD</b> WALK · <b>SHIFT</b> RUN · <b>SPACE</b> JUMP / UP · <b>V</b> FLY · <b>F</b> INTERACT / DRIVE · <b>R</b> PAINT · <b>1 2 3</b> ELEVATOR · <b>Q E</b> CAMERA · <b>ENTER</b> CHAT</div>
<div class="tw-chat"><div class="tw-log" id="twLog"></div><input id="twIn" maxlength="80" placeholder="Press Enter to chat…" autocomplete="off"></div>
<div class="tw-elev" id="twElev"><span>ELEVATOR</span><button data-f="2">3 · CINEMA & BAR</button><button data-f="1">2 · BEDROOM & STUDY</button><button data-f="0">G · LOUNGE & KITCHEN</button></div><div class="tw-prompt" id="twPrompt"></div><div class="tw-toast" id="twToast"></div>
<div class="tw-joy" id="twJoy"><i></i></div><div class="tw-fly"><button id="twUp">▲</button><button id="twDn">▼</button></div>
<div class="tw-bar"><button class="em" data-em="👋">👋</button><button class="em" data-em="🕺">🕺</button><button class="em" data-em="❤️">❤️</button><button class="em" data-em="🚀">🚀</button><button id="twFly">FLY: OFF</button><button id="twHome">🏠 HOME</button><button id="twBoost">RUN/BOOST</button><button id="twAll">◂ ALL GAMES</button><button id="twSound">SOUND: ON</button></div>
<div class="tw-menu" id="twMenu"><div><h2>SUPER ARCADE</h2><p>Pick a game. You'll come back to town when you leave it.</p><div class="tw-games" id="twGames"></div><button class="g" id="twClose">CLOSE</button></div></div>
<div class="tw-flash" id="twFlash"></div>`;

function create(){
  const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
  const root=document.createElement('section');root.id='tw';root.className='tw tw-off';root.innerHTML=HTML;document.body.appendChild(root);
  const $=s=>root.querySelector(s);
  const api={onExit:null,onPortal:null};
  let visible=false,raf=0,last=0,time=0,soundOn=true,typing=false,guards=null;

  /* ---------- renderer ---------- */
  const stage=$('.tw-stage');
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  let pr=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pr);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;renderer.sortObjects=true;
  stage.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x07140c,.0042);
  const camera=new THREE.PerspectiveCamera(58,1,.3,1800);
  const composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(4,4,{type:THREE.HalfFloatType,samples:2}));
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.5,.6,1.0);composer.addPass(bloom);
  const U={time:{value:0}};
  const grade=new ShaderPass({uniforms:{tDiffuse:{value:null},time:{value:0},ca:{value:.001},vig:{value:.5}},
    vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tDiffuse;uniform float time,ca,vig;varying vec2 vUv;void main(){vec2 c=vUv-.5;float d=dot(c,c);vec2 off=c*ca*(.5+d*4.);
      vec3 col=vec3(texture2D(tDiffuse,vUv+off).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-off).b);col*=1.-vig*smoothstep(.1,.55,d*2.);
      col+=(fract(sin(dot(vUv*(time+1.),vec2(12.9898,78.233)))*43758.5453)-.5)*.016;gl_FragColor=vec4(col,1.);}`});
  composer.addPass(grade);composer.addPass(new OutputPass());
  let baseFov=58;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);composer.setSize(w,h);camera.aspect=w/h;baseFov=w/h<.8?72:58;camera.fov=baseFov;camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(stage);

  /* ---------- helpers ---------- */
  const radialTex=(stops,size=128)=>{const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');const g=x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);stops.forEach(([o,col])=>g.addColorStop(o,col));x.fillStyle=g;x.fillRect(0,0,size,size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
  const glowTex=radialTex([[0,'rgba(255,255,255,1)'],[.25,'rgba(255,255,255,.55)'],[1,'rgba(255,255,255,0)']]);
  const tl=new THREE.TextureLoader();
  const loadTex=(u,cb)=>tl.load(BASE+u,t=>{t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;cb&&cb(t)});
  const labelSprite=(text,{w=4,size=60,color='#e9ffb0',glow='#c8ff43',plate=false}={})=>{const c=document.createElement('canvas');c.width=512;c.height=112;const x=c.getContext('2d');x.textAlign='center';x.textBaseline='middle';
    if(plate){x.fillStyle='rgba(5,12,7,.78)';x.beginPath();x.roundRect(30,12,452,88,26);x.fill()}x.shadowColor=glow;x.shadowBlur=plate?8:20;x.fillStyle=color;let fs=size;x.font='800 '+fs+'px sans-serif';const mw=plate?420:470;while(x.measureText(text).width>mw&&fs>18){fs-=2;x.font='800 '+fs+'px sans-serif'}x.fillText(text,256,58);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false,blending:plate?THREE.NormalBlending:THREE.AdditiveBlending}));s.scale.set(w,w*112/512,1);return s};
  function bubble(text){const c=document.createElement('canvas');c.width=512;c.height=128;const x=c.getContext('2d');x.font='700 40px sans-serif';const tw=Math.min(480,x.measureText(text).width+56);
    x.fillStyle='rgba(8,20,12,.92)';x.strokeStyle='#d4ff3a';x.lineWidth=4;x.beginPath();x.roundRect((512-tw)/2,10,tw,84,30);x.fill();x.stroke();x.beginPath();x.moveTo(236,94);x.lineTo(256,120);x.lineTo(276,94);x.fill();
    x.fillStyle='#f2ffe0';x.textAlign='center';x.textBaseline='middle';x.fillText(text.length>26?text.slice(0,25)+'…':text,256,52);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false,fog:false}));s.scale.set(5,1.25,1);s.renderOrder=9;return s}
  const metalM=new THREE.MeshStandardMaterial({color:0x17261c,roughness:.35,metalness:.85});
  const limeM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,3,.5)}),redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.4,.45)}),greenM=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.6,.8)}),cyanM=new THREE.MeshBasicMaterial({color:new THREE.Color(.35,1.6,3.2)});

  /* ---------- sky, stars, moon, void under the island ---------- */
  const skyMat=new THREE.ShaderMaterial({uniforms:U,side:THREE.BackSide,depthWrite:false,fog:false,vertexShader:`varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vP;uniform float time;void main(){float h=vP.y;vec3 hor=vec3(.03,.11,.07),mid=vec3(.008,.04,.035),top=vec3(.002,.01,.012),low=vec3(.01,.025,.02);
      vec3 c=mix(hor,mid,smoothstep(0.,.4,h));c=mix(c,top,smoothstep(.35,1.,h));c=mix(c,low,smoothstep(0.,-.3,h));
      float a=smoothstep(.08,.4,h)*(1.-smoothstep(.5,.85,h));float w=.5+.5*sin(vP.x*7.+time*.2+sin(vP.z*5.+time*.12)*2.);c+=vec3(.05,.45,.2)*a*w*.4+vec3(.4,.05,.08)*a*(1.-w)*.14;gl_FragColor=vec4(c,1.);}`});
  const sky=new THREE.Mesh(new THREE.SphereGeometry(1500,32,16),skyMat);sky.renderOrder=-10;scene.add(sky);
  {const n=2600,p=new Float32Array(n*3),c=new Float32Array(n*3);for(let i=0;i<n;i++){const th=Math.random()*6.283,y=Math.random()*1.4-.4,s=Math.sqrt(Math.max(0,1-y*y)),r=1400;p.set([Math.cos(th)*s*r,y*r,Math.sin(th)*s*r],i*3);const k=rnd(.5,1);c.set([k,k,k],i*3)}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(c,3));scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.7,sizeAttenuation:false,vertexColors:true,fog:false,transparent:true,opacity:.9,depthWrite:false})))}
  {const m=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTex([[0,'rgba(235,255,240,1)'],[.12,'rgba(210,255,225,1)'],[.16,'rgba(150,255,200,.35)'],[.5,'rgba(90,255,150,.08)'],[1,'rgba(90,255,150,0)']],256),fog:false,depthWrite:false,blending:THREE.AdditiveBlending}));m.scale.set(420,420,1);m.position.set(-500,420,-900);scene.add(m)}
  const abyss=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.ShaderMaterial({uniforms:U,vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float time;void main(){vec2 p=vec2(vW.x,vW.z+time*2.)/6.;vec2 g=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(g.x,g.y),1.);float d=length(vW.xz);vec3 col=vec3(.004,.02,.012)+vec3(.45,1.,.2)*line*(.12+.3*sin(d*.05-time))*exp(-d*.0028);col+=vec3(.02,.3,.1)*exp(-d*.006)*.5;gl_FragColor=vec4(col,1.);}`}));abyss.rotation.x=-Math.PI/2;abyss.position.y=-120;scene.add(abyss);
  const rockM=new THREE.MeshStandardMaterial({color:0x0d1a12,roughness:.95,flatShading:true});
  {const n=110,im=new THREE.InstancedMesh(new THREE.CylinderGeometry(.55,1.2,1,6,1),rockM,n),d=new THREE.Object3D();for(let i=0;i<n;i++){const a=rnd(0,6.283),r=rnd(190,520),top=rnd(-100,40),h=top+130,w=rnd(8,22);d.position.set(Math.cos(a)*r,top-h/2,Math.sin(a)*r);d.scale.set(w,h,w);d.updateMatrix();im.setMatrixAt(i,d.matrix)}scene.add(im)}
  {const cm=[new THREE.MeshBasicMaterial({color:new THREE.Color(.8,2.8,.4)}),redM];for(let i=0;i<60;i++){const c=new THREE.Mesh(new THREE.OctahedronGeometry(1),cm[i%2]),a=rnd(0,6.283),r=rnd(150,420);c.scale.set(rnd(.8,2),rnd(4,12),rnd(.8,2));c.position.set(Math.cos(a)*r,rnd(-80,10),Math.sin(a)*r);c.rotation.set(rnd(-.3,.3),Math.random()*6,rnd(-.3,.3));scene.add(c)}}
  scene.add(new THREE.HemisphereLight(0x7fd08f,0x08120c,1.0));
  const moonL=new THREE.DirectionalLight(0xa6e8b8,1.9);moonL.position.set(-60,120,50);scene.add(moonL);

  /* ---------- the island: ground, roads, roundabout ---------- */
  {const g=new THREE.Mesh(new THREE.CircleGeometry(ISL,96),new THREE.ShaderMaterial({uniforms:U,vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
     fragmentShader:`varying vec3 vW;uniform float time;void main(){vec2 p=vW.xz/3.;vec2 gr=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(gr.x,gr.y),1.);float d=length(vW.xz);vec3 col=vec3(.012,.04,.024)+vec3(.3,.9,.2)*line*.07*(.6+.4*sin(d*.1-time*1.4));col+=vec3(.5,1.,.3)*smoothstep(104.,115.,d)*.35;
      if(abs(vW.x+67.)<6.2&&abs(vW.z-18.)<9.2)discard;gl_FragColor=vec4(col,1.);}`}));g.rotation.x=-Math.PI/2;scene.add(g);
   const sk=new THREE.Mesh(new THREE.CylinderGeometry(ISL,ISL*.45,34,64,1,true),new THREE.MeshStandardMaterial({color:0x0f1e16,roughness:.5,metalness:.8,side:THREE.DoubleSide}));sk.position.y=-17;scene.add(sk);
   const rim=new THREE.Mesh(new THREE.TorusGeometry(ISL,.5,8,160),limeM);rim.rotation.x=Math.PI/2;rim.position.y=.1;scene.add(rim);const rim2=new THREE.Mesh(new THREE.TorusGeometry(ISL-1.4,.2,8,160),redM);rim2.rotation.x=Math.PI/2;rim2.position.y=.1;scene.add(rim2);
   const eng=new THREE.Mesh(new THREE.ConeGeometry(30,26,24,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.2,.9),transparent:true,opacity:.18,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));eng.position.y=-48;eng.rotation.x=Math.PI;scene.add(eng)}
  const roadM=new THREE.MeshStandardMaterial({color:0x0b1410,roughness:.55,metalness:.4});
  for(const c of ROADS){const a=new THREE.Mesh(new THREE.BoxGeometry(ISL*1.88,.06,RW),roadM);a.position.set(0,.03,c);scene.add(a);const b=new THREE.Mesh(new THREE.BoxGeometry(RW,.06,ISL*1.88),roadM);b.position.set(c,.03,0);scene.add(b)}
  {const dg=new THREE.BoxGeometry(2.4,.02,.2),n=ROADS.length*2*34,im=new THREE.InstancedMesh(dg,new THREE.MeshBasicMaterial({color:new THREE.Color(1.2,1.6,.6)}),n),d=new THREE.Object3D();let k=0;
   for(const c of ROADS)for(let i=0;i<34;i++){const t=-ISL*.92+i*(ISL*1.84/34)+1;d.position.set(t,.07,c);d.rotation.y=0;d.updateMatrix();im.setMatrixAt(k++,d.matrix);d.position.set(c,.07,t);d.rotation.y=Math.PI/2;d.updateMatrix();im.setMatrixAt(k++,d.matrix)}
   im.count=k;scene.add(im);
   const eg=new THREE.BoxGeometry(ISL*1.88,.05,.14),ei=new THREE.InstancedMesh(eg,new THREE.MeshBasicMaterial({color:new THREE.Color(.5,1.6,.3)}),ROADS.length*4);let e=0;
   for(const c of ROADS)for(const s of[-1,1]){d.rotation.y=0;d.position.set(0,.07,c+s*RW/2);d.updateMatrix();ei.setMatrixAt(e++,d.matrix);d.rotation.y=Math.PI/2;d.position.set(c+s*RW/2,.07,0);d.updateMatrix();ei.setMatrixAt(e++,d.matrix)}scene.add(ei)}
  // roundabout + fountain + holo statue at the centre
  const plaza=new THREE.Group();scene.add(plaza);
  {const isl=new THREE.Mesh(new THREE.CylinderGeometry(6.4,6.8,.5,48),new THREE.MeshStandardMaterial({color:0x12261a,roughness:.4,metalness:.6}));isl.position.y=.25;plaza.add(isl);
   const rr=new THREE.Mesh(new THREE.TorusGeometry(6.6,.12,8,64),limeM);rr.rotation.x=Math.PI/2;rr.position.y=.5;plaza.add(rr);const rr2=new THREE.Mesh(new THREE.TorusGeometry(9.4,.1,8,80),redM);rr2.rotation.x=Math.PI/2;rr2.position.y=.1;plaza.add(rr2);
   for(const [r,h,y] of[[3.2,.7,.85],[2.2,.7,1.55],[1.1,1.4,2.45]]){const t=new THREE.Mesh(new THREE.CylinderGeometry(r,r*1.1,h,32),metalM);t.position.y=y;plaza.add(t);const w=new THREE.Mesh(new THREE.CircleGeometry(r*.92,32),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,1.8,1)}));w.rotation.x=-Math.PI/2;w.position.y=y+h/2+.01;plaza.add(w)}}
  const statue=new THREE.Group();statue.position.set(0,8.5,0);plaza.add(statue);
  const statMat=new THREE.MeshBasicMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.95,color:0xbfffd0});
  loadTex('assets/lobby/supercycle-logo.webp',t=>{statMat.map=t;statMat.needsUpdate=true});
  statue.add(new THREE.Mesh(new THREE.PlaneGeometry(6,6),statMat));
  {const r=new THREE.Mesh(new THREE.TorusGeometry(3.7,.07,8,64),limeM);statue.add(r);const l=labelSprite('SUPER TOWN',{w:7,size:70});l.position.y=4.6;statue.add(l)}

  /* ---------- buildings ---------- */
  function winTex(cols,seed){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#0a1310';x.fillRect(0,0,128,128);
    for(let j=0;j<4;j++)for(let i=0;i<4;i++){const r=Math.sin((i*13+j*7+seed*31)*12.9898)*43758.5453,f=r-Math.floor(r);if(f<.62){x.fillStyle=cols[Math.floor(f*100)%cols.length];x.globalAlpha=.55+f*.45;x.fillRect(i*32+7,j*32+7,18,16);x.globalAlpha=1}}
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
  const TEXS=[winTex(['#c8ff43','#e9ffb0','#7bff3a'],1),winTex(['#ffd98a','#fff1c4','#ffb85c'],2),winTex(['#8affc0','#bfffe6','#4dd2ff'],3),winTex(['#ff8d94','#ffc7ca','#e9ffb0'],4)];
  const BMAT=TEXS.map(t=>new THREE.MeshStandardMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.85,roughness:.55,metalness:.25}));
  const B=[];const specials={};const roofM=new THREE.MeshStandardMaterial({color:0x0e1a14,roughness:.5,metalness:.7});
  function building(x,z,w,d,h,tex=0,name=null){
    const geo=new THREE.BoxGeometry(w,h,d),uv=geo.attributes.uv,sf=(f,su,sv)=>{for(let i=f*4;i<f*4+4;i++)uv.setXY(i,uv.getX(i)*su,uv.getY(i)*sv)};
    sf(0,d/8,h/8);sf(1,d/8,h/8);sf(4,w/8,h/8);sf(5,w/8,h/8);for(const f of[2,3])for(let i=f*4;i<f*4+4;i++)uv.setXY(i,.02,.02);
    const m=new THREE.Mesh(geo,[BMAT[tex%4],BMAT[tex%4],roofM,roofM,BMAT[tex%4],BMAT[tex%4]]);m.position.set(x,h/2,z);scene.add(m);B.push({x,z,hw:w/2,hd:d/2,h,name,mesh:m});
    const rf=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.35,d+.4),metalM);rf.position.set(x,h+.17,z);scene.add(rf);const em=(x+z)%2>0?limeM:redM;for(const sz of[-1,1]){const e1=new THREE.Mesh(new THREE.BoxGeometry(w+.5,.14,.14),em);e1.position.set(x,h+.42,z+sz*(d/2+.2));scene.add(e1);const e2=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,d+.5),em);e2.position.set(x+sz*(w/2+.2),h+.42,z);scene.add(e2)}
    if(h>20){const a=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,6,6),metalM);a.position.set(x,h+3.3,z);scene.add(a);const bl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff3a3a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));bl.scale.set(2.4,2.4,1);bl.position.set(x,h+6.4,z);scene.add(bl);blinkers.push(bl)}
    return m}
  const blinkers=[];
  function block(cx,cz,fn){fn(cx,cz)}
  const rng=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}})();
  // generic blocks
  for(const [cx,cz] of[[-54,-18],[-54,18],[54,-18],[54,18],[-18,-54],[18,-54],[-18,54],[18,54]]){
    if(cx===-54&&cz===18)continue; // the Super Home lives here
    if(cx===54&&cz===18)continue; // dedicated Super Office tower
    const two=rng()<.55;if(two){const w1=rng()*6+10,w2=rng()*6+10,h1=rng()*20+8,h2=rng()*22+8;building(cx-7,cz+(rng()-.5)*6,w1,18+rng()*4,h1,Math.floor(rng()*4));building(cx+8,cz+(rng()-.5)*6,w2,16+rng()*4,h2,Math.floor(rng()*4))}
    else building(cx,cz,rng()*8+16,rng()*6+17,rng()*26+10,Math.floor(rng()*4))}
  // SUPER OFFICE · 10 storeys · CEO crown · rooftop helipad
  const OFF={x:54,z:18,w:24,d:22,h:66,fh:6.6};building(OFF.x,OFF.z,OFF.w,OFF.d,OFF.h,2,'office');
  for(let f=0;f<10;f++){const y=f*OFF.fh+.25;const band=new THREE.Mesh(new THREE.BoxGeometry(OFF.w+.55,.10,OFF.d+.55),limeM);band.position.set(OFF.x,y,OFF.z);scene.add(band)}
  const officeGlass=new THREE.MeshBasicMaterial({color:0x86e5ff,transparent:true,opacity:.16,side:THREE.DoubleSide,depthWrite:false});
  for(const sx of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.16,OFF.h,OFF.d-1),officeGlass);p.position.set(OFF.x+sx*(OFF.w/2-.2),OFF.h/2,OFF.z);scene.add(p)}
  for(const sz of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(OFF.w-1,OFF.h,.16),officeGlass);p.position.set(OFF.x,OFF.h/2,OFF.z+sz*(OFF.d/2-.2));scene.add(p)}
  for(const sx of[-1,1])for(const sz of[-1,1]){const fin=new THREE.Mesh(new THREE.BoxGeometry(.34,OFF.h+3,.34),sx*sz>0?limeM:cyanM);fin.position.set(OFF.x+sx*(OFF.w/2+.45),OFF.h/2,OFF.z+sz*(OFF.d/2+.45));scene.add(fin)}
  const heli=new THREE.Mesh(new THREE.CylinderGeometry(5.2,.2,.18,48),metalM);heli.position.set(OFF.x,OFF.h+.35,OFF.z);scene.add(heli);
  const crown=new THREE.Mesh(new THREE.TorusGeometry(7.5,.16,10,80),limeM);crown.rotation.x=Math.PI/2;crown.position.set(OFF.x,OFF.h+1,OFF.z);scene.add(crown);
  const officeTitle=labelSprite('SUPER OFFICE',{w:14,size:78,color:'#efffe8',glow:'#7bff3a',plate:true});officeTitle.position.set(OFF.x,OFF.h+7,OFF.z);scene.add(officeTitle);
  const ceoTitle=labelSprite('CEO · YOU',{w:7,size:54,color:'#d4ff3a',glow:'#d4ff3a',plate:true});ceoTitle.position.set(OFF.x,OFF.h+3,OFF.z+OFF.d/2+.4);scene.add(ceoTitle);
  // specials
  const HQ={x:-18,z:-18,w:18,d:18,h:46};building(HQ.x,HQ.z,HQ.w,HQ.d,HQ.h,0,'hq');
  {const lg=new THREE.Mesh(new THREE.PlaneGeometry(11,11),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xcfffd8}));lg.position.set(HQ.x,HQ.h*.62,HQ.z+HQ.d/2+.1);scene.add(lg);loadTex('assets/lobby/supercycle-logo.webp',t=>{lg.material.map=t;lg.material.needsUpdate=true});
   const s=labelSprite('SUPERCYCLE HQ',{w:14,size:74});s.position.set(HQ.x,HQ.h+9,HQ.z);scene.add(s)}
  specials.hq={x:HQ.x,z:HQ.z+HQ.d/2+3.5,label:'SUPERCYCLE HQ · START THE EYE WORLD MISSION',act:()=>api.onPortal&&go('story')};
  const AR={x:18,z:-18,w:26,d:18,h:11};building(AR.x,AR.z,AR.w,AR.d,AR.h,2,'arcade');
  {const s=labelSprite('SUPER ARCADE',{w:15,size:80});s.position.set(AR.x,AR.h+4.2,AR.z);scene.add(s);const cols=[0x7bff3a,0xff4d4f,0xc8ff43,0xffc83d];for(let i=0;i<4;i++){const d=new THREE.Mesh(new THREE.PlaneGeometry(4,6),new THREE.MeshBasicMaterial({color:new THREE.Color(cols[i]).multiplyScalar(2),transparent:true,opacity:.8}));d.position.set(AR.x-9+i*6,3.2,AR.z+AR.d/2+.08);scene.add(d)}}
  specials.arcade={x:AR.x,z:AR.z+AR.d/2+3.5,label:'SUPER ARCADE · PICK A GAME',act:()=>openMenu()};
  const DK={x:-18,z:18,w:14,d:14,h:32};building(DK.x,DK.z,DK.w,DK.d,DK.h,3,'dock');
  {const pad=new THREE.Mesh(new THREE.CylinderGeometry(7.5,7.5,.5,40),metalM);pad.position.set(DK.x,DK.h+.8,DK.z);scene.add(pad);const pr2=new THREE.Mesh(new THREE.TorusGeometry(7,.18,8,60),limeM);pr2.rotation.x=Math.PI/2;pr2.position.set(DK.x,DK.h+1.1,DK.z);scene.add(pr2);
   const bm=new THREE.Mesh(new THREE.CylinderGeometry(2,6,70,24,1,true),new THREE.MeshBasicMaterial({color:0x7bff3a,transparent:true,opacity:.08,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}));bm.position.set(DK.x,DK.h+36,DK.z);scene.add(bm);
   const s=labelSprite('SUPER SHIP DOCK',{w:12,size:70});s.position.set(DK.x,DK.h+8,DK.z);scene.add(s)}
  specials.dock={x:DK.x,z:DK.z+DK.d/2+3.5,label:'SUPER SHIP DOCK · BOARD THE LOBBY',act:()=>go('lobby')};
  const EX={x:18,z:18,w:16,d:16,h:20};building(EX.x,EX.z,EX.w,EX.d,EX.h,1,'exchange');
  const coin=new THREE.Group();coin.position.set(EX.x,EX.h+8,EX.z);scene.add(coin);
  {const c=new THREE.Mesh(new THREE.CylinderGeometry(3.4,3.4,.6,40),new THREE.MeshStandardMaterial({color:0x2a4a30,metalness:.9,roughness:.25,emissive:0x2a6a18}));c.rotation.x=Math.PI/2;coin.add(c);const r=new THREE.Mesh(new THREE.TorusGeometry(3.4,.2,8,48),limeM);coin.add(r);const mk=new THREE.Mesh(new THREE.PlaneGeometry(4.4,4.4),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,color:0xdfffc0}));mk.position.z=.35;coin.add(mk);const mk2=mk.clone();mk2.position.z=-.35;mk2.rotation.y=Math.PI;coin.add(mk2);loadTex('assets/lobby/supercycle-logo.webp',t=>{mk.material.map=t;mk.material.needsUpdate=true})}
  {const s=labelSprite('$SUPER EXCHANGE',{w:12,size:70});s.position.set(EX.x,EX.h+14,EX.z);scene.add(s)}
  specials.exchange={x:EX.x,z:EX.z+EX.d/2+3.5,label:'$SUPER EXCHANGE · OPEN THE LIVE CHART',act:()=>window.open(DEX_URL,'_blank','noopener')};
  // parks (corner blocks): trees, pond, benches
  const trees=[];for(const [cx,cz] of[[-54,-54],[54,-54],[-54,54],[54,54]]){for(let i=0;i<0;i++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*22;const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(Math.hypot(x-cx,z-cz)>6)trees.push([x,z,rnd(.8,1.6)])}
    const pond=new THREE.Mesh(new THREE.CircleGeometry(6,32),new THREE.MeshBasicMaterial({color:new THREE.Color(.1,.9,.8)}));pond.rotation.x=-Math.PI/2;pond.position.set(cx,.05,cz);scene.add(pond);const pr3=new THREE.Mesh(new THREE.TorusGeometry(6,.2,8,40),greenM);pr3.rotation.x=Math.PI/2;pr3.position.set(cx,.1,cz);scene.add(pr3)}
  for(let i=0;i<0;i++){const a=rnd(0,6.283),r=rnd(80,108);trees.push([Math.cos(a)*r,Math.sin(a)*r,rnd(.8,1.5)])}
  if(trees.length){const n=trees.length,tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.28,2.2,6),metalM,n),cn=new THREE.InstancedMesh(new THREE.ConeGeometry(1.6,4.6,8),new THREE.MeshStandardMaterial({color:0x2f8a2a,emissive:0x1a5a14,emissiveIntensity:.7,roughness:.7}),n),d=new THREE.Object3D();
   trees.forEach(([x,z,s],i)=>{d.position.set(x,1.1*s,z);d.scale.setScalar(s);d.updateMatrix();tr.setMatrixAt(i,d.matrix);d.position.set(x,3.6*s,z);d.updateMatrix();cn.setMatrixAt(i,d.matrix)});scene.add(tr,cn)}
  // street lamps
  {const pts=[];for(const c of ROADS)for(let t=-100;t<=100;t+=12)for(const s of[-1,1]){pts.push([t,c+s*(RW/2+.6)]);pts.push([c+s*(RW/2+.6),t])}
   const n=pts.length,pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.12,5,6),metalM,n),d=new THREE.Object3D(),pos=new Float32Array(n*3);
   pts.forEach(([x,z],i)=>{d.position.set(x,2.5,z);d.updateMatrix();pm.setMatrixAt(i,d.matrix);pos.set([x,5.2,z],i*3)});scene.add(pm);
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));scene.add(Object.assign(new THREE.Points(g,new THREE.PointsMaterial({size:3.2,map:glowTex,color:0xc8ff7a,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),{frustumCulled:false}))}

  /* ---------- scenery upgrade: sidewalks, crosswalks, storefronts, parks, ambience ---------- */
  const PARKS=[[-54,-54],[54,-54],[-54,54],[54,54]];
  const dressing=dress({scene,B,ROADS,RW,ISL,U,limeM,redM,greenM,metalM,roofM,BMAT,glowTex,labelSprite,specials,camera,parkCenters:PARKS,solids:[{x:-54,z:18,hw:12,hd:10}]});

  /* ---------- the Super Home: three stories, furnished, with an elevator (spawn point) ---------- */
  const HS=(()=>{
    const HX0=-54,HZ0=18,W=24,D=20,FH=6.2,TOP=FH*3,hx=W/2,hz=D/2,FY=[0,FH,FH*2],SX=-9.5,SZ=-7.5,SHW=1.95;
    const X={};
    const home=new THREE.Group();home.position.set(HX0,0,HZ0);scene.add(home);
    const mat=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.6,metalness:.1,...o});
    const mb=(c,i=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(i)});
    const bx=(p,w,h,d,m,x,y,z,ry=0)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y+h/2,z);o.rotation.y=ry;p.add(o);return o};
    const cyl=(p,rt,rb,h,m,x,y,z,seg=18)=>{const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),m);o.position.set(x,y+h/2,z);p.add(o);return o};
    const sph=(p,r,m,x,y,z,sx=1,sy=1,sz=1)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);p.add(o);return o};
    const gl=(p,x,y,z,s,c,op=.7)=>{const g=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:c,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,opacity:op}));g.scale.set(s,s,1);g.position.set(x,y,z);p.add(g);return g};
    const tex=(draw,sz=256)=>{const c=document.createElement('canvas');c.width=c.height=sz;draw(c.getContext('2d'),sz);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
    const woodT=tex((x,s)=>{for(let i=0;i<8;i++){x.fillStyle=`hsl(28,${34+(i%3)*6}%,${24+(i*7%11)}%)`;x.fillRect(0,i*32,s,32);x.fillStyle='rgba(0,0,0,.4)';x.fillRect(0,i*32,s,2);for(let k=0;k<4;k++)x.fillRect((i*53+k*71)%s,i*32,2,32)}});woodT.repeat.set(.25,.25);
    const stoneT=tex((x,s)=>{x.fillStyle='#1a2a22';x.fillRect(0,0,s,s);for(let j=0;j<4;j++)for(let i=0;i<4;i++){x.fillStyle=`hsl(150,18%,${15+((i+j)%2)*4}%)`;x.fillRect(i*64+2,j*64+2,60,60)}});stoneT.repeat.set(.25,.25);
    const rugT=(c1,c2)=>tex((x,s)=>{x.fillStyle=c1;x.fillRect(0,0,s,s);x.strokeStyle=c2;x.lineWidth=8;for(const r of[.46,.34,.22]){x.beginPath();x.arc(s/2,s/2,s*r,0,6.283);x.stroke()}x.fillStyle=c2;x.font='bold 120px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('✳',s/2,s/2+6)},256);
    const wallM=mat(0x1b2822,{roughness:.5,metalness:.5,transparent:true,depthWrite:true}),glassM=mat(0x9ff0c8,{transparent:true,opacity:.2,roughness:.05,metalness:.3,depthWrite:false,side:THREE.DoubleSide});
    const woodM=mat(0xffffff,{map:woodT,roughness:.55}),stoneM=mat(0xffffff,{map:stoneT,roughness:.35,metalness:.3});
    const sofaM=mat(0x2f6b3a,{roughness:.85}),sofa2=mat(0x1f3b2c,{roughness:.9}),whiteM=mat(0xe9efe9,{roughness:.5}),darkM=mat(0x1a1f1c,{roughness:.5,metalness:.4}),oakM=mat(0x9a6a3c,{roughness:.55}),walnutM=mat(0x4a2c1a,{roughness:.5}),steel=mat(0xb8c4bc,{roughness:.25,metalness:.9}),leafM=mat(0x2f9a3a,{emissive:0x0a3a10,roughness:.8}),potM=mat(0x2a2a2a),creamM=mat(0xe8dcc0,{roughness:.9}),redF=mat(0x8a2a30,{roughness:.8}),limeEm=mb(0xc8ff43,2.2),redEm=mb(0xff4d4f,2.4),cyanEm=mb(0x4dd2ff,2.2),goldEm=mb(0xffc83d,2.4);
    const F=[0,1,2].map(i=>{const g=new THREE.Group();g.position.y=FY[i];home.add(g);return g});
    // floors (with the elevator hole on levels 2 and 3)
    function floorMesh(m,hole){const s=new THREE.Shape();s.moveTo(-hx,hz);s.lineTo(hx,hz);s.lineTo(hx,-hz);s.lineTo(-hx,-hz);s.closePath();
      if(hole){const h=new THREE.Path();h.moveTo(SX-SHW,-SZ-SHW);h.lineTo(SX+SHW,-SZ-SHW);h.lineTo(SX+SHW,-SZ+SHW);h.lineTo(SX-SHW,-SZ+SHW);h.closePath();s.holes.push(h)}
      const o=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.3,bevelEnabled:false}),m);o.rotation.x=-Math.PI/2;o.position.y=-.3;return o}
    F[0].add(floorMesh(stoneM,false));F[1].add(floorMesh(woodM,true));F[2].add(floorMesh(woodM,true));
    // shell
    const shell=new THREE.Group();home.add(shell);
    bx(shell,.5,TOP,D,wallM,-hx,0,0);bx(shell,W,TOP,.5,wallM,0,0,-hz);bx(shell,W,TOP,.5,wallM,0,0,hz);
    for(let f=0;f<3;f++){const y0=f*FH;
      if(f===0){bx(home,.12,FH,hz-2,glassM,hx,y0,-(hz+2)/2);bx(home,.12,FH,hz-2,glassM,hx,y0,(hz+2)/2);bx(home,.12,FH-4.6,4,glassM,hx,4.6,0)}else bx(home,.12,FH,D,glassM,hx,y0,0)}
    for(const z of[-10,-6,-2,2,6,10])bx(home,.3,TOP,.3,steel,hx,0,z);
    for(let f=0;f<=3;f++){bx(home,.7,.32,D+.7,darkM,hx,f*FH-.16,0);bx(home,.1,.12,D,limeEm,hx+.36,f*FH-.06,0);bx(shell,W+.7,.3,.7,darkM,0,f*FH-.15,hz);bx(shell,W+.7,.3,.7,darkM,0,f*FH-.15,-hz);if(f<3){bx(shell,.1,.1,D,limeEm,-hx-.28,f*FH+FH-.5,0);bx(shell,W,.1,.1,redEm,0,f*FH+FH-.5,hz+.28)}}
    // front door
    for(const s of[-1,1]){bx(home,.3,4.8,.3,limeEm,hx,0,s*2.1);const d=bx(home,.08,4.4,1.7,glassM,hx,0,s*3.3,0);d.rotation.y=s*.9;d.position.x=hx+.5}
    bx(home,.3,.3,4.6,limeEm,hx,4.7,0);
    {const s=labelSprite('SUPER HOME',{w:7,size:78});s.position.set(hx+1.2,5.6,0);home.add(s)}
    // balconies
    for(const f of[1,2]){bx(home,1.9,.25,10,darkM,hx+.95,FY[f]-.25,0);bx(home,.08,1.05,10,glassM,hx+1.85,FY[f],0);bx(home,.1,.1,10,limeEm,hx+1.85,FY[f]+1.05,0);for(const z of[-3.2,3.2]){cyl(home,.35,.3,.6,potM,hx+1.2,FY[f],z);sph(home,.6,leafM,hx+1.2,FY[f]+1,z)}}
    // walkway + hedge + mailbox out front
    bx(home,5,.06,3,mat(0x3a4a42),hx+2.5,0,0);for(const z of[8]){bx(home,1.6,1.1,6,mat(0x1f6a2a,{roughness:.9}),hx+1.4,0,z)}
    cyl(home,.06,.06,1.4,steel,hx+2.6,0,3.8);bx(home,.5,.4,.8,redEm,hx+2.6,1.4,3.8);
    // roof deck
    const roofG=new THREE.Group();roofG.position.y=TOP;home.add(roofG);
    bx(roofG,W+1,.5,D+1,darkM,0,0,0);for(const [w,d,x,z] of[[W+1,.25,0,hz+.4],[W+1,.25,0,-hz-.4],[.25,D+1,hx+.4,0],[.25,D+1,-hx-.4,0]]){bx(roofG,w,.9,d,steel,x,.5,z);bx(roofG,w+.1,.1,d+.05,limeEm,x,1.35,z)}
    {const pad=new THREE.Mesh(new THREE.CircleGeometry(4.2,40),new THREE.MeshBasicMaterial({map:tex((x,s)=>{x.fillStyle='#10201a';x.fillRect(0,0,s,s);x.strokeStyle='#c8ff43';x.lineWidth=10;x.beginPath();x.arc(128,128,112,0,6.283);x.stroke();x.fillStyle='#c8ff43';x.font='bold 150px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('✳',128,138)})}));pad.rotation.x=-Math.PI/2;pad.position.set(4,.52,0);roofG.add(pad)}
    cyl(roofG,.12,.2,9,steel,-8.5,.5,-6);gl(roofG,-8.5,10,-6,3.2,0xff3a3a,.9);
    {const lg=new THREE.Mesh(new THREE.PlaneGeometry(6,6),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:0xcfffd8}));lg.position.set(-3,4.2,-hz+.2);roofG.add(lg);loadTex('assets/lobby/supercycle-logo.webp',t=>{lg.material.map=t;lg.material.needsUpdate=true})}
    // colliders (world space)
    const wall=(x,z,w,d)=>B.push({x:HX0+x,z:HZ0+z,hw:w/2,hd:d/2,h:TOP,name:'home'});
    wall(-hx,0,.5,D);wall(0,-hz,W,.5);wall(0,hz,W,.5);wall(hx,-(hz+2)/2,.3,hz-2);wall(hx,(hz+2)/2,.3,hz-2);
    wall(SX-SHW,SZ,.2,SHW*2);wall(SX,SZ-SHW,SHW*2,.2);wall(SX+SHW,SZ,.2,SHW*2);
    // lights
    const lights=[[0xffe2b0,0],[0xffd0ee,1],[0x9ad8ff,2]].map(([c,i])=>{const l=new THREE.PointLight(c,26,17,2);l.position.set(0,FY[i]+4.4,0);home.add(l);return l});

    /* ---- furniture helpers ---- */
    function sofa(p,x,y,z,ry,len,m=sofaM){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);bx(g,2.2,.5,len,m,0,.25,0);bx(g,.6,1.4,len,m,-.8,.25,0);bx(g,2.2,.95,.6,m,0,.25,-len/2+.3);bx(g,2.2,.95,.6,m,0,.25,len/2-.3);
      const n=Math.max(2,Math.round((len-1.4)/1.9));for(let i=0;i<n;i++){const cz=-len/2+.7+(i+.5)*(len-1.4)/n;bx(g,1.5,.25,(len-1.4)/n-.1,mat(0x3a8048,{roughness:.9}),.3,.75,cz);bx(g,.35,1.1,(len-1.4)/n-.2,mat(0x3a8048,{roughness:.9}),-.45,.75,cz)}
      bx(g,.5,.5,.5,whiteM,.4,1.0,-len/2+1.1,.4);bx(g,.5,.5,.5,limeEm,.4,1.0,len/2-1.1,-.4);return g}
    function chair(p,x,y,z,ry,m=darkM){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);bx(g,.9,.12,.9,m,0,.55,0);bx(g,.9,1,.12,m,0,.6,-.4);for(const [a,b] of[[-.38,-.38],[.38,-.38],[-.38,.38],[.38,.38]])bx(g,.08,.55,.08,steel,a,0,b);return g}
    function table(p,x,y,z,w,d,h,m=oakM,ry=0){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);bx(g,w,.12,d,m,0,h-.12,0);for(const a of[-1,1])for(const b of[-1,1])bx(g,.14,h-.12,.14,steel,a*(w/2-.2),0,b*(d/2-.2));return g}
    function plant(p,x,y,z,s=1){cyl(p,.45*s,.35*s,.7*s,potM,x,y,z);sph(p,.7*s,leafM,x,y+1.2*s,z,1,1.1,1);sph(p,.5*s,leafM,x+.35*s,y+1.7*s,z+.2*s);sph(p,.45*s,leafM,x-.3*s,y+1.55*s,z-.25*s)}
    function lamp(p,x,y,z,c=0xffd9a0,h=3.4){cyl(p,.28,.32,.12,darkM,x,y,z);cyl(p,.04,.04,h,steel,x,y,z);cyl(p,.3,.5,.55,mb(c,1.2),x,y+h,z);gl(p,x,y+h+.3,z,2.6,c,.55)}
    function pendant(p,x,y,z,c=0xffd9a0){cyl(p,.02,.02,1.6,steel,x,y,z);cyl(p,.15,.6,.5,darkM,x,y-.5,z);gl(p,x,y-.6,z,2.4,c,.6)}
    function shelf(p,x,y,z,ry,w,h){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);bx(g,.6,h,.12,walnutM,0,0,-w/2);bx(g,.6,h,.12,walnutM,0,0,w/2);for(let i=0;i<=4;i++)bx(g,.6,.1,w,walnutM,0,i*(h-.1)/4,0);
      const cols=[0x7bff3a,0xff4d4f,0xffc83d,0x4dd2ff,0xe9efe9,0xc8ff43];for(let r=0;r<4;r++){let z0=-w/2+.2;while(z0<w/2-.3){const bw=.1+Math.random()*.14;bx(g,.38,.55+Math.random()*.25,bw,mat(cols[Math.floor(Math.random()*cols.length)],{roughness:.6}),.05,r*(h-.1)/4+.1,z0+bw/2);z0+=bw+.02}}return g}
    function art(p,path,x,y,z,ry,w,h){const m=new THREE.MeshBasicMaterial({color:0x223}),fr=bx(p,w+.3,h+.3,.12,darkM,x,y-.15,z,ry);const pl=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);const off=new THREE.Vector3(0,0,.07).applyAxisAngle(new THREE.Vector3(0,1,0),ry);pl.position.set(x+off.x,y+h/2,z+off.z);pl.rotation.y=ry;p.add(pl);loadTex(path,t=>{m.map=t;m.color.set(0xffffff);m.needsUpdate=true});return pl}
    function screen(p,x,y,z,ry,w,h,tx,glowC=0x7bff3a){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);bx(g,w+.3,h+.3,.18,darkM,0,-.15,0);const m=new THREE.MeshBasicMaterial({color:0x889988});const s=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);s.position.set(0,h/2,.1);g.add(s);if(tx)loadTex(tx,t=>{m.map=t;m.color.set(0xffffff);m.needsUpdate=true});gl(g,0,h/2,.6,Math.max(w,h)*1.1,glowC,.25);return {g,m}}
    function chartTex(){return tex((x,s)=>{x.fillStyle='#07140c';x.fillRect(0,0,s,s);x.strokeStyle='rgba(120,255,90,.15)';for(let i=1;i<8;i++){x.beginPath();x.moveTo(0,i*32);x.lineTo(s,i*32);x.stroke()}let p=150;for(let i=0;i<32;i++){const o=p;p+=(Math.random()-.5)*34;const up=p<o;x.fillStyle=up?'#7bff3a':'#ff4d4f';x.fillRect(i*8+1,Math.min(o,p),5,Math.abs(o-p)+2);x.fillRect(i*8+3,Math.min(o,p)-6,1,Math.abs(o-p)+12)}x.fillStyle='#d4ff3a';x.font='bold 26px monospace';x.fillText('$SUPER',10,30)})}
    function bed(p,x,y,z){bx(p,5.4,.7,4.8,darkM,x,0,z);bx(p,5.2,.4,4.6,whiteM,x,.7,z);bx(p,.3,2.3,5.2,walnutM,x-2.8,0,z);bx(p,3.3,.18,4.7,mat(0x2f7a3a,{roughness:.9}),x+.7,1.0,z);bx(p,.8,.3,1.6,creamM,x-2.2,1.1,z-1.2,.1);bx(p,.8,.3,1.6,creamM,x-2.2,1.1,z+1.2,-.1);bx(p,1.5,.1,4.8,limeEm,x+1.9,1.15,z)}
    function arcade(p,x,y,z,ry,tx,c){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;p.add(g);bx(g,1.4,2.8,1.2,mat(0x181e24,{metalness:.6,roughness:.4}),0,0,0);bx(g,1.2,.16,1.1,limeEm,0,2.9,0);bx(g,1.3,.6,.9,mat(0x232a30),0,1.0,.55);const m=new THREE.MeshBasicMaterial({color:0x667766});const s=new THREE.Mesh(new THREE.PlaneGeometry(1.0,.9),m);s.position.set(0,1.75,.61);s.rotation.x=-.12;g.add(s);loadTex(tx,t=>{m.map=t;m.color.set(0xffffff);m.needsUpdate=true});cyl(g,.1,.1,.1,redEm,.4,1.35,.85);gl(g,0,1.8,1,2.2,c,.3)}
    function stool(p,x,y,z,m=redF){cyl(p,.3,.3,.12,m,x,y+.9,z);cyl(p,.05,.05,.9,steel,x,y,z);cyl(p,.28,.28,.05,steel,x,y,z)}
    function rug(p,x,z,r,c1,c2){const m=new THREE.Mesh(new THREE.CircleGeometry(r,40),new THREE.MeshStandardMaterial({map:rugT(c1,c2),roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(x,.03,z);p.add(m)}
    function neon(p,text,x,y,z,ry,color,glow,w=5){const s=labelSprite(text,{w,size:84,color,glow});s.position.set(x,y,z);p.add(s)}

    /* ---- FLOOR 1 · lounge, kitchen, dining ---- */
    {const p=F[0];
     {const s=screen(p,-11.55,1.6,1.2,Math.PI/2,5.8,3.2,'assets/lobby/supercycle-logo.webp',0x7bff3a);bx(p,.4,.5,6.4,darkM,-11.6,.5,1.2)}
     rug(p,-5.2,1.2,4.3,'#16301f','#7ddc1f');sofa(p,-2.3,0,1.2,Math.PI,6.4);table(p,-6.2,0,1.2,1.8,3.2,.55,walnutM);bx(p,.5,.22,.7,limeEm,-6.2,.58,.6);bx(p,.35,.3,.35,goldEm,-6.2,.58,1.8);
     sofa(p,-6.6,0,-3.6,Math.PI/2,3.2,sofa2);lamp(p,-.2,0,-3.6);lamp(p,-.4,0,5.6);shelf(p,-11.4,0,-3.4,0,2.4,4.4);shelf(p,-11.4,0,6.8,0,2.4,4.4);
     plant(p,-10.6,0,9);plant(p,10.7,0,-9);plant(p,10.9,0,6.4,1.1);plant(p,-1,0,-9.3,.9);
     // kitchen
     bx(p,10.4,1.1,1.3,mat(0x20302a,{roughness:.4,metalness:.4}),4.3,0,hz-1);bx(p,10.6,.1,1.5,whiteM,4.3,1.1,hz-1);bx(p,10.4,1.4,.8,mat(0x20302a,{roughness:.4}),4.3,3.2,hz-.6);bx(p,2.2,.16,1.2,steel,7.5,2.6,hz-1.1);bx(p,2.4,.5,.9,darkM,7.5,2.3,hz-1.1);gl(p,7.5,2.15,hz-1.1,2.4,0xfff0c0,.35);
     bx(p,1.6,3.4,1.5,steel,10.6,0,7.3);bx(p,.05,3.4,.05,darkM,9.8,0,6.55);
     bx(p,4.8,1.15,1.7,mat(0x2a3a32),4.6,0,4.2);bx(p,5,.12,1.9,whiteM,4.6,1.15,4.2);bx(p,4.8,.08,.12,limeEm,4.6,.5,3.3);for(const x of[2.9,4.6,6.3])stool(p,x,0,2.7);
     pendant(p,3.6,6,4.2);pendant(p,5.6,6,4.2);
     // dining
     table(p,6,0,-4.3,4.2,2.1,.95,walnutM);for(const x of[4.6,6,7.4])for(const s of[-1,1])chair(p,x,0,-4.3+s*1.55,s>0?Math.PI:0,mat(0x2f6b3a));chair(p,3.4,0,-4.3,Math.PI/2);chair(p,8.6,0,-4.3,-Math.PI/2);
     pendant(p,5.2,6,-4.3,0xc8ff43);pendant(p,6.8,6,-4.3,0xc8ff43);cyl(p,.2,.2,.5,goldEm,6,.95,-4.3);
     // entry + art
     bx(p,1.6,.9,.6,oakM,10.9,0,-4.4);rug(p,10,0,1.2,'#16301f','#c8ff43');art(p,'assets/lobby/community-1.webp',-3.2,2.2,-hz+.35,0,1.8,2.2);art(p,'assets/lobby/community-3.webp',-.6,2.4,-hz+.35,0,2.6,1.9);neon(p,'SUPER HOME',3.2,5,-hz+.4,0,'#fff','#7bff3a',6);}

    /* ---- FLOOR 2 · bedroom + study ---- */
    {const p=F[1];
     rug(p,-6.4,3.6,3.4,'#14261c','#c8ff43');bed(p,-8.2,0,3.6);for(const z of[-.3,7.4]){bx(p,.9,.8,.9,walnutM,-10.6,0,z);lamp(p,-10.6,.8,z,0xffc890,1.5)}
     art(p,'assets/lobby/community-2.webp',-11.5,2.7,3.6,Math.PI/2,3.4,2.2);
     bx(p,6,4.4,1.2,walnutM,-6,0,hz-1);for(let i=0;i<4;i++){bx(p,.05,4,.05,darkM,-8.2+i*1.5,.2,hz-1.65);bx(p,.12,.5,.06,limeEm,-8.2+i*1.5+.2,2,hz-1.68)}
     table(p,-3.4,0,hz-1.2,1.6,.8,.85,oakM);bx(p,1.4,1.2,.08,steel,-3.4,1.1,hz-1.7);
     // study
     table(p,7.2,0,hz-1.2,6,1.5,.95,walnutM);for(const [x,tx,c] of[[5.4,chartTex(),0x7bff3a],[7.2,chartTex(),0xff4d4f],[9,chartTex(),0x4dd2ff]]){const g=new THREE.Group();g.position.set(x,.95,hz-1.5);g.rotation.y=Math.PI;p.add(g);bx(g,.12,.5,.12,steel,0,0,0);const m=new THREE.MeshBasicMaterial({map:tx});const s=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.95),m);s.position.set(0,1.0,.09);g.add(s);bx(g,1.7,1.05,.1,darkM,0,.45,0);gl(g,0,1.0,.4,2.6,c,.25)}
     chair(p,7.2,0,7.3,0,mat(0x1a2a22));bx(p,.1,1.2,.5,limeEm,7.2,.7,6.8);
     sph(p,1.1,mat(0x2f9a4a,{roughness:1}),3.3,.7,-3.4,1,.65,1);sph(p,1.1,mat(0xc8402a,{roughness:1}),6.2,.7,-5,1,.65,1);sph(p,1.0,mat(0x2a6aa0,{roughness:1}),4.6,.65,-6.2,1,.65,1);
     arcade(p,hx-.9,0,-6.4,-Math.PI/2,'assets/previews/glass-bridge.jpg',0x7bff3a);arcade(p,hx-.9,0,-3.9,-Math.PI/2,'assets/previews/mingle.jpg',0xffc83d);arcade(p,hx-.9,0,-1.4,-Math.PI/2,'assets/previews/red-light.jpg',0xff4d4f);
     bx(p,6,2.6,.7,mat(0x20302a,{roughness:.4}),1.2,0,-hz+.6);bx(p,5.7,2.3,.04,mat(0x9fe8c8,{transparent:true,opacity:.25,depthWrite:false}),1.2,.15,-hz+.97);for(let i=0;i<5;i++){cyl(p,.16,.2,.5,goldEm,-.8+i*1.2,1.0,-hz+.62)}neon(p,'TROPHIES',1.2,3.9,-hz+.5,0,'#ffe9a0','#ffc83d',4);
     table(p,.8,0,2.4,1.5,1.5,.8,oakM);chair(p,-.4,0,2.4,Math.PI/2);chair(p,2,0,2.4,-Math.PI/2);plant(p,10.6,0,8.9);plant(p,-1.6,0,-8.9,.9);lamp(p,3,0,-8.8,0xc8ff43);}

    /* ---- FLOOR 3 · cinema, bar, pool ---- */
    {const p=F[2];
     const cin=screen(p,-11.55,1.0,1.5,Math.PI/2,8.4,4.7,'assets/previews/glass-bridge.jpg',0x4dd2ff);const cinTex=['assets/previews/glass-bridge.jpg','assets/previews/mingle.jpg','assets/previews/red-light.jpg','assets/previews/story.jpg'].map(u=>{const t=tl.load(BASE+u);t.colorSpace=THREE.SRGBColorSpace;return t});
     bx(p,3.6,.45,11.2,darkM,-2.9,0,1.5);rug(p,-7.4,1.5,3.6,'#101c2a','#4dd2ff');
     for(const [x,y] of[[-6.6,0],[-3.0,.45]])for(const z of[-1.8,1.5,4.8]){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=Math.PI;p.add(g);bx(g,1.4,.6,1.4,redF,0,.2,0);bx(g,.4,1.5,1.4,redF,-.75,.2,0);bx(g,1.2,.12,.28,redF,0,.5,.75);bx(g,.3,.7,.12,darkM,0,.5,-.65);bx(g,.3,.7,.12,darkM,0,.5,.65);bx(g,1.2,.06,.06,cyanEm,.1,.85,.7)}
     bx(p,1.2,2.2,1.2,mat(0xb02a30,{metalness:.5}),-10.6,0,8.6);bx(p,1,.9,.06,goldEm,-10.6,1.2,7.98);
     bx(p,10,1.25,1.5,mat(0x1a1f2a,{metalness:.5}),5,0,hz-2.2);bx(p,10.4,.12,1.8,mat(0x3a2418,{roughness:.3}),5,1.25,hz-2.2);bx(p,10,.1,.1,limeEm,5,.4,hz-1.4);for(const x of[1.6,3.4,5.2,7,8.8])stool(p,x,0,hz-3.8,mat(0x2a2a2a));
     bx(p,10,.12,.6,walnutM,5,2.2,hz-.5);bx(p,10,.12,.6,walnutM,5,3.2,hz-.5);for(let i=0;i<14;i++){const c=[0x7bff3a,0xff4d4f,0xffc83d,0x4dd2ff][i%4];cyl(p,.13,.16,.8,mb(c,1.6),.4+i*.72,2.32,hz-.5,10);cyl(p,.12,.15,.7,mb(c,1.4),.4+i*.72,3.32,hz-.5,10)}neon(p,'BAR',5,4.7,hz-.3,Math.PI,'#ff9ae0','#ff4dd2',3);
     const pool=new THREE.Group();pool.position.set(6.4,0,-3.4);p.add(pool);bx(pool,5.2,.15,3,walnutM,0,.85,0);bx(pool,4.7,.05,2.5,mat(0x1c7a3a,{roughness:1}),0,1.0,0);for(const a of[-1,1])for(const b of[-1,1])bx(pool,.3,.9,.3,walnutM,a*2.3,0,b*1.2);const bc=[0xffc83d,0xff4d4f,0x4dd2ff,0xc8ff43,0xffffff,0x222222];for(let i=0;i<8;i++)sph(pool,.09,mb(bc[i%6],1.2),.7+(i%3)*.17,1.1,-.25+Math.floor(i/3)*.2);bx(pool,.05,.05,3.4,oakM,-1.2,1.3,.4,.3);pendant(p,6.4,6,-3.4,0x9ad8ff);
     cyl(p,.06,.06,1.6,steel,10,0,3.4);const tele=cyl(p,.22,.3,2.2,mat(0xe9efe9,{metalness:.7}),10,1.6,3.4);tele.rotation.z=.9;
     table(p,-1.4,0,-7.2,1.6,1,.6,oakM);plant(p,-9.8,0,-9);plant(p,10.6,0,-9,1.2);neon(p,'SUPER',2.4,4.6,-hz+.4,0,'#d6ff8a','#7bff3a',5);lamp(p,-.8,0,8,0x9ad8ff);
     X.cin={m:cin.m,t:cinTex}}
    
    /* ---- the elevator ---- */
    const el=new THREE.Group();el.position.set(SX,0,SZ);home.add(el);
    for(const [x,z] of[[-SHW,-SHW],[SHW,-SHW],[-SHW,SHW],[SHW,SHW]])bx(el,.2,TOP+.4,.2,steel,x,0,z);
    for(const [w,d,x,z] of[[.06,SHW*2,-SHW,0],[SHW*2,.06,0,-SHW],[.06,SHW*2,SHW,0]])bx(el,w,TOP,d,glassM,x,0,z);bx(el,.1,TOP,.1,limeEm,SHW,0,SHW);bx(el,.1,TOP,.1,cyanEm,-SHW,0,SHW);
    for(let f=0;f<3;f++){const y=FY[f];bx(el,.22,3.6,.24,limeEm,-1.1,y,SHW);bx(el,.22,3.6,.24,limeEm,1.1,y,SHW);bx(el,2.4,.22,.24,limeEm,0,y+3.6,SHW);const s=labelSprite(f===0?'G':String(f+1),{w:1.3,size:90,color:'#fff',glow:'#7bff3a'});s.position.set(0,y+4.3,SHW+.1);el.add(s)}
    const cab=new THREE.Group();el.add(cab);
    bx(cab,3.3,.25,3.3,darkM,0,-.25,0);bx(cab,3.3,.2,3.3,mat(0x30443a,{metalness:.6}),0,3.5,0);bx(cab,2.4,.05,2.4,mb(0xfff4d0,1.6),0,3.44,0);gl(cab,0,3.1,0,3.4,0xffe6b0,.5);
    for(const [w,d,x,z] of[[.08,3.2,-1.6,0],[3.2,.08,0,-1.6],[.08,3.2,1.6,0]])bx(cab,w,3.5,d,glassM,x,0,z);bx(cab,.1,.1,3.2,limeEm,-1.6,1.1,0);bx(cab,.1,.1,3.2,limeEm,1.6,1.1,0);
    const door1=bx(cab,1.5,3.3,.08,mat(0x9fe8c8,{transparent:true,opacity:.45,metalness:.5}),-.8,0,1.62),door2=bx(cab,1.5,3.3,.08,mat(0x9fe8c8,{transparent:true,opacity:.45,metalness:.5}),.8,0,1.62);
    const fl=['G','2','3'].map(t=>{const s=labelSprite(t,{w:1.4,size:100,color:'#d4ff3a'});s.position.set(0,3.0,-1.5);s.visible=false;cab.add(s);return s});fl[0].visible=true;
    const E={y:0,floor:0,tgt:0,door:1,state:'open',x:HX0+SX,z:HZ0+SZ};
    function go(f){f=clamp(f,0,2);if(E.state==='open'&&f===E.floor)return false;E.tgt=f;if(E.state==='open')E.state='closing';return true}
    const inHouse=(x,z)=>Math.abs(x-HX0)<hx-.3&&Math.abs(z-HZ0)<hz-.3;
    const inCab=(x,z)=>Math.abs(x-E.x)<1.35&&Math.abs(z-E.z)<1.35;
    let cinT=0,cinI=0,wallO=.96;
    function step(dt,P,time){
      // elevator state machine
      if(E.state==='closing'){E.door=Math.max(0,E.door-dt*1.7);if(E.door<=0)E.state='moving'}
      else if(E.state==='moving'){const ty=FY[E.tgt],d=ty-E.y,sp=Math.min(Math.abs(d),(1.6+Math.min(Math.abs(d),3)*1.2)*dt*1.0+.02);E.y+=Math.sign(d)*Math.min(Math.abs(d),(2.2+Math.min(Math.abs(d),4)*1.1)*dt);if(Math.abs(ty-E.y)<.02){E.y=ty;E.floor=E.tgt;E.state='opening'}}
      else if(E.state==='opening'){E.door=Math.min(1,E.door+dt*1.7);if(E.door>=1)E.state='open'}
      cab.position.y=E.y;door1.position.x=-.8-E.door*.78;door2.position.x=.8+E.door*.78;fl.forEach((s,i)=>s.visible=i===Math.round(E.y/FH));
      const inside=inHouse(P.x,P.z)&&P.y<TOP+.5;
      // keep the player out of the open shaft when the cab is elsewhere
      const nearShaft=Math.abs(P.x-E.x)<SHW+.1&&Math.abs(P.z-E.z)<SHW+.1;
      const riding=inside&&inCab(P.x,P.z)&&Math.abs(P.y-E.y)<1.4;
      if(inside&&nearShaft&&!riding&&Math.abs(P.y-E.y)>.5&&P.y<TOP-1){P.z=E.z+SHW+.4}
      if(riding&&(E.state==='closing'||E.state==='moving'||E.state==='opening')){P.y=E.y;P.vy=0;P.x+=(E.x-P.x)*Math.min(1,dt*4);P.z+=(E.z-P.z)*Math.min(1,dt*4)}
      P.riding=riding;
      // cut-away: hide upper floors + roof when you are inside, fade walls
      const pf=inside?clamp(Math.floor((P.y+.45)/FH),0,2):3;
      F.forEach((g,i)=>g.visible=i<=pf);roofG.visible=!inside||P.y>TOP-.5;
      const tw=inside?.13:.96;wallO+=(tw-wallO)*Math.min(1,dt*5);wallM.opacity=wallO;wallM.depthWrite=wallO>.9;
      lights.forEach((l,i)=>l.intensity=(inside?(i===Math.min(pf,2)?30:12):(i===0?18:8)));
      cinT-=dt;if(cinT<=0&&X.cin){cinT=7;cinI=(cinI+1)%X.cin.t.length;X.cin.m.map=X.cin.t[cinI];X.cin.m.needsUpdate=true}
      return{inside,pf,riding}
    }
    return{FY,FH,TOP,E,go,step,inHouse,inCab,HX0,HZ0,hx,hz,spawn:{x:HX0+5,z:HZ0+1.5}};
  })();

  /* ---------- SUPER HOME UNDERGROUND GARAGE ---------- */
  const GARAGE={x:-67,z:18,floor:-3.65,w:12,d:18,doorX:-67,doorZ:28.5};let garageIn=false;
  {
    const g=new THREE.Group();g.position.set(GARAGE.x,GARAGE.floor,GARAGE.z);scene.add(g);
    const fm=new THREE.MeshStandardMaterial({color:0x141c18,roughness:.78,metalness:.32}),wm=new THREE.MeshStandardMaterial({color:0x17231d,roughness:.62,metalness:.5});
    const floor=new THREE.Mesh(new THREE.BoxGeometry(GARAGE.w,.16,GARAGE.d),fm);floor.position.y=.02;g.add(floor);
    for(const [w0,h0,d0,x0,z0] of[[.35,4.2,GARAGE.d,-GARAGE.w/2,0],[.35,4.2,GARAGE.d,GARAGE.w/2,0],[GARAGE.w,4.2,.35,0,-GARAGE.d/2]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w0,h0,d0),wm);m.position.set(x0,h0/2,z0);g.add(m)}
    const beam=new THREE.Mesh(new THREE.BoxGeometry(GARAGE.w-.5,.18,.18),limeM);beam.position.set(0,4.05,GARAGE.d/2-.3);g.add(beam);
    for(const x0 of[-4.4,-1.5,1.5,4.4]){const lift=new THREE.Mesh(new THREE.BoxGeometry(.16,2.9,.16),limeM);lift.position.set(x0,1.45,-2.8);g.add(lift);const head=new THREE.Mesh(new THREE.BoxGeometry(1,.08,.3),redM);head.position.set(x0,2.85,-2.8);g.add(head)}
    const work=new THREE.Mesh(new THREE.BoxGeometry(7.2,.16,1),metalM);work.position.set(0,.98,5.8);g.add(work);
    const ramp=new THREE.Mesh(new THREE.BoxGeometry(5.8,.3,8),new THREE.MeshStandardMaterial({color:0x26362d,roughness:.7,metalness:.25}));ramp.position.set(0,2.0,10.5);ramp.rotation.x=-.22;g.add(ramp);
    const title=labelSprite('SUPER HOME GARAGE',{w:7.4,size:62,color:'#edffe9',glow:'#c8ff43',plate:true});title.position.set(0,3.35,5.3);g.add(title);
    const l1=new THREE.PointLight(0xc8ff43,20,18,2);l1.position.set(-3,3,1);g.add(l1);const l2=new THREE.PointLight(0x4dd2ff,18,18,2);l2.position.set(3,3,-6);g.add(l2);
  }

  /* ---------- smart NPC traffic · every road car is a Benz ---------- */
  function loopCurve(H,ccw){const r=7,pts=[];const corners=ccw?[[H-r,H-r,0],[-(H-r),H-r,Math.PI/2],[-(H-r),-(H-r),Math.PI],[H-r,-(H-r),Math.PI*1.5]]:[[H-r,-(H-r),Math.PI*1.5],[-(H-r),-(H-r),Math.PI],[-(H-r),H-r,Math.PI/2],[H-r,H-r,0]];
    for(const [cx,cz,a0] of corners){for(let i=0;i<=4;i++){const a=ccw?a0+i/4*Math.PI/2:a0-i/4*Math.PI/2;pts.push(new V3(cx+Math.cos(a)*r,.55,cz+Math.sin(a)*r))}}return new THREE.CatmullRomCurve3(pts,true,'catmullrom',.4)}
  const roadBenzSeed=createBenz(renderer,{noBeam:true}),trafficEnv=roadBenzSeed.env;
  const TRAFFIC_PAINTS=[0,1,2,3,1,0,2,3,0,1,2,3,1,0];
  function makeTrafficBenz(i){
    const b=i===0?roadBenzSeed:createBenz(renderer,{env:trafficEnv,noBeam:true});
    b.setPaint(TRAFFIC_PAINTS[i%TRAFFIC_PAINTS.length]);b.setLights(true);scene.add(b.group);return b
  }
  const cars=[];
  {const L=[[38.2,false],[33.8,true]];L.forEach(([H,ccw],li)=>{const cv=loopCurve(H,ccw),len=cv.getLength();
    for(let i=0;i<3;i++){const b=makeTrafficBenz(cars.length);cars.push({g:b.group,b,cv,len,u:(i/5+li*.07)%1,v:rnd(8.5,12.5),cruise:rnd(9.5,13.5),steer:0,roll:0,pit:0,_pv:0,brake:false,loop:true,id:'ring-'+li+'-'+i})}
  })}
  [[-1,-72,-10,2.2],[1,72,10,-2.2]].forEach(([dir,start,end,off],i)=>{
    const horiz=i<2,b=makeTrafficBenz(cars.length);
    cars.push({g:b.group,b,shuttle:true,start,end,off,horiz,t:rnd(0,1),dir:1,v:rnd(8.2,11.8),cruise:rnd(9.2,12.8),steer:0,roll:0,pit:0,_pv:0,brake:false,id:'shuttle-'+i})
  });
  function wrapAng(a){return Math.atan2(Math.sin(a),Math.cos(a))}
  function trafficLead(c){
    let gap=1e9,lead=null;
    if(c.loop){
      for(const o of cars)if(o!==c&&o.loop&&o.cv===c.cv){
        const du=(o.u-c.u+1)%1;if(du>.001&&du<gap/c.len){gap=du*c.len;lead=o}
      }
    }else{
      for(const o of cars)if(o!==c&&o.shuttle&&o.horiz===c.horiz&&Math.abs(o.off-c.off)<.01){
        const ds=Math.sign(c.end-c.start)*c.dir*(o.horiz?o.g.position.x-c.g.position.x:o.g.position.z-c.g.position.z);
        if(ds>0&&ds<gap){gap=ds;lead=o}
      }
    }
    return{gap,lead}
  }
  function trafficTargetSpeed(c,dt){
    let target=c.cruise,brake=false;
    const lead=trafficLead(c);if(lead.lead){
      const desiredGap=7.2+Math.min(7,c.v*.55);
      if(lead.gap<desiredGap){target=Math.min(target,clamp(lead.lead.v*(lead.gap/desiredGap),2.8,lead.lead.v));brake=lead.gap<desiredGap*.78}
    }
    // Yield naturally at the four road-crossing zones instead of clipping through traffic.
    const nearCross=Math.min(
      Math.hypot(c.g.position.x-36,c.g.position.z-2.2),Math.hypot(c.g.position.x-36,c.g.position.z+2.2),
      Math.hypot(c.g.position.x+36,c.g.position.z-2.2),Math.hypot(c.g.position.x+36,c.g.position.z+2.2),
      Math.hypot(c.g.position.x-2.2,c.g.position.z-36),Math.hypot(c.g.position.x+2.2,c.g.position.z-36),
      Math.hypot(c.g.position.x-2.2,c.g.position.z+36),Math.hypot(c.g.position.x+2.2,c.g.position.z+36)
    );
    if(nearCross<6.5){
      for(const o of cars)if(o!==c){
        const d=Math.hypot(o.g.position.x-c.g.position.x,o.g.position.z-c.g.position.z);
        const rel=(o.g.position.x-c.g.position.x)*(-Math.sin(c.g.rotation.y))+(o.g.position.z-c.g.position.z)*(-Math.cos(c.g.rotation.y));
        if(d<10&&rel>0){target=Math.min(target,4.8);brake=true}
      }
    }
    // Give the player a little road etiquette when they are driving through town.
    if(car.on){
      const dx=car.x-c.g.position.x,dz=car.z-c.g.position.z,d=Math.hypot(dx,dz);const ahead=dx*(-Math.sin(c.g.rotation.y))+dz*(-Math.cos(c.g.rotation.y));
      if(d<15&&ahead>0)target=Math.min(target,clamp(Math.abs(car.v)+1,3.5,10));if(d<8&&ahead>0)brake=true;
    }
    return{target:clamp(target,0,16),brake}
  }


  /* ---------- SUPER BENZ: parked at the front of Super Home, drivable ---------- */
  const benz=createBenz(renderer,{env:trafficEnv});scene.add(benz.group);const urus=createUrus(renderer,{env:trafficEnv,noBeam:true});scene.add(urus.group);
  const PARK={x:-40.4,z:10.6,h:Math.PI},URUS_PARK={x:-67,z:20.6,h:Math.PI};
  const car={on:false,x:PARK.x,z:PARK.z,h:PARK.h,v:0,st:0,roll:0,pit:0,brake:false,lights:0,in:{x:0,z:0,boost:false}};let driveKind='benz',driveModel=benz;
  benz.group.position.set(car.x,.02,car.z);benz.group.rotation.y=car.h;urus.group.position.set(URUS_PARK.x,GARAGE.floor+.02,URUS_PARK.z);urus.group.rotation.y=URUS_PARK.h;benz.group.renderOrder=2;urus.group.renderOrder=2;benz.group.frustumCulled=false;urus.group.frustumCulled=false;
  const bayM=new THREE.MeshBasicMaterial({color:0xc8ff43,transparent:true,opacity:.75,fog:false});
  {const bay=new THREE.Group();bay.position.set(PARK.x,.05,PARK.z);scene.add(bay);
   for(const [w,d,x,z] of[[.12,6.2,-1.55,0],[.12,6.2,1.55,0],[3.22,.12,0,-3.1],[3.22,.12,0,3.1]]){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.03,d),bayM);m.position.set(x,0,z);bay.add(m)}
   const pl=new THREE.Mesh(new THREE.PlaneGeometry(3.1,6.1),new THREE.MeshBasicMaterial({color:0x0a1a12,transparent:true,opacity:.55,depthWrite:false}));pl.rotation.x=-Math.PI/2;pl.position.y=-.02;bay.add(pl)}
  const benzSign=labelSprite('SUPER BENZ',{w:3.6,size:64,color:'#eaf7ed',glow:'#c8ff43',plate:true});benzSign.position.set(PARK.x,2.9,PARK.z);scene.add(benzSign);
  let eng=null;
  function engineStart(){if(eng){if(eng.ac.state==='suspended')eng.ac.resume();return}
    try{const ac=new(window.AudioContext||window.webkitAudioContext)(),o=ac.createOscillator(),o2=ac.createOscillator(),g=ac.createGain(),f=ac.createBiquadFilter();
      o.type='sawtooth';o2.type='triangle';f.type='lowpass';f.frequency.value=420;g.gain.value=0;o.connect(f);o2.connect(f);f.connect(g);g.connect(ac.destination);o.start();o2.start();eng={ac,o,o2,g,f}}catch(e){}}
  function engineTick(){if(!eng)return;const sp=Math.abs(car.v),t=eng.ac.currentTime,on=car.on&&soundOn;
    eng.o.frequency.setTargetAtTime(46+sp*4.2,t,.08);eng.o2.frequency.setTargetAtTime(23+sp*2.1,t,.08);eng.f.frequency.setTargetAtTime(300+sp*38,t,.1);eng.g.gain.setTargetAtTime(on?.035+Math.min(.05,sp*.0026):0,t,.12)}
  const seatToWorld=(sx,sz)=>{const c=Math.cos(car.h),s=Math.sin(car.h);return{x:car.x+sx*c+sz*s,z:car.z-sx*s+sz*c}};
  function vehicleModel(kind){return kind==='urus'?urus:benz}
  function carReset(){car.on=false;driveKind='benz';driveModel=benz;car.x=PARK.x;car.z=PARK.z;car.h=PARK.h;car.v=0;car.st=0;benz.group.position.set(car.x,.02,car.z);benz.group.rotation.y=car.h;benzSign.visible=true;urus.group.position.set(URUS_PARK.x,GARAGE.floor+.02,URUS_PARK.z);urus.group.rotation.y=URUS_PARK.h;urus.group.visible=true}
  function enterCar(kind='benz'){
    if(car.on)return;const model=vehicleModel(kind),p=model.group.position;driveKind=kind;driveModel=model;car.on=true;car.x=p.x;car.z=p.z;car.h=model.group.rotation.y;car.v=0;P.mode='walk';P.floor=0;P.vx=P.vy=P.vz=0;yaw=car.h;pitch=.24;camD=11;model.group.visible=true;benzSign.visible=false;engineStart();toast((kind==='urus'?'SUPER URUS':'SUPER BENZ')+' · WASD DRIVE · SHIFT BOOST · SPACE BRAKE · R PAINT · F EXIT');emit(car.x,garageIn?-0.8:0.8,car.z,22,0xc8ff43,3,1,2,.8)}
  function exitCar(){
    if(!car.on)return;car.on=false;car.v=0;const o=seatToWorld(-2.6,.35);P.x=o.x;P.z=o.z;P.y=garageIn?GARAGE.floor:0;P.vx=P.vz=P.vy=0;P.wr=0;driveModel.setBrake(false);driveModel.setLights(false);toast((driveKind==='urus'?'URUS':'BENZ')+' PARKED · F NEAR A CAR TO DRIVE AGAIN');emit(P.x,P.y+.6,P.z,10,0xc8ff43,2,1,2,.6)}
  function updateCar(dt,locked){
    const inp=car.in;let thr=0,str=0,boost=false,hand=false;
    if(car.on&&!locked){thr=clamp(-inp.z,-1,1);str=clamp(-inp.x,-1,1);boost=inp.boost;hand=keys.has(' ')}
    const vmax=boost?30:21;let target=thr>0?thr*vmax:thr<0?thr*8:0;
    const braking=hand||(thr<0&&car.v>.6)||(thr>0&&car.v<-.6);
    let rate=braking?36:thr!==0?(boost?16:11):3.6;if(hand)target=0;
    car.v+=clamp(target-car.v,-rate*dt,rate*dt);if(!car.on&&Math.abs(car.v)<.05)car.v=0;
    car.st+=(str-car.st)*(1-Math.exp(-dt*7));
    const sp=Math.abs(car.v),steerA=car.st*lerp(.52,.2,clamp(sp/24,0,1));
    car.h+=(car.v/3.0)*Math.tan(steerA)*dt;
    const ox=car.x,oz=car.z;car.x+=-Math.sin(car.h)*car.v*dt;car.z+=-Math.cos(car.h)*car.v*dt;
    if(garageIn){car.x=clamp(car.x,GARAGE.x-GARAGE.w/2+1.1,GARAGE.x+GARAGE.w/2-1.1);car.z=clamp(car.z,GARAGE.z-GARAGE.d/2+1.1,GARAGE.z+GARAGE.d/2-1.1);if(car.z>GARAGE.doorZ-.7){garageIn=false;P.y=0;car.v=0;toast('GARAGE EXIT · BACK IN SUPER TOWN')}}else{
    // collisions: three circles along the body + a solid footprint for Super Home
    let cx=0,cz=0;
    for(const off of[-1.5,0,1.5]){const o={x:car.x+(-Math.sin(car.h))*off,z:car.z+(-Math.cos(car.h))*off};const ax=o.x,az=o.z;pushOut(o,1.15,0);cx+=o.x-ax;cz+=o.z-az}
    {const m=1.1,dx=car.x-HS.HX0,dz=car.z-HS.HZ0,ox2=HS.hx+m-Math.abs(dx),oz2=HS.hz+m-Math.abs(dz);if(ox2>0&&oz2>0){if(ox2<oz2)cx+=Math.sign(dx||1)*ox2;else cz+=Math.sign(dz||1)*oz2}}
    const hit=Math.hypot(cx,cz);if(hit>.001){car.x+=cx;car.z+=cz;car.v*=Math.max(.2,1-hit*6);if(hit>.12&&car.on)emit(car.x,.6,car.z,8,0xffc83d,3,1,3,.5)}
    const pr=Math.hypot(car.x,car.z);if(pr>ISL-4){car.x*=(ISL-4)/pr;car.z*=(ISL-4)/pr;car.v*=.6}
    }
    const accel=(car.v-(car._pv||0))/Math.max(dt,.001);car._pv=car.v;
    car.roll+=((-car.st*sp*.0045)-car.roll)*(1-Math.exp(-dt*6));car.pit+=((clamp(accel*.0035,-.05,.05))-car.pit)*(1-Math.exp(-dt*6));
    driveModel.group.position.set(car.x,garageIn?GARAGE.floor+.02:.02,car.z);driveModel.group.rotation.y=car.h;driveModel.pose(car.v,steerA,dt,car.roll,car.pit);driveModel.setBrake(braking&&sp>.4||(car.on&&hand));driveModel.setLights(car.on);if(driveKind==='benz')benzSign.visible=!car.on;
    if(car.on){
      P.x=car.x;P.z=car.z;P.y=garageIn?GARAGE.floor:0;P.gy=P.y;P.ground=true;P.vx=-Math.sin(car.h)*car.v;P.vz=-Math.cos(car.h)*car.v;P.wr=2;P.ph=0;P.floor=0;P.mode='walk';
      if(!drag&&car.v>1.5){let d=car.h-yaw;d=Math.atan2(Math.sin(d),Math.cos(d));yaw+=d*(1-Math.exp(-dt*1.7))}
      if((boost&&sp>12||hand&&sp>8)&&Math.random()<dt*50){const r=seatToWorld(Math.random()<.5?-1:1,1.5);emit(r.x,.15,r.z,1,boost?0xc8ff43:0xcfeede,1,.4,1,.5)}
    }
    engineTick();
  }

  /* ---------- planes + blimp ---------- */
  function makePlane(){const g=new THREE.Group(),wm=new THREE.MeshStandardMaterial({color:0xe9f4ea,roughness:.3,metalness:.5});
    const f=new THREE.Mesh(new THREE.CylinderGeometry(.9,.9,10,14),wm);f.rotation.x=Math.PI/2;g.add(f);const n=new THREE.Mesh(new THREE.ConeGeometry(.9,3,14),wm);n.rotation.x=-Math.PI/2;n.position.z=-6.5;g.add(n);const t=new THREE.Mesh(new THREE.ConeGeometry(.9,3.4,14),wm);t.rotation.x=Math.PI/2;t.position.z=6.6;g.add(t);
    const w=new THREE.Mesh(new THREE.BoxGeometry(15,.22,2.8),wm);w.position.set(0,-.2,.6);g.add(w);const tp=new THREE.Mesh(new THREE.BoxGeometry(5.4,.18,1.6),wm);tp.position.set(0,.3,5.8);g.add(tp);const fin=new THREE.Mesh(new THREE.BoxGeometry(.2,2.6,2),limeM);fin.position.set(0,1.6,5.6);g.add(fin);
    const st=new THREE.Mesh(new THREE.BoxGeometry(.04,.3,9.6),limeM);st.position.set(.9,.1,0);g.add(st);const st2=st.clone();st2.position.x=-.9;g.add(st2);
    for(const x of[-4,4]){const e=new THREE.Mesh(new THREE.CylinderGeometry(.5,.5,2.2,10),metalM);e.rotation.x=Math.PI/2;e.position.set(x,-.7,-.4);g.add(e)}
    const l1=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff2a2a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),l2=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0x2aff5a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),l3=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));
    for(const l of[l1,l2,l3])l.scale.set(2.6,2.6,1);l1.position.set(-7.6,-.1,.6);l2.position.set(7.6,-.1,.6);l3.position.set(0,1.1,6);g.add(l1,l2,l3);g.scale.setScalar(2.2);scene.add(g);return{g,strobe:l3}}
  const planes=[[170,98,.05,0],[215,125,-.04,2],[250,82,.035,4]].map(([R,y,w,ph])=>({...makePlane(),R,y,w,a:ph,ct:0}));
  const blimp=new THREE.Group();scene.add(blimp);
  {const body=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),new THREE.MeshStandardMaterial({color:0x1a3a22,roughness:.4,metalness:.5,emissive:0x0a2a10}));body.scale.set(20,7,7);blimp.add(body);
   const gon=new THREE.Mesh(new THREE.BoxGeometry(5,1.6,2.4),metalM);gon.position.y=-7.6;blimp.add(gon);for(const x of[-2,2]){const s=new THREE.Mesh(new THREE.BoxGeometry(.2,1.4,.2),metalM);s.position.set(x,-6.6,0);blimp.add(s)}
   const bb=new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,color:0xdfffd8,side:THREE.DoubleSide});const scr=new THREE.Mesh(new THREE.PlaneGeometry(15,5.2),bb);scr.position.set(0,0,7.05);blimp.add(scr);const scr2=scr.clone();scr2.position.z=-7.05;scr2.rotation.y=Math.PI;blimp.add(scr2);
   loadTex('assets/lobby/supercycle-logo.webp',t=>{bb.map=t;bb.needsUpdate=true});for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.BoxGeometry(.2,6,5),s>0?limeM:redM);f.position.set(-20,0,0);f.rotation.x=s>0?0:Math.PI/2;blimp.add(f)}}

  /* ---------- sprites: bots + the flyer ---------- */
  const fronts=[];const flyF=[];
  for(let v=1;v<=7;v++)loadTex('assets/mingle/p'+v+'.webp',t=>{fronts[v]=[...Array(8)].map((_,f)=>{const c=t.clone();c.needsUpdate=true;c.repeat.set(1/8,1);c.offset.set(f/8,0);return new THREE.SpriteMaterial({map:c,alphaTest:.3,fog:true})})});
  const flyTint=[0xffffff,0xffd9d9,0xd9f0ff,0xe9ffd9,0xfff0c8,0xf0d9ff];let flyTex=null;const flyMats={};
  loadTex('assets/lobby/flyer.webp',t=>{flyTex=t;for(let r=0;r<4;r++){flyF[r]=[];for(let c=0;c<4;c++){const x=t.clone();x.needsUpdate=true;x.repeat.set(.25,.25);x.offset.set(c*.25,1-(r+1)*.25);flyF[r][c]=x}}});
  function flyMat(r,c,tint){const k=r*4+c+'_'+tint;return flyMats[k]??=new THREE.SpriteMaterial({map:flyF[r][c],alphaTest:.25,fog:true,color:tint})}
  const FW=2.5*392/311,FH=2.5;
  const WK={cw:118,ch:142},walkF=[],walkMats={};
  loadTex('assets/walk/walk.webp',t=>{for(let r=0;r<8;r++){walkF[r]=[];for(let c=0;c<8;c++){const x=t.clone();x.needsUpdate=true;x.repeat.set(.125,.125);x.offset.set(c*.125,1-(r+1)*.125);walkF[r][c]=x}}});
  const walkMat=(r,c,tint)=>walkMats[r*8+c+'_'+tint]??=new THREE.SpriteMaterial({map:walkF[r][c],alphaTest:.3,fog:true,color:tint});
  const WH=2.4,WW=WH*WK.cw/WK.ch;
  // shared particles
  const MAXP=600,pPos=new Float32Array(MAXP*3),pCol=new Float32Array(MAXP*3),pVel=new Float32Array(MAXP*3),pLife=new Float32Array(MAXP),pMax=new Float32Array(MAXP),pBase=new Float32Array(MAXP*3),pG=new Float32Array(MAXP);pPos.fill(-9999);let pHead=0;
  const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  scene.add(Object.assign(new THREE.Points(pGeo,new THREE.PointsMaterial({size:.8,map:glowTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),{frustumCulled:false}));
  function emit(x,y,z,n,color,sp=2,up=1,grav=3,life=1){const c=new THREE.Color(color);for(let k=0;k<n;k++){const i=pHead;pHead=(pHead+1)%MAXP;const a=rnd(0,6.283),s=sp*rnd(.2,1);pPos.set([x,y,z],i*3);pVel.set([Math.cos(a)*s,rnd(.2,1)*up*sp,Math.sin(a)*s],i*3);pBase.set([c.r,c.g,c.b],i*3);pLife[i]=pMax[i]=life*rnd(.6,1.3);pG[i]=grav}}
  function updP(dt){for(let i=0;i<MAXP;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;if(pLife[i]<=0){pPos[j+1]=-9999;pCol[j]=pCol[j+1]=pCol[j+2]=0;continue}pVel[j+1]-=pG[i]*dt;pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f*1.6;pCol[j+1]=pBase[j+1]*f*1.6;pCol[j+2]=pBase[j+2]*f*1.6}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}

  /* ---------- collisions + walkable ---------- */
  const blocked=(x,z,m=0,maxH=1e9)=>{for(const b of B)if(b.h<maxH&&Math.abs(x-b.x)<b.hw+m&&Math.abs(z-b.z)<b.hd+m)return b;return null};
  function pushOut(o,r,y){for(const b of B){if(y>b.h+1.5)continue;const dx=o.x-b.x,dz=o.z-b.z,ox=b.hw+r-Math.abs(dx),oz=b.hd+r-Math.abs(dz);if(ox>0&&oz>0){if(ox<oz)o.x+=Math.sign(dx||1)*ox;else o.z+=Math.sign(dz||1)*oz}}}
  function randWalk(){for(let k=0;k<40;k++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*96,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!blocked(x,z,2.2)&&Math.hypot(x+50,z-18)>22)return[x,z]}return[0,12]}

  /* ---------- NPC residents ---------- */
  const npcs=[];const used=new Set();
  const uname=()=>{let n;do{n=pick(NAMES)+(Math.random()<.5?'':Math.floor(rnd(1,99)))}while(used.has(n));used.add(n);return n};
  for(let i=0;i<24;i++){const [x,z]=randWalk(),variant=1+(i%7),name=uname(),sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);scene.add(sp);
    const tag=labelSprite(name,{w:2.6,size:54,color:'#e9f6ea',glow:'#7ddc1f',plate:true});scene.add(tag);const sh=new THREE.Mesh(new THREE.CircleGeometry(.7,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.08;scene.add(sh);
    npcs.push({kind:'walk',newS:i%3===0,tint:[0xffffff,0xffb0b0,0xb0d0ff,0xe0b0ff,0xffe0a0,0xb0ffe0][i%6],name,variant,sp,tag,sh,x,z,vx:0,vz:0,tx:x,tz:z,wait:rnd(0,3),spd:rnd(1.5,2.6),ph:rnd(0,1),face:1,say:rnd(6,30),bub:null,bt:0,hop:0,stuck:0})}
  // 12 Super Office workers.
  for(let i=0;i<8;i++){const name=['aria','milo','sora','niko','tess','leo','remy','ivy'][i],sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);scene.add(sp);const tag=labelSprite(name.toUpperCase(),{w:3,size:50,color:'#dff5e7',glow:'#4dd2ff',plate:true});scene.add(tag);const sh=new THREE.Mesh(new THREE.CircleGeometry(.7,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.08;scene.add(sh);npcs.push({kind:'walk',worker:true,newS:true,tint:[0xffd9a0,0xd9f0ff,0xe9ffd9,0xffc7da,0xf0d9ff,0xd6fff0][i%6],name,variant:1+(i%7),sp,tag,sh,x:OFF.x+((i%4)-1.5)*3.2,z:OFF.z+((i%3)-1)*3.5,vx:0,vz:0,tx:OFF.x,tz:OFF.z,wait:rnd(0,2),spd:rnd(1.6,2.3),ph:rnd(0,1),face:1,fs:1,say:rnd(4,15),bub:null,bt:0,hop:0,stuck:0})}
  for(let i=0;i<4;i++){const name=uname(),sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.25,fog:true}));sp.scale.set(FW*.9,FH*.9,1);scene.add(sp);const tag=labelSprite(name,{w:2.6,size:54,color:'#e9f6ea',glow:'#4dd2ff',plate:true});scene.add(tag);
    npcs.push({kind:'fly',name,tint:flyTint[i%flyTint.length],sp,tag,x:rnd(-80,80),y:rnd(8,34),z:rnd(-80,80),vx:0,vy:0,vz:0,tx:rnd(-90,90),ty:rnd(8,40),tz:rnd(-90,90),spd:rnd(8,14),ph:rnd(0,3),row:1,say:rnd(8,30),bub:null,bt:0})}
  $('#twPop').textContent=npcs.length+1+' IN TOWN · OPEN WORLD';

  /* ---------- the player (the flyer) ---------- */
  const P={x:0,y:0,z:20,vx:0,vy:0,vz:0,row:1,ph:0,boost:0,bub:null,bt:0,mode:'walk',floor:0,fx:1,wr:0,riding:false,gy:0,ground:true};
  const heroMat=new THREE.SpriteMaterial({transparent:true,alphaTest:.25,fog:true});let heroInit=false;
  const hero=new THREE.Sprite(heroMat);hero.scale.set(FW,FH,1);hero.renderOrder=3;scene.add(hero);
  const heroSh=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.45,depthWrite:false}));heroSh.rotation.x=-Math.PI/2;heroSh.position.y=.09;scene.add(heroSh);
  const heroTag=labelSprite('YOU',{w:1.8,size:58,color:'#0a1405',glow:'#d4ff3a',plate:false});scene.add(heroTag);
  const youPlate=(()=>{const c=document.createElement('canvas');c.width=512;c.height=112;const x=c.getContext('2d');x.fillStyle='#d4ff3a';x.beginPath();x.roundRect(150,12,212,88,26);x.fill();x.fillStyle='#0a1405';x.font='800 58px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('YOU',256,58);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
  heroTag.material.map=youPlate;heroTag.material.blending=THREE.NormalBlending;heroTag.material.needsUpdate=true;heroTag.scale.set(2.4,2.4*112/512,1);
  let yaw=0,pitch=.34,camD=12,RX=1,RZ=0,FX=0,FZ=-1;const keys=new Set();let joy={x:0,z:0},upBtn=false,dnBtn=false,boostBtn=false;

  /* ---------- UI ---------- */
  const logEl=$('#twLog'),inEl=$('#twIn'),promptEl=$('#twPrompt'),toastEl=$('#twToast'),flashEl=$('#twFlash'),menu=$('#twMenu');
  let toastT=0;const toast=t=>{toastEl.textContent=t;toastEl.classList.add('on');toastT=1.8};
  function log(who,t,cls=''){const d=document.createElement('div');if(cls)d.className=cls;if(who){const b=document.createElement('b');b.textContent=who+': ';d.appendChild(b)}d.appendChild(document.createTextNode(t));logEl.appendChild(d);setTimeout(()=>d.remove(),9000);while(logEl.children.length>6)logEl.firstChild.remove()}
  function say(o,text,secs=4){if(o.bub){o.bub.parent&&o.bub.parent.remove(o.bub);o.bub.material.map.dispose();o.bub.material.dispose()}o.bub=bubble(text);scene.add(o.bub);o.bt=secs}
  function clearBub(o){if(o.bub){scene.remove(o.bub);o.bub.material.map.dispose();o.bub.material.dispose();o.bub=null}}
  const GAMEDEF=[['bridge','GLASS BRIDGE','assets/previews/glass-bridge.jpg'],['rl','RED LIGHT · GREEN LIGHT','assets/previews/red-light.jpg'],['mingle','MINGLE','assets/previews/mingle.jpg'],['story','EYE WORLD','assets/previews/story.jpg']];
  $('#twGames').innerHTML=GAMEDEF.map(([k,n,i])=>`<button data-g="${k}"><img src="${BASE}${i}" alt=""><span>${n}</span></button>`).join('');
  $('#twGames').querySelectorAll('button').forEach(b=>b.onclick=()=>{menu.classList.remove('on');go(b.dataset.g)});
  function openMenu(){menu.classList.add('on')}$('#twClose').onclick=()=>menu.classList.remove('on');
  let going=false;function go(k){if(going)return;going=true;toast('LOADING…');flashEl.style.opacity=1;emit(P.x,P.y,P.z,40,0xc8ff43,6,1,2,1);setTimeout(()=>{if(api.onPortal)api.onPortal(k);setTimeout(()=>{flashEl.style.opacity=0;going=false},500)},380)}
  root.querySelectorAll('[data-em]').forEach(b=>b.onclick=()=>{say(P,b.dataset.em,3);P.vy=Math.max(P.vy,7);emit(P.x,P.y+1,P.z,14,0xffc83d,3,1,2,.9);folk.onEmote();const n=nearestNpc(30);if(n&&Math.random()<.7)setTimeout(()=>say(n,pick(['👋','hey!','😄','🔥']),3),600)});
  $('#twBoost').onpointerdown=()=>boostBtn=true;$('#twBoost').onpointerup=$('#twBoost').onpointerleave=()=>boostBtn=false;
  $('#twUp').onpointerdown=()=>upBtn=true;$('#twDn').onpointerdown=()=>dnBtn=true;for(const id of['#twUp','#twDn'])for(const ev of['pointerup','pointerleave','pointercancel'])$(id).addEventListener(ev,()=>{upBtn=dnBtn=false});
  $('#twAll').onclick=()=>api.onExit&&api.onExit();
  const music=new Audio(BASE+'CREATE_A_MUSIC_ABOUT_A_COIN_CA.mp3');music.loop=true;music.volume=.3;music.preload='auto';
  $('#twSound').onclick=()=>{soundOn=!soundOn;$('#twSound').textContent='SOUND: '+(soundOn?'ON':'OFF');soundOn?music.play().catch(()=>{}):music.pause()};
  function nearestNpc(r){let b=null,bd=r;for(const n of npcs){const d=Math.hypot(n.x-P.x,(n.y||0)-P.y,n.z-P.z);if(d<bd){bd=d;b=n}}return b}
  const elevEl=$('#twElev');let elevOn=false,elevTgt=-1;
  elevEl.querySelectorAll('button').forEach(b=>b.onclick=()=>HS.go(+b.dataset.f));
  function updateFlyBtn(){$('#twFly').textContent='FLY: '+(P.mode==='fly'?'ON':'OFF')}
  function toggleFly(){if(P.mode==='walk'){P.mode='fly';P.vy=4;P.y+=1.2;toast('FLIGHT MODE · SPACE UP · C DOWN')}else{P.mode='walk';P.vy=0;P.floor=HS.inHouse(P.x,P.z)?clamp(Math.floor((P.y+.45)/HS.FH),0,2):0;toast('WALKING MODE · V TO FLY')}updateFlyBtn();emit(P.x,P.y+1,P.z,16,0xc8ff43,3,1,2,.8)}
  function spawnHome(){garageIn=false;interiorKey=null;carReset();P.mode='walk';P.floor=0;P.x=HS.spawn.x;P.z=HS.spawn.z;P.y=0;P.vx=P.vy=P.vz=0;P.riding=false;yaw=-1.12;pitch=.36;camD=9;HS.E.y=0;HS.E.floor=0;HS.E.tgt=0;HS.E.state='open';HS.E.door=1;updateFlyBtn();camP.set(P.x-8,4,P.z);camL.set(P.x,1.5,P.z);guards&&guards.reset()}
  $('#twFly').onclick=toggleFly;$('#twHome').onclick=()=>{spawnHome();toast('HOME SWEET HOME')};
  inEl.addEventListener('focus',()=>typing=true);inEl.addEventListener('blur',()=>typing=false);
  inEl.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){const t=inEl.value.trim();inEl.value='';inEl.blur();if(t){log('YOU',t,'me');say(P,t,5);if(!(guards&&guards.onChat(t))&&!folk.onChat(t)){const n=nearestNpc(60);if(n)setTimeout(()=>{const r=pick(REPLIES);say(n,r,4);log(n.name,r)},rnd(1200,3200))}}}else if(e.key==='Escape'){inEl.blur()}});

  // minimap
  const mapC=$('#twMap'),mx=mapC.getContext('2d'),mapBase=document.createElement('canvas');mapBase.width=mapBase.height=150;
  {const x=mapBase.getContext('2d'),S=75/ISL;x.fillStyle='#04100a';x.fillRect(0,0,150,150);x.beginPath();x.arc(75,75,73,0,6.283);x.fillStyle='#0b2416';x.fill();x.strokeStyle='#7ddc1f';x.lineWidth=2;x.stroke();x.fillStyle='#14281d';for(const c of ROADS){x.fillRect(75-ISL*S,75+c*S-RW*S/2,ISL*S*2,RW*S);x.fillRect(75+c*S-RW*S/2,75-ISL*S,RW*S,ISL*S*2)}
   for(const b of B){x.fillStyle=b.name?'#d4ff3a':'#3d6a4a';x.fillRect(75+(b.x-b.hw)*S,75+(b.z-b.hd)*S,b.hw*2*S,b.hd*2*S)}}
  let mapT=0;function drawMap(dt){mapT-=dt;if(mapT>0)return;mapT=.1;const S=75/ISL;mx.drawImage(mapBase,0,0);if(!car.on){mx.fillStyle='#ffffff';mx.fillRect(75+car.x*S-2.5,75+car.z*S-2.5,5,5)}
    for(const n of npcs){mx.fillStyle=n.kind==='fly'?'#4dd2ff':'#e9f6ea';mx.fillRect(75+n.x*S-1,75+n.z*S-1,2,2)}for(const c of cars){mx.fillStyle='#ff4d4f';mx.fillRect(75+c.g.position.x*S-1.5,75+c.g.position.z*S-1.5,3,3)}
    mx.save();mx.translate(75+P.x*S,75+P.z*S);mx.rotate(-yaw);mx.fillStyle='#d4ff3a';mx.beginPath();mx.moveTo(0,-6);mx.lineTo(4.5,5);mx.lineTo(-4.5,5);mx.closePath();mx.fill();mx.restore()}

  /* ---------- input ---------- */
  const kd=e=>{if(!visible)return;if(typing)return;const k=e.key.toLowerCase();
    if(k==='enter'){e.preventDefault();e.stopImmediatePropagation();inEl.focus();return}
    if(k==='v'){e.preventDefault();e.stopImmediatePropagation();if(!car.on)toggleFly();return}
    if(k==='r'&&(car.on||Math.hypot(P.x-car.x,P.z-car.z)<7||Math.hypot(P.x-urus.group.position.x,P.z-urus.group.position.z)<7)){e.preventDefault();e.stopImmediatePropagation();const vm=car.on?driveModel:(garageIn?urus:benz);const pt=vm.nextPaint();toast((vm===urus?'URUS':'BENZ')+' PAINT · '+pt.name);emit(vm.group.position.x,garageIn?-.7:1,vm.group.position.z,14,0xc8ff43,3,1,2,.7);return}
    if((k==='1'||k==='2'||k==='3')&&P.riding){e.preventDefault();e.stopImmediatePropagation();HS.go(+k-1);return}
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','c','q','e','f','shift','control'].includes(k)){e.preventDefault();e.stopImmediatePropagation();keys.add(k);if(k==='f')interact()}
    if(k==='escape'){e.stopImmediatePropagation();if(menu.classList.contains('on'))menu.classList.remove('on');else if(api.onExit)api.onExit()}};
  addEventListener('keydown',kd,true);addEventListener('keyup',e=>{if(visible)keys.delete(e.key.toLowerCase())},true);addEventListener('blur',()=>keys.clear());
  const joyEl=$('#twJoy'),knob=joyEl.firstElementChild;let jid=null;
  const jset=e=>{const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=(e.clientX-cx)/(r.width/2),dy=(e.clientY-cy)/(r.height/2);const m=Math.hypot(dx,dy);if(m>1){dx/=m;dy/=m}joy.x=dx;joy.z=dy;knob.style.transform=`translate(${dx*36}px,${dy*36}px)`};
  joyEl.addEventListener('pointerdown',e=>{jid=e.pointerId;joyEl.setPointerCapture(jid);jset(e);e.preventDefault()});joyEl.addEventListener('pointermove',e=>{if(e.pointerId===jid)jset(e)});
  for(const ev of['pointerup','pointercancel'])joyEl.addEventListener(ev,()=>{jid=null;joy.x=joy.z=0;knob.style.transform=''});
  let drag=null;renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId}});
  addEventListener('pointermove',e=>{if(!drag||!visible||e.pointerId!==drag.id)return;yaw-=(e.clientX-drag.x)*.006;pitch=clamp(pitch+(e.clientY-drag.y)*.004,.08,1.25);drag.x=e.clientX;drag.y=e.clientY});
  addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camD=clamp(camD+e.deltaY*.01,5,26)},{passive:false});
  let curSpot=null;promptEl.onclick=()=>interact();
  function interact(){if(curSpot&&!going&&!menu.classList.contains('on'))curSpot.act()}

  /* ---------- simulation ---------- */
  /* ---------- resident brain (personalities, routines, chat, events) ---------- */
  const carPt={x:0,z:0},trafficPts=[...cars.map(c=>c.g.position),carPt];
  const folk=makeFolk({THREE,scene,npcs,B,ROADS,RW,pois:dressing.pois,P,car,say,log,toast,emit,getRight:()=>[RX,RZ],blocked,pushOut,randWalk,blimp,LINES,
    traffic:()=>{carPt.x=car.x;carPt.z=car.z;return trafficPts},archOf:i=>i>=24&&i<32?'worker':null,
    circles:[{x:0,z:0,r:7.4},...PARKS.map(([x,z])=>({x,z,r:6.5}))]});
  npcs.forEach((n,i)=>{if(n.kind==='walk')folk.adopt(n,i)});
  /* ---------- bodyguards + escort Benzes ---------- */
  function spawnGuard(i){const name='GUARD '+(i+1),sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);scene.add(sp);
    const tag=labelSprite(name,{w:2.6,size:54,color:'#ffe9e9',glow:'#ff4d4f',plate:true});scene.add(tag);
    const sh=new THREE.Mesh(new THREE.CircleGeometry(.7,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.08;scene.add(sh);
    const n={kind:'walk',guard:true,newS:true,tint:0x6c7486,name,variant:1,sp,tag,sh,x:P.x,z:P.z,vx:0,vz:0,tx:0,tz:0,wait:0,spd:3,ph:rnd(0,1),face:1,say:1e9,bub:null,bt:0,hop:0,stuck:0,hide:0,sit:0};npcs.push(n);return n}
  function carBump(c){let cx=0,cz=0;
    for(const off of[-1.5,0,1.5]){const o={x:c.x+(-Math.sin(c.h))*off,z:c.z+(-Math.cos(c.h))*off};const ax=o.x,az=o.z;pushOut(o,1.15,0);cx+=o.x-ax;cz+=o.z-az}
    {const m=1.1,dx=c.x-HS.HX0,dz=c.z-HS.HZ0,ox2=HS.hx+m-Math.abs(dx),oz2=HS.hz+m-Math.abs(dz);if(ox2>0&&oz2>0){if(ox2<oz2)cx+=Math.sign(dx||1)*ox2;else cz+=Math.sign(dz||1)*oz2}}
    const hit=Math.hypot(cx,cz);if(hit>.001){c.x+=cx;c.z+=cz}const pr=Math.hypot(c.x,c.z);if(pr>ISL-4){c.x*=(ISL-4)/pr;c.z*=(ISL-4)/pr}return hit}
  guards=makeGuards({THREE,scene,renderer,createBenz,benzMain:benz,B,blocked,pushOut,P,car,emit,say,toast,spawnGuard,carBump,labelSprite,getRight:()=>[RX,RZ],traffic:()=>trafficPts});
  guards.cars.forEach(c=>trafficPts.push(c.pt));
  const interiorByKey=new Map((dressing.interiors||[]).map(r=>[r.key,r]));let interiorKey=null;
  function enterInterior(key){const r=interiorByKey.get(key);if(!r||car.on)return;const b=B.find(q=>Math.abs(q.x-r.bx)<.01&&Math.abs(q.z-r.bz)<.01);if(b?.mesh)b.mesh.visible=false;interiorKey=key;P.mode='walk';P.floor=0;P.x=r.x;P.z=r.z;P.y=0;P.vx=P.vy=P.vz=0;yaw=0;pitch=.28;camD=7;toast('ENTERED '+r.label);emit(P.x,1.2,P.z,24,0x4dd2ff,4,1,2,.8)}
  function exitInterior(){const r=interiorKey&&interiorByKey.get(interiorKey);if(!r)return;const b=B.find(q=>Math.abs(q.x-r.bx)<.01&&Math.abs(q.z-r.bz)<.01);if(b?.mesh)b.mesh.visible=true;P.x=r.outsideX;P.z=r.outsideZ??r.zOut??r.z;P.y=0;P.vx=P.vy=P.vz=0;interiorKey=null;toast('BACK OUTSIDE · SUPER TOWN');emit(P.x,.8,P.z,16,0xc8ff43,3,1,2,.6)}
  function doInteriorActivity(r){const a=r.activity||r.label;const msg={'COFFEE BAR':'COFFEE RUN · ENERGY ONLINE','RAMEN LAB':'RAMEN SERVED · +GOOD VIBES','MARKET':'SUPPLY RUN COMPLETE','TRAINING':'TRAINING COMPLETE · LEGS BUFFED','VAULT':'SECURITY SCAN COMPLETE','MOCHI LAB':'MOCHI LAB · FRESH BATCH','LISTENING ROOM':'VINYL SESSION STARTED','GEAR STORE':'FLYER GEAR FIT CHECK','BOBA LAB':'BOBA BREWING','LAUNDRY':'LAUNDRY CYCLE STARTED','BARBER':'FRESH CUT · +AURA','SNACK BAR':'SNACK BREAK','HQ MISSION TABLE':'MISSION TABLE ONLINE','ARCADE FLOOR':'ARCADE FLOOR LIVE','SHIP CONTROL':'SHIP SYSTEMS ONLINE','LIVE MARKET':'$SUPER MARKET SCAN COMPLETE','CEO OFFICE':'CEO TERMINAL ONLINE · THE COMPANY IS YOURS'}[a]||a+' · ACTIVITY COMPLETE';toast(msg);emit(P.x,1.5,P.z,22,0xc8ff43,3.4,1.2,2,.9)}
  function enterGarage(){if(car.on||interiorKey)return;garageIn=true;P.mode='walk';P.x=GARAGE.x;P.z=GARAGE.z+3.8;P.y=GARAGE.floor;P.vx=P.vy=P.vz=0;yaw=Math.PI/2;pitch=.3;camD=8;urus.group.visible=true;toast('UNDERGROUND GARAGE · URUS READY');emit(P.x,-.8,P.z,30,0xc8ff43,4,1,2,.9)}
  function leaveGarage(){if(car.on||!garageIn)return;garageIn=false;P.y=0;P.x=GARAGE.doorX;P.z=GARAGE.doorZ+1.8;P.vx=P.vy=P.vz=0;toast('GARAGE EXIT · SUPER TOWN');emit(P.x,.6,P.z,18,0xc8ff43,3,1,2,.6)}
  for(const r of dressing.interiors||[])if(r.kind==='shop'||r.kind==='major')specials[r.key]={x:r.outsideX,z:r.outsideZ,label:'ENTER '+r.label,act:()=>enterInterior(r.key)};
  specials.office&&(specials.office.act=()=>enterInterior('office'));
  function update(dt){
    time+=dt;U.time.value=time;grade.uniforms.time.value=time%100;
    if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on')}
    plazaSpin(dt);
    // camera yaw keys
    if(!typing){if(keys.has('q'))yaw+=dt*1.8;if(keys.has('e'))yaw-=dt*1.8}
    // player: walk (default) or fly
    let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x,iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m}
    const lockUI=menu.classList.contains('on')||going||typing;car.in.x=ix;car.in.z=iz;car.in.boost=keys.has('shift')||boostBtn;const frozen=lockUI||car.on;if(frozen){ix=iz=0}
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);RX=rx;RZ=rz;FX=fx;FZ=fz;
    const boost=(keys.has('shift')||boostBtn)&&!frozen,k=1-Math.exp(-dt*(P.mode==='walk'?9:5.5));
    const up=!frozen&&(keys.has(' ')||upBtn),dn=!frozen&&(keys.has('c')||keys.has('control')||dnBtn);
    if(P.mode==='fly'){
      const sp=boost?26:13,tx=(rx*ix+fx*-iz)*sp,tz=(rz*ix+fz*-iz)*sp;P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;P.vy+=(((up?1:0)-(dn?1:0))*(boost?16:10)-P.vy)*Math.min(1,dt*5);
      P.x+=P.vx*dt;P.y=clamp(P.y+P.vy*dt,1.6,150);P.z+=P.vz*dt;
    }else{
      const sp=boost?11.5:5.6,tx=(rx*ix+fx*-iz)*sp,tz=(rz*ix+fz*-iz)*sp;P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;if(P.riding){P.vx=P.vz=0}
      P.vy-=26*dt;P.x+=P.vx*dt;P.z+=P.vz*dt;P.y+=P.vy*dt;
    }
    const pr0=Math.hypot(P.x,P.z);if(pr0>ISL+25){P.x*=(ISL+25)/pr0;P.z*=(ISL+25)/pr0}
    if(!garageIn&&!interiorKey)pushOut(P,P.mode==='walk'?.8:1,P.y);
    const hs=HS.step(dt,P,time);
    if(P.riding)P.floor=Math.round(HS.E.y/HS.FH);
    const inH2=HS.inHouse(P.x,P.z),roofOver=Math.abs(P.x-HS.HX0)<HS.hx+.6&&Math.abs(P.z-HS.HZ0)<HS.hz+.6;
    if(!inH2&&!(roofOver&&P.y>HS.TOP-1))P.floor=0;
    if(P.mode==='walk'){
      let gy=garageIn?GARAGE.floor:(interiorKey?0:0);if(!garageIn&&!interiorKey){if(inH2)gy=P.riding?HS.E.y:HS.FY[P.floor];else if(roofOver&&P.y>HS.TOP-1)gy=HS.TOP+.5;}
      P.gy=gy;if(P.y<=gy){P.y=gy;if(P.vy<0)P.vy=0;P.ground=true}else P.ground=false;
      if(P.ground&&up&&!P.riding&&!frozen)P.vy=8.5;
    }else{
      if(inH2&&P.y>HS.TOP-.8)P.y=HS.TOP-.8;P.floor=inH2?(hs.pf<3?hs.pf:0):0;P.gy=inH2?HS.FY[P.floor]:0;
    }
    const spd=Math.hypot(P.vx,P.vz);const vr=P.vx*rx+P.vz*rz,vf=P.vx*fx+P.vz*fz;
    if(P.mode==='fly'){
      if(spd>.8)P.row=Math.abs(vr)>Math.abs(vf)*.8?(vr>0?0:2):(vf>0?3:1);else P.row=1;P.ph+=dt*(spd>.8?(boost?16:11):6);
      if(spd>2&&Math.random()<dt*(boost?40:16))emit(P.x+rnd(-.3,.3),P.y-.8,P.z+rnd(-.3,.3),1,boost?0xffc83d:0x7bff3a,.6,.2,1,.6);
    }else{
      if(Math.abs(vr)>.6)P.fx=vr>0?1:-1;const run=spd>8.2,back=vf>.8&&vf>Math.abs(vr)*.7;P.wr=(run?4:0)+(back?2:0)+(P.fx>0?0:1);
      if(spd>.6&&P.ground)P.ph+=dt*(run?15:10);else if(spd<=.6)P.ph=0;
      if(run&&P.ground&&Math.random()<dt*14)emit(P.x+rnd(-.3,.3),P.y+.1,P.z+rnd(-.3,.3),1,0xaaffaa,.8,.3,2,.5);
    }
    updateCar(dt,lockUI);
    if(elevEl){const on=!!P.riding;if(on!==elevOn){elevOn=on;elevEl.classList.toggle('on',on)}if(on&&elevTgt!==HS.E.tgt){elevTgt=HS.E.tgt;elevEl.querySelectorAll('button').forEach(b=>b.classList.toggle('on',+b.dataset.f===HS.E.tgt))}}
    if(P.bub){P.bt-=dt;if(P.bt<=0)clearBub(P)}
    // prompts: enterable places, garage and vehicles
    curSpot=null;let bd=9;
    if(interiorKey){const r=interiorByKey.get(interiorKey);if(r){const ed=Math.hypot(P.x-r.x,P.z-r.z);if(ed<2.8)curSpot={x:r.x,z:r.z,label:'EXIT '+r.label,act:exitInterior};else curSpot={x:r.bx,z:r.bz,label:r.activity||'ACTIVITY',act:()=>doInteriorActivity(r)}}}
    else{for(const key in specials){const s=specials[key],d=Math.hypot(P.x-s.x,P.z-s.z);if(d<bd&&P.y<26){bd=d;curSpot=s}}
      const du=Math.hypot(P.x-urus.group.position.x,P.z-urus.group.position.z);if(!garageIn&&P.mode==='walk'&&!hs.inside&&Math.hypot(P.x-GARAGE.doorX,P.z-GARAGE.doorZ)<5)curSpot={x:GARAGE.doorX,z:GARAGE.doorZ,label:'ENTER UNDERGROUND GARAGE',act:enterGarage};
      else if(garageIn&&P.mode==='walk'&&Math.hypot(P.x-GARAGE.doorX,P.z-GARAGE.doorZ)<4)curSpot={x:GARAGE.doorX,z:GARAGE.doorZ,label:'EXIT GARAGE',act:leaveGarage};
      else if(garageIn&&P.mode==='walk'&&du<5)curSpot={x:urus.group.position.x,z:urus.group.position.z,label:'DRIVE THE URUS',act:()=>enterCar('urus')};
      if(car.on)curSpot={x:car.x,z:car.z,label:'EXIT '+(driveKind==='urus'?'URUS':'BENZ'),act:exitCar};
      else if(!garageIn&&!hs.inside&&P.mode==='walk'&&!P.riding&&Math.hypot(P.x-car.x,P.z-car.z)<5.5)curSpot={x:car.x,z:car.z,label:'DRIVE THE BENZ',act:()=>enterCar('benz')};
    }
    if(!curSpot&&hs.inside&&!P.riding){const ed=Math.hypot(P.x-HS.E.x,P.z-HS.E.z);if(ed<7&&Math.abs(P.y-HS.FY[hs.pf<3?hs.pf:0])<1.3&&!(HS.E.floor===hs.pf&&HS.E.state==='open')){const f=hs.pf;curSpot={x:HS.E.x,z:HS.E.z,label:'CALL ELEVATOR',act:()=>HS.go(f)}}}
    if(curSpot&&!going&&!menu.classList.contains('on')){promptEl.textContent=(matchMedia('(pointer:coarse)').matches?'TAP · ':'F · ')+curSpot.label;promptEl.classList.add('on')}else promptEl.classList.remove('on');
    // npcs
    guards.update(dt);
    folk.tick(dt);
    for(const n of npcs){
      folk.step(n,dt);
      if(n.kind==='walk'){
      }else{
        const dx=n.tx-n.x,dy=n.ty-n.y,dz=n.tz-n.z,d=Math.hypot(dx,dy,dz);if(d<4&&(!n.ai||n.ai.state==='cruise')){n.tx=rnd(-95,95);n.ty=rnd(8,42);n.tz=rnd(-95,95)}
        n.vx+=(dx/d*n.spd-n.vx)*Math.min(1,dt*1.6);n.vy+=(dy/d*n.spd-n.vy)*Math.min(1,dt*1.6);n.vz+=(dz/d*n.spd-n.vz)*Math.min(1,dt*1.6);n.x+=n.vx*dt;n.y+=n.vy*dt;n.z+=n.vz*dt;pushOut(n,1,n.y);
        const vr2=n.vx*rx+n.vz*rz,vf2=n.vx*fx+n.vz*fz;n.row=Math.abs(vr2)>Math.abs(vf2)*.8?(vr2>0?0:2):(vf2>0?3:1);n.ph+=dt*10;
      }
      // chatter near the player
      n.say-=dt;const dp=Math.hypot(n.x-P.x,(n.y||0)-P.y,n.z-P.z);if(n.say<=0){n.say=rnd(14,34);if(dp<45){const ln=n.kind==='walk'?folk.line(n):pick(LINES);say(n,ln,4);if(dp<22)log(n.name,ln)}}
      if(n.bub){n.bt-=dt;if(n.bt<=0)clearBub(n)}
    }
    // smart Benz traffic: smooth acceleration, safe following, crossroad yielding and wheel steering
    for(const c of cars){
      const ts=trafficTargetSpeed(c,dt),prevH=c.g.rotation.y;const rate=ts.brake?18:(ts.target<c.v?12:5.5);
      c.v+=clamp(ts.target-c.v,-rate*dt,rate*dt);c.brake=ts.brake&&c.v>3;
      let x,z,hx,hz;
      if(c.loop){
        c.u=(c.u+c.v*dt/c.len)%1;const p=c.cv.getPointAt(c.u),t=c.cv.getTangentAt(c.u);x=p.x;z=p.z;hx=t.x;hz=t.z
      }else{
        c.t+=c.dir*c.v*dt/Math.abs(c.end-c.start);if(c.t>1){c.t=1;c.dir=-1;c.v=Math.max(c.v,5)}if(c.t<0){c.t=0;c.dir=1;c.v=Math.max(c.v,5)}
        const s=lerp(c.start,c.end,c.t),dd=Math.sign(c.end-c.start)*c.dir;if(c.horiz){x=s;z=c.off;hx=dd;hz=0}else{x=c.off;z=s;hx=0;hz=dd}
      }
      const h=Math.atan2(-hx,-hz),turn=wrapAng(h-prevH);c.steer+=(clamp(turn*5,-.48,.48)-c.steer)*(1-Math.exp(-dt*9));c.g.position.set(x,0,z);c.g.rotation.y=h;
      c.roll+=((-c.steer*c.v*.0045)-c.roll)*(1-Math.exp(-dt*6));const accel=(c.v-(c._pv||c.v))/Math.max(dt,.001);c._pv=c.v;c.pit+=(clamp(accel*.0035,-.05,.05)-c.pit)*(1-Math.exp(-dt*6));
      c.b.pose(c.v,c.steer,dt,c.roll,c.pit);c.b.setBrake(c.brake);c.b.setLights(true);
    }
    // planes + blimp
    for(const p of planes){p.a+=p.w*dt;const x=Math.cos(p.a)*p.R,z=Math.sin(p.a)*p.R,dir=Math.sign(p.w);p.g.position.set(x,p.y+Math.sin(time*.5+p.R)*3,z);p.g.rotation.set(0,0,0);p.g.rotation.y=Math.atan2(-(-Math.sin(p.a)*dir),-(Math.cos(p.a)*dir));p.g.rotateZ(-.28*dir);
      p.strobe.material.opacity=Math.sin(time*9)>.85?1:.1;p.ct-=dt;if(p.ct<=0){p.ct=.07;const tail=new V3(0,0,13).applyMatrix4(p.g.matrixWorld);emit(tail.x,tail.y,tail.z,1,0xcfeede,.4,.1,0,3.2)}}
    {const a=time*.03;blimp.position.set(Math.cos(a)*90+20,60+Math.sin(time*.4)*2,Math.sin(a)*90);blimp.rotation.y=Math.atan2(-(-Math.sin(a)),-(Math.cos(a)))+Math.PI/2}
    for(const b of blinkers)b.material.opacity=Math.sin(time*3+b.position.x)>0?1:.15;
    coin.rotation.y+=dt*1.2;dressing.tick(dt,time);
    if(Math.random()<dt*30)emit(Math.cos(time*3)*1.2,3.4,Math.sin(time*3)*1.2,1,0x4dd2ff,1.4,1.6,4,1.2);
    updP(dt);drawMap(dt);
  }
  function plazaSpin(dt){statue.rotation.y+=dt*.5}
  function place(){
    // player sprite
    const gh=P.mode==='walk'?P.gy:P.gy;
    if(P.mode==='fly'){
      if(flyF[P.row]){heroMat.map=flyF[P.row][Math.floor(P.ph)%4];if(!heroInit){heroMat.needsUpdate=true;heroInit=true}}
      hero.scale.set(FW,FH,1);hero.position.set(P.x,P.y+Math.sin(time*2.4)*.12,P.z);
    }else{
      if(walkF[P.wr]){heroMat.map=walkF[P.wr][Math.floor(P.ph)%8];if(!heroInit){heroMat.needsUpdate=true;heroInit=true}}
      hero.scale.set(WW,WH,1);hero.position.set(P.x,P.y+WH*.5-.03,P.z);
    }
    const hgt=Math.max(0,P.y-gh);heroSh.position.set(P.x,gh+.09,P.z);heroSh.scale.setScalar(Math.max(.3,1.1-hgt*.015));heroSh.material.opacity=Math.max(.1,.45-hgt*.006);
    {const to=P.mode==='walk'?.7:0;heroTag.position.set(P.x,P.y+2.3+to,P.z);if(P.bub)P.bub.position.set(P.x,P.y+3.9+to,P.z)}
    if(car.on){const sc=.37,w=seatToWorld(benz.seat.x,benz.seat.z);hero.scale.set(WW*sc,WH*sc,1);hero.position.set(w.x,.5+WH*sc*.5,w.z);heroSh.visible=false}else heroSh.visible=true;
    for(const n of npcs){
      if(n.kind==='walk'){const set=fronts[n.variant];if(n.newS&&walkF.length){const sp2=Math.hypot(n.vx,n.vz),vr3=n.vx*RX+n.vz*RZ,vf3=n.vx*FX+n.vz*FZ;if(Math.abs(vr3)>.3)n.fs=vr3>0?1:-1;const back=vf3>.4&&vf3>Math.abs(vr3)*.7;n.sp.material=walkMat((back?2:0)+((n.fs||1)>0?0:1),sp2>.4?Math.floor(n.ph*8)%8:0,n.tint);n.sp.scale.set(WW,WH,1)}else if(set){const mov=Math.hypot(n.vx,n.vz)>.4,f=mov?Math.floor(n.ph*4)%4:3;n.sp.material=set[(n.face>0?0:4)+f]}
        const hop=(Math.hypot(n.vx,n.vz)>.4?Math.abs(Math.sin(n.ph*Math.PI*2))*.18:0)+(n.hop>0?Math.sin(n.hop*Math.PI)*.9:0);const sit=(n.sit||0)*.45;n.sp.position.set(n.x,1.2+hop-sit,n.z);n.sh.position.set(n.x,.08,n.z);n.tag.position.set(n.x,2.9-sit,n.z);if(n.bub)n.bub.position.set(n.x,4.4-sit,n.z)}
      else{if(flyF[n.row]){n.sp.material=flyMat(n.row,Math.floor(n.ph)%4,n.tint)}n.sp.position.set(n.x,n.y+Math.sin(time*2+n.ph)*.15,n.z);n.tag.position.set(n.x,n.y+2.2,n.z);if(n.bub)n.bub.position.set(n.x,n.y+3.7,n.z)}
      const d=Math.hypot(n.x-camera.position.x,(n.y||0)-camera.position.y,n.z-camera.position.z);n.tag.visible=d<42&&!n.hide;n.sp.visible=!n.hide;if(n.sh)n.sh.visible=!n.hide;if(n.bub)n.bub.visible=!n.hide}
  }
  const camP=new V3(0,8,30),camL=new V3(0,2,20);camera.position.copy(camP);
  function camUpdate(dt){
    const cx=Math.sin(yaw)*Math.cos(pitch)*camD,cy=Math.sin(pitch)*camD,cz=Math.cos(yaw)*Math.cos(pitch)*camD;
    const tgt=new V3(P.x+cx,Math.max(1.2,P.y+cy),P.z+cz);const k=1-Math.exp(-dt*7);camP.lerp(tgt,k);
    // keep the camera out of buildings
    if(!garageIn&&!interiorKey)for(const b of B){if(camP.y<b.h+1&&Math.abs(camP.x-b.x)<b.hw+.8&&Math.abs(camP.z-b.z)<b.hd+.8){const dx=camP.x-b.x,dz=camP.z-b.z;const ox=b.hw+.9-Math.abs(dx),oz=b.hd+.9-Math.abs(dz);if(ox<oz)camP.x+=Math.sign(dx||1)*ox;else camP.z+=Math.sign(dz||1)*oz}}
    camL.set(P.x,P.y+.8,P.z);camera.position.copy(camP);camera.lookAt(camL);
    const spd=Math.hypot(P.vx,P.vz),fv=baseFov+Math.min(10,spd*.3);if(Math.abs(camera.fov-fv)>.05){camera.fov=fv;camera.updateProjectionMatrix()}
  }
  const perf={a:0,n:0,t:performance.now()};
  function frame(now){
    raf=requestAnimationFrame(frame);const nt=now||performance.now(),dt=Math.max(0,Math.min((nt-last)/1000,.05));last=nt;
    update(dt);place();camUpdate(dt);composer.render();
    perf.a+=(nt-perf.t)/1000;perf.t=nt;perf.n++;if(perf.a>2.5){const fps=perf.n/perf.a;perf.a=0;perf.n=0;if(fps<42&&pr>1){pr=Math.max(1,pr-.25);renderer.setPixelRatio(pr);composer.setPixelRatio(pr);resize()}else if(fps<26&&bloom.enabled){bloom.enabled=false;grade.enabled=false}}
  }

  /* ---------- public ---------- */
  api.show=()=>{root.classList.remove('tw-off');visible=true;resize();going=false;flashEl.style.opacity=0;menu.classList.remove('on');
    spawnHome();if(soundOn)music.play().catch(()=>{});last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
    toast('WELCOME HOME · SUPER HOME');log(null,'You spawn at your Super Home: take the elevator (1 2 3), walk out the front door, press V to fly, and visit the Arcade, HQ, Dock and Exchange.','sys')};
  api.hide=()=>{visible=false;cancelAnimationFrame(raf);root.classList.add('tw-off');music.pause();keys.clear();inEl.blur()};
  api.debug=(w)=>{if(w==='aerial'){P.x=0;P.z=40;P.y=44;yaw=0;pitch=.62;camD=34}else if(w==='benz'){carReset();P.x=-37;P.z=15;P.y=0;yaw=.95;pitch=.2;camD=8.5}else if(w==='drive'){carReset();P.x=car.x;P.z=car.z;enterCar('benz')}else if(w==='garage'){enterGarage()}else if(w==='street'){P.x=14;P.z=2;P.y=3;yaw=-.5;pitch=.22;camD=11}else if(w==='guards')return guards.stats();else if(w==='folk')return{stats:folk.stats(),sample:folk.arr.slice(0,6).map(n=>({n:n.name,a:n.ai.arch,s:n.ai.state,act:n.ai.act,x:+n.x.toFixed(1),z:+n.z.toFixed(1)}))};else if(typeof w==='string'&&w.startsWith('view:')){const [x,z,y,ya,pi,cd]=w.slice(5).split(',').map(Number);P.x=x;P.z=z;P.y=y;P.mode=y>5?'fly':'walk';yaw=ya;pitch=pi;camD=cd}else if(w==='treecheck'){const bad={road:0,bld:0,plaza:0,house:0,water:0};for(const q of dressing.trees){if(ROADS.some(c=>Math.abs(q.x-c)<RW/2+.2||Math.abs(q.z-c)<RW/2+.2))bad.road++;if(B.some(b=>Math.abs(q.x-b.x)<b.hw+.3&&Math.abs(q.z-b.z)<b.hd+.3))bad.bld++;if(Math.hypot(q.x,q.z)<14)bad.plaza++;if(Math.abs(q.x+54)<12.5&&Math.abs(q.z-18)<10.5)bad.house++;if(PARKS.some(([x,z])=>Math.hypot(q.x-x,q.z-z)<7))bad.water++}return{total:dressing.trees.length,bad}}else if(w==='park'){P.x=44;P.z=44;P.y=0;P.mode='walk';yaw=-2.35;pitch=.28;camD=10}else if(w==='avenue'){P.x=-60;P.z=-30.5;P.y=0;P.mode='walk';yaw=-1.57;pitch=.2;camD=9}else if(w==='plaza'){P.x=0;P.z=22;P.y=0;P.mode='walk';yaw=0;pitch=.25;camD=14}};
  return api;
}

let inst=null;
export function open(cb){if(!inst)inst=create();inst.onExit=cb.onExit;inst.onPortal=cb.onPortal;inst.show()}
export function close(){if(inst)inst.hide()}
export function debug(w){if(inst)return inst.debug(w)}
