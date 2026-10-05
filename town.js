import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {createSuperHouse} from './super-town-house.js';

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
<div class="tw-hint"><b>WASD</b> WALK · <b>SHIFT</b> RUN · <b>4</b> FLY · <b>SPACE</b> UP · <b>C</b> DOWN · <b>Q E</b> / DRAG CAMERA · <b>F</b> INTERACT · <b>ENTER</b> CHAT</div>
<div class="tw-chat"><div class="tw-log" id="twLog"></div><input id="twIn" maxlength="80" placeholder="Press Enter to chat…" autocomplete="off"></div>
<div class="tw-prompt" id="twPrompt"></div><div class="tw-toast" id="twToast"></div>
<div class="tw-joy" id="twJoy"><i></i></div><div class="tw-fly"><button id="twUp">▲</button><button id="twDn">▼</button></div>
<div class="tw-bar"><button class="em" data-em="👋">👋</button><button class="em" data-em="🕺">🕺</button><button class="em" data-em="❤️">❤️</button><button class="em" data-em="🚀">🚀</button><button id="twBoost">RUN</button><button id="twMode">MODE: WALK</button><button id="twAll">◂ ALL GAMES</button><button id="twSound">SOUND: ON</button></div>
<div class="tw-menu" id="twMenu"><div><h2>SUPER ARCADE</h2><p>Pick a game. You'll come back to town when you leave it.</p><div class="tw-games" id="twGames"></div><button class="g" id="twClose">CLOSE</button></div></div>
<div class="tw-flash" id="twFlash"></div>`;

function create(){
  const css=document.createElement('style');css.textContent=CSS;document.head.appendChild(css);
  const root=document.createElement('section');root.id='tw';root.className='tw tw-off';root.innerHTML=HTML;document.body.appendChild(root);
  const $=s=>root.querySelector(s);
  const api={onExit:null,onPortal:null};
  let visible=false,raf=0,last=0,time=0,soundOn=true,typing=false;

  /* ---------- renderer ---------- */
  const stage=$('.tw-stage');
  const renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
  let pr=Math.min(devicePixelRatio,1.5);renderer.setPixelRatio(pr);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
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
  const limeM=new THREE.MeshBasicMaterial({color:new THREE.Color(2.2,3,.5)}),redM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.4,.45)}),greenM=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,2.6,.8)});

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
     fragmentShader:`varying vec3 vW;uniform float time;void main(){vec2 p=vW.xz/3.;vec2 gr=abs(fract(p-.5)-.5)/fwidth(p);float line=1.-min(min(gr.x,gr.y),1.);float d=length(vW.xz);vec3 col=vec3(.012,.04,.024)+vec3(.3,.9,.2)*line*.07*(.6+.4*sin(d*.1-time*1.4));col+=vec3(.5,1.,.3)*smoothstep(104.,115.,d)*.35;gl_FragColor=vec4(col,1.);}`}));g.rotation.x=-Math.PI/2;scene.add(g);
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
    const m=new THREE.Mesh(geo,[BMAT[tex%4],BMAT[tex%4],roofM,roofM,BMAT[tex%4],BMAT[tex%4]]);m.position.set(x,h/2,z);scene.add(m);B.push({x,z,hw:w/2,hd:d/2,h,name});
    const rf=new THREE.Mesh(new THREE.BoxGeometry(w+.4,.35,d+.4),metalM);rf.position.set(x,h+.17,z);scene.add(rf);const em=(x+z)%2>0?limeM:redM;for(const sz of[-1,1]){const e1=new THREE.Mesh(new THREE.BoxGeometry(w+.5,.14,.14),em);e1.position.set(x,h+.42,z+sz*(d/2+.2));scene.add(e1);const e2=new THREE.Mesh(new THREE.BoxGeometry(.14,.14,d+.5),em);e2.position.set(x+sz*(w/2+.2),h+.42,z);scene.add(e2)}
    if(h>20){const a=new THREE.Mesh(new THREE.CylinderGeometry(.08,.12,6,6),metalM);a.position.set(x,h+3.3,z);scene.add(a);const bl=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xff3a3a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));bl.scale.set(2.4,2.4,1);bl.position.set(x,h+6.4,z);scene.add(bl);blinkers.push(bl)}
    return m}
  const blinkers=[];
  function block(cx,cz,fn){fn(cx,cz)}
  const rng=(()=>{let s=7;return()=>{s=(s*16807)%2147483647;return(s-1)/2147483646}})();
  // generic blocks
  for(const [cx,cz] of[[-54,-18],[-54,18],[54,-18],[54,18],[-18,-54],[18,-54],[-18,54],[18,54]]){
    const two=rng()<.55;if(two){const w1=rng()*6+10,w2=rng()*6+10,h1=rng()*20+8,h2=rng()*22+8;building(cx-7,cz+(rng()-.5)*6,w1,18+rng()*4,h1,Math.floor(rng()*4));building(cx+8,cz+(rng()-.5)*6,w2,16+rng()*4,h2,Math.floor(rng()*4))}
    else building(cx,cz,rng()*8+16,rng()*6+17,rng()*26+10,Math.floor(rng()*4))}
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
  const trees=[];for(const [cx,cz] of[[-54,-54],[54,-54],[-54,54],[54,54]]){for(let i=0;i<30;i++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*22;const x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(Math.hypot(x-cx,z-cz)>6)trees.push([x,z,rnd(.8,1.6)])}
    const pond=new THREE.Mesh(new THREE.CircleGeometry(6,32),new THREE.MeshBasicMaterial({color:new THREE.Color(.1,.9,.8)}));pond.rotation.x=-Math.PI/2;pond.position.set(cx,.05,cz);scene.add(pond);const pr3=new THREE.Mesh(new THREE.TorusGeometry(6,.2,8,40),greenM);pr3.rotation.x=Math.PI/2;pr3.position.set(cx,.1,cz);scene.add(pr3)}
  for(let i=0;i<80;i++){const a=rnd(0,6.283),r=rnd(80,108);trees.push([Math.cos(a)*r,Math.sin(a)*r,rnd(.8,1.5)])}
  {const n=trees.length,tr=new THREE.InstancedMesh(new THREE.CylinderGeometry(.18,.28,2.2,6),metalM,n),cn=new THREE.InstancedMesh(new THREE.ConeGeometry(1.6,4.6,8),new THREE.MeshStandardMaterial({color:0x2f8a2a,emissive:0x1a5a14,emissiveIntensity:.7,roughness:.7}),n),d=new THREE.Object3D();
   trees.forEach(([x,z,s],i)=>{d.position.set(x,1.1*s,z);d.scale.setScalar(s);d.updateMatrix();tr.setMatrixAt(i,d.matrix);d.position.set(x,3.6*s,z);d.updateMatrix();cn.setMatrixAt(i,d.matrix)});scene.add(tr,cn)}
  // street lamps
  {const pts=[];for(const c of ROADS)for(let t=-100;t<=100;t+=12)for(const s of[-1,1]){pts.push([t,c+s*(RW/2+.6)]);pts.push([c+s*(RW/2+.6),t])}
   const n=pts.length,pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.08,.12,5,6),metalM,n),d=new THREE.Object3D(),pos=new Float32Array(n*3);
   pts.forEach(([x,z],i)=>{d.position.set(x,2.5,z);d.updateMatrix();pm.setMatrixAt(i,d.matrix);pos.set([x,5.2,z],i*3)});scene.add(pm);
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));scene.add(Object.assign(new THREE.Points(g,new THREE.PointsMaterial({size:3.2,map:glowTex,color:0xc8ff7a,transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),{frustumCulled:false}))}

  // Three-story furnished spawn residence with a working elevator.
  house=createSuperHouse({scene,player:P,labelSprite,toast});
  const oldBlocked=blocked;
  const oldPushOut=pushOut;
  const spawnHome=house.spawn;

  /* ---------- cars ---------- */
  function loopCurve(H,ccw){const r=7,pts=[];const corners=ccw?[[H-r,H-r,0],[-(H-r),H-r,Math.PI/2],[-(H-r),-(H-r),Math.PI],[H-r,-(H-r),Math.PI*1.5]]:[[H-r,-(H-r),Math.PI*1.5],[-(H-r),-(H-r),Math.PI],[-(H-r),H-r,Math.PI/2],[H-r,H-r,0]];
    for(const [cx,cz,a0] of corners){for(let i=0;i<=4;i++){const a=ccw?a0+i/4*Math.PI/2:a0-i/4*Math.PI/2;pts.push(new V3(cx+Math.cos(a)*r,.55,cz+Math.sin(a)*r))}}return new THREE.CatmullRomCurve3(pts,true,'catmullrom',.4)}
  const carBodyG=new THREE.BoxGeometry(2,.7,4.2),carCabG=new THREE.BoxGeometry(1.7,.62,2.1),wheelG=new THREE.CylinderGeometry(.42,.42,.35,12),glassM=new THREE.MeshStandardMaterial({color:0x0a1a16,roughness:.1,metalness:.9}),wheelM=new THREE.MeshStandardMaterial({color:0x080c0a,roughness:.6}),headM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,3,2.4)}),tailM=new THREE.MeshBasicMaterial({color:new THREE.Color(3,.2,.25)});
  const CARCOL=[0x7bff3a,0xff4d4f,0xe9f4ea,0x4dd2ff,0xffc83d,0xc8ff43,0xff2a9a];
  function makeCar(col){const g=new THREE.Group(),bm=new THREE.MeshStandardMaterial({color:col,roughness:.25,metalness:.7,emissive:col,emissiveIntensity:.18});
    const b=new THREE.Mesh(carBodyG,bm);b.position.y=.55;g.add(b);const c=new THREE.Mesh(carCabG,glassM);c.position.set(0,1.12,.2);g.add(c);
    for(const x of[-1,1])for(const z of[-1.35,1.35]){const w=new THREE.Mesh(wheelG,wheelM);w.rotation.z=Math.PI/2;w.position.set(x*1.02,.42,z);g.add(w)}
    for(const x of[-.7,.7]){const h=new THREE.Mesh(new THREE.BoxGeometry(.4,.2,.1),headM);h.position.set(x,.62,-2.12);g.add(h);const t=new THREE.Mesh(new THREE.BoxGeometry(.4,.2,.1),tailM);t.position.set(x,.62,2.12);g.add(t)}
    const ug=new THREE.Mesh(new THREE.PlaneGeometry(2.6,4.8),new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(1.6),transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false}));ug.rotation.x=-Math.PI/2;ug.position.y=.06;g.add(ug);scene.add(g);return g}
  const cars=[];
  {const L=[[38.2,false],[33.8,true]];L.forEach(([H,ccw],li)=>{const cv=loopCurve(H,ccw),len=cv.getLength();for(let i=0;i<5;i++)cars.push({g:makeCar(CARCOL[(li*5+i)%CARCOL.length]),cv,len,u:i/5+li*.07,spd:rnd(9,13),loop:true})})}
  [[-1,-72,-10,2.2],[1,72,10,-2.2],[-1,-72,-10,-2.2],[1,72,10,2.2]].forEach(([dir,a,b,off],i)=>{const horiz=i<2;cars.push({g:makeCar(CARCOL[(i+3)%CARCOL.length]),shuttle:true,a,b,off,horiz,t:rnd(0,1),dir:1,spd:rnd(8,12)})});

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

  // New character sheet. It is loaded as an image, then cut into a regular grid at runtime.
  // Candidate grids are scored by alpha occupancy so transparent gutters are respected.
  const PLAYER_SHEET='4b318cef-2ac1-49cf-a329-93dd2d5d8896.png';
  let walkF=[],runF=[],playerFlyF=[],playerFrameW=2.6,playerFrameH=3.4;
  function cutCharacterSheet(img){
    const w=img.naturalWidth,h=img.naturalHeight;
    const candidates=[[4,4],[8,4],[4,8],[6,4],[8,8],[6,8],[12,4]];
    let best=null;
    for(const [cols,rows] of candidates){
      if(w%cols||h%rows)continue;
      const cw=w/cols,ch=h/rows,cv=document.createElement('canvas');cv.width=cw;cv.height=ch;
      const cx=cv.getContext('2d',{willReadFrequently:true});let score=0,non=0;
      for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
        cx.clearRect(0,0,cw,ch);cx.drawImage(img,c*cw,r*ch,cw,ch,0,0,cw,ch);
        const d=cx.getImageData(0,0,cw,ch).data;let a=0;
        for(let i=3;i<d.length;i+=4)if(d[i]>20)a++;
        const occ=a/(cw*ch);if(occ>.015&&occ<.82){score+=1-Math.abs(occ-.22);non++}
      }
      const quality=non/(cols*rows)+score/(cols*rows);
      if(!best||quality>best.quality)best={cols,rows,cw,ch,quality};
    }
    if(!best)return;
    const frame=(r,c)=>{
      const cv=document.createElement('canvas');cv.width=best.cw;cv.height=best.ch;cv.getContext('2d').drawImage(img,c*best.cw,r*best.ch,best.cw,best.ch,0,0,best.cw,best.ch);
      const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return new THREE.SpriteMaterial({map:t,transparent:true,alphaTest:.25,fog:true});
    };
    const rows=Math.min(best.rows,4),cols=best.cols;
    walkF=Array.from({length:Math.min(2,rows)},(_,r)=>Array.from({length:cols},(_,c)=>frame(r,c)));
    runF=rows>2?Array.from({length:Math.min(2,rows-2)},(_,r)=>Array.from({length:cols},(_,c)=>frame(r+2,c))):walkF;
    playerFlyF=rows>3?Array.from({length:1},()=>Array.from({length:cols},(_,c)=>frame(3,c))):runF;
    playerFrameW=2.8;playerFrameH=playerFrameW*(best.ch/best.cw);
  }
  const playerSheet=new Image();playerSheet.onload=()=>cutCharacterSheet(playerSheet);playerSheet.src=BASE+PLAYER_SHEET;
  // shared particles
  const MAXP=600,pPos=new Float32Array(MAXP*3),pCol=new Float32Array(MAXP*3),pVel=new Float32Array(MAXP*3),pLife=new Float32Array(MAXP),pMax=new Float32Array(MAXP),pBase=new Float32Array(MAXP*3),pG=new Float32Array(MAXP);pPos.fill(-9999);let pHead=0;
  const pGeo=new THREE.BufferGeometry();pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  scene.add(Object.assign(new THREE.Points(pGeo,new THREE.PointsMaterial({size:.8,map:glowTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})),{frustumCulled:false}));
  function emit(x,y,z,n,color,sp=2,up=1,grav=3,life=1){const c=new THREE.Color(color);for(let k=0;k<n;k++){const i=pHead;pHead=(pHead+1)%MAXP;const a=rnd(0,6.283),s=sp*rnd(.2,1);pPos.set([x,y,z],i*3);pVel.set([Math.cos(a)*s,rnd(.2,1)*up*sp,Math.sin(a)*s],i*3);pBase.set([c.r,c.g,c.b],i*3);pLife[i]=pMax[i]=life*rnd(.6,1.3);pG[i]=grav}}
  function updP(dt){for(let i=0;i<MAXP;i++){if(pLife[i]<=0)continue;pLife[i]-=dt;const j=i*3;if(pLife[i]<=0){pPos[j+1]=-9999;pCol[j]=pCol[j+1]=pCol[j+2]=0;continue}pVel[j+1]-=pG[i]*dt;pPos[j]+=pVel[j]*dt;pPos[j+1]+=pVel[j+1]*dt;pPos[j+2]+=pVel[j+2]*dt;const f=pLife[i]/pMax[i];pCol[j]=pBase[j]*f*1.6;pCol[j+1]=pBase[j+1]*f*1.6;pCol[j+2]=pBase[j+2]*f*1.6}pGeo.attributes.position.needsUpdate=true;pGeo.attributes.color.needsUpdate=true}

  /* ---------- collisions + walkable ---------- */
  const blocked=(x,z,m=0,maxH=1e9)=>{for(const b of B)if(b.h<maxH&&Math.abs(x-b.x)<b.hw+m&&Math.abs(z-b.z)<b.hd+m)return b;return null};
  function pushOut(o,r,y){for(const b of B){if(y>b.h+1.5)continue;const dx=o.x-b.x,dz=o.z-b.z,ox=b.hw+r-Math.abs(dx),oz=b.hd+r-Math.abs(dz);if(ox>0&&oz>0){if(ox<oz)o.x+=Math.sign(dx||1)*ox;else o.z+=Math.sign(dz||1)*oz}}}
  function randWalk(){for(let k=0;k<40;k++){const a=rnd(0,6.283),r=Math.sqrt(Math.random())*96,x=Math.cos(a)*r,z=Math.sin(a)*r;if(!blocked(x,z,2.2))return[x,z]}return[0,12]}

  /* ---------- NPC residents ---------- */
  const npcs=[];const used=new Set();
  const uname=()=>{let n;do{n=pick(NAMES)+(Math.random()<.5?'':Math.floor(rnd(1,99)))}while(used.has(n));used.add(n);return n};
  for(let i=0;i<40;i++){const [x,z]=randWalk(),variant=1+(i%7),name=uname(),sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.3,fog:true}));sp.scale.set(2.1,2.4,1);scene.add(sp);
    const tag=labelSprite(name,{w:2.6,size:54,color:'#e9f6ea',glow:'#7ddc1f',plate:true});scene.add(tag);const sh=new THREE.Mesh(new THREE.CircleGeometry(.7,16),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.4,depthWrite:false}));sh.rotation.x=-Math.PI/2;sh.position.y=.08;scene.add(sh);
    npcs.push({kind:'walk',name,variant,sp,tag,sh,x,z,vx:0,vz:0,tx:x,tz:z,wait:rnd(0,3),spd:rnd(1.5,2.6),ph:rnd(0,1),face:1,say:rnd(6,30),bub:null,bt:0,hop:0,stuck:0})}
  for(let i=0;i<8;i++){const name=uname(),sp=new THREE.Sprite(new THREE.SpriteMaterial({alphaTest:.25,fog:true}));sp.scale.set(FW*.9,FH*.9,1);scene.add(sp);const tag=labelSprite(name,{w:2.6,size:54,color:'#e9f6ea',glow:'#4dd2ff',plate:true});scene.add(tag);
    npcs.push({kind:'fly',name,tint:flyTint[i%flyTint.length],sp,tag,x:rnd(-80,80),y:rnd(8,34),z:rnd(-80,80),vx:0,vy:0,vz:0,tx:rnd(-90,90),ty:rnd(8,40),tz:rnd(-90,90),spd:rnd(8,14),ph:rnd(0,3),row:1,say:rnd(8,30),bub:null,bt:0})}
  $('#twPop').textContent=npcs.length+1+' IN TOWN · OPEN WORLD';

  /* ---------- the player (the flyer) ---------- */
  const P={x:0,y:1.6,z:20,vx:0,vy:0,vz:0,row:1,ph:0,boost:0,bub:null,bt:0,mode:'walk'};
  const heroMat=new THREE.SpriteMaterial({transparent:true,alphaTest:.25,fog:true});let heroInit=false;
  const hero=new THREE.Sprite(heroMat);hero.scale.set(playerFrameW,playerFrameH,1);hero.renderOrder=3;scene.add(hero);
  let house=null;
  const heroSh=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.45,depthWrite:false}));heroSh.rotation.x=-Math.PI/2;heroSh.position.y=.09;scene.add(heroSh);
  const heroTag=labelSprite('YOU',{w:1.8,size:58,color:'#0a1405',glow:'#d4ff3a',plate:false});scene.add(heroTag);
  const youPlate=(()=>{const c=document.createElement('canvas');c.width=512;c.height=112;const x=c.getContext('2d');x.fillStyle='#d4ff3a';x.beginPath();x.roundRect(150,12,212,88,26);x.fill();x.fillStyle='#0a1405';x.font='800 58px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('YOU',256,58);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
  heroTag.material.map=youPlate;heroTag.material.blending=THREE.NormalBlending;heroTag.material.needsUpdate=true;heroTag.scale.set(2.4,2.4*112/512,1);
  let yaw=0,pitch=.34,camD=12;const keys=new Set();let joy={x:0,z:0},upBtn=false,dnBtn=false,boostBtn=false;

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
  root.querySelectorAll('[data-em]').forEach(b=>b.onclick=()=>{say(P,b.dataset.em,3);P.vy=Math.max(P.vy,7);emit(P.x,P.y+1,P.z,14,0xffc83d,3,1,2,.9);const n=nearestNpc(30);if(n&&Math.random()<.7)setTimeout(()=>say(n,pick(['👋','hey!','😄','🔥']),3),600)});
  $('#twBoost').onpointerdown=()=>boostBtn=true;$('#twBoost').onpointerup=$('#twBoost').onpointerleave=()=>boostBtn=false;
  $('#twMode').onclick=()=>{P.mode=P.mode==='fly'?'walk':'fly';$('#twMode').textContent='MODE: '+P.mode.toUpperCase();toast(P.mode==='fly'?'FLIGHT ENABLED':'WALK MODE ENABLED')};
  $('#twUp').onpointerdown=()=>upBtn=true;$('#twDn').onpointerdown=()=>dnBtn=true;for(const id of['#twUp','#twDn'])for(const ev of['pointerup','pointerleave','pointercancel'])$(id).addEventListener(ev,()=>{upBtn=dnBtn=false});
  $('#twAll').onclick=()=>api.onExit&&api.onExit();
  const music=new Audio(BASE+'CREATE_A_MUSIC_ABOUT_A_COIN_CA.mp3');music.loop=true;music.volume=.3;music.preload='auto';
  $('#twSound').onclick=()=>{soundOn=!soundOn;$('#twSound').textContent='SOUND: '+(soundOn?'ON':'OFF');soundOn?music.play().catch(()=>{}):music.pause()};
  function nearestNpc(r){let b=null,bd=r;for(const n of npcs){const d=Math.hypot(n.x-P.x,(n.y||0)-P.y,n.z-P.z);if(d<bd){bd=d;b=n}}return b}
  inEl.addEventListener('focus',()=>typing=true);inEl.addEventListener('blur',()=>typing=false);
  inEl.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){const t=inEl.value.trim();inEl.value='';inEl.blur();if(t){log('YOU',t,'me');say(P,t,5);const n=nearestNpc(60);if(n)setTimeout(()=>{const r=pick(REPLIES);say(n,r,4);log(n.name,r)},rnd(1200,3200))}}else if(e.key==='Escape'){inEl.blur()}});

  // minimap
  const mapC=$('#twMap'),mx=mapC.getContext('2d'),mapBase=document.createElement('canvas');mapBase.width=mapBase.height=150;
  {const x=mapBase.getContext('2d'),S=75/ISL;x.fillStyle='#04100a';x.fillRect(0,0,150,150);x.beginPath();x.arc(75,75,73,0,6.283);x.fillStyle='#0b2416';x.fill();x.strokeStyle='#7ddc1f';x.lineWidth=2;x.stroke();x.fillStyle='#14281d';for(const c of ROADS){x.fillRect(75-ISL*S,75+c*S-RW*S/2,ISL*S*2,RW*S);x.fillRect(75+c*S-RW*S/2,75-ISL*S,RW*S,ISL*S*2)}
   for(const b of B){x.fillStyle=b.name?'#d4ff3a':'#3d6a4a';x.fillRect(75+(b.x-b.hw)*S,75+(b.z-b.hd)*S,b.hw*2*S,b.hd*2*S)}}
  let mapT=0;function drawMap(dt){mapT-=dt;if(mapT>0)return;mapT=.1;const S=75/ISL;mx.drawImage(mapBase,0,0);
    for(const n of npcs){mx.fillStyle=n.kind==='fly'?'#4dd2ff':'#e9f6ea';mx.fillRect(75+n.x*S-1,75+n.z*S-1,2,2)}for(const c of cars){mx.fillStyle='#ff4d4f';mx.fillRect(75+c.g.position.x*S-1.5,75+c.g.position.z*S-1.5,3,3)}
    mx.save();mx.translate(75+P.x*S,75+P.z*S);mx.rotate(-yaw);mx.fillStyle='#d4ff3a';mx.beginPath();mx.moveTo(0,-6);mx.lineTo(4.5,5);mx.lineTo(-4.5,5);mx.closePath();mx.fill();mx.restore()}

  /* ---------- input ---------- */
  const kd=e=>{if(!visible)return;if(typing)return;const k=e.key.toLowerCase();
    if(k==='enter'){e.preventDefault();e.stopImmediatePropagation();inEl.focus();return}
    if(k==='4'){P.mode=P.mode==='fly'?'walk':'fly';$('#twMode').textContent='MODE: '+P.mode.toUpperCase();toast(P.mode==='fly'?'FLIGHT ENABLED':'WALK MODE ENABLED');e.preventDefault();e.stopImmediatePropagation();return}
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
  function update(dt){
    time+=dt;U.time.value=time;grade.uniforms.time.value=time%100;
    if(toastT>0){toastT-=dt;if(toastT<=0)toastEl.classList.remove('on')}
    plazaSpin(dt);if(house)house.update(dt);
    // camera yaw keys
    if(!typing){if(keys.has('q'))yaw+=dt*1.8;if(keys.has('e'))yaw-=dt*1.8}
    // player movement: ground walk/run by default; flight is a deliberate mode (4).
    let ix=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joy.x;
    let iz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joy.z;
    const m=Math.hypot(ix,iz);if(m>1){ix/=m;iz/=m}
    const frozen=menu.classList.contains('on')||going||typing;if(frozen){ix=iz=0}
    const fx=-Math.sin(yaw),fz=-Math.cos(yaw),rx=Math.cos(yaw),rz=-Math.sin(yaw);
    const running=(keys.has('shift')||boostBtn)&&!frozen;
    const k=1-Math.exp(-dt*(P.mode==='fly'?5.5:8));
    if(P.mode==='fly'){
      const sp=running?26:13;const tx=(rx*ix+fx*-iz)*sp,tz=(rz*ix+fz*-iz)*sp;
      P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;
      const up=!frozen&&(keys.has(' ')||upBtn),dn=!frozen&&(keys.has('c')||keys.has('control')||dnBtn);
      P.vy+=(((up?1:0)-(dn?1:0))*(running?16:10)-P.vy)*Math.min(1,dt*5);
      P.x+=P.vx*dt;P.y=clamp(P.y+P.vy*dt,1.6,150);P.z+=P.vz*dt;
    }else{
      const sp=running?8.5:4.4;const tx=(rx*ix+fx*-iz)*sp,tz=(rz*ix+fz*-iz)*sp;
      P.vx+=(tx-P.vx)*k;P.vz+=(tz-P.vz)*k;P.vy+=(1.6-P.y)*Math.min(1,dt*8);
      P.x+=P.vx*dt;P.z+=P.vz*dt;P.y=1.6;
    }
    if(house)house.resolve(P);
    const pr0=Math.hypot(P.x,P.z);if(pr0>ISL+25){P.x*=(ISL+25)/pr0;P.z*=(ISL+25)/pr0}
    if(P.mode==='fly')pushOut(P,1,P.y);
    const spd=Math.hypot(P.vx,P.vz);const vr=P.vx*rx+P.vz*rz,vf=P.vx*fx+P.vz*fz;
    if(P.mode==='fly'){P.row=Math.abs(vr)>Math.abs(vf)*.8?(vr>0?0:2):(vf>0?3:1);P.ph+=dt*(spd>.8?(running?16:11):6)}else{P.row=0;P.ph+=dt*(spd>.15?(running?12:7):2)}
    if(P.mode==='fly'&&spd>2&&Math.random()<dt*(running?40:16))emit(P.x+rnd(-.3,.3),P.y-.8,P.z+rnd(-.3,.3),1,boost?0xffc83d:0x7bff3a,.6,.2,1,.6);
    if(P.bub){P.bt-=dt;if(P.bt<=0)clearBub(P)}
    // prompts: nearest special door
    curSpot=null;let bd=9;for(const key in specials){const s=specials[key],d=Math.hypot(P.x-s.x,P.z-s.z);if(d<bd&&P.y<26){bd=d;curSpot=s}}
    if(!curSpot&&house){const hp=house.prompt();if(hp){curSpot={label:hp,act:()=>house.interact()};bd=6}}
    if(curSpot&&!going&&!menu.classList.contains('on')){promptEl.textContent=(matchMedia('(pointer:coarse)').matches?'TAP · ':'F · ')+curSpot.label;promptEl.classList.add('on')}else promptEl.classList.remove('on');
    // npcs
    for(const n of npcs){
      if(n.kind==='walk'){
        const dx=n.tx-n.x,dz=n.tz-n.z,d=Math.hypot(dx,dz);
        if(n.wait>0){n.wait-=dt;n.vx*=.8;n.vz*=.8;if(n.wait<=0){[n.tx,n.tz]=randWalk()}}
        else{n.vx+=(dx/d*n.spd-n.vx)*Math.min(1,dt*4);n.vz+=(dz/d*n.spd-n.vz)*Math.min(1,dt*4);if(d<1.2){n.wait=rnd(1,6)}}
        const ox=n.x,oz=n.z;n.x+=n.vx*dt;n.z+=n.vz*dt;pushOut(n,.6,0);if(Math.hypot(n.x-ox,n.z-oz)<.2*dt*n.spd&&n.wait<=0){n.stuck+=dt;if(n.stuck>1.2){n.stuck=0;[n.tx,n.tz]=randWalk()}}
        const sp2=Math.hypot(n.vx,n.vz);if(Math.abs(n.vx)>.2)n.face=n.vx>0?1:-1;n.ph+=dt*sp2*.45;
        if(n.hop>0)n.hop-=dt*2;
      }else{
        const dx=n.tx-n.x,dy=n.ty-n.y,dz=n.tz-n.z,d=Math.hypot(dx,dy,dz);if(d<4){n.tx=rnd(-95,95);n.ty=rnd(8,42);n.tz=rnd(-95,95)}
        n.vx+=(dx/d*n.spd-n.vx)*Math.min(1,dt*1.6);n.vy+=(dy/d*n.spd-n.vy)*Math.min(1,dt*1.6);n.vz+=(dz/d*n.spd-n.vz)*Math.min(1,dt*1.6);n.x+=n.vx*dt;n.y+=n.vy*dt;n.z+=n.vz*dt;pushOut(n,1,n.y);
        const vr2=n.vx*rx+n.vz*rz,vf2=n.vx*fx+n.vz*fz;n.row=Math.abs(vr2)>Math.abs(vf2)*.8?(vr2>0?0:2):(vf2>0?3:1);n.ph+=dt*10;
      }
      // chatter near the player
      n.say-=dt;const dp=Math.hypot(n.x-P.x,(n.y||0)-P.y,n.z-P.z);if(n.say<=0){n.say=rnd(14,34);if(dp<45){say(n,pick(LINES),4);if(dp<22)log(n.name,n.bub?'…':'')}}
      if(n.bub){n.bt-=dt;if(n.bt<=0)clearBub(n)}
      if(n.kind==='walk'&&dp<6&&!n.greeted&&Math.random()<dt*.5){n.greeted=true;n.hop=1;say(n,'👋',3);setTimeout(()=>n.greeted=false,20000)}
    }
    // cars
    for(const c of cars){let x,z,hx,hz;
      if(c.loop){c.u=(c.u+c.spd*dt/c.len)%1;const p=c.cv.getPointAt(c.u),t=c.cv.getTangentAt(c.u);x=p.x;z=p.z;hx=t.x;hz=t.z}
      else{c.t+=c.dir*c.spd*dt/Math.abs(c.b-c.a);if(c.t>1){c.t=1;c.dir=-1}if(c.t<0){c.t=0;c.dir=1}const s=lerp(c.a,c.b,c.t),dd=Math.sign(c.b-c.a)*c.dir;if(c.horiz){x=s;z=c.off;hx=dd;hz=0}else{x=c.off;z=s;hx=0;hz=dd}}
      c.g.position.set(x,0,z);c.g.rotation.y=Math.atan2(-hx,-hz)}
    // planes + blimp
    for(const p of planes){p.a+=p.w*dt;const x=Math.cos(p.a)*p.R,z=Math.sin(p.a)*p.R,dir=Math.sign(p.w);p.g.position.set(x,p.y+Math.sin(time*.5+p.R)*3,z);p.g.rotation.set(0,0,0);p.g.rotation.y=Math.atan2(-(-Math.sin(p.a)*dir),-(Math.cos(p.a)*dir));p.g.rotateZ(-.28*dir);
      p.strobe.material.opacity=Math.sin(time*9)>.85?1:.1;p.ct-=dt;if(p.ct<=0){p.ct=.07;const tail=new V3(0,0,13).applyMatrix4(p.g.matrixWorld);emit(tail.x,tail.y,tail.z,1,0xcfeede,.4,.1,0,3.2)}}
    {const a=time*.03;blimp.position.set(Math.cos(a)*90+20,60+Math.sin(time*.4)*2,Math.sin(a)*90);blimp.rotation.y=Math.atan2(-(-Math.sin(a)),-(Math.cos(a)))+Math.PI/2}
    for(const b of blinkers)b.material.opacity=Math.sin(time*3+b.position.x)>0?1:.15;
    coin.rotation.y+=dt*1.2;
    if(Math.random()<dt*30)emit(Math.cos(time*3)*1.2,3.4,Math.sin(time*3)*1.2,1,0x4dd2ff,1.4,1.6,4,1.2);
    updP(dt);drawMap(dt);
  }
  function plazaSpin(dt){statue.rotation.y+=dt*.5}
  function place(){
    // player sprite: new sheet is walk/run on the ground; flying uses option 4.
    const frames=P.mode==='fly'?(playerFlyF[P.row]||runF[0]||walkF[0]):(running?runF[0]:walkF[0]);
    if(frames&&frames.length){heroMat.map=frames[Math.floor(P.ph)%frames.length].map;heroMat.needsUpdate=true;hero.scale.set(playerFrameW,playerFrameH,1)}
    hero.position.set(P.x,P.y+(P.mode==='fly'?Math.sin(time*2.4)*.12:0),P.z);
    const h=Math.max(0,P.y);heroSh.position.set(P.x,.09,P.z);heroSh.scale.setScalar(Math.max(.3,1.1-h*.015));heroSh.material.opacity=Math.max(.1,.45-h*.006);
    heroTag.position.set(P.x,P.y+2.3,P.z);if(P.bub)P.bub.position.set(P.x,P.y+3.9,P.z);
    for(const n of npcs){
      if(n.kind==='walk'){const set=fronts[n.variant];if(set){const mov=Math.hypot(n.vx,n.vz)>.4,f=mov?Math.floor(n.ph*4)%4:3;n.sp.material=set[(n.face>0?0:4)+f]}
        const hop=(Math.hypot(n.vx,n.vz)>.4?Math.abs(Math.sin(n.ph*Math.PI*2))*.18:0)+(n.hop>0?Math.sin(n.hop*Math.PI)*.9:0);n.sp.position.set(n.x,1.2+hop,n.z);n.sh.position.set(n.x,.08,n.z);n.tag.position.set(n.x,2.9,n.z);if(n.bub)n.bub.position.set(n.x,4.4,n.z)}
      else{if(flyF[n.row]){n.sp.material=flyMat(n.row,Math.floor(n.ph)%4,n.tint)}n.sp.position.set(n.x,n.y+Math.sin(time*2+n.ph)*.15,n.z);n.tag.position.set(n.x,n.y+2.2,n.z);if(n.bub)n.bub.position.set(n.x,n.y+3.7,n.z)}
      const d=Math.hypot(n.x-camera.position.x,(n.y||0)-camera.position.y,n.z-camera.position.z);n.tag.visible=d<42}
  }
  const camP=new V3(0,8,30),camL=new V3(0,2,20);camera.position.copy(camP);
  function camUpdate(dt){
    const cx=Math.sin(yaw)*Math.cos(pitch)*camD,cy=Math.sin(pitch)*camD,cz=Math.cos(yaw)*Math.cos(pitch)*camD;
    const tgt=new V3(P.x+cx,Math.max(1.2,P.y+cy),P.z+cz);const k=1-Math.exp(-dt*7);camP.lerp(tgt,k);
    // keep the camera out of buildings
    for(const b of B){if(camP.y<b.h+1&&Math.abs(camP.x-b.x)<b.hw+.8&&Math.abs(camP.z-b.z)<b.hd+.8){const dx=camP.x-b.x,dz=camP.z-b.z;const ox=b.hw+.9-Math.abs(dx),oz=b.hd+.9-Math.abs(dz);if(ox<oz)camP.x+=Math.sign(dx||1)*ox;else camP.z+=Math.sign(dz||1)*oz}}
    camL.set(P.x,P.y+.8,P.z);camera.position.copy(camP);camera.lookAt(camL);
    const spd=Math.hypot(P.vx,P.vz),fv=baseFov+Math.min(10,spd*.3);if(Math.abs(camera.fov-fv)>.05){camera.fov=fv;camera.updateProjectionMatrix()}
  }
  const perf={a:0,n:0,t:performance.now()};
  function frame(now){
    raf=requestAnimationFrame(frame);const nt=now||performance.now(),dt=Math.min((nt-last)/1000,.05);last=nt;
    update(dt);place();camUpdate(dt);composer.render();
    perf.a+=(nt-perf.t)/1000;perf.t=nt;perf.n++;if(perf.a>2.5){const fps=perf.n/perf.a;perf.a=0;perf.n=0;if(fps<42&&pr>1){pr=Math.max(1,pr-.25);renderer.setPixelRatio(pr);composer.setPixelRatio(pr);resize()}else if(fps<26&&bloom.enabled){bloom.enabled=false;grade.enabled=false}}
  }

  /* ---------- public ---------- */
  api.show=()=>{root.classList.remove('tw-off');visible=true;resize();going=false;flashEl.style.opacity=0;menu.classList.remove('on');
    P.x=spawnHome.x;P.z=spawnHome.z;P.y=spawnHome.y;P.vx=P.vy=P.vz=0;yaw=0;P.mode='walk';$('#twMode').textContent='MODE: WALK';if(soundOn)music.play().catch(()=>{});last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);
    toast('WELCOME TO SUPER TOWN');log(null,'Welcome to Super Town. Fly around, say hi, and visit the Arcade, HQ, Dock and Exchange.','sys')};
  api.hide=()=>{visible=false;cancelAnimationFrame(raf);root.classList.add('tw-off');music.pause();keys.clear();inEl.blur()};
  api.debug=(w)=>{if(w==='aerial'){P.mode='fly';P.x=0;P.z=40;P.y=44;yaw=0;pitch=.62;camD=34}else if(w==='street'){P.mode='walk';P.x=14;P.z=2;P.y=1.6;yaw=-.5;pitch=.22;camD=11}};
  return api;
}

let inst=null;
export function open(cb){if(!inst)inst=create();inst.onExit=cb.onExit;inst.onPortal=cb.onPortal;inst.show()}
export function close(){if(inst)inst.hide()}
export function debug(w){if(inst)inst.debug(w)}